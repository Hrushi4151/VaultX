import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, FileOutput, FilePlus, SplitSquareHorizontal, Minimize2, Type, 
  Key, FolderArchive, Clock, Download, Trash2, FileText, X, Sparkles, Folder, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tempStorageService } from '../../../utils/tempStorageService';

export default function PdfToolkitDashboard() {
  const navigate = useNavigate();
  const [tempFiles, setTempFiles] = useState([]);
  const [tempStorageModalOpen, setTempStorageModalOpen] = useState(false);

  // Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    title: '',
    mimeType: '',
    url: null,
    file: null
  });

  // Load and refresh 7-day temporary storage files
  const loadTempFiles = () => {
    const files = tempStorageService.getFiles();
    setTempFiles(files);
  };

  useEffect(() => {
    loadTempFiles();
    const interval = setInterval(loadTempFiles, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadTempFile = async (file) => {
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

  const openPreviewForTempFile = async (file) => {
    const toastId = toast.loading(`Loading preview for ${file.name}...`);
    try {
      const url = await tempStorageService.getFileObjectURL(file);
      setPreviewDocModal({
        isOpen: true,
        title: file.name,
        mimeType: file.type || 'application/pdf',
        url,
        file
      });
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to load temporary file preview', { id: toastId });
    }
  };

  const handleRemoveTempFile = (id) => {
    tempStorageService.removeFile(id);
    loadTempFiles();
    toast.success('Removed from temporary storage');
  };

  const handleClearAllTemp = () => {
    tempStorageService.clearAll();
    loadTempFiles();
    toast.success('Cleared all temporary storage files');
  };

  const TOOLS = [
    {
      id: 'merge',
      name: 'Merge PDF',
      description: 'Combine multiple PDFs or Images into a single document.',
      icon: Layers,
      color: 'bg-blue-500',
      action: () => navigate('/dashboard/pdf-toolkit/export?type=merge')
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Separate one page or a whole set for easy conversion.',
      icon: SplitSquareHorizontal,
      color: 'bg-emerald-500',
      action: () => navigate('/dashboard/pdf-toolkit/split')
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce file size while optimizing for maximal quality.',
      icon: Minimize2,
      color: 'bg-rose-500',
      action: () => toast('Compress PDF coming soon!', { icon: '🗜️' })
    },
    {
      id: 'watermark',
      name: 'Add Watermark',
      description: 'Stamp an image or text over your PDF in seconds.',
      icon: Type,
      color: 'bg-purple-500',
      action: () => navigate('/dashboard/pdf-toolkit/watermark')
    },
    {
      id: 'password',
      name: 'Protect PDF',
      description: 'Encrypt your PDF with a password to prevent unauthorized access.',
      icon: Key,
      color: 'bg-amber-500',
      action: () => navigate('/dashboard/pdf-toolkit/protect')
    },
    {
      id: 'history',
      name: 'Export History',
      description: 'View and download your previously generated PDF exports.',
      icon: FolderArchive,
      color: 'bg-gray-700',
      action: () => toast('History coming soon!', { icon: '📚' })
    }
  ];

  return (
    <div className="h-full flex flex-col pb-8 space-y-8">
      
      {/* --- Top Header with Right-Aligned Temporary Storage Button --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">PDF Toolkit</h1>
          <p className="page-subtitle mt-1">
            Professional PDF processing engine. Merge, compress, split, and secure your documents.
          </p>
        </div>

        {/* Dedicated Top Right Corner Temporary Storage Icon Button */}
        <button
          type="button"
          onClick={() => {
            loadTempFiles();
            setTempStorageModalOpen(true);
          }}
          className="relative px-4 py-2.5 bg-white border border-purple-200 hover:border-purple-400 text-purple-700 font-bold text-xs rounded-2xl shadow-sm hover:bg-purple-50/60 transition-all flex items-center gap-2 group"
          title="Open 7-Day Temporary Storage Manager"
        >
          <Clock className="w-4 h-4 text-purple-600 group-hover:rotate-12 transition-transform" />
          <span>7-Day Temp Storage</span>
          {tempFiles.length > 0 && (
            <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs">
              {tempFiles.length}
            </span>
          )}
        </button>
      </div>

      {/* --- Hero Banner --- */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-dark rounded-3xl p-8 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <FileOutput className="w-64 h-64" />
        </div>
        <div className="max-w-xl relative z-10">
          <h2 className="text-2xl font-bold mb-2">Create Professional Exports</h2>
          <p className="text-white/80 mb-6">
            The all-in-one wizard helps you combine files, generate dynamic cover pages, build tables of contents, and stamp page numbers seamlessly.
          </p>
          <button 
            onClick={() => navigate('/dashboard/pdf-toolkit/export')}
            className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <FilePlus className="w-5 h-5" />
            Start PDF Export Wizard
          </button>
        </div>
      </div>

      {/* --- Quick Tools Grid --- */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Tools</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <div 
              key={tool.id}
              onClick={tool.action}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl ${tool.color} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-800 mb-1">{tool.name}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- TEMPORARY STORAGE MANAGER MODAL --- */}
      {tempStorageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    7-Day Temporary Storage Manager
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      {tempFiles.length} Staged File(s)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Staged PDFs automatically delete after 7 days. Download or manage your files below.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setTempStorageModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
              {tempFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-purple-100 rounded-2xl bg-purple-50/20">
                  <Clock className="w-10 h-10 text-purple-300 mb-2" />
                  <p className="font-bold text-gray-700 text-xs">Temporary Storage is Empty</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    Save output files from Merge, Split, Watermark, or Protect tools using the <strong>Temp Storage (7D)</strong> button.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tempFiles.map(file => (
                    <div 
                      key={file.id} 
                      className="bg-slate-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-purple-300 transition-all shadow-xs"
                    >
                      <div 
                        onClick={() => openPreviewForTempFile(file)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                        title="Click to preview file"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold group-hover:bg-purple-200 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 group-hover:text-purple-600 truncate transition-colors">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-2.5 h-2.5" /> {tempStorageService.getTimeRemaining(file.expiresAt)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPreviewForTempFile(file)}
                          className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 rounded-xl transition-all"
                          title="Preview File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadTempFile(file)}
                          className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-all shadow-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempFile(file.id)}
                          className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-xl hover:border-red-200 transition-all"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tempFiles.length > 0 && (
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  Auto-purges expired items every 30 seconds
                </span>
                <button
                  type="button"
                  onClick={handleClearAllTemp}
                  className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Files
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- LIVE TEMPORARY FILE PREVIEW MODAL --- */}
      {previewDocModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 px-6">
              <div className="flex items-center gap-3 min-w-0">
                <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <h3 className="font-bold text-base text-white truncate">
                  {previewDocModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadTempFile(previewDocModal.file)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" /> Download File
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewDocModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Preview Canvas Container */}
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto relative min-h-[400px]">
              {previewDocModal.mimeType?.startsWith('image/') ? (
                <img 
                  src={previewDocModal.url} 
                  alt={previewDocModal.title} 
                  className="max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-slate-800" 
                />
              ) : (
                <iframe 
                  src={previewDocModal.url} 
                  title={previewDocModal.title} 
                  className="w-full h-[70vh] border-none rounded-2xl bg-white shadow-2xl" 
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
