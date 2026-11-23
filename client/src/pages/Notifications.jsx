import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';

const TYPE_LABELS = {
  booking: 'New booking',
  confirmation: 'Confirmation',
  cancellation: 'Cancellation',
  reminder: 'Reminder',
  verification: 'Verification'
};

export function Notifications() {
  const [data, setData] = useState({ items: [], unreadCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api('/notifications', { query: { limit: 50 } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAll = async () => {
    try {
      await api('/notifications/all/read', { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <div className="section-head">
        <h1>Notifications</h1>
        {data.unreadCount > 0 && (
          <button type="button" className="btn btn-ghost" onClick={markAll}>
            Mark all as read ({data.unreadCount})
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading notifications...</p>
      ) : data.items.length === 0 ? (
        <p className="muted">No notifications yet. They appear when something happens to your appointments.</p>
      ) : (
        <div className="notification-list">
          {data.items.map((n) => (
            <div key={n._id} className={n.readAt ? 'notification' : 'notification unread'}>
              <div className="notification-main">
                <span className="badge badge-type">{TYPE_LABELS[n.type] ?? n.type}</span>
                <strong>{n.title}</strong>
                {n.body && <span className="muted">{n.body}</span>}
                {n.appointment?.startAt && (
                  <span className="muted">Visit: {formatDateTime(n.appointment.startAt)}</span>
                )}
              </div>
              <span className="muted notification-date">{formatDateTime(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
