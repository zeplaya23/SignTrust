import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  back?: boolean;
  right?: ReactNode;
}

export default function TopBar({ title, back, right }: Props) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line-soft safe-top">
      <div className="h-14 px-4 flex items-center gap-3">
        {back ? (
          <button
            onClick={() => nav(-1)}
            aria-label="Retour"
            className="-ml-2 w-10 h-10 inline-flex items-center justify-center rounded-full active:bg-line-soft"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="flex-1 text-base font-semibold text-ink truncate">{title}</h1>
        {right}
      </div>
    </header>
  );
}
