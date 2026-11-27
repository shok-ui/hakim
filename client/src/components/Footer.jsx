import { useI18n } from '../i18n/index.jsx';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="brand-name">Hakim</span>
        <span className="muted">{t('footerTagline')}</span>
        <span className="muted">{t('footerDemo')}</span>
      </div>
    </footer>
  );
}
