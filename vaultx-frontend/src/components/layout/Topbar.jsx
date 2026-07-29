import { useState } from 'react';
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

/**
 * Dashboard top bar — hamburger, page title, notifications, and user menu.
 */
export default function Topbar({ onMenuToggle, pageTitle = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User'
    : 'User';

  const dropdownItems = [
    {
      label: 'Profile',
      icon: User,
      onClick: () => navigate(ROUTES.PROFILE),
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate(ROUTES.SETTINGS),
    },
    { divider: true },
    {
      label: 'Sign Out',
      icon: LogOut,
      danger: true,
      onClick: logout,
    },
  ];

  const triggerEl = (
    <button
      type="button"
      className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
      aria-label="Open user menu"
      aria-haspopup="true"
    >
      <Avatar name={userName} size="sm" />
      <span className="hidden sm:block text-sm font-medium text-text-primary max-w-[120px] truncate">
        {userName}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" aria-hidden="true" />
    </button>
  );

  return (
    <header className="h-16 bg-white border-b border-border shadow-topbar flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/notifications')}
            className="relative p-2 rounded-lg text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"
              aria-hidden="true"
            />
          </button>

          <Dropdown trigger={triggerEl} items={dropdownItems} placement="right" />
        </div>
      </div>
    </header>
  );
}
