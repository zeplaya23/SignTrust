import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className, ...rest }: Props) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-soft mb-1.5">{label}</span>}
      <input
        {...rest}
        className={clsx(
          'w-full h-12 px-4 rounded-xl bg-white border text-base outline-none transition-colors',
          error
            ? 'border-danger focus:border-danger'
            : 'border-line focus:border-primary',
          className,
        )}
      />
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
      {!error && hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}
