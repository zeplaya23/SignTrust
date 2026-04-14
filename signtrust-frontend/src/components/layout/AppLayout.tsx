import Logo from '../ui/Logo';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-[230px] bg-white border-r border-border p-6 flex flex-col gap-6">
        <Logo size="sm" />
        <p className="text-sm text-txt-muted">Dashboard coming soon</p>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
