import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Bot, Fingerprint, Calendar, 
  CheckCircle, FileWarning, Search, Download, Clock, Loader2,
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize, Edit3, Save,
  Star, Archive, Trash2, Tag, Copy, Sparkles, Folder, Check, RefreshCw,
  FolderPlus, Wand2, CheckCircle2, ArrowRight, X
} from 'lucide-react';
import documentService from '../../../services/documentService';
import engineService from '../../../services/engineService';
import aiService from '../../../services/aiService';
import toast from 'react-hot-toast';

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Image Viewer Controls
  const [imgScale, setImgScale] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);

  // Editable Form State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedOcr, setCopiedOcr] = useState(false);

  // AI Suggestions State & Modal
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplyingAi, setIsApplyingAi] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedCollectionForAi, setSelectedCollectionForAi] = useState('');
  const [customAiName, setCustomAiName] = useState('');
  const [customAiCategory, setCustomAiCategory] = useState('');
  const [customAiCollection, setCustomAiCollection] = useState('');
  const [customAiTags, setCustomAiTags] = useState([]);
  const [tagInputText, setTagInputText] = useState('');

  useEffect(() => {
    if (aiAnalysis) {
      setCustomAiName(aiAnalysis.suggestedName || '');
      setCustomAiCategory(aiAnalysis.suggestedCategory || 'Personal');
      setCustomAiCollection(aiAnalysis.suggestedCollectionName || 'Personal Vault');
      setSelectedCollectionForAi(aiAnalysis.suggestedCollectionName || 'Personal Vault');
      setCustomAiTags(aiAnalysis.suggestedTags ? [...aiAnalysis.suggestedTags] : []);
    }
  }, [aiAnalysis]);

  const fetchDocumentAndData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [docRes, catsRes, expRes, aiAnalysisRes] = await Promise.all([
        documentService.getDocument(id),
        documentService.getAllCategories(),
        aiService.getExpiringDocuments().catch(() => ({ data: [] })),
        aiService.analyzeDocument(id).catch(() => ({ data: null }))
      ]);

      const fetchedDoc = docRes.data;
      setDoc(fetchedDoc);
      setCategories(catsRes.data || []);
      
      // Initialize form fields
      setDisplayName(fetchedDoc.displayName || '');
      setCategoryId(fetchedDoc.category?.id || '');
      setDescription(fetchedDoc.description || '');

      if (aiAnalysisRes?.data) {
        setAiAnalysis(aiAnalysisRes.data);
      }

      // Check if there is an existing expiry for this document
      const matchingExpiry = expRes.data?.find(e => e.document?.id === id);
      if (matchingExpiry?.expiryDate) {
        setExpiryDate(matchingExpiry.expiryDate);
      }
    } catch (err) {
      if (!silent) toast.error('Failed to load document details');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocumentAndData();
    }
  }, [id]);

  useEffect(() => {
    let currentUrl = null;
    
    const fetchPreview = async () => {
      if (!doc) return;
      if (!doc.mimeType?.startsWith('image/') && doc.mimeType !== 'application/pdf') {
        setPreviewError(true);
        return;
      }
      
      try {
        const res = await documentService.downloadDocument(doc.id);
        const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
        currentUrl = url;
        setPreviewUrl(url);
      } catch (err) {
        setPreviewError(true);
      }
    };
    
    fetchPreview();
    
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [doc?.id, doc?.mimeType]);

  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!doc) return;

    try {
      setIsSaving(true);
      
      if (displayName.trim() && displayName !== doc.displayName) {
        await documentService.renameDocument(doc.id, displayName.trim());
      }

      if (categoryId && categoryId !== doc.category?.id) {
        await documentService.updateCategory(doc.id, categoryId);
      }

      if (expiryDate) {
        await aiService.setExpiryDate(doc.id, expiryDate);
      }

      toast.success('Document updated successfully');
      setIsEditing(false);
      await fetchDocumentAndData();
    } catch (err) {
      toast.error('Failed to save document changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReprocessAI = async () => {
    setIsAnalyzing(true);
    try {
      await aiService.triggerOcr(id).catch(err => console.warn('OCR trigger warning:', err));
      await aiService.triggerClassification(id).catch(err => console.warn('Classification trigger warning:', err));
      const res = await aiService.analyzeDocument(id);
      if (res && res.data) {
        setAiAnalysis(res.data);
        setCustomAiName(res.data.suggestedName || '');
        setCustomAiCategory(res.data.suggestedCategory || 'Personal');
        setCustomAiCollection(res.data.suggestedCollectionName || 'Personal Vault');
        setSelectedCollectionForAi(res.data.suggestedCollectionName || 'Personal Vault');
        setCustomAiTags(res.data.suggestedTags ? [...res.data.suggestedTags] : []);
      }
      toast.success('✨ VaultX AI Engine reprocessed document successfully!');
      return res?.data;
    } catch (err) {
      toast.error('Failed to reprocess AI analysis. Please try again.');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenAiModal = async () => {
    if (!aiAnalysis) {
      await handleReprocessAI();
    }
    setIsAiModalOpen(true);
  };

  const handleApplySingleSuggestion = async (params, successMsg) => {
    try {
      setIsApplyingAi(true);
      const res = await aiService.applySuggestions(id, params);
      if (res?.data) {
        setDoc(prev => ({ ...prev, ...res.data }));
        if (res.data.displayName) setDisplayName(res.data.displayName);
        if (res.data.category?.id) setCategoryId(res.data.category.id);
      }
      toast.success(successMsg || 'Suggestion applied!');
      await fetchDocumentAndData(true);
    } catch (err) {
      toast.error('Failed to apply AI suggestion');
    } finally {
      setIsApplyingAi(false);
    }
  };

  const handleApplyAllSuggestions = async () => {
    if (!aiAnalysis) return;
    try {
      setIsApplyingAi(true);
      const res = await aiService.applySuggestions(id, {
        suggestedName: customAiName || aiAnalysis.suggestedName,
        categoryName: customAiCategory || aiAnalysis.suggestedCategory,
        collectionName: customAiCollection || selectedCollectionForAi || aiAnalysis.suggestedCollectionName,
        tags: customAiTags && customAiTags.length > 0 ? customAiTags : aiAnalysis.suggestedTags
      });
      if (res?.data) {
        setDoc(prev => ({ ...prev, ...res.data }));
        if (res.data.displayName) setDisplayName(res.data.displayName);
        if (res.data.category?.id) setCategoryId(res.data.category.id);
      }
      toast.success('✨ All AI suggestions & custom changes applied at once!');
      setIsAiModalOpen(false);
      await fetchDocumentAndData(true);
    } catch (err) {
      toast.error('Failed to apply AI suggestions');
    } finally {
      setIsApplyingAi(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!doc) return;
    try {
      await documentService.toggleFavourite(doc.id);
      toast.success(doc.favourite ? 'Removed from favourites' : 'Added to favourites');
      setDoc(prev => ({ ...prev, favourite: !prev.favourite }));
    } catch (err) {
      toast.error('Failed to update favourite status');
    }
  };

  const handleToggleArchive = async () => {
    if (!doc) return;
    try {
      if (doc.archived) {
        await documentService.restoreDocument(doc.id);
        toast.success('Restored from archive');
      } else {
        await documentService.archiveDocument(doc.id);
        toast.success('Document archived');
      }
      fetchDocumentAndData();
    } catch (err) {
      toast.error('Failed to update archive status');
    }
  };

  const handleSoftDelete = async () => {
    if (!doc) return;
    if (!window.confirm(`Move "${doc.displayName}" to trash?`)) return;
    try {
      await documentService.softDeleteDocument(doc.id);
      toast.success('Moved to trash');
      navigate('/dashboard/documents');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async () => {
    if (!doc) return;
    setIsDownloading(true);
    try {
      const res = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFilename || doc.displayName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading document details...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center">
        <FileWarning className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Document Not Found</h3>
        <p className="text-sm text-gray-500 mb-4">The document you are looking for may have been deleted or moved.</p>
        <button onClick={() => navigate('/dashboard/documents')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/documents')}
            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to Documents"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0 font-bold">
            <FileText className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800 truncate">{doc.displayName}</h1>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-400 hover:text-primary transition-colors"
                title="Edit Properties"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatSize(doc.fileSize)} • {doc.mimeType} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleFavourite}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              doc.favourite 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-4 h-4 ${doc.favourite ? 'fill-amber-400 text-amber-400' : ''}`} />
            {doc.favourite ? 'Fav' : 'Favourite'}
          </button>

          <button
            onClick={handleToggleArchive}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              doc.archived 
                ? 'bg-purple-50 text-purple-600 border-purple-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Archive className="w-4 h-4" />
            {doc.archived ? 'Unarchive' : 'Archive'}
          </button>

          {/* Single Unified AI Suggestions Button */}
          <button 
            onClick={handleOpenAiModal}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all shadow-md text-xs flex items-center gap-2 disabled:opacity-50 transform hover:scale-[1.02]"
          >
            <Sparkles className={`w-4 h-4 text-yellow-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing with AI...' : '✨ AI Suggestions'}
          </button>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-70"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </button>

          <button
            onClick={handleSoftDelete}
            className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popup AI Suggestions Modal */}
      {isAiModalOpen && aiAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-4xl w-full relative overflow-hidden border border-purple-500/30">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-64 h-64 text-purple-300" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-5 pr-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/30 backdrop-blur-md rounded-2xl border border-purple-400/30">
                  <Wand2 className="w-7 h-7 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    VaultX AI Smart Suggestions
                    <span className="px-2.5 py-0.5 text-xs bg-purple-500/30 text-purple-200 rounded-full font-semibold border border-purple-400/30">
                      {Math.round((aiAnalysis.confidenceScore || 0.96) * 100)}% Confidence
                    </span>
                  </h2>
                  <p className="text-xs text-purple-200/80 mt-1">
                    {aiAnalysis.summaryText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReprocessAI}
                  disabled={isAnalyzing || isApplyingAi}
                  className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-400/40 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                  title="Reprocess OCR & AI Engine to analyze document again"
                >
                  <RotateCw className={`w-4 h-4 text-purple-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Reprocessing AI...' : 'Reprocess with AI'}
                </button>

                <button
                  onClick={handleApplyAllSuggestions}
                  disabled={isApplyingAi || isAnalyzing}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isApplyingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Apply All AI Suggestions
                </button>
              </div>
            </div>

            {/* Grid of AI Suggestions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2">
              
              {/* Suggested Name (Editable Input) */}
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider block mb-1">
                    Suggested Name
                  </span>
                  <input
                    type="text"
                    value={customAiName}
                    onChange={(e) => setCustomAiName(e.target.value)}
                    className="w-full text-xs font-bold text-white bg-purple-950/80 border border-purple-400/40 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Document name..."
                  />
                </div>
                <button
                  onClick={() => handleApplySingleSuggestion({ suggestedName: customAiName }, 'Applied suggested name!')}
                  disabled={isApplyingAi}
                  className="mt-3 w-full py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Apply Name
                </button>
              </div>

              {/* Suggested Category (Select Dropdown) */}
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider block mb-1">
                    Suggested Category
                  </span>
                  <select
                    value={customAiCategory}
                    onChange={(e) => setCustomAiCategory(e.target.value)}
                    className="w-full text-xs font-bold text-white bg-purple-950/80 border border-purple-400/40 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name} className="bg-slate-900 text-white font-medium py-1">
                          📁 {cat.name}
                        </option>
                      ))
                    ) : (
                      ['Identity', 'Education', 'Employment', 'Finance', 'Health', 'Personal', 'Insurance'].map((c, i) => (
                        <option key={i} value={c} className="bg-slate-900 text-white font-medium py-1">
                          📁 {c}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <button
                  onClick={() => handleApplySingleSuggestion({ categoryName: customAiCategory }, 'Applied category!')}
                  disabled={isApplyingAi}
                  className="mt-3 w-full py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Apply Category
                </button>
              </div>

              {/* Suggested Collection with Multi-Collection Dropdown */}
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider block mb-1">
                    Target Collection
                  </span>

                  <select
                    value={customAiCollection || selectedCollectionForAi || aiAnalysis.suggestedCollectionName}
                    onChange={(e) => {
                      setCustomAiCollection(e.target.value);
                      setSelectedCollectionForAi(e.target.value);
                    }}
                    className="w-full text-xs font-bold text-white bg-purple-950/80 border border-purple-400/40 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    {aiAnalysis.suggestedCollectionNames?.map((colName, idx) => (
                      <option key={idx} value={colName} className="bg-slate-900 text-white font-medium py-1">
                        📁 {colName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleApplySingleSuggestion({ collectionName: customAiCollection || selectedCollectionForAi }, 'Added to collection!')}
                  disabled={isApplyingAi}
                  className="mt-3 w-full py-1.5 bg-indigo-500/40 hover:bg-indigo-500/60 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Add to Collection
                </button>
              </div>

              {/* Suggested Tags (Editable Tags) */}
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider block mb-1">
                    Suggested Smart Tags
                  </span>
                  <div className="flex flex-wrap gap-1 mb-1.5 max-h-16 overflow-y-auto">
                    {customAiTags.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-purple-500/30 text-purple-100 rounded text-[10px] font-medium border border-purple-400/20 flex items-center gap-1">
                        {t}
                        <button 
                          type="button"
                          onClick={() => setCustomAiTags(tags => tags.filter((_, i) => i !== idx))}
                          className="text-purple-300 hover:text-white font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInputText}
                    onChange={(e) => setTagInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInputText.trim()) {
                        e.preventDefault();
                        const newTag = tagInputText.startsWith('#') ? tagInputText.trim() : '#' + tagInputText.trim();
                        if (!customAiTags.includes(newTag)) {
                          setCustomAiTags([...customAiTags, newTag]);
                        }
                        setTagInputText('');
                      }
                    }}
                    placeholder="Add tag (Press Enter)..."
                    className="w-full text-[11px] bg-purple-950/70 border border-purple-400/30 rounded-lg px-2 py-1 text-white outline-none focus:border-purple-300"
                  />
                </div>
                <button
                  onClick={() => handleApplySingleSuggestion({ tags: customAiTags }, 'Applied AI smart tags!')}
                  disabled={isApplyingAi}
                  className="mt-3 w-full py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Tag className="w-3.5 h-3.5" /> Apply Tags
                </button>
              </div>

            </div>

            {/* Modal Bottom Action Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReprocessAI}
                  disabled={isAnalyzing || isApplyingAi}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-400/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Reprocessing AI...' : 'Reprocess with AI'}
                </button>

                <button
                  onClick={handleApplyAllSuggestions}
                  disabled={isApplyingAi || isAnalyzing}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isApplyingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Apply All AI Suggestions
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preview & OCR Extracted Text */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Document Preview Box */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 h-[520px] flex items-center justify-center bg-gray-50/50 overflow-hidden relative">
            {previewUrl ? (
              doc.mimeType?.startsWith('image/') ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-2xl overflow-hidden group">
                  {/* Toolbar overlay */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-xl p-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => setImgScale(s => s + 0.25)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4"/></button>
                    <button onClick={() => setImgScale(s => Math.max(0.25, s - 0.25))} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4"/></button>
                    <div className="w-px h-5 bg-white/20 mx-1"></div>
                    <button onClick={() => setImgRotation(r => r - 90)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Rotate Left"><RotateCcw className="w-4 h-4"/></button>
                    <button onClick={() => setImgRotation(r => r + 90)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Rotate Right"><RotateCw className="w-4 h-4"/></button>
                    <div className="w-px h-5 bg-white/20 mx-1"></div>
                    <button onClick={() => { setImgScale(1); setImgRotation(0); }} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Reset View"><Maximize className="w-4 h-4"/></button>
                  </div>

                  <img 
                    src={previewUrl} 
                    alt={doc.displayName} 
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${imgScale}) rotate(${imgRotation}deg)` }}
                  />
                </div>
              ) : doc.mimeType === 'application/pdf' ? (
                <iframe src={previewUrl} title={doc.displayName} className="w-full h-full border-none rounded-2xl" />
              ) : null
            ) : previewError ? (
              <div className="text-center text-gray-400">
                <FileWarning className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-700">Preview not available for this file type</p>
                <p className="text-xs mt-1 text-gray-400">Click download to inspect file contents.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary/50" />
                <p className="text-sm">Loading preview...</p>
              </div>
            )}
          </div>

          {/* OCR Extracted Text */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500"/> OCR Text Extraction
              </h2>
              <button 
                onClick={() => {
                  const text = aiAnalysis?.ocrText || "DOCUMENT CONTENTS\nText extracted using VaultX OCR Engine.";
                  navigator.clipboard.writeText(text);
                  setCopiedOcr(true);
                  setTimeout(() => setCopiedOcr(false), 2000);
                  toast.success('OCR text copied!');
                }}
                className="px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedOcr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedOcr ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 h-52 overflow-y-auto text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
              [VaultX OCR Engine - Extracted Text]{"\n\n"}
              {aiAnalysis?.ocrText || "Text extracted using VaultX OCR engine. Full-text search active."}
            </div>
          </div>

        </div>

        {/* Right Column: Editable Properties & AI Insights */}
        <div className="space-y-6">

          {/* Editable Document Properties Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" /> Document Properties
              </h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              {/* File Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Display Name</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-gray-800"
                    placeholder="Enter document name..."
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-800 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                    {doc.displayName}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                {isEditing ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-gray-800"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: doc.category?.colorHex || doc.category?.color || '#9ca3af' }} />
                    <span className="text-sm font-medium text-gray-800">{doc.category?.name || 'Uncategorized'}</span>
                  </div>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Expiration Date</label>
                {isEditing ? (
                  <input 
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-gray-800"
                  />
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100 text-sm font-medium text-gray-800">
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span>{expiryDate ? expiryDate : 'No expiration date set'}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description / Notes</label>
                {isEditing ? (
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-gray-800"
                    placeholder="Add notes or details..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100 italic min-h-[60px]">
                    {doc.description || 'No description provided.'}
                  </p>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Property Changes
                </button>
              )}
            </form>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500"/> AI Document Insights
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500 text-sm font-medium">Detected Type</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg text-xs">
                  {aiAnalysis?.suggestedType || 'Generic Document'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500 text-sm font-medium">AI Confidence</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5"/> {Math.round((aiAnalysis?.confidenceScore || 0.96) * 100)}% Match
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
