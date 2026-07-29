import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderHeart, FileText, Trash2, MoreVertical, Copy, Star, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import bundleService from '../../../services/bundleService';

export default function BundlesPage() {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBundles = async () => {
    setIsLoading(true);
    try {
      const res = await bundleService.getUserBundles();
      setBundles(res.data.content || []);
    } catch (err) {
      toast.error('Failed to load bundles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleAction = async (e, action, bundle) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    
    try {
      switch (action) {
        case 'duplicate':
          await bundleService.duplicateBundle(bundle.id);
          toast.success('Bundle duplicated');
          fetchBundles();
          break;
        case 'favorite':
          await bundleService.toggleFavourite(bundle.id);
          toast.success(bundle.favourite ? 'Removed from favourites' : 'Added to favourites');
          fetchBundles();
          break;
        case 'archive':
          if (window.confirm(`Archive "${bundle.name}"?`)) {
            await bundleService.archiveBundle(bundle.id);
            toast.success('Bundle archived');
            fetchBundles();
          }
          break;
        case 'delete':
          if (window.confirm(`Permanently delete "${bundle.name}"?`)) {
            await bundleService.deleteBundle(bundle.id);
            toast.success('Bundle deleted');
            fetchBundles();
          }
          break;
      }
    } catch (err) {
      toast.error(`Failed to perform action`);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredBundles = bundles.filter(b => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatches = b.name?.toLowerCase().includes(query);
    const descMatches = b.description?.toLowerCase().includes(query);
    const docMatches = (b.documents || []).some(doc => 
      doc.displayName?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query)
    );
    return nameMatches || descMatches || docMatches;
  });

  return (
    <div className="h-full flex flex-col space-y-8 pb-8">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Student Toolkit (Bundles)</h1>
          <p className="page-subtitle mt-1">
            Organize documents into reusable smart bundles for placements, higher ed, and more.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-medium shadow-xs"
            />
          </div>

          <Link 
            to="/dashboard/bundles/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-bold text-sm shadow-sm flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            Create Bundle
          </Link>
        </div>
      </div>

      {/* User Bundles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Your Bundles ({filteredBundles.length})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : bundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FolderHeart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No bundles yet</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Create your first smart bundle to effortlessly group and export related documents.
            </p>
            <Link 
              to="/dashboard/bundles/create"
              className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Bundle
            </Link>
          </div>
        ) : filteredBundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No matching bundles found</h3>
            <p className="text-gray-500 max-w-sm mb-4">
              No bundles matched <strong>"{searchQuery}"</strong>. Try a different search term.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBundles.map((bundle) => (
              <div 
                key={bundle.id}
                onClick={() => navigate(`/dashboard/bundles/${bundle.id}`)}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col h-full"
              >
                {bundle.favourite && (
                  <div className="absolute top-4 left-4 z-10">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                )}
                
                <div className="absolute top-3 right-3 z-10">
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === bundle.id ? null : bundle.id); }}
                      className="p-1.5 bg-white/80 backdrop-blur shadow-sm rounded-lg text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeMenu === bundle.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                        <button onClick={(e) => handleAction(e, 'favorite', bundle)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Star className="w-4 h-4"/> {bundle.favourite ? 'Unfavourite' : 'Favourite'}</button>
                        <button onClick={(e) => handleAction(e, 'duplicate', bundle)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Copy className="w-4 h-4"/> Duplicate</button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button onClick={(e) => handleAction(e, 'archive', bundle)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FolderHeart className="w-4 h-4"/> Archive</button>
                        <button onClick={(e) => handleAction(e, 'delete', bundle)} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`w-12 h-12 rounded-xl mb-4 text-white flex items-center justify-center shadow-sm ${bundle.color || 'bg-gray-800'}`}>
                  <FolderHeart className="w-6 h-6" />
                </div>
                
                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate pr-8">{bundle.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">
                  {bundle.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-4 border-t border-gray-50 mt-auto">
                  <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                    <FileText className="w-3.5 h-3.5" />
                    {bundle.documents?.length || 0} Docs
                  </span>
                  <span>{formatSize(bundle.totalFileSize)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
