import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import { HiPlus, HiCalendar } from 'react-icons/hi';

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
    catch { toast.error('Failed'); }
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
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Events</h1>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <HiCalendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  {event.date && <p>Date: {formatDate(event.date)}</p>}
                  {event.venue && <p>Venue: {event.venue}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">No events</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Add Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <input type="text" placeholder="Venue" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
