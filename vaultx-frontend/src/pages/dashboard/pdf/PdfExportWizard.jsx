import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { 
  ChevronRight, ChevronLeft, Check, FileText, Search, Settings, File, 
  Image as ImageIcon, Layout, Shield, Type, Lock, Eye, Download, X, 
  ChevronDown, ArrowUp, ArrowDown, GripVertical, FileArchive, Loader2, 
  Sparkles, Layers, ListFilter, RefreshCw, PenTool, Upload, Eraser, Plus, Move, Lightbulb, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import documentService from '../../../services/documentService';
import pdfService from '../../../services/pdfService';
import { tempStorageService } from '../../../utils/tempStorageService';

const STEPS = ['Select & Arrange', 'Watermark & Sign', 'Security', 'Preview', 'Export'];

export default function PdfExportWizard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Data state
  const [vaultDocs, setVaultDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & Ordering
  const [selectedDocs, setSelectedDocs] = useState([]);

  // Digital Signature & Watermark State
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'upload' | 'text'
  const [signatureImageBase64, setSignatureImageBase64] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Drag-to-Position Custom Page Canvas State
  const [stampPos, setStampPos] = useState({ x: 80, y: 80 });
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const mockPageRef = useRef(null);

  // Preview tab state: 'merged' or doc.id
  const [activePreviewId, setActivePreviewId] = useState('merged');
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Export state
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Temp Storage Modal State
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [tempFilesList, setTempFilesList] = useState([]);

  // Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    title: '',
    mimeType: '',
    url: null,
    onSelect: null
  });

  // Settings
  const [settings, setSettings] = useState({
    includeCoverPage: false,
    coverTitle: '',
    coverDescription: '',
    includeToc: false,
    includePageNumbers: false,
    pageNumberPosition: 'BOTTOM_CENTER',
    watermarkText: '',
    signatureImageBase64: '',
    watermarkPosition: 'BOTTOM_RIGHT',
    ownerPassword: '',
    userPassword: '',
    allowPrint: true,
    allowCopy: true
  });

  useEffect(() => {
    // Fetch available docs for selection from Vault
    const fetchDocs = async () => {
      try {
        const res = await documentService.getActiveDocuments(null, 0, 50);
        const docs = res.data?.content || (Array.isArray(res.data) ? res.data : []);
        setVaultDocs(docs);
      } catch (err) {
        toast.error('Failed to load documents from vault');
      }
    };
    fetchDocs();
  }, []);

  // Sync signature image state to settings
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      signatureImageBase64: signatureImageBase64
    }));
  }, [signatureImageBase64]);

  // Restore canvas image when switching to draw mode or wizard steps
  useEffect(() => {
    if (signatureMode === 'draw' && signatureImageBase64 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = signatureImageBase64;
    }
  }, [signatureMode, signatureImageBase64, currentStep]);

  // Update preview when activePreviewId changes during Preview step (Step index 3)
  useEffect(() => {
    if (currentStep === 3) {
      loadPreviewContent(activePreviewId);
    }
  }, [activePreviewId, currentStep]);

  // Helper: Convert image to PDF ArrayBuffer & Data URL
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
            resolve({ pdfBytes: pdfBytes.buffer, thumbnail: dataUrl });
          };
          img.onerror = (err) => reject(new Error('Failed to load image'));
          img.src = e.target.result;
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Local file upload handler directly in Step 0
  const handleLocalFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const toastId = toast.loading('Processing uploaded file(s)...');
    try {
      const newDocs = [];
      for (const file of files) {
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
          const { pdfBytes, thumbnail } = await convertImageToPdfBuffer(file);
          newDocs.push({
            id: `local_img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            displayName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            isLocal: true,
            arrayBuffer: pdfBytes,
            thumbnail
          });
        } else {
          const rawBuffer = await file.arrayBuffer();
          newDocs.push({
            id: `local_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            displayName: file.name,
            fileSize: file.size,
            mimeType: 'application/pdf',
            isLocal: true,
            arrayBuffer: rawBuffer
          });
        }
      }

      if (newDocs.length > 0) {
        setSelectedDocs(prev => [...prev, ...newDocs]);
        toast.success(`Added ${newDocs.length} local document/image(s)!`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error('Failed to load local upload:', err);
      toast.error('Failed to process file upload', { id: toastId });
    }
  };

  const loadPreviewContent = async (targetId) => {
    if (selectedDocs.length === 0) return;
    setIsLoadingPreview(true);
    try {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }

      if (targetId === 'merged') {
        const mergedDoc = await PDFDocument.create();

        for (const doc of selectedDocs) {
          let docBytes;
          if (doc.isLocal && doc.arrayBuffer) {
            docBytes = doc.arrayBuffer.slice(0);
          } else {
            const res = await documentService.downloadDocument(doc.id);
            docBytes = await res.data.arrayBuffer();
          }

          if (doc.mimeType?.startsWith('image/')) {
            const { pdfBytes } = await convertImageToPdfBuffer(new Blob([docBytes], { type: doc.mimeType }));
            const imgPdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedDoc.copyPages(imgPdf, [0]);
            copiedPages.forEach(p => mergedDoc.addPage(p));
          } else {
            const srcPdf = await PDFDocument.load(docBytes, { ignoreEncryption: true });
            const indices = Array.from({ length: srcPdf.getPageCount() }, (_, i) => i);
            const copiedPages = await mergedDoc.copyPages(srcPdf, indices);
            copiedPages.forEach(p => mergedDoc.addPage(p));
          }
        }

        // Apply watermark and signature overlays on EVERY page
        const pages = mergedDoc.getPages();
        const font = await mergedDoc.embedFont(StandardFonts.HelveticaBold);

        if (settings.watermarkText.trim()) {
          for (const page of pages) {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(settings.watermarkText, 38);
            page.drawText(settings.watermarkText, {
              x: (width - textWidth) / 2,
              y: height / 2,
              size: 38,
              font,
              color: rgb(0.4, 0.4, 0.4),
              opacity: 0.25,
              rotate: degrees(45)
            });
          }
        }

        if (signatureImageBase64) {
          try {
            const sigBytes = await fetch(signatureImageBase64).then(r => r.arrayBuffer());
            const sigImage = signatureImageBase64.startsWith('data:image/png')
              ? await mergedDoc.embedPng(sigBytes)
              : await mergedDoc.embedJpg(sigBytes);

            const sigWidth = 140;
            const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

            for (const page of pages) {
              const { width, height } = page.getSize();
              const posX = (width - sigWidth) * (stampPos.x / 100);
              const posY = (height - sigHeight) * ((100 - stampPos.y) / 100);

              page.drawImage(sigImage, {
                x: Math.max(10, Math.min(width - sigWidth - 10, posX)),
                y: Math.max(10, Math.min(height - sigHeight - 10, posY)),
                width: sigWidth,
                height: sigHeight
              });
            }
          } catch (err) {
            console.warn('Failed to draw signature preview overlay', err);
          }
        }

        const finalBytes = await mergedDoc.save();
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        setPreviewBlobUrl(URL.createObjectURL(blob));
      } else {
        const targetDoc = selectedDocs.find(d => String(d.id) === String(targetId));
        if (targetDoc) {
          if (targetDoc.isLocal && targetDoc.arrayBuffer) {
            const blob = new Blob([targetDoc.arrayBuffer], { type: targetDoc.mimeType || 'application/pdf' });
            setPreviewBlobUrl(URL.createObjectURL(blob));
          } else {
            const res = await documentService.downloadDocument(targetDoc.id);
            const blob = new Blob([res.data], { type: targetDoc.mimeType || 'application/pdf' });
            setPreviewBlobUrl(URL.createObjectURL(blob));
          }
        }
      }
    } catch (err) {
      console.error('Error rendering preview:', err);
      toast.error('Failed to load document preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedDocs.length === 0) {
      toast.error('Please select at least one document to proceed');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Drag and Drop & Order handlers
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedDocs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedDocs(items);
    toast.success('Document order updated');
  };

  const moveDocUp = (idx) => {
    if (idx === 0) return;
    const items = Array.from(selectedDocs);
    const temp = items[idx];
    items[idx] = items[idx - 1];
    items[idx - 1] = temp;
    setSelectedDocs(items);
  };

  const moveDocDown = (idx) => {
    if (idx === selectedDocs.length - 1) return;
    const items = Array.from(selectedDocs);
    const temp = items[idx];
    items[idx] = items[idx + 1];
    items[idx + 1] = temp;
    setSelectedDocs(items);
  };

  // Canvas Whiteboard Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatureImageBase64(dataUrl);
      setSettings(prev => ({ ...prev, signatureImageBase64: dataUrl }));
      toast.success('Digital signature captured!');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImageBase64('');
    setSettings(prev => ({ ...prev, signatureImageBase64: '' }));
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setSignatureImageBase64(dataUrl);
      setSettings(prev => ({ ...prev, signatureImageBase64: dataUrl }));
      toast.success('Signature photo loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Custom Page Canvas Placement Handlers
  const handleStampDragStart = () => {
    setIsDraggingStamp(true);
  };

  const handleStampDragMove = (e) => {
    if (!isDraggingStamp || !mockPageRef.current) return;
    const rect = mockPageRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let relX = ((clientX - rect.left) / rect.width) * 100;
    let relY = ((clientY - rect.top) / rect.height) * 100;

    relX = Math.max(10, Math.min(85, relX));
    relY = Math.max(10, Math.min(85, relY));

    const cleanX = Math.round(relX);
    const cleanY = Math.round(relY);
    setStampPos({ x: cleanX, y: cleanY });
    setSettings(prev => ({
      ...prev,
      watermarkPosition: `CUSTOM:${cleanX},${cleanY}`
    }));
  };

  const handleStampDragEnd = () => {
    setIsDraggingStamp(false);
  };

  const setPresetPosition = (presetKey, defaultX, defaultY) => {
    setStampPos({ x: defaultX, y: defaultY });
    setSettings(prev => ({
      ...prev,
      watermarkPosition: presetKey
    }));
  };

  // Helper: Generate merged PDF bytes with all watermarks, signatures & stamps applied
  const generateMergedPdfBytes = async () => {
    const mergedDoc = await PDFDocument.create();

    for (const doc of selectedDocs) {
      let docBytes;
      if (doc.isLocal && doc.arrayBuffer) {
        docBytes = doc.arrayBuffer.slice(0);
      } else {
        const res = await documentService.downloadDocument(doc.id);
        docBytes = await res.data.arrayBuffer();
      }

      if (doc.mimeType?.startsWith('image/')) {
        const { pdfBytes } = await convertImageToPdfBuffer(new Blob([docBytes], { type: doc.mimeType }));
        const imgPdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedDoc.copyPages(imgPdf, [0]);
        copiedPages.forEach(p => mergedDoc.addPage(p));
      } else {
        const srcPdf = await PDFDocument.load(docBytes, { ignoreEncryption: true });
        const indices = Array.from({ length: srcPdf.getPageCount() }, (_, i) => i);
        const copiedPages = await mergedDoc.copyPages(srcPdf, indices);
        copiedPages.forEach(p => mergedDoc.addPage(p));
      }
    }

    const pages = mergedDoc.getPages();
    const font = await mergedDoc.embedFont(StandardFonts.HelveticaBold);

    // Apply text watermark if set
    if (settings.watermarkText?.trim()) {
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(settings.watermarkText, 38);
        page.drawText(settings.watermarkText, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: 38,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: 0.25,
          rotate: degrees(45)
        });
      }
    }

    // Apply signature image / photo stamp if set
    if (signatureImageBase64) {
      try {
        const sigBytes = await fetch(signatureImageBase64).then(r => r.arrayBuffer());
        const sigImage = signatureImageBase64.startsWith('data:image/png')
          ? await mergedDoc.embedPng(sigBytes)
          : await mergedDoc.embedJpg(sigBytes);

        const sigWidth = 140;
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

        for (const page of pages) {
          const { width, height } = page.getSize();
          const posX = (width - sigWidth) * (stampPos.x / 100);
          const posY = (height - sigHeight) * ((100 - stampPos.y) / 100);

          page.drawImage(sigImage, {
            x: Math.max(10, Math.min(width - sigWidth - 10, posX)),
            y: Math.max(10, Math.min(height - sigHeight - 10, posY)),
            width: sigWidth,
            height: sigHeight
          });
        }
      } catch (err) {
        console.warn('Failed to embed signature image:', err);
      }
    }

    return await mergedDoc.save();
  };

  // Export PDF handler
  const handleExportPdf = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    setIsExportingPdf(true);
    setIsSubmitting(true);
    setProgress(25);

    try {
      const finalBytes = await generateMergedPdfBytes();
      setProgress(90);
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'VaultX_Export_Merged.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setProgress(100);
      toast.success('Merged PDF Exported Successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    } finally {
      setIsSubmitting(false);
      setIsExportingPdf(false);
    }
  };

  // Save Merged PDF with Watermarks & Signature to 7-Day Temporary Storage
  const handleSaveMergedToTempStorage = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    const toastId = toast.loading('Saving merged PDF with watermarks & signature to 7-day temporary storage...');
    try {
      const finalBytes = await generateMergedPdfBytes();
      await tempStorageService.saveFile(finalBytes, 'VaultX_Export_Merged.pdf', 'application/pdf');
      toast.success('Saved to Temporary Storage! Auto-deletes in 7 days.', { id: toastId });
    } catch (err) {
      console.error('Failed to save to temp storage:', err);
      toast.error('Failed to save to temporary storage', { id: toastId });
    }
  };

  // Export ZIP handler
  const handleDownloadZip = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    setIsExportingZip(true);
    const toastId = toast.loading('Packaging documents into ZIP archive...');
    try {
      const zip = new JSZip();
      const folder = zip.folder('VaultX_Export_Documents');

      for (let i = 0; i < selectedDocs.length; i++) {
        const doc = selectedDocs[i];
        try {
          let data;
          if (doc.isLocal && doc.arrayBuffer) {
            data = doc.arrayBuffer;
          } else {
            const res = await documentService.downloadDocument(doc.id);
            data = res.data;
          }
          const safeName = `${i + 1}_${doc.displayName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
          folder.file(safeName, data);
        } catch (err) {
          console.warn(`Could not add ${doc.displayName} to zip`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'VaultX_Export_Documents.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('ZIP package downloaded successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create ZIP package', { id: toastId });
    } finally {
      setIsExportingZip(false);
    }
  };

  // --- Step Renderers ---

  // Interactive Stepper Bar: Direct Navigation to Any Step
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4 sm:px-12 relative overflow-x-auto pb-4">
      <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-100 -z-10 -translate-y-1/2 min-w-max" />
      <div 
        className="absolute top-1/2 left-12 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-300"
        style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 3rem)` }}
      />
      {STEPS.map((step, idx) => (
        <button
          key={step}
          type="button"
          onClick={() => setCurrentStep(idx)}
          className="flex flex-col items-center gap-2 min-w-[60px] cursor-pointer group outline-none"
          title={`Click to navigate to step ${idx + 1}: ${step}`}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2
            ${currentStep > idx ? 'bg-primary border-primary text-white group-hover:scale-105 shadow-sm' : 
              currentStep === idx ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(37,99,235,0.15)] scale-110' : 
              'bg-white border-gray-200 text-gray-400 group-hover:border-primary/50 group-hover:text-primary'}`}
          >
            {currentStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold ${currentStep >= idx ? 'text-gray-900 font-bold' : 'text-gray-400 group-hover:text-gray-700'}`}>
            {step}
          </span>
        </button>
      ))}
    </div>
  );

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
          if (source === 'vault') setSelectedDocs(prev => [...prev, docOrFile]);
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
    setTempModalOpen(false);
    const toastId = toast.loading(`Adding ${file.name}...`);
    try {
      const rawBuffer = await tempStorageService.getFileArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(rawBuffer.slice(0), { ignoreEncryption: true });

      const tempObj = {
        id: file.id || `temp_${Date.now()}`,
        displayName: file.name,
        fileSize: file.size,
        mimeType: 'application/pdf',
        arrayBuffer: rawBuffer,
        totalPages: pdfDoc.getPageCount(),
        isLocal: true
      };
      setSelectedDocs(prev => [...prev, tempObj]);
      toast.success(`Added ${file.name} to merge list!`, { id: toastId });
    } catch (err) {
      console.error('Temp storage select error:', err);
      toast.error('Failed to add temporary storage file', { id: toastId });
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  // STEP 0: Select & Arrange Documents (Direct Vault & Local File Upload)
  const renderStep0SelectAndArrange = () => {
    const availableDocs = vaultDocs.filter(d => 
      !selectedDocs.some(sd => sd.id === d.id) &&
      d.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div className="h-full flex flex-col lg:flex-row gap-6">
        {/* Left Column: Vault Selection & Local Upload */}
        <div className="lg:w-1/2 bg-white border border-gray-200 rounded-3xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Source Documents
            </h4>

            {/* Direct Local Upload & Temp Storage Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempFilesList(tempStorageService.getFiles());
                  setTempModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200/60 shadow-xs flex items-center gap-1.5 transition-all"
                title="Pick document from 7-Day Temporary Storage"
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Temp Storage
              </button>

              <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" /> Upload PDF / Images
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  multiple 
                  onChange={handleLocalFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search documents by name from Vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {availableDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div 
                  onClick={() => openPreviewForDoc(doc, 'vault')}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                  title="Click to preview document"
                >
                  {getFileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-primary truncate">{doc.displayName}</p>
                    <p className="text-xs text-gray-400">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openPreviewForDoc(doc, 'vault')}
                    className="p-1.5 bg-gray-100 hover:bg-primary/10 text-gray-600 hover:text-primary rounded-xl transition-all"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedDocs([...selectedDocs, doc])}
                    className="px-3.5 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                  >
                    Add +
                  </button>
                </div>
              </div>
            ))}
            {availableDocs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                <Shield className="w-8 h-8 text-gray-300 mb-1" />
                <span>No matching documents in Vault</span>
                <span className="text-xs text-gray-400 mt-1">Use the <strong>Upload PDF / Images</strong> button above to load local files.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected & Live Order Rearranging */}
        <div className="lg:w-1/2 bg-primary/5 border border-primary/20 rounded-3xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-primary flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-primary" /> Selected Execution Order
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Drag cards or use <strong>↑ / ↓</strong> to arrange merge order.</p>
            </div>
            <span className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full shadow-sm">
              {selectedDocs.length} Selected
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {selectedDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/50 text-sm border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center">
                <Layers className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-semibold">No documents selected</p>
                <p className="text-xs mt-1 text-gray-400">Click <strong>Add +</strong> on Vault documents or use <strong>Upload PDF / Images</strong>.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="selected-docs-merge-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-2.5"
                    >
                      {selectedDocs.map((doc, idx) => (
                        <Draggable key={doc.id} draggableId={String(doc.id)} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all flex items-center justify-between gap-3 ${
                                snapshot.isDragging ? 'shadow-2xl border-primary ring-2 ring-primary/20 scale-[1.02] z-50' : 'border-gray-200 hover:border-primary/30'
                              }`}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className="p-1 text-gray-400 hover:text-primary cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </div>

                              {getFileIcon(doc.mimeType)}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{doc.displayName}</p>
                                <p className="text-[11px] text-gray-400">
                                  {(doc.fileSize / 1024 / 1024).toFixed(2)} MB {doc.isLocal && '• Local File'}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveDocUp(idx)}
                                  disabled={idx === 0}
                                  className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveDocDown(idx)}
                                  disabled={idx === selectedDocs.length - 1}
                                  className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id))}
                                  className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all ml-1"
                                  title="Remove"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
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
            )}
          </div>
        </div>
      </div>
    );
  };

  // STEP 1: Digital Signature & Watermark (Preserves Whiteboard Canvas State)
  const renderStep1Watermark = () => (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-purple-600" /> Digital Signature & Watermark
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Draw your signature, upload a signature photo, or enter custom watermark text.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setSignatureMode('draw')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              signatureMode === 'draw' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw Sign
          </button>

          <button
            type="button"
            onClick={() => setSignatureMode('upload')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              signatureMode === 'upload' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image
          </button>

          <button
            type="button"
            onClick={() => setSignatureMode('text')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              signatureMode === 'text' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Text Watermark
          </button>
        </div>

        {/* Whiteboard Canvas Container (CSS Preserved Toggling) */}
        <div className={signatureMode === 'draw' ? 'space-y-2' : 'hidden'}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
              DIGITAL WHITEBOARD PAD
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
            >
              <Eraser className="w-3.5 h-3.5" /> Clear Pad
            </button>
          </div>

          <div className="relative bg-white border-2 border-dashed border-purple-200 rounded-2xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={380}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 cursor-crosshair touch-none"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-medium pointer-events-none">
              Draw with mouse or finger
            </span>
          </div>
        </div>

        {/* Upload Image Section */}
        {signatureMode === 'upload' && (
          <div className="space-y-2">
            <label className="border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-purple-500 mb-2" />
              <span className="text-xs font-bold text-purple-800">Upload Signature Photo / Stamp</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Supports transparent PNG or JPEG files</span>
              <input type="file" accept="image/png,image/jpeg" onChange={handleSignatureUpload} className="hidden" />
            </label>
            {signatureImageBase64 && (
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
                <img src={signatureImageBase64} alt="Signature Preview" className="h-9 max-w-[140px] object-contain" />
                <button onClick={() => setSignatureImageBase64('')} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
              </div>
            )}
          </div>
        )}

        {/* Text Watermark Controls */}
        {signatureMode === 'text' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Watermark Text</label>
            <input 
              type="text" 
              value={settings.watermarkText} 
              onChange={e => setSettings({...settings, watermarkText: e.target.value})} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary" 
              placeholder="e.g. CONFIDENTIAL / APPROVED - VAULTX" 
            />
          </div>
        )}

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
            QUICK POSITION PRESETS
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'BOTTOM_RIGHT', label: 'Bottom Right', x: 80, y: 80 },
              { id: 'BOTTOM_LEFT', label: 'Bottom Left', x: 15, y: 80 },
              { id: 'TOP_RIGHT', label: 'Top Right', x: 80, y: 15 },
              { id: 'TOP_LEFT', label: 'Top Left', x: 15, y: 15 },
              { id: 'CENTER', label: 'Center', x: 50, y: 50 },
              { id: 'WATERMARK_DIAGONAL', label: 'Diagonal Watermark', x: 50, y: 50 }
            ].map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setPresetPosition(pos.id, pos.x, pos.y)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-left truncate ${
                  settings.watermarkPosition === pos.id 
                    ? 'bg-purple-100 text-purple-800 border-purple-400 shadow-xs' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Placement Sheet */}
      <div className="md:col-span-5 flex flex-col space-y-3">
        <div className="bg-slate-50 border border-gray-200 rounded-3xl p-5 flex-1 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-purple-600" />
              <h5 className="font-bold text-gray-900 text-xs">Interactive Placement Sheet</h5>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {stampPos.x}% X, {stampPos.y}% Y
            </span>
          </div>

          <p className="text-[11px] text-gray-500 mb-3">
            Drag the signature stamp anywhere on the A4 page sheet below to set exact custom placement.
          </p>

          <div 
            ref={mockPageRef}
            onMouseMove={handleStampDragMove}
            onMouseUp={handleStampDragEnd}
            onMouseLeave={handleStampDragEnd}
            onTouchMove={handleStampDragMove}
            onTouchEnd={handleStampDragEnd}
            className="relative w-full aspect-[1/1.3] bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm overflow-hidden select-none cursor-crosshair bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
          >
            <div className="space-y-2 opacity-30 pointer-events-none">
              <div className="w-1/3 h-3 bg-gray-400 rounded"></div>
              <div className="w-full h-2 bg-gray-300 rounded"></div>
              <div className="w-5/6 h-2 bg-gray-300 rounded"></div>
              <div className="w-4/6 h-2 bg-gray-300 rounded"></div>
            </div>

            <div
              onMouseDown={handleStampDragStart}
              onTouchStart={handleStampDragStart}
              style={{
                left: `${stampPos.x}%`,
                top: `${stampPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className={`absolute z-10 p-2 bg-purple-600 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing border-2 border-white transition-all ${
                isDraggingStamp ? 'scale-110 shadow-2xl ring-4 ring-purple-400/30' : 'hover:scale-105'
              }`}
            >
              <div className="flex items-center gap-1 text-[9px] font-extrabold text-purple-200 uppercase tracking-wider">
                <Move className="w-3 h-3" /> Drag Stamp
              </div>

              {signatureImageBase64 ? (
                <img 
                  src={signatureImageBase64} 
                  alt="Sig Stamp" 
                  className="h-10 max-w-[130px] object-contain bg-white/90 p-1 rounded-lg shadow-xs pointer-events-none" 
                />
              ) : settings.watermarkText ? (
                <span className="text-xs font-bold text-white uppercase tracking-wider block max-w-[120px] truncate pointer-events-none">
                  {settings.watermarkText}
                </span>
              ) : (
                <span className="text-xs font-bold text-white pointer-events-none">
                  ✍️ Signature Stamp
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center gap-2 text-purple-900 text-xs font-semibold">
            <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>
              Stamp position saved as: <strong className="font-mono text-purple-800">{settings.watermarkPosition}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 2: Security & Encryption
  const renderStep2Security = () => (
    <div className="max-w-xl mx-auto space-y-6 bg-slate-50 border border-gray-200 p-8 rounded-3xl shadow-xs">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Security & Encryption</h3>
        <p className="text-sm text-gray-500">Protect compiled documents with passwords</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Open Password</label>
          <input 
            type="password" 
            value={settings.userPassword} 
            onChange={e => setSettings({...settings, userPassword: e.target.value})} 
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:border-primary text-gray-800 font-bold" 
            placeholder="Require password to view document..." 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Permissions / Owner Password</label>
          <input 
            type="password" 
            value={settings.ownerPassword} 
            onChange={e => setSettings({...settings, ownerPassword: e.target.value})} 
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:border-primary text-gray-800 font-bold" 
            placeholder="Require password to modify permissions..." 
          />
        </div>
      </div>
    </div>
  );

  // STEP 3: Interactive Live Preview with Document Tabs & Reload Button
  const renderStep3Preview = () => (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Left Sidebar: Document Switcher Tabs */}
      <div className="md:w-64 bg-white border border-gray-200 rounded-3xl p-4 flex flex-col shadow-sm">
        <h4 className="font-bold text-gray-800 text-sm mb-3 px-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" /> Preview Documents
        </h4>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {/* Option 1: Full Merged PDF */}
          <button
            type="button"
            onClick={() => setActivePreviewId('merged')}
            className={`w-full p-3 rounded-2xl text-left border transition-all ${
              activePreviewId === 'merged'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold border-purple-600 shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-xs truncate">Full Merged PDF</span>
            </div>
            <p className="text-[10px] opacity-80 mt-1">All {selectedDocs.length} documents combined</p>
          </button>

          <div className="border-t border-gray-100 my-2" />

          {/* Option 2: Individual Document Cards */}
          {selectedDocs.map((doc, idx) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setActivePreviewId(doc.id)}
              className={`w-full p-3 rounded-2xl text-left border transition-all ${
                String(activePreviewId) === String(doc.id)
                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs'
                  : 'bg-white border-gray-100 text-gray-700 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-extrabold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs truncate">{doc.displayName}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-7">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Active PDF / Image Preview Frame */}
      <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden flex flex-col shadow-xl relative border border-gray-800">
        <div className="p-3 bg-slate-950 text-white flex items-center justify-between border-b border-white/10 px-5">
          <span className="text-xs font-bold flex items-center gap-2 text-purple-300">
            <Eye className="w-4 h-4 text-purple-400" />
            {activePreviewId === 'merged' 
              ? '✨ Full Merged PDF Preview' 
              : `Inspecting: ${selectedDocs.find(d => String(d.id) === String(activePreviewId))?.displayName || 'Document'}`}
          </span>
          <button
            type="button"
            onClick={() => loadPreviewContent(activePreviewId)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} /> Reload Preview
          </button>
        </div>

        <div className="flex-1 bg-gray-900 relative flex items-center justify-center p-2">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center text-purple-300">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <p className="text-xs font-semibold">Rendering document preview with watermark / signature...</p>
            </div>
          ) : previewBlobUrl ? (
            <iframe src={previewBlobUrl} title="Document Preview" className="w-full h-full border-none rounded-2xl" />
          ) : (
            <div className="text-gray-400 text-xs">Select a document from the left list to preview</div>
          )}
        </div>
      </div>
    </div>
  );

  // STEP 4: Prominent Merged PDF & ZIP Download Cards!
  const renderStep4Export = () => (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {progress < 100 && isExportingPdf ? (
        <div className="text-center py-12 space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-gray-800">Compiling Merged PDF Engine...</h3>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 font-medium">{progress}% Complete</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">Export Your Documents</h3>
            <p className="text-gray-500 text-sm mt-1">Choose your preferred export format below.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1: Merged PDF */}
            <div className="bg-white border-2 border-primary/20 hover:border-primary rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-1">Export Merged PDF</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Combines all <strong>{selectedDocs.length} documents</strong> into a single seamless PDF file in your exact custom order with digital signature and watermark.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Merged PDF
                </button>

                <button
                  type="button"
                  onClick={handleSaveMergedToTempStorage}
                  className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-purple-600" /> Save to Temp Storage (7 Days)
                </button>
              </div>
            </div>

            {/* Card 2: ZIP Package */}
            <div className="bg-white border-2 border-emerald-500/20 hover:border-emerald-500 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileArchive className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-1">Export ZIP Archive</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Packages all <strong>{selectedDocs.length} original documents</strong> into a single organized <code>.ZIP</code> archive file for easy archiving or sharing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isExportingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                Download ZIP Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col pb-8 w-full max-w-full overflow-x-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/pdf-toolkit')} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">PDF Export Wizard</h1>
            <p className="page-subtitle mt-0.5">Professional document compilation pipeline</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        
        <div className="pt-8 pb-4">
          {renderStepIndicator()}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 flex flex-col relative">
          {currentStep === 0 && renderStep0SelectAndArrange()}
          {currentStep === 1 && renderStep1Watermark()}
          {currentStep === 2 && renderStep2Security()}
          {currentStep === 3 && renderStep3Preview()}
          {currentStep === 4 && renderStep4Export()}
          
          {/* Spacer to prevent content from hiding behind fixed footer on mobile */}
          {currentStep < 4 && <div className="h-20 md:hidden flex-shrink-0" />}
        </div>

        {currentStep < 4 && (
          <div className="fixed md:static bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-gray-100 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-none z-20">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-0"
            >
              Back
            </button>
            
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
            >
              {currentStep === 3 ? 'Proceed to Export' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* --- TEMP STORAGE SELECTION MODAL --- */}
      {tempModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" /> Select Document from Temp Storage
              </h3>
              <button onClick={() => setTempModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
              {tempFilesList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No temporary files found</div>
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
