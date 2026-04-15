import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineAcademicCap } from 'react-icons/hi';

const gradeColor = (pct) => {
  if (pct >= 85) return 'bg-green-50 text-green-800 border-green-200';
  if (pct >= 70) return 'bg-gold-50 text-gold-800 border-gold-200';
  if (pct >= 50) return 'bg-cardinal-50 text-cardinal-800 border-cardinal-200';
  return 'bg-red-50 text-red-800 border-red-200';
};

const Marks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_id: '', course_id: '', exam_type: 'internal', marks_obtained: '', max_marks: 100,
  });
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => { fetchMarks(); }, []);

  const fetchMarks = async () => {
    try {
      const { data } = await API.get('/marks');
      setMarks(data.data);
    } catch { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  };

  const openForm = async () => {
    try {
      const { data: cData } = await API.get('/courses');
      setCourses(cData.data);
      if (user?.role === 'admin') {
        const { data: sData } = await API.get('/admin/users?role=student');
        setStudents(sData.data);
      }
    } catch { /* ignore */ }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/marks', form);
      toast.success('Marks added');
      setShowForm(false);
      setForm({ student_id: '', course_id: '', exam_type: 'internal', marks_obtained: '', max_marks: 100 });
      fetchMarks();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mark entry?')) return;
    try { await API.delete(`/marks/${id}`); toast.success('Deleted'); fetchMarks(); }
    catch { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label-inst text-cardinal-700">Academic Record</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Marks</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Examination scores and grades across courses.</p>
        </div>
        {canManage && (
          <button
            onClick={openForm}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Marks
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {canManage && <th className="px-6 py-3 text-left label-inst text-gray-500">Student</th>}
                <th className="px-6 py-3 text-left label-inst text-gray-500">Course</th>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Exam</th>
                <th className="px-6 py-3 text-right label-inst text-gray-500">Obtained</th>
                <th className="px-6 py-3 text-right label-inst text-gray-500">Max</th>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Percentage</th>
                {canManage && <th className="px-6 py-3 text-right label-inst text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marks.map((m) => {
                const pct = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
                return (
                  <tr key={m._id || m.id} className="hover:bg-cardinal-50/30 transition-colors">
                    {canManage && (
                      <td className="px-6 py-4 font-medium text-gray-900">{m.student_id?.name || m.student_name || '—'}</td>
                    )}
                    <td className="px-6 py-4 text-gray-700">{m.course_id?.name || m.course_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="label-inst text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {m.exam_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">{m.marks_obtained}</td>
                    <td className="px-6 py-4 text-right text-gray-500 tabular-nums">{m.max_marks}</td>
                    <td className="px-6 py-4">
                      <span className={`label-inst text-[10px] px-2 py-0.5 rounded-full border ${gradeColor(pct)}`}>
                        {pct}%
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(m._id || m.id)}
                          className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {marks.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 5} className="px-6 py-12 text-center">
                    <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No marks recorded</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Create</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">Add marks</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'admin' && (
                <div>
                  <label className="label-inst text-gray-600">Student</label>
                  <select
                    value={form.student_id}
                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    <option value="">Select student</option>
                    {students.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              {user?.role === 'teacher' && (
                <div>
                  <label className="label-inst text-gray-600">Student ID</label>
                  <input
                    type="text"
                    value={form.student_id}
                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                    required
                    placeholder="Enter student ID"
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="label-inst text-gray-600">Course</label>
                <select
                  value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })}
                  required
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-inst text-gray-600">Exam Type</label>
                <select
                  value={form.exam_type}
                  onChange={e => setForm({ ...form, exam_type: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="internal">Internal</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Obtained</label>
                  <input
                    type="number"
                    value={form.marks_obtained}
                    onChange={e => setForm({ ...form, marks_obtained: e.target.value })}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Max</label>
                  <input
                    type="number"
                    value={form.max_marks}
                    onChange={e => setForm({ ...form, max_marks: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md font-semibold text-sm
                             uppercase tracking-wide text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                             px-4 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                             border border-cardinal-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;
