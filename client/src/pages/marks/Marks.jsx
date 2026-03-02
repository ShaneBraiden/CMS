import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash } from 'react-icons/hi';

const Marks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: '', course_id: '', exam_type: 'internal', marks_obtained: '', max_marks: 100 });
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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Marks</h1>
        {canManage && (
          <button onClick={openForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add Marks
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {canManage && <th className="px-6 py-3 text-left font-medium text-gray-500">Student</th>}
                <th className="px-6 py-3 text-left font-medium text-gray-500">Course</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Exam Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Marks</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Max</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">%</th>
                {canManage && <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {marks.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  {canManage && <td className="px-6 py-4">{m.student_id?.name || 'N/A'}</td>}
                  <td className="px-6 py-4">{m.course_id?.name || 'N/A'}</td>
                  <td className="px-6 py-4 capitalize">{m.exam_type}</td>
                  <td className="px-6 py-4 font-medium">{m.marks_obtained}</td>
                  <td className="px-6 py-4">{m.max_marks}</td>
                  <td className="px-6 py-4">{m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0}%</td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(m._id)} className="text-red-500 hover:text-red-700"><HiTrash className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
              {marks.length === 0 && (
                <tr><td colSpan={canManage ? 7 : 5} className="px-6 py-8 text-center text-gray-500">No marks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Add Marks</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required
                    className="w-full px-3 py-2 border rounded-lg outline-none">
                    <option value="">Select student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              {user?.role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input type="text" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required placeholder="Enter student ID"
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} required
                  className="w-full px-3 py-2 border rounded-lg outline-none">
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none">
                  <option value="internal">Internal</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
                  <input type="number" value={form.marks_obtained} onChange={e => setForm({...form, marks_obtained: e.target.value})} required
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                  <input type="number" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;
