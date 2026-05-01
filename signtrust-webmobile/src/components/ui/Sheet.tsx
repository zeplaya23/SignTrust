import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40 animate-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col safe-bottom">
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="block w-10 h-1.5 rounded-full bg-line" />
        </div>
        {title && (
          <div className="px-5 pb-3 border-b border-line-soft">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
