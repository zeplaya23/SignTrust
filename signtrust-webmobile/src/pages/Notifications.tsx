import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import TopBar from '../components/layout/TopBar';

export default function Notifications() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationService.getAll() });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="flex flex-col">
      <TopBar
        title="Notifications"
        back
        right={
          <button onClick={() => markAll.mutate()} className="text-sm text-primary font-medium">Tout lire</button>
        }
      />
      <div className="px-5 pt-4 flex flex-col gap-2">
        {(data ?? []).map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read && markRead.mutate(n.id)}
            className={`text-left bg-white rounded-2xl p-4 border ${n.read ? 'border-line-soft' : 'border-primary/30 bg-primary-light/30'}`}
          >
            <div className="flex items-start gap-3">
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{n.title}</p>
                <p className="text-sm text-muted mt-0.5">{n.message}</p>
                <p className="text-xs text-faint mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </button>
        ))}
        {!data?.length && <p className="text-center text-muted text-sm py-12">Aucune notification.</p>}
      </div>
    </div>
  );
}
