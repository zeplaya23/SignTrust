# INSTRUCTIONS POUR CLAUDE CODE
## Projet SignTrust — Plateforme de Signature Electronique
### Editeur : Cryptoneo (Cote d'Ivoire)

---

## 1. CONTEXTE

Cryptoneo met a disposition de ses clients (particuliers et entreprises) la plateforme **SignTrust**, une application web de signature electronique multi-tenant.

### Fichiers de reference dans ce dossier :
- `CDC_Fonctionnel_SignTrust_v2.docx` — Cahier des charges fonctionnel complet (23 pages)
- `signtrust-v6-complete.jsx` — **Prototype interactif React des 19 ecrans** (reference visuelle)
- `SCREENS.md` — Description ecran par ecran avec composants, couleurs, regles metier
- `INSTRUCTIONS.md` — Ce fichier

### Comment utiliser le prototype JSX :
Le fichier `signtrust-v6-complete.jsx` est un composant React fonctionnel qui rend les 19 ecrans de l'application. **C'est ta reference visuelle principale.** Il contient :
- La palette de couleurs exacte (objet `C`)
- La structure de chaque ecran (layout, composants, espacements)
- Les icones SVG utilisees
- Les flux de navigation entre ecrans
- Les donnees d'exemple (noms, emails, prix FCFA)

---

## 2. STACK TECHNIQUE

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React 18 + TypeScript + Vite | Latest |
| UI Library | Ant Design ou Tailwind CSS | Latest |
| PDF Viewer | PDF.js / react-pdf | Latest |
| Drag & Drop | Konva.js (champs sur PDF) | Latest |
| Signature pad | react-signature-canvas | Latest |
| State | React Query + Zustand | Latest |
| Backend | Quarkus 3.x | Java 21 |
| ORM | Hibernate ORM + Panache | |
| API | RESTEasy Reactive (JAX-RS) | |
| Securite | quarkus-oidc (JWT Keycloak) | |
| Signature | DSS 6.x (EU Commission) | |
| PKI | EJBCA Community Edition | Latest |
| HSM | SoftHSM 2.x (dev/staging) | |
| IAM | Keycloak 24+ | |
| BDD | MySQL 8.0 | |
| Stockage | MinIO (S3-compatible) | |
| Paiement | Paystack API | |
| Reverse proxy | Nginx | |
| CI/CD | GitHub Actions + GHCR | |
| Conteneurs | Docker Compose (dev), K3s (prod) | |

---

## 3. ARCHITECTURE

### 3.1 Multi-tenant
- Chaque client Cryptoneo = 1 tenant isole
- Colonne `tenant_id` sur TOUTES les tables
- Filtre JPA Hibernate global `@Filter("tenantFilter")`
- 1 realm Keycloak par tenant
- 1 bucket MinIO (ou prefixe) par tenant
- Sub-CA EJBCA optionnelle par tenant

### 3.2 Modules Maven (architecture modulaire)
```
signtrust-parent/
├── signtrust-mod-signature/    # DSS, PAdES/XAdES/CAdES
├── signtrust-mod-pki/          # EJBCA, certificats X.509
├── signtrust-mod-hsm/          # SoftHSM, PKCS#11
├── signtrust-mod-iam/          # Keycloak, OIDC, RBAC
├── signtrust-mod-payment/      # Paystack, abonnements
├── signtrust-mod-notification/ # Email SMTP, SMS, in-app
├── signtrust-mod-audit/        # Journal horodate, hash chaine
├── signtrust-mod-storage/      # MinIO, chiffrement AES-256
├── signtrust-mod-envelope/     # Logique metier enveloppes
├── signtrust-mod-tenant/       # Isolation multi-tenant
└── signtrust-app/              # Assemblage final
```

**Regle cle** : chaque module doit etre reutilisable dans d'autres projets Cryptoneo.
Couplage par interfaces Java, pas par dependances directes.

