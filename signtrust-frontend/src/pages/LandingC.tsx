import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Layers,
  Shield,
  Zap,
  Code,
  Users,
  ArrowRight,
  Lock,
  Globe,
  BadgeCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Hourglass,
  Banknote,
  Smartphone,
  Timer,
  Coins,
  Gift,
  Quote,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PlanCard from '../components/subscription/PlanCard';
import Logo from '../components/ui/Logo';
import { PLANS, type Plan } from '../config/plans';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

const beforeAfter = {
  before: [
    { icon: Printer, text: 'Imprimer chaque document' },
    { icon: Hourglass, text: 'Attendre des jours pour les signatures' },
    { icon: Banknote, text: 'Frais de courrier et déplacement' },
    { icon: XCircle, text: 'Risque de perte ou falsification' },
  ],
  after: [
    { icon: Smartphone, text: 'Signez depuis n\'importe quel appareil' },
    { icon: Timer, text: 'Signature en moins de 5 secondes' },
    { icon: Coins, text: 'Économisez jusqu\'à 80% des coûts' },
    { icon: Shield, text: 'Sécurité et traçabilité totales' },
  ],
};

const features = [
  { icon: FileCheck, title: 'Signature légale', desc: 'Conformes aux normes eIDAS et UEMOA.' },
  { icon: Layers, title: 'Multi-documents', desc: 'Plusieurs documents dans une enveloppe.' },
  { icon: Shield, title: 'Sécurité avancée', desc: 'Chiffrement de bout en bout.' },
  { icon: Zap, title: 'Ultra rapide', desc: 'Signez en moins de 5 secondes.' },
  { icon: Code, title: 'API REST', desc: 'Intégration dans vos applications.' },
  { icon: Users, title: 'Multi-utilisateurs', desc: 'Gestion d\'équipe et droits d\'accès.' },
];

export default function LandingC() {
  const navigate = useNavigate();
  const storePlan = useSubscriptionStore((s) => s.selectPlan);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);

  const handlePickPlan = (plan: Plan) => {
    if (plan.contactOnly) return;
    setPickedPlan(plan);
  };

  const handleSubscribe = () => {
    if (!pickedPlan) return;
    storePlan(pickedPlan);
    navigate('/subscribe/register');
  };

  const trialPlan = PLANS.find(p => p.id === 'discovery');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero compact + CTA inline */}
      <section className="bg-white pt-12 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-light rounded-full px-4 py-1.5 mb-5">
            <Gift size={14} className="text-accent" />
            <span className="text-accent text-sm font-semibold">14 jours d'essai gratuit</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-dark leading-tight">
            Arrêtez d'imprimer<br />pour signer
          </h1>
          <p className="mt-4 text-lg text-txt-secondary max-w-xl mx-auto">
            Passez à la signature électronique légale avec DigiSign Parapheur.
          </p>
          <div className="mt-8 max-w-md mx-auto">
            <button
              onClick={() => { if (trialPlan) handlePickPlan(trialPlan); }}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all cursor-pointer text-base"
            >
              Démarrer l'essai gratuit
              <ArrowRight size={18} />
            </button>
            <p className="mt-2 text-xs text-txt-muted">Sans engagement — aucune carte bancaire requise</p>
          </div>
        </div>
      </section>

      {/* Plans immédiatement */}
      <section id="pricing" className="bg-bg py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-dark text-center mb-2">Choisissez votre plan</h2>
          <p className="text-center text-txt-secondary text-sm mb-8">Commencez gratuitement, évoluez à votre rythme.</p>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {PLANS.map((plan) => (
                <div key={plan.id} className="w-56 shrink-0">
                  <PlanCard plan={plan} selected={pickedPlan?.id === plan.id} onSelect={handlePickPlan} highlighted={plan.id === 'discovery'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-12">Pourquoi passer au digital ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avant */}
            <div className="rounded-2xl border-2 border-danger/20 bg-danger-light p-6">
              <h3 className="font-bold text-danger text-lg mb-5 flex items-center gap-2">
                <XCircle size={20} />
                Sans DigiSign
              </h3>
              <div className="space-y-4">
                {beforeAfter.before.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-danger" />
                    </div>
                    <span className="text-sm text-txt">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Après */}
            <div className="rounded-2xl border-2 border-success/20 bg-success-light p-6">
              <h3 className="font-bold text-success text-lg mb-5 flex items-center gap-2">
                <CheckCircle2 size={20} />
                Avec DigiSign
              </h3>
              <div className="space-y-4">
                {beforeAfter.after.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-success" />
                    </div>
                    <span className="text-sm text-txt">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="features" className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10">Tout ce qu'il vous faut</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-txt">{title}</h3>
                <p className="mt-1 text-sm text-txt-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres bandeau */}
      <section className="bg-primary py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 'Illimité', label: 'Documents', icon: FileCheck },
            { value: '99,9%', label: 'Disponibilité', icon: Clock },
            { value: '<5s', label: 'Signature', icon: Zap },
            { value: 'eIDAS', label: 'Certifié', icon: BadgeCheck },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <Icon size={22} className="text-white/60 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-white/60 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sécurité */}
      <section id="security" className="bg-white py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: Lock, text: 'AES-256' },
              { icon: Globe, text: 'UEMOA & eIDAS' },
              { icon: BadgeCheck, text: 'Certificats qualifiés' },
              { icon: CheckCircle2, text: 'Horodatage certifié' },
              { icon: Shield, text: 'Piste d\'audit' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-4 py-2 bg-bg rounded-full border border-border">
                <Icon size={16} className="text-primary" />
                <span className="text-sm font-medium text-txt">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignage unique */}
      <section className="bg-bg py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Quote size={32} className="text-primary/20 mx-auto mb-4" />
          <p className="text-lg text-txt leading-relaxed italic">
            « DigiSign Parapheur a réduit notre temps de signature de contrats de 5 jours à 5 minutes. L'essai gratuit nous a convaincus en une journée. »
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary">A</div>
            <div className="text-left">
              <div className="text-sm font-bold text-dark">Aminata K.</div>
              <div className="text-xs text-txt-secondary">Directrice Générale, Cabinet juridique</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-accent py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Prêt à passer au digital ?</h2>
          <p className="text-white/80 mb-6">Rejoignez les entreprises qui ont déjà transformé leur gestion documentaire.</p>
          <button
            onClick={() => { if (trialPlan) handlePickPlan(trialPlan); }}
            className="inline-flex items-center gap-2 bg-white text-accent font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-all cursor-pointer"
          >
            Commencer gratuitement
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" variant="light" />
          <p className="text-sm text-white/50">&copy; 2026 Cryptoneo — Côte d'Ivoire</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">CGV</a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>

      {/* Barre sticky */}
      {pickedPlan && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-txt-secondary">Plan sélectionné :</span>
              <span className="font-bold text-dark">{pickedPlan.name}</span>
              <span className="font-semibold text-accent">
                {pickedPlan.price > 0 ? `${pickedPlan.price.toLocaleString('fr-FR')} FCFA/mois` : pickedPlan.id === 'discovery' ? 'Gratuit 14 jours' : ''}
              </span>
            </div>
            <button onClick={handleSubscribe} className="inline-flex items-center gap-2 rounded-xl font-semibold bg-accent text-white hover:bg-accent/90 px-6 py-2.5 text-sm transition-all cursor-pointer">
              Souscrire <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
