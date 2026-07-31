import { useState, useEffect } from 'react';
import { FileText, Search, Download, Trash2, Folder } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getDocuments(search, 0, 50);
      setDocuments(res.data.content);
    } catch (err) {
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0"/> Global Document Registry
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Audit and manage all documents across the enterprise</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search across all user vaults..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 sm:px-6 py-4">Document</th>
                <th className="px-4 sm:px-6 py-4">Owner</th>
                <th className="hidden sm:table-cell px-6 py-4">Size</th>
                <th className="hidden md:table-cell px-6 py-4">Uploaded</th>
                <th className="px-4 sm:px-6 py-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center">No documents found.</td></tr>
              ) : (
                documents.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] sm:text-sm shrink-0">
                          {d.extension}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{d.displayName}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">{d.id.substring(0,8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm text-gray-700 truncate max-w-[100px] sm:max-w-none">{d.ownerEmail}</td>
                    <td className="hidden sm:table-cell px-6 py-4">{(d.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="hidden md:table-cell px-6 py-4">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 sm:p-2 rounded-lg" onClick={() => toast.error('Access Denied: Super Admin required')}>
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
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
