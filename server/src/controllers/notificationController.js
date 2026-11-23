import mongoose from 'mongoose';
import Notification from '../models/notification.js';
import { asyncHandler, ApiError } from '../utils/errors.js';

// Pagination bounds keep list queries predictable. The unread flag, when
// "true", restricts the list to notifications without a readAt timestamp.
function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit };
}

// GET /api/notifications?unread=true&page=&limit=
export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const unreadOnly = req.query.unread === 'true';

  const filter = { user: req.user.id };
  if (unreadOnly) filter.readAt = null;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('appointment', 'date startMinute status')
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, readAt: null })
  ]);

  res.json({ total, unreadCount, page, limit, items });
});

// GET /api/notifications/unread-count - polled by the navbar badge.
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user.id, readAt: null });
  res.json({ count });
});

// PATCH /api/notifications/:id/read - pass the literal id "all" to mark every
// unread notification of the caller as read in one update.
export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === 'all') {
    await Notification.updateMany(
      { user: req.user.id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.json({ ok: true });
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Notification not found');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user.id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json({ notification });
});
