import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const authRoutes = Router();

// Brute-force protection: strict limits on credential endpoints.
authRoutes.post(
  '/login',
  rateLimit({ key: 'login', limit: 10, windowSeconds: 900, message: 'Too many login attempts, try again later' }),
  login
);
authRoutes.post(
  '/register',
  rateLimit({ key: 'register', limit: 5, windowSeconds: 900, message: 'Too many sign-up attempts, try again later' }),
  register
);
authRoutes.get('/me', requireAuth, me);
