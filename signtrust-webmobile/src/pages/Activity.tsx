import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import TopBar from '../components/layout/TopBar';
import StatusBadge from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

export default function Activity() {
  const { data } = useQuery({ queryKey: ['activity'], queryFn: () => dashboardService.getRecent() });

  return (
    <div className="flex flex-col">
      <TopBar title="Activité" />
      <div className="px-5 pt-4 flex flex-col gap-2">
        {(data ?? []).map((env) => (
          <Link
            key={env.id}
            to={`/envelopes/${env.id}`}
            className="bg-white rounded-2xl p-4 border border-line-soft active:bg-line-soft"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink truncate">{env.name}</p>
              <StatusBadge status={env.status} />
            </div>
            <p className="text-xs text-muted mt-1">{new Date(env.createdAt).toLocaleString('fr-FR')}</p>
          </Link>
        ))}
        {!data?.length && <p className="text-center text-muted text-sm py-12">Aucune activité récente.</p>}
      </div>
    </div>
  );
}
