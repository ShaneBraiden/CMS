import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboardCheck, HiOutlineDocumentText,
  HiOutlineCalendar, HiOutlineBell, HiOutlineChartBar, HiOutlineCog,
  HiOutlineAcademicCap, HiOutlineClock, HiOutlineClipboardList, HiOutlineSpeakerphone,
  HiOutlineCheckCircle, HiOutlinePlusCircle, HiOutlineUserAdd, HiOutlineViewGrid
} from 'react-icons/hi';

/* ── Stat Card ── */
const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

/* ── Quick Action Button ── */
const QuickAction = ({ label, icon: Icon, color, to }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer min-h-[120px]"
    >
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-sm font-semibold text-gray-700 text-center leading-tight">{label}</span>
    </button>
  );
};

/* ── Quick Actions Config by Role ── */
const quickActions = {
  admin: [
    { label: 'Manage Users', icon: HiOutlineUserAdd, color: 'bg-blue-100 text-blue-600', to: '/admin/users' },
    { label: 'Manage Batches', icon: HiOutlineViewGrid, color: 'bg-green-100 text-green-600', to: '/admin/batches' },
    { label: 'Announcements', icon: HiOutlineSpeakerphone, color: 'bg-yellow-100 text-yellow-600', to: '/announcements' },
    { label: 'Timetable', icon: HiOutlineClock, color: 'bg-purple-100 text-purple-600', to: '/admin/timetable' },
    { label: 'Attendance', icon: HiOutlineClipboardCheck, color: 'bg-teal-100 text-teal-600', to: '/admin/attendance' },
    { label: 'Analytics', icon: HiOutlineChartBar, color: 'bg-rose-100 text-rose-600', to: '/analytics' },
    { label: 'Events', icon: HiOutlineCalendar, color: 'bg-indigo-100 text-indigo-600', to: '/events' },
    { label: 'Settings', icon: HiOutlineCog, color: 'bg-gray-100 text-gray-600', to: '/settings' },
  ],
  teacher: [
    { label: 'My Courses', icon: HiOutlineBookOpen, color: 'bg-blue-100 text-blue-600', to: '/courses' },
    { label: 'Take Attendance', icon: HiOutlineClipboardCheck, color: 'bg-green-100 text-green-600', to: '/attendance' },
    { label: 'Assignments', icon: HiOutlineClipboardList, color: 'bg-purple-100 text-purple-600', to: '/assignments' },
    { label: 'Enter Marks', icon: HiOutlineAcademicCap, color: 'bg-orange-100 text-orange-600', to: '/marks' },
    { label: 'Announcements', icon: HiOutlineSpeakerphone, color: 'bg-yellow-100 text-yellow-600', to: '/announcements' },
    { label: 'OD Requests', icon: HiOutlineDocumentText, color: 'bg-teal-100 text-teal-600', to: '/od' },
    { label: 'Exams', icon: HiOutlineCalendar, color: 'bg-rose-100 text-rose-600', to: '/exams' },
    { label: 'Analytics', icon: HiOutlineChartBar, color: 'bg-cyan-100 text-cyan-600', to: '/analytics' },
    { label: 'Timetable', icon: HiOutlineClock, color: 'bg-indigo-100 text-indigo-600', to: '/timetable' },
  ],
  student: [
    { label: 'My Courses', icon: HiOutlineBookOpen, color: 'bg-blue-100 text-blue-600', to: '/courses' },
    { label: 'Attendance', icon: HiOutlineClipboardCheck, color: 'bg-green-100 text-green-600', to: '/attendance' },
    { label: 'Assignments', icon: HiOutlineClipboardList, color: 'bg-purple-100 text-purple-600', to: '/assignments' },
    { label: 'My Marks', icon: HiOutlineAcademicCap, color: 'bg-orange-100 text-orange-600', to: '/marks' },
    { label: 'Timetable', icon: HiOutlineClock, color: 'bg-indigo-100 text-indigo-600', to: '/timetable' },
    { label: 'Apply OD', icon: HiOutlinePlusCircle, color: 'bg-teal-100 text-teal-600', to: '/od' },
    { label: 'Exams', icon: HiOutlineCalendar, color: 'bg-rose-100 text-rose-600', to: '/exams' },
    { label: 'Analytics', icon: HiOutlineChartBar, color: 'bg-cyan-100 text-cyan-600', to: '/analytics' },
    { label: 'To-Do List', icon: HiOutlineCheckCircle, color: 'bg-amber-100 text-amber-600', to: '/todos' },
  ],
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await API.get('/dashboard');
        setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const role = user?.role || 'student';
  const actions = quickActions[role] || quickActions.student;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500 mt-1 capitalize">{role} Dashboard</p>
      </div>

      {/* ── Stats Cards ── */}
      {role === 'admin' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Students" value={stats.totalStudents || 0} icon={HiOutlineUsers} color="bg-blue-50 text-blue-600" onClick={() => navigate('/admin/users')} />
          <StatCard title="Total Teachers" value={stats.totalTeachers || 0} icon={HiOutlineUsers} color="bg-green-50 text-green-600" onClick={() => navigate('/admin/users')} />
          <StatCard title="Total Courses" value={stats.totalCourses || 0} icon={HiOutlineBookOpen} color="bg-purple-50 text-purple-600" onClick={() => navigate('/courses')} />
          <StatCard title="Total Batches" value={stats.totalBatches || 0} icon={HiOutlineDocumentText} color="bg-orange-50 text-orange-600" onClick={() => navigate('/admin/batches')} />
        </div>
      )}

      {role === 'teacher' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="My Courses" value={stats.myCourses || 0} icon={HiOutlineBookOpen} color="bg-blue-50 text-blue-600" onClick={() => navigate('/courses')} />
          <StatCard title="Total Students" value={stats.totalStudents || 0} icon={HiOutlineUsers} color="bg-green-50 text-green-600" />
          <StatCard title="Assignments" value={stats.totalAssignments || 0} icon={HiOutlineClipboardCheck} color="bg-purple-50 text-purple-600" onClick={() => navigate('/assignments')} />
          <StatCard title="Pending OD" value={stats.pendingOD || 0} icon={HiOutlineDocumentText} color="bg-orange-50 text-orange-600" onClick={() => navigate('/od')} />
        </div>
      )}

      {role === 'student' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="My Courses" value={stats.myCourses || 0} icon={HiOutlineBookOpen} color="bg-blue-50 text-blue-600" onClick={() => navigate('/courses')} />
          <StatCard title="Attendance %" value={`${stats.attendancePercentage || 0}%`} icon={HiOutlineClipboardCheck} color="bg-green-50 text-green-600" onClick={() => navigate('/attendance')} />
          <StatCard title="Pending Assignments" value={stats.pendingAssignments || 0} icon={HiOutlineDocumentText} color="bg-purple-50 text-purple-600" onClick={() => navigate('/assignments')} />
          <StatCard title="Upcoming Exams" value={stats.upcomingExams?.length || 0} icon={HiOutlineCalendar} color="bg-orange-50 text-orange-600" onClick={() => navigate('/exams')} />
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* ── Recent Announcements ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Announcements</h2>
          <button onClick={() => navigate('/announcements')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </button>
        </div>
        {stats?.recentAnnouncements?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentAnnouncements.map((a) => (
              <div key={a._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content || a.message}</p>
                  </div>
                  <span className="ml-4 text-xs text-gray-400 whitespace-nowrap">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6 text-center text-gray-400">
            <HiOutlineBell className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No recent announcements</p>
          </div>
        )}
      </div>

      {/* ── Upcoming Events ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
          <button onClick={() => navigate('/events')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </button>
        </div>
        {stats?.upcomingEvents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.upcomingEvents.map((e) => (
              <div key={e._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600">
                      {e.date ? new Date(e.date).toLocaleDateString('en', { month: 'short' }) : ''}
                    </span>
                    <span className="text-lg font-bold text-indigo-700 leading-none">
                      {e.date ? new Date(e.date).getDate() : ''}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{e.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{e.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6 text-center text-gray-400">
            <HiOutlineCalendar className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No upcoming events</p>
          </div>
        )}
      </div>

      {/* ── Notifications ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          <button onClick={() => navigate('/notifications')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </button>
        </div>
        {stats?.recentNotifications?.length > 0 ? (
          <div className="space-y-2">
            {stats.recentNotifications.slice(0, 5).map((n) => (
              <div key={n._id} className="bg-white rounded-lg border px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                <p className="text-sm text-gray-700 flex-1">{n.message}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6 text-center text-gray-400">
            <HiOutlineBell className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
