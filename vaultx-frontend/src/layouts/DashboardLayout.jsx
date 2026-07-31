import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ChatWidget from '../components/chat/ChatWidget';
import useAutoLock from '../hooks/useAutoLock';
import PrivacyLockOverlay from '../components/auth/PrivacyLockOverlay';

const pageTitles = {
  '/dashboard':         'Dashboard',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings':'Settings',
};

/**
 * Dashboard layout — fixed sidebar + scrollable main content area.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';
  
  // Vault Privacy Auto-Lock Hook (Dynamic timeout from Settings)
  const { isLocked, unlockVault } = useAutoLock();

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatWidget />
      
      {/* Auto-Lock Overlay */}
      {isLocked && <PrivacyLockOverlay onUnlock={unlockVault} />}
    </div>
  );
}
