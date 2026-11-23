import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Specialty } from '../models/Specialty.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { validators, assert } from '../utils/validate.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'patient', phone = '', doctor = {} } = req.body ?? {};
  assert(validators.name(name), 'Name must be 2-80 characters');
  assert(validators.email(email), 'Please provide a valid email address');
  assert(
    validators.password(password),
    'Password must be at least 8 characters and contain letters and numbers'
  );
  assert(['patient', 'doctor'].includes(role), 'Role must be patient or doctor');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role,
    phone: String(phone).trim().slice(0, 40)
  });
  await user.setPassword(password);
  await user.save();

  // Doctor sign-ups also create their (unverified) public profile.
  if (role === 'doctor') {
    const specialty = await Specialty.findById(doctor.specialtyId);
    if (!specialty) throw ApiError.badRequest('Unknown specialty');
    await Doctor.create({
      user: user._id,
      specialty: specialty._id,
      city: String(doctor.city ?? '').trim() || 'Unknown',
      bio: String(doctor.bio ?? '').trim().slice(0, 1500),
      clinicAddress: String(doctor.clinicAddress ?? '').trim().slice(0, 300),
      experienceYears: Math.max(0, Number(doctor.experienceYears) || 0),
      consultationFee: Math.max(0, Number(doctor.consultationFee) || 0),
      verified: false
    });
  }

  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  assert(validators.email(email), 'Please provide a valid email address');
  assert(typeof password === 'string' && password.length > 0, 'Password is required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.checkPassword(password))) {
    throw ApiError.unauthorized('Wrong email or password');
  }

  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
