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
  // Clock,
  Gift,
  Upload,
  Send,
  PenTool,
  Quote,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PlanCard from '../components/subscription/PlanCard';
import Logo from '../components/ui/Logo';
import { PLANS, type Plan } from '../config/plans';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

const steps = [
  { icon: Upload, num: '1', title: 'Déposez vos documents', desc: 'Importez vos PDF en un clic dans une enveloppe sécurisée.' },
  { icon: Send, num: '2', title: 'Ajoutez les signataires', desc: 'Invitez vos destinataires par email avec un ordre de signature.' },
  { icon: PenTool, num: '3', title: 'Signez et archivez', desc: 'Signature légale en quelques secondes, certificat inclus.' },
];

const testimonials = [
  { name: 'Aminata K.', role: 'DG, Cabinet juridique', text: 'DigiSign Parapheur a transformé notre gestion contractuelle. Nos clients signent depuis leur téléphone en moins d\'une minute.' },
  { name: 'Jean-Marc D.', role: 'DSI, Groupe industriel', text: 'L\'intégration API a été fluide. On signe 500+ documents par mois sans intervention manuelle.' },
  { name: 'Fatou S.', role: 'Notaire', text: 'La conformité eIDAS et UEMOA me permet de proposer un service moderne tout en respectant la réglementation.' },
];

const features = [
  { icon: FileCheck, title: 'Signature légale', desc: 'Conformes aux normes eIDAS et UEMOA.' },
  { icon: Layers, title: 'Multi-documents', desc: 'Plusieurs documents dans une enveloppe.' },
  { icon: Shield, title: 'Sécurité avancée', desc: 'Chiffrement de bout en bout.' },
  { icon: Zap, title: 'Ultra rapide', desc: 'Signez en moins de 5 secondes.' },
  { icon: Code, title: 'API REST', desc: 'Intégration dans vos applications.' },
  { icon: Users, title: 'Multi-utilisateurs', desc: 'Gestion d\'équipe et droits d\'accès.' },
];

const trustItems = [
  { icon: Lock, text: 'Chiffrement AES-256' },
  { icon: Globe, text: 'Conforme UEMOA & eIDAS' },
  { icon: BadgeCheck, text: 'Certificats qualifiés' },
  { icon: CheckCircle2, text: 'Horodatage certifié' },
];

export default function LandingA() {
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero immersif */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0083BF 0%, #005A8C 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <Gift size={14} className="text-white" />
              <span className="text-white/90 text-sm font-medium">14 jours d'essai gratuit — sans carte bancaire</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Signez vos documents<br />en toute confiance
            </h1>
            <p className="mt-4 text-lg text-white/75 max-w-xl">
              DigiSign Parapheur est la plateforme de signature électronique sécurisée pour l'Afrique. Conforme eIDAS et UEMOA.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const trial = PLANS.find(p => p.id === 'discovery');
                  if (trial) { handlePickPlan(trial); }
                }}
                className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-accent/90 transition-all cursor-pointer text-sm"
              >
                Essai gratuit
                <ArrowRight size={16} />
              </button>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-all cursor-pointer text-sm border border-white/20"
              >
                Voir les offres
              </a>
            </div>
          </div>

          {/* Mockup flottant */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-80">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                  <FileCheck size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-dark">Contrat_2026.pdf</div>
                  <div className="text-xs text-txt-secondary">Signé avec succès</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success" />
                  <span className="text-xs text-txt">Signature vérifiée</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success" />
                  <span className="text-xs text-txt">Certificat eIDAS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success" />
                  <span className="text-xs text-txt">Horodatage certifié</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="bg-white border-b border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={18} className="text-primary" />
              <span className="text-sm font-medium text-txt-secondary">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-12">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center relative">
                  <Icon size={28} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">{num}</span>
                </div>
                <h3 className="font-bold text-lg text-dark mb-2">{title}</h3>
                <p className="text-sm text-txt-secondary max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="pricing" className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-3">Nos offres</h2>
          <p className="text-center text-txt-secondary mb-10">Choisissez le plan adapté à votre activité.</p>
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

      {/* Témoignages */}
      <section className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10">Ils nous font confiance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-border">
                <Quote size={24} className="text-primary/30 mb-3" />
                <p className="text-sm text-txt leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-dark">{t.name}</div>
                    <div className="text-xs text-txt-secondary">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="features" className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10">Tout ce qu'il vous faut</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-bg rounded-2xl p-6 border border-border">
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

      {/* Sécurité */}
      <section id="security" className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0083BF 0%, #005A8C 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Shield size={36} className="text-white mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Sécurité et conformité</h2>
          <p className="text-white/70 mb-10 max-w-xl mx-auto">Vos documents sont protégés par les standards les plus élevés.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustItems.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <Icon size={24} className="text-accent mx-auto mb-2" />
                <span className="text-sm font-medium text-white">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-dark mb-3">Prêt à signer ?</h2>
          <p className="text-txt-secondary mb-8">Rejoignez des milliers de professionnels qui font confiance à DigiSign Parapheur.</p>
          <button
            onClick={() => {
              const trial = PLANS.find(p => p.id === 'discovery');
              if (trial) { handlePickPlan(trial); }
            }}
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all cursor-pointer"
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
