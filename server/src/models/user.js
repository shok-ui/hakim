import mongoose from 'mongoose';

// Platform accounts. Patients book appointments, doctors manage their
// schedule and admins keep the directory clean. Passwords are stored as
// bcrypt hashes only and are excluded from queries by default.

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
      required: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
      default: ''
    }
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    createdAt: this.createdAt
  };
};

export default mongoose.model('User', userSchema);
