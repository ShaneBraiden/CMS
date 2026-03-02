import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HOUR_LABELS } from '../../utils/constants';
import { HiPlus, HiTrash } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batch_id: '', day: 'Monday', slots: Array(7).fill({ course_id: '', teacher_id: '' }) });
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    try {
      const { data } = await API.get('/timetable');
      setTimetable(data.data);
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  const openForm = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        API.get('/admin/batches').catch(() => ({ data: { data: [] } })),
        API.get('/courses'),
      ]);
      setBatches(bRes.data.data);
      setCourses(cRes.data.data);
    } catch { /* ignore */ }
    setShowForm(true);
  };

  const updateSlot = (index, field, value) => {
    const newSlots = form.slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setForm({ ...form, slots: newSlots });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/timetable', form);
      toast.success('Timetable saved');
      setShowForm(false);
      fetchTimetable();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this timetable entry?')) return;
    try { await API.delete(`/timetable/${id}`); toast.success('Deleted'); fetchTimetable(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  // Group timetable by day
  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });
  timetable.forEach(t => {
    if (grouped[t.day]) grouped[t.day].push(t);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
        {canManage && (
          <button onClick={openForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add Entry
          </button>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-28">Day</th>
                {HOUR_LABELS.map((h, i) => (
                  <th key={i} className="px-2 py-3 text-center font-medium text-gray-500 min-w-[100px]">{h}</th>
                ))}
                {canManage && <th className="px-2 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {DAYS.map(day => {
                const entries = grouped[day] || [];
                const entry = entries[0]; // one entry per day per batch
                return (
                  <tr key={day} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{day}</td>
                    {HOUR_LABELS.map((_, i) => {
                      const slot = entry?.slots?.[i];
                      return (
                        <td key={i} className="px-2 py-3 text-center">
                          {slot?.course_id ? (
                            <div className="bg-blue-50 rounded-lg p-2">
                              <p className="font-medium text-blue-800 text-xs">{slot.course_id?.name || slot.course_id}</p>
                              {slot.teacher_id?.name && <p className="text-xs text-gray-500 mt-0.5">{slot.teacher_id.name}</p>}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    {canManage && (
                      <td className="px-2 py-3 text-center">
                        {entry && (
                          <button onClick={() => handleDelete(entry._id)} className="text-red-400 hover:text-red-600">
                            <HiTrash className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Timetable Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})} required
                    className="w-full px-3 py-2 border rounded-lg outline-none">
                    <option value="">Select batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select value={form.day} onChange={e => setForm({...form, day: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Hour Slots</p>
                {HOUR_LABELS.map((label, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 w-20">{label}</span>
                    <select value={form.slots[i]?.course_id || ''} onChange={e => updateSlot(i, 'course_id', e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded-lg outline-none text-sm">
                      <option value="">No class</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
