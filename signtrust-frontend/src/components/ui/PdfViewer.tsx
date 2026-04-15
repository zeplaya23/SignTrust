import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
  className?: string;
}

export default function PdfViewer({ url, className = '' }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset state when URL changes — keyed on url via onLoadSuccess/onLoadError
  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setLoading(false);
    setError(false);
  }, []);

  const onLoadError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-sm text-txt-muted">Impossible de charger le PDF</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-txt-secondary min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-sm text-txt-secondary min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2.5, s + 0.25))}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto flex justify-center bg-bg/50 p-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading=""
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
