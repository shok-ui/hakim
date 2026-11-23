import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Doctor from '../models/doctor.js';
import Review from '../models/review.js';
import Appointment from '../models/appointment.js';
import { bustPrefix } from '../services/cache.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const reviewSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().trim().max(1000).default('')
});

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

// Recomputes the denormalized rating summary stored on the doctor document.
async function refreshDoctorRating(doctorId) {
  const [agg] = await Review.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await Doctor.findByIdAndUpdate(doctorId, {
    ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.count : 0
  });

  await bustPrefix('doctors:');
}

// POST /api/reviews - write or update the caller's single review for a
// doctor. Allowed only after a completed appointment with that doctor.
router.post(
  '/',
  requireAuth,
  requireRole('patient'),
  validate({ body: reviewSchema }),
  asyncHandler(async (req, res) => {
    const { doctorId, rating, comment } = req.body;

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor || !doctor.isActive) {
      throw new ApiError(404, 'Doctor not found');
    }

    const hasCompletedVisit = await Appointment.exists({
      doctor: doctorId,
      patient: req.user.id,
      status: 'completed'
    });
    if (!hasCompletedVisit) {
      throw new ApiError(403, 'You can review a doctor after a completed appointment');
    }

    const review = await Review.findOneAndUpdate(
      { doctor: doctorId, patient: req.user.id },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    await refreshDoctorRating(doctorId);

    res.status(201).json({ review });
  })
);

// GET /api/reviews/doctor/:doctorId - public review list of a doctor.
router.get(
  '/doctor/:doctorId',
  validate({ query: pageSchema }),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { page, limit } = req.validatedQuery;

    if (!mongoose.isValidObjectId(doctorId)) {
      throw new ApiError(404, 'Doctor not found');
    }

    const [items, total] = await Promise.all([
      Review.find({ doctor: doctorId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('patient', 'name')
        .lean(),
      Review.countDocuments({ doctor: doctorId })
    ]);

    res.json({
      items: items.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        patientName: review.patient?.name ?? 'Anonymous patient',
        createdAt: review.createdAt
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// GET /api/reviews/mine - reviews written by the signed-in patient.
router.get(
  '/mine',
  requireAuth,
  requireRole('patient'),
  asyncHandler(async (req, res) => {
    const items = await Review.find({ patient: req.user.id })
      .sort({ createdAt: -1 })
      .populate('doctor', 'name specialty')
      .lean();

    res.json({ items });
  })
);

export default router;
