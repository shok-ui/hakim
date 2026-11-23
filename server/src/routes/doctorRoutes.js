import { Router } from 'express';
import {
  listDoctors,
  listSpecialties,
  getDoctor,
  getSlots,
  updateMyProfile
} from '../controllers/doctorController.js';
import { createReview } from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const doctorRoutes = Router();

// Public directory endpoints (static routes must come before /:id).
doctorRoutes.get('/', listDoctors);
doctorRoutes.get('/specialties', listSpecialties);

doctorRoutes.get('/:id', getDoctor);
doctorRoutes.get('/:id/slots', getSlots);

// Doctor self-service.
doctorRoutes.put('/me', requireAuth, requireRole('doctor'), updateMyProfile);

// Reviews: patients only, validated against completed appointments.
doctorRoutes.post('/:id/reviews', requireAuth, requireRole('patient'), createReview);
