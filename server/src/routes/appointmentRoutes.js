import { Router } from 'express';
import {
  bookAppointmentHandler,
  listMyAppointments,
  cancelAppointmentHandler,
  confirmAppointmentHandler,
  completeAppointmentHandler
} from '../controllers/appointmentController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const appointmentRoutes = Router();

appointmentRoutes.use(requireAuth);

appointmentRoutes.post(
  '/',
  rateLimit({ key: 'book', limit: 20, windowSeconds: 600, message: 'Too many booking attempts, try again later' }),
  bookAppointmentHandler
);
appointmentRoutes.get('/mine', listMyAppointments);
appointmentRoutes.patch('/:id/cancel', cancelAppointmentHandler);
appointmentRoutes.patch('/:id/confirm', confirmAppointmentHandler);
appointmentRoutes.patch('/:id/complete', completeAppointmentHandler);
