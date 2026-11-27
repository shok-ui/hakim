import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';

export function NotFound() {
  const { t } = useI18n();

  return (
    <div className="container section not-found">
      <h1>{t('notFoundTitle')}</h1>
      <p className="muted">{t('notFoundSubtitle')}</p>
      <Link className="btn btn-primary" to="/">
        {t('backHome')}
      </Link>
    </div>
  );
}
