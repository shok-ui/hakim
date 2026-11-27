import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';
import { formatDate } from '../utils/format.js';

// Admin view over the live endpoints:
// GET /api/admin/stats -> { patients, doctors (verified), pendingDoctors, appointments }
// GET /api/admin/doctors/pending -> { items: [{ _id, name, specialty, city,
//   fee, createdAt, user: { email } }] }
export function AdminPanel() {
  const { t, dateLocale } = useI18n();
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
      setFlash(t('flashDoctorVerified'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container section">
      <h1>{t('adminTitle')}</h1>

      {flash && <p className="flash">{flash}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">{t('loadingAdmin')}</p>
      ) : (
        <>
          {stats && (
            <div className="stat-row">
              <div className="stat">
                <span className="stat-num">{stats.patients}</span>
                <span className="muted">{t('statPatients')}</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.doctors}</span>
                <span className="muted">{t('statVerifiedDoctors')}</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.pendingDoctors}</span>
                <span className="muted">{t('statPendingVerification')}</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.appointments}</span>
                <span className="muted">{t('statAppointments')}</span>
              </div>
            </div>
          )}

          <h2>{t('verificationQueue')}</h2>
          {pending.length === 0 ? (
            <p className="muted">{t('noPendingDoctors')}</p>
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
                    <span className="muted">{t('feePerVisit', { fee: doctor.fee })}</span>
                    <span className="muted">
                      {t('submittedOn', { date: formatDate(doctor.createdAt, dateLocale) })}
                    </span>
                  </div>
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => verify(doctor._id)}
                    >
                      {t('actionVerify')}
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
