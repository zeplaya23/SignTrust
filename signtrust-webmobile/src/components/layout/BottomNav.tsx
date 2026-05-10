import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const items = [
  {
    to: '/home',
    label: 'Accueil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    to: '/envelopes/new',
    label: 'Nouveau',
    plus: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16M4 12h16" />
      </svg>
    ),
  },
  {
    to: '/envelopes',
    label: 'Enveloppes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-white safe-bottom border-t border-line">
      <div className="grid grid-cols-4 h-14 items-center">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/home'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5 h-full',
                it.plus
                  ? 'text-white'
                  : isActive
                    ? 'text-primary'
                    : 'text-faint',
              )
            }
          >
            {it.plus ? (
              <>
                <span className="-mt-5 w-11 h-11 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center">
                  {it.icon}
                </span>
                <span className="text-[9px] text-muted font-semibold mt-0.5">{it.label}</span>
              </>
            ) : (
              <>
                {it.icon}
                <span className="text-[9px] font-semibold">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
