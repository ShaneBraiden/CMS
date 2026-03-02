import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Courses from './pages/courses/Courses';
import Assignments from './pages/assignments/Assignments';
import Marks from './pages/marks/Marks';
import Attendance from './pages/attendance/Attendance';
import Timetable from './pages/timetable/Timetable';
import Exams from './pages/exams/Exams';
import Announcements from './pages/announcements/Announcements';
import OD from './pages/od/OD';
import Todos from './pages/todos/Todos';
import Notifications from './pages/notifications/Notifications';
import Events from './pages/events/Events';
import Analytics from './pages/analytics/Analytics';
import Settings from './pages/settings/Settings';
import Users from './pages/admin/Users';
import Batches from './pages/admin/Batches';
import AdminAttendance from './pages/admin/AdminAttendance';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Protected routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/od" element={<OD />} />
          <Route path="/od/approvals" element={<OD />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/events" element={<Events />} />
          <Route path="/analytics" element={<RoleRoute roles={['admin', 'teacher']}><Analytics /></RoleRoute>} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin-only routes */}
          <Route path="/admin/users" element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
          <Route path="/admin/batches" element={<RoleRoute roles={['admin']}><Batches /></RoleRoute>} />
          <Route path="/admin/attendance" element={<RoleRoute roles={['admin']}><AdminAttendance /></RoleRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </>
  );
}

export default App;
