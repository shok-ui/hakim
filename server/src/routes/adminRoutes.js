import { Router } from 'express';
import { z } from 'zod';
import { platformStats, listPendingDoctors, verifyDoctor } from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Everything under /api/admin requires an authenticated admin account.
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats - platform counters for the admin panel.
router.get('/stats', platformStats);

// GET /api/admin/doctors/pending - verification queue.
router.get('/doctors/pending', listPendingDoctors);

// PATCH /api/admin/doctors/:id/verify - approve (or revoke) a doctor profile.
router.patch(
  '/doctors/:id/verify',
  validate({ body: z.object({ verified: z.boolean() }) }),
  verifyDoctor
);

export default router;
