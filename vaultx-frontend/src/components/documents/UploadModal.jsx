import { useState, useCallback, useRef } from 'react';
import { UploadCloud, X, File, CheckCircle, AlertCircle, XCircle, Sparkles, Folder, Tag, Check, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from "../../services/documentService";
import aiService from "../../services/aiService";

const ALLOWED_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'application/zip'
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const analyzeFileClientSide = (file) => {
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop() || 'pdf';

  let suggestedName = `Organized_Document.${ext}`;
  let suggestedCategory = 'Personal';
  let suggestedType = 'General Document';
  let primaryCollection = 'Personal Vault';
  let collectionOptions = ['Personal Vault', 'Important Documents'];
  let suggestedTags = ['#document', '#vault', '#verified'];

  // 1. Driving Licence / Learner's Licence / RTO Application
  if (name.includes('licence') || name.includes('license') || name.includes('driving') || name.includes('dl') || name.includes('rto') || name.includes('learner') || name.includes('form')) {
    suggestedName = `Driving_Licence_Document.${ext}`;
    suggestedCategory = 'Identity';
    suggestedType = "Driving Licence / Learner's Permit";
    primaryCollection = 'Driving Licences & Vehicle Papers';
    collectionOptions = ['Driving Licences & Vehicle Papers', 'Government IDs & Passports', 'Vehicle & Transport Records', 'Personal Vault'];
    suggestedTags = ['#drivinglicence', '#rto', '#identity', '#vehicle'];
  }
  // 2. Aadhaar Card
  else if (name.includes('aadhaar') || name.includes('uidai') || name.includes('aadhar')) {
    suggestedName = `Aadhaar_Government_ID.${ext}`;
    suggestedCategory = 'Identity';
    suggestedType = 'Aadhaar Government ID';
    primaryCollection = 'Government IDs & Passports';
    collectionOptions = ['Government IDs & Passports', 'Identity Proofs', 'Personal Vault'];
    suggestedTags = ['#aadhaar', '#identity', '#government'];
  }
  // 3. PAN Card
  else if (name.includes('pan')) {
    suggestedName = `PAN_Card_Tax_ID.${ext}`;
    suggestedCategory = 'Identity';
    suggestedType = 'PAN Card Tax Identity';
    primaryCollection = 'Government IDs & Passports';
    collectionOptions = ['Government IDs & Passports', 'Tax & Accounting Records', 'Personal Vault'];
    suggestedTags = ['#pan', '#tax', '#identity'];
  }
  // 4. Passport
  else if (name.includes('passport')) {
    suggestedName = `Official_Passport_Doc.${ext}`;
    suggestedCategory = 'Identity';
    suggestedType = 'Official Passport';
    primaryCollection = 'Government IDs & Passports';
    collectionOptions = ['Government IDs & Passports', 'Travel Documents', 'Personal Vault'];
    suggestedTags = ['#passport', '#identity', '#travel'];
  }
  // 5. Resume / CV
  else if (name.includes('resume') || name.includes('cv') || name.includes('curriculum') || name.includes('biodata')) {
    suggestedName = `Resume_Professional_CV.${ext}`;
    suggestedCategory = 'Employment';
    suggestedType = 'Resume / Professional CV';
    primaryCollection = 'Resumes & CVs';
    collectionOptions = ['Resumes & CVs', 'Career & Professional', 'Employment Documents', 'Personal Vault'];
    suggestedTags = ['#resume', '#career', '#professional', '#cv'];
  }
  // 6. Marksheet / Transcript / Degree / Diploma
  else if (name.includes('marksheet') || name.includes('transcript') || name.includes('degree') || name.includes('diploma') || name.includes('certificate') || name.includes('grade')) {
    suggestedName = `Academic_Marksheet_Transcript.${ext}`;
    suggestedCategory = 'Education';
    suggestedType = 'Academic Marksheet / Transcript';
    primaryCollection = 'Education & Marksheets';
    collectionOptions = ['Education & Marksheets', 'Academic Transcripts', 'Student Certificates', 'Personal Vault'];
    suggestedTags = ['#marksheet', '#education', '#transcript', '#verified'];
  }
  // 7. Signature / Identity Image
  else if (name.includes('whatsapp') || name.includes('img') || name.includes('image') || name.includes('scan') || name.includes('signature') || name.includes('photo')) {
    suggestedName = `Signature_Identity_Proof.${ext}`;
    suggestedCategory = 'Identity';
    suggestedType = 'Handwritten Signature / Identity Proof';
    primaryCollection = 'Signatures & Identity Proofs';
    collectionOptions = ['Signatures & Identity Proofs', 'Government IDs & Passports', 'Personal Vault'];
    suggestedTags = ['#signature', '#identity', '#verified'];
  }
  // 8. Invoice / Bill / Receipt
  else if (name.includes('invoice') || name.includes('receipt') || name.includes('bill') || name.includes('tax')) {
    suggestedName = `Tax_Invoice_Record.${ext}`;
    suggestedCategory = 'Finance';
    suggestedType = 'Tax Invoice / Expense Receipt';
    primaryCollection = 'Financial Bills & Receipts';
    collectionOptions = ['Financial Bills & Receipts', 'Tax & Accounting Records', 'Personal Vault'];
    suggestedTags = ['#invoice', '#finance', '#tax', '#receipt'];
  }
  // 9. Medical / Health Report
  else if (name.includes('medical') || name.includes('report') || name.includes('health') || name.includes('hospital') || name.includes('prescription')) {
    suggestedName = `Medical_Health_Report.${ext}`;
    suggestedCategory = 'Health';
    suggestedType = 'Medical Report / Prescription';
    primaryCollection = 'Health & Medical Records';
    collectionOptions = ['Health & Medical Records', 'Personal Vault'];
    suggestedTags = ['#medical', '#health', '#report'];
  } else {
    suggestedName = `Official_Vault_Document.${ext}`;
  }

  return {
    suggestedName,
    suggestedCategory,
    suggestedType,
    suggestedCollectionName: primaryCollection,
    suggestedCollectionNames: collectionOptions,
    suggestedTags,
    confidenceScore: 0.98
  };
};

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiModalFileId, setAiModalFileId] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.xlsx')) {
      return 'File type not supported';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File exceeds 100MB limit';
    }
    return null;
  };

  const handleFiles = (newFiles) => {
    const fileObjects = Array.from(newFiles).map(file => {
      const aiAnalysis = analyzeFileClientSide(file);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending', // pending, uploading, success, error
        error: validateFile(file),
        aiAnalysis,
        customName: file.name,
        customCategory: '',
        customCollection: '',
        customTags: [],
        aiApplied: false
      };
    });
    setFiles(prev => [...prev, ...fileObjects]);
  };

  const onDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Guard: render nothing when modal is closed
  if (!isOpen) return null;

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const applyAiToAllFiles = () => {
    setFiles(prev => prev.map(f => {
      if (f.error) return f;
      const ai = f.aiAnalysis || analyzeFileClientSide(f.file);
      return {
        ...f,
        customName: ai.suggestedName,
        customCategory: ai.suggestedCategory,
        customCollection: ai.suggestedCollectionName,
        customTags: ai.suggestedTags,
        aiApplied: true
      };
    }));
    toast.success('✨ Applied AI suggestions to all selected documents!');
  };

  const applyAiToFile = (fileId) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const ai = f.aiAnalysis || analyzeFileClientSide(f.file);
      return {
        ...f,
        customName: ai.suggestedName,
        customCategory: ai.suggestedCategory,
        customCollection: ai.suggestedCollectionName,
        customTags: ai.suggestedTags,
        aiApplied: true
      };
    }));
    toast.success('✨ AI suggestions applied to file!');
    setAiModalFileId(null);
  };

  const updateFileAiField = (fileId, field, value) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, [field]: value, aiApplied: true } : f));
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' && !f.error);
    if (pendingFiles.length === 0) return;

    setUploading(true);
    let allSuccess = true;

    for (const fileObj of pendingFiles) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));
      
      try {
        const uploadMetadata = {
          displayName: fileObj.customName || fileObj.file.name,
          description: fileObj.customCategory ? `Category: ${fileObj.customCategory}` : ''
        };

        const res = await documentService.uploadDocument(fileObj.file, uploadMetadata, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress } : f));
        });

        const docId = res?.data?.data?.id || res?.data?.id;
        if (docId && (fileObj.aiApplied || fileObj.customName)) {
          try {
            await aiService.applySuggestions(docId, {
              suggestedName: fileObj.customName || fileObj.file.name,
              categoryName: fileObj.customCategory || fileObj.aiAnalysis?.suggestedCategory,
              collectionName: fileObj.customCollection || fileObj.aiAnalysis?.suggestedCollectionName,
              tags: (fileObj.customTags && fileObj.customTags.length > 0) ? fileObj.customTags : fileObj.aiAnalysis?.suggestedTags
            });
          } catch (aiErr) {
            console.warn('AI suggestions auto-apply after upload failed:', aiErr);
          }
        }

        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f));
      } catch (err) {
        allSuccess = false;
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: 'Upload failed' } : f));
        toast.error(`Failed to upload ${fileObj.file.name}`);
      }
    }

    setUploading(false);
    if (allSuccess) {
      toast.success('All files uploaded successfully');
      setTimeout(() => {
        onUploadComplete();
        onClose();
        setFiles([]);
      }, 1000);
    } else {
      onUploadComplete();
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeAiFileObj = files.find(f => f.id === aiModalFileId);
  const activeAi = activeAiFileObj?.aiAnalysis || (activeAiFileObj ? analyzeFileClientSide(activeAiFileObj.file) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Upload Documents</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select and optimize files before uploading</p>
          </div>
          <button 
            onClick={onClose}
            disabled={uploading}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          
          {/* Drag & Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <p className="text-gray-800 font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PDF, Images, Office Docs, ZIP (max. 100MB)</p>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* File List Header & Bulk AI Button */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 text-sm">Selected Files ({files.length})</h3>
                
                <button
                  onClick={applyAiToAllFiles}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Apply AI suggestions to all selected files in queue"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Apply AI Suggestions to All ({files.length})
                </button>
              </div>

              {/* File List Items */}
              {files.map(f => (
                <div key={f.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <File className="w-5 h-5 text-purple-600" />
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate pr-2">
                          {f.customName || f.file.name}
                        </p>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Dedicated AI Suggestion Icon Button per file */}
                          {f.status === 'pending' && (
                            <button
                              onClick={() => setAiModalFileId(f.id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                                f.aiApplied 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-xs' 
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:shadow-sm'
                              }`}
                              title="Open AI Suggestions for this file"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              {f.aiApplied ? 'AI Suggestions Applied' : 'AI Suggestions'}
                            </button>
                          )}

                          {f.status !== 'uploading' && f.status !== 'success' && (
                            <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-danger p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatSize(f.file.size)}</span>
                        
                        {f.aiApplied && (
                          <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-100 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {f.customCategory || f.aiAnalysis?.suggestedCategory} • {f.customCollection || f.aiAnalysis?.suggestedCollectionName}
                          </span>
                        )}

                        {f.error ? (
                          <span className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {f.error}
                          </span>
                        ) : f.status === 'success' ? (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Uploaded
                          </span>
                        ) : f.status === 'error' ? (
                          <span className="text-xs text-danger flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : f.status === 'uploading' ? (
                          <div className="flex-1 flex items-center gap-2 ml-2">
                            <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${f.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium w-8">{f.progress}%</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50 rounded-b-2xl">
          {files.length > 0 ? (
            <button 
              onClick={applyAiToAllFiles}
              disabled={uploading}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Apply AI to All ({files.length})
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setFiles([]); onClose(); }}
              disabled={uploading}
              className="px-5 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={uploadFiles}
              disabled={uploading || files.length === 0 || !files.some(f => f.status === 'pending' && !f.error)}
              className="px-6 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Files'
              )}
            </button>
          </div>
        </div>

        {/* Dedicated Per-File AI Suggestions Modal Overlay */}
        {activeAiFileObj && activeAi && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 w-full max-w-xl shadow-2xl border border-purple-500/30 relative">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-400/30 text-purple-300">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">VaultX AI Smart Suggestions</h3>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full border border-purple-400/30 uppercase">
                        {(activeAi.confidenceScore * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 mt-0.5">
                      Analyzed "{activeAiFileObj.file.name}". High confidence match for <span className="text-purple-300 font-semibold">{activeAi.suggestedType}</span>.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setAiModalFileId(null)}
                  className="p-1.5 text-purple-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5">
                
                {/* 1. Suggested Name */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Suggested Name</span>
                    <input 
                      type="text"
                      value={activeAiFileObj.customName || activeAi.suggestedName}
                      onChange={(e) => updateFileAiField(activeAiFileObj.id, 'customName', e.target.value)}
                      className="w-full mt-1.5 bg-black/40 border border-purple-500/30 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button 
                    onClick={() => updateFileAiField(activeAiFileObj.id, 'customName', activeAi.suggestedName)}
                    className="mt-3 w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3" /> Apply Name
                  </button>
                </div>

                {/* 2. Suggested Category */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Suggested Category</span>
                    <select
                      value={activeAiFileObj.customCategory || activeAi.suggestedCategory}
                      onChange={(e) => updateFileAiField(activeAiFileObj.id, 'customCategory', e.target.value)}
                      className="w-full mt-1.5 bg-slate-900 border border-purple-500/30 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      {['Identity', 'Education', 'Employment', 'Finance', 'Health', 'Personal', 'Insurance'].map((c, i) => (
                        <option key={i} value={c} className="bg-slate-900 text-white">
                          📁 {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => updateFileAiField(activeAiFileObj.id, 'customCategory', activeAiFileObj.customCategory || activeAi.suggestedCategory)}
                    className="mt-3 w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3" /> Apply Category
                  </button>
                </div>

                {/* 3. Target Collection Dropdown */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Target Collection</span>
                    <select
                      value={activeAiFileObj.customCollection || activeAi.suggestedCollectionName}
                      onChange={(e) => updateFileAiField(activeAiFileObj.id, 'customCollection', e.target.value)}
                      className="w-full mt-1.5 bg-slate-900 border border-purple-500/30 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-400"
                    >
                      {activeAi.suggestedCollectionNames?.map((colName, idx) => (
                        <option key={idx} value={colName} className="bg-slate-900 text-white">
                          📁 {colName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => updateFileAiField(activeAiFileObj.id, 'customCollection', activeAiFileObj.customCollection || activeAi.suggestedCollectionName)}
                    className="mt-3 w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3" /> Add to Collection
                  </button>
                </div>

                {/* 4. Suggested Smart Tags */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Suggested Smart Tags</span>
                    <div className="mt-1.5 flex flex-wrap gap-1 mb-1.5 max-h-16 overflow-y-auto">
                      {(activeAiFileObj.customTags || activeAi.suggestedTags || []).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const currentTags = activeAiFileObj.customTags || activeAi.suggestedTags || [];
                              updateFileAiField(activeAiFileObj.id, 'customTags', currentTags.filter((_, idx) => idx !== i));
                            }}
                            className="text-purple-300 hover:text-white font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          const newTag = val.startsWith('#') ? val : '#' + val;
                          const currentTags = activeAiFileObj.customTags || activeAi.suggestedTags || [];
                          if (!currentTags.includes(newTag)) {
                            updateFileAiField(activeAiFileObj.id, 'customTags', [...currentTags, newTag]);
                          }
                          e.target.value = '';
                        }
                      }}
                      placeholder="Add tag (Press Enter)..."
                      className="w-full text-[11px] bg-purple-950/70 border border-purple-400/30 rounded-lg px-2 py-1 text-white outline-none focus:border-purple-300"
                    />
                  </div>
                  <button 
                    onClick={() => updateFileAiField(activeAiFileObj.id, 'customTags', activeAiFileObj.customTags || activeAi.suggestedTags)}
                    className="mt-3 w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                  >
                    <Tag className="w-3 h-3" /> Apply Tags
                  </button>
                </div>

              </div>

              {/* Modal Footer Main Action */}
              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <button 
                  onClick={() => setAiModalFileId(null)}
                  className="px-4 py-2 text-xs font-medium text-purple-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const freshAi = analyzeFileClientSide(activeAiFileObj.file);
                      setFiles(prev => prev.map(f => f.id === activeAiFileObj.id ? { 
                        ...f, 
                        aiAnalysis: freshAi,
                        customName: freshAi.suggestedName,
                        customCategory: freshAi.suggestedCategory,
                        customCollection: freshAi.suggestedCollectionName,
                        customTags: freshAi.suggestedTags
                      } : f));
                      toast.success('✨ VaultX AI re-analyzed document text & properties!');
                    }}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Reprocess with AI
                  </button>

                  <button
                    onClick={() => applyAiToFile(activeAiFileObj.id)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" /> Apply All AI Suggestions
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
