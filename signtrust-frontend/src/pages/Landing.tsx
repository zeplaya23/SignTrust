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
  Gift,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PlanCard from '../components/subscription/PlanCard';
import Logo from '../components/ui/Logo';
import { PLANS, type Plan } from '../config/plans';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

const features = [
  {
    icon: FileCheck,
    title: 'Signature légale',
    desc: 'Conformes aux normes eIDAS et UEMOA.',
  },
  {
    icon: Layers,
    title: 'Multi-documents',
    desc: 'Plusieurs documents dans une enveloppe.',
  },
  {
    icon: Shield,
    title: 'Sécurité avancée',
    desc: 'Chiffrement de bout en bout.',
  },
  {
    icon: Zap,
    title: 'Ultra rapide',
    desc: 'Signez en moins de 5 secondes.',
  },
  {
    icon: Code,
    title: 'API REST',
    desc: 'Intégration dans vos applications.',
  },
  {
    icon: Users,
    title: 'Multi-utilisateurs',
    desc: 'Gestion d\'équipe et droits d\'accès.',
  },
];

const trustItems = [
  { icon: Lock, text: 'Chiffrement AES-256' },
  { icon: Globe, text: 'Conforme UEMOA & eIDAS' },
  { icon: BadgeCheck, text: 'Certificats qualifiés' },
  { icon: CheckCircle2, text: 'Horodatage certifié' },
];

export default function Landing() {
  const navigate = useNavigate();
  const storePlan = useSubscriptionStore((s) => s.selectPlan);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);
  const trialPlan = PLANS.find((p) => p.id === 'discovery');

  const handlePickPlan = (plan: Plan) => {
    if (plan.contactOnly) return;
    setPickedPlan(plan);
  };

  const handleSubscribe = () => {
    if (!pickedPlan) return;
    storePlan(pickedPlan);
    navigate('/subscribe/register');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Accroche compacte + trial ── */}
      <section className="bg-white pt-8 pb-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-dark leading-tight">
              Signez vos documents en ligne, en toute confiance
            </h1>
            <p className="mt-2 text-base text-txt-secondary max-w-2xl mx-auto">
              diSign Parapheur est la plateforme de signature électronique sécurisée, conforme eIDAS et UEMOA.
            </p>
          </div>

          {trialPlan && (
            <div onClick={() => { handlePickPlan(trialPlan); }} className="block max-w-2xl mx-auto cursor-pointer">
              <div className="rounded-xl border-2 border-accent bg-accent-light px-5 py-3 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Gift size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-dark text-sm">Essai gratuit — 14 jours</span>
                  <span className="text-txt-secondary text-xs ml-2 hidden sm:inline">Sans engagement, aucune carte requise</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg font-semibold bg-accent text-white px-4 py-2 text-xs shrink-0">
                  Essayer
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Plans d'abonnement ── */}
      <section id="pricing" className="bg-bg pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-dark">
              Nos offres
            </h2>
            <p className="mt-2 text-sm text-txt-secondary">
              Choisissez le plan adapté à votre activité.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 overflow-x-auto pb-2">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {PLANS.map((plan) => (
              <div key={plan.id} className="w-56 shrink-0">
                <PlanCard
                  plan={plan}
                  selected={pickedPlan?.id === plan.id}
                  onSelect={handlePickPlan}
                  highlighted={plan.id === 'discovery'}
                />
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── Présentation chiffres ── */}
      <section className="bg-primary py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            La signature électronique de confiance pour l'Afrique
          </h2>
          <p className="mt-3 text-white/70 max-w-2xl mx-auto">
            Signez, certifiez et archivez vos documents en toute sécurité.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'Illimité', label: 'Documents signés', icon: FileCheck },
              { value: '99,9%', label: 'Disponibilité', icon: Clock },
              { value: '<5 sec', label: 'Temps de signature', icon: Zap },
              { value: 'eIDAS', label: 'Conforme', icon: BadgeCheck },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-5 text-center">
                <Icon size={22} className="text-accent mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-sm text-white/60 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="features" className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10">
            Tout ce qu'il vous faut
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-border"
              >
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

      {/* ── Sécurité ── */}
      <section id="security" className="bg-white py-14 px-6 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Shield size={32} className="text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-dark mb-8">Sécurité et conformité</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustItems.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-bg rounded-xl p-4">
                <Icon size={22} className="text-accent mx-auto mb-2" />
                <span className="text-sm font-medium text-txt">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" variant="light" />
          <p className="text-sm text-white/50">&copy; 2026 Cryptoneo — Côte d'Ivoire</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
              Mentions légales
            </a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
              CGV
            </a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
              Confidentialité
            </a>
          </div>
        </div>
      </footer>

      {/* ── Barre sticky souscrire ── */}
      {pickedPlan && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-txt-secondary">Plan sélectionné :</span>
              <span className="font-bold text-dark">{pickedPlan.name}</span>
              <span className="font-semibold text-accent">
                {pickedPlan.price > 0
                  ? `${pickedPlan.price.toLocaleString('fr-FR')} FCFA/mois`
                  : pickedPlan.id === 'discovery' ? 'Gratuit 14 jours' : ''}
              </span>
            </div>
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center gap-2 rounded-xl font-semibold bg-accent text-white hover:bg-accent/90 px-6 py-2.5 text-sm transition-all cursor-pointer"
            >
              Souscrire
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
