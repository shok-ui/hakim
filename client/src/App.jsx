import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { RequireRole } from './components/RequireRole.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Home } from './pages/Home.jsx';
import { Doctors } from './pages/Doctors.jsx';
import { DoctorDetail } from './pages/DoctorDetail.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { MyAppointments } from './pages/MyAppointments.jsx';
import { DoctorDashboard } from './pages/DoctorDashboard.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { AdminPanel } from './pages/AdminPanel.jsx';
import { NotFound } from './pages/NotFound.jsx';

export function App() {
  const { ready } = useAuth();

  // Wait for the auth bootstrap before rendering any route.
  if (!ready) return <div className="page-loading">Loading...</div>;

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/appointments"
            element={
              <RequireRole roles={['patient']}>
                <MyAppointments />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireRole roles={['doctor']}>
                <DoctorDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireRole roles={['patient', 'doctor', 'admin']}>
                <Notifications />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles={['admin']}>
                <AdminPanel />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
