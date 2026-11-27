import { useI18n } from '../i18n/index.jsx';

export function RatingStars({ value = 0, count = 0 }) {
  const { t } = useI18n();
  const rounded = Math.round(value);
  const title = count
    ? t(count === 1 ? 'ratingFromOneReview' : 'ratingFromReviews', {
        rating: Number(value).toFixed(1),
        count
      })
    : t('noReviewsYet');

  return (
    <span className="stars" title={title}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'star filled' : 'star'}>
          {i <= rounded ? '\u2605' : '\u2606'}
        </span>
      ))}
      <span className="stars-label">
        {count > 0 ? `${Number(value).toFixed(1)} (${count})` : t('newDoctorLabel')}
      </span>
    </span>
  );
}
