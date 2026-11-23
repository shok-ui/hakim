import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheDeletePattern } from '../services/cacheService.js';
import { notify } from '../services/notificationService.js';

// GET /api/admin/doctors/pending
export const listPendingDoctors = asyncHandler(async (_req, res) => {
  const items = await Doctor.find({ verified: false })
    .populate([
      { path: 'user', select: 'name email createdAt' },
      { path: 'specialty', select: 'name' }
    ])
    .lean();
  res.json({ items });
});

// PATCH /api/admin/doctors/:id/verify  body: { verified: boolean }
export const verifyDoctor = asyncHandler(async (req, res) => {
  const shouldVerify = req.body?.verified !== false;

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verified: shouldVerify },
    { new: true }
  ).populate('user', 'name email');
  if (!doctor) throw ApiError.notFound('Doctor not found');

  await cacheDeletePattern('doctors:list:*');

  if (shouldVerify) {
    await notify({
      userId: doctor.user._id,
      type: 'verification',
      title: 'Profile approved',
      body: 'Your doctor profile is verified. Patients can now find and book you.'
    });
  }

  res.json({ doctor });
});

// GET /api/admin/stats
export const platformStats = asyncHandler(async (_req, res) => {
  const [patients, doctors, pendingDoctors, appointments] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ verified: true }),
    Doctor.countDocuments({ verified: false }),
    Appointment.countDocuments()
  ]);
  res.json({ patients, doctors, pendingDoctors, appointments });
});
