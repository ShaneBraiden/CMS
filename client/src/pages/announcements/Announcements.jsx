import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSpeakerphone, HiOutlineX } from 'react-icons/hi';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', target_audience: 'all' });

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try { const { data } = await API.get('/announcements'); setAnnouncements(data.data); }
    catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        title: item.title,
        content: item.content || item.message || '',
        target_audience: item.target_audience || 'all',
      });
    } else {
      setEditing(null);
      setForm({ title: '', content: '', target_audience: 'all' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/announcements/${editing._id || editing.id}`, form);
        toast.success('Announcement updated');
      } else {
        await API.post('/announcements', form);
        toast.success('Announcement posted');
      }
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await API.delete(`/announcements/${id}`);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch { toast.error('Failed to delete'); }
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
          <p className="label-inst text-cardinal-700">Institutional</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Announcements</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Campus-wide bulletins and notices.</p>
        </div>
        {canManage && (
          <button
            onClick={() => openForm()}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> New
          </button>
        )}
      </div>

      {/* ── List ── */}
      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map(a => (
            <article key={a._id || a.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-1 self-stretch bg-gradient-to-b from-cardinal-400 to-cardinal-700 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-serif text-lg font-semibold text-gray-900">{a.title}</h3>
                    <span className="label-inst text-[10px] px-2 py-0.5 rounded-full bg-cardinal-50 text-cardinal-700 border border-cardinal-100">
                      {a.target_audience || 'all'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{a.content || a.message}</p>
                  <div className="flex gap-4 mt-3 label-inst text-gray-400">
                    <span>By {a.created_by?.name || 'Admin'}</span>
                    <span>·</span>
                    <span>{formatDateTime(a.created_at)}</span>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openForm(a)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id || a.id)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineSpeakerphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No announcements</p>
          <p className="text-sm text-gray-500 mt-1">Nothing has been posted yet.</p>
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
                  {editing ? 'Edit announcement' : 'New announcement'}
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
                <label className="label-inst text-gray-600">Message</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none resize-none"
                />
              </div>
              <div>
                <label className="label-inst text-gray-600">Audience</label>
                <select
                  value={form.target_audience}
                  onChange={e => setForm({ ...form, target_audience: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
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
                  {editing ? 'Update' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
