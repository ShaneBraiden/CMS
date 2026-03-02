import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/helpers';

const OD = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  return isStudent ? <StudentOD /> : <TeacherOD />;
};

const StudentOD = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', reason: '', course_id: '' });
  const [courses, setCourses] = useState([]);

  useEffect(() => { fetchOD(); }, []);

  const fetchOD = async () => {
    try { const { data } = await API.get('/od/status'); setApplications(data.data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const openForm = async () => {
    try { const { data } = await API.get('/courses'); setCourses(data.data); } catch { /* ignore */ }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/od', form);
      toast.success('OD application submitted');
      setShowForm(false);
      setForm({ date: '', reason: '', course_id: '' });
      fetchOD();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">OD Applications</h1>
        <button onClick={openForm} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Apply OD</button>
      </div>

      <div className="space-y-4">
        {applications.map(a => (
          <div key={a._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{a.reason}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>Date: {formatDate(a.date)}</span>
                  <span>Course: {a.course_id?.name || 'N/A'}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(a.status)}`}>{a.status}</span>
            </div>
          </div>
        ))}
        {applications.length === 0 && <p className="text-gray-500 text-center py-8">No OD applications</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Apply for OD</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none" />
              <select value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <textarea placeholder="Reason for OD" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required rows={3} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherOD = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApprovals(); }, []);

  const fetchApprovals = async () => {
    try { const { data } = await API.get('/od/approvals'); setApplications(data.data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, status) => {
    try {
      await API.put(`/od/${id}`, { status });
      toast.success(`OD ${status}`);
      fetchApprovals();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">OD Approvals</h1>
      <div className="space-y-4">
        {applications.map(a => (
          <div key={a._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{a.student_id?.name || 'Student'}</p>
                <p className="text-sm text-gray-600 mt-1">{a.reason}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>Date: {formatDate(a.date)}</span>
                  <span>Course: {a.course_id?.name || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.status === 'pending' ? (
                  <>
                    <button onClick={() => handleAction(a._id, 'approved')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">Approve</button>
                    <button onClick={() => handleAction(a._id, 'rejected')} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700">Reject</button>
                  </>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(a.status)}`}>{a.status}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {applications.length === 0 && <p className="text-gray-500 text-center py-8">No OD requests</p>}
      </div>
    </div>
  );
};

export default OD;
