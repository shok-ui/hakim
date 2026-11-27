import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';
import { formatAppointmentWhen } from '../utils/format.js';
import { SlotPicker } from '../components/SlotPicker.jsx';

// Status -> translation key + badge class for the live appointment statuses.
const STATUS_KEYS = {
  booked: 'statusBooked',
  completed: 'statusCompleted',
  cancelled_by_patient: 'statusCancelled',
  cancelled_by_clinic: 'statusCancelled',
  no_show: 'statusNoShow'
};

const STATUS_CLASSES = {
  booked: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled_by_patient: 'badge-cancelled',
  cancelled_by_clinic: 'badge-cancelled',
  no_show: 'badge-cancelled'
};

export function MyAppointments() {
  const location = useLocation();
  const { t, dateLocale } = useI18n();
  const [scope, setScope] = useState('upcoming');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.booked ? t('flashBooked') : '');
  const [reschedulingId, setReschedulingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Live API: /appointments/mine?when=upcoming|past|all
      setData(await api('/appointments/mine', { query: { when: scope } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

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

  const startReschedule = (id) => {
    setError('');
    setFlash('');
    setReschedulingId((current) => (current === id ? null : id));
  };

  const reschedule = async (id, date, startMinute) => {
    setError('');
    try {
      await api(`/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: { date, startMinute }
      });
      setReschedulingId(null);
      setFlash(t('flashRescheduled'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <h1>{t('myAppointmentsTitle')}</h1>
      {flash && <p className="flash">{flash}</p>}

      <div className="tabs">
        <button
          type="button"
          className={scope === 'upcoming' ? 'tab active' : 'tab'}
          onClick={() => setScope('upcoming')}
        >
          {t('tabUpcoming')}
        </button>
        <button
          type="button"
          className={scope === 'past' ? 'tab active' : 'tab'}
          onClick={() => setScope('past')}
        >
          {t('tabHistory')}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">{t('loadingAppointments')}</p>
      ) : data.items.length === 0 ? (
        <p className="muted">
          {t('emptyAppointmentsBefore')} <Link to="/doctors">{t('emptyAppointmentsLink')}</Link>{' '}
          {t('emptyAppointmentsAfter')}
        </p>
      ) : (
        <div className="appointment-list">
          {data.items.map((apt) => {
            const label = t(STATUS_KEYS[apt.status] ?? 'statusBooked');
            const cls = STATUS_CLASSES[apt.status] ?? 'badge-pending';
            return (
              <div key={apt._id} className="appointment-row">
                <div className="appointment-main">
                  <strong>
                    {apt.doctor?.name ?? 'Doctor'}
                    {apt.doctor?.specialty ? ` - ${apt.doctor.specialty}` : ''}
                  </strong>
                  <span className="muted">{formatAppointmentWhen(apt, dateLocale)}</span>
                  {apt.doctor?.clinicAddress && (
                    <span className="muted">{apt.doctor.clinicAddress}</span>
                  )}
                  {apt.reason && (
                    <span className="muted">{t('reasonLabel', { reason: apt.reason })}</span>
                  )}
                </div>
                <div className="appointment-actions">
                  <span className={`badge ${cls}`}>{label}</span>
                  {apt.status === 'booked' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => startReschedule(apt._id)}
                      >
                        {reschedulingId === apt._id ? t('actionClose') : t('actionReschedule')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => cancel(apt._id)}
                      >
                        {t('actionCancel')}
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <Link className="btn btn-ghost" to={`/doctors/${apt.doctor?._id}`}>
                      {t('actionLeaveReview')}
                    </Link>
                  )}
                </div>
                {reschedulingId === apt._id && (
                  <div className="reschedule-panel">
                    <p className="muted">
                      {t('rescheduleHint', { name: apt.doctor?.name ?? 'Doctor' })}
                    </p>
                    <SlotPicker
                      doctorId={apt.doctor?._id}
                      onBook={(date, startMinute) => reschedule(apt._id, date, startMinute)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
