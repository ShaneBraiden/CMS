import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HOUR_LABELS } from '../../utils/constants';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batch_id: '',
    day: 'Monday',
    slots: Array(7).fill({ course_id: '', teacher_id: '' }),
  });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });
  timetable.forEach(t => { if (grouped[t.day]) grouped[t.day].push(t); });

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label-inst text-cardinal-700">Schedule</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Timetable</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Weekly class schedule by hour and day.</p>
        </div>
        {canManage && (
          <button
            onClick={openForm}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Entry
          </button>
        )}
      </div>

      {/* ── Timetable Grid ── */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left label-inst text-gray-500 w-28 sticky left-0 bg-gray-50 z-10">Day</th>
                {HOUR_LABELS.map((h, i) => (
                  <th key={i} className="px-2 py-3 text-center label-inst text-gray-500 min-w-[110px]">{h}</th>
                ))}
                {canManage && <th className="px-2 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS.map(day => {
                const entries = grouped[day] || [];
                const entry = entries[0];
                return (
                  <tr key={day} className="hover:bg-cardinal-50/30 transition-colors">
                    <td className="px-4 py-3 font-serif text-gray-800 font-semibold sticky left-0 bg-white z-10">
                      {day}
                    </td>
                    {HOUR_LABELS.map((_, i) => {
                      const slot = entry?.slots?.[i];
                      return (
                        <td key={i} className="px-2 py-3 text-center align-top">
                          {slot?.course_id ? (
                            <div className="bg-cardinal-50 border border-cardinal-100 rounded-md p-2 text-left">
                              <p className="font-semibold text-cardinal-800 text-xs leading-tight">
                                {slot.course_id?.name || slot.course_id}
                              </p>
                              {slot.teacher_id?.name && (
                                <p className="text-[10px] text-gray-500 mt-1 truncate">{slot.teacher_id.name}</p>
                              )}
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
                          <button
                            onClick={() => handleDelete(entry._id || entry.id)}
                            className="p-1.5 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
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

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-2xl w-full p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Create</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">New timetable entry</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Batch</label>
                  <select
                    value={form.batch_id}
                    onChange={e => setForm({ ...form, batch_id: e.target.value })}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    <option value="">Select batch</option>
                    {batches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-inst text-gray-600">Day</label>
                  <select
                    value={form.day}
                    onChange={e => setForm({ ...form, day: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="label-inst text-cardinal-700">Hour slots</p>
                {HOUR_LABELS.map((label, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
                    <span className="label-inst text-gray-600 w-16 flex-shrink-0">{label}</span>
                    <select
                      value={form.slots[i]?.course_id || ''}
                      onChange={e => updateSlot(i, 'course_id', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                                 focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                    >
                      <option value="">No class</option>
                      {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ))}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