### 3.3 PKI : EJBCA + SoftHSM
- Root CA → Sub-CA → End Entity certificates
- Cles privees dans SoftHSM (PKCS#11)
- Slots : 0=Root CA, 1=Sub-CA, 2=TSA, 3+=users
- Migration prod : remplacer config PKCS#11 vers HSM physique (zero code change)

---

## 4. WORKFLOWS A IMPLEMENTER

### Workflow 1 — Inscription nouveau client
```
Landing → Choix du plan → Inscription → OTP → Paiement Paystack → Confirmation → Dashboard
```

### Workflow 2 — Connexion (abo actif)
```
Login → Dashboard
```

### Workflow 3 — Renouvellement (abo expire)
```
Login → Ecran renouvellement (bloquant) → Paiement → Confirmation → Dashboard
```

### Workflow 4 — Creation enveloppe
```
Dashboard → Wizard 5 etapes (Docs → Signataires → Champs → Options → Envoi)
```

### Workflow 5 — Signature
```
Email invitation → Vue signature (onglets multi-docs) → Pad signature → OTP → Succes
```

### Workflow 6 — Gestion abonnement
```
Parametres → Changer de plan → Paiement → Confirmation
```

---

## 5. LES 19 ECRANS

Voir le fichier `SCREENS.md` pour le detail de chaque ecran.
Voir le fichier `signtrust-v6-complete.jsx` pour la reference visuelle React.

| # | Ecran | Route | Sidebar | Auth |
|---|-------|-------|---------|------|
| 1 | Landing page | `/` | Non | Non |
| 2 | Connexion | `/login` | Non | Non |
| 3 | Choix du plan | `/subscribe/plan` | Non | Non |
| 4 | Inscription | `/subscribe/register` | Non | Non |
| 5 | Verification OTP | `/subscribe/verify` | Non | Non |
| 6 | Paiement Paystack | `/subscribe/payment` | Non | Non |
| 7 | Confirmation paiement | `/subscribe/success` | Non | Non |
| 8 | Renouvellement | `/renewal` | Non | Oui (expire) |
| 9 | Tableau de bord | `/dashboard` | Oui | Oui |
| 10 | Liste enveloppes | `/envelopes` | Oui | Oui |
| 11 | Nouvelle enveloppe | `/envelopes/new` | Oui | Oui |
| 12 | Detail enveloppe | `/envelopes/:id` | Oui | Oui |
| 13 | Signer | `/sign/:token` | Oui | JWT token |
| 14 | Confirmation signature | `/sign/success` | Oui | JWT token |
| 15 | Gestion equipe | `/team` | Oui | Oui (admin) |
| 16 | Modeles | `/templates` | Oui | Oui |
| 17 | Contacts | `/contacts` | Oui | Oui |
| 18 | Parametres | `/settings` | Oui | Oui |
| 19 | Notifications | `/notifications` | Oui | Oui |

---

## 6. PALETTE DE COULEURS

Extraite du prototype JSX — a respecter strictement :

```
Primary (bleu fonce)  : #1E3A5F   — Sidebar, boutons principaux, titres
Primary Light         : #EBF2FA   — Fonds selectionnes, badges
Accent (ambre)        : #C87B2E   — CTA, boutons accent, alertes abo
Accent Light          : #FEF3E2   — Fonds accent legers
Success (vert)        : #177A4B   — Statut signe, paiement OK, bouton payer
Success Light         : #ECFDF3   — Fonds succes
Danger (rouge)        : #C0392B   — Refus, annulation, erreurs
Warning (jaune)       : #B8860B   — En attente, expiration, renouvellement
Text                  : #1A1D21   — Texte principal
Text Secondary        : #5F6B7A   — Labels, descriptions
Text Muted            : #94A3B8   — Placeholders, hints
Border                : #E8ECF1   — Bordures principales
Background            : #F8F9FA   — Fond de page
White                 : #FFFFFF   — Cartes, sidebar
Dark                  : #1E293B   — Hero, login branding
Purple                : #6C5CE7   — Plan Enterprise, certains champs
```

---

## 7. PRIORITE D'IMPLEMENTATION

### Phase 1 — Infrastructure (semaine 1-2)
- Setup projet Maven multi-module
- Docker Compose : MySQL, Keycloak, MinIO, EJBCA, SoftHSM, Nginx
- Configuration Keycloak (realm, clients, flows)
- Configuration EJBCA (Root CA, Sub-CA, profils)
- Configuration SoftHSM (slots, PINs)
- Module mod-tenant (filtre JPA, isolation)
- Module mod-iam (integration Keycloak)

### Phase 2 — Frontend base + Auth (semaine 3-4)
- Setup React + TypeScript + Vite
- Layout principal (Sidebar + Content + Panel)
- Ecrans 1-8 (landing, login, inscription, OTP, paiement, renouvellement)
- Integration Paystack (module mod-payment)
- Gestion des abonnements

### Phase 3 — Coeur metier (semaine 5-8)
- Module mod-storage (upload, chiffrement)
- Module mod-envelope (CRUD enveloppes, workflow)
- Module mod-signature (integration DSS)
- Module mod-pki (EJBCA, emission certificats)
- Ecrans 9-14 (dashboard, enveloppes, creation wizard, signature)

### Phase 4 — Fonctionnalites avancees (semaine 9-10)
- Module mod-notification (email, in-app)
- Module mod-audit (journal horodate)
- Ecrans 15-19 (equipe, modeles, contacts, parametres, notifications)
- API REST publique + documentation Swagger

### Phase 5 — QES + Production (semaine 11-12)
- Signature qualifiee (QES) via HSM
- Tests de charge
- Audit securite OWASP
- Deploiement production

---

## 8. COMMANDE CLAUDE CODE SUGGEREE

```
Lis les fichiers dans docs/ pour comprendre le projet SignTrust :
1. docs/INSTRUCTIONS.md — vue d'ensemble et priorites
2. docs/SCREENS.md — detail de chaque ecran
3. docs/signtrust-v6-complete.jsx — prototype React (reference visuelle)
4. docs/CDC_Fonctionnel_SignTrust_v2.docx — cahier des charges complet

Commence par la Phase 1 : cree la structure Maven multi-module,
le Docker Compose, et configure Keycloak + EJBCA + SoftHSM.
```
