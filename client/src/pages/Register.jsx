import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Registration always creates patient accounts (POST /api/auth/register with
// { name, email, password }); doctor profiles are created by the platform
// team, so there is no role or specialty selector here.
export function Register() {
  const { register } = useAuth();
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
        <h1>Create your account</h1>
        <p className="muted">Join as a patient to book visits with verified doctors.</p>

        {error && <p className="form-error">{error}</p>}

        <label>
          Full name
          <input required value={form.name} onChange={set('name')} placeholder="Jane Smith" />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
