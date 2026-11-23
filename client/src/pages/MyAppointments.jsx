import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';

const STATUS_LABELS = {
  pending: ['Pending', 'badge-pending'],
  confirmed: ['Confirmed', 'badge-confirmed'],
  completed: ['Completed', 'badge-completed'],
  cancelled: ['Cancelled', 'badge-cancelled']
};

export function MyAppointments() {
  const location = useLocation();
  const [scope, setScope] = useState('upcoming');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.booked ? 'Appointment request sent.' : '');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api('/appointments/mine', { query: { scope, limit: 50 } }));
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
      setFlash('Appointment cancelled.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <h1>My appointments</h1>
      {flash && <p className="flash">{flash}</p>}

      <div className="tabs">
        <button
          type="button"
          className={scope === 'upcoming' ? 'tab active' : 'tab'}
          onClick={() => setScope('upcoming')}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={scope === 'history' ? 'tab active' : 'tab'}
          onClick={() => setScope('history')}
        >
          History
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading appointments...</p>
      ) : data.items.length === 0 ? (
        <p className="muted">
          Nothing here yet. <Link to="/doctors">Find a doctor</Link> and book your first visit.
        </p>
      ) : (
        <div className="appointment-list">
          {data.items.map((apt) => {
            const [label, cls] = STATUS_LABELS[apt.status] ?? [apt.status, 'badge-pending'];
            return (
              <div key={apt._id} className="appointment-row">
                <div className="appointment-main">
                  <strong>
                    {apt.doctor?.user?.name ?? 'Doctor'}
                    {apt.doctor?.specialty?.name ? ` - ${apt.doctor.specialty.name}` : ''}
                  </strong>
                  <span className="muted">{formatDateTime(apt.startAt)}</span>
                  {apt.reason && <span className="muted">Reason: {apt.reason}</span>}
                </div>
                <div className="appointment-actions">
                  <span className={`badge ${cls}`}>{label}</span>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => cancel(apt._id)}
                    >
                      Cancel
                    </button>
                  )}
                  {apt.status === 'completed' && (
                    <Link className="btn btn-ghost" to={`/doctors/${apt.doctor?._id}`}>
                      Leave a review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
