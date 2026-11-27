import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { RatingStars } from './RatingStars.jsx';

// Directory card for the live /api/doctors payload: the doctor document
// itself carries name, specialty (a plain string) and fee.
export function DoctorCard({ doctor }) {
  const { t } = useI18n();
  const name = doctor.name ?? 'Doctor';

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
        <h3>{name}</h3>
        <p className="muted">
          {doctor.specialty} - {doctor.city}
        </p>
        <p className="muted">{t('yearsOfPractice', { count: doctor.experienceYears })}</p>
        <div className="doctor-card-foot">
          <RatingStars value={doctor.ratingAvg} count={doctor.ratingCount} />
          <span className="fee">{t('feeAmount', { fee: doctor.fee })}</span>
        </div>
      </div>
    </Link>
  );
}
