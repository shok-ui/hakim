import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/user.js';
import { env } from '../config/env.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72)
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required').max(72)
});

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

router.post(
  '/register',
  rateLimit({ windowSeconds: 300, max: 10, prefix: 'rl:register' }),
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'patient' });

    res.status(201).json({ token: signToken(user), user: user.toPublicJSON() });
  })
);

router.post(
  '/login',
  rateLimit({ windowSeconds: 300, max: 10, prefix: 'rl:login' }),
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    res.json({ token: signToken(user), user: user.toPublicJSON() });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(401, 'This account no longer exists');
    }
    res.json({ user: user.toPublicJSON() });
  })
);

export default router;
