import { Router } from 'express';
import { listPendingDoctors, verifyDoctor, platformStats } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole('admin'));

adminRoutes.get('/doctors/pending', listPendingDoctors);
adminRoutes.patch('/doctors/:id/verify', verifyDoctor);
adminRoutes.get('/stats', platformStats);
