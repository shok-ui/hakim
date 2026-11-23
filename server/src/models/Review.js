import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 600, default: '' }
  },
  { timestamps: true }
);

// One review per patient per doctor; a new submission updates the old one.
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });
reviewSchema.index({ doctor: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
