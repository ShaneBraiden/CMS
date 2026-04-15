import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineX } from 'react-icons/hi';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '' });

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try { const { data } = await API.get('/events'); setEvents(data.data); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/events', form);
      toast.success('Event created');
      setShowForm(false);
      setForm({ title: '', description: '', date: '', venue: '' });
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
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
          <p className="label-inst text-cardinal-700">Campus Calendar</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Events</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Symposia, workshops, and institutional events.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Event
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(event => {
            const d = event.date ? new Date(event.date) : null;
            return (
              <article key={event._id || event.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 border border-cardinal-200 bg-cardinal-50 rounded-md flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase text-cardinal-700 tracking-wider">
                      {d ? d.toLocaleDateString('en', { month: 'short' }) : '—'}
                    </span>
                    <span className="font-serif text-2xl font-bold text-cardinal-800 leading-none mt-0.5">
                      {d ? d.getDate() : ''}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-gray-900 leading-tight">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
                    )}
                    <div className="mt-3 space-y-1">
                      {event.date && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HiOutlineCalendar className="w-3.5 h-3.5" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                      )}
                      {event.venue && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineCalendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No events scheduled</p>
          <p className="text-sm text-gray-500 mt-1">Check back soon for upcoming campus events.</p>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Create</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">New event</h2>
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
                <label className="label-inst text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="label-inst text-gray-600">Venue</label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
