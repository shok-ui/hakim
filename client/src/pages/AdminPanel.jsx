import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate } from '../utils/format.js';

// Admin view over the live endpoints:
// GET /api/admin/stats -> { patients, doctors (verified), pendingDoctors, appointments }
// GET /api/admin/doctors/pending -> { items: [{ _id, name, specialty, city,
//   fee, createdAt, user: { email } }] }
export function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statResult, pendingResult] = await Promise.all([
        api('/admin/stats'),
        api('/admin/doctors/pending')
      ]);
      setStats(statResult);
      setPending(pendingResult.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (id) => {
    setError('');
    try {
      await api(`/admin/doctors/${id}/verify`, { method: 'PATCH', body: { verified: true } });
      setFlash('Doctor verified. The profile is now public.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <h1>Admin</h1>

      {flash && <p className="flash">{flash}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading admin data...</p>
      ) : (
        <>
          {stats && (
            <div className="stat-row">
              <div className="stat">
                <span className="stat-num">{stats.patients}</span>
                <span className="muted">patients</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.doctors}</span>
                <span className="muted">verified doctors</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.pendingDoctors}</span>
                <span className="muted">awaiting verification</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.appointments}</span>
                <span className="muted">appointments</span>
              </div>
            </div>
          )}

          <h2>Verification queue</h2>
          {pending.length === 0 ? (
            <p className="muted">No doctor profiles waiting for verification.</p>
          ) : (
            <div className="appointment-list">
              {pending.map((doctor) => (
                <div key={doctor._id} className="appointment-row">
                  <div className="appointment-main">
                    <strong>{doctor.name ?? 'Doctor'}</strong>
                    <span className="muted">{doctor.user?.email}</span>
                    <span className="muted">
                      {doctor.specialty} - {doctor.city}
                    </span>
                    <span className="muted">${doctor.fee} per visit</span>
                    <span className="muted">Submitted {formatDate(doctor.createdAt)}</span>
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => verify(doctor._id)}
                    >
                      Verify
                    </button>
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
