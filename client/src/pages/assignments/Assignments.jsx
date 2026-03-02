import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import { HiPlus, HiPencil, HiTrash, HiUpload, HiDownload } from 'react-icons/hi';

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
        course_id: assignment.course_id?._id || assignment.course_id || '',
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
        await API.put(`/assignments/${editing._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
        {canManage && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add Assignment
          </button>
        )}
      </div>

      <div className="space-y-4">
        {assignments.map((a) => (
          <div key={a._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.course_id?.name || 'N/A'}</p>
                {a.description && <p className="text-sm text-gray-600 mt-2">{a.description}</p>}
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  {a.due_date && <span>Due: {formatDate(a.due_date)}</span>}
                  <span>Max Marks: {a.max_marks}</span>
                </div>
                {a.file_url && (
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2 hover:underline">
                    <HiDownload className="w-4 h-4" /> Download File
                  </a>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {canManage && (
                  <>
                    <button onClick={() => openForm(a)} className="text-gray-400 hover:text-blue-600"><HiPencil className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(a._id)} className="text-gray-400 hover:text-red-600"><HiTrash className="w-5 h-5" /></button>
                  </>
                )}
                {isStudent && (
                  <button onClick={() => setShowSubmit(a._id)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
                    <HiUpload className="w-4 h-4" /> Submit
                  </button>
                )}
              </div>
            </div>

            {/* Inline submit form */}
            {showSubmit === a._id && (
              <div className="mt-4 pt-4 border-t flex items-center gap-3">
                <input type="file" onChange={(e) => setSubmitFile(e.target.files[0])} className="text-sm" />
                <button onClick={() => handleStudentSubmit(a._id)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">Upload</button>
                <button onClick={() => { setShowSubmit(null); setSubmitFile(null); }} className="text-gray-500 text-sm hover:underline">Cancel</button>
              </div>
            )}
          </div>
        ))}
        {assignments.length === 0 && <p className="text-gray-500 text-center py-8">No assignments found</p>}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                  <input type="number" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                <input type="file" onChange={e => setFile(e.target.files[0])} className="text-sm" />
              </div>
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

export default Assignments;
