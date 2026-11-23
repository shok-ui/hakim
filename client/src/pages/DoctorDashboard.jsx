import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatAppointmentWhen, formatDate } from '../utils/format.js';

// Doctor view over the live /api/appointments/doctor endpoint, which returns
// the doctor's queue with populated patient names. The queue is split here
// into active visits (booked) and everything else (completed, cancelled,
// no-show) instead of relying on server-side statuses that no longer exist.
export function DoctorDashboard() {
  const { user } = useAuth();
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
      setFlash('Appointment cancelled.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = (action) => async (id) => {
    setError('');
    try {
      await api(`/appointments/${id}/status`, { method: 'PATCH', body: { action } });
      setFlash(
        action === 'complete'
          ? 'Visit completed. The patient can now leave a review.'
          : 'Marked as no-show.'
      );
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
      <h1>Dashboard</h1>
      <p className="muted">Welcome, {user.name}. Manage your schedule below.</p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-num">{todayCount}</span>
          <span className="muted">visits today</span>
        </div>
        <div className="stat">
          <span className="stat-num">{booked.length}</span>
          <span className="muted">active bookings</span>
        </div>
        <div className="stat">
          <span className="stat-num">{past.length}</span>
          <span className="muted">closed visits</span>
        </div>
      </div>

      {flash && <p className="flash">{flash}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading schedule...</p>
      ) : (
        <>
          <h2>Active bookings</h2>
          {booked.length === 0 ? (
            <p className="muted">No active bookings right now.</p>
          ) : (
            <div className="appointment-list">
              {booked.map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatAppointmentWhen(apt)}</span>
                    {apt.reason && <span className="muted">Reason: {apt.reason}</span>}
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStatus('complete')(apt._id)}
                    >
                      Mark completed
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => cancel(apt._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2>Visit history</h2>
          {past.length === 0 ? (
            <p className="muted">No past appointments yet.</p>
          ) : (
            <div className="appointment-list">
              {past.slice(0, 20).map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatAppointmentWhen(apt)}</span>
                  </div>
                  <div className="appointment-actions">
                    <span className="badge badge-pending">{apt.status.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="muted">Today is {formatDate(todayStr)} (UTC). Times are shown in UTC.</p>
        </>
      )}
    </div>
  );
}
