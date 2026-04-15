import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlineX, HiOutlineDocumentText } from 'react-icons/hi';

const OD = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  return isStudent ? <StudentOD /> : <TeacherOD />;
};

const StatusBadge = ({ status }) => (
  <span className={`label-inst text-[10px] px-2.5 py-1 rounded-full border ${getStatusColor(status)}`}>
    {status}
  </span>
);

const StudentOD = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', reason: '', course_id: '' });
  const [courses, setCourses] = useState([]);

  useEffect(() => { fetchOD(); }, []);

  const fetchOD = async () => {
    try { const { data } = await API.get('/od/status'); setApplications(data.data); }
    catch { toast.error('Failed to load applications'); }
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
          <p className="label-inst text-cardinal-700">On-Duty</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">OD applications</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Request on-duty leave for approved activities.</p>
        </div>
        <button
          onClick={openForm}
          className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                     px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                     border border-cardinal-800 flex items-center gap-2 transition-colors"
        >
          <HiOutlinePlus className="w-5 h-5" /> Apply
        </button>
      </div>

      {/* ── List ── */}
      {applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map(a => (
            <article key={a._id || a.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg font-semibold text-gray-900">{a.reason}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span>Date: <span className="text-gray-700">{formatDate(a.date)}</span></span>
                    <span>Course: <span className="text-gray-700">{a.course_id?.name || '—'}</span></span>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineDocumentText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No OD applications</p>
          <p className="text-sm text-gray-500 mt-1">Submit a new application to get started.</p>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">On-Duty</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">Apply for OD</h2>
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
                <label className="label-inst text-gray-600">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
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
                <label className="label-inst text-gray-600">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  required
                  rows={4}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none resize-none"
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
                  Submit
                </button>
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
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, status) => {
    try {
      await API.put(`/od/${id}`, { status });
      toast.success(`OD ${status}`);
      fetchApprovals();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
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
      <div>
        <p className="label-inst text-cardinal-700">Faculty</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">OD approvals</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">Review and approve on-duty leave requests.</p>
      </div>

      {applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map(a => (
            <article key={a._id || a.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg font-semibold text-gray-900">{a.student_id?.name || 'Student'}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.reason}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span>Date: <span className="text-gray-700">{formatDate(a.date)}</span></span>
                    <span>Course: <span className="text-gray-700">{a.course_id?.name || '—'}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleAction(a._id || a.id, 'approved')}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-md text-xs font-semibold
                                   uppercase tracking-wide border border-green-800 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(a._id || a.id, 'rejected')}
                        className="bg-white hover:bg-cardinal-50 text-cardinal-700 px-4 py-1.5 rounded-md text-xs font-semibold
                                   uppercase tracking-wide border border-cardinal-300 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <StatusBadge status={a.status} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineDocumentText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No pending requests</p>
          <p className="text-sm text-gray-500 mt-1">You're caught up on approvals.</p>
        </div>
      )}
    </div>
  );
};

export default OD;
