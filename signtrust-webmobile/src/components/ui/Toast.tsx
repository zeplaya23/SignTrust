import { useEffect, useState } from 'react';
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

export default function ToastHost() {
  const [items, setItems] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const handler = (t: ToastEvent) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);

  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm w-full',
            t.kind === 'success' && 'bg-accent text-white',
            t.kind === 'error' && 'bg-danger text-white',
            t.kind === 'info' && 'bg-ink text-white',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
