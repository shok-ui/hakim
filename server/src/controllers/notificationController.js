import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/notifications?unread=true&page=&limit=
export const listNotifications = asyncHandler(async (req, res) => {
  const { unread = '', page = 1, limit = 20 } = req.query;
  const pageInt = Math.max(1, parseInt(page, 10) || 1);
  const limitInt = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const filter = { user: req.user._id };
  if (unread === 'true') filter.readAt = null;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .populate({ path: 'appointment', select: 'startAt status' })
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, readAt: null })
  ]);

  res.json({ total, unreadCount, page: pageInt, limit: limitInt, items });
});

// GET /api/notifications/unread-count - polled by the client badge.
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, readAt: null });
  res.json({ count });
});

// PATCH /api/notifications/:id/read - pass "all" as the id to mark everything.
export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === 'all') {
    await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.json({ ok: true });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');

  res.json({ notification });
});
