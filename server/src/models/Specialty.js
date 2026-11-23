import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

export const Specialty = mongoose.model('Specialty', specialtySchema);
