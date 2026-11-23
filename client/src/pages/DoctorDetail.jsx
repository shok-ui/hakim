import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RatingStars } from '../components/RatingStars.jsx';
import { SlotPicker } from '../components/SlotPicker.jsx';
import { formatDate, initials } from '../utils/format.js';

// Doctor profile against the live API:
// GET /api/doctors/:id -> { doctor: { _id, name, specialty, city, bio,
// education[], experienceYears, fee, clinicAddress, ratingAvg, ratingCount,
// schedule, verified } }
// Reviews are a separate resource:
// GET /api/reviews/doctor/:doctorId?page=&limit= ->
//   { items: [{ id, rating, comment, patientName, createdAt }], total, page, pages }
export function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [error, setError] = useState('');
  const [bookError, setBookError] = useState('');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api(`/doctors/${id}`);
      setDoctor(data.doctor);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    try {
      const data = await api(`/reviews/doctor/${id}`, { query: { page: 1, limit: 10 } });
      setReviews(data);
    } catch {
      // Reviews are supplementary; the profile still renders without them.
    }
  }, [id]);

  useEffect(() => {
    load();
    loadReviews();
  }, [load, loadReviews]);

  const book = async (date, startMinute) => {
    if (!user) {
      navigate('/login', { state: { from: `/doctors/${id}` } });
      return;
    }
    if (user.role !== 'patient') {
      throw new Error('Only patient accounts can book appointments');
    }
    // POST /api/appointments: { doctorId, date 'YYYY-MM-DD', startMinute, reason? }
    await api('/appointments', {
      method: 'POST',
      body: { doctorId: id, date, startMinute }
    });
    navigate('/appointments', { state: { booked: true } });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewMsg('');
    try {
      await api('/reviews', {
        method: 'POST',
        body: { doctorId: id, rating: review.rating, comment: review.comment }
      });
      setReviewMsg('Thanks for your feedback.');
      await load();
      await loadReviews();
    } catch (err) {
      // The server rejects reviews without a completed appointment; surface
      // its message directly so the reason is clear.
      setReviewMsg(err.message);
    }
  };

  if (error) {
    return (
      <div className="container section">
        <p className="form-error">{error}</p>
      </div>
    );
  }
  if (!doctor) {
    return (
      <div className="container section">
        <p className="muted">Loading doctor profile...</p>
      </div>
    );
  }

  const name = doctor.name ?? 'Doctor';

  return (
    <div className="container section detail">
      <div className="detail-card">
        <div className="avatar avatar-lg" data-accent={(doctor._id ?? '').slice(-1)}>
          {initials(name)}
        </div>
        <div className="detail-info">
          <h1>
            {name}
            {doctor.verified && <span className="badge badge-verified">Verified</span>}
          </h1>
          <p className="muted">
            {doctor.specialty} - {doctor.city}
          </p>
          <RatingStars value={doctor.ratingAvg} count={doctor.ratingCount} />
          <p className="fee">${doctor.fee} per visit</p>
        </div>
      </div>

      <div className="detail-grid">
        <section>
          <h2>About</h2>
          <p>{doctor.bio || 'This doctor has not added a biography yet.'}</p>

          <h2>Experience</h2>
          <p>{doctor.experienceYears} years of practice</p>

          <h2>Education</h2>
          {Array.isArray(doctor.education) && doctor.education.length > 0 ? (
            <ul>
              {doctor.education.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No education details provided.</p>
          )}

          {doctor.clinicAddress && (
            <>
              <h2>Clinic</h2>
              <p>{doctor.clinicAddress}</p>
            </>
          )}

          <h2>Reviews ({reviews.total})</h2>
          {reviews.items.length === 0 && <p className="muted">No reviews yet.</p>}
          {reviews.items.map((r) => (
            <div key={r.id} className="review">
              <RatingStars value={r.rating} />
              <p className="muted">
                {r.patientName ?? 'Patient'} - {formatDate(r.createdAt)}
              </p>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}

          {user?.role === 'patient' && (
            <form className="review-form" onSubmit={submitReview}>
              <h3>Leave a review</h3>
              <p className="muted">Reviews unlock after a completed visit with this doctor.</p>
              <select
                value={review.rating}
                onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                aria-label="Rating"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="How was your visit?"
                maxLength={600}
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
              />
              <button type="submit" className="btn btn-primary">
                Submit review
              </button>
              {reviewMsg && <p className="muted">{reviewMsg}</p>}
            </form>
          )}
        </section>

        <aside>
          <h2>Book a visit</h2>
          <p className="muted">Pick a day, then choose a free time slot (UTC).</p>
          <SlotPicker doctorId={id} onBook={book} />
          {bookError && <p className="form-error">{bookError}</p>}
        </aside>
      </div>
    </div>
  );
}
