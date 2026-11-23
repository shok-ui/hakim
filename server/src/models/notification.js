import mongoose from 'mongoose';

// In-app notifications. They are fire-and-forget by design: the platform
// never lets a notification failure break a booking, a verification or any
// other primary flow (see src/services/notification.js).

const NOTIFICATION_TYPES = ['booking', 'confirmation', 'cancellation', 'verification', 'reminder', 'reschedule'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    body: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// List views sort by recency per user; the second index powers unread counts.
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

export default mongoose.model('Notification', notificationSchema);
