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
  /** clic sur une miniature (généralement pour ouvrir le visualiseur plein écran) */
  onClick?: (pageNumber: number) => void;
}

/**
 * Strip de miniatures de TOUTES les pages d'un PDF, défilable horizontalement.
 * Chaque page rendue via PDF.js sur un canvas offscreen → image JPEG.
 */
export default function PdfThumbnail({ envelopeId, docId, onClick }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setPages([]);
    setStatus('loading');

    (async () => {
      try {
        const blob = await envelopeService.getDocumentBlob(envelopeId, docId);
        const ab = await blob.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        if (cancelled) { pdf.destroy(); return; }

        const targetWidth = 240; // largeur cible d'une miniature (px)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const out: string[] = [];

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
          if (!ctx) throw new Error('canvas');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) { pdf.destroy(); return; }

          out.push(canvas.toDataURL('image/jpeg', 0.85));
          // Update progressivement pour que l'utilisateur voie les pages apparaître au fur et à mesure
          setPages([...out]);
        }

        pdf.destroy();
        if (cancelled) return;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [envelopeId, docId]);

  // Pendant le chargement avec déjà des pages : on affiche les pages déjà rendues
  if (status === 'loading' && pages.length === 0) {
    return (
      <div className="w-full h-[220px] bg-[#F0F0F0] rounded-xl flex flex-col items-center justify-center gap-2">
        <span className="w-7 h-7 rounded-full border-2 border-line border-t-primary animate-spin" />
        <span className="text-[10px] text-muted">Chargement…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => onClick?.(1)}
        className="w-full h-[220px] bg-[#F0F0F0] rounded-xl flex items-center justify-center"
      >
        <div className="w-[70%] h-[80%] bg-white rounded shadow-sm flex flex-col items-center justify-center gap-1.5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-faint">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="text-[10px] text-muted">Aperçu indisponible</span>
          <span className="text-[10px] text-primary font-semibold">Toucher pour ouvrir</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-[#F0F0F0] rounded-xl py-3 px-2">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {pages.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onClick?.(i + 1)}
            className="relative shrink-0 snap-start active:opacity-90"
          >
            <img
              src={src}
              alt={`Page ${i + 1}`}
              className="h-[180px] w-auto rounded-md shadow-md bg-white"
            />
            <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-[11px] font-bold inline-flex items-center justify-center backdrop-blur-sm">
              {i + 1}
            </span>
          </button>
        ))}
        {status === 'loading' && (
          <div className="shrink-0 h-[180px] aspect-[3/4] bg-white/50 rounded-md flex items-center justify-center">
            <span className="w-5 h-5 rounded-full border-2 border-line border-t-primary animate-spin" />
          </div>
        )}
      </div>
      {pages.length > 1 && (
        <p className="text-[10px] text-center text-muted mt-2">
          {pages.length} page{pages.length > 1 ? 's' : ''} · faites défiler horizontalement
        </p>
      )}
    </div>
  );
}
