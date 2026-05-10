import { useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { envelopeService } from '../../services/envelopeService';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props {
  envelopeId: number;
  docId: number;
  docName: string;
  onClose: () => void;
  /** Autorise le téléchargement (seulement quand le document est signé). */
  canDownload?: boolean;
}

/**
 * Aperçu PDF mobile : on télécharge le PDF, on le rend page par page sur un canvas
 * offscreen via PDF.js, et React affiche les images JPEG résultantes.
 *
 * Cette approche évite le composant <Page> de react-pdf qui plante silencieusement
 * sur certains PDF (jsPDF v4 PDF v1.3) — ici on pilote PDF.js directement.
 */
export default function PdfPreview({ envelopeId, docId, docName, onClose, canDownload = false }: Props) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'rendered' | 'error'>('loading');
  const [errorDetail, setErrorDetail] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPageImages([]);
    setErrorDetail('');

    (async () => {
      try {
        const blob = await envelopeService.getDocumentBlob(envelopeId, docId);
        const ab = await blob.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(ab) });
        const pdf = await loadingTask.promise;
        if (cancelled) { pdf.destroy(); return; }

        const targetWidth = Math.min(window.innerWidth - 16, 480);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const images: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) { pdf.destroy(); return; }
          const page = await pdf.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D non disponible');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) { pdf.destroy(); return; }

          images.push(canvas.toDataURL('image/jpeg', 0.85));
        }

        pdf.destroy();
        if (!cancelled) {
          setPageImages(images);
          setStatus('rendered');
        }
      } catch (err) {
        if (cancelled) return;
        setErrorDetail(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    })();

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
    };
  }, [envelopeId, docId]);

  const download = async () => {
    try { await envelopeService.downloadDocument(envelopeId, docId, docName); } catch { /* noop */ }
  };

  return (
    <div className="fixed inset-0 z-[55] bg-canvas flex flex-col">
      <header className="safe-top px-2 h-14 bg-white border-b border-line-soft flex items-center gap-1 shrink-0">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-soft active:bg-line-soft"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="flex-1 text-[14px] font-semibold text-ink truncate">{docName}</p>
        {canDownload ? (
          <button
            onClick={download}
            aria-label="Télécharger"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-primary active:bg-primary-light"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v12" />
              <path d="M6 10l6 6 6-6" />
              <path d="M5 20h14" />
            </svg>
          </button>
        ) : (
          <span className="w-10 h-10" aria-hidden />
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center gap-3">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 mt-12">
            <span className="w-8 h-8 rounded-full border-2 border-line border-t-primary animate-spin" />
            <p className="text-sm text-muted">Chargement…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 px-6 text-center mt-12 max-w-xs">
            <span className="w-14 h-14 rounded-full bg-danger-light text-danger inline-flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6M12 16v.5" />
              </svg>
            </span>
            <p className="text-ink font-semibold">Aperçu impossible</p>
            <p className="text-[12px] text-muted break-words">{errorDetail || 'Le navigateur n\'a pas pu lire ce document.'}</p>
            {canDownload && (
              <button
                onClick={download}
                className="h-12 px-5 rounded-2xl bg-primary text-white font-semibold inline-flex items-center gap-2 mt-2"
              >
                Télécharger
              </button>
            )}
          </div>
        )}

        {status === 'rendered' && pageImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Page ${i + 1}`}
            className="block bg-white shadow-sm rounded-lg max-w-full h-auto"
            style={{ width: 'min(100%, 480px)' }}
          />
        ))}
      </div>

      {status === 'rendered' && pageImages.length > 0 && (
        <footer className="safe-bottom h-9 bg-white border-t border-line-soft flex items-center justify-center text-[11px] text-muted shrink-0">
          {pageImages.length} page{pageImages.length > 1 ? 's' : ''}
        </footer>
      )}
    </div>
  );
}
