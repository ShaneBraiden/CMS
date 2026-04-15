import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineAcademicCap,
} from 'react-icons/hi';

const TYPE_STYLES = {
  internal: 'bg-cardinal-50 text-cardinal-700 border-cardinal-100',
  midterm:  'bg-gold-50 text-gold-700 border-gold-100',
  final:    'bg-cardinal-100 text-cardinal-800 border-cardinal-200',
  quiz:     'bg-gray-100 text-gray-700 border-gray-200',
};

const Exams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', course_id: '', date: '', duration: '', venue: '', exam_type: 'internal',
  });
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
      setForm({
        title: exam.title,
        course_id: exam.course_id?._id || exam.course_id?.id || exam.course_id || '',
        date: exam.date?.slice(0, 10) || '',
        duration: exam.duration || '',
        venue: exam.venue || '',
        exam_type: exam.exam_type || 'internal',
      });
    } else {
      setEditing(null);
      setForm({ title: '', course_id: '', date: '', duration: '', venue: '', exam_type: 'internal' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/exams/${editing._id || editing.id}`, form);
        toast.success('Exam updated');
      } else {
        await API.post('/exams', form);
        toast.success('Exam created');
      }
      setShowForm(false);
      fetchExams();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try { await API.delete(`/exams/${id}`); toast.success('Deleted'); fetchExams(); }
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
          <p className="label-inst text-cardinal-700">Examinations</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Exams</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Scheduled internal and end-semester examinations.</p>
        </div>
        {canManage && (
          <button
            onClick={() => openForm()}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Exam
          </button>
        )}
      </div>

      {/* ── List ── */}
      {exams.length > 0 ? (
        <div className="space-y-3">
          {exams.map(exam => {
            const d = exam.date ? new Date(exam.date) : null;
            return (
              <article key={exam._id || exam.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 border border-cardinal-200 bg-cardinal-50 rounded-md flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase text-cardinal-700 tracking-wider">
                      {d ? d.toLocaleDateString('en', { month: 'short' }) : '—'}
                    </span>
                    <span className="font-serif text-2xl font-bold text-cardinal-800 leading-none mt-0.5">
                      {d ? d.getDate() : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-serif text-lg font-semibold text-gray-900">{exam.title}</h3>
                      <span className={`label-inst text-[10px] px-2 py-0.5 rounded-full border ${TYPE_STYLES[exam.exam_type] || TYPE_STYLES.internal}`}>
                        {exam.exam_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{exam.course_id?.name || exam.course_name || '—'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {exam.date && (
                        <span className="flex items-center gap-1.5">
                          <HiOutlineCalendar className="w-3.5 h-3.5" /> {formatDate(exam.date)}
                        </span>
                      )}
                      {exam.duration && (
                        <span className="flex items-center gap-1.5">
                          <HiOutlineClock className="w-3.5 h-3.5" /> {exam.duration} min
                        </span>
                      )}
                      {exam.venue && (
                        <span className="flex items-center gap-1.5">
                          <HiOutlineLocationMarker className="w-3.5 h-3.5" /> {exam.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openForm(exam)}
                        className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam._id || exam.id)}
                        className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineAcademicCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No exams scheduled</p>
          <p className="text-sm text-gray-500 mt-1">Upcoming examinations will appear here.</p>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">{editing ? 'Edit' : 'Create'}</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">
                  {editing ? 'Edit exam' : 'New exam'}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-inst text-gray-600">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
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
                  {courses.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Duration (min)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-inst text-gray-600">Venue</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
              <div>
                <label className="label-inst text-gray-600">Type</label>
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
                </select>
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
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
