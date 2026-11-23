import mongoose from 'mongoose';

// One review per patient per doctor. Review submission is gated by the
// appointment history: only patients with a completed appointment for that
// doctor are allowed to write one. Aggregated values are denormalized onto
// the Doctor document for fast directory sorting.

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'rating must be an integer between 1 and 5'
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    }
  },
  { timestamps: true }
);

reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
