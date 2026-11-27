import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">H</span>
        <span className="brand-name">Hakim</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/doctors">{t('navFindDoctors')}</NavLink>
        {user?.role === 'patient' && <NavLink to="/appointments">{t('navMyAppointments')}</NavLink>}
        {user?.role === 'doctor' && <NavLink to="/dashboard">{t('navDashboard')}</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">{t('navAdmin')}</NavLink>}
        {user && <NavLink to="/notifications">{t('navNotifications')}</NavLink>}
      </nav>

      <div className="nav-actions">
        <LanguageSwitcher />
        {user ? (
          <>
            <NotificationBell />
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              {t('navLogOut')}
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">
              {t('navLogIn')}
            </Link>
            <Link className="btn btn-primary" to="/register">
              {t('navSignUp')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
