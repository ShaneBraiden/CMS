import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUpload,
  HiOutlineDownload, HiOutlineClipboardList, HiOutlineX, HiOutlineCalendar,
} from 'react-icons/hi';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSubmit, setShowSubmit] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', course_id: '', due_date: '', max_marks: 100 });
  const [file, setFile] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [courses, setCourses] = useState([]);

  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try {
      const { data } = await API.get('/assignments');
      setAssignments(data.data);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  };

  const openForm = async (assignment = null) => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data.data);
    } catch { /* ignore */ }
    if (assignment) {
      setEditing(assignment);
      setForm({
        title: assignment.title,
        description: assignment.description || '',
        course_id: assignment.course_id?._id || assignment.course_id?.id || assignment.course_id || '',
        due_date: assignment.due_date ? assignment.due_date.slice(0, 10) : '',
        max_marks: assignment.max_marks || 100,
      });
    } else {
      setEditing(null);
      setForm({ title: '', description: '', course_id: '', due_date: '', max_marks: 100 });
    }
    setFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append('file', file);
    try {
      if (editing) {
        await API.put(`/assignments/${editing._id || editing.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Assignment updated');
      } else {
        await API.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Assignment created');
      }
      setShowForm(false);
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleStudentSubmit = async (assignmentId) => {
    if (!submitFile) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', submitFile);
    try {
      await API.post(`/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment submitted');
      setShowSubmit(null);
      setSubmitFile(null);
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.error || 'Submission failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try { await API.delete(`/assignments/${id}`); toast.success('Deleted'); fetchAssignments(); }
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
          <p className="label-inst text-cardinal-700">Coursework</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Assignments</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Submissions, due dates, and attachments.</p>
        </div>
        {canManage && (
          <button
            onClick={() => openForm()}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Assignment
          </button>
        )}
      </div>

      {/* ── List ── */}
      {assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a) => {
            const id = a._id || a.id;
            const overdue = a.due_date && new Date(a.due_date) < new Date();
            return (
              <article key={id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-serif text-lg font-semibold text-gray-900">{a.title}</h3>
                      {overdue && (
                        <span className="label-inst text-[10px] px-2 py-0.5 rounded-full bg-cardinal-50 text-cardinal-700 border border-cardinal-100">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{a.course_id?.name || a.course_name || '—'}</p>
                    {a.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                      {a.due_date && (
                        <span className="flex items-center gap-1.5">
                          <HiOutlineCalendar className="w-3.5 h-3.5" /> Due {formatDate(a.due_date)}
                        </span>
                      )}
                      <span>Max: <span className="text-gray-700 font-medium">{a.max_marks}</span></span>
                    </div>
                    {a.file_url && (
                      <a
                        href={a.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-cardinal-700 hover:text-cardinal-900 text-xs font-semibold uppercase tracking-wide mt-3"
                      >
                        <HiOutlineDownload className="w-4 h-4" /> Download attachment
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-1 flex-shrink-0">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openForm(a)}
                          className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isStudent && (
                      <button
                        onClick={() => setShowSubmit(id)}
                        className="bg-cardinal-700 hover:bg-cardinal-800 text-white px-3 py-1.5 rounded-md
                                   text-xs font-semibold uppercase tracking-wide border border-cardinal-800
                                   flex items-center gap-1.5 transition-colors"
                      >
                        <HiOutlineUpload className="w-4 h-4" /> Submit
                      </button>
                    )}
                  </div>
                </div>

                {showSubmit === id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      onChange={(e) => setSubmitFile(e.target.files[0])}
                      className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300
                                 file:bg-white file:text-gray-700 file:font-medium file:text-xs file:uppercase file:tracking-wide
                                 hover:file:bg-gray-50"
                    />
                    <button
                      onClick={() => handleStudentSubmit(id)}
                      className="bg-cardinal-700 hover:bg-cardinal-800 text-white px-4 py-1.5 rounded-md
                                 text-xs font-semibold uppercase tracking-wide border border-cardinal-800 transition-colors"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => { setShowSubmit(null); setSubmitFile(null); }}
                      className="text-gray-500 text-xs font-semibold uppercase tracking-wide hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No assignments</p>
          <p className="text-sm text-gray-500 mt-1">New coursework will appear here.</p>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-lg w-full p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">{editing ? 'Edit' : 'Create'}</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">
                  {editing ? 'Edit assignment' : 'New assignment'}
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
                  {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-inst text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Due date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Max marks</label>
                  <input
                    type="number"
                    value={form.max_marks}
                    onChange={e => setForm({ ...form, max_marks: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-inst text-gray-600">Attachment (optional)</label>
                <input
                  type="file"
                  onChange={e => setFile(e.target.files[0])}
                  className="block mt-1.5 text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300
                             file:bg-white file:text-gray-700 file:font-medium file:text-xs file:uppercase file:tracking-wide
                             hover:file:bg-gray-50"
                />
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

export default Assignments;
