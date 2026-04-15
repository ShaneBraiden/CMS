import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { formatDateTime } from '../../utils/helpers';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi';

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

  const markAllRead = async () => {
    try { await API.put('/notifications/read-all'); fetchNotifications(); }
    catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label-inst text-cardinal-700">Updates</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Notifications</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-semibold text-cardinal-700 hover:text-cardinal-900 uppercase tracking-wider"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ── List ── */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(n => (
            <article
              key={n._id || n.id}
              className={`surface-card p-4 flex items-start gap-4 transition-colors hover:border-cardinal-300 ${
                !n.read ? 'border-l-[3px] border-l-cardinal-600' : ''
              }`}
            >
              <div className={`p-2.5 rounded-md border ${
                !n.read
                  ? 'bg-cardinal-50 text-cardinal-700 border-cardinal-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                <HiOutlineBell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {n.message}
                </p>
                <p className="label-inst text-gray-400 mt-1.5">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n._id || n.id)}
                  title="Mark as read"
                  className="text-gray-400 hover:text-cardinal-700 p-1 transition-colors"
                >
                  <HiOutlineCheck className="w-5 h-5" />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineBell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No notifications</p>
          <p className="text-sm text-gray-500 mt-1">You're all caught up.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
