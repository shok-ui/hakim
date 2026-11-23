import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { DoctorCard } from '../components/DoctorCard.jsx';

// Doctor directory with filters, sorting and pagination. Initial filter values
// can arrive from the home page search form.
export function Doctors() {
  const location = useLocation();
  const initial = location.state ?? {};

  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({
    specialty: initial.specialty ?? '',
    city: initial.city ?? '',
    search: '',
    minRating: '',
    maxFee: '',
    sort: 'rating'
  });
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 12 });
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
          query: { ...filters, page, limit: data.limit }
        });
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, data.limit]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const set = (field) => (event) =>
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="container section">
      <h1>Find doctors</h1>

      <div className="filter-bar">
        <select value={filters.specialty} onChange={set('specialty')} aria-label="Specialty">
          <option value="">All specialties</option>
          {specialties.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="City"
          value={filters.city}
          onChange={set('city')}
          aria-label="City"
        />
        <input
          type="text"
          placeholder="Doctor name"
          value={filters.search}
          onChange={set('search')}
          aria-label="Doctor name"
        />
        <select value={filters.minRating} onChange={set('minRating')} aria-label="Minimum rating">
          <option value="">Any rating</option>
          <option value="4">4 stars and up</option>
          <option value="3">3 stars and up</option>
        </select>
        <input
          type="number"
          min="0"
          placeholder="Max fee ($)"
          value={filters.maxFee}
          onChange={set('maxFee')}
          aria-label="Maximum fee"
        />
        <select value={filters.sort} onChange={set('sort')} aria-label="Sort by">
          <option value="rating">Top rated</option>
          <option value="experience">Most experienced</option>
          <option value="feeAsc">Lowest fee</option>
          <option value="feeDesc">Highest fee</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading doctors...</p>
      ) : data.items.length === 0 ? (
        <p className="muted">No doctors match your filters. Try clearing some of them.</p>
      ) : (
        <>
          <p className="muted result-count">
            {data.total} doctor{data.total === 1 ? '' : 's'} found
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
                Previous
              </button>
              <span className="muted">
                Page {data.page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={data.page >= totalPages}
                onClick={() => load(data.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
