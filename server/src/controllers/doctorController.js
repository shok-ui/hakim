import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { Specialty } from '../models/Specialty.js';
import { Appointment } from '../models/Appointment.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withCache, cacheDeletePattern } from '../services/cacheService.js';
import { generateCandidateSlots } from '../services/slotService.js';

const doctorView = [
  { path: 'user', select: 'name' },
  { path: 'specialty', select: 'name slug' }
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/doctors?specialty=&city=&search=&minRating=&maxFee=&sort=&page=&limit=
// Public directory of verified doctors. Results are cached in Redis for 60s
// and invalidated whenever a doctor profile or review changes.
export const listDoctors = asyncHandler(async (req, res) => {
  const {
    specialty,
    city,
    search,
    minRating,
    maxFee,
    sort = 'rating',
    page = 1,
    limit = 12
  } = req.query;

  const filtersHash = Buffer.from(
    JSON.stringify({ specialty, city, search, minRating, maxFee, sort, page, limit })
  ).toString('base64url');

  const payload = await withCache(`doctors:list:${filtersHash}`, 60, async () => {
    const filter = { verified: true };
    if (specialty) filter.specialty = specialty;
    if (city) filter.city = new RegExp(escapeRegExp(city), 'i');
    if (minRating) filter.ratingAverage = { $gte: Number(minRating) || 0 };
    if (maxFee) filter.consultationFee = { $lte: Number(maxFee) || 0 };
    if (search) {
      const users = await mongoose
        .model('User')
        .find({ name: new RegExp(escapeRegExp(search), 'i') })
        .select('_id')
        .lean();
      filter.user = { $in: users.map((u) => u._id) };
    }

    const sortOptions =
      {
        rating: { ratingAverage: -1, ratingCount: -1 },
        feeAsc: { consultationFee: 1 },
        feeDesc: { consultationFee: -1 },
        experience: { experienceYears: -1 }
      }[sort] ?? { ratingAverage: -1, ratingCount: -1 };

    const pageInt = Math.max(1, parseInt(page, 10) || 1);
    const limitInt = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

    const [items, total] = await Promise.all([
      Doctor.find(filter)
        .populate(doctorView)
        .sort(sortOptions)
        .skip((pageInt - 1) * limitInt)
        .limit(limitInt)
        .lean(),
      Doctor.countDocuments(filter)
    ]);

    return { total, page: pageInt, limit: limitInt, items };
  });

  res.json(payload);
});

// GET /api/doctors/specialties
export const listSpecialties = asyncHandler(async (_req, res) => {
  const items = await withCache('specialties:all', 300, async () =>
    Specialty.find().sort({ name: 1 }).lean()
  );
  res.json({ items });
});

// GET /api/doctors/:id - public profile with the latest reviews.
export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate(doctorView);
  if (!doctor || !doctor.verified) throw ApiError.notFound('Doctor not found');

  const reviews = await Review.find({ doctor: doctor._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate({ path: 'patient', select: 'name' })
    .lean();

  res.json({ doctor, reviews });
});

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
// Live availability for one day, cached for 120s and invalidated on every
// booking or cancellation.
export const getSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) {
    throw ApiError.badRequest('date must be in YYYY-MM-DD format');
  }

  const doctor = await Doctor.findById(req.params.id).select('_id verified').lean();
  if (!doctor || !doctor.verified) throw ApiError.notFound('Doctor not found');

  const slots = await withCache(`avail:${doctor._id}:${date}`, 120, async () => {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const booked = await Appointment.find({
      doctor: doctor._id,
      active: true,
      startAt: { $gte: dayStart, $lt: dayEnd }
    })
      .select('startAt')
      .lean();
    const bookedSet = new Set(booked.map((b) => b.startAt.toISOString()));

    return generateCandidateSlots(dayStart).map((slot) => ({
      startAt: slot.toISOString(),
      taken: bookedSet.has(slot.toISOString())
    }));
  });

  res.json({ date, slots });
});

// PUT /api/doctors/me - doctor updates their own public profile.
export const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');

  const allowed = ['bio', 'city', 'clinicAddress', 'experienceYears', 'consultationFee'];
  for (const field of allowed) {
    if (req.body?.[field] !== undefined) doctor[field] = req.body[field];
  }
  await doctor.save();
  await cacheDeletePattern('doctors:list:*');

  res.json({ doctor });
});

// GET /api/doctors/me/appointments is handled by the appointments controller;
// doctors simply pass ?scope=upcoming|history to their own endpoint.
