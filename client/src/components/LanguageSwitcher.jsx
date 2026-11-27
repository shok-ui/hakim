import { useI18n } from '../i18n/index.jsx';

// Compact EN / FA toggle in the navbar. Each option keeps its native label
// so the switcher is readable in both directions.
const OPTIONS = [
  { code: 'en', labelKey: 'langEn' },
  { code: 'fa', labelKey: 'langFa' }
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t('language')}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={lang === option.code ? 'lang-btn active' : 'lang-btn'}
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          title={t('language')}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
