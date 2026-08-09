import { useState, useEffect } from 'react';
import { X, FileWarning, Trash2, ShieldAlert, CheckCircle2, FileText, Sparkles, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../../services/aiService';
import documentService from '../../../services/documentService';

export default function DuplicateAlertsModal({ isOpen, onClose, onDocumentClick, onUpdate }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const res = await aiService.getDuplicateGroups();
      setGroups(res.data);
    } catch (err) {
      toast.error('Failed to scan for duplicate files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
    }
  }, [isOpen]);

  const handleDeleteDuplicate = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('Move this duplicate file to trash?')) return;

    try {
      setDeletingId(docId);
      await documentService.softDeleteDocument(docId);
      toast.success('Duplicate file moved to trash');
      await fetchDuplicates();
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to move duplicate to trash');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalWastedBytes = groups.reduce((acc, g) => acc + (g.wastedBytes || 0), 0);

  const getDetectionBadge = (group) => {
    const type = group.detectionType || 'EXACT_CHECKSUM';
    const sim = group.similarityPercentage ? `${group.similarityPercentage.toFixed(1)}%` : '100%';

    switch (type) {
      case 'OCR_TEXT_EXACT':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            100% OCR Content Match
          </span>
        );
      case 'OCR_TEXT_SIMILAR':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            {sim} OCR Text Match
          </span>
        );
      case 'FILENAME_MATCH':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-indigo-200">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Filename Match
          </span>
        );
      case 'EXACT_CHECKSUM':
      default:
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Exact File Hash Match (100%)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <FileWarning className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                AI Duplicate Document Detector
                <span className="px-2.5 py-0.5 text-xs bg-white/20 rounded-full font-normal">Hybrid OCR Engine</span>
              </h2>
              <p className="text-amber-100 text-xs mt-0.5">
                Multi-layer duplicate analysis combining SHA-256 checksums & AI OCR text similarity
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wasted Storage Banner */}
        <div className="p-4 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Wasted Storage Impact: <strong className="text-amber-900 text-sm font-bold ml-1">{formatSize(totalWastedBytes)}</strong></span>
          </div>
          <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-medium">
            {groups.length} Duplicate Groups
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Running AI Hybrid Duplicate Engine (Checksum + OCR Text Analysis)...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-800">Your vault is clean!</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                No redundant duplicate files or OCR text content overlaps found in your document storage.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between mb-3 pb-2 border-b border-gray-200 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-md">
                        {group.duplicateCount} Copies
                      </span>
                      <h4 className="font-bold text-gray-800 text-sm">{group.fileName}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      {getDetectionBadge(group)}
                      <span className="text-xs font-medium text-gray-500">
                        File Size: {formatSize(group.fileSize)}
                      </span>
                    </div>
                  </div>

                  {group.matchReason && (
                    <p className="text-xs text-gray-500 mb-3 italic bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-100">
                      💡 Detection Insight: {group.matchReason}
                    </p>
                  )}

                  <div className="space-y-2">
                    {group.documents?.map((doc, docIdx) => (
                      <div 
                        key={doc.id}
                        onClick={() => onDocumentClick && onDocumentClick(doc)}
                        className="p-3 bg-white rounded-xl border border-gray-100 hover:border-amber-300 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-amber-500" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {doc.displayName}
                              {docIdx === 0 && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-normal">Original Keep</span>}
                            </p>
                            <span className="text-[10px] text-gray-400">
                              Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {docIdx > 0 ? (
                            <button
                              onClick={(e) => handleDeleteDuplicate(doc.id, e)}
                              disabled={deletingId === doc.id}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingId === doc.id ? 'Deleting...' : 'Delete Duplicate'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded">Master Copy</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Found {groups.length} duplicate groups</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
