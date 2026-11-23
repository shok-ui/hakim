import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    // true while the slot is held (pending or confirmed). Used by the partial
    // unique index to guarantee one active booking per doctor slot.
    active: { type: Boolean, default: true },
    reminderSent: { type: Boolean, default: false },
    reason: { type: String, trim: true, maxlength: 300, default: '' }
  },
  { timestamps: true }
);

// A doctor cannot hold two active appointments in the same slot.
appointmentSchema.index(
  { doctor: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
appointmentSchema.index({ patient: 1, startAt: -1 });
appointmentSchema.index({ doctor: 1, startAt: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
