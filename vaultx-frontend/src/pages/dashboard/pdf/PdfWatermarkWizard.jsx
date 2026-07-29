import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { 
  Type, Upload, PenTool, Shield, Eye, Download, Check, X, FileText, 
  Image as ImageIcon, RefreshCw, ChevronLeft, Loader2, Move, Lightbulb, 
  Layers, CheckSquare, Square, Sliders, Folder, Sparkles, CheckCircle2, RotateCw, GripVertical, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../../services/documentService';
import { tempStorageService } from '../../../utils/tempStorageService';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export default function PdfWatermarkWizard() {
  const navigate = useNavigate();

  // Source document state
  const [sourceDoc, setSourceDoc] = useState(null); // { name, type: 'pdf'|'image', arrayBuffer, totalPages, fileSize, thumbnails }
  const [isProcessingSource, setIsProcessingSource] = useState(false);

  // Active accordion section for controls: 'text' | 'image' | 'draw'
  const [activeControlTab, setActiveControlTab] = useState('text');

  // 1. Independent Text Watermark State
  const [textWm, setTextWm] = useState({
    enabled: true,
    text: 'CONFIDENTIAL',
    size: 36,
    opacity: 0.3,
    color: '#475569',
    rotation: 45,
    pos: { xPct: 50, yPct: 50 } // Center
  });

  // 2. Independent Image Logo State
  const [imgWm, setImgWm] = useState({
    enabled: false,
    dataUrl: null,
    scale: 100,
    opacity: 0.8,
    pos: { xPct: 80, yPct: 15 } // Top Right
  });

  // 3. Independent Digital Signature State
  const [sigWm, setSigWm] = useState({
    enabled: false,
    dataUrl: null,
    pos: { xPct: 80, yPct: 80 } // Bottom Right
  });

  // Whiteboard drawing pad ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Target Pages selection: 'all' | 'custom' | 'first' | 'last' | 'even' | 'odd'
  const [pageTargetMode, setPageTargetMode] = useState('all');
  const [selectedPages, setSelectedPages] = useState(new Set()); // Set of 1-based page numbers
  const [customRangeText, setCustomRangeText] = useState('');

  // Dragging state on Placement Sheet: 'text' | 'image' | 'signature' | null
  const [draggingTarget, setDraggingTarget] = useState(null);
  const sheetRef = useRef(null);

  // Live PDF Preview state
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

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

  // Convert image file to PDF ArrayBuffer
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

  // Render PDF page thumbnails
  const renderPdfThumbnails = async (arrayBuffer, totalPages) => {
    const thumbnails = [];
    try {
      const data = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= Math.min(totalPages, 50); i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
        } catch (e) {
          console.warn(`Thumbnail failed for page ${i}`, e);
        }
      }
    } catch (err) {
      console.warn('Could not generate thumbnails', err);
    }
    return thumbnails;
  };

  // Upload local file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSource(true);
    const toastId = toast.loading(`Loading ${file.name}...`);

    try {
      if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
        const { pdfBytes, thumbnail } = await convertImageToPdfBuffer(file);
        const docObj = {
          name: file.name,
          type: 'image',
          arrayBuffer: pdfBytes,
          totalPages: 1,
          fileSize: file.size,
          thumbnails: [thumbnail]
        };
        setSourceDoc(docObj);
        setSelectedPages(new Set([1]));
      } else {
        const rawBuffer = await file.arrayBuffer();
        const bufferForPdfDoc = rawBuffer.slice(0);
        const bufferForThumbnails = rawBuffer.slice(0);

        const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();
        const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

        const docObj = {
          name: file.name,
          type: 'pdf',
          arrayBuffer: rawBuffer,
          totalPages,
          fileSize: file.size,
          thumbnails
        };
        setSourceDoc(docObj);
        const allPages = new Set();
        for (let i = 1; i <= totalPages; i++) allPages.add(i);
        setSelectedPages(allPages);
      }
      toast.success('Document loaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to load file:', err);
      toast.error('Failed to parse document', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Vault Selection  // Open Vault Selection Modal
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
        const { pdfBytes, thumbnail } = await convertImageToPdfBuffer(blob);
        const docObj = {
          name: vaultDoc.displayName,
          type: 'image',
          arrayBuffer: pdfBytes,
          totalPages: 1,
          fileSize: vaultDoc.fileSize || blob.size,
          thumbnails: [thumbnail]
        };
        setSourceDoc(docObj);
        setSelectedPages(new Set([1]));
      } else {
        const rawBuffer = await blob.arrayBuffer();
        const bufferForPdfDoc = rawBuffer.slice(0);
        const bufferForThumbnails = rawBuffer.slice(0);

        const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();
        const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

        const docObj = {
          name: vaultDoc.displayName,
          type: 'pdf',
          arrayBuffer: rawBuffer,
          totalPages,
          fileSize: vaultDoc.fileSize || blob.size,
          thumbnails
        };
        setSourceDoc(docObj);
        const allPages = new Set();
        for (let i = 1; i <= totalPages; i++) allPages.add(i);
        setSelectedPages(allPages);
      }
      toast.success(`Loaded ${vaultDoc.displayName}`, { id: toastId });
    } catch (err) {
      toast.error('Failed to load vault document', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Whiteboard drawing pad handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      setSigWm(prev => ({ ...prev, dataUrl: url, enabled: true }));
      toast.success('Digital signature captured!');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigWm(prev => ({ ...prev, dataUrl: null }));
  };

  const handleImageWatermarkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImgWm(prev => ({ ...prev, dataUrl: evt.target.result, enabled: true }));
      toast.success('Image logo loaded!');
    };
    reader.readAsDataURL(file);
  };

  // Dragging Handlers on Placement Sheet
  const startDragStamp = (e, targetKey) => {
    e.preventDefault();
    setDraggingTarget(targetKey);
  };

  const handleSheetMouseMove = (e) => {
    if (!draggingTarget || !sheetRef.current) return;
    const rect = sheetRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(88, ((e.clientY - rect.top) / rect.height) * 100));
    const cleanX = Math.round(x);
    const cleanY = Math.round(y);

    if (draggingTarget === 'text') {
      setTextWm(prev => ({ ...prev, pos: { xPct: cleanX, yPct: cleanY } }));
    } else if (draggingTarget === 'image') {
      setImgWm(prev => ({ ...prev, pos: { xPct: cleanX, yPct: cleanY } }));
    } else if (draggingTarget === 'signature') {
      setSigWm(prev => ({ ...prev, pos: { xPct: cleanX, yPct: cleanY } }));
    }
  };

  const handleSheetMouseUp = () => {
    if (draggingTarget) setDraggingTarget(null);
  };

  const setPresetPositionForActive = (presetKey, defaultX, defaultY) => {
    const cleanPos = { xPct: defaultX, yPct: defaultY };
    if (activeControlTab === 'text') {
      setTextWm(prev => ({ ...prev, pos: cleanPos }));
    } else if (activeControlTab === 'image') {
      setImgWm(prev => ({ ...prev, pos: cleanPos }));
    } else if (activeControlTab === 'draw') {
      setSigWm(prev => ({ ...prev, pos: cleanPos }));
    }
  };

  // Compute Target Page Numbers based on Mode
  const getTargetPageNumbers = () => {
    if (!sourceDoc) return [];
    const total = sourceDoc.totalPages;

    if (pageTargetMode === 'all') {
      return Array.from({ length: total }, (_, i) => i + 1);
    } else if (pageTargetMode === 'first') {
      return [1];
    } else if (pageTargetMode === 'last') {
      return [total];
    } else if (pageTargetMode === 'even') {
      const evens = [];
      for (let i = 2; i <= total; i += 2) evens.push(i);
      return evens;
    } else if (pageTargetMode === 'odd') {
      const odds = [];
      for (let i = 1; i <= total; i += 2) odds.push(i);
      return odds;
    } else if (pageTargetMode === 'custom') {
      if (selectedPages.size > 0) return Array.from(selectedPages).sort((a, b) => a - b);
      if (customRangeText.trim()) {
        const pages = [];
        const parts = customRangeText.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n)).filter(n => !isNaN(n));
            if (start && end) {
              for (let i = Math.max(1, start); i <= Math.min(total, end); i++) pages.push(i);
            }
          } else {
            const num = parseInt(part);
            if (!isNaN(num) && num >= 1 && num <= total) pages.push(num);
          }
        }
        return Array.from(new Set(pages)).sort((a, b) => a - b);
      }
    }
    return Array.from({ length: total }, (_, i) => i + 1);
  };

  // Core Multi-Overlay Watermark Generator Engine
  const generateWatermarkedPdfBytes = async () => {
    if (!sourceDoc) return null;

    const pdfDoc = await PDFDocument.load(sourceDoc.arrayBuffer.slice(0), { ignoreEncryption: true });
    const targetPages = getTargetPageNumbers();
    const zeroBasedTargets = new Set(targetPages.map(p => p - 1));

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    // 1. Stamp Text Watermark if Enabled
    if (textWm.enabled && textWm.text.trim()) {
      const r = parseInt(textWm.color.slice(1, 3), 16) / 255 || 0.3;
      const g = parseInt(textWm.color.slice(3, 5), 16) / 255 || 0.3;
      const b = parseInt(textWm.color.slice(5, 7), 16) / 255 || 0.3;

      for (let idx = 0; idx < pages.length; idx++) {
        if (!zeroBasedTargets.has(idx)) continue;
        const page = pages[idx];
        const { width, height } = page.getSize();

        const textWidth = font.widthOfTextAtSize(textWm.text, textWm.size);
        const posX = Math.max(10, (width - textWidth) * (textWm.pos.xPct / 100));
        const posY = Math.max(10, (height - textWm.size) * ((100 - textWm.pos.yPct) / 100));

        page.drawText(textWm.text, {
          x: posX,
          y: posY,
          size: textWm.size,
          font,
          color: rgb(r, g, b),
          opacity: Math.max(0.05, Math.min(0.9, textWm.opacity)),
          rotate: degrees(textWm.rotation)
        });
      }
    }

    // 2. Stamp Image Logo if Enabled
    if (imgWm.enabled && imgWm.dataUrl) {
      try {
        const imgBytes = await fetch(imgWm.dataUrl).then(res => res.arrayBuffer());
        const embeddedImg = imgWm.dataUrl.startsWith('data:image/png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const baseWidth = 140 * (imgWm.scale / 100);
        const baseHeight = (embeddedImg.height / embeddedImg.width) * baseWidth;

        for (let idx = 0; idx < pages.length; idx++) {
          if (!zeroBasedTargets.has(idx)) continue;
          const page = pages[idx];
          const { width, height } = page.getSize();

          const posX = (width - baseWidth) * (imgWm.pos.xPct / 100);
          const posY = (height - baseHeight) * ((100 - imgWm.pos.yPct) / 100);

          page.drawImage(embeddedImg, {
            x: Math.max(10, Math.min(width - baseWidth - 10, posX)),
            y: Math.max(10, Math.min(height - baseHeight - 10, posY)),
            width: baseWidth,
            height: baseHeight,
            opacity: Math.max(0.1, Math.min(1, imgWm.opacity))
          });
        }
      } catch (err) {
        console.warn('Image watermark embed error:', err);
      }
    }

    // 3. Stamp Digital Signature if Enabled
    if (sigWm.enabled && sigWm.dataUrl) {
      try {
        const sigBytes = await fetch(sigWm.dataUrl).then(res => res.arrayBuffer());
        const sigImg = sigWm.dataUrl.startsWith('data:image/png')
          ? await pdfDoc.embedPng(sigBytes)
          : await pdfDoc.embedJpg(sigBytes);

        const sigWidth = 150;
        const sigHeight = (sigImg.height / sigImg.width) * sigWidth;

        for (let idx = 0; idx < pages.length; idx++) {
          if (!zeroBasedTargets.has(idx)) continue;
          const page = pages[idx];
          const { width, height } = page.getSize();

          const posX = (width - sigWidth) * (sigWm.pos.xPct / 100);
          const posY = (height - sigHeight) * ((100 - sigWm.pos.yPct) / 100);

          page.drawImage(sigImg, {
            x: Math.max(10, Math.min(width - sigWidth - 10, posX)),
            y: Math.max(10, Math.min(height - sigHeight - 10, posY)),
            width: sigWidth,
            height: sigHeight
          });
        }
      } catch (err) {
        console.warn('Signature embed error:', err);
      }
    }

    return await pdfDoc.save();
  };

  // Auto-Update Live PDF Preview
  useEffect(() => {
    let isCancelled = false;
    const updatePreview = async () => {
      if (!sourceDoc) return;
      setIsRenderingPreview(true);
      try {
        const pdfBytes = await generateWatermarkedPdfBytes();
        if (pdfBytes && !isCancelled) {
          if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          setPreviewBlobUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.warn('Live preview render error:', err);
      } finally {
        if (!isCancelled) setIsRenderingPreview(false);
      }
    };

    const timeout = setTimeout(updatePreview, 300);
    return () => { isCancelled = true; clearTimeout(timeout); };
  }, [sourceDoc, textWm, imgWm, sigWm, pageTargetMode, selectedPages, customRangeText]);

  // Download PDF Action
  const handleDownloadPdf = async () => {
    if (!sourceDoc) {
      toast.error('Please load a PDF or image document first');
      return;
    }

    const toastId = toast.loading('Generating watermarked PDF...');
    try {
      const pdfBytes = await generateWatermarkedPdfBytes();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_Watermarked.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Watermarked PDF Downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  // Save to 7-Day Temporary Storage
  const handleSaveToTempStorage = async () => {
    if (!sourceDoc) {
      toast.error('Please load a PDF or image document first');
      return;
    }
    const toastId = toast.loading('Saving to 7-day temporary storage...');
    try {
      const pdfBytes = await generateWatermarkedPdfBytes();
      const baseName = sourceDoc.name.replace(/\.[^/.]+$/, '');
      await tempStorageService.saveFile(pdfBytes, `${baseName}_Watermarked.pdf`, 'application/pdf');
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
      const bufferForPdfDoc = rawBuffer.slice(0);
      const bufferForThumbnails = rawBuffer.slice(0);

      const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

      setSourceDoc({
        name: file.name,
        type: 'pdf',
        arrayBuffer: rawBuffer,
        totalPages,
        fileSize: file.size,
        thumbnails
      });
      const allPages = new Set();
      for (let i = 1; i <= totalPages; i++) allPages.add(i);
      setSelectedPages(allPages);
      toast.success(`Loaded ${file.name} from Temp Storage`, { id: toastId });
    } catch (err) {
      console.error('Temp storage select error:', err);
      toast.error('Failed to load temporary storage file', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  const togglePageSelection = (pageNum) => {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) next.delete(pageNum);
    else next.add(pageNum);
    setSelectedPages(next);
  };

  return (
    <div className="h-full flex flex-col pb-6 space-y-4">

      {/* --- Top Header Toolbar --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-4 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/pdf-toolkit')}
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
            title="Back to PDF Toolkit"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" /> Multi-Overlay Watermark & Stamp Studio
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Combine Text Watermark, Image Logo, and Digital Signature simultaneously with independent positions!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
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
            onClick={handleDownloadPdf}
            disabled={!sourceDoc}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>

      {/* --- Main Two-Column Studio Workspace --- */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-[580px]">

        {/* ── LEFT COLUMN: Independent Multi-Overlay Controls & Placement Sheet (6 cols) ── */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-5 flex flex-col space-y-5 shadow-sm overflow-y-auto max-h-[740px]">

          {/* 1. Document Source Badge */}
          {sourceDoc ? (
            <div className="flex items-center justify-between p-3.5 bg-purple-50/60 border border-purple-200 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                {sourceDoc.type === 'image' ? <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" /> : <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{sourceDoc.name}</h4>
                  <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                    {sourceDoc.totalPages} Page(s) • {(sourceDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={() => setSourceDoc(null)} className="p-1 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30 text-center">
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-xs">No Document Selected</p>
              <p className="text-[11px] text-gray-500 mt-0.5 mb-3">Upload a local PDF/Image or select from your Cloud Vault.</p>
              <div className="flex justify-center gap-2">
                <label className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                  Upload File
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button onClick={handleOpenVault} className="px-3.5 py-1.5 bg-white border border-gray-200 font-bold text-xs rounded-xl text-gray-700">
                  Vault Storage
                </button>
              </div>
            </div>
          )}

          {/* 2. Independent Multi-Overlay Toggle Bar */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
              ENABLE & EDIT OVERLAYS
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* Tab 1: Text Watermark */}
              <button
                type="button"
                onClick={() => setActiveControlTab('text')}
                className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  activeControlTab === 'text' 
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200 shadow-xs' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5" /> Text
                  </span>
                  <input
                    type="checkbox"
                    checked={textWm.enabled}
                    onChange={e => setTextWm(prev => ({ ...prev, enabled: e.target.checked }))}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 truncate font-semibold">
                  {textWm.enabled ? (textWm.text || 'Enabled') : 'Disabled'}
                </p>
              </button>

              {/* Tab 2: Image Logo */}
              <button
                type="button"
                onClick={() => setActiveControlTab('image')}
                className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  activeControlTab === 'image' 
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 shadow-xs' 
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Logo
                  </span>
                  <input
                    type="checkbox"
                    checked={imgWm.enabled}
                    onChange={e => setImgWm(prev => ({ ...prev, enabled: e.target.checked }))}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 truncate font-semibold">
                  {imgWm.enabled ? (imgWm.dataUrl ? 'Image Loaded' : 'No Image') : 'Disabled'}
                </p>
              </button>

              {/* Tab 3: Digital Signature */}
              <button
                type="button"
                onClick={() => setActiveControlTab('draw')}
                className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  activeControlTab === 'draw' 
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200 shadow-xs' 
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5" /> Sign
                  </span>
                  <input
                    type="checkbox"
                    checked={sigWm.enabled}
                    onChange={e => setSigWm(prev => ({ ...prev, enabled: e.target.checked }))}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 truncate font-semibold">
                  {sigWm.enabled ? (sigWm.dataUrl ? 'Sign Drawn' : 'No Sign') : 'Disabled'}
                </p>
              </button>
            </div>
          </div>

          {/* Controls Panel 1: Text Watermark */}
          {activeControlTab === 'text' && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-blue-600" /> Text Watermark Settings
                </h4>
                <label className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textWm.enabled}
                    onChange={e => setTextWm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-blue-600 rounded"
                  /> Enable Text Watermark
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Watermark Text:</label>
                <input
                  type="text"
                  placeholder="e.g. CONFIDENTIAL / APPROVED - VAULTX"
                  value={textWm.text}
                  onChange={e => setTextWm(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Font Size: {textWm.size}pt</label>
                  <input
                    type="range"
                    min="14"
                    max="72"
                    value={textWm.size}
                    onChange={e => setTextWm(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Opacity: {Math.round(textWm.opacity * 100)}%</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={textWm.opacity}
                    onChange={e => setTextWm(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Text Color:</label>
                  <input
                    type="color"
                    value={textWm.color}
                    onChange={e => setTextWm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-8 p-0.5 rounded-lg border border-gray-300 cursor-pointer bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Rotation Angle:</label>
                  <select
                    value={textWm.rotation}
                    onChange={e => setTextWm(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                    className="w-full h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold outline-none"
                  >
                    <option value={0}>0° Horizontal</option>
                    <option value={45}>45° Diagonal</option>
                    <option value={90}>90° Vertical</option>
                    <option value={-45}>-45° Reverse Diagonal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Controls Panel 2: Image Logo Watermark */}
          {activeControlTab === 'image' && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" /> Image Logo Settings
                </h4>
                <label className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imgWm.enabled}
                    onChange={e => setImgWm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-indigo-600 rounded"
                  /> Enable Image Logo
                </label>
              </div>

              <label className="border-2 border-dashed border-indigo-300 bg-white hover:bg-indigo-50/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-7 h-7 text-indigo-500 mb-1.5" />
                <span className="text-xs font-bold text-indigo-800">Upload Image / Logo Stamp</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Supports PNG with transparency or JPG</span>
                <input type="file" accept="image/png,image/jpeg" onChange={handleImageWatermarkUpload} className="hidden" />
              </label>

              {imgWm.dataUrl && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl">
                    <img src={imgWm.dataUrl} alt="Watermark Logo Preview" className="h-10 max-w-[140px] object-contain" />
                    <button onClick={() => setImgWm(prev => ({ ...prev, dataUrl: null }))} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Scale Size: {imgWm.scale}%</label>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        value={imgWm.scale}
                        onChange={e => setImgWm(prev => ({ ...prev, scale: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Opacity: {Math.round(imgWm.opacity * 100)}%</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={imgWm.opacity}
                        onChange={e => setImgWm(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls Panel 3: Digital Whiteboard Signature */}
          {activeControlTab === 'draw' && (
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-purple-600" /> Digital Whiteboard Pad
                </h4>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={clearCanvas} className="text-xs text-red-500 font-bold hover:underline">
                    Clear Pad
                  </button>
                  <label className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sigWm.enabled}
                      onChange={e => setSigWm(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-purple-600 rounded"
                    /> Enable Signature
                  </label>
                </div>
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
                  className="w-full h-28 cursor-crosshair touch-none"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-medium pointer-events-none">
                  Draw with mouse or finger
                </span>
              </div>
            </div>
          )}

          {/* 3. Page Selection Target Options */}
          <div className="space-y-3 bg-slate-50 border border-gray-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
              TARGET PAGES TO WATERMARK
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {[
                { id: 'all', label: 'All Pages' },
                { id: 'first', label: 'First Page' },
                { id: 'last', label: 'Last Page' },
                { id: 'even', label: 'Even Pages' },
                { id: 'odd', label: 'Odd Pages' },
                { id: 'custom', label: 'Specific Pages' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPageTargetMode(opt.id)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all ${
                    pageTargetMode === opt.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {pageTargetMode === 'custom' && sourceDoc && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-700 block">Enter Page Numbers / Ranges:</label>
                <input
                  type="text"
                  placeholder="e.g. 1, 3, 5-8"
                  value={customRangeText}
                  onChange={e => setCustomRangeText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
                />

                {sourceDoc.thumbnails && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2 max-h-36 overflow-y-auto">
                    {sourceDoc.thumbnails.map((t, i) => {
                      const pNum = i + 1;
                      const isSel = selectedPages.has(pNum);
                      return (
                        <div
                          key={pNum}
                          onClick={() => togglePageSelection(pNum)}
                          className={`relative aspect-[3/4] border-2 rounded-lg overflow-hidden cursor-pointer ${
                            isSel ? 'border-purple-600 ring-2 ring-purple-400/30' : 'border-gray-200'
                          }`}
                        >
                          <img src={t} alt={`p${pNum}`} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 rounded ${
                            isSel ? 'bg-purple-600 text-white' : 'bg-gray-800/60 text-white'
                          }`}>
                            p.{pNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Interactive Placement Sheet with Independent Multi-Stamp Positioning */}
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical className="w-4 h-4 text-purple-600" />
                <h5 className="font-bold text-gray-900 text-xs">Multi-Stamp Placement Sheet</h5>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold">
                Editing: <strong className="uppercase text-purple-800">{activeControlTab}</strong>
              </span>
            </div>

            {/* Quick Presets for Currently Selected Tab */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'BOTTOM_RIGHT', label: 'Bottom Right', x: 80, y: 80 },
                { id: 'BOTTOM_LEFT', label: 'Bottom Left', x: 15, y: 80 },
                { id: 'TOP_RIGHT', label: 'Top Right', x: 80, y: 15 },
                { id: 'TOP_LEFT', label: 'Top Left', x: 15, y: 15 },
                { id: 'CENTER', label: 'Center', x: 50, y: 50 },
                { id: 'WATERMARK_DIAGONAL', label: 'Diagonal', x: 50, y: 50 }
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPresetPositionForActive(pos.id, pos.x, pos.y)}
                  className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-white text-gray-700 border border-gray-200 hover:border-purple-300 text-center transition-all"
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Interactive Sheet Container with 3 Independent Draggable Stamps */}
            <div
              ref={sheetRef}
              onMouseMove={handleSheetMouseMove}
              onMouseUp={handleSheetMouseUp}
              onMouseLeave={handleSheetMouseUp}
              className="relative w-full aspect-[1/1.25] bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm overflow-hidden select-none cursor-crosshair bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
            >
              <div className="space-y-2 opacity-30 pointer-events-none">
                <div className="w-1/3 h-3 bg-gray-400 rounded"></div>
                <div className="w-full h-2 bg-gray-300 rounded"></div>
                <div className="w-5/6 h-2 bg-gray-300 rounded"></div>
                <div className="w-4/6 h-2 bg-gray-300 rounded"></div>
              </div>

              {/* 1. Independent Text Watermark Stamp Box */}
              {textWm.enabled && (
                <div
                  onMouseDown={e => startDragStamp(e, 'text')}
                  style={{
                    left: `${textWm.pos.xPct}%`,
                    top: `${textWm.pos.yPct}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-10 p-2 bg-blue-600 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing border-2 border-white transition-transform ${
                    draggingTarget === 'text' ? 'scale-110 shadow-2xl ring-4 ring-blue-400/40' : 'hover:scale-105'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-blue-100 uppercase tracking-wider">
                    <Move className="w-3 h-3" /> Text ({textWm.pos.xPct}%, {textWm.pos.yPct}%)
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block max-w-[130px] truncate pointer-events-none">
                    {textWm.text || 'CONFIDENTIAL'}
                  </span>
                </div>
              )}

              {/* 2. Independent Image Logo Stamp Box */}
              {imgWm.enabled && (
                <div
                  onMouseDown={e => startDragStamp(e, 'image')}
                  style={{
                    left: `${imgWm.pos.xPct}%`,
                    top: `${imgWm.pos.yPct}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-10 p-2 bg-indigo-600 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing border-2 border-white transition-transform ${
                    draggingTarget === 'image' ? 'scale-110 shadow-2xl ring-4 ring-indigo-400/40' : 'hover:scale-105'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-100 uppercase tracking-wider">
                    <Move className="w-3 h-3" /> Logo ({imgWm.pos.xPct}%, {imgWm.pos.yPct}%)
                  </div>
                  {imgWm.dataUrl ? (
                    <img src={imgWm.dataUrl} alt="Logo" className="h-9 max-w-[120px] object-contain bg-white/90 p-1 rounded-lg pointer-events-none" />
                  ) : (
                    <span className="text-[11px] font-bold text-indigo-100 pointer-events-none">🖼️ Image Stamp</span>
                  )}
                </div>
              )}

              {/* 3. Independent Digital Signature Stamp Box */}
              {sigWm.enabled && (
                <div
                  onMouseDown={e => startDragStamp(e, 'signature')}
                  style={{
                    left: `${sigWm.pos.xPct}%`,
                    top: `${sigWm.pos.yPct}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-10 p-2 bg-purple-600 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing border-2 border-white transition-transform ${
                    draggingTarget === 'signature' ? 'scale-110 shadow-2xl ring-4 ring-purple-400/40' : 'hover:scale-105'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-purple-100 uppercase tracking-wider">
                    <Move className="w-3 h-3" /> Sign ({sigWm.pos.xPct}%, {sigWm.pos.yPct}%)
                  </div>
                  {sigWm.dataUrl ? (
                    <img src={sigWm.dataUrl} alt="Sig" className="h-9 max-w-[120px] object-contain bg-white/90 p-1 rounded-lg pointer-events-none" />
                  ) : (
                    <span className="text-[11px] font-bold text-purple-100 pointer-events-none">✍️ Sign Stamp</span>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ── RIGHT COLUMN: Live Watermarked PDF Preview (6 cols) ── */}
        <div className="lg:col-span-6 bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-xl border border-slate-800">
          <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10 px-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="font-bold text-sm text-purple-300">Live Multi-Overlay PDF Preview</h4>
            </div>

            <div className="flex items-center gap-2">
              {isRenderingPreview && (
                <span className="text-xs text-purple-400 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                </span>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!sourceDoc}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-950 p-4 flex items-center justify-center relative overflow-hidden">
            {isRenderingPreview ? (
              <div className="flex flex-col items-center text-purple-300">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <p className="text-xs font-semibold">Rendering multi-overlay watermarked PDF...</p>
              </div>
            ) : previewBlobUrl ? (
              <iframe src={previewBlobUrl} title="Live Watermark Preview" className="w-full h-full border-none rounded-2xl bg-white shadow-2xl" />
            ) : (
              <div className="text-center p-8 text-gray-500 text-xs">
                <FileText className="w-12 h-12 text-gray-700 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-gray-400">No Document Loaded</p>
                <p className="text-[11px] mt-1 max-w-xs mx-auto text-gray-600">
                  Upload a PDF or image on the left panel to display the real-time live watermarked preview.
                </p>
              </div>
            )}
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
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:border-purple-400 hover:bg-purple-50/50 transition-all">
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
                          <p className="text-xs font-bold text-gray-800 group-hover:text-purple-600 truncate">{doc.displayName}</p>
                          <p className="text-[10px] text-gray-400">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPreviewForDoc(doc, 'vault')}
                          className="p-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 rounded-xl transition-all"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectVaultDoc(doc)}
                          className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-all shadow-xs"
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
                <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <h3 className="font-bold text-base text-white truncate">
                  {previewDocModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={previewDocModal.onSelect}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
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
