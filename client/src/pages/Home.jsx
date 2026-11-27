import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';
import { DoctorCard } from '../components/DoctorCard.jsx';

// Inline feature icons keep the landing page dependency-free.
const FEATURE_ICONS = [
  // Shield check - verified doctors
  <svg key="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
  // Clock - live availability
  <svg key="clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>,
  // Lock - security and privacy
  <svg key="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>,
  // Bell - automatic reminders
  <svg key="bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
];

export function Home() {
  const { t } = useI18n();
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

  const features = [1, 2, 3, 4].map((n) => ({
    icon: FEATURE_ICONS[n - 1],
    title: t(`feature${n}Title`),
    desc: t(`feature${n}Desc`)
  }));

  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <h1>{t('heroTitle')}</h1>
          <p>{t('heroSubtitle')}</p>
          <form className="hero-search" onSubmit={search}>
            <select
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              aria-label={t('specialty')}
            >
              <option value="">{t('heroAllSpecialties')}</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t('city')}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              aria-label={t('city')}
            />
            <button type="submit" className="btn btn-primary">
              {t('heroSearch')}
            </button>
          </form>
        </div>
      </section>

      <section className="container section">
        <h2>{t('browseBySpecialty')}</h2>
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
          <h2>{t('topRated')}</h2>
          <Link to="/doctors" className="link">
            {t('seeAll')}
          </Link>
        </div>
        <div className="card-grid">
          {topDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>{t('whyHakim')}</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p className="muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>{t('howItWorks')}</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>{t('step1Title')}</h3>
            <p className="muted">{t('step1Desc')}</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>{t('step2Title')}</h3>
            <p className="muted">{t('step2Desc')}</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>{t('step3Title')}</h3>
            <p className="muted">{t('step3Desc')}</p>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>{t('faqTitle')}</h2>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>{faq.q}</summary>
              <p className="muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
