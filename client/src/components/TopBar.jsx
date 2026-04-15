import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sretLogo from '../assets/sret.png';
import {
  HiOutlineBell, HiOutlineLogout, HiOutlineCog, HiOutlineUser,
  HiOutlineMenu
} from 'react-icons/hi';

/**
 * TopBar — institutional header visible on every authenticated page.
 * Cardinal background with gold hairline, seal + institution text,
 * notification bell, and a user dropdown.
 */
const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const initials = (user?.name || '?')
    .split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-40 no-print">
      {/* Gold hairline on top */}
      <div className="h-[3px] bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />

      <div className="bg-cardinal-100 text-cardinal-900 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left: mobile menu + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <HiOutlineMenu className="w-6 h-6" />
            </button>
            <Link to="/dashboard" className="flex items-center hover:opacity-95 transition-opacity">
              <img src={sretLogo} alt="SRET" className="h-12" />
            </Link>
          </div>

          {/* Center: tagline (desktop) */}
          <div className="hidden xl:block">
            <p className="text-[11px] font-sans uppercase tracking-[0.25em] text-gold-200/80">
              Campus Management System
            </p>
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="p-2 rounded-md hover:bg-white/10 transition-colors relative"
            >
              <HiOutlineBell className="w-5 h-5" />
            </Link>

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-gold-500/90 text-cardinal-900 font-serif font-bold flex items-center justify-center text-sm border border-gold-200/60">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-[13px] font-medium text-white truncate max-w-[140px]">{user?.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gold-200/80 capitalize">{user?.role}</div>
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-cardinal-50 hover:text-cardinal-700 transition-colors">
                    <HiOutlineUser className="w-4 h-4" /> My Profile
                  </Link>
                  <Link to="/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-cardinal-50 hover:text-cardinal-700 transition-colors">
                    <HiOutlineCog className="w-4 h-4" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cardinal-700 hover:bg-cardinal-50 border-t border-gray-100 transition-colors"
                  >
                    <HiOutlineLogout className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
