import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getAttendanceColor } from '../../utils/helpers';
import { HOUR_LABELS } from '../../utils/constants';

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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  // Student view – attendance percentages per course
  if (isStudent) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Attendance</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(data) && data.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800">{item.courseName || 'Course'}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.present || 0} / {item.total || 0} classes</span>
                <span className={`text-lg font-bold px-3 py-1 rounded-lg ${getAttendanceColor(item.percentage || 0)}`}>
                  {item.percentage || 0}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}></div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && <p className="text-gray-500 col-span-3 text-center py-8">No attendance records found</p>}
        </div>
      </div>
    );
  }

  // Teacher view – redirect to MarkAttendance
  return <MarkAttendance />;
};

// ─── Teacher Mark Attendance ───
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

      // Initialize attendance grid
      const att = {};
      studentList.forEach((s) => {
        att[s.student_id || s._id] = s.hourly_status || Array(7).fill('absent');
      });
      setAttendance(att);
    } catch {
      // If no history, load students from course batch
      try {
        const course = courses.find(c => c._id === selectedCourse);
        if (course?.batch_id) {
          const { data } = await API.get(`/admin/batches/${course.batch_id._id || course.batch_id}/students`);
          const studentList = data.data || [];
          setStudents(studentList.map(s => ({ ...s, student_id: s._id })));
          const att = {};
          studentList.forEach(s => { att[s._id] = Array(7).fill('absent'); });
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mark Attendance</h1>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none min-w-[200px]">
            <option value="">Select course</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none" />
        </div>
        <button onClick={loadStudents} disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {/* Attendance Grid */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 sticky left-0 bg-gray-50">Student</th>
                  {HOUR_LABELS.map((label, i) => (
                    <th key={i} className="px-2 py-3 text-center font-medium text-gray-500 min-w-[80px]">
                      <div>{label}</div>
                      <div className="flex gap-1 justify-center mt-1">
                        <button onClick={() => markAll(i, 'present')} className="text-xs text-green-600 hover:underline">All P</button>
                        <button onClick={() => markAll(i, 'absent')} className="text-xs text-red-600 hover:underline">All A</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => {
                  const sid = s.student_id || s._id;
                  return (
                    <tr key={sid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium sticky left-0 bg-white">{s.name || s.student_id?.name || 'Student'}</td>
                      {HOUR_LABELS.map((_, i) => (
                        <td key={i} className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleHour(sid, i)}
                            className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                              attendance[sid]?.[i] === 'present'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
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
          <div className="p-4 border-t flex justify-end">
            <button onClick={submitAttendance} className="bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 font-medium">
              Save Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
