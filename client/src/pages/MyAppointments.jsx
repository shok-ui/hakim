import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatAppointmentWhen } from '../utils/format.js';

// Status labels for the live appointment statuses.
const STATUS_LABELS = {
  booked: ['Booked', 'badge-confirmed'],
  completed: ['Completed', 'badge-completed'],
  cancelled_by_patient: ['Cancelled', 'badge-cancelled'],
  cancelled_by_clinic: ['Cancelled', 'badge-cancelled'],
  no_show: ['No show', 'badge-cancelled']
};

export function MyAppointments() {
  const location = useLocation();
  const [scope, setScope] = useState('upcoming');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.booked ? 'Appointment booked.' : '');

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
          className={scope === 'past' ? 'tab active' : 'tab'}
          onClick={() => setScope('past')}
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
                    {apt.doctor?.name ?? 'Doctor'}
                    {apt.doctor?.specialty ? ` - ${apt.doctor.specialty}` : ''}
                  </strong>
                  <span className="muted">{formatAppointmentWhen(apt)}</span>
                  {apt.doctor?.clinicAddress && (
                    <span className="muted">{apt.doctor.clinicAddress}</span>
                  )}
                  {apt.reason && <span className="muted">Reason: {apt.reason}</span>}
                </div>
                <div className="appointment-actions">
                  <span className={`badge ${cls}`}>{label}</span>
                  {apt.status === 'booked' && (
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
