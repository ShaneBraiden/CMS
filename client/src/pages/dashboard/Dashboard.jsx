import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboardCheck, HiOutlineDocumentText,
  HiOutlineCalendar, HiOutlineBell, HiOutlineChartBar, HiOutlineCog,
  HiOutlineAcademicCap, HiOutlineClock, HiOutlineClipboardList, HiOutlineSpeakerphone,
  HiOutlineCheckCircle, HiOutlinePlusCircle, HiOutlineUserAdd, HiOutlineViewGrid,
  HiOutlineArrowRight
} from 'react-icons/hi';

/* ──────────────── Stat Card ──────────────── */
const StatCard = ({ label, value, icon: Icon, onClick, trend }) => (
  <div
    onClick={onClick}
    className={`group surface-card p-5 transition-all ${onClick ? 'cursor-pointer hover:border-cardinal-400 hover:shadow-md' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="label-inst text-gray-500">{label}</p>
        <p className="font-serif text-3xl font-semibold text-gray-900 mt-2 tabular-nums">{value}</p>
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
      <div className="p-2.5 rounded-md bg-cardinal-50 text-cardinal-700 border border-cardinal-100 group-hover:bg-cardinal-100 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

/* ──────────────── Quick Action ──────────────── */
const QuickAction = ({ label, icon: Icon, to }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="group surface-card px-4 py-5 flex flex-col items-center gap-3 hover:border-cardinal-400
                 hover:shadow-md transition-all cursor-pointer text-center min-h-[120px]"
    >
      <div className="w-11 h-11 rounded-full bg-cardinal-50 text-cardinal-700 flex items-center justify-center
                      border border-cardinal-100 group-hover:bg-cardinal-600 group-hover:text-white group-hover:border-cardinal-700 transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[13px] font-semibold text-gray-700 leading-tight group-hover:text-cardinal-800">
        {label}
      </span>
    </button>
  );
};

/* ──────────────── Section Header ──────────────── */
const SectionHeader = ({ eyebrow, title, action, onAction }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <p className="label-inst text-cardinal-700">{eyebrow}</p>
      <h2 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">{title}</h2>
    </div>
    {action && (
      <button
        onClick={onAction}
        className="text-sm text-cardinal-700 hover:text-cardinal-900 font-medium flex items-center gap-1 group"
      >
        {action} <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    )}
  </div>
);

/* ──────────────── Quick Actions by role ──────────────── */
const quickActions = {
  admin: [
    { label: 'Manage Users',    icon: HiOutlineUserAdd,         to: '/admin/users' },
    { label: 'Manage Batches',  icon: HiOutlineViewGrid,        to: '/admin/batches' },
    { label: 'Announcements',   icon: HiOutlineSpeakerphone,    to: '/announcements' },
    { label: 'Timetable',       icon: HiOutlineClock,           to: '/timetable' },
    { label: 'Attendance',      icon: HiOutlineClipboardCheck,  to: '/admin/attendance' },
    { label: 'Analytics',       icon: HiOutlineChartBar,        to: '/analytics' },
    { label: 'Events',          icon: HiOutlineCalendar,        to: '/events' },
    { label: 'Settings',        icon: HiOutlineCog,             to: '/settings' },
  ],
  teacher: [
    { label: 'My Courses',      icon: HiOutlineBookOpen,        to: '/courses' },
    { label: 'Take Attendance', icon: HiOutlineClipboardCheck,  to: '/attendance' },
    { label: 'Assignments',     icon: HiOutlineClipboardList,   to: '/assignments' },
    { label: 'Enter Marks',     icon: HiOutlineAcademicCap,     to: '/marks' },
    { label: 'Announcements',   icon: HiOutlineSpeakerphone,    to: '/announcements' },
    { label: 'OD Requests',     icon: HiOutlineDocumentText,    to: '/od' },
    { label: 'Exams',           icon: HiOutlineCalendar,        to: '/exams' },
    { label: 'Analytics',       icon: HiOutlineChartBar,        to: '/analytics' },
  ],
  student: [
    { label: 'My Courses',      icon: HiOutlineBookOpen,        to: '/courses' },
    { label: 'Attendance',      icon: HiOutlineClipboardCheck,  to: '/attendance' },
    { label: 'Assignments',     icon: HiOutlineClipboardList,   to: '/assignments' },
    { label: 'My Marks',        icon: HiOutlineAcademicCap,     to: '/marks' },
    { label: 'Timetable',       icon: HiOutlineClock,           to: '/timetable' },
    { label: 'Apply OD',        icon: HiOutlinePlusCircle,      to: '/od' },
    { label: 'Exams',           icon: HiOutlineCalendar,        to: '/exams' },
    { label: 'To-Do List',      icon: HiOutlineCheckCircle,     to: '/todos' },
  ],
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/dashboard');
        setStats(data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const today = useMemo(() => new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  const role = user?.role || 'student';
  const actions = quickActions[role] || quickActions.student;

  return (
    <div className="space-y-10">
      {/* ── Page Header ── */}
      <div className="surface-card px-8 py-7 bg-gradient-to-br from-white to-gray-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06] pointer-events-none">
          <img src="/logo_sret.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="relative">
          <p className="label-inst text-cardinal-700">{today}</p>
          <h1 className="font-serif text-[32px] font-semibold text-gray-900 mt-1">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <div className="divider-gold mt-3 max-w-[140px]" />
          <p className="text-sm text-gray-500 mt-4 max-w-xl leading-relaxed">
            This is your <span className="capitalize font-semibold text-gray-700">{role}</span> portal
            for the SRI Ramachandra Engineering and Technology Campus Management System.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <section>
          <SectionHeader eyebrow="Overview" title="At a glance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {role === 'admin' && (
              <>
                <StatCard label="Total Students" value={stats.totalStudents || 0} icon={HiOutlineUsers}
                          onClick={() => navigate('/admin/users')} />
                <StatCard label="Total Teachers" value={stats.totalTeachers || 0} icon={HiOutlineUsers}
                          onClick={() => navigate('/admin/users')} />
                <StatCard label="Courses" value={stats.totalCourses || 0} icon={HiOutlineBookOpen}
                          onClick={() => navigate('/courses')} />
                <StatCard label="Batches" value={stats.totalBatches || 0} icon={HiOutlineViewGrid}
                          onClick={() => navigate('/admin/batches')} />
              </>
            )}
            {role === 'teacher' && (
              <>
                <StatCard label="My Courses" value={stats.myCourses || 0} icon={HiOutlineBookOpen}
                          onClick={() => navigate('/courses')} />
                <StatCard label="Students" value={stats.totalStudents || 0} icon={HiOutlineUsers} />
                <StatCard label="Assignments" value={stats.totalAssignments || 0} icon={HiOutlineClipboardCheck}
                          onClick={() => navigate('/assignments')} />
                <StatCard label="Pending OD" value={stats.pendingOD || 0} icon={HiOutlineDocumentText}
                          onClick={() => navigate('/od')} />
              </>
            )}
            {role === 'student' && (
              <>
                <StatCard label="My Courses" value={stats.myCourses || 0} icon={HiOutlineBookOpen}
                          onClick={() => navigate('/courses')} />
                <StatCard label="Attendance" value={`${stats.attendancePercentage || 0}%`}
                          icon={HiOutlineClipboardCheck} onClick={() => navigate('/attendance')} />
                <StatCard label="Pending Work" value={stats.pendingAssignments || 0} icon={HiOutlineDocumentText}
                          onClick={() => navigate('/assignments')} />
                <StatCard label="Upcoming Exams" value={stats.upcomingExams?.length || 0}
                          icon={HiOutlineCalendar} onClick={() => navigate('/exams')} />
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section>
        <SectionHeader eyebrow="Shortcuts" title="Quick actions" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map(a => <QuickAction key={a.label} {...a} />)}
        </div>
      </section>

      {/* ── Announcements ── */}
      <section>
        <SectionHeader
          eyebrow="Institutional"
          title="Recent announcements"
          action="View all"
          onAction={() => navigate('/announcements')}
        />
        {stats?.recentAnnouncements?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentAnnouncements.map((a) => (
              <article key={a._id || a.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-1 self-stretch bg-gradient-to-b from-cardinal-400 to-cardinal-700 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{a.content || a.message}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap label-inst">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card p-10 text-center text-gray-400">
            <HiOutlineSpeakerphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No recent announcements</p>
          </div>
        )}
      </section>

      {/* ── Events + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <SectionHeader eyebrow="Calendar" title="Upcoming events" action="View all" onAction={() => navigate('/events')} />
          {stats?.upcomingEvents?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingEvents.map((e) => {
                const d = e.date ? new Date(e.date) : null;
                return (
                  <article key={e._id || e.id} className="surface-card p-4 flex items-center gap-4 hover:border-cardinal-300 transition-colors">
                    <div className="flex-shrink-0 w-14 h-14 border border-cardinal-200 bg-cardinal-50 rounded-md flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase text-cardinal-700 tracking-wider">
                        {d ? d.toLocaleDateString('en', { month: 'short' }) : ''}
                      </span>
                      <span className="font-serif text-xl font-bold text-cardinal-800 leading-none mt-0.5">
                        {d ? d.getDate() : ''}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{e.title}</h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="surface-card p-10 text-center text-gray-400">
              <HiOutlineCalendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No upcoming events</p>
            </div>
          )}
        </section>

        <section>
          <SectionHeader eyebrow="Updates" title="Notifications" action="View all" onAction={() => navigate('/notifications')} />
          {stats?.recentNotifications?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentNotifications.slice(0, 5).map((n) => (
                <div key={n._id || n.id} className="surface-card px-4 py-3 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-cardinal-600'}`} />
                  <p className="text-sm text-gray-700 flex-1 truncate">{n.message}</p>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card p-10 text-center text-gray-400">
              <HiOutlineBell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
