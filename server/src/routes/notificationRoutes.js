import { Router } from 'express';
import { listNotifications, unreadCount, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', listNotifications);
notificationRoutes.get('/unread-count', unreadCount);
notificationRoutes.patch('/:id/read', markRead);
