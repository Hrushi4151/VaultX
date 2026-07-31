import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { 
  Scissors, Layers, Upload, Shield, Check, X, Trash2, Copy, Eye, Download, 
  FileText, GripVertical, Plus, Search, FileArchive, Sparkles, RefreshCw, 
  Edit3, ArrowUp, ArrowDown, CheckSquare, Square, ZoomIn, ZoomOut, RotateCw, 
  LayoutGrid, ChevronLeft, Loader2, ArrowRight, HelpCircle, SlidersHorizontal,
  Image as ImageIcon, Folder, File, PenTool, Lock, Key, Type, Sliders, CheckCircle2,
  Move, Lightbulb, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import documentService from '../../../services/documentService';
import pdfService from '../../../services/pdfService';
import { tempStorageService } from '../../../utils/tempStorageService';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export default function PdfSplitWizard() {
  const navigate = useNavigate();

  // --- Sub-Tab State: 'sources' | 'splitter' | 'signature' | 'security' ---
  const [leftTab, setLeftTab] = useState('sources');

  // --- Sources & Active Tab State ---
  const [sources, setSources] = useState([]); // [{ id, name, type: 'pdf'|'image', file, totalPages, fileSize, arrayBuffer, thumbnails }]
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [isProcessingSource, setIsProcessingSource] = useState(false);

  // --- Page Selection & Grid State ---
  const [selectedPages, setSelectedPages] = useState(new Set()); // Set of 1-indexed page numbers
  const [lastClickedPage, setLastClickedPage] = useState(null);
  const [gridSize, setGridSize] = useState('MD'); // 'SM' | 'MD' | 'LG'
  const [searchPageQuery, setSearchPageQuery] = useState('');

  // --- Split Methods State ---
  const [splitMethod, setSplitMethod] = useState('custom'); // 'custom' | 'every' | 'even' | 'odd' | 'everyN' | 'range'
  const [everyNValue, setEveryNValue] = useState(2);
  const [customRangeInput, setCustomRangeInput] = useState('1-3, 4-6');

  // --- Generated Chunks Panel State ---
  const [chunks, setChunks] = useState([]); // [{ id, name, sourceName, sourceId, pageNumbers, pdfBytes, pageCount, estSize, checked, createdAt }]
  const [editingChunkId, setEditingChunkId] = useState(null);
  const [editingChunkName, setEditingChunkName] = useState('');

  // --- TAB 3: Digital Signature & Watermark State ---
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'upload' | 'text'
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState('BOTTOM_RIGHT');
  const [stampCoords, setStampCoords] = useState({ xPct: 80, yPct: 80 });
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const sheetRef = useRef(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkColor, setWatermarkColor] = useState('#64748b');

  // --- TAB 4: Password Protection State ---
  const [enablePassword, setEnablePassword] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // --- Preview Modals State ---
  const [previewModal, setPreviewModal] = useState({ isOpen: false, title: '', blobUrl: null, totalPages: 1 });
  const [finalMergeModal, setFinalMergeModal] = useState({ isOpen: false, title: '', blobUrl: null, pdfBytes: null, pageCount: 0, estSize: 0 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

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

  // --- Process & Export Status ---
  const [isMerging, setIsMerging] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const activeSource = sources[activeSourceIndex] || null;

  // Clear page selection when active source tab changes
  useEffect(() => {
    setSelectedPages(new Set());
    setLastClickedPage(null);
  }, [activeSourceIndex]);

  // Whiteboard drawing handlers for Signature Tab
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
    if (canvas) setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleSignatureFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSignatureDataUrl(evt.target.result);
      toast.success('Signature image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Interactive Stamp Drag Handlers on A4 Sheet
  const handleStampMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingStamp(true);
  };

  const handleSheetMouseMove = (e) => {
    if (!isDraggingStamp || !sheetRef.current) return;
    const rect = sheetRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(10, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    const cleanX = Math.round(x);
    const cleanY = Math.round(y);
    setStampCoords({ xPct: cleanX, yPct: cleanY });
    setSignaturePosition(`CUSTOM:${cleanX},${cleanY}`);
  };

  const handleSheetMouseUp = () => {
    if (isDraggingStamp) setIsDraggingStamp(false);
  };

  const selectPositionPreset = (presetKey, defaultX, defaultY) => {
    setSignaturePosition(presetKey);
    setStampCoords({ xPct: defaultX, yPct: defaultY });
  };

  // Helper: Convert any image file/blob to PDF ArrayBuffer & Thumbnail Data URL
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

  // Render thumbnails for a PDF ArrayBuffer
  const renderPdfThumbnails = async (arrayBuffer, totalPages) => {
    const thumbnails = [];
    try {
      const data = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= Math.min(totalPages, 100); i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
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
      console.warn('Could not generate full canvas thumbnails, fallback to icons', err);
    }
    return thumbnails;
  };

  // Handle uploading local PDF or Image files
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingSource(true);
    const toastId = toast.loading('Processing uploaded PDF and image files...');

    try {
      const newSources = [];
      for (const file of files) {
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
          const { pdfBytes, thumbnail } = await convertImageToPdfBuffer(file);
          newSources.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            type: 'image',
            file,
            arrayBuffer: pdfBytes,
            totalPages: 1,
            fileSize: file.size,
            thumbnails: [thumbnail]
          });
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const rawBuffer = await file.arrayBuffer();
          const bufferForPdfDoc = rawBuffer.slice(0);
          const bufferForThumbnails = rawBuffer.slice(0);

          const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
          const totalPages = pdfDoc.getPageCount();
          const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

          newSources.push({
            id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            type: 'pdf',
            file,
            arrayBuffer: rawBuffer,
            totalPages,
            fileSize: file.size,
            thumbnails
          });
        } else {
          toast.error(`${file.name} is not a supported PDF or Image file`);
        }
      }

      if (newSources.length > 0) {
        setSources(prev => {
          const next = [...prev, ...newSources];
          setActiveSourceIndex(next.length - 1);
          return next;
        });
        toast.success(`Added ${newSources.length} document/image(s)`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      toast.error('Failed to parse file. It may be corrupted or unsupported.', { id: toastId });
    } finally {
      setIsProcessingSource(false);
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
    setVaultModalOpen(false);
    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const rawBuffer = await tempStorageService.getFileArrayBuffer(file);
      const bufferForPdfDoc = rawBuffer.slice(0);
      const bufferForThumbnails = rawBuffer.slice(0);

      const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

      const newSrc = {
        id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        type: 'pdf',
        arrayBuffer: rawBuffer,
        totalPages,
        fileSize: file.size,
        thumbnails
      };

      setSources(prev => [...prev, newSrc]);
      setActiveSourceIndex(sources.length);
      toast.success(`Loaded ${file.name} from Temp Storage`, { id: toastId });
    } catch (err) {
      console.error('Temp storage select error:', err);
      toast.error('Failed to load temporary storage file', { id: toastId });
    }
  };

  // Open Vault Selection Modal
  const handleOpenVaultModal = async () => {
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
    const toastId = toast.loading(`Loading ${vaultDoc.displayName}...`);

    try {
      const res = await documentService.downloadDocument(vaultDoc.id);
      const blob = res.data;

      if (vaultDoc.mimeType?.startsWith('image/')) {
        const { pdfBytes, thumbnail } = await convertImageToPdfBuffer(blob);
        const newSource = {
          id: `vault_img_${vaultDoc.id}`,
          name: vaultDoc.displayName,
          type: 'image',
          file: null,
          arrayBuffer: pdfBytes,
          totalPages: 1,
          fileSize: vaultDoc.fileSize || blob.size,
          thumbnails: [thumbnail]
        };

        setSources(prev => {
          const next = [...prev, newSource];
          setActiveSourceIndex(next.length - 1);
          return next;
        });
      } else {
        const rawBuffer = await blob.arrayBuffer();
        const bufferForPdfDoc = rawBuffer.slice(0);
        const bufferForThumbnails = rawBuffer.slice(0);

        const pdfDoc = await PDFDocument.load(bufferForPdfDoc, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();
        const thumbnails = await renderPdfThumbnails(bufferForThumbnails, totalPages);

        const newSource = {
          id: `vault_${vaultDoc.id}`,
          name: vaultDoc.displayName,
          type: 'pdf',
          file: null,
          arrayBuffer: rawBuffer,
          totalPages,
          fileSize: vaultDoc.fileSize || blob.size,
          thumbnails
        };

        setSources(prev => {
          const next = [...prev, newSource];
          setActiveSourceIndex(next.length - 1);
          return next;
        });
      }

      toast.success(`Loaded ${vaultDoc.displayName}`, { id: toastId });
    } catch (err) {
      console.error('Failed to download vault doc:', err);
      toast.error('Failed to download vault document', { id: toastId });
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Reorder Source Documents in Tab 1
  const handleDragEndSources = (result) => {
    if (!result.destination) return;
    const items = Array.from(sources);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSources(items);
    toast.success('Source document sequence reordered!');
  };

  const moveSourceUp = (idx) => {
    if (idx === 0) return;
    const items = Array.from(sources);
    const temp = items[idx];
    items[idx] = items[idx - 1];
    items[idx - 1] = temp;
    setSources(items);
    if (activeSourceIndex === idx) setActiveSourceIndex(idx - 1);
    else if (activeSourceIndex === idx - 1) setActiveSourceIndex(idx);
  };

  const moveSourceDown = (idx) => {
    if (idx === sources.length - 1) return;
    const items = Array.from(sources);
    const temp = items[idx];
    items[idx] = items[idx + 1];
    items[idx + 1] = temp;
    setSources(items);
    if (activeSourceIndex === idx) setActiveSourceIndex(idx + 1);
    else if (activeSourceIndex === idx + 1) setActiveSourceIndex(idx);
  };

  const handleRemoveSource = (sourceId) => {
    setSources(prev => {
      const next = prev.filter(s => s.id !== sourceId);
      if (next.length === 0) setActiveSourceIndex(0);
      else if (activeSourceIndex >= next.length) setActiveSourceIndex(next.length - 1);
      return next;
    });
    toast.success('Source document removed');
  };

  // --- Thumbnail Grid Selection Handlers ---
  const handlePageClick = (pageNum, e) => {
    if (!activeSource) return;

    const newSelection = new Set(selectedPages);

    if (e?.shiftKey && lastClickedPage !== null) {
      const start = Math.min(lastClickedPage, pageNum);
      const end = Math.max(lastClickedPage, pageNum);
      for (let p = start; p <= end; p++) newSelection.add(p);
    } else if (e?.ctrlKey || e?.metaKey) {
      if (newSelection.has(pageNum)) newSelection.delete(pageNum);
      else newSelection.add(pageNum);
    } else {
      if (newSelection.has(pageNum)) newSelection.delete(pageNum);
      else newSelection.add(pageNum);
    }

    setSelectedPages(newSelection);
    setLastClickedPage(pageNum);
  };

  const selectAllPages = () => {
    if (!activeSource) return;
    const all = new Set();
    for (let i = 1; i <= activeSource.totalPages; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearPageSelection = () => {
    setSelectedPages(new Set());
    setLastClickedPage(null);
  };

  const invertPageSelection = () => {
    if (!activeSource) return;
    const inverted = new Set();
    for (let i = 1; i <= activeSource.totalPages; i++) {
      if (!selectedPages.has(i)) inverted.add(i);
    }
    setSelectedPages(inverted);
  };

  // --- Chunk Creation Handlers ---
  const createChunkFromPageNumbers = async (pageNumsList, chunkCustomName = null) => {
    if (!activeSource || pageNumsList.length === 0) return;

    try {
      const subDoc = await PDFDocument.create();
      const zeroBasedIndices = pageNumsList.map(p => p - 1);
      const sourcePdf = await PDFDocument.load(activeSource.arrayBuffer.slice(0), { ignoreEncryption: true });
      const copiedPages = await subDoc.copyPages(sourcePdf, zeroBasedIndices);
      copiedPages.forEach(p => subDoc.addPage(p));

      // Apply watermark, signature and security settings to chunk
      await applyOverlaysAndSecurityToDoc(subDoc);

      const pdfBytes = await subDoc.save();
      const chunkCount = chunks.length + 1;
      const baseName = activeSource.name.replace(/\.[^/.]+$/, '');
      const defaultName = chunkCustomName || `${baseName}_Chunk_${chunkCount}.pdf`;

      const newChunk = {
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: defaultName,
        sourceName: activeSource.name,
        sourceId: activeSource.id,
        pageNumbers: pageNumsList,
        pdfBytes,
        pageCount: pageNumsList.length,
        estSize: pdfBytes.byteLength,
        checked: true,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChunks(prev => [...prev, newChunk]);
      return newChunk;
    } catch (err) {
      console.error('Failed to create chunk:', err);
      toast.error('Failed to extract chunk pages');
    }
  };

  const handleCreateCustomChunk = async () => {
    if (selectedPages.size === 0) {
      toast.error('Please select at least one page from the grid');
      return;
    }
    const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
    const pageRangeStr = sortedPages.length === 1 ? `Page_${sortedPages[0]}` : `Pages_${sortedPages[0]}-${sortedPages[sortedPages.length - 1]}`;
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');
    const chunkName = `${baseName}_${pageRangeStr}.pdf`;

    await createChunkFromPageNumbers(sortedPages, chunkName);
    setSelectedPages(new Set());
    setLastClickedPage(null);
    toast.success('New split chunk created!');
  };

  const handleSplitEveryPage = async () => {
    if (!activeSource) return;
    const toastId = toast.loading(`Splitting all ${activeSource.totalPages} pages into individual chunks...`);
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');

    for (let i = 1; i <= activeSource.totalPages; i++) {
      await createChunkFromPageNumbers([i], `${baseName}_Page_${i}.pdf`);
    }
    toast.success(`Created ${activeSource.totalPages} single-page chunks!`, { id: toastId });
  };

  const handleSplitEvenPages = async () => {
    if (!activeSource) return;
    const evens = [];
    for (let i = 2; i <= activeSource.totalPages; i += 2) evens.push(i);
    if (evens.length === 0) {
      toast.error('No even pages found in this document');
      return;
    }
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');
    await createChunkFromPageNumbers(evens, `${baseName}_Even_Pages.pdf`);
    toast.success(`Created Even Pages Chunk (${evens.length} pages)`);
  };

  const handleSplitOddPages = async () => {
    if (!activeSource) return;
    const odds = [];
    for (let i = 1; i <= activeSource.totalPages; i += 2) odds.push(i);
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');
    await createChunkFromPageNumbers(odds, `${baseName}_Odd_Pages.pdf`);
    toast.success(`Created Odd Pages Chunk (${odds.length} pages)`);
  };

  const handleSplitEveryN = async () => {
    if (!activeSource) return;
    const n = Math.max(1, parseInt(everyNValue) || 2);
    const toastId = toast.loading(`Splitting into ${n}-page chunks...`);
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');

    let count = 0;
    for (let i = 1; i <= activeSource.totalPages; i += n) {
      const pageGroup = [];
      for (let j = i; j < Math.min(i + n, activeSource.totalPages + 1); j++) pageGroup.push(j);
      count++;
      const name = `${baseName}_Part_${count}_Pages_${pageGroup[0]}-${pageGroup[pageGroup.length - 1]}.pdf`;
      await createChunkFromPageNumbers(pageGroup, name);
    }
    toast.success(`Created ${count} chunk(s) of ${n} page(s) each!`, { id: toastId });
  };

  const handleSplitByRange = async () => {
    if (!activeSource || !customRangeInput.trim()) return;
    const ranges = customRangeInput.split(',').map(r => r.trim()).filter(Boolean);
    const baseName = activeSource.name.replace(/\.[^/.]+$/, '');

    let createdCount = 0;
    for (const r of ranges) {
      const parts = r.split('-').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
      let pagesToExtract = [];
      if (parts.length === 1) pagesToExtract = [parts[0]];
      else if (parts.length === 2) {
        const start = Math.max(1, parts[0]);
        const end = Math.min(activeSource.totalPages, parts[1]);
        for (let p = start; p <= end; p++) pagesToExtract.push(p);
      }

      if (pagesToExtract.length > 0) {
        createdCount++;
        const name = `${baseName}_Range_${r.replace(/\s+/g, '')}.pdf`;
        await createChunkFromPageNumbers(pagesToExtract, name);
      }
    }

    if (createdCount > 0) toast.success(`Extracted ${createdCount} range chunk(s)!`);
    else toast.error('Invalid range format. Use e.g. 1-3, 5-8');
  };

  // --- Chunk List Operations ---
  const handleDragEndChunks = (result) => {
    if (!result.destination) return;
    const items = Array.from(chunks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChunks(items);
    toast.success('Workspace chunks reordered!');
  };

  const toggleChunkChecked = (chunkId) => {
    setChunks(prev => prev.map(c => c.id === chunkId ? { ...c, checked: !c.checked } : c));
  };

  const toggleAllChunksChecked = (checkedState) => {
    setChunks(prev => prev.map(c => ({ ...c, checked: checkedState })));
  };

  const deleteChunk = (chunkId) => {
    setChunks(prev => prev.filter(c => c.id !== chunkId));
    toast.success('Chunk deleted');
  };

  const duplicateChunk = (chunk) => {
    const newChunk = {
      ...chunk,
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: chunk.name.replace('.pdf', '_copy.pdf'),
      checked: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChunks(prev => [...prev, newChunk]);
    toast.success(`Duplicated ${chunk.name}`);
  };

  const moveChunkUp = (idx) => {
    if (idx === 0) return;
    const items = Array.from(chunks);
    const temp = items[idx];
    items[idx] = items[idx - 1];
    items[idx - 1] = temp;
    setChunks(items);
  };

  const moveChunkDown = (idx) => {
    if (idx === chunks.length - 1) return;
    const items = Array.from(chunks);
    const temp = items[idx];
    items[idx] = items[idx + 1];
    items[idx + 1] = temp;
    setChunks(items);
  };

  const saveRenameChunk = (chunkId) => {
    if (!editingChunkName.trim()) return;
    const cleanName = editingChunkName.endsWith('.pdf') ? editingChunkName : `${editingChunkName}.pdf`;
    setChunks(prev => prev.map(c => c.id === chunkId ? { ...c, name: cleanName } : c));
    setEditingChunkId(null);
    setEditingChunkName('');
    toast.success('Chunk renamed!');
  };

  const downloadChunkDirect = (chunk) => {
    const blob = new Blob([chunk.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = chunk.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePreviewChunk = async (chunk) => {
    try {
      const chunkPdf = await PDFDocument.load(chunk.pdfBytes.slice(0), { ignoreEncryption: true });
      await applyOverlaysAndSecurityToDoc(chunkPdf);
      const stampedBytes = await chunkPdf.save();

      const blob = new Blob([stampedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewModal({
        isOpen: true,
        title: chunk.name,
        blobUrl: url,
        totalPages: chunk.pageCount
      });
      setZoomLevel(100);
      setRotation(0);
    } catch (err) {
      console.warn('Fallback to raw chunk bytes for preview:', err);
      const blob = new Blob([chunk.pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewModal({
        isOpen: true,
        title: chunk.name,
        blobUrl: url,
        totalPages: chunk.pageCount
      });
      setZoomLevel(100);
      setRotation(0);
    }
  };

  const closePreviewModal = () => {
    if (previewModal.blobUrl) URL.revokeObjectURL(previewModal.blobUrl);
    setPreviewModal({ isOpen: false, title: '', blobUrl: null, totalPages: 1 });
  };

  const closeFinalMergeModal = () => {
    if (finalMergeModal.blobUrl) URL.revokeObjectURL(finalMergeModal.blobUrl);
    setFinalMergeModal({ isOpen: false, title: '', blobUrl: null, pdfBytes: null, pageCount: 0, estSize: 0 });
  };

  // --- Helper: Apply Watermark, Signature, and Password to PDFDocument (EVERY PAGE) ---
  const applyOverlaysAndSecurityToDoc = async (pdfDoc) => {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Apply Text Watermark on EVERY page
    if (watermarkText.trim()) {
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, 38);
        page.drawText(watermarkText, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: 38,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: Math.max(0.05, Math.min(0.9, watermarkOpacity)),
          rotate: degrees(45)
        });
      }
    }

    // 2. Apply Digital Signature Image on EVERY page
    if (signatureDataUrl) {
      try {
        const sigImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
        const sigImage = signatureDataUrl.startsWith('data:image/png') 
          ? await pdfDoc.embedPng(sigImageBytes) 
          : await pdfDoc.embedJpg(sigImageBytes);

        const sigWidth = 140;
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

        // Stamp signature on EVERY page of the PDF
        for (const page of pages) {
          const { width, height } = page.getSize();

          let posX = (width - sigWidth) * (stampCoords.xPct / 100);
          let posY = (height - sigHeight) * ((100 - stampCoords.yPct) / 100);

          if (signaturePosition === 'BOTTOM_LEFT') { posX = 40; posY = 40; }
          else if (signaturePosition === 'TOP_RIGHT') { posX = width - sigWidth - 40; posY = height - sigHeight - 40; }
          else if (signaturePosition === 'TOP_LEFT') { posX = 40; posY = height - sigHeight - 40; }
          else if (signaturePosition === 'CENTER') { posX = (width - sigWidth) / 2; posY = (height - sigHeight) / 2; }

          page.drawImage(sigImage, {
            x: Math.max(10, Math.min(width - sigWidth - 10, posX)),
            y: Math.max(10, Math.min(height - sigHeight - 10, posY)),
            width: sigWidth,
            height: sigHeight
          });
        }
      } catch (err) {
        console.warn('Failed to embed signature overlay:', err);
      }
    }

    // 3. Apply Password Encryption (if supported by client pdf-lib)
    if (enablePassword && userPassword.trim()) {
      if (typeof pdfDoc.encrypt === 'function') {
        try {
          pdfDoc.encrypt({
            userPassword: userPassword.trim(),
            ownerPassword: userPassword.trim(),
            permissions: { printing: 'highResolution', modifying: false }
          });
        } catch (encErr) {
          console.warn('Client encryption error:', encErr);
        }
      } else {
        console.warn('PDF encryption is not available in client pdf-lib build.');
      }
    }
  };

  // --- Export & Merge Actions ---

  // MERGE ALL LOADED SOURCES (Tab 1 Direct Merge)
  const handleMergeAllSources = async () => {
    if (sources.length === 0) {
      toast.error('No source documents loaded in Tab 1');
      return;
    }

    if (enablePassword && userPassword !== confirmPassword) {
      toast.error('Passwords do not match in Security settings');
      setLeftTab('security');
      return;
    }

    setIsMerging(true);
    const toastId = toast.loading(`Combining all ${sources.length} loaded source document(s)...`);

    try {
      const mergedDoc = await PDFDocument.create();

      for (const src of sources) {
        const srcPdf = await PDFDocument.load(src.arrayBuffer.slice(0), { ignoreEncryption: true });
        const indices = Array.from({ length: src.totalPages }, (_, i) => i);
        const copiedPages = await mergedDoc.copyPages(srcPdf, indices);
        copiedPages.forEach(p => mergedDoc.addPage(p));
      }

      // Apply signature, watermark & encryption
      await applyOverlaysAndSecurityToDoc(mergedDoc);

      const mergedBytes = await mergedDoc.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setFinalMergeModal({
        isOpen: true,
        title: `Merged_All_Sources_${Date.now()}.pdf`,
        blobUrl: url,
        pdfBytes: mergedBytes,
        pageCount: mergedDoc.getPageCount(),
        estSize: mergedBytes.byteLength
      });

      toast.success(`Combined all ${sources.length} loaded source document(s)!`, { id: toastId });
    } catch (err) {
      console.error('Merge all sources failed:', err);
      toast.error('Failed to merge source documents', { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  // MERGE SELECTED CHUNKS (Right Workspace Merge)
  const handleMergeSelectedChunks = async () => {
    const targetChunks = chunks.filter(c => c.checked);
    if (targetChunks.length === 0) {
      toast.error('No workspace chunks checked for merging');
      return;
    }

    if (enablePassword && userPassword !== confirmPassword) {
      toast.error('Passwords do not match in Security settings');
      setLeftTab('security');
      return;
    }

    setIsMerging(true);
    const toastId = toast.loading(`Combining ${targetChunks.length} checked workspace chunk(s)...`);

    try {
      const mergedDoc = await PDFDocument.create();

      for (const chunk of targetChunks) {
        const chunkPdf = await PDFDocument.load(chunk.pdfBytes, { ignoreEncryption: true });
        const indices = Array.from({ length: chunk.pageCount }, (_, i) => i);
        const copiedPages = await mergedDoc.copyPages(chunkPdf, indices);
        copiedPages.forEach(p => mergedDoc.addPage(p));
      }

      // Apply signature, watermark & encryption
      await applyOverlaysAndSecurityToDoc(mergedDoc);

      const mergedBytes = await mergedDoc.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setFinalMergeModal({
        isOpen: true,
        title: `Merged_Selected_Chunks_${Date.now()}.pdf`,
        blobUrl: url,
        pdfBytes: mergedBytes,
        pageCount: mergedDoc.getPageCount(),
        estSize: mergedBytes.byteLength
      });

      toast.success(`Combined ${targetChunks.length} checked chunk(s)!`, { id: toastId });
    } catch (err) {
      console.error('Merge selected chunks failed:', err);
      toast.error('Failed to merge selected chunks', { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownloadZip = async () => {
    if (chunks.length === 0) {
      toast.error('No chunks created yet');
      return;
    }
    setIsDownloadingZip(true);
    const toastId = toast.loading('Packaging split chunks into ZIP archive...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('VaultX_Split_Chunks');

      chunks.forEach((chunk, i) => {
        const safeName = `${i + 1}_${chunk.name}`;
        folder.file(safeName, chunk.pdfBytes);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VaultX_Split_Chunks.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('ZIP Package Downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create ZIP package', { id: toastId });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const downloadFinalMergedPdf = () => {
    if (!finalMergeModal.pdfBytes) return;
    const blob = new Blob([finalMergeModal.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalMergeModal.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Merged PDF Downloaded!');
  };

  // Metrics for Bottom Bar
  const checkedChunksCount = chunks.filter(c => c.checked).length;
  const totalPagesCount = chunks.reduce((acc, c) => acc + c.pageCount, 0);
  const totalEstSizeBytes = chunks.reduce((acc, c) => acc + c.estSize, 0);
  const totalEstSizeMb = (totalEstSizeBytes / 1024 / 1024).toFixed(2);

  const getFilteredPages = () => {
    if (!activeSource) return [];
    const pages = Array.from({ length: activeSource.totalPages }, (_, i) => i + 1);
    if (!searchPageQuery.trim()) return pages;
    return pages.filter(p => String(p).includes(searchPageQuery.trim()));
  };

  return (
    <div className="h-full flex flex-col space-y-4 w-full max-w-full overflow-x-hidden relative">

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
              <Scissors className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1 sm:mt-0" /> 
              <span className="leading-tight">Multi-Format PDF & Image Split-Merge Workspace</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Extract, chunk, re-order, preview, sign, watermark, encrypt, and combine pages across PDFs and Images.
            </p>
          </div>
        </div>

        {/* Upload & Cloud Picker Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">

          {sources.length > 0 && (
            <button
              type="button"
              onClick={() => { setSources([]); setChunks([]); setSelectedPages(new Set()); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Reset Workspace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* --- Main Two-Column Workspace --- */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-[560px]">

        {/* ── LEFT WORKSPACE WITH 4 MAIN SUB-TABS (7 cols) ── */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 flex flex-col shadow-sm min-w-0 overflow-hidden">

          {/* 4 Main Sub-Tabs Switcher Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-gray-100 p-1.5 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => setLeftTab('sources')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 truncate ${
                leftTab === 'sources' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 flex-shrink-0" />
              1. Sources ({sources.length})
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('splitter')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 truncate ${
                leftTab === 'splitter' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 flex-shrink-0" />
              2. Splitter
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('signature')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 truncate ${
                leftTab === 'signature' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 flex-shrink-0" />
              3. Sign & Stamp
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('security')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 truncate ${
                leftTab === 'security' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              4. Password
            </button>
          </div>

          {/* ── SUB-TAB 1: SOURCE DOCUMENTS & REORDERING (Preserved via CSS toggle) ── */}
          <div className={leftTab === 'sources' ? 'flex-1 flex flex-col space-y-4 min-w-0' : 'hidden'}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0 w-full sm:w-auto">
                <h4 className="font-bold text-gray-800 text-sm">Loaded Source Files</h4>
                <p className="text-xs text-gray-500 truncate">Drag cards or use <strong>↑ / ↓</strong> to set sequence.</p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add File
                  <input type="file" accept="application/pdf,image/*" multiple onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleOpenVaultModal}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-blue-200/60 shadow-xs"
                  title="Select document from Vault or 7-Day Temp Storage"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Vault & Temp
                </button>
              </div>
            </div>

            {/* Reorderable Sources List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[420px]">
              {sources.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Folder className="w-12 h-12 text-gray-300 mb-2" />
                  <h5 className="font-bold text-gray-700 text-sm">No source documents selected</h5>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 mb-4">
                    Upload PDF files or Images (JPG, PNG, WEBP) from your device or Vault storage to begin.
                  </p>
                  <div className="flex gap-2">
                    <label className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                      Upload Files
                      <input type="file" accept="application/pdf,image/*" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={handleOpenVaultModal} className="px-4 py-2 bg-white border border-gray-200 font-bold text-xs rounded-xl">
                      Vault Picker
                    </button>
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEndSources}>
                  <Droppable droppableId="sources-reorder-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {sources.map((src, idx) => (
                          <Draggable key={src.id} draggableId={String(src.id)} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
                                  snapshot.isDragging 
                                    ? 'bg-white border-blue-500 shadow-2xl scale-[1.02] z-50 ring-2 ring-blue-400/20'
                                    : activeSourceIndex === idx
                                      ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-2 ring-blue-400/10'
                                      : 'bg-white border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                  {/* Drag Handle */}
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="p-1 text-gray-400 hover:text-blue-600 cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  {/* Index Badge */}
                                  <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                    {idx + 1}
                                  </span>

                                  {/* Thumbnail / Icon */}
                                  <div className="w-12 h-14 bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center p-0.5 relative">
                                    {src.thumbnails?.[0] ? (
                                      <img src={src.thumbnails[0]} alt={src.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : src.type === 'image' ? (
                                      <ImageIcon className="w-6 h-6 text-blue-500" />
                                    ) : (
                                      <FileText className="w-6 h-6 text-red-500" />
                                    )}
                                    <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-extrabold px-1 rounded uppercase ${
                                      src.type === 'image' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                                    }`}>
                                      {src.type}
                                    </span>
                                  </div>

                                  {/* Document Meta Info */}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 truncate" title={src.name}>
                                      {src.name}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-1">
                                      <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                        {src.totalPages} Page(s)
                                      </span>
                                      <span className="flex-shrink-0">{(src.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Document Actions & Order Arrows */}
                                <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                  <div className="flex items-center gap-0.5 mr-1">
                                    <button
                                      type="button"
                                      onClick={() => moveSourceUp(idx)}
                                      disabled={idx === 0}
                                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveSourceDown(idx)}
                                      disabled={idx === sources.length - 1}
                                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSourceIndex(idx);
                                      setLeftTab('splitter');
                                    }}
                                    className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-all ${
                                      activeSourceIndex === idx
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <Scissors className="w-3.5 h-3.5" /> Extract Pages
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSource(src.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Remove source"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

          {/* ── SUB-TAB 2: PAGE EXTRACTOR & SPLITTER GRID (Preserved via CSS toggle) ── */}
          <div className={leftTab === 'splitter' ? 'flex-1 flex flex-col space-y-4' : 'hidden'}>

            {/* Target Document Switcher Ribbon */}
            {sources.length > 0 && (
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Target:</span>
                {sources.map((src, idx) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setActiveSourceIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 truncate max-w-[160px] ${
                      activeSourceIndex === idx
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {src.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="truncate">{src.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeSourceIndex === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {src.totalPages} p.
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeSource ? (
              <div className="flex-1 flex flex-col space-y-4">

                {/* Selection & View Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-all flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearPageSelection}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-all flex items-center gap-1"
                    >
                      <Square className="w-3.5 h-3.5 text-gray-400" /> Clear
                    </button>
                    <button
                      type="button"
                      onClick={invertPageSelection}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-all"
                    >
                      Invert
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Grid Size Toggle */}
                    <div className="flex items-center gap-1 bg-gray-200 p-0.5 rounded-lg text-[10px] font-bold">
                      <span className="text-gray-500 px-1">Grid Size:</span>
                      {['SM', 'MD', 'LG'].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setGridSize(sz)}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            gridSize === sz ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-gray-600'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>

                    {/* Search Page */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Page #"
                        value={searchPageQuery}
                        onChange={e => setSearchPageQuery(e.target.value)}
                        className="w-20 pl-7 pr-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Page Thumbnails Scrollable Grid with Live Overlays */}
                <div className="flex-1 bg-slate-50/60 border border-gray-200 rounded-2xl p-4 overflow-y-auto max-h-[300px]">
                  {isProcessingSource ? (
                    <div className="h-full flex flex-col items-center justify-center text-blue-600 py-12">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-xs font-semibold">Generating page thumbnails...</p>
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${
                      gridSize === 'SM' ? 'grid-cols-4 sm:grid-cols-6' :
                      gridSize === 'MD' ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {getFilteredPages().map(pageNum => {
                        const isSelected = selectedPages.has(pageNum);
                        const thumbnailSrc = activeSource.thumbnails?.[pageNum - 1];

                        return (
                          <div
                            key={pageNum}
                            onClick={(e) => handlePageClick(pageNum, e)}
                            className={`group relative rounded-2xl border-2 p-2 bg-white cursor-pointer select-none transition-all duration-200 flex flex-col items-center justify-between ${
                              isSelected 
                                ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-md bg-blue-50/30 scale-[1.02]' 
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            <div className="w-full flex items-center justify-between mb-1.5 px-1">
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                                isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                                {isSelected ? <Check className="w-3 h-3" /> : `p.${pageNum}`}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold group-hover:text-blue-600">
                                Page {pageNum}
                              </span>
                            </div>

                            <div className="w-full aspect-[3/4] bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                              {thumbnailSrc ? (
                                <img src={thumbnailSrc} alt={`Page ${pageNum}`} className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="p-3 text-center opacity-40">
                                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                  <div className="space-y-1">
                                    <div className="w-full h-1.5 bg-gray-300 rounded"></div>
                                    <div className="w-3/4 h-1.5 bg-gray-300 rounded"></div>
                                  </div>
                                </div>
                              )}

                              {/* Live Watermark Text Overlay on Thumbnail */}
                              {watermarkText && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                  <span className="text-[8px] font-bold text-gray-500/50 uppercase -rotate-45 whitespace-nowrap select-none">
                                    {watermarkText}
                                  </span>
                                </div>
                              )}

                              {/* Live Signature Stamp Overlay on Thumbnail */}
                              {signatureDataUrl && (
                                <div 
                                  style={{
                                    left: `${stampCoords.xPct}%`,
                                    top: `${stampCoords.yPct}%`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                  className="absolute pointer-events-none z-10"
                                >
                                  <img src={signatureDataUrl} alt="Sig Stamp" className="h-4 max-w-[36px] object-contain drop-shadow-sm opacity-90" />
                                </div>
                              )}

                              <div className={`absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100 bg-blue-600/15' : ''}`}>
                                <span className="bg-white/90 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                                  {isSelected ? 'Selected' : 'Click to Select'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Split Methods Selector Bar */}
                <div className="bg-white p-3 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between overflow-x-auto pb-1">
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'custom', name: 'Thumbnails', icon: LayoutGrid },
                        { id: 'every', name: 'Every Page', icon: Scissors },
                        { id: 'even', name: 'Even Pages', icon: Layers },
                        { id: 'odd', name: 'Odd Pages', icon: Layers },
                        { id: 'everyN', name: 'Every N', icon: FileText },
                        { id: 'range', name: 'Range', icon: SlidersHorizontal }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSplitMethod(m.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            splitMethod === m.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <m.icon className="w-3.5 h-3.5" />
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub-controls based on Split Method */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {splitMethod === 'custom' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-gray-700">
                          Selected Pages: <strong className="text-blue-600">{selectedPages.size}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleCreateCustomChunk}
                          disabled={selectedPages.size === 0}
                          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" /> Create Chunk +
                        </button>
                      </div>
                    )}

                    {splitMethod === 'every' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">Each page becomes a 1-page PDF chunk.</span>
                        <button
                          type="button"
                          onClick={handleSplitEveryPage}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Split All Pages
                        </button>
                      </div>
                    )}

                    {splitMethod === 'even' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">Extract Pages 2, 4, 6, 8... into 1 PDF.</span>
                        <button
                          type="button"
                          onClick={handleSplitEvenPages}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Extract Even Pages
                        </button>
                      </div>
                    )}

                    {splitMethod === 'odd' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">Extract Pages 1, 3, 5, 7... into 1 PDF.</span>
                        <button
                          type="button"
                          onClick={handleSplitOddPages}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Extract Odd Pages
                        </button>
                      </div>
                    )}

                    {splitMethod === 'everyN' && (
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">Split every</span>
                          <input
                            type="number"
                            min={1}
                            max={activeSource.totalPages}
                            value={everyNValue}
                            onChange={e => setEveryNValue(e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-center outline-none focus:border-blue-500"
                          />
                          <span className="text-xs font-semibold text-gray-700">pages</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSplitEveryN}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Generate N-Chunks
                        </button>
                      </div>
                    )}

                    {splitMethod === 'range' && (
                      <div className="flex items-center justify-between w-full gap-3">
                        <input
                          type="text"
                          placeholder="e.g. 1-3, 4-6, 8-10"
                          value={customRangeInput}
                          onChange={e => setCustomRangeInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleSplitByRange}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Extract Ranges
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <Upload className="w-10 h-10 text-gray-300 mb-2" />
                <h5 className="font-bold text-gray-700 text-sm">No Active Source Document</h5>
                <p className="text-xs text-gray-400 max-w-xs mt-1 mb-4">
                  Switch to <strong>Tab 1 (Source Documents)</strong> or click below to upload PDFs / Images.
                </p>
                <button
                  onClick={() => setLeftTab('sources')}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Go to Source Files Tab
                </button>
              </div>
            )}

          </div>

          {/* ── SUB-TAB 3: DIGITAL SIGNATURE, WATERMARK & INTERACTIVE PLACEMENT SHEET (Preserved via CSS toggle) ── */}
          <div className={leftTab === 'signature' ? 'flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto pr-1' : 'hidden'}>

            {/* Left Column: Signature & Watermark Controls (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4 shadow-xs">
                <div>
                  <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-600" /> Digital Signature & Watermark
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Draw your digital signature, upload a photo, or add custom watermark text to be stamped on all PDF pages.
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-gray-200/80 p-1 rounded-2xl text-xs font-bold">
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

                {/* Whiteboard Pad */}
                {signatureMode === 'draw' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                        DIGITAL WHITEBOARD PAD
                      </span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Pad
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
                        className="w-full h-28 cursor-crosshair touch-none"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-medium pointer-events-none">
                        Draw with mouse or finger
                      </span>
                    </div>
                  </div>
                )}

                {/* Image Upload Pad */}
                {signatureMode === 'upload' && (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-purple-500 mb-2" />
                      <span className="text-xs font-bold text-purple-800">Upload Signature Photo / Stamp</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Supports transparent PNG or JPEG files</span>
                      <input type="file" accept="image/png,image/jpeg" onChange={handleSignatureFileUpload} className="hidden" />
                    </label>
                    {signatureDataUrl && (
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
                        <img src={signatureDataUrl} alt="Signature Preview" className="h-9 max-w-[140px] object-contain" />
                        <button onClick={() => setSignatureDataUrl(null)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Watermark Controls */}
                {signatureMode === 'text' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Watermark Text:</label>
                      <input
                        type="text"
                        placeholder="e.g. CONFIDENTIAL / APPROVED - VAULTX"
                        value={watermarkText}
                        onChange={e => setWatermarkText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Opacity: {Math.round(watermarkOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={e => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Stamp Color:</label>
                        <input
                          type="color"
                          value={watermarkColor}
                          onChange={e => setWatermarkColor(e.target.value)}
                          className="w-full h-8 p-0.5 rounded-lg border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Position Presets */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                    QUICK POSITION PRESETS
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BOTTOM_RIGHT', label: 'Bottom Right (Sign)', x: 80, y: 80 },
                      { id: 'BOTTOM_LEFT', label: 'Bottom Left', x: 15, y: 80 },
                      { id: 'TOP_RIGHT', label: 'Top Right', x: 80, y: 15 },
                      { id: 'TOP_LEFT', label: 'Top Left', x: 15, y: 15 },
                      { id: 'CENTER', label: 'Center', x: 50, y: 50 },
                      { id: 'WATERMARK_DIAGONAL', label: 'Diagonal Watermark', x: 50, y: 50 }
                    ].map(pos => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => selectPositionPreset(pos.id, pos.x, pos.y)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-left truncate ${
                          signaturePosition === pos.id
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
            </div>

            {/* Right Column: Interactive Placement Sheet (5 cols) */}
            <div className="md:col-span-5 flex flex-col space-y-3">
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-purple-600" />
                    <h5 className="font-bold text-gray-900 text-xs">Interactive Placement Sheet</h5>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {stampCoords.xPct}% X, {stampCoords.yPct}% Y
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 mb-3">
                  Drag the signature stamp anywhere on the A4 page sheet below to set exact custom placement.
                </p>

                {/* Interactive A4 Page Sheet */}
                <div
                  ref={sheetRef}
                  onMouseMove={handleSheetMouseMove}
                  onMouseUp={handleSheetMouseUp}
                  onMouseLeave={handleSheetMouseUp}
                  className="relative w-full aspect-[1/1.3] bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm overflow-hidden select-none cursor-crosshair bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
                >
                  {/* Page Content Mock Lines */}
                  <div className="space-y-2 opacity-30 pointer-events-none">
                    <div className="w-1/3 h-3 bg-gray-400 rounded"></div>
                    <div className="w-full h-2 bg-gray-300 rounded"></div>
                    <div className="w-5/6 h-2 bg-gray-300 rounded"></div>
                    <div className="w-4/6 h-2 bg-gray-300 rounded"></div>
                  </div>

                  {/* Draggable Signature Stamp Box */}
                  <div
                    onMouseDown={handleStampMouseDown}
                    style={{
                      left: `${stampCoords.xPct}%`,
                      top: `${stampCoords.yPct}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={`absolute z-10 p-2 bg-purple-600 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing border-2 border-white transition-all ${
                      isDraggingStamp ? 'scale-110 shadow-2xl ring-4 ring-purple-400/30' : 'hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[9px] font-extrabold text-purple-200 uppercase tracking-wider">
                      <Move className="w-3 h-3" /> Drag Stamp
                    </div>

                    {signatureDataUrl ? (
                      <img 
                        src={signatureDataUrl} 
                        alt="Sig Stamp" 
                        className="h-10 max-w-[130px] object-contain bg-white/90 p-1 rounded-lg shadow-xs pointer-events-none" 
                      />
                    ) : watermarkText ? (
                      <span className="text-xs font-bold text-white uppercase tracking-wider block max-w-[120px] truncate pointer-events-none">
                        {watermarkText}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-white pointer-events-none">
                        ✍️ Signature Stamp
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-4 space-y-1 opacity-20 pointer-events-none">
                    <div className="w-32 h-2 bg-gray-400 rounded"></div>
                    <div className="w-24 h-2 bg-gray-400 rounded"></div>
                  </div>
                </div>

                {/* Position Status Banner */}
                <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center gap-2 text-purple-900 text-xs font-semibold">
                  <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>
                    Stamp position saved as: <strong className="font-mono text-purple-800">{signaturePosition}</strong>
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* ── SUB-TAB 4: PASSWORD PROTECTION & ENCRYPTION (Preserved via CSS toggle) ── */}
          <div className={leftTab === 'security' ? 'flex-1 flex flex-col space-y-4' : 'hidden'}>

            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Password Protection & Encryption</h4>
                    <p className="text-xs text-gray-500">Lock exported merged PDFs with 256-bit AES encryption.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={e => setEnablePassword(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {enablePassword && (
                <div className="space-y-3 pt-3 border-t border-gray-200 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Document Open Password:</label>
                    <div className="relative">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        placeholder="Enter strong password..."
                        value={userPassword}
                        onChange={e => setUserPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Confirm Password:</label>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      placeholder="Re-enter password..."
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </div>

                  {userPassword && confirmPassword && userPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">⚠️ Passwords do not match</p>
                  )}
                  {userPassword && confirmPassword && userPassword === confirmPassword && (
                    <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Passwords match! PDF will be encrypted on merge.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-2">
              <h5 className="font-bold text-blue-900 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> VaultX Encryption Standard
              </h5>
              <p className="text-xs text-blue-800 leading-relaxed">
                When Password Protection is enabled, PDF readers (Adobe Acrobat, Apple Preview, Google Chrome) will require the password before displaying document contents.
              </p>
            </div>

          </div>

        </div>

        {/* ── RIGHT WORKSPACE: Generated Split Chunks Panel & Reordering (5 cols) ── */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 flex flex-col shadow-sm min-w-0 overflow-hidden">

          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Split Documents Workspace
              </h4>
              <p className="text-[11px] text-gray-500 truncate">Drag to reorder PDF and Image chunks for custom merge sequence.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {chunks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChunks([])}
                  className="text-xs text-red-500 hover:text-red-600 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                {chunks.length} Chunks
              </span>
            </div>
          </div>

          {/* Bulk Check All Control Bar */}
          {chunks.length > 0 && (
            <div className="flex items-center justify-between bg-white px-3 py-2 border border-gray-200 rounded-xl mb-3 text-xs font-semibold text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chunks.every(c => c.checked)}
                  onChange={e => toggleAllChunksChecked(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                />
                <span>Check All ({chunks.length})</span>
              </label>

              <button
                type="button"
                onClick={() => setChunks([])}
                className="text-red-500 hover:underline text-[11px] font-bold"
              >
                Clear Workspace
              </button>
            </div>
          )}

          {/* Scrollable Chunks Drag and Drop List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            {chunks.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-200 rounded-2xl bg-white/60">
                <Scissors className="w-10 h-10 text-emerald-400 mb-2 opacity-50" />
                <p className="font-bold text-gray-700 text-sm">No split documents created yet.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Select pages from the left grid or choose a split method, then click <strong>Create Chunk +</strong>.
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEndChunks}>
                <Droppable droppableId="split-chunks-workspace-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2.5">
                      {chunks.map((chunk, idx) => (
                        <Draggable key={chunk.id} draggableId={String(chunk.id)} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white border rounded-2xl p-3 shadow-xs transition-all flex flex-col gap-2 ${
                                snapshot.isDragging ? 'shadow-2xl border-emerald-500 ring-2 ring-emerald-400/20 scale-[1.02] z-50' : 'border-gray-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="p-1 text-gray-400 hover:text-emerald-600 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <input
                                  type="checkbox"
                                  checked={chunk.checked}
                                  onChange={() => toggleChunkChecked(chunk.id)}
                                  className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                                />

                                <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>

                                {editingChunkId === chunk.id ? (
                                  <div className="flex-1 flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingChunkName}
                                      onChange={e => setEditingChunkName(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && saveRenameChunk(chunk.id)}
                                      className="w-full px-2 py-1 text-xs border border-emerald-500 rounded-lg outline-none"
                                      autoFocus
                                    />
                                    <button onClick={() => saveRenameChunk(chunk.id)} className="p-1 text-emerald-600">
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex-1 min-w-0 flex items-center gap-1.5 group">
                                    <p className="text-xs font-bold text-gray-800 truncate" title={chunk.name}>
                                      {chunk.name}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingChunkId(chunk.id); setEditingChunkName(chunk.name); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-emerald-600 transition-opacity"
                                      title="Rename chunk"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                <span className="font-semibold text-gray-700 truncate max-w-[140px]" title={chunk.sourceName}>
                                  From: {chunk.sourceName}
                                </span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {chunk.pageCount} p. ({chunk.pageNumbers.join(', ')})
                                </span>
                                <span>{(chunk.estSize / 1024).toFixed(1)} KB</span>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewChunk(chunk)}
                                    className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                    title="Preview Chunk PDF"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => duplicateChunk(chunk)}
                                    className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                    title="Duplicate Chunk"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadChunkDirect(chunk)}
                                    className="p-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-lg transition-colors"
                                    title="Download PDF Chunk"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveChunkUp(idx)}
                                    disabled={idx === 0}
                                    className="p-1 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveChunkDown(idx)}
                                    disabled={idx === chunks.length - 1}
                                    className="p-1 bg-gray-50 text-gray-500 hover:text-emerald-600 rounded disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteChunk(chunk.id)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded ml-1 transition-colors"
                                    title="Delete Chunk"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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

      {/* Spacer for mobile fixed footer */}
      <div className="h-28 md:hidden flex-shrink-0" />

      {/* --- Bottom Sticky Summary & Action Bar --- */}
      <div className="fixed md:static bottom-0 left-0 right-0 z-20 bg-slate-900 text-white rounded-t-3xl md:rounded-3xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t md:border border-slate-800">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-300">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>PDF/Image Sources: <strong className="text-white">{sources.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-emerald-400" />
            <span>Chunks: <strong className="text-white">{chunks.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>Checked: <strong className="text-white">{checkedChunksCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Pages: <strong className="text-white">{totalPagesCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Est. Size: <strong className="text-white">{totalEstSizeMb} MB</strong></span>
          </div>
        </div>

        {/* Global Output Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={chunks.length === 0 || isDownloadingZip}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
            Download ZIP
          </button>

          {/* Merge Selected Chunks Button */}
          <button
            type="button"
            onClick={handleMergeSelectedChunks}
            disabled={checkedChunksCount === 0 || isMerging}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-40"
            title="Merges checked chunks from the workspace panel"
          >
            {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Merge Selected ({checkedChunksCount})
          </button>

          {/* Merge All Sources Button */}
          <button
            type="button"
            onClick={handleMergeAllSources}
            disabled={sources.length === 0 || isMerging}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-40"
            title="Merges all loaded source PDFs and Images with applied signatures, watermarks & encryption"
          >
            {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Merge All Sources ({sources.length})
          </button>
        </div>
      </div>

      {/* --- PREVIEW CHUNK PDF MODAL --- */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm text-purple-300 flex items-center gap-2 truncate max-w-md">
                <Eye className="w-4 h-4 text-purple-400" /> Inspected Chunk: {previewModal.title}
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))} className="p-1 hover:text-purple-400">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-1">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))} className="p-1 hover:text-purple-400">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-1 hover:text-purple-400 ml-1 border-l border-slate-700 pl-1.5">
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <button onClick={closePreviewModal} className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-950 p-4 flex items-center justify-center overflow-auto relative">
              <div 
                style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`, transition: 'transform 0.2s ease-out' }}
                className="w-full h-full flex items-center justify-center"
              >
                <iframe src={previewModal.blobUrl} title="Chunk Preview" className="w-full h-full border-none rounded-2xl bg-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL MERGED PDF PREVIEW MODAL --- */}
      {finalMergeModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    ✨ Final Merged PDF Preview
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {finalMergeModal.pageCount} Pages • {(finalMergeModal.estSize / 1024 / 1024).toFixed(2)} MB
                    {watermarkText && ' • Watermarked'}
                    {signatureDataUrl && ' • Signed'}
                    {enablePassword && ' • Encrypted'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!finalMergeModal.pdfBytes) return;
                    const toastId = toast.loading('Saving to 7-day temporary storage...');
                    try {
                      await tempStorageService.saveFile(finalMergeModal.pdfBytes, 'VaultX_Split_Merged.pdf', 'application/pdf');
                      toast.success('Saved to Temporary Storage! Auto-deletes in 7 days.', { id: toastId });
                    } catch (err) {
                      toast.error('Failed to save to temporary storage', { id: toastId });
                    }
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  title="Save to 7-Day Temporary Storage (Auto-deletes after 7 days)"
                >
                  <Clock className="w-4 h-4" /> Temp Storage (7D)
                </button>

                <button
                  type="button"
                  onClick={downloadFinalMergedPdf}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Merged PDF
                </button>

                <button 
                  type="button"
                  onClick={closeFinalMergeModal}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live PDF Viewer Iframe */}
            <div className="flex-1 bg-gray-950 p-4 flex items-center justify-center overflow-auto relative">
              <iframe 
                src={finalMergeModal.blobUrl} 
                title="Final Merged PDF Preview" 
                className="w-full h-full border-none rounded-2xl bg-white shadow-2xl" 
              />
            </div>
          </div>
        </div>
      )}

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
