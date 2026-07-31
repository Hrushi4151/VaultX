import { useState, useEffect } from 'react';
import { 
  Trash2, Search, RotateCcw, XCircle, FileText, Image as ImageIcon, File, Loader2, AlertTriangle, AlertCircle, CheckSquare, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../services/documentService';
import ConfirmModal from '../../components/common/ConfirmModal';

function DocIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TrashPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Modals state
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [docToRestore, setDocToRestore] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  // Batch actions state
  const [isBatchRestoreModalOpen, setIsBatchRestoreModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getTrashDocuments(0, 100);
      setDocuments(res.data.content || []);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Failed to load trash documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleEmptyTrash = async () => {
    const toastId = toast.loading('Emptying trash...');
    try {
      await documentService.emptyTrash();
      toast.success('Trash emptied successfully', { id: toastId });
      setIsEmptyTrashModalOpen(false);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to empty trash', { id: toastId });
    }
  };

  const handleRestore = async (doc) => {
    const toastId = toast.loading('Restoring document...');
    try {
      await documentService.restoreDocument(doc.id);
      toast.success('Document restored', { id: toastId });
      setDocToRestore(null);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to restore document', { id: toastId });
    }
  };

  const handlePermanentDelete = async (doc) => {
    const toastId = toast.loading('Deleting document permanently...');
    try {
      await documentService.permanentDeleteDocument(doc.id);
      toast.success('Document deleted permanently', { id: toastId });
      setDocToDelete(null);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to delete document', { id: toastId });
    }
  };

  const handleBatchRestore = async () => {
    const toastId = toast.loading(`Restoring ${selectedIds.size} documents...`);
    try {
      await documentService.restoreDocuments(Array.from(selectedIds));
      toast.success('Documents restored', { id: toastId });
      setIsBatchRestoreModalOpen(false);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to restore documents', { id: toastId });
    }
  };

  const handleBatchDelete = async () => {
    const toastId = toast.loading(`Deleting ${selectedIds.size} documents permanently...`);
    try {
      await documentService.permanentDeleteDocuments(Array.from(selectedIds));
      toast.success('Documents deleted permanently', { id: toastId });
      setIsBatchDeleteModalOpen(false);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to delete documents', { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="h-full flex flex-col pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
            Trash Manager
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            Documents are automatically purged after 30 days. Reminders are sent 7 days and 1 day before expiration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {hasSelection && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 mr-2 whitespace-nowrap">{selectedIds.size} selected</span>
              <button
                onClick={() => setIsBatchRestoreModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Restore</span>
              </button>
              <button
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-600 text-sm font-medium border border-red-100 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}

          <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1"></div>

          <button
            onClick={() => setIsEmptyTrashModalOpen(true)}
            disabled={documents.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Empty Trash
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Trash2 className="w-16 h-16 mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-500">Trash is empty</h3>
          <p className="mt-2 text-sm">Deleted documents will appear here for 30 days before auto-purging.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10 sm:w-12">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-primary">
                      {selectedIds.size === documents.length ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Name</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted Date</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-3 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map(doc => {
                  const rem = doc.daysRemaining != null ? doc.daysRemaining : 30;
                  let badgeStyle = "bg-gray-100 text-gray-700 border-gray-200";
                  if (rem <= 1) badgeStyle = "bg-red-100 text-red-700 border-red-200 font-bold animate-pulse";
                  else if (rem <= 7) badgeStyle = "bg-amber-100 text-amber-800 border-amber-200 font-semibold";

                  return (
                  <tr key={doc.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(doc.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-3 sm:px-6 py-4">
                      <button onClick={() => handleToggleSelect(doc.id)} className="text-gray-400 hover:text-primary">
                        {selectedIds.has(doc.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          <div className="scale-75 sm:scale-100">
                            <DocIcon mimeType={doc.mimeType} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{doc.displayName}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{doc.category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap text-sm text-gray-500">
                      {doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString() : new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs border ${badgeStyle}`}>
                        ⏳ <span className="hidden sm:inline">{rem <= 1 ? 'Purges in 1 day!' : `${rem} days left`}</span><span className="sm:hidden">{rem}d</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap text-sm text-gray-500">
                      {formatSize(doc.fileSize)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDocToRestore(doc)}
                          className="p-2 text-gray-400 hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Permanently"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isEmptyTrashModalOpen}
        onClose={() => setIsEmptyTrashModalOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message="Are you sure you want to permanently delete ALL documents in the trash? This action cannot be undone."
        confirmText="Empty Trash"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!docToRestore}
        onClose={() => setDocToRestore(null)}
        onConfirm={() => handleRestore(docToRestore)}
        title="Restore Document"
        message={`Are you sure you want to restore "${docToRestore?.displayName}"?`}
        confirmText="Restore"
      />

      <ConfirmModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => handlePermanentDelete(docToDelete)}
        title="Permanently Delete Document"
        message={`Are you sure you want to permanently delete "${docToDelete?.displayName}"? This action cannot be undone.`}
        confirmText="Delete Permanently"
        type="danger"
      />

      <ConfirmModal
        isOpen={isBatchRestoreModalOpen}
        onClose={() => setIsBatchRestoreModalOpen(false)}
        onConfirm={handleBatchRestore}
        title="Restore Documents"
        message={`Are you sure you want to restore ${selectedIds.size} documents?`}
        confirmText="Restore All"
      />

      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleBatchDelete}
        title="Permanently Delete Documents"
        message={`Are you sure you want to permanently delete ${selectedIds.size} documents? This action cannot be undone.`}
        confirmText="Delete Permanently"
        type="danger"
      />
    </div>
  );
}
