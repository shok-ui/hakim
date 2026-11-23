import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RatingStars } from '../components/RatingStars.jsx';
import { SlotPicker } from '../components/SlotPicker.jsx';
import { formatDate, initials } from '../utils/format.js';

export function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api(`/doctors/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const book = async (startAt) => {
    if (!user) {
      navigate('/login', { state: { from: `/doctors/${id}` } });
      return;
    }
    if (user.role !== 'patient') {
      throw new Error('Only patient accounts can book appointments');
    }
    await api('/appointments', { method: 'POST', body: { doctorId: id, startAt } });
    navigate('/appointments', { state: { booked: true } });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewMsg('');
    try {
      await api(`/doctors/${id}/reviews`, { method: 'POST', body: review });
      setReviewMsg('Thanks for your feedback.');
      await load();
    } catch (err) {
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
  if (!data) {
    return (
      <div className="container section">
        <p className="muted">Loading doctor profile...</p>
      </div>
    );
  }

  const { doctor, reviews } = data;
  const name = doctor.user?.name ?? 'Doctor';

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
            {doctor.specialty?.name} - {doctor.city}
          </p>
          <RatingStars value={doctor.ratingAverage} count={doctor.ratingCount} />
          <p className="fee">${doctor.consultationFee} per visit</p>
        </div>
      </div>

      <div className="detail-grid">
        <section>
          <h2>About</h2>
          <p>{doctor.bio || 'This doctor has not added a biography yet.'}</p>

          <h2>Experience</h2>
          <p>{doctor.experienceYears} years of practice</p>

          {doctor.clinicAddress && (
            <>
              <h2>Clinic</h2>
              <p>{doctor.clinicAddress}</p>
            </>
          )}

          <h2>Reviews ({reviews.length})</h2>
          {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r._id} className="review">
              <RatingStars value={r.rating} />
              <p className="muted">
                {r.patient?.name ?? 'Patient'} - {formatDate(r.createdAt)}
              </p>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}

          {user?.role === 'patient' && (
            <form className="review-form" onSubmit={submitReview}>
              <h3>Leave a review</h3>
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
          <SlotPicker doctorId={id} onBook={book} />
        </aside>
      </div>
    </div>
  );
}
