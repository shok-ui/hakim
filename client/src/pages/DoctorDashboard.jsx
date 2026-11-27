import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { formatAppointmentWhen, formatDate } from '../utils/format.js';

// Status -> translation key for badges in the visit history. Unknown raw
// statuses fall back to the stored value so nothing breaks server-side.
const STATUS_KEYS = {
  completed: 'statusCompleted',
  cancelled_by_patient: 'statusCancelled',
  cancelled_by_clinic: 'statusCancelled',
  no_show: 'statusNoShow'
};

// Doctor view over the live /api/appointments/doctor endpoint, which returns
// the doctor's queue with populated patient names. The queue is split here
// into active visits (booked) and everything else (completed, cancelled,
// no-show) instead of relying on server-side statuses that no longer exist.
export function DoctorDashboard() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/appointments/doctor');
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id) => {
    setError('');
    try {
      await api(`/appointments/${id}/cancel`, { method: 'PATCH' });
      setFlash(t('flashCancelled'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = (action) => async (id) => {
    setError('');
    try {
      await api(`/appointments/${id}/status`, { method: 'PATCH', body: { action } });
      setFlash(action === 'complete' ? t('flashVisitCompleted') : t('flashNoShow'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const booked = items.filter((a) => a.status === 'booked');
  const todayCount = booked.filter((a) => a.date === todayStr).length;
  const past = items.filter((a) => a.status !== 'booked');

  return (
    <div className="container section">
      <h1>{t('dashboardTitle')}</h1>
      <p className="muted">{t('dashboardWelcome', { name: user.name })}</p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-num">{todayCount}</span>
          <span className="muted">{t('visitsToday')}</span>
        </div>
        <div className="stat">
          <span className="stat-num">{booked.length}</span>
          <span className="muted">{t('activeBookings')}</span>
        </div>
        <div className="stat">
          <span className="stat-num">{past.length}</span>
          <span className="muted">{t('closedVisits')}</span>
        </div>
      </div>

      {flash && <p className="flash">{flash}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">{t('loadingSchedule')}</p>
      ) : (
        <>
          <h2>{t('activeBookingsTitle')}</h2>
          {booked.length === 0 ? (
            <p className="muted">{t('noActiveBookings')}</p>
          ) : (
            <div className="appointment-list">
              {booked.map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatAppointmentWhen(apt, dateLocale)}</span>
                    {apt.reason && (
                      <span className="muted">{t('reasonLabel', { reason: apt.reason })}</span>
                    )}
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStatus('complete')(apt._id)}
                    >
                      {t('markCompleted')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => cancel(apt._id)}
                    >
                      {t('actionCancel')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2>{t('visitHistoryTitle')}</h2>
          {past.length === 0 ? (
            <p className="muted">{t('noPastAppointments')}</p>
          ) : (
            <div className="appointment-list">
              {past.slice(0, 20).map((apt) => {
                const statusKey = STATUS_KEYS[apt.status];
                return (
                  <div key={apt._id} className="appointment-row">
                    <div className="appointment-main">
                      <strong>{apt.patient?.name ?? 'Patient'}</strong>
                      <span className="muted">{formatAppointmentWhen(apt, dateLocale)}</span>
                    </div>
                    <div className="appointment-actions">
                      <span className="badge badge-pending">
                        {statusKey ? t(statusKey) : apt.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="muted">{t('dashboardTodayIs', { date: formatDate(todayStr, dateLocale) })}</p>
        </>
      )}
    </div>
  );
}
