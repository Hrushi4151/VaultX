import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Grid, List as ListIcon, Filter, MoreVertical, 
  FileText, File, Image, FolderHeart, Star, Trash2, Edit2, 
  Download, Archive, CornerUpLeft, Shield, Eye
} from 'lucide-react';

export default function DocumentExplorer({ 
  documents = [], 
  viewMode = 'grid', 
  setViewMode, 
  onAction,
  title = 'All Documents',
  isLoading = false
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, extension) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (['doc', 'docx'].includes(extension)) return <FileText className="w-8 h-8 text-blue-600" />;
    if (['xls', 'xlsx'].includes(extension)) return <FileText className="w-8 h-8 text-green-600" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const filteredDocs = documents.filter(doc => 
    doc.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all shadow-xs font-medium"
            />
          </div>
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-xs p-1 shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <File className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">No documents found</h3>
          <p className="text-gray-500 max-w-sm">
            {searchQuery ? "We couldn't find anything matching your search." : "You haven't uploaded any documents here yet."}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          : "flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        }>
          
          {viewMode === 'list' && (
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-6 md:col-span-5">Name</div>
              <div className="hidden md:block col-span-2">Category</div>
              <div className="col-span-3 md:col-span-2">Size</div>
              <div className="hidden md:block col-span-2">Modified</div>
              <div className="col-span-3 md:col-span-1 text-right">Actions</div>
            </div>
          )}

          {filteredDocs.map(doc => (
            viewMode === 'grid' ? (
              <div 
                key={doc.id} 
                className="group relative bg-white border border-gray-100 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
              >
                {doc.favourite && (
                  <div className="absolute top-3 left-3 z-10">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAction('preview', doc); }}
                      className="p-1.5 bg-white shadow-sm rounded-lg text-gray-500 hover:text-primary transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === doc.id ? null : doc.id); }}
                      className="p-1.5 bg-white shadow-sm rounded-lg text-gray-500 hover:text-primary transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeMenu === doc.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                        {doc.deleted ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onAction('restore', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><CornerUpLeft className="w-4 h-4"/> Restore</button>
                            <button onClick={(e) => { e.stopPropagation(); onAction('permanent_delete', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete Forever</button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onAction('download', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download className="w-4 h-4"/> Download</button>
                            <button onClick={(e) => { e.stopPropagation(); onAction('rename', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Edit2 className="w-4 h-4"/> Rename</button>
                            <button onClick={(e) => { e.stopPropagation(); onAction('toggle_favourite', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Star className="w-4 h-4"/> {doc.favourite ? 'Unfavourite' : 'Favourite'}</button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={(e) => { e.stopPropagation(); onAction('soft_delete', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Move to Trash</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-32 bg-gray-50 rounded-xl mb-3 flex items-center justify-center">
                  {getFileIcon(doc.mimeType, doc.extension)}
                </div>
                
                <h3 className="font-medium text-gray-800 text-sm truncate mb-1" title={doc.displayName}>
                  {doc.displayName}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                  <span>{formatSize(doc.fileSize)}</span>
                  {doc.category && <span className="bg-gray-100 px-2 py-0.5 rounded">{doc.category.name}</span>}
                </div>
              </div>
            ) : (
              // List View
              <div 
                key={doc.id} 
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/80 transition-colors items-center cursor-pointer group"
                onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
              >
                <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.mimeType, doc.extension)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
                      {doc.displayName}
                      {doc.favourite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                    </p>
                  </div>
                </div>
                
                <div className="hidden md:block col-span-2">
                  {doc.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {doc.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
                
                <div className="col-span-3 md:col-span-2 text-sm text-gray-500">
                  {formatSize(doc.fileSize)}
                </div>
                
                <div className="hidden md:block col-span-2 text-sm text-gray-500">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
                
                <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAction('preview', doc); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenu === doc.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                        {doc.deleted ? (
                          <>
                            <button onClick={() => { onAction('restore', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><CornerUpLeft className="w-4 h-4"/> Restore</button>
                            <button onClick={() => { onAction('permanent_delete', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete Forever</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { onAction('download', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download className="w-4 h-4"/> Download</button>
                            <button onClick={() => { onAction('rename', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Edit2 className="w-4 h-4"/> Rename</button>
                            <button onClick={() => { onAction('toggle_favourite', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Star className="w-4 h-4"/> {doc.favourite ? 'Unfavourite' : 'Favourite'}</button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={() => { onAction('soft_delete', doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Move to Trash</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
