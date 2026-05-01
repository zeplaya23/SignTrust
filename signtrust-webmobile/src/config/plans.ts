export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  color: string;
  features: string[];
  envelopesPerMonth: number;
  maxUsers: number;
  signatureLevel: string;
  popular?: boolean;
  contactOnly?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'discovery',
    name: 'Découverte',
    price: 0,
    description: '14 jours d\'essai gratuit',
    color: '#0083BF',
    features: ['5 enveloppes / mois', '1 utilisateur', 'Signature simple (SES)', 'Support email'],
    envelopesPerMonth: 5,
    maxUsers: 1,
    signatureLevel: 'SES',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4900,
    description: 'Pour indépendants & TPE',
    color: '#4E901F',
    features: ['30 enveloppes / mois', '3 utilisateurs', 'Signature avancée (AES)', 'Modèles & contacts', 'Rappels auto'],
    envelopesPerMonth: 30,
    maxUsers: 3,
    signatureLevel: 'AES',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 24900,
    description: 'Pour les PME et équipes',
    color: '#0083BF',
    features: ['200 enveloppes / mois', '15 utilisateurs', 'Signature qualifiée (QES)', 'Audit complet', 'Support dédié'],
    envelopesPerMonth: 200,
    maxUsers: 15,
    signatureLevel: 'QES',
  },
  {
    id: 'integration',
    name: 'API',
    price: 49900,
    description: 'Intégrez la signature',
    color: '#E67E22',
    features: ['500 enveloppes API', 'Webhooks temps réel', 'SDK & sandbox', 'eIDAS QES', 'SLA 99,9%'],
    envelopesPerMonth: 500,
    maxUsers: -1,
    signatureLevel: 'QES',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    description: 'Solution sur mesure',
    color: '#6C5CE7',
    features: ['Illimité', 'On-premise & HSM', 'SLA garanti', 'Interlocuteur dédié'],
    envelopesPerMonth: -1,
    maxUsers: -1,
    signatureLevel: 'QES+',
    contactOnly: true,
  },
];
