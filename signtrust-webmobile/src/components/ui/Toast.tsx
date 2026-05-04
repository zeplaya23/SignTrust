import { useEffect, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

type ToastKind = 'success' | 'error' | 'info';

interface ToastEvent {
  kind: ToastKind;
  message: string;
  id: number;
}

let listeners: Array<(t: ToastEvent) => void> = [];
let counter = 0;

export function toast(message: string, kind: ToastKind = 'info') {
  const ev: ToastEvent = { id: ++counter, kind, message };
  listeners.forEach((l) => l(ev));
}

const ICONS: Record<ToastKind, ReactNode> = {
  success: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  ),
  error: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
    </svg>
  ),
};

export default function ToastHost() {
  const [items, setItems] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const handler = (t: ToastEvent) => {
      setItems((prev) => [...prev, t]);
      const duration = t.kind === 'error' ? 6000 : 3500;
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, duration);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  if (!items.length) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none safe-top">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
          className={clsx(
            'pointer-events-auto rounded-2xl shadow-2xl text-left max-w-[440px] w-full overflow-hidden transition-all',
            'flex items-start gap-3 pl-4 pr-2 py-3.5',
            'animate-in fade-in slide-in-from-top-2',
            t.kind === 'success' && 'bg-accent text-white',
            t.kind === 'error' && 'bg-danger text-white ring-2 ring-danger/30',
            t.kind === 'info' && 'bg-ink text-white',
          )}
        >
          <span className="shrink-0 mt-px">{ICONS[t.kind]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-wider leading-none mb-1 opacity-80">
              {t.kind === 'success' ? 'Succès' : t.kind === 'error' ? 'Erreur' : 'Information'}
            </p>
            <p className="text-[14px] font-medium leading-snug whitespace-pre-wrap break-words">
              {t.message}
            </p>
          </div>
          <span className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full opacity-70 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}
