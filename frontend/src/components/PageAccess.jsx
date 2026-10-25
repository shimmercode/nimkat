'use client';
import { useAuth } from '../auth.jsx';
import { Navigate, useLocation } from '../routing/navigation';

export default function PageAccess({ role, children }) {
  const { user, loading, sessionError } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="container section">در حال بررسی دسترسی…</div>;
  if (!user && sessionError) return <div className="container section" role="alert"><p>{sessionError}</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>تلاش دوباره</button></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (role === 'parent' && user.role !== 'parent') return <Navigate to={user.role==='teacher'?'/teacher':'/panel'} replace />;
  if (role !== 'parent' && user.role === 'parent') return <Navigate to="/parent" replace />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/" replace />;
  if (role === 'teacher' && user.role !== 'teacher') return <Navigate to="/panel" replace />;
  if (role === 'student' && user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return children;
}
