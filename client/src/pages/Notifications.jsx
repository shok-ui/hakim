import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';
import { formatDateTime, minutesToLabel } from '../utils/format.js';

// Notification type -> translation key for the badge. The free-text title and
// body are stored server-side (data, not UI copy) and rendered as-is.
const TYPE_KEYS = {
  booking: 'typeBooking',
  confirmation: 'typeConfirmation',
  cancellation: 'typeCancellation',
  reminder: 'typeReminder',
  verification: 'typeVerification'
};

export function Notifications() {
  const { t, dateLocale } = useI18n();
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
        <h1>{t('notificationsTitle')}</h1>
        {data.unreadCount > 0 && (
          <button type="button" className="btn btn-ghost" onClick={markAll}>
            {t('markAllRead', { count: data.unreadCount })}
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">{t('loadingNotifications')}</p>
      ) : data.items.length === 0 ? (
        <p className="muted">{t('noNotifications')}</p>
      ) : (
        <div className="notification-list">
          {data.items.map((n) => (
            <div key={n._id} className={n.readAt ? 'notification' : 'notification unread'}>
              <div className="notification-main">
                <span className="badge badge-type">
                  {t(TYPE_KEYS[n.type] ?? n.type)}
                </span>
                <strong>{n.title}</strong>
                {n.body && <span className="muted">{n.body}</span>}
                {n.appointment?.date && (
                  <span className="muted">
                    {t('visitLine', {
                      date: n.appointment.date,
                      time: minutesToLabel(n.appointment.startMinute)
                    })}
                  </span>
                )}
              </div>
              <span className="muted notification-date">
                {formatDateTime(n.createdAt, dateLocale)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
