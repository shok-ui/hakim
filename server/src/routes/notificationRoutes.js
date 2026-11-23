import { Router } from 'express';
import {
  listNotifications,
  unreadCount,
  markRead
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Every notification endpoint belongs to the signed-in account: req.user.id
// is set by the auth middleware and is the only user filter ever used here.
router.use(requireAuth);

// GET /api/notifications - paginated list, optional ?unread=true.
router.get('/', listNotifications);

// GET /api/notifications/unread-count - badge counter.
// Declared before /:id/read so "unread-count" can never match the wildcard.
router.get('/unread-count', unreadCount);

// PATCH /api/notifications/:id/read - id may be the literal "all".
router.patch('/:id/read', markRead);

export default router;
