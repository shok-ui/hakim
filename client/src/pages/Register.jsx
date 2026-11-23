import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialtyId: '',
    city: '',
    consultationFee: '',
    experienceYears: '',
    bio: '',
    clinicAddress: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/doctors/specialties')
      .then(({ items }) => setSpecialties(items))
      .catch(() => {});
  }, []);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role
      };
      if (role === 'doctor') {
        payload.doctor = {
          specialtyId: form.specialtyId,
          city: form.city,
          consultationFee: form.consultationFee,
          experienceYears: form.experienceYears,
          bio: form.bio,
          clinicAddress: form.clinicAddress
        };
      }
      await register(payload);
      navigate(role === 'doctor' ? '/dashboard' : '/doctors');
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
        <p className="muted">Join as a patient to book visits, or as a doctor to offer yours.</p>

        <div className="role-toggle">
          <button
            type="button"
            className={role === 'patient' ? 'role-btn active' : 'role-btn'}
            onClick={() => setRole('patient')}
          >
            I am a patient
          </button>
          <button
            type="button"
            className={role === 'doctor' ? 'role-btn active' : 'role-btn'}
            onClick={() => setRole('doctor')}
          >
            I am a doctor
          </button>
        </div>

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
            placeholder="At least 8 characters, letters and numbers"
          />
        </label>
        <label>
          Phone (optional)
          <input value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
        </label>

        {role === 'doctor' && (
          <div className="doctor-fields">
            <label>
              Specialty
              <select required value={form.specialtyId} onChange={set('specialtyId')}>
                <option value="">Select a specialty</option>
                {specialties.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              City
              <input required value={form.city} onChange={set('city')} placeholder="Boston" />
            </label>
            <label>
              Consultation fee ($)
              <input
                type="number"
                min="0"
                value={form.consultationFee}
                onChange={set('consultationFee')}
                placeholder="100"
              />
            </label>
            <label>
              Years of experience
              <input
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={set('experienceYears')}
                placeholder="8"
              />
            </label>
            <label>
              Clinic address (optional)
              <input
                value={form.clinicAddress}
                onChange={set('clinicAddress')}
                placeholder="100 Main Street, Suite 2"
              />
            </label>
            <label>
              Short bio
              <textarea
                maxLength={1500}
                value={form.bio}
                onChange={set('bio')}
                placeholder="Tell patients about your focus and approach"
              />
            </label>
            <p className="muted">
              New doctor profiles are reviewed by the platform team before appearing in search.
            </p>
          </div>
        )}

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
