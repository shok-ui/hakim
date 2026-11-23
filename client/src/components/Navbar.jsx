import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from './NotificationBell.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
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
        <NavLink to="/doctors">Find doctors</NavLink>
        {user?.role === 'patient' && <NavLink to="/appointments">My appointments</NavLink>}
        {user?.role === 'doctor' && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user && <NavLink to="/notifications">Notifications</NavLink>}
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <NotificationBell />
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/register">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
