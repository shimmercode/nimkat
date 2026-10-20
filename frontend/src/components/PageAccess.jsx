'use client';
import { useAuth } from '../auth.jsx';
import { Navigate, useLocation } from '../routing/navigation';

export default function PageAccess({ role, children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="container section">در حال بررسی دسترسی…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (role === 'teacher' && user.role !== 'teacher') return <Navigate to="/panel" replace />;
  if (role === 'student' && user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return children;
}
