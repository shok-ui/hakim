import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';

// Demo accounts seeded by the API (all with password Hakim#12345).
// The third column is an i18n key, not display text.
const DEMO_ACCOUNTS = [
  ['patient@hakim.health', 'Hakim#12345', 'demoPatient'],
  ['sarah.kamali@hakim.health', 'Hakim#12345', 'demoDoctorCardiology'],
  ['david.osei@hakim.health', 'Hakim#12345', 'demoDoctorPediatrics'],
  ['leila.farhadi@hakim.health', 'Hakim#12345', 'demoDoctorDermatology'],
  ['admin@hakim.health', 'Hakim#12345', 'demoAdmin']
];

export function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('loginTitle')}</h1>
        <p className="muted">{t('loginSubtitle')}</p>

        {error && <p className="form-error">{error}</p>}

        <label>
          {t('email')}
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('emailPlaceholder')}
          />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t('passwordPlaceholder')}
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? t('loggingIn') : t('loginButton')}
        </button>

        <p className="muted">
          {t('noAccountYet')} <Link to="/register">{t('navSignUp')}</Link>
        </p>

        <div className="demo-box">
          <h3>{t('demoAccounts')}</h3>
          {DEMO_ACCOUNTS.map(([email, password, roleKey]) => (
            <button
              key={email}
              type="button"
              className="demo-row"
              onClick={() => fillDemo(email, password)}
            >
              <span>{t(roleKey)}</span>
              <span className="muted">{email}</span>
            </button>
          ))}
          <p className="muted">{t('demoHint')}</p>
        </div>
      </form>
    </div>
  );
}
