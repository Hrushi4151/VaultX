import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen, ArrowLeft, Plus, X, Trash2, Edit3, Check,
  Search, FileText, Image as ImageIcon, File, Loader2, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import collectionService from '../../../services/collectionService';
import documentService from '../../../services/documentService';

function DocIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Add docs panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [allDocs, setAllDocs] = useState([]);
  const [docsSearch, setDocsSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Remove doc
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => { fetchCollection(); }, [id]);

  const fetchCollection = async () => {
    setIsLoading(true);
    try {
      const res = await collectionService.getCollection(id);
      setCollection(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
    } catch {
      toast.error('Collection not found');
      navigate('/dashboard/collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRename = async () => {
    if (!editName.trim()) return;
    setIsSavingRename(true);
    try {
      const res = await collectionService.renameCollection(id, editName.trim(), editDesc.trim());
      setCollection(res.data);
      setIsRenaming(false);
      toast.success('Collection updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setIsSavingRename(false);
    }
  };

  const handleCancelRename = () => {
    setEditName(collection.name);
    setEditDesc(collection.description || '');
    setIsRenaming(false);
  };

  const openAddPanel = async () => {
    setShowAddPanel(true);
    setSelectedToAdd([]);
    setDocsSearch('');
    try {
      const res = await documentService.getActiveDocuments(0, 200);
      const collectionDocIds = new Set((collection?.documents || []).map(d => d.id));
      setAllDocs(res.data.content.filter(d => !collectionDocIds.has(d.id)));
    } catch {
      toast.error('Failed to load documents');
    }
  };

  const toggleDocSelect = (docId) => {
    setSelectedToAdd(prev =>
      prev.includes(docId) ? prev.filter(x => x !== docId) : [...prev, docId]
    );
  };

  const handleAddDocs = async () => {
    if (!selectedToAdd.length) return;
    setIsAdding(true);
    try {
      await collectionService.addDocuments(id, selectedToAdd);
      await fetchCollection();
      setShowAddPanel(false);
      toast.success(`${selectedToAdd.length} document(s) added!`);
    } catch {
      toast.error('Failed to add documents');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDoc = async (docId) => {
    setRemovingId(docId);
    try {
      await collectionService.removeDocument(id, docId);
      setCollection(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== docId),
        documentCount: prev.documentCount - 1,
      }));
      toast.success('Document removed from collection');
    } catch {
      toast.error('Failed to remove document');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredDocs = allDocs.filter(d =>
    d.displayName?.toLowerCase().includes(docsSearch.toLowerCase())
  );

  const filteredCollectionDocs = (collection?.documents || []).filter(d =>
    d.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async () => {
    if (!collection?.documents?.length) return;
    setIsDownloading(true);
    try {
      const res = await collectionService.downloadCollection(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${collection.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download collection');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard/collections')}
          className="mt-1 p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-2xl font-bold text-gray-800 bg-white border-b-2 border-primary outline-none w-full"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') handleCancelRename(); }}
              />
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm text-gray-500 bg-white border-b border-gray-200 outline-none w-full"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSaveRename}
                  disabled={isSavingRename}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:bg-success/90 transition-colors disabled:opacity-70"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingRename ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancelRename} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-primary" />
                  <h1 className="text-2xl font-bold text-gray-800">{collection.name}</h1>
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                {collection.description && (
                  <p className="text-gray-500 text-sm mt-0.5 ml-8">{collection.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={isDownloading || !collection?.documents?.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors shadow-sm disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </button>
          <button
            onClick={openAddPanel}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/30"
          >
            <Plus className="w-4 h-4" />
            Add Documents
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
        <FileText className="w-4 h-4" />
        <span>{collection.documentCount} document{collection.documentCount !== 1 ? 's' : ''}</span>
        {collection.createdAt && (
          <>
            <span className="text-gray-300">•</span>
            <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
          </>
        )}
      </div>

      {/* Toolbar */}
      {collection.documents?.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents in this collection..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors font-medium"
            />
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {(!collection.documents || collection.documents.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No Documents Yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">Add documents from your vault to organize them in this collection.</p>
          <button
            onClick={openAddPanel}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Documents
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCollectionDocs.map(doc => (
            <div
              key={doc.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 relative"
            >
              <button
                onClick={() => handleRemoveDoc(doc.id)}
                disabled={removingId === doc.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
              >
                {removingId === doc.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <X className="w-3.5 h-3.5" />
                }
              </button>

              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                <DocIcon mimeType={doc.mimeType} />
              </div>

              <h4 className="font-semibold text-gray-800 text-sm truncate pr-6">{doc.displayName}</h4>
              <p className="text-xs text-gray-400 mt-1 font-medium">{formatSize(doc.fileSize)}</p>

              <div className="mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Documents Panel */}
      {showAddPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end" onClick={() => setShowAddPanel(false)}>
          <div
            className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Add Documents</h2>
              <button onClick={() => setShowAddPanel(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={docsSearch}
                  onChange={e => setDocsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* Doc list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {allDocs.length === 0 ? 'All your documents are already in this collection' : 'No documents found'}
                  </p>
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const selected = selectedToAdd.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocSelect(doc.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                        {selected ? <Check className="w-4 h-4" /> : <DocIcon mimeType={doc.mimeType} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.displayName}</p>
                        <p className="text-xs text-gray-400">{formatSize(doc.fileSize)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleAddDocs}
                disabled={!selectedToAdd.length || isAdding}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : `Add ${selectedToAdd.length || ''} Document${selectedToAdd.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
