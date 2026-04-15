import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1b2a3d',
            border: '1px solid #e6e0d6',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(17,24,39,0.08)',
          },
          success: { iconTheme: { primary: '#bf2228', secondary: '#ffffff' } },
          error:   { iconTheme: { primary: '#bf2228', secondary: '#ffffff' } },
        }}
      />

      <TopBar onMenuClick={() => setMobileOpen(true)} />

      <div className="flex">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
