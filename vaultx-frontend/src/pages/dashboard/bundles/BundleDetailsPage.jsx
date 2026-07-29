import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Download, Edit2, Settings, ListOrdered, FolderHeart, ShieldAlert, Check, Trash2, GripVertical, Search, ArrowUpDown, Plus, ChevronDown, Eye, FileArchive, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import bundleService from '../../../services/bundleService';
import documentService from '../../../services/documentService';
import { tempStorageService } from '../../../utils/tempStorageService';
import DocumentPreviewModal from '../../../components/documents/DocumentPreviewModal';
import EditBundleModal from '../../../components/bundles/EditBundleModal';
import AddDocumentToBundleModal from '../../../components/bundles/AddDocumentToBundleModal';

export default function BundleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('order');
  const [bundlePreviewUrl, setBundlePreviewUrl] = useState(null);

  const validateBundleNotEmpty = () => {
    if (!bundle?.documents || bundle.documents.length === 0) {
      toast.error('Cannot export an empty bundle. Please add at least one document first.');
      return false;
    }
    return true;
  };

  const handleSaveToTempStorage = async () => {
    if (!validateBundleNotEmpty()) return;
    const toastId = toast.loading('Saving bundle PDF to 7-day temporary storage...');
    try {
      const res = await (await import('../../../services/pdfService')).default.exportBundle(bundle.id);
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      await tempStorageService.saveFile(pdfBlob, `${bundle.name}.pdf`, 'application/pdf');
      toast.success('Saved to 7-Day Temporary Storage!', { id: toastId });
    } catch (err) {
      console.error('Temp save error:', err);
      toast.error('Failed to save bundle to temporary storage', { id: toastId });
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    
    // Only allow drag-and-drop if we are not actively sorting/filtering
    if (searchQuery || sortBy !== 'order') {
      toast.error('Reordering is only allowed in the default view');
      return;
    }

    const newDocs = Array.from(bundle.documents);
    const [removed] = newDocs.splice(result.source.index, 1);
    newDocs.splice(result.destination.index, 0, removed);
    
    // Optimistic UI update
    setBundle({ ...bundle, documents: newDocs });

    try {
      const docIds = newDocs.map(d => d.document.id);
      await bundleService.reorderDocuments(id, docIds);
      toast.success('Document order saved');
    } catch (err) {
      toast.error('Failed to save document order');
      const fetchBundle = async () => {
        try {
          const res = await bundleService.getBundle(id);
          setBundle(res.data);
        } catch (error) {}
      };
      fetchBundle();
    }
  };

  const handleDownload = async (doc) => {
    try {
      const toastId = toast.loading('Downloading...');
      const res = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFilename || doc.displayName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download complete', { id: toastId });
    } catch (err) {
      toast.error('Failed to download document');
    }
  };

  const handlePreviewBundle = async () => {
    if (!validateBundleNotEmpty()) return;
    const toastId = toast.loading('Generating preview...');
    try {
      const res = await (await import('../../../services/pdfService')).default.exportBundle(bundle.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setBundlePreviewUrl(url);
      setPreviewDoc({ id: 'bundle_pdf', mimeType: 'application/pdf', displayName: `${bundle.name}.pdf` });
      toast.success('Preview ready!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate preview', { id: toastId });
    }
  };

  const handleDownloadPdf = async () => {
    if (!validateBundleNotEmpty()) return;
    const toastId = toast.loading('Generating PDF...');
    try {
      const res = await (await import('../../../services/pdfService')).default.exportBundle(bundle.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bundle.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownloadZip = async () => {
    if (!validateBundleNotEmpty()) return;
    const toastId = toast.loading('Preparing ZIP...');
    try {
      const res = await bundleService.downloadBundleAsZip(bundle.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bundle.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('ZIP Downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to download ZIP', { id: toastId });
    }
  };

  const handleRemoveDocument = async (e, docId) => {
    e.stopPropagation();
    try {
      const res = await bundleService.removeDocument(id, docId);
      setBundle(res.data);
      toast.success('Document removed from bundle');
    } catch (err) {
      toast.error('Failed to remove document');
    }
  };

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const res = await bundleService.getBundle(id);
        setBundle(res.data);
      } catch (err) {
        toast.error('Failed to load bundle details');
        navigate('/dashboard/bundles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundle();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!bundle) return null;

  const filteredAndSortedDocs = [...(bundle.documents || [])]
    .filter(doc => doc.document.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.document.displayName.localeCompare(b.document.displayName);
      if (sortBy === 'size') return b.document.fileSize - a.document.fileSize;
      return 0; // 'order' keeps original array order
    });

  return (
    <div className="h-full flex flex-col pb-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/bundles')} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{bundle.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Updated {new Date(bundle.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <div className="relative group">
            <button 
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-md shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 space-y-1">
              <button 
                onClick={handlePreviewBundle}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Eye className="w-4 h-4 text-gray-500" /> Preview PDF
              </button>
              <button 
                onClick={handleDownloadPdf}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-gray-500" /> Download PDF
              </button>
              <button 
                onClick={handleDownloadZip}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <FileArchive className="w-4 h-4 text-gray-500" /> Download ZIP
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button 
                onClick={handleSaveToTempStorage}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors text-left font-bold"
              >
                <Clock className="w-4 h-4 text-purple-600" /> Save to Temp (7D)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Docs & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><ListOrdered className="w-5 h-5"/> Included Documents</h3>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{bundle.documents.length} files</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search in bundle..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
                      {[
                        { id: 'order', label: 'Default Order' },
                        { id: 'name', label: 'By Name' },
                        { id: 'size', label: 'By Size' }
                      ].map(option => (
                        <button 
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${sortBy === option.id ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add File
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="documents-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {filteredAndSortedDocs.map((doc, idx) => (
                        <Draggable 
                          key={doc.document.id} 
                          draggableId={doc.document.id.toString()} 
                          index={idx}
                          isDragDisabled={searchQuery !== '' || sortBy !== 'order'} // Disable drag if sorting/filtering
                        >
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all group ${
                                snapshot.isDragging ? 'shadow-xl border-primary scale-[1.02] z-50' : 'border-gray-200 hover:border-primary/40 shadow-sm'
                              }`}
                              onClick={() => setPreviewDoc(doc.document)}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className={`p-1.5 text-gray-400 hover:text-gray-600 rounded cursor-grab active:cursor-grabbing ${
                                  (searchQuery !== '' || sortBy !== 'order') ? 'opacity-30 cursor-not-allowed' : ''
                                }`}
                                onClick={e => e.stopPropagation()}
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-inner">
                                {idx + 1}
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">{doc.document.displayName}</p>
                                <p className="text-xs text-gray-400">{(doc.document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button 
                                onClick={(e) => handleRemoveDocument(e, doc.document.id)}
                                className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove from bundle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {filteredAndSortedDocs.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          {searchQuery ? 'No documents match your search.' : 'No documents in this bundle.'}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Settings */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FolderHeart className="w-5 h-5"/> Details</h3>
            <p className="text-sm text-gray-600 mb-6">{bundle.description || 'No description'}</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Status</p>
                <div className="flex gap-2">
                  {bundle.favourite && <span className="text-xs font-medium bg-amber-50 text-amber-600 px-2 py-1 rounded">Favourite</span>}
                  {bundle.archived ? (
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">Archived</span>
                  ) : (
                    <span className="text-xs font-medium bg-green-50 text-green-600 px-2 py-1 rounded">Active</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Raw Size</p>
                <p className="text-sm font-medium text-gray-800">{(bundle.totalFileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Export Settings</h3>
            
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cover Page</span>
                {bundle.settings?.includeCoverPage ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-gray-400">-</span>}
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Table of Contents</span>
                {bundle.settings?.includeToc ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-gray-400">-</span>}
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Page Numbers</span>
                {bundle.settings?.includePageNumbers ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-gray-400">-</span>}
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Compression</span>
                {bundle.settings?.compressOutput ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-gray-400">-</span>}
              </li>
            </ul>
            
            {bundle.settings?.watermarkText && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Watermark</p>
                <p className="text-sm font-medium text-gray-700">{bundle.settings.watermarkText}</p>
              </div>
            )}
          </div>

        </div>

      </div>

      <DocumentPreviewModal 
        isOpen={!!previewDoc}
        onClose={() => {
          if (bundlePreviewUrl) {
            window.URL.revokeObjectURL(bundlePreviewUrl);
            setBundlePreviewUrl(null);
          }
          setPreviewDoc(null);
        }}
        document={previewDoc}
        onDownload={previewDoc?.id === 'bundle_pdf' ? handleDownloadPdf : handleDownload}
        preloadedBlobUrl={bundlePreviewUrl}
      />

      <EditBundleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        bundle={bundle}
        onUpdated={(updatedBundle) => setBundle(updatedBundle)}
      />

      <AddDocumentToBundleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        bundle={bundle}
        onAdded={(updatedBundle) => setBundle(updatedBundle)}
      />
    </div>
  );
}
