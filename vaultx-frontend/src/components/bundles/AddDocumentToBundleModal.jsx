import { useState, useEffect } from 'react';
import { X, Search, FileText, CheckCircle2, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../services/documentService';
import bundleService from '../../services/bundleService';

export default function AddDocumentToBundleModal({ isOpen, onClose, bundle, onAdded }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && bundle) {
      fetchDocuments();
      setSelectedIds(new Set());
      setSearchQuery('');
    }
  }, [isOpen, bundle]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getActiveDocuments(0, 100, 'updatedAt', 'desc');
      // Filter out documents already in the bundle
      const bundleDocIds = new Set(bundle.documents.map(d => d.document.id));
      const availableDocs = res.data.content.filter(doc => !bundleDocIds.has(doc.id));
      setDocuments(availableDocs);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Adding documents...');
    try {
      const res = await bundleService.addDocuments(bundle.id, Array.from(selectedIds));
      toast.success(`${selectedIds.size} document(s) added!`, { id: toastId });
      onAdded(res.data);
      onClose();
    } catch (err) {
      toast.error('Failed to add documents', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div 
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Add Documents to Bundle</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select files from your vault to include</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search available documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p>Loading documents...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-medium">No documents found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => {
                const isSelected = selectedIds.has(doc.id);
                return (
                  <div 
                    key={doc.id}
                    onClick={() => toggleSelection(doc.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-primary/40 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <FileText className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-dark' : 'text-gray-800'}`}>
                        {doc.displayName}
                      </p>
                      <p className="text-xs text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-sm font-medium text-gray-600">
            {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0 || isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Bundle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
