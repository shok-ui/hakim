import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    year: { type: Number }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
    bio: { type: String, trim: true, maxlength: 1500, default: '' },
    city: { type: String, trim: true, required: true },
    clinicAddress: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    consultationFee: { type: Number, min: 0, default: 0 },
    education: { type: [educationSchema], default: [] },
    // Admins verify doctor profiles before they become visible to patients.
    verified: { type: Boolean, default: false },
    // Denormalized aggregates kept in sync by the review service.
    ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1, city: 1 });
doctorSchema.index({ ratingAverage: -1 });

export const Doctor = mongoose.model('Doctor', doctorSchema);
