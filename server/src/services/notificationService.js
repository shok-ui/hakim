import { Notification } from '../models/Notification.js';

export async function notify({ userId, type, title, body = '', appointmentId = null }) {
  return Notification.create({
    user: userId,
    type,
    title,
    body,
    appointment: appointmentId
  });
}

export async function notifyMany(entries) {
  if (entries.length === 0) return [];
  return Notification.insertMany(entries);
}
