import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';

// Bell icon with an unread badge, refreshed once a minute.
export function NotificationBell() {
  const { t } = useI18n();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const { count: unread } = await api('/notifications/unread-count');
        if (active) setCount(unread);
      } catch {
        // Polling errors are intentionally silent.
      }
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Link to="/notifications" className="bell" aria-label={t('navNotifications')}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}
