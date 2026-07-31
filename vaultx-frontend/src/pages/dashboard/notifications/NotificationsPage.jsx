import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Trash2, ShieldAlert, AlertTriangle, FileText, 
  Info, Check, ExternalLink, Loader2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import notificationService from '../../../services/notificationService';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, trash, security

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const [allRes, countRes] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(allRes.data?.data || []);
      setUnreadCount(countRes.data?.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const toastId = toast.loading('Marking all as read...');
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read', { id: toastId });
    } catch (err) {
      toast.error('Failed to mark notifications as read', { id: toastId });
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    const toastId = toast.loading('Clearing notifications...');
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared', { id: toastId });
    } catch (err) {
      toast.error('Failed to clear notifications', { id: toastId });
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TRASH_WARNING':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'SECURITY':
        return <ShieldAlert className="w-5 h-5 text-purple-600" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationBadgeClass = (type) => {
    switch (type) {
      case 'TRASH_WARNING':
        return 'bg-red-50 border-red-100 text-red-700';
      case 'SECURITY':
        return 'bg-purple-50 border-purple-100 text-purple-700';
      case 'DOCUMENT':
        return 'bg-blue-50 border-blue-100 text-blue-700';
      default:
        return 'bg-primary/5 border-primary/10 text-primary';
    }
  };

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread') return !item.read;
    if (filter === 'trash') return item.type === 'TRASH_WARNING';
    if (filter === 'security') return item.type === 'SECURITY';
    return true;
  });

  return (
    <div className="h-full flex flex-col pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-primary" />
            Notifications Center
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Stay updated with document expiries, security alerts, and system activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={fetchNotifications}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-xs text-xs font-bold"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-xs text-xs font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none mb-6 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filter === 'unread'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('trash')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filter === 'trash'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ⚠️ Trash Alerts
        </button>
        <button
          onClick={() => setFilter('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filter === 'security'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🛡️ Security & Activity
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-sm text-gray-500 font-medium">Loading notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No notifications found</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            {filter === 'unread' ? "You have read all notifications!" : "You're all caught up! No active notifications."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-wrap sm:flex-nowrap items-start gap-4 ${
                item.read 
                  ? 'bg-white border-gray-100 opacity-80 hover:opacity-100 hover:border-gray-200' 
                  : 'bg-white border-primary/20 shadow-xs ring-1 ring-primary/5 hover:border-primary/40'
              }`}
            >
              {/* Status Indicator */}
              {!item.read && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-primary/10" />
              )}

              {/* Icon Container */}
              <div className={`p-3 rounded-xl border shrink-0 ${getNotificationBadgeClass(item.type)}`}>
                {getNotificationIcon(item.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6 w-full sm:w-auto">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-bold ${item.read ? 'text-gray-800' : 'text-gray-900'}`}>
                    {item.title}
                  </h4>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  {item.message}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {item.linkUrl && (
                    <span className="text-primary font-bold inline-flex items-center gap-1 group-hover:underline">
                      View details <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-gray-50 mt-2 sm:mt-0 self-center">
                {!item.read && (
                  <button
                    onClick={(e) => handleMarkAsRead(item.id, e)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
