import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ── Shared card wrapper ── */
const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}>
    <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">{title}</h3>
    {children}
  </div>
);

/* ── Stat Mini Card ── */
const MiniStat = ({ label, value, color = 'blue' }) => (
  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
    <p className="text-xs sm:text-sm text-gray-500">{label}</p>
    <p className={`text-xl sm:text-2xl font-bold mt-1`} style={{ color: color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : color === 'purple' ? '#8b5cf6' : '#3b82f6' }}>{value}</p>
  </div>
);

/* ════════════════════════════════════════════════════════
   ADMIN ANALYTICS
   ════════════════════════════════════════════════════════ */
const AdminAnalytics = ({ data }) => {
  const overview = data.overview || {};
  const pieData = Object.entries(overview)
    .filter(([k]) => k !== 'courses' && k !== 'batches')
    .map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }));

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(overview).map(([key, value]) => (
          <MiniStat key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User distribution pie */}
        <ChartCard title="User Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Students per batch */}
        {data.batchWiseStudents?.length > 0 && (
          <ChartCard title="Students per Batch">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.batchWiseStudents} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Attendance by course bar chart */}
      {data.attendanceByCourse?.length > 0 && (
        <ChartCard title="Attendance % by Course">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.attendanceByCourse} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Monthly attendance trend */}
      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="Monthly Attendance Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Area type="monotone" dataKey="percentage" stroke="#8b5cf6" fill="#8b5cf680" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   TEACHER ANALYTICS
   ════════════════════════════════════════════════════════ */
const TeacherAnalytics = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MiniStat label="My Courses" value={data.courseCount || 0} />
      <MiniStat label="Avg Attendance" value={
        data.attendanceByCourse?.length > 0
          ? `${Math.round(data.attendanceByCourse.reduce((s, c) => s + c.percentage, 0) / data.attendanceByCourse.length)}%`
          : 'N/A'
      } color="green" />
      <MiniStat label="Recent Assignments" value={data.assignmentStats?.length || 0} color="purple" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Course attendance bar */}
      {data.attendanceByCourse?.length > 0 && (
        <ChartCard title="Course-wise Attendance %">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.attendanceByCourse} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Monthly trend */}
      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="Monthly Attendance Trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>

    {/* Assignment submissions */}
    {data.assignmentStats?.length > 0 && (
      <ChartCard title="Assignment Submissions">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.assignmentStats} margin={{ bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalSubmissions" name="Submissions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════
   STUDENT ANALYTICS
   ════════════════════════════════════════════════════════ */
const StudentAnalytics = ({ data }) => {
  const attendColor = (data.overallAttendance || 0) >= 75 ? 'green' : 'red';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MiniStat label="Overall Attendance" value={`${data.overallAttendance || 0}%`} color={attendColor} />
        <MiniStat label="Courses Enrolled" value={data.courseCount || 0} />
        <MiniStat label="Assignments Tracked" value={data.assignmentStats?.length || 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance per course */}
        {data.attendanceByCourse?.length > 0 && (
          <ChartCard title="My Attendance by Course">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.attendanceByCourse} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v, name) => [`${v}${name === 'percentage' ? '%' : ''}`, name]} />
                <Legend />
                <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Attendance pie */}
        {data.attendanceByCourse?.length > 0 && (
          <ChartCard title="Attendance Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.attendanceByCourse}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {data.attendanceByCourse.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Monthly trend */}
      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="My Monthly Attendance Trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fill="#3b82f680" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Assignment status */}
      {data.assignmentStats?.length > 0 && (
        <ChartCard title="My Assignment Status">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.assignmentStats.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.courseName} &middot; Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${a.submitted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {a.submitted ? 'Submitted' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN ANALYTICS PAGE
   ════════════════════════════════════════════════════════ */
const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: res } = await API.get('/analytics');
        setData(res.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-8">No analytics data available</p>;
  }

  const role = data.role || user?.role;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Analytics</h1>
      {role === 'admin' && <AdminAnalytics data={data} />}
      {role === 'teacher' && <TeacherAnalytics data={data} />}
      {role === 'student' && <StudentAnalytics data={data} />}
    </div>
  );
};

export default Analytics;
