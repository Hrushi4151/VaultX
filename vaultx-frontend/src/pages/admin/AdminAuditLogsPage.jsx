import { useState, useEffect } from 'react';
import { Server, Search, AlertTriangle, ShieldCheck, Info, RefreshCw, LogIn, LogOut, Key, User } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');

  const fetchLogs = () => {
    setIsLoading(true);
    adminService.getAuditLogs()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = !search || 
      log.event?.toLowerCase().includes(search.toLowerCase()) || 
      log.user?.toLowerCase().includes(search.toLowerCase()) ||
      log.desc?.toLowerCase().includes(search.toLowerCase()) ||
      log.name?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const getLevelIcon = (level) => {
    switch (level) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <ShieldCheck className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventIcon = (event) => {
    switch (event) {
      case 'LOGIN': return <LogIn className="w-3.5 h-3.5" />;
      case 'LOGOUT': return <LogOut className="w-3.5 h-3.5" />;
      case 'PASSWORD_CHANGED':
      case 'PIN_CHANGED': return <Key className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-200';
      case 'WARN': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'INFO': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getEventBadge = (event) => {
    if (event?.includes('LOGIN')) return 'bg-green-50 text-green-700 border-green-200';
    if (event?.includes('LOGOUT')) return 'bg-gray-50 text-gray-600 border-gray-200';
    if (event?.includes('PASSWORD') || event?.includes('PIN')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const levelCounts = {
    ALL: logs.length,
    INFO: logs.filter(l => l.level === 'INFO').length,
    WARN: logs.filter(l => l.level === 'WARN').length,
    CRITICAL: logs.filter(l => l.level === 'CRITICAL').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0"/> System Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Comprehensive telemetry and event tracking</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Level filter chips */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${activeFilter === 'ALL' ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
        >
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> All Logs
        </button>
        {Object.keys(levelCounts).map(level => (
          <button 
            key={level}
            onClick={() => setActiveFilter(level)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${activeFilter === level ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {level} <span className="ml-1 opacity-70">({levelCounts[level]})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by event, user, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
          <span className="text-xs sm:text-sm text-gray-400 self-end sm:self-auto">{filteredLogs.length} events</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-4 sm:px-6 py-4">Timestamp</th>
                  <th className="hidden sm:table-cell px-6 py-4">Level</th>
                  <th className="px-4 sm:px-6 py-4">Event</th>
                  <th className="px-4 sm:px-6 py-4">Actor</th>
                  <th className="hidden lg:table-cell px-6 py-4">IP Address</th>
                  <th className="hidden xl:table-cell px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Server className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No audit logs match your search.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-gray-50 font-mono text-xs transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-gray-400 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${getLevelBadge(log.level)} font-bold`}>
                          {getLevelIcon(log.level)} {log.level}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border ${getEventBadge(log.event)} font-bold text-[10px] sm:text-xs`}>
                          {getEventIcon(log.event)} <span className="truncate max-w-[100px] sm:max-w-none">{log.event?.replace(/_/g, ' ')}</span>
                        </span>
                        <div className="sm:hidden mt-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${getLevelBadge(log.level)} font-bold text-[8px]`}>
                            {log.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="truncate max-w-[120px] sm:max-w-none">
                          <p className="text-primary font-semibold truncate">{log.name || log.user}</p>
                          {log.name && log.name !== log.user && (
                            <p className="text-gray-400 text-[10px] sm:text-xs truncate">{log.user}</p>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-gray-500 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4">
                        <p className="truncate max-w-xs text-gray-500" title={log.description}>{log.description}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
