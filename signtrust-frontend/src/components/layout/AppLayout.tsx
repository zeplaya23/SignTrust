import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Copy,
  Users,
  UserCog,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';
import Logo from '../ui/Logo';
import { useAuthStore } from '../../stores/useAuthStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/envelopes', label: 'Enveloppes', icon: FolderOpen },
  { to: '/envelopes/new', label: 'Nouvelle enveloppe', icon: PlusCircle, accent: true },
  { to: '/templates', label: 'Modèles', icon: Copy },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/team', label: 'Équipe', icon: UserCog },
];

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? '';
  const l = lastName?.charAt(0)?.toUpperCase() ?? '';
  return f + l || '?';
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-border flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Logo size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/envelopes'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-txt-secondary hover:bg-bg',
                  item.accent && !isActive && 'text-accent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={clsx(
                      item.accent && !isActive ? 'text-accent' : isActive ? 'text-primary' : ''
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 mt-auto flex flex-col gap-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                isActive
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-txt-secondary hover:bg-bg'
              )
            }
          >
            <Settings size={18} />
            <span>Paramètres</span>
          </NavLink>

          {/* User profile card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-bg/50">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-txt truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent-light px-1.5 py-0.5 rounded">
                {subscriptionStatus === 'ACTIVE'
                  ? 'Pro'
                  : subscriptionStatus === 'TRIAL'
                    ? 'Essai'
                    : 'Gratuit'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
