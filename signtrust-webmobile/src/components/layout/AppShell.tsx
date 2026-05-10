import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import ErrorBoundary from '../ui/ErrorBoundary';

export default function AppShell() {
  return (
    <div className="mobile-shell flex flex-col bg-white">
      <main className="flex-1 pb-2">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
