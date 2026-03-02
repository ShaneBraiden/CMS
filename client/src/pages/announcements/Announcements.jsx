import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

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
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({ title: item.title, content: item.content || item.message || '', target_audience: item.target_audience || 'all' });
    } else {
      setEditing(null);
      setForm({ title: '', content: '', target_audience: 'all' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/announcements/${editing._id}`, form); toast.success('Updated'); }
      else { await API.post('/announcements', form); toast.success('Created'); }
      setShowForm(false); fetchAnnouncements();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/announcements/${id}`); toast.success('Deleted'); fetchAnnouncements(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
        {canManage && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> New Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-800 text-lg">{a.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.target_audience}</span>
                </div>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{a.content || a.message}</p>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>By: {a.created_by?.name || 'Admin'}</span>
                  <span>{formatDateTime(a.created_at)}</span>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openForm(a)} className="text-gray-400 hover:text-blue-600"><HiPencil className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(a._id)} className="text-gray-400 hover:text-red-600"><HiTrash className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-gray-500 text-center py-8">No announcements</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'New'} Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none" />
              <textarea placeholder="Message" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required rows={4} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="all">All</option><option value="students">Students</option><option value="teachers">Teachers</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
