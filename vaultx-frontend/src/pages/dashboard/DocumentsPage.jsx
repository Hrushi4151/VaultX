import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Folder, Plus, Download } from 'lucide-react';
import DocumentExplorer from '../../components/documents/DocumentExplorer';
import UploadModal from '../../components/documents/UploadModal';
import DocumentPreviewModal from '../../components/documents/DocumentPreviewModal';
import documentService from '../../services/documentService';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocumentsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [docsRes, catsRes] = await Promise.all([
        documentService.getActiveDocuments(selectedCategory),
        documentService.getAllCategories()
      ]);
      setDocuments(docsRes.data.content);
      setCategories(catsRes.data);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsAndCategories();
  }, [selectedCategory]);

  const handleAction = async (action, doc) => {
    try {
      switch (action) {
        case 'preview':
          setPreviewDoc(doc);
          break;
        case 'download':
          const res = await documentService.downloadDocument(doc.id);
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', doc.displayName);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          break;
        case 'toggle_favourite':
          await documentService.toggleFavourite(doc.id);
          toast.success(doc.favourite ? 'Removed from favourites' : 'Added to favourites');
          fetchDocumentsAndCategories();
          break;
        case 'rename':
          const newName = prompt('Enter new name:', doc.displayName);
          if (newName && newName !== doc.displayName) {
            await documentService.renameDocument(doc.id, newName);
            toast.success('Document renamed');
            fetchDocumentsAndCategories();
          }
          break;
        case 'soft_delete':
          if (window.confirm(`Move "${doc.displayName}" to trash?`)) {
            await documentService.softDeleteDocument(doc.id);
            toast.success('Moved to trash');
            fetchDocumentsAndCategories();
          }
          break;
      }
    } catch (err) {
      toast.error(`Failed to perform action: ${action}`);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      const res = await documentService.exportCategory(selectedCategory);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const catName = categories.find(c => c.id === selectedCategory)?.name || 'All_Documents';
      link.setAttribute('download', `${catName}_Export.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Export started');
    } catch (err) {
      toast.error('Failed to export documents as ZIP');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category Pills & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 scrollbar-hide no-scrollbar scrollbar-none py-1 pr-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all shadow-xs shrink-0 ${
              selectedCategory === null 
                ? 'bg-primary text-white shadow-primary/20' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Documents
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-xs ${
                selectedCategory === cat.id 
                  ? 'bg-primary text-white shadow-primary/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: cat.colorHex || '#9ca3af' }}
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={handleExportZip}
            disabled={isExporting || documents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-xs disabled:opacity-50 font-bold text-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>{isExporting ? 'Exporting...' : 'Export ZIP'}</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-sm font-bold text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        <DocumentExplorer 
          documents={documents}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onAction={handleAction}
          isLoading={isLoading}
          title={selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || "All Documents" : "All Documents"}
        />
      </div>

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={fetchDocumentsAndCategories}
      />

      <DocumentPreviewModal 
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDownload={(doc) => handleAction('download', doc)}
      />
    </div>
  );
}
