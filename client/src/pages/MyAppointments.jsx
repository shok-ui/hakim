import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatAppointmentWhen } from '../utils/format.js';
import { SlotPicker } from '../components/SlotPicker.jsx';

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
      setFlash('Appointment cancelled.');
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
      setFlash('Appointment rescheduled.');
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
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => startReschedule(apt._id)}
                      >
                        {reschedulingId === apt._id ? 'Close' : 'Reschedule'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => cancel(apt._id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <Link className="btn btn-ghost" to={`/doctors/${apt.doctor?._id}`}>
                      Leave a review
                    </Link>
                  )}
                </div>
                {reschedulingId === apt._id && (
                  <div className="reschedule-panel">
                    <p className="muted">
                      Pick a new day and time slot for this visit with {apt.doctor?.name ?? 'the doctor'}.
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
