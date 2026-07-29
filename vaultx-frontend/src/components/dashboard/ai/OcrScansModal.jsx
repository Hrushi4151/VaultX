import { useState, useEffect } from 'react';
import { X, FileText, Search, RefreshCw, Eye, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../../services/aiService';

export default function OcrScansModal({ isOpen, onClose, onDocumentClick }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchOcrScans = async () => {
    setIsLoading(true);
    try {
      const res = await aiService.getOcrScans();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load OCR scans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOcrScans();
    }
  }, [isOpen]);

  const handleTriggerOcr = async (docId, e) => {
    e.stopPropagation();
    try {
      setProcessingId(docId);
      await aiService.triggerOcr(docId);
      toast.success('OCR engine processing document...');
      await fetchOcrScans();
    } catch (err) {
      toast.error('Failed to trigger OCR process');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredData = data.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.document?.displayName?.toLowerCase().includes(query) ||
           item.extractedTextSnippet?.toLowerCase().includes(query) ||
           item.language?.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Recent OCR Scans
                <span className="px-2.5 py-0.5 text-xs bg-white/20 rounded-full font-normal">Full-Text Searchable</span>
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">
                Extracted optical text from images & PDFs for global indexing
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

        {/* Search Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search across all extracted OCR text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading OCR extracted text...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText className="w-10 h-10 text-blue-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-gray-700">No OCR scans found</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                Upload image or PDF files to automatically run optical character recognition.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map(item => (
                <div 
                  key={item.id}
                  onClick={() => onDocumentClick && onDocumentClick(item.document)}
                  className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {item.document?.displayName}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded">
                          {item.status || 'PROCESSED'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 my-1.5 text-xs text-gray-600 italic leading-relaxed">
                        "{item.extractedTextSnippet}"
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>Language: <strong className="text-gray-600">{item.language}</strong></span>
                        <span>•</span>
                        <span>Confidence: <strong className="text-gray-600">{Math.round((item.confidence || 0.98) * 100)}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 justify-end border-t md:border-t-0 pt-2 md:pt-0">
                    <button
                      onClick={(e) => handleTriggerOcr(item.document?.id, e)}
                      disabled={processingId === item.document?.id}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${processingId === item.document?.id ? 'animate-spin text-blue-600' : ''}`} />
                      Re-scan OCR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredData.length} OCR processed files</span>
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
