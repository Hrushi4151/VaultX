import { X, Download, FileText, File, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import documentService from '../../services/documentService';
import toast from 'react-hot-toast';

export default function DocumentPreviewModal({ isOpen, onClose, document, onDownload, preloadedBlobUrl }) {
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;

    const loadPreview = async () => {
      if (!isOpen || !document) return;
      
      const isImage = document.mimeType?.startsWith('image/');
      const isPdf = document.mimeType === 'application/pdf';
      
      if (!isImage && !isPdf) return;

      setIsLoading(true);
      try {
        if (preloadedBlobUrl) {
          setPreviewBlobUrl(preloadedBlobUrl);
        } else {
          const res = await documentService.downloadDocument(document.id);
          objectUrl = window.URL.createObjectURL(new Blob([res.data], { type: document.mimeType }));
          setPreviewBlobUrl(objectUrl);
        }
      } catch (err) {
        console.error("Failed to load preview:", err);
        toast.error("Failed to load document preview");
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
      setPreviewBlobUrl(null);
      setIsLoading(false);
    };
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-8">
      <div className="bg-white rounded-2xl w-full h-full max-w-6xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isImage ? (
                <FileText className="w-5 h-5 text-primary" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-danger" />
              ) : (
                <File className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg leading-tight">{document.displayName}</h2>
              <p className="text-sm text-gray-500">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDownload(document)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 overflow-hidden flex items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading preview...</p>
            </div>
          ) : isImage && previewBlobUrl ? (
            <div className="max-w-full max-h-full rounded-lg shadow-sm bg-white p-2 overflow-auto flex items-center justify-center">
               <img src={previewBlobUrl} alt={document.displayName} className="max-w-full max-h-full object-contain" />
            </div>
          ) : isPdf && previewBlobUrl ? (
            <div className="w-full h-full bg-white rounded shadow-sm overflow-hidden">
              <iframe src={previewBlobUrl} className="w-full h-full border-0" title={document.displayName} />
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No Preview Available</h3>
              <p className="text-gray-500 mb-6">Preview is not supported for this file type.</p>
              <button 
                onClick={() => onDownload(document)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
