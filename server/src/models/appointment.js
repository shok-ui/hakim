import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['booked', 'completed', 'cancelled_by_patient', 'cancelled_by_clinic', 'no_show'];

// Appointments are keyed by doctor + calendar date + start minute. A partial
// unique index keeps every active booking exclusive while allowing historical
// (completed or cancelled) records to repeat for the same slot.
const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // ISO calendar date in UTC, e.g. 2026-11-23
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO calendar date (YYYY-MM-DD)']
    },
    startMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 1439
    },
    endMinute: {
      type: Number,
      required: true,
      min: 1,
      max: 1440
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'booked',
      required: true,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    feeAtBooking: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctor: 1, date: 1, startMinute: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

appointmentSchema.virtual('startTimeLabel').get(function startTimeLabel() {
  const hours = Math.floor(this.startMinute / 60);
  const minutes = this.startMinute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Appointment', appointmentSchema);
