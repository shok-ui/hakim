import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';
import { DoctorCard } from '../components/DoctorCard.jsx';

// Doctor directory with filters, sorting and pagination. Initial filter values
// can arrive from the home page search form. The live list API supports
// q (name search), specialty, city, minRating, sort and page/limit.
export function Doctors() {
  const location = useLocation();
  const { t } = useI18n();
  const initial = location.state ?? {};

  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({
    specialty: initial.specialty ?? '',
    city: '',
    q: '',
    minRating: '',
    sort: 'rating'
  });
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/doctors/specialties')
      .then(({ items }) => setSpecialties(items))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const result = await api('/doctors', {
          query: {
            specialty: filters.specialty,
            city: filters.city,
            q: filters.q,
            minRating: filters.minRating,
            sort: filters.sort,
            page,
            limit: 12
          }
        });
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const set = (field) => (event) =>
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));

  const totalPages = data.pages ?? Math.max(1, Math.ceil(data.total / 12));

  return (
    <div className="container section">
      <h1>{t('doctorsTitle')}</h1>

      <div className="filter-bar">
        <select value={filters.specialty} onChange={set('specialty')} aria-label={t('specialty')}>
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
          value={filters.city}
          onChange={set('city')}
          aria-label={t('city')}
        />
        <input
          type="text"
          placeholder={t('doctorName')}
          value={filters.q}
          onChange={set('q')}
          aria-label={t('doctorName')}
        />
        <select value={filters.minRating} onChange={set('minRating')} aria-label={t('minRating')}>
          <option value="">{t('anyRating')}</option>
          <option value="4">{t('rating4Up')}</option>
          <option value="3">{t('rating3Up')}</option>
        </select>
        <select value={filters.sort} onChange={set('sort')} aria-label={t('sortBy')}>
          <option value="rating">{t('sortTopRated')}</option>
          <option value="experience">{t('sortExperience')}</option>
          <option value="fee_asc">{t('sortFeeAsc')}</option>
          <option value="fee_desc">{t('sortFeeDesc')}</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">{t('loadingDoctors')}</p>
      ) : data.items.length === 0 ? (
        <p className="muted">{t('noDoctors')}</p>
      ) : (
        <>
          <p className="muted result-count">
            {data.total === 1
              ? t('oneDoctorFound')
              : t('manyDoctorsFound', { count: data.total })}
          </p>
          <div className="card-grid">
            {data.items.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={data.page <= 1}
                onClick={() => load(data.page - 1)}
              >
                {t('prev')}
              </button>
              <span className="muted">{t('pageOf', { page: data.page, pages: totalPages })}</span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={data.page >= totalPages}
                onClick={() => load(data.page + 1)}
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
