import Notification from '../models/notification.js';
import { logger } from '../config/logger.js';

// Notifications are a side effect of the main flows (booking, cancellation,
// verification). A failure here must never roll back or fail the primary
// operation, so every error is only logged.

export async function notify({ userId, type, title, body = '', appointmentId = null }) {
  if (!userId) return null;
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      body,
      appointment: appointmentId
    });
  } catch (error) {
    logger.warn({ err: error.message, userId, type }, 'notification could not be created');
    return null;
  }
}
