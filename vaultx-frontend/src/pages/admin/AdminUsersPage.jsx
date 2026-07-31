import { useState, useEffect, useMemo } from 'react';
import { Users, Search, ShieldAlert, CheckCircle, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serverSort, setServerSort] = useState('createdAt,desc');
  
  // Client-side Sorting (for derived fields like Storage)
  const [clientSortConfig, setClientSortConfig] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers(search, 0, 50, statusFilter, serverSort);
      setUsers(res.data.content);
      setClientSortConfig(null); // Reset client sort on new fetch
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add debounce for search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, serverSort]);

  const handleToggleSuspend = async (user) => {
    try {
      if (user.active) {
        await adminService.suspendUser(user.id);
        toast.success(`Suspended ${user.email}`);
      } else {
        await adminService.activateUser(user.id);
        toast.success(`Activated ${user.email}`);
      }
      fetchUsers();
    } catch (err) {
      toast.error('Failed to change user status');
    }
  };

  // Client-side sorting logic
  const handleClientSort = (key) => {
    let direction = 'ascending';
    if (clientSortConfig && clientSortConfig.key === key && clientSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setClientSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    if (clientSortConfig !== null) {
      sortableUsers.sort((a, b) => {
        if (a[clientSortConfig.key] < b[clientSortConfig.key]) {
          return clientSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[clientSortConfig.key] > b[clientSortConfig.key]) {
          return clientSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, clientSortConfig]);

  const renderSortableHeader = (label, key) => (
    <th 
      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
      onClick={() => handleClientSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${clientSortConfig?.key === key ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`} />
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-primary"/> User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform members and security</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-gray-600 font-medium w-full"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
              <select 
                value={serverSort} 
                onChange={(e) => setServerSort(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-gray-600 font-medium w-full"
              >
                <option value="createdAt,desc">Newest First</option>
                <option value="createdAt,asc">Oldest First</option>
                <option value="email,asc">Email (A-Z)</option>
                <option value="firstName,asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 select-none">
              <tr>
                <th className="px-4 sm:px-6 py-4">User</th>
                <th className="px-4 sm:px-6 py-4">Status</th>
                <th className="hidden lg:table-cell">{renderSortableHeader('Documents', 'totalDocuments')}</th>
                <th className="hidden lg:table-cell">{renderSortableHeader('Storage', 'totalStorageUsed')}</th>
                <th className="hidden xl:table-cell">{renderSortableHeader('Links', 'activeSecureLinks')}</th>
                <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No users match the current filters.</td></tr>
              ) : (
                sortedUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${u.deleted ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                          {u.firstName ? u.firstName[0] : u.username[0]}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs sm:text-sm truncate ${u.deleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {u.deleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-bold">
                          <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">Deleted</span>
                        </span>
                      ) : u.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] sm:text-xs font-bold">
                          <CheckCircle className="w-3 h-3" /> <span className="hidden sm:inline">Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/10 text-danger text-[10px] sm:text-xs font-bold">
                          <ShieldAlert className="w-3 h-3" /> <span className="hidden sm:inline">Suspended</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 hidden lg:table-cell">{u.totalDocuments || 0}</td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                      {u.totalStorageUsed ? (u.totalStorageUsed / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 hidden xl:table-cell">{u.activeSecureLinks || 0}</td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {u.deleted ? (
                          <button onClick={() => setActionModal({ type: 'restore', user: u })} className="p-1.5 sm:p-2 text-gray-400 hover:text-success hover:bg-success/10 rounded-lg">
                            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        ) : (
                          <>
                            {u.active ? (
                              <button onClick={() => handleToggleSuspend(u)} className="p-1.5 sm:p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg">
                                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            ) : (
                              <button onClick={() => handleToggleSuspend(u)} className="p-1.5 sm:p-2 text-gray-400 hover:text-success hover:bg-success/10 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                            <button onClick={() => setActionModal({ type: 'delete', user: u })} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
