import { useState, useEffect } from 'react';
import { FileText, Search, Download, Trash2, Folder } from 'lucide-react';
import searchService from '../../services/searchService';
import toast from 'react-hot-toast';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      // Reusing SmartSearch API but as admin we'd ideally have an admin specific one to see ALL docs.
      // For mock purposes, using the existing global search service.
      const res = await searchService.globalSearch(search, 0, 50);
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
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><FileText className="w-6 h-6 text-primary"/> Global Document Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Audit and manage all documents across the enterprise</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-72">
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
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4 text-right">Admin Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {d.extension}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{d.displayName}</p>
                          <p className="text-xs text-gray-500 font-mono">{d.id.substring(0,8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{(d.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-6 py-4">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" onClick={() => toast.error('Access Denied: Super Admin required')}>
                        <Trash2 className="w-4 h-4" />
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
