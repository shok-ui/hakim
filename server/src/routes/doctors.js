import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Doctor, { SPECIALTIES } from '../models/doctor.js';
import Appointment from '../models/appointment.js';
import { cached } from '../services/cache.js';
import { slotsForDate } from '../services/slots.js';
import { isValidDateStr } from '../utils/dates.js';
import { matchSpecialties } from '../utils/symptoms.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const CARD_PROJECTION =
  'name specialty city bio fee experienceYears clinicAddress ratingAvg ratingCount schedule';

const listQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  specialty: z.enum(SPECIALTIES).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['rating', 'fee_asc', 'fee_desc', 'experience']).default('rating'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(8)
});

const SORT_OPTIONS = {
  rating: { ratingAvg: -1, ratingCount: -1 },
  fee_asc: { fee: 1 },
  fee_desc: { fee: -1 },
  experience: { experienceYears: -1 }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/doctors - searchable, filterable, cached directory.
router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, specialty, city, minRating, sort, page, limit } = req.validatedQuery;

    const filter = { isActive: true };
    if (specialty) filter.specialty = specialty;
    if (city) filter.city = city;
    if (minRating) filter.ratingAvg = { $gte: minRating };
    if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

    const cacheKey = `doctors:list:${JSON.stringify({ ...filter, sort, page, limit })}`;

    const result = await cached(cacheKey, 60, async () => {
      const [items, total] = await Promise.all([
        Doctor.find(filter)
          .sort(SORT_OPTIONS[sort])
          .skip((page - 1) * limit)
          .limit(limit)
          .select(CARD_PROJECTION)
          .lean(),
        Doctor.countDocuments(filter)
      ]);
      return { items, total };
    });

    res.json({
      items: result.items,
      total: result.total,
      page,
      pages: Math.max(1, Math.ceil(result.total / limit))
    });
  })
);

// GET /api/doctors/meta - filter options for the client dropdowns.
router.get(
  '/meta',
  asyncHandler(async (_req, res) => {
    const meta = await cached('doctors:meta', 300, async () => ({
      specialties: SPECIALTIES,
      cities: await Doctor.distinct('city')
    }));
    res.json(meta);
  })
);

// GET /api/doctors/recommend - symptom based doctor suggestion.
router.get(
  '/recommend',
  validate({ query: z.object({ symptom: z.string().trim().min(2).max(120) }) }),
  asyncHandler(async (req, res) => {
    const { symptom } = req.validatedQuery;
    const { matched, specialties } = matchSpecialties(symptom);

    const doctors = await Doctor.find({ isActive: true, specialty: { $in: specialties } })
      .sort({ ratingAvg: -1, ratingCount: -1 })
      .limit(6)
      .select(CARD_PROJECTION)
      .lean();

    res.json({ symptom, matched, specialties, doctors });
  })
);

// GET /api/doctors/:id/slots - bookable slots of one doctor for one date.
router.get(
  '/:id/slots',
  validate({ query: z.object({ date: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date } = req.validatedQuery;

    if (!isValidDateStr(date)) {
      throw new ApiError(422, 'date must be an ISO calendar date (YYYY-MM-DD)');
    }

    const doctor = await Doctor.findById(id).lean();
    if (!doctor || !doctor.isActive) {
      throw new ApiError(404, 'Doctor not found');
    }

    const booked = await Appointment.find({ doctor: id, date, status: 'booked' })
      .select('startMinute')
      .lean();

    res.json({
      date,
      schedule: doctor.schedule,
      slots: slotsForDate({
        schedule: doctor.schedule,
        dateStr: date,
        bookedStartMinutes: booked.map((a) => a.startMinute)
      })
    });
  })
);

// GET /api/doctors/:id - full public profile.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, 'Doctor not found');
    }

    const doctor = await cached(`doctors:detail:${id}`, 60, async () =>
      Doctor.findById(id).select(`${CARD_PROJECTION} education`).lean()
    );

    if (!doctor || !doctor.isActive) {
      throw new ApiError(404, 'Doctor not found');
    }

    res.json({ doctor });
  })
);

export default router;
