import { useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface PositionedField {
  signatoryIndex: number;
  pageIndex: number;
  relX: number;
  relY: number;
  relW: number;
  relH: number;
}

interface DraftSignatory {
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  imageFiles: File[];
  pdfFile: File | null;
  signatories: DraftSignatory[];
  onBack: () => void;
  onConfirm: (fields: PositionedField[]) => void;
  busy?: boolean;
}

const SIG_COLORS = [
  { bg: 'rgba(0,131,191,0.18)', border: '#0083BF', text: '#0083BF' },
  { bg: 'rgba(78,144,31,0.18)', border: '#4E901F', text: '#3E7318' },
  { bg: 'rgba(108,92,231,0.18)', border: '#6C5CE7', text: '#6C5CE7' },
  { bg: 'rgba(184,134,11,0.18)', border: '#B8860B', text: '#B8860B' },
  { bg: 'rgba(192,57,43,0.18)', border: '#C0392B', text: '#C0392B' },
  { bg: 'rgba(23,122,75,0.18)', border: '#177A4B', text: '#177A4B' },
];

const DEFAULT_W_REL = 0.32;
const DEFAULT_H_REL = 0.07;
const MIN_W_REL = 0.12;
const MIN_H_REL = 0.04;
const MAX_W_REL = 0.85;
const MAX_H_REL = 0.25;

type DragMode = 'move' | 'resize';

interface DragState {
  el: HTMLElement;
  signatoryIndex: number;
  pageIndex: number;
  mode: DragMode;
  startX: number;
  startY: number;
  startRelX: number;
  startRelY: number;
  startRelW: number;
  startRelH: number;
  pageRect: DOMRect;
  curRelX: number;
  curRelY: number;
  curRelW: number;
  curRelH: number;
  pointerId: number;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function PositionFields({
  imageFiles,
  pdfFile,
  signatories,
  onBack,
  onConfirm,
  busy,
}: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [pagesReady, setPagesReady] = useState(false);
  const [activeSigIdx, setActiveSigIdx] = useState(0);
  const [fields, setFields] = useState<PositionedField[]>([]);
  const dragRef = useRef<DragState | null>(null);

  // Génère les images des pages
  useEffect(() => {
    let cancelled = false;
    setPages([]);
    setPagesReady(false);

    (async () => {
      try {
        if (pdfFile) {
          const ab = await pdfFile.arrayBuffer();
          if (cancelled) return;
          const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
          if (cancelled) { pdf.destroy(); return; }
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const out: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            if (cancelled) { pdf.destroy(); return; }
            const page = await pdf.getPage(i);
            const baseVp = page.getViewport({ scale: 1 });
            const targetWidth = 600;
            const scale = targetWidth / baseVp.width;
            const vp = page.getViewport({ scale: scale * dpr });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(vp.width);
            canvas.height = Math.floor(vp.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
            out.push(canvas.toDataURL('image/jpeg', 0.85));
            setPages([...out]);
          }
          pdf.destroy();
        } else {
          const out: string[] = [];
          for (const f of imageFiles) {
            const url = URL.createObjectURL(f);
            out.push(url);
            setPages([...out]);
          }
        }
        if (!cancelled) setPagesReady(true);
      } catch {
        if (!cancelled) setPagesReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [imageFiles, pdfFile]);

  /** Sélectionne un signataire et pose sa signature s'il n'en a pas encore. */
  const selectAndPlace = (sigIdx: number) => {
    setActiveSigIdx(sigIdx);
    const hasField = fields.some((f) => f.signatoryIndex === sigIdx);
    if (hasField) {
      // déjà placée — juste scroller jusqu'à la 1re position
      const first = fields.find((f) => f.signatoryIndex === sigIdx);
      if (first) {
        const pageEl = document.querySelector(`[data-page-index="${first.pageIndex}"]`);
        pageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // sinon, pose un champ par défaut sur la page 1
    const offsetCount = fields.length;
    const baseY = 0.6 + Math.min(offsetCount * 0.07, 0.25);
    const newField: PositionedField = {
      signatoryIndex: sigIdx,
      pageIndex: 0,
      relX: 0.5 - DEFAULT_W_REL / 2,
      relY: baseY,
      relW: DEFAULT_W_REL,
      relH: DEFAULT_H_REL,
    };
    setFields((prev) => [...prev, newField]);
    setTimeout(() => {
      const pageEl = document.querySelector(`[data-page-index="0"]`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const removeField = (sigIdx: number, pageIdx: number) => {
    setFields((prev) => prev.filter((f) => !(f.signatoryIndex === sigIdx && f.pageIndex === pageIdx)));
  };

  /** Démarre un drag/resize en stockant tout dans une ref (pas de setState pendant le drag). */
  const startDrag = (
    f: PositionedField,
    mode: DragMode,
    e: React.PointerEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSigIdx(f.signatoryIndex);
    const el = (e.currentTarget as HTMLElement).closest('[data-field-box]') as HTMLElement | null;
    const pageEl = el?.closest('[data-page-container]') as HTMLElement | null;
    if (!el || !pageEl) return;
    el.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      el,
      signatoryIndex: f.signatoryIndex,
      pageIndex: f.pageIndex,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRelX: f.relX,
      startRelY: f.relY,
      startRelW: f.relW,
      startRelH: f.relH,
      pageRect: pageEl.getBoundingClientRect(),
      curRelX: f.relX,
      curRelY: f.relY,
      curRelW: f.relW,
      curRelH: f.relH,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    e.preventDefault();
    const dx = (e.clientX - d.startX) / d.pageRect.width;
    const dy = (e.clientY - d.startY) / d.pageRect.height;
    if (d.mode === 'move') {
      const newX = clamp(d.startRelX + dx, 0, 1 - d.startRelW);
      const newY = clamp(d.startRelY + dy, 0, 1 - d.startRelH);
      d.curRelX = newX;
      d.curRelY = newY;
      d.el.style.left = `${newX * 100}%`;
      d.el.style.top = `${newY * 100}%`;
    } else {
      let newW = clamp(d.startRelW + dx, MIN_W_REL, MAX_W_REL);
      let newH = clamp(d.startRelH + dy, MIN_H_REL, MAX_H_REL);
      newW = Math.min(newW, 1 - d.startRelX);
      newH = Math.min(newH, 1 - d.startRelY);
      d.curRelW = newW;
      d.curRelH = newH;
      d.el.style.width = `${newW * 100}%`;
      d.el.style.height = `${newH * 100}%`;
    }
  };

  const finishDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    // commit dans le state React
    setFields((prev) =>
      prev.map((f) => {
        if (f.signatoryIndex !== d.signatoryIndex || f.pageIndex !== d.pageIndex) return f;
        return {
          ...f,
          relX: d.curRelX,
          relY: d.curRelY,
          relW: d.curRelW,
          relH: d.curRelH,
        };
      }),
    );
    dragRef.current = null;
  };

  const placedSet = new Set(fields.map((f) => f.signatoryIndex));
  const placedCount = fields.length;

  return (
    <div
      className="bg-canvas min-h-[100dvh] pb-28"
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <header className="safe-top px-2 h-14 bg-white border-b border-line-soft flex items-center gap-1 shrink-0 sticky top-0 z-30">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-soft active:bg-line-soft"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="flex-1 text-[15px] font-bold text-ink truncate">Positionner les signatures</p>
      </header>

      {/* Chips signataires (un seul bouton de pose : la chip elle-même) */}
      <div className="px-4 pt-3 pb-3 sticky top-14 z-20 bg-canvas border-b border-line-soft">
        <p className="text-[13px] text-muted mb-2">
          Touchez le nom d'un signataire pour poser sa signature, puis glissez-la pour ajuster.
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {signatories.map((s, i) => {
            const color = SIG_COLORS[i % SIG_COLORS.length];
            const placed = placedSet.has(i);
            const active = i === activeSigIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAndPlace(i)}
                className={`shrink-0 px-3.5 h-11 rounded-full inline-flex items-center gap-2 text-[14px] font-semibold border-2 transition-all ${
                  active ? 'shadow-sm' : 'opacity-80'
                }`}
                style={{
                  background: active ? color.bg : '#fff',
                  borderColor: color.border,
                  color: color.text,
                }}
              >
                <span
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: color.border }}
                >
                  {s.firstName[0]}{s.lastName[0]}
                </span>
                <span>{s.firstName} {s.lastName[0]}.</span>
                {placed ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5 9-9" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold opacity-70">+ poser</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3 pb-4 pt-3">
        {!pagesReady && pages.length === 0 && (
          <div className="bg-white rounded-xl py-12 flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full border-2 border-line border-t-primary animate-spin" />
            <p className="text-[13px] text-muted">Chargement des pages…</p>
          </div>
        )}

        {pages.map((src, pageIdx) => {
          const pageFields = fields.filter((f) => f.pageIndex === pageIdx);
          return (
            <div key={pageIdx} className="relative">
              <div
                data-page-container
                data-page-index={pageIdx}
                className="relative w-full bg-white rounded-xl overflow-hidden shadow-sm select-none"
                style={{ touchAction: dragRef.current ? 'none' : 'auto' }}
              >
                <img
                  src={src}
                  alt={`Page ${pageIdx + 1}`}
                  className="block w-full h-auto pointer-events-none"
                  draggable={false}
                />
                {pageFields.map((f) => {
                  const color = SIG_COLORS[f.signatoryIndex % SIG_COLORS.length];
                  const sig = signatories[f.signatoryIndex];
                  const isActive = f.signatoryIndex === activeSigIdx;
                  return (
                    <div
                      key={`${f.signatoryIndex}-${f.pageIndex}`}
                      data-field-box
                      className={`absolute rounded-md flex items-center justify-center text-[12px] font-bold border-2 ${isActive ? 'shadow-md z-10' : 'z-0'}`}
                      style={{
                        left: `${f.relX * 100}%`,
                        top: `${f.relY * 100}%`,
                        width: `${f.relW * 100}%`,
                        height: `${f.relH * 100}%`,
                        background: color.bg,
                        borderColor: color.border,
                        color: color.text,
                        cursor: 'move',
                        touchAction: 'none',
                        userSelect: 'none',
                      }}
                      onPointerDown={(e) => startDrag(f, 'move', e)}
                    >
                      <span className="px-2 truncate pointer-events-none">{sig.firstName} {sig.lastName[0]}.</span>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeField(f.signatoryIndex, f.pageIndex); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-danger text-white text-[12px] font-bold inline-flex items-center justify-center shadow-md"
                        aria-label="Supprimer ce champ"
                        style={{ touchAction: 'manipulation' }}
                      >
                        ✕
                      </button>

                      <div
                        className="absolute -right-1 -bottom-1 w-9 h-9 inline-flex items-center justify-center cursor-se-resize"
                        style={{ touchAction: 'none' }}
                        onPointerDown={(e) => startDrag(f, 'resize', e)}
                      >
                        <span
                          className="w-5 h-5 rounded-br-md border-r-[4px] border-b-[4px] bg-white/60"
                          style={{ borderColor: color.border }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-faint text-center mt-1">Page {pageIdx + 1}</p>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line-soft px-4 pt-3 pb-3 safe-bottom">
        <button
          type="button"
          onClick={() => onConfirm(fields)}
          disabled={busy}
          className="w-full h-14 rounded-xl bg-accent text-white font-bold text-[15px] disabled:opacity-50 active:translate-y-px transition-transform inline-flex items-center justify-center gap-2 shadow-md shadow-accent/30"
        >
          {busy ? 'Envoi…' : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Envoyer pour signature
            </>
          )}
        </button>
        <p className="text-[11px] text-muted text-center mt-2">
          {placedCount === 0
            ? 'Aucune signature posée — positions par défaut au moment de la signature'
            : `${placedCount} signature${placedCount > 1 ? 's' : ''} positionnée${placedCount > 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}
