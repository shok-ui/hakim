import { Router } from 'express';
import { z } from 'zod';
import Doctor from '../models/doctor.js';
import Appointment from '../models/appointment.js';
import { acquireLock } from '../services/cache.js';
import { isPastDate, isValidDateStr, todayStrUtc } from '../utils/dates.js';
import { isSlotInSchedule } from '../services/slots.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logger } from '../config/logger.js';

const router = Router();

const bookSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  date: z.string().min(1, 'date is required'),
  startMinute: z.coerce.number().int().min(0).max(1439),
  reason: z.string().trim().max(500).optional()
});

const whenSchema = z.object({
  when: z.enum(['upcoming', 'past', 'all']).default('all')
});

const statusSchema = z.object({
  action: z.enum(['complete', 'no-show'])
});

// POST /api/appointments - book one slot as a patient.
// Order of guards: schedule match -> Redis slot lock -> database check ->
// partial unique index. This layered approach keeps double bookings
// impossible even under concurrent requests.
router.post(
  '/',
  requireAuth,
  requireRole('patient'),
  validate({ body: bookSchema }),
  asyncHandler(async (req, res) => {
    const { doctorId, date, startMinute, reason } = req.body;

    if (!isValidDateStr(date) || isPastDate(date)) {
      throw new ApiError(422, 'Appointment date must be today or later');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      throw new ApiError(404, 'Doctor not found');
    }

    if (!isSlotInSchedule(doctor.schedule, date, startMinute)) {
      throw new ApiError(422, 'The selected time is outside the doctor working hours');
    }

    const lockKey = `lock:slot:${doctorId}:${date}:${startMinute}`;
    const lock = await acquireLock(lockKey, 10);
    if (lock === null) {
      throw new ApiError(409, 'This slot was just taken. Please pick another time.');
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date,
      startMinute,
      status: 'booked'
    }).lean();
    if (existing) {
      throw new ApiError(409, 'This slot is already booked. Please pick another time.');
    }

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: req.user.id,
      date,
      startMinute,
      endMinute: startMinute + doctor.schedule.slotMinutes,
      status: 'booked',
      reason: reason ?? '',
      feeAtBooking: doctor.fee
    });

    await appointment.populate('doctor', 'name specialty city fee');

    logger.info({ appointmentId: appointment.id, doctorId, date, startMinute }, 'appointment booked');
    res.status(201).json({ appointment: appointment.toJSON() });
  })
);

// GET /api/appointments/mine - appointment history for the signed-in patient.
router.get(
  '/mine',
  requireAuth,
  requireRole('patient'),
  validate({ query: whenSchema }),
  asyncHandler(async (req, res) => {
    const { when } = req.validatedQuery;
    const today = todayStrUtc();

    const filter = { patient: req.user.id };
    if (when === 'upcoming') {
      filter.date = { $gte: today };
      filter.status = { $in: ['booked'] };
    } else if (when === 'past') {
      filter.$or = [
        { date: { $lt: today } },
        { date: today, status: { $in: ['completed', 'cancelled_by_patient', 'cancelled_by_clinic', 'no_show'] } }
      ];
    }

    const items = await Appointment.find(filter)
      .sort({ date: when === 'upcoming' ? 1 : -1, startMinute: when === 'upcoming' ? 1 : -1 })
      .limit(100)
      .populate('doctor', 'name specialty city fee clinicAddress')
      .lean();

    res.json({ items });
  })
);

// GET /api/appointments/doctor - queue of the signed-in doctor.
router.get(
  '/doctor',
  requireAuth,
  requireRole('doctor'),
  validate({
    query: z.object({
      date: z.string().optional(),
      status: z.enum(['booked', 'completed', 'cancelled_by_patient', 'cancelled_by_clinic', 'no_show']).optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const profile = await Doctor.findOne({ user: req.user.id }).lean();
    if (!profile) {
      throw new ApiError(404, 'No doctor profile is linked to this account');
    }

    const filter = { doctor: profile._id };
    if (req.validatedQuery.date) {
      if (!isValidDateStr(req.validatedQuery.date)) {
        throw new ApiError(422, 'date must be an ISO calendar date (YYYY-MM-DD)');
      }
      filter.date = req.validatedQuery.date;
    }
    if (req.validatedQuery.status) {
      filter.status = req.validatedQuery.status;
    }

    const items = await Appointment.find(filter)
      .sort({ date: 1, startMinute: 1 })
      .limit(200)
      .populate('patient', 'name')
      .lean();

    res.json({ items });
  })
);

async function loadOwnedAppointment(req) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }
  return appointment;
}

// PATCH /api/appointments/:id/cancel - patients cancel their own booking,
// doctors cancel bookings in their own queue.
router.patch(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadOwnedAppointment(req);

    if (req.user.role === 'patient') {
      if (String(appointment.patient) !== req.user.id) {
        throw new ApiError(403, 'You can only cancel your own appointments');
      }
      if (appointment.status !== 'booked') {
        throw new ApiError(409, 'Only active appointments can be cancelled');
      }
      appointment.status = 'cancelled_by_patient';
    } else if (req.user.role === 'doctor') {
      const profile = await Doctor.findOne({ user: req.user.id }).lean();
      if (!profile || String(appointment.doctor) !== String(profile._id)) {
        throw new ApiError(403, 'You can only manage appointments from your own queue');
      }
      if (appointment.status !== 'booked') {
        throw new ApiError(409, 'Only active appointments can be cancelled');
      }
      appointment.status = 'cancelled_by_clinic';
    } else {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    await appointment.save();
    res.json({ appointment: appointment.toJSON() });
  })
);

// PATCH /api/appointments/:id/status - doctors close a visit as completed
// or mark it as a no-show. Completing a visit also unlocks the review flow.
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('doctor'),
  validate({ body: statusSchema }),
  asyncHandler(async (req, res) => {
    const profile = await Doctor.findOne({ user: req.user.id }).lean();
    if (!profile) {
      throw new ApiError(404, 'No doctor profile is linked to this account');
    }

    const appointment = await loadOwnedAppointment(req);
    if (String(appointment.doctor) !== String(profile._id)) {
      throw new ApiError(403, 'You can only manage appointments from your own queue');
    }
    if (appointment.status !== 'booked') {
      throw new ApiError(409, 'Only active appointments can be updated');
    }

    appointment.status = req.validatedQuery.action === 'complete' ? 'completed' : 'no_show';
    await appointment.save();

    res.json({ appointment: appointment.toJSON() });
  })
);

export default router;
