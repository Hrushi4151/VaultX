import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, HardDrive, Users,
  Activity, Settings, User, Shield, LogOut, X, Trash2, Folder, Share2, Clock, Bell
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

const navItems = [
  { label: 'Dashboard',  href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Documents',  href: '/dashboard/documents', icon: FileText },
  { label: 'Student Toolkit', href: '/dashboard/bundles', icon: Folder },
  { label: 'PDF Toolkit', href: '/dashboard/pdf-toolkit', icon: FileText },
  { label: 'Temp Files (7D)', href: '/dashboard/temp-storage', icon: Clock },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Secure Shares', href: '/dashboard/shares', icon: Share2 },
  { label: 'Collections',href: '/dashboard/collections', icon: Folder },
  { label: 'Trash',      href: '/dashboard/trash', icon: Trash2 },
  { label: 'Activity',   href: '/dashboard/activity',  icon: Activity, disabled: true },
];

const bottomItems = [
  { label: 'Profile',  href: ROUTES.PROFILE,  icon: User },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
];

/**
 * Dashboard sidebar — fixed left navigation with primary and bottom nav sections.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const NavItem = ({ item }) => (
    item.disabled ? (
      <div className="sidebar-link opacity-50 cursor-not-allowed" title="Coming soon">
        <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
        <span className="ml-auto text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
          Soon
        </span>
      </div>
    ) : (
      <NavLink
        to={item.href}
        end={item.href === ROUTES.DASHBOARD}
        onClick={onClose}
        className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    )
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border shadow-sidebar
          flex flex-col transition-transform duration-250
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none`}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg text-primary">VaultX</span>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:bg-gray-100 transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary navigation">
          <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Main
          </p>
          {navItems.map((item) => <NavItem key={item.label} item={item} />)}

          <div className="divider my-3" />

          <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Account
          </p>
          {bottomItems.map((item) => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              name={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || 'User'}
              </p>
              <p className="text-xs text-text-muted truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
