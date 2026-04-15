import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Receipt, AlertTriangle, CheckCheck, FileText, Users, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { notificationService, type AppNotification } from '../services/notificationService';

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return date.toLocaleDateString('fr-FR');
}

const iconMap: Record<string, { icon: typeof Bell; bg: string; text: string }> = {
  signature: { icon: Bell, bg: 'bg-primary-light', text: 'text-primary' },
  payment: { icon: Receipt, bg: 'bg-success-light', text: 'text-success' },
  renewal: { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning' },
  team: { icon: Users, bg: 'bg-accent-light', text: 'text-accent' },
  document: { icon: FileText, bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7]' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {
      setError('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silently fail
    }
  };

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch {
        // Silently fail
      }
    }
    if (notif.relatedEntityType === 'envelope') {
      navigate(`/envelopes/${notif.relatedEntityId}`);
    } else if (notif.relatedEntityType === 'subscription') {
      navigate('/settings');
    } else if (notif.relatedEntityType === 'team') {
      navigate('/team');
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" icon={CheckCheck} onClick={markAllRead}>
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={32} className="text-danger" />
          <p className="text-sm text-txt-secondary">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>Réessayer</Button>
        </div>
      )}

      {/* Notification list */}
      {!loading && !error && (
        <div className="space-y-3 max-w-3xl">
          {notifications.length === 0 && (
            <p className="text-sm text-txt-muted text-center py-12">Aucune notification.</p>
          )}
          {notifications.map((notif) => {
            const config = iconMap[notif.type] || iconMap.signature;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`
                  flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm
                  ${notif.read
                    ? 'bg-white border-border'
                    : 'bg-primary-light border-l-4 border-primary/25 border-t-border border-r-border border-b-border'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={config.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? 'font-medium text-txt' : 'font-bold text-txt'}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-txt-secondary mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                <span className="text-xs text-txt-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                  {relativeTime(notif.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
