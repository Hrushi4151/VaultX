import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, Edit3, X, Check, FileText, Search, ChevronRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import collectionService from '../../../services/collectionService';

const COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-700',
];

function getColor(index) {
  return COLORS[index % COLORS.length];
}

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await collectionService.getCollections();
      setCollections(res.data);
    } catch (err) {
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Please enter a collection name'); return; }
    setIsCreating(true);
    try {
      const res = await collectionService.createCollection(newName.trim(), newDesc.trim());
      setCollections(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
      toast.success('Collection created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await collectionService.deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
      toast.success('Collection deleted');
    } catch (err) {
      toast.error('Failed to delete collection');
    }
  };

  const filteredCollections = collections.map(col => {
    if (!searchQuery.trim()) return { ...col, matchingDocs: [] };
    const query = searchQuery.toLowerCase().trim();

    // Check if collection name or description matches
    const nameMatches = col.name?.toLowerCase().includes(query) || col.description?.toLowerCase().includes(query);

    // Find inner files inside this collection that match the query
    const matchingDocs = (col.documents || []).filter(doc => 
      doc.displayName?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query) ||
      doc.originalFileName?.toLowerCase().includes(query)
    );

    const isMatch = nameMatches || matchingDocs.length > 0;
    return isMatch ? { ...col, matchingDocs } : null;
  }).filter(Boolean);

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle mt-1">Organize your documents into named groups.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections & inner files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors font-medium shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/30 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <Layers className="w-12 h-12 text-primary/60" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Collections Yet</h3>
          <p className="text-gray-500 max-w-sm mb-8">
            Collections let you group related documents together. Create your first one to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Collection
          </button>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">No Matching Collections or Files</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            No collection or inner file matched <strong>"{searchQuery}"</strong>. Try a different keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filteredCollections.map((col, idx) => (
            <div
              key={col.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
              onClick={() => navigate(`/dashboard/collections/${col.id}`)}
            >
              <div>
                {/* Gradient top bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${getColor(idx)}`} />
                
                <div className="p-3 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${getColor(idx)} flex items-center justify-center shadow-md`}>
                      <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(col.id); }}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-800 text-sm sm:text-lg mb-1 truncate">{col.name}</h3>
                  {col.description && (
                    <p className="text-gray-500 text-[10px] sm:text-sm line-clamp-2 mb-2 sm:mb-3">{col.description}</p>
                  )}

                  {/* Matching Inner Files Indicator */}
                  {col.matchingDocs && col.matchingDocs.length > 0 && (
                    <div className="mt-3 bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5 space-y-1 animate-in fade-in">
                      <div className="text-[11px] font-extrabold text-purple-700 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-purple-600 flex-shrink-0" />
                        {col.matchingDocs.length} matching file{col.matchingDocs.length > 1 ? 's' : ''} inside:
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                        {col.matchingDocs.map(doc => (
                          <div key={doc.id} className="text-[11px] font-bold text-gray-800 truncate flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-lg border border-purple-100">
                            <FileText className="w-3 h-3 text-purple-500 flex-shrink-0" />
                            <span className="truncate">{doc.displayName || doc.fileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 sm:p-5 pt-0 sm:pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5 truncate pr-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{col.documentCount} doc{col.documentCount !== 1 ? 's' : ''}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">New Collection</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Collection Name *</label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Work Documents, Tax Files..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white outline-none transition-colors font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (optional)</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What's in this collection?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white outline-none transition-colors resize-none font-medium"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-70">
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Collection?</h3>
            <p className="text-gray-500 text-sm mb-6">The collection will be deleted. Your documents won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-danger text-white font-bold rounded-xl hover:bg-danger/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
