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
    description: 'Testez gratuitement pendant 14 jours',
    color: '#0083BF',
    features: [
      '14 jours d\'essai gratuit',
      '5 enveloppes/mois',
      '1 utilisateur',
      'Signature simple (SES)',
      'Modèles de base',
      'Support par email',
      'Stockage 100 Mo',
    ],
    envelopesPerMonth: 5,
    maxUsers: 1,
    signatureLevel: 'SES',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4900,
    description: 'Idéal pour les indépendants et TPE',
    color: '#4E901F',
    features: [
      '30 enveloppes/mois',
      '3 utilisateurs',
      'Signature avancée (AES)',
      'Modèles personnalisés',
      'Carnet de contacts',
      'Rappels automatiques',
      'Support prioritaire',
      'Stockage 1 Go',
    ],
    envelopesPerMonth: 30,
    maxUsers: 3,
    signatureLevel: 'AES',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 24900,
    description: 'Pour les PME et équipes structurées',
    color: '#0083BF',
    features: [
      '200 enveloppes/mois',
      '15 utilisateurs',
      'Signature qualifiée (QES)',
      'Gestion d\'équipe & rôles',
      'Tableau de bord & statistiques',
      'Piste d\'audit complète',
      'Support dédié & téléphone',
      'Stockage 10 Go',
      'Marque blanche (logo)',
    ],
    envelopesPerMonth: 200,
    maxUsers: 15,
    signatureLevel: 'QES',
  },
  {
    id: 'integration',
    name: 'Intégration API',
    price: 49900,
    description: 'Intégrez la signature dans vos applications',
    color: '#E67E22',
    features: [
      '500 enveloppes/mois via API',
      'API REST complète (SES, AES, QES)',
      'Webhooks temps réel',
      'SDK & documentation technique',
      'Environnement sandbox',
      'Certificats qualifiés eIDAS',
      'Horodatage certifié',
      'Support technique dédié',
      'SLA 99,9%',
      'Stockage 50 Go',
    ],
    envelopesPerMonth: 500,
    maxUsers: -1,
    signatureLevel: 'QES',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    description: 'Solution sur mesure pour les grands comptes',
    color: '#6C5CE7',
    features: [
      'Enveloppes illimitées',
      'Utilisateurs illimités',
      'API + HSM dédié',
      'Déploiement privé (on-premise)',
      'SLA garanti & infogérance',
      'Intégration SI sur mesure',
      'Formation & accompagnement',
      'Interlocuteur dédié',
    ],
    envelopesPerMonth: -1,
    maxUsers: -1,
    signatureLevel: 'QES+',
    contactOnly: true,
  },
];
