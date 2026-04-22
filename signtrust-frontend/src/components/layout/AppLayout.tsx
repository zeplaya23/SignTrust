import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Copy,
  Users,
  UserCog,
  BarChart3,
  ScrollText,
  Settings,
  Bell,
  LogOut,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import Logo from '../ui/Logo';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSubscription } from '../../hooks/useSubscription';

// roles: undefined = visible to all, otherwise array of allowed roles
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/envelopes', label: 'Enveloppes', icon: FolderOpen },
  { to: '/templates', label: 'Modeles', icon: Copy },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/team', label: 'Equipe', icon: UserCog, roles: ['admin', 'manager'] },
  { to: '/analytics', label: 'Statistiques', icon: BarChart3, roles: ['admin'] },
  { to: '/activity', label: 'Activite', icon: ScrollText, roles: ['admin', 'manager'] },
] as const;

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? '';
  const l = lastName?.charAt(0)?.toUpperCase() ?? '';
  return f + l || '?';
}

function getPlanColors(status: string) {
  switch (status) {
    case 'ACTIVE': return { color: 'text-accent', bg: 'bg-accent' };
    case 'TRIAL': return { color: 'text-warning', bg: 'bg-warning' }; // Découverte = essai 14j
    default: return { color: 'text-txt-secondary', bg: 'bg-txt-secondary' };
  }
}

export default function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { info: subInfo } = useSubscription();
  const planColors = getPlanColors(subInfo.status);
  const usagePercent = subInfo.max > 0 ? Math.min(100, Math.round((subInfo.used / subInfo.max) * 100)) : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      <aside className="w-[250px] shrink-0 bg-white border-r border-border flex flex-col h-screen">

        {/* ── Logo + New button ── */}
        <div className="px-4 pt-5 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" />
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-1.5 rounded-lg hover:bg-bg transition-colors"
            >
              <Bell size={18} className="text-txt-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>
          </div>
          <button
            onClick={() => navigate('/envelopes/new')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={18} />
            Nouvelle enveloppe
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-2 flex flex-col gap-0.5">
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-txt-muted">Menu</p>
          {navItems.filter((item) => !('roles' in item && item.roles) || (item.roles as readonly string[]).includes(user?.role ?? '')).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/envelopes'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors shrink-0',
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-txt-secondary hover:bg-bg'
                )
              }
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Abonnement compact ── */}
        <div className="px-4 shrink-0">
          <div
            onClick={() => navigate('/settings')}
            className="rounded-xl bg-bg px-3 py-3 cursor-pointer hover:bg-border/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={13} className={planColors.color} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-txt-secondary">
                  Plan {subInfo.planName}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-txt">
                {subInfo.used}/{subInfo.max}
              </span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', planColors.bg)}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="px-5 py-2 shrink-0">
          <div className="border-t border-border" />
        </div>

        {/* ── Bottom links ── */}
        <div className="px-3 shrink-0 flex flex-col gap-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors',
                isActive ? 'bg-primary-light text-primary font-semibold' : 'text-txt-secondary hover:bg-bg'
              )
            }
          >
            <Settings size={17} />
            <span>Parametres</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-danger hover:bg-danger-light transition-colors w-full text-left"
          >
            <LogOut size={17} />
            <span>Deconnexion</span>
          </button>
        </div>

        {/* ── User card ── */}
        <div className="px-3 py-3 shrink-0">
          <div className="rounded-xl border border-border bg-bg/50 overflow-hidden">
            {/* Account type header */}
            <div className={clsx(
              'px-3 py-1.5 text-center',
              (user?.accountType === 'entreprise' || user?.accountType === 'enterprise')
                ? 'bg-primary/10'
                : 'bg-accent/10'
            )}>
              <span className={clsx(
                'text-[10px] font-bold uppercase tracking-wider',
                (user?.accountType === 'entreprise' || user?.accountType === 'enterprise')
                  ? 'text-primary'
                  : 'text-accent'
              )}>
                {(user?.accountType === 'entreprise' || user?.accountType === 'enterprise') ? 'Compte Entreprise' : 'Compte Particulier'}
              </span>
            </div>
            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                {user?.companyName && (
                  <p className="text-[12px] font-bold text-primary truncate">{user.companyName}</p>
                )}
                <p className="text-[12px] font-semibold text-txt truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-txt-muted truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary-light text-primary">
                  {user?.role === 'admin' ? 'Administrateur' : user?.role === 'manager' ? 'Manager' : 'Membre'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
