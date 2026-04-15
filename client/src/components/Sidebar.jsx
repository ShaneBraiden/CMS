import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/constants';
import API from '../api/axios';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboard,
  HiOutlinePencil, HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineDocumentText, HiOutlineSpeakerphone, HiOutlineBadgeCheck,
  HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineCog, HiOutlineBell,
  HiOutlineX, HiOutlineCollection
} from 'react-icons/hi';

const iconMap = {
  HiOutlineHome, HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboard,
  HiOutlinePencil, HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineDocumentText, HiOutlineSpeakerphone, HiOutlineBadgeCheck,
  HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineCog, HiOutlineCollection,
};

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const navItems = NAV_ITEMS[user?.role] || [];

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await API.get('/notifications/unread-count');
        setUnread(data.data || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  const NavLink = ({ item }) => {
    const Icon = iconMap[item.icon] || HiOutlineHome;
    const isActive = location.pathname === item.path;
    const isNotif = item.path === '/notifications';
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`group relative flex items-center gap-3 pl-5 pr-4 py-2.5 text-[13px] font-medium transition-all ${
          isActive
            ? 'text-cardinal-700 bg-cardinal-50'
            : 'text-gray-600 hover:text-cardinal-700 hover:bg-cardinal-50/40'
        }`}
      >
        {/* Gold active indicator bar */}
        <span
          aria-hidden
          className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
            isActive ? 'bg-gradient-to-b from-gold-400 to-gold-600' : 'bg-transparent group-hover:bg-gold-300/50'
          }`}
        />
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-cardinal-600' : 'text-gray-400 group-hover:text-cardinal-500'}`} />
        <span className="truncate">{item.label}</span>
        {isNotif && unread > 0 && (
          <span className="ml-auto bg-cardinal-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Role label */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-200">
        <p className="label-inst">{user?.role} Portal</p>
        <p className="font-serif text-lg text-gray-900 mt-0.5 truncate">{user?.name}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-5 pb-2">
          <p className="label-inst text-gray-400">Navigation</p>
        </div>
        <div className="space-y-0.5">
          {navItems.map(item => <NavLink key={item.path} item={item} />)}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-4">
        <div className="divider-gold mb-3" />
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <span className="font-serif font-semibold text-gray-700">SRI RAMACHANDRA</span><br />
          Engineering and Technology<br />
          Campus Management System
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 bg-white border-r border-gray-200 sticky top-16 self-start h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 shadow-xl transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 bg-gradient-to-r from-cardinal-700 to-cardinal-800 text-white">
          <span className="font-serif font-semibold tracking-wide">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-white/10">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
