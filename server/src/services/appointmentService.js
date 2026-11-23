import { redis } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { isBookableSlot, slotEnd } from './slotService.js';
import { notify, notifyMany } from './notificationService.js';
import { cacheDelete } from './cacheService.js';

const lockKey = (doctorId, startAt) =>
  `lock:apt:${doctorId}:${new Date(startAt).toISOString()}`;

async function invalidateAvailability(doctorId, day) {
  const iso = new Date(day).toISOString().slice(0, 10);
  await cacheDelete(`avail:${doctorId}:${iso}`);
}

// Books a slot for a patient. Concurrency safety: a short Redis lock turns
// racing requests into a clean 409, and a MongoDB partial unique index on
// active appointments is the final guarantee.
export async function bookAppointment({ doctorId, patientId, startAt, reason }) {
  const check = isBookableSlot(startAt);
  if (!check.ok) throw ApiError.badRequest(check.reason);

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  if (!doctor.verified) {
    throw ApiError.badRequest('This doctor is not accepting bookings yet');
  }

  const lock = lockKey(doctorId, startAt);
  const acquired = await redis.set(lock, String(patientId), 'EX', 15, 'NX');
  if (!acquired) {
    throw ApiError.conflict('That slot was just taken, please pick another one');
  }

  try {
    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patientId,
      startAt: new Date(startAt),
      endAt: slotEnd(startAt),
      reason: reason ?? ''
    });

    const when = new Date(startAt).toUTCString();
    await Promise.all([
      notify({
        userId: doctor.user,
        type: 'booking',
        title: 'New appointment request',
        body: `A patient requested ${when}. Confirm it from your dashboard.`,
        appointmentId: appointment._id
      }),
      notify({
        userId: patientId,
        type: 'booking',
        title: 'Appointment request sent',
        body: `Your request for ${when} was sent. You will be notified once the doctor confirms.`,
        appointmentId: appointment._id
      })
    ]);

    return appointment;
  } finally {
    await invalidateAvailability(doctorId, startAt);
    await redis.del(lock).catch(() => {});
  }
}

export async function confirmAppointment(appointment) {
  if (appointment.status !== 'pending') {
    throw ApiError.badRequest('Only pending appointments can be confirmed');
  }
  appointment.status = 'confirmed';
  await appointment.save();

  await notify({
    userId: appointment.patient,
    type: 'confirmation',
    title: 'Appointment confirmed',
    body: `Your appointment on ${appointment.startAt.toUTCString()} is confirmed.`,
    appointmentId: appointment._id
  });

  return appointment;
}

export async function completeAppointment(appointment) {
  if (appointment.status !== 'confirmed') {
    throw ApiError.badRequest('Only confirmed appointments can be marked as completed');
  }
  appointment.status = 'completed';
  appointment.active = false;
  await appointment.save();
  return appointment;
}

export async function cancelAppointment(appointment, actor) {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    throw ApiError.badRequest(`This appointment is already ${appointment.status}`);
  }
  appointment.status = 'cancelled';
  appointment.active = false;
  await appointment.save();

  const when = appointment.startAt.toUTCString();
  const entries = [
    {
      user: appointment.patient,
      type: 'cancellation',
      title: 'Appointment cancelled',
      body: `The appointment on ${when} was cancelled by the ${actor.role}.`,
      appointment: appointment._id
    }
  ];
  const doctor = await Doctor.findById(appointment.doctor).lean();
  if (doctor) {
    entries.push({
      user: doctor.user,
      type: 'cancellation',
      title: 'Appointment cancelled',
      body: `The appointment on ${when} was cancelled by the ${actor.role}.`,
      appointment: appointment._id
    });
  }
  await notifyMany(entries);

  await invalidateAvailability(appointment.doctor, appointment.startAt);
  return appointment;
}
