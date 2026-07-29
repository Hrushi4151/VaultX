import { useState, useEffect } from 'react';
import { X, Fingerprint, Tag, Sparkles, RefreshCw, CheckCircle2, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../../services/aiService';

export default function SmartCategorizationModal({ isOpen, onClose, onDocumentClick }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reclassifyingId, setReclassifyingId] = useState(null);

  const fetchCategorizations = async () => {
    setIsLoading(true);
    try {
      const res = await aiService.getSmartCategorizations();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load AI categorizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategorizations();
    }
  }, [isOpen]);

  const handleReclassify = async (docId, e) => {
    e.stopPropagation();
    try {
      setReclassifyingId(docId);
      await aiService.triggerClassification(docId);
      toast.success('AI re-classification triggered!');
      await fetchCategorizations();
    } catch (err) {
      toast.error('Failed to trigger AI classification');
    } finally {
      setReclassifyingId(null);
    }
  };

  if (!isOpen) return null;

  const categories = ['ALL', ...new Set(data.map(item => item.detectedCategory).filter(Boolean))];

  const filteredData = data.filter(item => {
    const matchesCategory = filterCategory === 'ALL' || item.detectedCategory === filterCategory;
    const matchesSearch = item.document?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.detectedType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Smart Categorization
                <span className="px-2.5 py-0.5 text-xs bg-white/20 rounded-full font-normal">VaultX AI</span>
              </h2>
              <p className="text-purple-100 text-xs mt-0.5">
                Automatically identified document types, categories & structural tags
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

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search AI tagged documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-hide py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  filterCategory === cat 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Analyzing vault with VaultX AI...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-gray-700">No categorizations found</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                Upload documents to let VaultX AI automatically detect categories and tags.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredData.map(item => (
                <div 
                  key={item.id}
                  onClick={() => onDocumentClick && onDocumentClick(item.document)}
                  className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-purple-600 transition-colors">
                            {item.document?.displayName}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            {item.detectedType || 'Document'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleReclassify(item.document?.id, e)}
                        disabled={reclassifyingId === item.document?.id}
                        title="Re-run AI Classification"
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${reclassifyingId === item.document?.id ? 'animate-spin text-purple-600' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-md">
                        {item.detectedCategory}
                      </span>
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round((item.confidenceScore || 0.95) * 100)}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags?.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md font-medium">
                          <Tag className="w-2.5 h-2.5 text-gray-400" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredData.length} AI categorized items</span>
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
