import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { HiOutlineChartBar } from 'react-icons/hi';

/* Institutional chart palette — cardinal red, gold, ink navy */
const PALETTE = {
  cardinal: '#bf2228',
  cardinalLight: '#e77272',
  cardinalPale: '#f1a5a5',
  gold: '#a57e33',
  goldMid: '#d5a948',
  goldPale: '#e0c06a',
  ink: '#2a3c54',
  inkMid: '#4e6580',
  present: '#15803d',
  absent: '#bf2228',
};

const CHART_COLORS = [
  PALETTE.cardinal,
  PALETTE.gold,
  PALETTE.ink,
  PALETTE.cardinalLight,
  PALETTE.goldMid,
  PALETTE.inkMid,
  PALETTE.cardinalPale,
  PALETTE.goldPale,
];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

/* ── Shared card wrapper ── */
const ChartCard = ({ title, eyebrow, children, className = '' }) => (
  <div className={`surface-card p-5 sm:p-6 ${className}`}>
    {eyebrow && <p className="label-inst text-cardinal-700">{eyebrow}</p>}
    <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5 mb-4">{title}</h3>
    {children}
  </div>
);

/* ── Stat Mini Card ── */
const MiniStat = ({ label, value, tone = 'cardinal' }) => {
  const toneMap = {
    cardinal: 'text-cardinal-700',
    gold: 'text-gold-700',
    ink: 'text-ink-700',
    green: 'text-green-700',
    red: 'text-cardinal-700',
  };
  return (
    <div className="surface-card p-5">
      <p className="label-inst text-gray-500">{label}</p>
      <p className={`font-serif text-2xl sm:text-3xl font-semibold mt-1 tabular-nums ${toneMap[tone] || toneMap.cardinal}`}>
        {value}
      </p>
      <div className="divider-gold mt-3 max-w-[40px]" />
    </div>
  );
};

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
        {Object.entries(overview).map(([key, value], i) => (
          <MiniStat
            key={key}
            label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            value={value}
            tone={i % 3 === 0 ? 'cardinal' : i % 3 === 1 ? 'gold' : 'ink'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Distribution" eyebrow="Composition">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {data.batchWiseStudents?.length > 0 && (
          <ChartCard title="Students per Batch" eyebrow="Cohorts">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.batchWiseStudents} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={PALETTE.cardinal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {data.attendanceByCourse?.length > 0 && (
        <ChartCard title="Attendance % by Course" eyebrow="Engagement">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.attendanceByCourse} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              <Bar dataKey="percentage" fill={PALETTE.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="Monthly Attendance Trend" eyebrow="Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthlyAttendance}>
              <defs>
                <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.cardinal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PALETTE.cardinal} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              <Area type="monotone" dataKey="percentage" stroke={PALETTE.cardinal} fill="url(#adminArea)" strokeWidth={2} />
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
      <MiniStat label="My Courses" value={data.courseCount || 0} tone="cardinal" />
      <MiniStat
        label="Avg Attendance"
        value={
          data.attendanceByCourse?.length > 0
            ? `${Math.round(data.attendanceByCourse.reduce((s, c) => s + c.percentage, 0) / data.attendanceByCourse.length)}%`
            : 'N/A'
        }
        tone="gold"
      />
      <MiniStat label="Recent Assignments" value={data.assignmentStats?.length || 0} tone="ink" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {data.attendanceByCourse?.length > 0 && (
        <ChartCard title="Course-wise Attendance" eyebrow="By Course">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.attendanceByCourse} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              <Bar dataKey="percentage" fill={PALETTE.cardinal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="Monthly Trend" eyebrow="Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke={PALETTE.gold}
                strokeWidth={2.5}
                dot={{ r: 4, fill: PALETTE.gold }}
                activeDot={{ r: 6, fill: PALETTE.cardinal }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>

    {data.assignmentStats?.length > 0 && (
      <ChartCard title="Assignment Submissions" eyebrow="Coursework">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.assignmentStats} margin={{ bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="totalSubmissions" name="Submissions" fill={PALETTE.ink} radius={[4, 4, 0, 0]} />
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
  const attendTone = (data.overallAttendance || 0) >= 75 ? 'green' : 'red';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MiniStat label="Overall Attendance" value={`${data.overallAttendance || 0}%`} tone={attendTone} />
        <MiniStat label="Courses Enrolled" value={data.courseCount || 0} tone="cardinal" />
        <MiniStat label="Assignments Tracked" value={data.assignmentStats?.length || 0} tone="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.attendanceByCourse?.length > 0 && (
          <ChartCard title="Present vs Absent" eyebrow="By Course">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.attendanceByCourse} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="present" name="Present" stackId="a" fill={PALETTE.present} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill={PALETTE.absent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {data.attendanceByCourse?.length > 0 && (
          <ChartCard title="Attendance Distribution" eyebrow="Share">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.attendanceByCourse}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                  {data.attendanceByCourse.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {data.monthlyAttendance?.length > 0 && (
        <ChartCard title="My Monthly Trend" eyebrow="Progress">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyAttendance}>
              <defs>
                <linearGradient id="studentArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.cardinal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PALETTE.cardinal} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              <Area type="monotone" dataKey="percentage" stroke={PALETTE.cardinal} fill="url(#studentArea)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data.assignmentStats?.length > 0 && (
        <ChartCard title="Assignment Status" eyebrow="Coursework">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.assignmentStats.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-200 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif font-semibold text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.courseName} &middot; Due {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span
                  className={`ml-3 label-inst text-[10px] px-2 py-0.5 rounded-full border ${
                    a.submitted
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-cardinal-50 text-cardinal-800 border-cardinal-200'
                  }`}
                >
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-card p-12 text-center">
        <HiOutlineChartBar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="font-serif text-lg text-gray-700">No analytics available</p>
        <p className="text-sm text-gray-500 mt-1">Data will populate as activity is recorded.</p>
      </div>
    );
  }

  const role = data.role || user?.role;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <p className="label-inst text-cardinal-700">Insights</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Analytics</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">
          {role === 'admin' && 'Institution-wide engagement, cohort composition, and attendance trends.'}
          {role === 'teacher' && 'Course attendance, submissions, and monthly trends.'}
          {role === 'student' && 'Your attendance, coursework, and progress over time.'}
        </p>
      </div>

      {role === 'admin' && <AdminAnalytics data={data} />}
      {role === 'teacher' && <TeacherAnalytics data={data} />}
      {role === 'student' && <StudentAnalytics data={data} />}
    </div>
  );
};

export default Analytics;
