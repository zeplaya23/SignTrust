import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Receipt, AlertTriangle, CheckCheck, FileText, Users } from 'lucide-react';
import Button from '../components/ui/Button';

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

interface MockNotification {
  id: number;
  type: 'signature' | 'payment' | 'renewal' | 'team' | 'document';
  title: string;
  message: string;
  read: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
}

const mockNotifications: MockNotification[] = [
  { id: 1, type: 'signature', title: 'Signature requise', message: 'Vous avez 3 documents en attente de signature pour le contrat commercial.', read: false, relatedEntityType: 'envelope', relatedEntityId: 101, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, type: 'payment', title: 'Paiement confirmé', message: 'Votre paiement de 15 000 FCFA pour le plan Professionnel a été reçu.', read: false, relatedEntityType: 'subscription', relatedEntityId: 1, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, type: 'document', title: 'Document signé', message: 'Le NDA avec Traoré Ibrahim a été signé par toutes les parties (2 documents).', read: false, relatedEntityType: 'envelope', relatedEntityId: 102, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, type: 'renewal', title: 'Renouvellement proche', message: 'Votre abonnement expire dans 5 jours. Pensez à le renouveler.', read: false, relatedEntityType: 'subscription', relatedEntityId: 1, createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: 5, type: 'team', title: 'Nouveau membre', message: 'Fatou Coulibaly a rejoint votre équipe en tant que Membre.', read: true, relatedEntityType: 'team', relatedEntityId: 4, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 6, type: 'signature', title: 'Rappel de signature', message: 'Koné Mariam n\'a pas encore signé l\'avenant de contrat (1 document restant).', read: true, relatedEntityType: 'envelope', relatedEntityId: 103, createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: 7, type: 'payment', title: 'Échec de paiement', message: 'Le paiement automatique de votre abonnement a échoué. Mettez à jour votre moyen de paiement.', read: true, relatedEntityType: 'subscription', relatedEntityId: 1, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 8, type: 'document', title: 'Enveloppe expirée', message: 'L\'enveloppe "PV Assemblée Générale" contenant 4 documents a expiré sans signatures complètes.', read: true, relatedEntityType: 'envelope', relatedEntityId: 104, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 9, type: 'team', title: 'Rôle modifié', message: 'Le rôle de Marc Bamba a été changé de Membre à Manager.', read: true, relatedEntityType: 'team', relatedEntityId: 5, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 10, type: 'renewal', title: 'Quota atteint à 90%', message: 'Vous avez utilisé 180/200 enveloppes ce mois. Pensez à surclasser votre plan.', read: true, relatedEntityType: 'subscription', relatedEntityId: 1, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const iconMap: Record<string, { icon: typeof Bell; bg: string; text: string }> = {
  signature: { icon: Bell, bg: 'bg-primary-light', text: 'text-primary' },
  payment: { icon: Receipt, bg: 'bg-success-light', text: 'text-success' },
  renewal: { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning' },
  team: { icon: Users, bg: 'bg-accent-light', text: 'text-accent' },
  document: { icon: FileText, bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7]' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: MockNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
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

      {/* Notification list */}
      <div className="space-y-3 max-w-3xl">
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
    </div>
  );
}
