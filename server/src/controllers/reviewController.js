import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheDeletePattern } from '../services/cacheService.js';

// POST /api/doctors/:id/reviews
// Only patients with a completed appointment at this doctor may review, and
// each patient keeps a single review per doctor (upserted on resubmission).
export const createReview = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Rating must be an integer from 1 to 5');
  }
  if (comment.length > 600) {
    throw ApiError.badRequest('Comment is too long (max 600 characters)');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.verified) throw ApiError.notFound('Doctor not found');

  const hadVisit = await Appointment.exists({
    doctor: doctor._id,
    patient: req.user._id,
    status: 'completed'
  });
  if (!hadVisit) {
    throw ApiError.forbidden('You can review a doctor after a completed appointment');
  }

  const review = await Review.findOneAndUpdate(
    { doctor: doctor._id, patient: req.user._id },
    { rating, comment },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Refresh the denormalized rating aggregates on the doctor document.
  const [agg] = await Review.aggregate([
    { $match: { doctor: doctor._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  doctor.ratingAverage = agg ? Math.round(agg.avg * 10) / 10 : 0;
  doctor.ratingCount = agg ? agg.count : 0;
  await doctor.save();
  await cacheDeletePattern('doctors:list:*');

  res.status(201).json({ review });
});
