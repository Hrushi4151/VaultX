import { NavLink } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Users, FileText, 
  Settings, Activity, Database, Server
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminSidebar() {
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', end: true },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Documents', icon: FileText, path: '/admin/documents' },
    { label: 'Analytics', icon: Activity, path: '/admin/analytics' },
    { label: 'Storage', icon: Database, path: '/admin/storage' },
    { label: 'Audit Logs', icon: Server, path: '/admin/audit' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full shadow-2xl flex-shrink-0">
      
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <Shield className="w-6 h-6 text-primary" />
          VaultX <span className="text-gray-400 font-normal text-xs uppercase ml-1">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout}
          className="w-full py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-colors font-medium text-sm"
        >
          Exit Admin Portal
        </button>
      </div>

    </div>
  );
}
