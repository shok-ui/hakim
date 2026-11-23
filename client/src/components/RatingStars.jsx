export function RatingStars({ value = 0, count = 0 }) {
  const rounded = Math.round(value);
  const title = count
    ? `${Number(value).toFixed(1)} from ${count} review${count === 1 ? '' : 's'}`
    : 'No reviews yet';

  return (
    <span className="stars" title={title}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'star filled' : 'star'}>
          {i <= rounded ? '\u2605' : '\u2606'}
        </span>
      ))}
      <span className="stars-label">
        {count > 0 ? `${Number(value).toFixed(1)} (${count})` : 'New'}
      </span>
    </span>
  );
}
