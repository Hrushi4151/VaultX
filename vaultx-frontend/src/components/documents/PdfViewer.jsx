import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Using unpkg for worker to avoid Vite specific configuration issues with pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl, displayName }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-gray-900 rounded-lg sm:rounded-2xl overflow-hidden relative group">
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 sm:gap-4 text-white shadow-lg opacity-90 hover:opacity-100 transition-opacity scale-90 sm:scale-100">
        
        {/* Pagination */}
        <div className="flex items-center gap-1">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => p - 1)}
            className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-xs sm:text-sm font-medium w-12 sm:w-16 text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button 
            disabled={pageNumber >= (numPages || 1)}
            onClick={() => setPageNumber(p => p + 1)}
            className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        <div className="w-px h-5 bg-white/20" />
        
        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.25, s - 0.25))} className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <ZoomOut className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <ZoomIn className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-white/20" />

        <button onClick={() => { setScale(1); setPageNumber(1); }} className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Reset">
          <Maximize className="w-4 h-4 sm:w-4 sm:h-4" />
        </button>

      </div>

      {/* Document */}
      <div className="flex-1 w-full h-full overflow-auto flex justify-center bg-gray-900 p-2 sm:p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center text-white/70 h-full w-full absolute inset-0">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mb-3 text-primary" />
              <p className="text-sm font-medium">Loading PDF document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center text-red-400 h-full w-full absolute inset-0 bg-gray-900">
              <p className="font-semibold">Failed to load PDF.</p>
              <p className="text-xs mt-1 text-gray-500 text-center px-4">The file may be corrupted or your browser is blocking it.</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl bg-white"
            loading={
              <div className="flex items-center justify-center h-96 w-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
