import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/constants';
import API from '../api/axios';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboard,
  HiOutlinePencil, HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineDocumentText, HiOutlineSpeakerphone, HiOutlineBadgeCheck,
  HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineCog,
  HiOutlineBell, HiOutlineLogout, HiOutlineMenu, HiOutlineX,
  HiOutlineCollection
} from 'react-icons/hi';

const iconMap = {
  HiOutlineHome, HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboard,
  HiOutlinePencil, HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineDocumentText, HiOutlineSpeakerphone, HiOutlineBadgeCheck,
  HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineCog, HiOutlineCollection,
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = NAV_ITEMS[user?.role] || [];

  // Poll unread notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await API.get('/notifications/unread-count');
        setUnreadCount(data.data);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink = ({ item, isCollapsed = false }) => {
    const Icon = iconMap[item.icon] || HiOutlineHome;
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        title={isCollapsed ? item.label : ''}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${isCollapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (isCollapsed = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`border-b ${isCollapsed ? 'p-4 flex justify-center' : 'p-6'}`}>
        {isCollapsed ? (
          <h1 className="text-xl font-bold text-blue-600">C</h1>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-800">CMS Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role} Panel</p>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto space-y-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className={`border-t space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <Link
          to="/notifications"
          onClick={() => setMobileOpen(false)}
          title={isCollapsed ? 'Notifications' : ''}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isCollapsed ? 'justify-center px-2' : ''}`}
        >
          <div className="relative">
            <HiOutlineBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!isCollapsed && <span>Notifications</span>}
        </Link>

        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full ${isCollapsed ? 'justify-center px-2' : ''}`}
        >
          <HiOutlineLogout className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-30 transition-all duration-300 ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors z-40"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default Sidebar;
