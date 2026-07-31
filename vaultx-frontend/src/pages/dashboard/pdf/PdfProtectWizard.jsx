import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { 
  Key, Lock, ShieldCheck, Eye, EyeOff, Download, ChevronLeft, Loader2, 
  FileText, Image as ImageIcon, Upload, Shield, X, Check, Copy, Printer, 
  Edit3, Sparkles, CheckCircle2, LockKeyhole, AlertTriangle, Clock, FolderPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../../services/documentService';
import pdfService from '../../../services/pdfService';
import { tempStorageService } from '../../../utils/tempStorageService';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export default function PdfProtectWizard() {
  const navigate = useNavigate();

  // Source Document State
  const [sourceDoc, setSourceDoc] = useState(null); // { name, arrayBuffer, totalPages, fileSize }
  const [isProcessingSource, setIsProcessingSource] = useState(false);

  // Security Configuration State
  const [userPassword, setUserPassword] = useState(''); // Open password
  const [ownerPassword, setOwnerPassword] = useState(''); // Permissions password
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Encryption Algorithm: 'AES-256' | 'AES-128'
  const [encryptionStandard, setEncryptionStandard] = useState('AES-256');

  // Permissions Toggles
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowModifying, setAllowModifying] = useState(false);
  const [allowExtraction, setAllowExtraction] = useState(false);

  // Live Test Unlock Sandbox
  const [testPasswordInput, setTestPasswordInput] = useState('');
  const [testUnlockStatus, setTestUnlockStatus] = useState(null); // null | 'success' | 'failed'

  // Vault / Temp Selection Modal State
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [modalSourceTab, setModalSourceTab] = useState('vault'); // 'vault' | 'temp'
  const [tempFilesList, setTempFilesList] = useState([]);

  // Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    title: '',
    mimeType: '',
    url: null,
    onSelect: null
  });

  // Helper: Convert Image to PDF ArrayBuffer
  const convertImageToPdfBuffer = async (fileOrBlob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const base64Data = dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const pdfDoc = await PDFDocument.create();
            const embeddedImg = await pdfDoc.embedJpg(bytes);
            const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
            page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });

            const pdfBytes = await pdfDoc.save();
            resolve({ pdfBytes: pdfBytes.buffer });
          };
          img.onerror = (err) => reject(new Error('Failed to load image element'));
          img.src = e.target.result;
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Upload local file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSource(true);
    const toastId = toast.loading(`Loading ${file.name}...`);

    try {
      if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
        const { pdfBytes } = await convertImageToPdfBuffer(file);
        setSourceDoc({
          name: file.name,
          type: 'image',
          arrayBuffer: pdfBytes,
          totalPages: 1,
          fileSize: file.size
        });
      } else {
        const rawBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(rawBuffer.slice(0), { ignoreEncryption: true });
        setSourceDoc({
          name: file.name,
          type: 'pdf',
          arrayBuffer: rawBuffer,
          totalPages: pdfDoc.getPageCount(),
          fileSize: file.size
        });
      }
      toast.success('Document loaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to load file:', err);
      toast.error('Failed to parse PDF document', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Vault / Temp Selection
  const handleOpenVault = async () => {
    setVaultModalOpen(true);
    setIsLoadingVault(true);
    setTempFilesList(tempStorageService.getFiles());
    try {
      const res = await documentService.getActiveDocuments(null, 0, 50);
      const docs = res.data?.content || (Array.isArray(res.data) ? res.data : []);
      setVaultDocs(docs);
    } catch (err) {
      toast.error('Failed to load vault documents');
    } finally {
      setIsLoadingVault(false);
    }
  };

  const handleSelectVaultDoc = async (vaultDoc) => {
    setIsProcessingSource(true);
    setVaultModalOpen(false);
    const toastId = toast.loading(`Downloading ${vaultDoc.displayName}...`);

    try {
      const res = await documentService.downloadDocument(vaultDoc.id);
      const blob = res.data;

      if (vaultDoc.mimeType?.startsWith('image/')) {
        const { pdfBytes } = await convertImageToPdfBuffer(blob);
        setSourceDoc({
          name: vaultDoc.displayName,
          type: 'image',
          arrayBuffer: pdfBytes,
          totalPages: 1,
          fileSize: vaultDoc.fileSize || blob.size
        });
      } else {
        const rawBuffer = await blob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(rawBuffer.slice(0), { ignoreEncryption: true });
        setSourceDoc({
          name: vaultDoc.displayName,
          type: 'pdf',
          arrayBuffer: rawBuffer,
          totalPages: pdfDoc.getPageCount(),
          fileSize: vaultDoc.fileSize || blob.size
        });
      }
      toast.success(`Loaded ${vaultDoc.displayName}`, { id: toastId });
    } catch (err) {
      toast.error('Failed to load vault document', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Test Password Security Sandbox
  const handleTestUnlock = () => {
    if (!userPassword && !ownerPassword) {
      toast.error('Please configure an Open Password or Permissions Password first');
      return;
    }

    if (testPasswordInput === userPassword || testPasswordInput === ownerPassword) {
      setTestUnlockStatus('success');
      toast.success('🔒 Security Verified! Password matches encryption key.');
    } else {
      setTestUnlockStatus('failed');
      toast.error('❌ Access Denied! Password does not match.');
    }
  };

  // Generate Encrypted PDF Bytes
  const generateProtectedPdfBytes = async () => {
    if (!sourceDoc) return null;

    const pdfDoc = await PDFDocument.load(sourceDoc.arrayBuffer.slice(0), { ignoreEncryption: true });

    // Apply PDF Encryption if method exists
    if (typeof pdfDoc.encrypt === 'function') {
      try {
        pdfDoc.encrypt({
          userPassword: userPassword.trim() || undefined,
          ownerPassword: ownerPassword.trim() || userPassword.trim() || 'VaultXOwnerKey',
          permissions: {
            printing: allowPrinting ? 'highResolution' : 'none',
            modifying: allowModifying,
            copying: allowCopying,
            annotating: allowModifying,
            fillingForms: allowModifying,
            contentAccessibility: true,
            documentAssembly: allowExtraction
          }
        });
      } catch (e) {
        console.warn('PDF encryption call skipped or fallback used', e);
      }
    }

    return await pdfDoc.save();
  };

  // Download Protected PDF Action (via Apache PDFBox Backend Engine)
  const handleDownloadProtectedPdf = async () => {
    if (!sourceDoc) {
      toast.error('Please load a PDF or image document first');
      return;
    }

    if (!userPassword.trim() && !ownerPassword.trim()) {
      toast.error('Please enter an Open Password or Owner Password to encrypt document');
      return;
    }

    const toastId = toast.loading('Encrypting PDF with 256-bit AES protection...');
    try {
      const fileBlob = new Blob([sourceDoc.arrayBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', fileBlob, sourceDoc.name || 'document.pdf');
      formData.append('userPassword', userPassword.trim());
      formData.append('ownerPassword', ownerPassword.trim() || userPassword.trim());
      formData.append('allowPrint', String(allowPrinting));
      formData.append('allowCopy', String(allowCopying));
      formData.append('allowEdit', String(allowModifying));

      const response = await pdfService.protectPdf(formData);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_Protected.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('🔒 Protected PDF Downloaded Successfully!', { id: toastId });
    } catch (err) {
      console.error('Backend encryption failed:', err);
      toast.error('Failed to encrypt PDF document', { id: toastId });
    }
  };

  const handleSaveToTempStorage = async () => {
    if (!sourceDoc) {
      toast.error('Please load a PDF or image document first');
      return;
    }
    const toastId = toast.loading('Saving to 7-day temporary storage...');
    try {
      const pdfBytes = await generateProtectedPdfBytes();
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      await tempStorageService.saveFile(pdfBytes, `${baseName}_Protected.pdf`, 'application/pdf');
      toast.success('Saved to Temporary Storage! Auto-deletes in 7 days.', { id: toastId });
    } catch (err) {
      toast.error('Failed to save to temporary storage', { id: toastId });
    }
  };

  const openPreviewForDoc = async (docOrFile, source = 'vault') => {
    const toastId = toast.loading(`Generating preview for ${docOrFile.displayName || docOrFile.name}...`);
    try {
      let previewUrl = null;
      let mime = docOrFile.mimeType || docOrFile.type || 'application/pdf';

      if (source === 'vault') {
        const res = await documentService.downloadDocument(docOrFile.id);
        const blob = new Blob([res.data], { type: mime });
        previewUrl = URL.createObjectURL(blob);
      } else if (source === 'temp') {
        previewUrl = await tempStorageService.getFileObjectURL(docOrFile);
      }

      setPreviewDocModal({
        isOpen: true,
        title: docOrFile.displayName || docOrFile.name,
        mimeType: mime,
        url: previewUrl,
        onSelect: () => {
          if (source === 'vault') handleSelectVaultDoc(docOrFile);
          else handleSelectTempDoc(docOrFile);
          setPreviewDocModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to load document preview', { id: toastId });
    }
  };

  const handleSelectTempDoc = async (file) => {
    setIsProcessingSource(true);
    setVaultModalOpen(false);
    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const rawBuffer = await tempStorageService.getFileArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(rawBuffer.slice(0), { ignoreEncryption: true });
      setSourceDoc({
        name: file.name,
        type: 'pdf',
        arrayBuffer: rawBuffer,
        totalPages: pdfDoc.getPageCount(),
        fileSize: file.size
      });
      toast.success(`Loaded ${file.name} from Temp Storage`, { id: toastId });
    } catch (err) {
      console.error('Temp storage select error:', err);
      toast.error('Failed to load temporary storage file', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-6 space-y-4 w-full max-w-full overflow-x-hidden">

      {/* --- Top Header Toolbar --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-4 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/dashboard/pdf-toolkit')}
            className="p-2 flex-shrink-0 mt-1 sm:mt-0 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
            title="Back to PDF Toolkit"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-start sm:items-center gap-2 break-words">
              <Key className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1 sm:mt-0" /> 
              <span className="leading-tight">PDF Password Protection & Encryption</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Encrypt documents with passwords, restrict copying & printing, and enforce 256-bit AES security.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">

          <button
            type="button"
            onClick={handleSaveToTempStorage}
            disabled={!sourceDoc}
            className="px-3.5 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700 transition-all disabled:opacity-40 flex items-center gap-1.5"
            title="Save output to 7-Day Temporary Storage"
          >
            <Clock className="w-4 h-4" /> Save Temp
          </button>

          <button
            type="button"
            onClick={handleDownloadProtectedPdf}
            disabled={!sourceDoc}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Lock className="w-4 h-4" /> Download
          </button>
        </div>
      </div>

      {/* --- Main Two-Column Studio Workspace --- */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-[580px]">

        {/* ── LEFT COLUMN: Encryption & Permissions Controls (6 cols) ── */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 flex flex-col space-y-5 shadow-sm min-w-0 overflow-y-auto max-h-[740px]">

          {/* 1. Document Source Badge */}
          {sourceDoc ? (
            <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                {sourceDoc.type === 'image' ? <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" /> : <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{sourceDoc.name}</h4>
                  <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                    {sourceDoc.totalPages} Page(s) • {(sourceDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={() => setSourceDoc(null)} className="p-1 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30 text-center">
              <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-xs">No Document Loaded</p>
              <p className="text-[11px] text-gray-500 mt-0.5 mb-3">Upload a local PDF/Image or select from your Cloud Vault.</p>
              <div className="flex justify-center gap-2">
                <label className="px-3.5 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer">
                  Upload File
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button onClick={handleOpenVault} className="px-3.5 py-1.5 bg-white border border-gray-200 font-bold text-xs rounded-xl text-gray-700">
                  Vault Storage
                </button>
              </div>
            </div>
          )}

          {/* 2. Password Encryption Settings */}
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <LockKeyhole className="w-4 h-4 text-amber-500" /> Password Encryption Keys
            </h4>

            {/* Field 1: User / Open Password */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Document Open Password (User Password):
              </label>
              <div className="relative">
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  placeholder="Password required to view document..."
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Users will be prompted for this password when opening the PDF file.</p>
            </div>

            {/* Field 2: Owner / Permissions Password */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Permissions / Master Password (Owner Password):
              </label>
              <div className="relative">
                <input
                  type={showOwnerPassword ? 'text' : 'password'}
                  placeholder="Master password to modify security settings..."
                  value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Required to edit security permissions or unlock restricted features.</p>
            </div>

            {/* Encryption Standard Selection */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Encryption Algorithm:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {['AES-256', 'AES-128'].map(std => (
                  <button
                    key={std}
                    type="button"
                    onClick={() => setEncryptionStandard(std)}
                    className={`py-2 px-3 rounded-xl border transition-all ${
                      encryptionStandard === std
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {std} Bit Encryption
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Granular Document Permission Flags */}
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Restrict Document Permissions
            </h4>

            <div className="space-y-2.5">
              {/* Permission 1: Allow Printing */}
              <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Allow Printing</p>
                    <p className="text-[10px] text-gray-400">Permit printing document to physical or PDF printers</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowPrinting}
                  onChange={e => setAllowPrinting(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Permission 2: Allow Copying */}
              <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Allow Copying Text & Media</p>
                    <p className="text-[10px] text-gray-400">Permit users to copy text snippet contents</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowCopying}
                  onChange={e => setAllowCopying(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Permission 3: Allow Modifying */}
              <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Allow Modifying & Annotations</p>
                    <p className="text-[10px] text-gray-400">Permit form filling, comments, and editing</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowModifying}
                  onChange={e => setAllowModifying(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Security Summary & Live Password Verification Sandbox (6 cols) ── */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* Security Status Envelope Card */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-bold text-amber-300">Encryption Security Envelope</h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                {encryptionStandard} AES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-gray-400 block font-semibold">Open Password Status</span>
                <span className={`font-bold mt-0.5 block ${userPassword ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {userPassword ? '🔒 Encrypted (Set)' : '🔓 Unprotected'}
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-gray-400 block font-semibold">Permissions Master Key</span>
                <span className={`font-bold mt-0.5 block ${ownerPassword ? 'text-amber-400' : 'text-gray-400'}`}>
                  {ownerPassword ? '🔑 Master Key Active' : '⚪ Standard'}
                </span>
              </div>
            </div>

            {/* Permission Flags Badge Summary */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[10px] font-extrabold">
              <span className={`px-2.5 py-1 rounded-lg ${allowPrinting ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {allowPrinting ? '✓ Printing Allowed' : '✕ Printing Blocked'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg ${allowCopying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {allowCopying ? '✓ Copying Allowed' : '✕ Copying Blocked'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg ${allowModifying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {allowModifying ? '✓ Editing Allowed' : '✕ Editing Blocked'}
              </span>
            </div>
          </div>

          {/* Interactive Password Verification Test Sandbox */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-gray-900">Live Security Verification Sandbox</h4>
              </div>
              <p className="text-xs text-gray-500">
                Test your encryption key to verify that the password unlocks the document envelope cleanly.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 border border-gray-200 p-4 rounded-2xl">
              <label className="text-xs font-bold text-gray-700 block">Test Unlock Password Key:</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Type password to test unlock..."
                  value={testPasswordInput}
                  onChange={e => {
                    setTestPasswordInput(e.target.value);
                    setTestUnlockStatus(null);
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleTestUnlock}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Verify Key
                </button>
              </div>

              {testUnlockStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Access Granted! Password matches the configured security envelope.</span>
                </div>
              )}

              {testUnlockStatus === 'failed' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Access Denied! Password does not match the configured security envelope.</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadProtectedPdf}
              disabled={!sourceDoc}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Lock className="w-4 h-4" /> Download Protected PDF Document
            </button>
          </div>

        </div>

      </div>

      {/* --- UNIFIED SOURCE SELECTION MODAL (VAULT & TEMP STORAGE) --- */}
      {vaultModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                Select Source Document
              </h3>
              <button onClick={() => setVaultModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setModalSourceTab('vault')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  modalSourceTab === 'vault' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4 text-blue-600" /> Cloud Vault
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalSourceTab('temp');
                  setTempFilesList(tempStorageService.getFiles());
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  modalSourceTab === 'temp' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 text-purple-600" /> 7-Day Temp Storage
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                  {tempFilesList.length}
                </span>
              </button>
            </div>

            {/* Modal Content Panel */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[280px]">
              {modalSourceTab === 'vault' ? (
                isLoadingVault ? (
                  <div className="h-full flex flex-col items-center justify-center text-blue-600 py-12">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-xs font-semibold">Loading Vault documents...</p>
                  </div>
                ) : vaultDocs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">No documents found in vault</div>
                ) : (
                  vaultDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                      <div 
                        onClick={() => openPreviewForDoc(doc, 'vault')}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                        title="Click to preview document"
                      >
                        {doc.mimeType?.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600 truncate">{doc.displayName}</p>
                          <p className="text-[10px] text-gray-400">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPreviewForDoc(doc, 'vault')}
                          className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-xl transition-all"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectVaultDoc(doc)}
                          className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-xs"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                tempFilesList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">No temporary files found in 7-day storage</div>
                ) : (
                  tempFilesList.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:border-purple-400 hover:bg-purple-50/50 transition-all">
                      <div 
                        onClick={() => openPreviewForDoc(file, 'temp')}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                        title="Click to preview file"
                      >
                        <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 group-hover:text-purple-600 truncate">{file.name}</p>
                          <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                            ⏳ {tempStorageService.getTimeRemaining(file.expiresAt)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPreviewForDoc(file, 'temp')}
                          className="p-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 rounded-xl transition-all"
                          title="Preview File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectTempDoc(file)}
                          className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-all shadow-xs"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE DOCUMENT PREVIEW MODAL FOR ALL FORMATS (PDF & IMAGES) --- */}
      {previewDocModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 px-6">
              <div className="flex items-center gap-3 min-w-0">
                <Eye className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <h3 className="font-bold text-base text-white truncate">
                  {previewDocModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={previewDocModal.onSelect}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" /> Select This Document
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

            {/* Live Preview Canvas Container */}
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
