import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  ['patient@hakim.health', 'Patient@123', 'Patient'],
  ['sarah.mitchell@hakim.health', 'Doctor@123', 'Doctor'],
  ['admin@hakim.health', 'Admin@12345', 'Admin']
];

export function Login() {
  const { login } = useAuth();
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
        <h1>Welcome back</h1>
        <p className="muted">Log in to manage your appointments and notifications.</p>

        {error && <p className="form-error">{error}</p>}

        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>

        <p className="muted">
          No account yet? <Link to="/register">Sign up</Link>
        </p>

        <div className="demo-box">
          <h3>Demo accounts</h3>
          {DEMO_ACCOUNTS.map(([email, password, role]) => (
            <button
              key={email}
              type="button"
              className="demo-row"
              onClick={() => fillDemo(email, password)}
            >
              <span>{role}</span>
              <span className="muted">{email}</span>
            </button>
          ))}
          <p className="muted">Click a row to fill the form.</p>
        </div>
      </form>
    </div>
  );
}
