import mongoose from 'mongoose';
import Doctor from '../models/doctor.js';
import User from '../models/user.js';
import Appointment from '../models/appointment.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { bustPrefix } from '../services/cache.js';
import { notify } from '../services/notification.js';

// Admin-only platform overview. Counts are cheap MongoDB counters, so the
// endpoint stays uncached and always reflects the current state.

export const platformStats = asyncHandler(async (_req, res) => {
  const [patients, doctors, pendingDoctors, appointments] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ verified: true }),
    Doctor.countDocuments({ verified: false }),
    Appointment.countDocuments()
  ]);

  res.json({ patients, doctors, pendingDoctors, appointments });
});

// Verification queue: every doctor profile that still awaits admin approval.
// The client renders name, specialty, city, fee, the linked account email and
// the submission date, so all of them are included in each item.
export const listPendingDoctors = asyncHandler(async (_req, res) => {
  const items = await Doctor.find({ verified: false })
    .sort({ createdAt: 1 })
    .populate('user', 'name email')
    .lean();

  res.json({ items });
});

// Approve or revoke a doctor profile. Verifying also notifies the linked
// account so the doctor knows the profile went live. The doctors cache is
// busted because list/detail responses include verification state.
export const verifyDoctor = asyncHandler(async (req, res) => {
  const { verified } = req.body;

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Doctor not found');
  }

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { verified }, { new: true })
    .populate('user', 'name email')
    .lean();

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  await bustPrefix('doctors:');

  if (verified && doctor.user) {
    await notify({
      userId: doctor.user._id,
      type: 'verification',
      title: 'Profile approved',
      body: `${doctor.name} is verified. Patients can now find and book you.`,
      appointmentId: null
    });
  }

  res.json({ doctor });
});
