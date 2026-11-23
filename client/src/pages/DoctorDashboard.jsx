import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime } from '../utils/format.js';

// Doctor view: today's and upcoming requests plus simple stats.
export function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], total: 0 });
  const [history, setHistory] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [upcoming, past] = await Promise.all([
        api('/appointments/mine', { query: { scope: 'upcoming', limit: 50 } }),
        api('/appointments/mine', { query: { scope: 'history', limit: 20 } })
      ]);
      setData(upcoming);
      setHistory(past);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = (action) => async (id) => {
    setError('');
    try {
      await api(`/appointments/${id}/${action}`, { method: 'PATCH' });
      setFlash(
        {
          confirm: 'Appointment confirmed. The patient has been notified.',
          cancel: 'Appointment cancelled.',
          complete: 'Visit completed. The patient can now leave a review.'
        }[action]
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pending = data.items.filter((a) => a.status === 'pending');
  const confirmed = data.items.filter((a) => a.status === 'confirmed');
  const today = new Date().toDateString();
  const todayCount = data.items.filter(
    (a) => new Date(a.startAt).toDateString() === today
  ).length;

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
          <span className="stat-num">{pending.length}</span>
          <span className="muted">pending requests</span>
        </div>
        <div className="stat">
          <span className="stat-num">{confirmed.length}</span>
          <span className="muted">confirmed upcoming</span>
        </div>
      </div>

      {flash && <p className="flash">{flash}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading schedule...</p>
      ) : (
        <>
          <h2>Pending requests</h2>
          {pending.length === 0 ? (
            <p className="muted">No pending requests right now.</p>
          ) : (
            <div className="appointment-list">
              {pending.map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatDateTime(apt.startAt)}</span>
                    {apt.reason && <span className="muted">Reason: {apt.reason}</span>}
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => act('confirm')(apt._id)}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => act('cancel')(apt._id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2>Confirmed upcoming</h2>
          {confirmed.length === 0 ? (
            <p className="muted">Nothing confirmed yet.</p>
          ) : (
            <div className="appointment-list">
              {confirmed.map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatDateTime(apt.startAt)}</span>
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => act('complete')(apt._id)}
                    >
                      Mark completed
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => act('cancel')(apt._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2>Recent history</h2>
          {history.items.length === 0 ? (
            <p className="muted">No past appointments yet.</p>
          ) : (
            <div className="appointment-list">
              {history.items.slice(0, 10).map((apt) => (
                <div key={apt._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{apt.patient?.name ?? 'Patient'}</strong>
                    <span className="muted">{formatDateTime(apt.startAt)}</span>
                  </div>
                  <div className="appointment-actions">
                    <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
