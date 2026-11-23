import { RatingStars } from './RatingStars.jsx';

export function DoctorCard({ doctor }) {
  const name = doctor.user?.name ?? 'Doctor';

  return (
    <Link to={`/doctors/${doctor._id}`} className="doctor-card">
      <div className="avatar" data-accent={(doctor._id ?? '').slice(-1)}>
        {name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('')}
      </div>
      <div className="doctor-card-body">
        <h3>
          {name}
          {doctor.verified && <span className="badge badge-verified">Verified</span>}
        </h3>
        <p className="muted">
          {doctor.specialty?.name} - {doctor.city}
        </p>
        <p className="muted">{doctor.experienceYears} years of experience</p>
        <div className="doctor-card-foot">
          <RatingStars value={doctor.ratingAverage} count={doctor.ratingCount} />
          <span className="fee">${doctor.consultationFee}</span>
        </div>
      </div>
    </Link>
  );
}
