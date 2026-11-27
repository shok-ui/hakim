import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { en } from './locales/en.js';
import { fa } from './locales/fa.js';

// Registry of supported locales. Adding a language means creating a new
// dictionary in ./locales, importing it here and adding one entry — the
// parity script and the language switcher pick it up automatically.
const LOCALES = {
  en: { dict: en, dir: 'ltr', dateLocale: 'en-US' },
  fa: { dict: fa, dir: 'rtl', dateLocale: 'fa-IR' }
};

const STORAGE_KEY = 'hakim.lang';
const DEFAULT_LANG = 'en'; // The product default stays English everywhere.

const I18nContext = createContext(null);

function readInitialLang() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return LOCALES[saved] ? saved : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// Lightweight i18n provider: flat dictionaries with {param} interpolation,
// persisted selection, and automatic <html lang/dir> + document.title sync.
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = useCallback((next) => {
    if (!LOCALES[next]) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies
      // for the current session.
    }
    setLangState(next);
  }, []);

  // Keep the document in sync with the active locale (direction and title).
  useEffect(() => {
    const meta = LOCALES[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    document.title = meta.dict.metaTitle;
  }, [lang]);

  const t = useCallback(
    (key, params = {}) => {
      let text = LOCALES[lang].dict[key] ?? en[key] ?? key;
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      dir: LOCALES[lang].dir,
      dateLocale: LOCALES[lang].dateLocale,
      setLang,
      t
    }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return ctx;
}

export const localeCodes = Object.keys(LOCALES);
