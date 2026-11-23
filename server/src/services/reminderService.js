import { Appointment } from '../models/Appointment.js';
import { notifyMany } from './notificationService.js';
import { logger } from '../utils/logger.js';

// Creates a reminder notification once for each confirmed appointment that
// starts within the next 24 hours. Runs every minute from the API process.
export async function sendDueReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const due = await Appointment.find({
    status: 'confirmed',
    reminderSent: false,
    startAt: { $gte: now, $lte: horizon }
  })
    .limit(200)
    .lean();

  if (due.length === 0) return 0;

  await notifyMany(
    due.map((appointment) => ({
      user: appointment.patient,
      type: 'reminder',
      title: 'Upcoming appointment reminder',
      body: `Your appointment starts ${new Date(appointment.startAt).toUTCString()}.`,
      appointment: appointment._id
    }))
  );

  await Appointment.updateMany(
    { _id: { $in: due.map((a) => a._id) } },
    { $set: { reminderSent: true } }
  );

  return due.length;
}

export function startReminderScheduler() {
  const timer = setInterval(async () => {
    try {
      await sendDueReminders();
    } catch (err) {
      logger.warn({ err: err.message }, 'Reminder tick failed');
    }
  }, 60_000);
  timer.unref();
  return timer;
}
