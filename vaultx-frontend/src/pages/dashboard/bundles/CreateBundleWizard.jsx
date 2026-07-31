import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronLeft, Check, FileText, Search, Settings, File, Layout, X, Image as ImageIcon, Clock, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import bundleService from '../../../services/bundleService';
import documentService from '../../../services/documentService';
import { tempStorageService } from '../../../utils/tempStorageService';

const STEPS = ['Details', 'Choose Documents', 'Arrange', 'Settings', 'Review'];
const COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-emerald-500', 'bg-teal-500', 'bg-gray-800'];

export default function CreateBundleWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Vault & Temp Storage Data
  const [vaultDocs, setVaultDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [tempFilesList, setTempFilesList] = useState([]);

  // Preview Modal
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    title: '',
    mimeType: '',
    url: null,
    file: null
  });

  const handleOpenTempModal = () => {
    const files = tempStorageService.getFiles();
    setTempFilesList(files || []);
    setTempModalOpen(true);
  };

  const handleSelectTempDoc = async (tempFile) => {
    setTempModalOpen(false);
    const toastId = toast.loading(`Adding ${tempFile.name}...`);
    try {
      const arrayBuffer = await tempStorageService.getFileArrayBuffer(tempFile);
      const tempDoc = {
        id: tempFile.id,
        displayName: tempFile.name,
        mimeType: tempFile.type || 'application/pdf',
        fileSize: tempFile.size,
        arrayBuffer,
        isLocal: true
      };
      setSelectedDocs(prev => [...prev, tempDoc]);
      toast.success(`Added ${tempFile.name} from Temp Storage`, { id: toastId });
    } catch (err) {
      toast.error('Failed to add temporary storage file', { id: toastId });
    }
  };

  const openPreviewForTempDoc = async (tempFile) => {
    const toastId = toast.loading(`Loading preview for ${tempFile.name}...`);
    try {
      const url = await tempStorageService.getFileObjectURL(tempFile);
      setPreviewDocModal({
        isOpen: true,
        title: tempFile.name,
        mimeType: tempFile.type || 'application/pdf',
        url,
        file: tempFile
      });
      toast.dismiss(toastId);
    } catch (err) {
      toast.error('Failed to load file preview', { id: toastId });
    }
  };

  // Form State
  const [details, setDetails] = useState({
    name: template?.name || '',
    description: template?.description || '',
    color: template?.color || COLORS[0],
    icon: 'FolderHeart'
  });

  const [selectedDocs, setSelectedDocs] = useState([]); // Array of document objects

  const [settings, setSettings] = useState({
    includeCoverPage: true,
    includeToc: true,
    includePageNumbers: true,
    watermarkText: '',
    compressOutput: false,
    outputName: ''
  });

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await documentService.getActiveDocuments(0, 100); // Fetch up to 100 docs for selection
        setVaultDocs(res.data.content);
      } catch (err) {
        toast.error('Failed to load your documents');
      }
    };
    fetchDocs();
  }, []);

  const handleNext = () => {
    if (currentStep === 0 && !details.name.trim()) {
      toast.error('Bundle name is required');
      return;
    }
    if (currentStep === 1 && selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: details.name,
        description: details.description,
        color: details.color,
        icon: details.icon,
        settings: settings,
        documentIds: selectedDocs.map(d => d.id)
      };
      
      const res = await bundleService.createBundle(payload);
      toast.success('Bundle created successfully!');
      navigate(`/dashboard/bundles/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to create bundle');
      setIsSubmitting(false);
    }
  };



  // Drag and drop handlers for Arrange step (Vertical List)
  const onDragEndArrange = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedDocs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedDocs(items);
  };

  // --- Step Renders ---
  
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-4 sm:mb-8 px-4 sm:px-12 relative w-full overflow-hidden">
      <div className="absolute top-1/2 left-8 right-8 sm:left-12 sm:right-12 h-0.5 bg-gray-100 -z-10 -translate-y-1/2" />
      <div 
        className="absolute top-1/2 left-8 sm:left-12 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-300"
        style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 3rem)` }}
      />
      {STEPS.map((step, idx) => (
        <div key={step} className="flex flex-col items-center gap-1 sm:gap-2">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors border-2 z-10
            ${currentStep > idx ? 'bg-primary border-primary text-white' : 
              currentStep === idx ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 
              'bg-white border-gray-200 text-gray-400'}`}
          >
            {currentStep > idx ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : idx + 1}
          </div>
          <span className={`text-[10px] sm:text-xs font-medium hidden md:block ${currentStep >= idx ? 'text-gray-800' : 'text-gray-400'}`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
          placeholder="e.g. Placement Documents 2026"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea 
          value={details.description}
          onChange={(e) => setDetails({ ...details, description: e.target.value })}
          placeholder="What is this bundle used for?"
          rows={3}
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Theme Color</label>
        <div className="flex gap-3">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => setDetails({ ...details, color })}
              className={`w-10 h-10 rounded-full ${color} flex items-center justify-center transition-transform
                ${details.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
            >
              {details.color === color && <Check className="w-5 h-5 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const renderChooseStep = () => {
    const availableDocs = vaultDocs.filter(d => 
      d.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full">
        {/* Header with Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Select Documents</h3>
            <p className="text-sm text-gray-500 font-medium">
              <span className="text-primary font-bold">{selectedDocs.length}</span> selected for bundle
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenTempModal}
              className="px-3 py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Clock className="w-4 h-4" /> Pick Temp File
            </button>
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 p-2 sm:p-4 overflow-y-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {availableDocs.map((doc) => {
              const isSelected = selectedDocs.some(sd => sd.id === doc.id);
              return (
                <div 
                  key={doc.id}
                  onClick={() => {
                    if (isSelected) setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
                    else setSelectedDocs([...selectedDocs, doc]);
                  }}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer
                    ${isSelected ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md transform scale-[1.02]' : 'bg-white border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-md'}`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-dark' : 'text-gray-800'}`}>
                      {doc.displayName}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-1">
                    {isSelected ? (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {availableDocs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No matching documents found</p>
              <p className="text-xs text-center max-w-xs text-gray-400">
                Adjust your search or click "Pick Temp File" to add a new document to this bundle.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderArrangeStep = () => (
    <div className="max-w-2xl mx-auto h-full flex flex-col w-full">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex gap-3">
        <Layout className="w-5 h-5 flex-shrink-0" />
        <p>Drag and drop items to reorder them. This order will be preserved in the generated PDF and Table of Contents.</p>
      </div>

      <DragDropContext onDragEnd={onDragEndArrange}>
        <Droppable droppableId="arrange">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50/50 rounded-2xl border border-gray-100"
            >
              {selectedDocs.map((doc, index) => (
                <Draggable key={doc.id} draggableId={doc.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm
                        ${snapshot.isDragging ? 'border-primary ring-2 ring-primary/20 scale-[1.02] shadow-xl' : 'border-gray-200'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {index + 1}
                      </div>
                      {getFileIcon(doc.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.displayName}</p>
                        <p className="text-xs text-gray-400">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">Cover Page</h4>
            <p className="text-sm text-gray-500">Generate a branded cover page</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.includeCoverPage} onChange={(e) => setSettings({...settings, includeCoverPage: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">Table of Contents</h4>
            <p className="text-sm text-gray-500">Include clickable index of documents</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.includeToc} onChange={(e) => setSettings({...settings, includeToc: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">Page Numbers</h4>
            <p className="text-sm text-gray-500">Stamp page numbers on footer</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.includePageNumbers} onChange={(e) => setSettings({...settings, includePageNumbers: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">Compress PDF</h4>
            <p className="text-sm text-gray-500">Reduce quality to save space</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.compressOutput} onChange={(e) => setSettings({...settings, compressOutput: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-1">Watermark Text (Optional)</label>
          <input 
            type="text" 
            value={settings.watermarkText}
            onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
            placeholder="e.g. STRICTLY CONFIDENTIAL"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const totalSize = selectedDocs.reduce((acc, doc) => acc + doc.fileSize, 0);
    const estimatedOutputSize = settings.compressOutput ? totalSize * 0.7 : totalSize * 1.1; // Very rough estimation
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl ${details.color} flex items-center justify-center text-white shadow-lg`}>
            <FileText className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{details.name}</h3>
            <p className="text-gray-500 mt-1">{details.description || 'No description'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Documents</p>
            <p className="text-2xl font-bold text-gray-800">{selectedDocs.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Estimated Size</p>
            <p className="text-2xl font-bold text-gray-800">{(estimatedOutputSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Export Configuration</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-700">
              {settings.includeCoverPage ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-danger" />}
              Cover Page
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              {settings.includeToc ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-danger" />}
              Table of Contents
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              {settings.includePageNumbers ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-danger" />}
              Page Numbers
            </li>
            {settings.compressOutput && (
               <li className="flex items-center gap-3 text-sm text-gray-700">
                 <Check className="w-4 h-4 text-green-500" /> Compression Enabled
               </li>
            )}
            {settings.watermarkText && (
               <li className="flex items-center gap-3 text-sm text-gray-700">
                 <Check className="w-4 h-4 text-green-500" /> Watermark: "{settings.watermarkText}"
               </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pb-8 w-full max-w-full overflow-x-hidden">
      
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard/bundles')} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Create Bundle</h1>
          <p className="page-subtitle mt-0.5">Build a smart document collection</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        
        <div className="pt-8 pb-4">
          {renderStepIndicator()}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/30 flex flex-col relative">
          {currentStep === 0 && renderDetailsStep()}
          {currentStep === 1 && renderChooseStep()}
          {currentStep === 2 && renderArrangeStep()}
          {currentStep === 3 && renderSettingsStep()}
          {currentStep === 4 && renderReviewStep()}
          
          {/* Spacer to prevent content from hiding behind fixed footer on mobile */}
          <div className="h-20 md:hidden flex-shrink-0" />
        </div>

        <div className="fixed md:static bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-gray-200 md:border-gray-100 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-none z-20">
          <button 
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-0"
          >
            Back
          </button>
          
          {currentStep < STEPS.length - 1 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-success text-white hover:bg-success/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-5 h-5" /> Create Bundle</>
              )}
            </button>
          )}
        </div>

      </div>

      {/* --- TEMP STORAGE SELECTION MODAL --- */}
      {tempModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Select from 7-Day Temporary Storage</h3>
                  <p className="text-xs text-gray-500">Pick staged PDFs or exported files to add to your bundle</p>
                </div>
              </div>
              <button 
                onClick={() => setTempModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50/50 min-h-[300px]">
              {tempFilesList.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs">
                  No temporary files found in 7-day storage.
                </div>
              ) : (
                tempFilesList.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl hover:border-purple-300 hover:shadow-xs transition-all">
                    <div 
                      onClick={() => openPreviewForTempDoc(file)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                      title="Click to preview file"
                    >
                      <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-purple-600 truncate transition-colors">{file.name}</p>
                        <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                          ⏳ {tempStorageService.getTimeRemaining(file.expiresAt)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openPreviewForTempDoc(file)}
                        className="p-2 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-xl transition-all border border-gray-100"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTempDoc(file)}
                        className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-all shadow-xs"
                      >
                        Add +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE TEMPORARY FILE PREVIEW MODAL --- */}
      {previewDocModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
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
                  onClick={() => {
                    handleSelectTempDoc(previewDocModal.file);
                    setPreviewDocModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  Select This Document
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
