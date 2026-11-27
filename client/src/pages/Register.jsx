import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';

// Registration always creates patient accounts (POST /api/auth/register with
// { name, email, password }); doctor profiles are created by the platform
// team, so there is no role or specialty selector here.
export function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/doctors');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('registerTitle')}</h1>
        <p className="muted">{t('registerSubtitle')}</p>

        {error && <p className="form-error">{error}</p>}

        <label>
          {t('fullName')}
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder={t('namePlaceholder')}
          />
        </label>
        <label>
          {t('email')}
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder={t('emailPlaceholder')}
          />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            placeholder={t('passwordMinHint')}
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? t('creatingAccount') : t('registerButton')}
        </button>

        <p className="muted">
          {t('alreadyRegistered')} <Link to="/login">{t('navLogIn')}</Link>
        </p>
      </form>
    </div>
  );
}
