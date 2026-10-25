import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import SiteLayout from './layouts/SiteLayout.jsx';
import PanelLayout from './layouts/PanelLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import ClassesSearch from './pages/ClassesSearch.jsx';
import ClassDetail from './pages/ClassDetail.jsx';
import StudentHome from './pages/panel/StudentHome.jsx';
import TeacherHome from './pages/panel/TeacherHome.jsx';
import Chat from './pages/panel/Chat.jsx';
import Club from './pages/panel/Club.jsx';
import './styles/panel.css';
import './styles/styles2.css';

function Guard({ need, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container section">در حال بارگذاری…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (need === 'teacher' && user.role !== 'teacher') return <Navigate to="/panel" replace />;
  if (need === 'student' && user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/teachers/:id" element={<TeacherProfile />} />
            <Route path="/classes" element={<ClassesSearch />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
          </Route>
          <Route
            path="/panel"
            element={
              <Guard need="student">
                <PanelLayout variant="student" />
              </Guard>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="chat" element={<Chat />} />
            <Route path="club" element={<Club />} />
          </Route>
          <Route
            path="/teacher"
            element={
              <Guard need="teacher">
                <PanelLayout variant="teacher" />
              </Guard>
            }
          >
            <Route index element={<TeacherHome />} />
            <Route path="chat" element={<Chat />} />
            <Route path="club" element={<Club />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
