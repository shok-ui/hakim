import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { DoctorCard } from '../components/DoctorCard.jsx';

export function Home() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [form, setForm] = useState({ specialty: '', city: '' });

  useEffect(() => {
    (async () => {
      try {
        const [{ items }, { items: doctors }] = await Promise.all([
          api('/doctors/specialties'),
          api('/doctors', { query: { sort: 'rating', limit: 8 } })
        ]);
        setSpecialties(items);
        setTopDoctors(doctors);
      } catch {
        // The hero still renders without data.
      }
    })();
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate('/doctors', { state: { specialty: form.specialty, city: form.city } });
  };

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Find the right doctor and book a visit in minutes</h1>
          <p>
            Browse verified doctors by specialty, city and rating, see live availability and
            confirm your appointment without a single phone call.
          </p>
          <form className="hero-search" onSubmit={search}>
            <select
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              aria-label="Specialty"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              aria-label="City"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="container section">
        <h2>Browse by specialty</h2>
        <div className="chip-row">
          {specialties.map((s) => (
            <Link key={s} className="chip" to="/doctors" state={{ specialty: s }}>
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Top rated doctors</h2>
          <Link to="/doctors" className="link">
            See all
          </Link>
        </div>
        <div className="card-grid">
          {topDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Search</h3>
            <p className="muted">Filter verified doctors by specialty, city, rating and fee.</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Pick a time</h3>
            <p className="muted">Choose a free 30-minute slot from live availability.</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Get confirmed</h3>
            <p className="muted">The doctor confirms your request and you get a notification.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
