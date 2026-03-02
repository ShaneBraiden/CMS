import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { formatDateTime } from '../../utils/helpers';
import { HiOutlineBell, HiCheck } from 'react-icons/hi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const { data } = await API.get('/notifications'); setNotifications(data.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await API.put(`/notifications/${id}/read`); fetchNotifications(); }
    catch { /* ignore */ }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Notifications</h1>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n._id} className={`bg-white rounded-lg shadow-sm border p-4 flex items-start gap-3 ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="p-2 bg-blue-50 rounded-lg">
              <HiOutlineBell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
            </div>
            {!n.read && (
              <button onClick={() => markRead(n._id)} className="text-gray-400 hover:text-green-600" title="Mark as read">
                <HiCheck className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineBell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
