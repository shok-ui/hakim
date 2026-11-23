import mongoose from 'mongoose';

export const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
  'Psychiatry',
  'General Medicine',
  'Ophthalmology',
  'ENT',
  'Gynecology',
  'Dentistry',
  'Endocrinology'
];

// A doctor entry powers the public directory. The weekly schedule is the
// single source of truth for slot generation: work days plus a minute-based
// start/end window divided into fixed-length slots.
const scheduleSchema = new mongoose.Schema(
  {
    // 0 = Sunday ... 6 = Saturday, matching Date.prototype.getUTCDay()
    workDays: {
      type: [Number],
      required: true,
      validate: {
        validator: (days) => days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'workDays must contain week days between 0 (Sunday) and 6 (Saturday)'
      }
    },
    startMinute: {
      type: Number,
      required: true,
      min: [0, 'startMinute must be at least 0'],
      max: [1439, 'startMinute must be at most 1439']
    },
    endMinute: {
      type: Number,
      required: true,
      min: 1,
      max: 1440
    },
    slotMinutes: {
      type: Number,
      required: true,
      min: 10,
      max: 120
    }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    specialty: {
      type: String,
      required: true,
      enum: SPECIALTIES,
      index: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: ''
    },
    education: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 70
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
      max: 100_000
    },
    clinicAddress: {
      type: String,
      trim: true,
      maxlength: 240,
      default: ''
    },
    schedule: {
      type: scheduleSchema,
      required: true
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Admin moderation flag. Unverified profiles stay out of the admin stats
    // for "verified doctors" until an admin approves them from the panel.
    verified: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1, city: 1 });
doctorSchema.index({ ratingAvg: -1 });

const doctorModel = mongoose.model('Doctor', doctorSchema);
doctorModel.SPECIALTIES = SPECIALTIES;
export default doctorModel;
