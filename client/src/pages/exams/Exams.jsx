import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

const Exams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', course_id: '', date: '', duration: '', venue: '', exam_type: 'internal' });
  const [courses, setCourses] = useState([]);

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try { const { data } = await API.get('/exams'); setExams(data.data); }
    catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const openForm = async (exam = null) => {
    try { const { data } = await API.get('/courses'); setCourses(data.data); } catch { /* ignore */ }
    if (exam) {
      setEditing(exam);
      setForm({ title: exam.title, course_id: exam.course_id?._id || '', date: exam.date?.slice(0, 10) || '', duration: exam.duration || '', venue: exam.venue || '', exam_type: exam.exam_type || 'internal' });
    } else {
      setEditing(null);
      setForm({ title: '', course_id: '', date: '', duration: '', venue: '', exam_type: 'internal' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/exams/${editing._id}`, form); toast.success('Updated'); }
      else { await API.post('/exams', form); toast.success('Created'); }
      setShowForm(false); fetchExams();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/exams/${id}`); toast.success('Deleted'); fetchExams(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
        {canManage && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add Exam
          </button>
        )}
      </div>

      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam._id} className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{exam.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{exam.course_id?.name || 'N/A'}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                {exam.date && <span>Date: {formatDate(exam.date)}</span>}
                {exam.duration && <span>Duration: {exam.duration} min</span>}
                {exam.venue && <span>Venue: {exam.venue}</span>}
                <span className="capitalize">Type: {exam.exam_type}</span>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <button onClick={() => openForm(exam)} className="text-gray-400 hover:text-blue-600"><HiPencil className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(exam._id)} className="text-gray-400 hover:text-red-600"><HiTrash className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}
        {exams.length === 0 && <p className="text-gray-500 text-center py-8">No exams scheduled</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Exam' : 'Add Exam'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Exam Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none" />
              <select value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-3 py-2 border rounded-lg outline-none" />
                <input type="number" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="px-3 py-2 border rounded-lg outline-none" />
              </div>
              <input type="text" placeholder="Venue" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <select value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="internal">Internal</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
