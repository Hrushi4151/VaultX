import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Download, Trash2, FileText, Eye, Search, X, 
  Layers, SplitSquareHorizontal, Type, Key, Sparkles, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tempStorageService } from '../../../utils/tempStorageService';

export default function TempStoragePage() {
  const [tempFiles, setTempFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    mimeType: '',
    url: null,
    file: null
  });

  const loadTempFiles = () => {
    const files = tempStorageService.getFiles();
    setTempFiles(files || []);
  };

  useEffect(() => {
    loadTempFiles();
    const interval = setInterval(loadTempFiles, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (file) => {
    try {
      const url = await tempStorageService.getFileObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloaded ${file.name}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    }
  };

  const handleRemove = (file) => {
    tempStorageService.removeFile(file.id);
    loadTempFiles();
    toast.success(`Removed ${file.name}`);
  };

  const handleClearAll = () => {
    tempStorageService.clearAll();
    loadTempFiles();
    setClearConfirm(false);
    toast.success('Cleared all temporary storage files!');
  };

  const handleOpenPreview = async (file) => {
    const toastId = toast.loading(`Loading preview for ${file.name}...`);
    try {
      const url = await tempStorageService.getFileObjectURL(file);
      setPreviewModal({
        isOpen: true,
        title: file.name,
        mimeType: file.type || 'application/pdf',
        url,
        file
      });
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to load file preview', { id: toastId });
    }
  };

  // Search filter
  const filteredFiles = tempFiles.filter(file => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return file.name?.toLowerCase().includes(q) || file.type?.toLowerCase().includes(q);
  });

  // Storage Stats
  const totalSizeBytes = tempFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="h-full flex flex-col space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">7-Day Temporary Storage</h1>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Auto-Purges in 7 Days
            </span>
          </div>
          <p className="page-subtitle mt-1">
            Access and manage staged PDFs exported from PDF Toolkit. Files are stored locally in IndexedDB and automatically expire after 7 days.
          </p>
        </div>

        {tempFiles.length > 0 && (
          <button
            type="button"
            onClick={() => setClearConfirm(true)}
            className="px-4 py-2.5 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto border border-red-100"
          >
            <Trash2 className="w-4 h-4" /> Clear All Files
          </button>
        )}
      </div>

      {/* Stats & Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 w-full md:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Staged Files</p>
              <p className="text-lg font-bold text-gray-900">{tempFiles.length} file{tempFiles.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-100" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Size</p>
              <p className="text-lg font-bold text-gray-900">{totalSizeMb} MB</p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search temporary files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Main Files Display */}
      {tempFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-gray-800">Temporary Storage is Empty</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Output documents generated from Merge, Split, Watermark, or Protect tools can be staged here for quick access across features.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard/pdf-toolkit/export?type=merge"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> Merge PDF
            </Link>
            <Link
              to="/dashboard/pdf-toolkit/split"
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" /> Split PDF
            </Link>
            <Link
              to="/dashboard/pdf-toolkit/watermark"
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Type className="w-3.5 h-3.5" /> Watermark PDF
            </Link>
            <Link
              to="/dashboard/pdf-toolkit/protect"
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> Protect PDF
            </Link>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No matching temporary files</h3>
          <p className="text-xs text-gray-500">
            No staged file matched <strong>"{searchQuery}"</strong>. Try a different search term.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-100 hover:border-purple-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div 
                    onClick={() => handleOpenPreview(file)}
                    className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 cursor-pointer group-hover:bg-purple-100 transition-colors"
                  >
                    <FileText className="w-6 h-6" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {tempStorageService.getTimeRemaining(file.expiresAt)}
                  </span>
                </div>

                <h3 
                  onClick={() => handleOpenPreview(file)}
                  className="font-bold text-gray-900 text-sm truncate cursor-pointer hover:text-purple-600 transition-colors" 
                  title={file.name}
                >
                  {file.name}
                </h3>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span className="capitalize">{file.type?.split('/')[1] || 'PDF'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(file)}
                  className="flex-1 py-2 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-gray-100"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(file)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- LIVE DOCUMENT PREVIEW MODAL --- */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 px-4 sm:px-6 gap-3 sm:gap-0">
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto pr-8 sm:pr-0">
                <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <h3 className="font-bold text-base text-white truncate">
                  {previewModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(previewModal.file)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 flex-shrink-0" /> Download File
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors absolute top-3 sm:top-auto sm:relative right-3 sm:right-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto relative min-h-[400px]">
              {previewModal.mimeType?.startsWith('image/') ? (
                <img 
                  src={previewModal.url} 
                  alt={previewModal.title} 
                  className="max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-slate-800" 
                />
              ) : (
                <iframe 
                  src={previewModal.url} 
                  title={previewModal.title} 
                  className="w-full h-[70vh] border-none rounded-2xl bg-white shadow-2xl" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CLEAR ALL CONFIRMATION DIALOG --- */}
      {clearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Clear Temporary Storage?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This will delete all staged temporary files immediately from your browser storage.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
