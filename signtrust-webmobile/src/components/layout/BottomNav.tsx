import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const items = [
  {
    to: '/home',
    label: 'Accueil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12L12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    to: '/envelopes',
    label: 'Enveloppes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    ),
  },
  {
    to: '/envelopes/new',
    label: 'Nouvelle',
    plus: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    to: '/activity',
    label: 'Activité',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-white safe-bottom">
      <div className="grid grid-cols-5 h-16 items-center border-t border-line-soft px-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5 h-full transition-colors',
                it.plus
                  ? 'text-white'
                  : isActive
                    ? 'text-primary'
                    : 'text-faint active:text-ink-soft',
              )
            }
          >
            {it.plus ? (
              <span className="-mt-7 w-14 h-14 rounded-2xl bg-primary text-white shadow-md shadow-primary/30 flex items-center justify-center">
                {it.icon}
              </span>
            ) : (
              <>
                {it.icon}
                <span className="text-[10px] font-semibold">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
