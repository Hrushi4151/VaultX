import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, FileText, Bot, Clock, Filter, AlertCircle, ChevronRight, Hash, Folder } from 'lucide-react';
import searchService from '../../../services/searchService';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [totalElements, setTotalElements] = useState(0);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchService.globalSearch(searchQuery);
      setResults(res.data.content);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="h-full flex flex-col pb-8">
      
      {/* Header Search Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by name, content, OCR text, or AI tags..."
            className="w-full pl-14 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:border-primary outline-none transition-colors"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex-1 flex gap-6">
        
        {/* Left: Filters */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Filter className="w-5 h-5"/> Filters</h3>
            
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Engine Status</p>
              <label className="flex items-center gap-2 mb-2 cursor-not-allowed opacity-60">
                <input type="checkbox" disabled className="w-4 h-4 rounded text-primary" /> <span className="text-sm">OCR Processed</span>
              </label>
              <label className="flex items-center gap-2 mb-2 cursor-not-allowed opacity-60">
                <input type="checkbox" disabled className="w-4 h-4 rounded text-primary" /> <span className="text-sm">AI Categorized</span>
              </label>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Category</p>
              <label className="flex items-center gap-2 mb-2 cursor-not-allowed opacity-60">
                <input type="checkbox" disabled className="w-4 h-4 rounded text-primary" /> <span className="text-sm">Identity</span>
              </label>
              <label className="flex items-center gap-2 mb-2 cursor-not-allowed opacity-60">
                <input type="checkbox" disabled className="w-4 h-4 rounded text-primary" /> <span className="text-sm">Finance</span>
              </label>
            </div>
            
            <p className="text-xs text-gray-400 italic">Advanced filters coming soon</p>
          </div>
        </div>

        {/* Center: Results */}
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-y-auto">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : !hasSearched ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <Bot className="w-16 h-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">Intelligent Search</h2>
              <p className="text-gray-500 max-w-sm mt-2">VaultX AI automatically indexes the content inside your PDFs and images.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">No results found</h2>
              <p className="text-gray-500 mt-2">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-500 mb-6 border-b border-gray-100 pb-2">Found {totalElements} exact or semantic matches</p>
              {results.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
                  className="p-5 border border-gray-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{doc.displayName}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-500">
                          <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> Vault</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        
                        {/* Mock AI Snippet - in reality this comes from backend highlighting */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">
                          <span className="font-bold text-primary text-xs uppercase mb-1 block flex items-center gap-1"><Bot className="w-3 h-3"/> AI Insight Match</span>
                          "...matches content inside the document regarding <span className="bg-yellow-100 font-bold px-1 rounded">{query}</span> and related terms..."
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
