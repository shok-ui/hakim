import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validators, assert } from '../utils/validate.js';
import * as appointmentService from '../services/appointmentService.js';

// POST /api/appointments - patient books a slot.
export const bookAppointmentHandler = asyncHandler(async (req, res) => {
  const { doctorId, startAt, reason } = req.body ?? {};
  assert(validators.objectId(doctorId), 'doctorId is required');
  assert(typeof startAt === 'string' && startAt.length > 0, 'startAt is required');

  const appointment = await appointmentService.bookAppointment({
    doctorId,
    patientId: req.user._id,
    startAt,
    reason: String(reason ?? '').slice(0, 300)
  });

  res.status(201).json({ appointment });
});

// GET /api/appointments/mine?scope=upcoming|history&page=&limit=
// Patients see their own bookings; doctors see bookings made to them.
export const listMyAppointments = asyncHandler(async (req, res) => {
  const { scope = 'upcoming', page = 1, limit = 10 } = req.query;
  const pageInt = Math.max(1, parseInt(page, 10) || 1);
  const limitInt = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const now = new Date();

  let base;
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('_id');
    if (!doctor) throw ApiError.notFound('Doctor profile not found');
    base = { doctor: doctor._id };
  } else {
    base = { patient: req.user._id };
  }

  const filter =
    scope === 'history'
      ? {
          ...base,
          $or: [{ status: { $in: ['completed', 'cancelled'] } }, { startAt: { $lt: now } }]
        }
      : { ...base, status: { $in: ['pending', 'confirmed'] }, startAt: { $gte: now } };

  const populate = [
    {
      path: 'doctor',
      select: 'consultationFee specialty user',
      populate: [
        { path: 'user', select: 'name' },
        { path: 'specialty', select: 'name' }
      ]
    },
    { path: 'patient', select: 'name' }
  ];

  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ startAt: scope === 'history' ? -1 : 1 })
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .populate(populate)
      .lean(),
    Appointment.countDocuments(filter)
  ]);

  res.json({ total, page: pageInt, limit: limitInt, items });
});

// PATCH /api/appointments/:id/cancel - allowed for the patient, the doctor or
// an admin, but only while the appointment is still pending or confirmed.
export const cancelAppointmentHandler = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const isPatient = appointment.patient.toString() === req.user.id;
  let isDoctor = false;
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('_id');
    isDoctor = Boolean(doctor && appointment.doctor.toString() === doctor._id.toString());
  }
  const isAdmin = req.user.role === 'admin';
  if (!isPatient && !isDoctor && !isAdmin) {
    throw ApiError.forbidden('You cannot cancel this appointment');
  }

  res.json({ appointment: await appointmentService.cancelAppointment(appointment, req.user) });
});

// PATCH /api/appointments/:id/confirm - doctor confirms a pending request.
export const confirmAppointmentHandler = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const doctor = await Doctor.findOne({ user: req.user._id }).select('_id');
  if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
    throw ApiError.forbidden('This appointment does not belong to you');
  }

  res.json({ appointment: await appointmentService.confirmAppointment(appointment) });
});

// PATCH /api/appointments/:id/complete - doctor closes a finished visit; this
// also unlocks the "leave a review" flow for the patient.
export const completeAppointmentHandler = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const doctor = await Doctor.findOne({ user: req.user._id }).select('_id');
  if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
    throw ApiError.forbidden('This appointment does not belong to you');
  }

  res.json({ appointment: await appointmentService.completeAppointment(appointment) });
});
