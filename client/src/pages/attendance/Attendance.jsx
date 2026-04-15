import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getAttendanceColor } from '../../utils/helpers';
import { HOUR_LABELS } from '../../utils/constants';
import { HiOutlineClipboardCheck, HiOutlineBookOpen } from 'react-icons/hi';

const Attendance = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStudent = user?.role === 'student';

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const { data: res } = await API.get('/attendance');
      setData(res.data);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* ── Page header ── */}
        <div>
          <p className="label-inst text-cardinal-700">Academic Record</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">My attendance</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Attendance percentages for each enrolled course.</p>
        </div>

        {/* ── Grid ── */}
        {Array.isArray(data) && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((item, idx) => {
              const pct = item.percentage || 0;
              return (
                <article key={idx} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="label-inst text-gray-400">Course</p>
                      <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5 truncate">
                        {item.courseName || 'Course'}
                      </h3>
                    </div>
                    <div className="p-2 rounded-md bg-cardinal-50 text-cardinal-700 border border-cardinal-100 flex-shrink-0">
                      <HiOutlineBookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{item.present || 0} / {item.total || 0} classes</p>
                      <p className="font-serif text-3xl font-semibold text-gray-900 mt-1 tabular-nums">{pct}%</p>
                    </div>
                    <span className={`label-inst text-[10px] px-2 py-1 rounded-full ${getAttendanceColor(pct)}`}>
                      {pct >= 75 ? 'Good' : pct >= 60 ? 'Warning' : 'Critical'}
                    </span>
                  </div>
                  <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cardinal-500 to-cardinal-700 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-card p-12 text-center">
            <HiOutlineClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-serif text-lg text-gray-700">No attendance records</p>
            <p className="text-sm text-gray-500 mt-1">Records will appear once classes begin.</p>
          </div>
        )}
      </div>
    );
  }

  return <MarkAttendance />;
};

/* ─── Teacher Mark Attendance ─── */
const MarkAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await API.get('/courses');
        setCourses(data.data);
      } catch { /* ignore */ }
    };
    fetchCourses();
  }, []);

  const loadStudents = async () => {
    if (!selectedCourse) return toast.error('Select a course');
    setLoading(true);
    try {
      const { data } = await API.get(`/attendance/history?course_id=${selectedCourse}&date=${date}`);
      const studentList = data.data || [];
      setStudents(studentList);
      const att = {};
      studentList.forEach((s) => {
        att[s.student_id || s._id] = s.hourly_status || Array(7).fill('absent');
      });
      setAttendance(att);
    } catch {
      try {
        const course = courses.find(c => (c._id || c.id) === selectedCourse);
        const batchId = course?.batch_id?._id || course?.batch_id?.id || course?.batch_id;
        if (batchId) {
          const { data } = await API.get(`/admin/batches/${batchId}/students`);
          const studentList = data.data || [];
          setStudents(studentList.map(s => ({ ...s, student_id: s._id || s.id })));
          const att = {};
          studentList.forEach(s => { att[s._id || s.id] = Array(7).fill('absent'); });
          setAttendance(att);
        }
      } catch { /* ignore */ }
    } finally { setLoading(false); }
  };

  const toggleHour = (studentId, hourIdx) => {
    setAttendance(prev => {
      const current = [...(prev[studentId] || Array(7).fill('absent'))];
      current[hourIdx] = current[hourIdx] === 'present' ? 'absent' : 'present';
      return { ...prev, [studentId]: current };
    });
  };

  const markAll = (hourIdx, status) => {
    setAttendance(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(sid => {
        const arr = [...updated[sid]];
        arr[hourIdx] = status;
        updated[sid] = arr;
      });
      return updated;
    });
  };

  const submitAttendance = async () => {
    const records = Object.entries(attendance).map(([student_id, hourly_status]) => ({
      student_id,
      hourly_status,
    }));
    try {
      await API.post('/attendance', { course_id: selectedCourse, date, records });
      toast.success('Attendance saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <p className="label-inst text-cardinal-700">Academic</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Mark attendance</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">Select a course and date to record hourly attendance.</p>
      </div>

      {/* ── Controls ── */}
      <div className="surface-card p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="label-inst text-gray-600">Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          >
            <option value="">Select course</option>
            {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-inst text-gray-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="block mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          />
        </div>
        <button
          onClick={loadStudents}
          disabled={loading}
          className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                     px-6 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                     border border-cardinal-800 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>

      {/* ── Attendance Grid ── */}
      {students.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left label-inst text-gray-500 sticky left-0 bg-gray-50 z-10">
                    Student
                  </th>
                  {HOUR_LABELS.map((label, i) => (
                    <th key={i} className="px-2 py-3 text-center label-inst text-gray-500 min-w-[90px]">
                      <div>{label}</div>
                      <div className="flex gap-1 justify-center mt-1 normal-case tracking-normal font-normal">
                        <button onClick={() => markAll(i, 'present')} className="text-[10px] text-green-700 hover:underline">All P</button>
                        <button onClick={() => markAll(i, 'absent')} className="text-[10px] text-cardinal-700 hover:underline">All A</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const sid = s.student_id || s._id || s.id;
                  return (
                    <tr key={sid} className="hover:bg-cardinal-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {s.name || s.student_id?.name || 'Student'}
                      </td>
                      {HOUR_LABELS.map((_, i) => (
                        <td key={i} className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleHour(sid, i)}
                            className={`w-10 h-10 rounded-md font-semibold text-sm border transition-colors ${
                              attendance[sid]?.[i] === 'present'
                                ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                                : 'bg-cardinal-50 text-cardinal-800 border-cardinal-100 hover:bg-cardinal-100'
                            }`}
                          >
                            {attendance[sid]?.[i] === 'present' ? 'P' : 'A'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={submitAttendance}
              className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                         px-8 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                         border border-cardinal-800 transition-colors"
            >
              Save Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
