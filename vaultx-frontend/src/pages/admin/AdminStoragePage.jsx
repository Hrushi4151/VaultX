import { useState, useEffect } from 'react';
import { Database, Search, HardDrive } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminStoragePage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminService.getUsers(search, 0, 50),
        adminService.getStats()
      ]);
      setUsers(usersRes.data.content);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to fetch storage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0"/> Storage Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Monitor total and per-user storage consumption</p>
        </div>
      </div>

      {/* Overview Card */}
      {stats && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Enterprise Storage Used</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{formatSize(stats.totalStorageUsed)}</h3>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 self-start sm:self-auto">
            <Database className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by user email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 sm:px-6 py-4">User</th>
                <th className="hidden sm:table-cell px-6 py-4">Documents Count</th>
                <th className="px-4 sm:px-6 py-4 text-right sm:text-left">Storage Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="3" className="px-6 py-8 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-8 text-center">No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs sm:text-base">
                          {u.firstName ? u.firstName[0] : u.username[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 font-medium text-gray-700">{u.totalDocuments || 0}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-500 font-bold text-right sm:text-left text-xs sm:text-sm whitespace-nowrap">
                      {formatSize(u.totalStorageUsed)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
