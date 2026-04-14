export interface Plan {
  id: string;
  name: string;
  price: number; // FCFA/mois, 0 = gratuit
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
    description: 'Pour tester la plateforme',
    color: '#1E3A5F',
    features: ['5 enveloppes/mois', '1 utilisateur', 'Signature électronique simple (SES)', 'Support email'],
    envelopesPerMonth: 5,
    maxUsers: 1,
    signatureLevel: 'SES',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4900,
    description: 'Pour les professionnels',
    color: '#C87B2E',
    features: ['30 enveloppes/mois', '3 utilisateurs', 'Signature avancée (AES)', 'Support prioritaire', 'Modèles personnalisés'],
    envelopesPerMonth: 30,
    maxUsers: 3,
    signatureLevel: 'AES',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 24900,
    description: 'Pour les entreprises',
    color: '#177A4B',
    features: ['150 enveloppes/mois', '10 utilisateurs', 'Signature qualifiée (QES)', 'API REST', 'Support dédié', 'Audit avancé'],
    envelopesPerMonth: 150,
    maxUsers: 10,
    signatureLevel: 'QES',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    description: 'Sur mesure',
    color: '#6C5CE7',
    features: ['Enveloppes illimitées', 'Utilisateurs illimités', 'QES + API + HSM dédié', 'SLA garanti', 'Déploiement privé'],
    envelopesPerMonth: -1,
    maxUsers: -1,
    signatureLevel: 'QES+',
    contactOnly: true,
  },
];
