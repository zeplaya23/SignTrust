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
  ChevronDown,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PlanCard from '../components/subscription/PlanCard';
import Logo from '../components/ui/Logo';
import { PLANS, type Plan } from '../config/plans';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

const bentoFeatures = [
  { icon: FileCheck, title: 'Signature légale', desc: 'Conformes aux normes eIDAS et UEMOA. Valeur juridique garantie pour tous vos documents.', large: true },
  { icon: Shield, title: 'Sécurité avancée', desc: 'Chiffrement AES-256 de bout en bout.', large: false },
  { icon: Zap, title: 'Ultra rapide', desc: 'Signez en moins de 5 secondes.', large: false },
  { icon: Code, title: 'API REST complète', desc: 'Intégrez la signature dans vos applications avec notre SDK et nos webhooks temps réel.', large: true },
  { icon: Layers, title: 'Multi-documents', desc: 'Plusieurs documents dans une enveloppe.', large: false },
  { icon: Users, title: 'Multi-utilisateurs', desc: 'Gestion d\'équipe et droits d\'accès.', large: false },
];

const faqs = [
  { q: 'Qu\'est-ce qu\'une signature électronique légale ?', a: 'Une signature électronique légale a la même valeur juridique qu\'une signature manuscrite. DigiSign Parapheur est conforme aux normes eIDAS (Europe) et UEMOA (Afrique de l\'Ouest), garantissant la validité de vos signatures.' },
  { q: 'Comment fonctionne l\'essai gratuit ?', a: 'L\'essai Découverte vous donne accès à 5 enveloppes par mois pendant 14 jours, sans carte bancaire. Vous pouvez upgrader à tout moment vers un plan payant.' },
  { q: 'Mes documents sont-ils sécurisés ?', a: 'Oui. Tous les documents sont chiffrés en AES-256 au repos et en transit. Nous utilisons des certificats qualifiés et un horodatage certifié pour chaque signature.' },
  { q: 'Puis-je intégrer DigiSign dans mon application ?', a: 'Absolument. Notre plan Intégration API offre une API REST complète, des webhooks temps réel, un SDK et un environnement sandbox pour vos développeurs.' },
  { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Nous acceptons les paiements par Mobile Money (Orange Money, MTN Money, Wave) et par carte bancaire (Visa, Mastercard).' },
];

export default function LandingB() {
  const navigate = useNavigate();
  const storePlan = useSubscriptionStore((s) => s.selectPlan);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

      {/* Hero minimal */}
      <section className="bg-white pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-dark leading-tight tracking-tight">
            Signez. Certifiez.<br />
            <span className="text-primary">Archivez.</span>
          </h1>
          <p className="mt-5 text-lg text-txt-secondary max-w-xl mx-auto">
            La plateforme de signature électronique sécurisée et conforme pour l'Afrique.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                const trial = PLANS.find(p => p.id === 'discovery');
                if (trial) { handlePickPlan(trial); }
              }}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all cursor-pointer text-sm"
            >
              Essai gratuit — 14 jours
              <ArrowRight size={16} />
            </button>
            <a href="#pricing" className="inline-flex items-center gap-2 text-txt-secondary font-semibold px-8 py-3.5 rounded-xl border border-border hover:bg-bg transition-all cursor-pointer text-sm">
              Voir les tarifs
            </a>
          </div>
          <p className="mt-4 text-xs text-txt-muted">Sans engagement, aucune carte requise</p>
        </div>
      </section>

      {/* Bento grid fonctionnalités */}
      <section id="features" className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-12">Fonctionnalités</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {bentoFeatures.map(({ icon: Icon, title, desc, large }) => (
              <div
                key={title}
                className={`bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-sm transition-all ${large ? 'md:col-span-2' : ''}`}
              >
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-bold text-dark text-lg mb-1">{title}</h3>
                <p className="text-sm text-txt-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="bg-accent py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 'Illimité', label: 'Documents signés', icon: FileCheck },
            { value: '99,9%', label: 'Disponibilité', icon: Clock },
            { value: '<5s', label: 'Temps de signature', icon: Zap },
            { value: 'eIDAS', label: 'Certifié', icon: BadgeCheck },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <Icon size={22} className="text-white/70 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
              <div className="text-sm text-white/70 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="pricing" className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-3">Tarifs simples et transparents</h2>
          <p className="text-center text-txt-secondary mb-10">Pas de frais cachés. Changez de plan à tout moment.</p>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {PLANS.map((plan) => (
                <div key={plan.id} className="w-56 shrink-0">
                  <PlanCard plan={plan} selected={pickedPlan?.id === plan.id} onSelect={handlePickPlan} highlighted={plan.id === 'pro'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer bg-white hover:bg-bg transition-colors"
                >
                  <span className="font-semibold text-sm text-dark pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-txt-muted shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-txt-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section id="security" className="bg-bg py-14 px-6 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Shield size={32} className="text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-dark mb-8">Sécurité et conformité</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock, text: 'Chiffrement AES-256' },
              { icon: Globe, text: 'Conforme UEMOA & eIDAS' },
              { icon: BadgeCheck, text: 'Certificats qualifiés' },
              { icon: CheckCircle2, text: 'Horodatage certifié' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white rounded-xl p-5 border border-border">
                <Icon size={22} className="text-primary mx-auto mb-2" />
                <span className="text-sm font-medium text-txt">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-dark mb-3">Prêt à démarrer ?</h2>
          <p className="text-txt-secondary text-sm mb-6">Créez votre compte en 2 minutes.</p>
          <button
            onClick={() => {
              const trial = PLANS.find(p => p.id === 'discovery');
              if (trial) { handlePickPlan(trial); }
            }}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
          >
            Commencer gratuitement <ArrowRight size={16} />
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
