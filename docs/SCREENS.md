# REFERENCE DES 19 ECRANS — SignTrust
## Fichier de reference pour l'implementation

> **Reference visuelle** : voir `signtrust-v6-complete.jsx` pour le prototype React interactif.
> Chaque ecran y est implemente comme un composant React avec les couleurs, layouts et composants exacts.

---

## ECRANS HORS APPLICATION (sans sidebar)

### Ecran 1 — Landing page (/)
**Layout** : pleine page, navbar sticky en haut
**Composants** :
- **Navbar** : logo Cryptoneo + "SignTrust" | liens (Fonctionnalites, Tarifs, Securite) | bouton Connexion (outline) + Souscrire (accent → /subscribe/plan)
- **Hero** : fond #1E293B, titre H1 blanc "La signature electronique de confiance pour l'Afrique", sous-titre, 2 CTA (Souscrire → /subscribe/plan, J'ai un compte → /login), 4 metriques (45000+, 99.9%, <5sec, eIDAS)
- **Barre features** : 6 icones en ligne (Enveloppes multi-docs, 3 niveaux, AES-256, <5sec, API, Multi-tenant)
- **Section tarifs** : fond #F8F9FA, grille 4 colonnes, 4 plans (Decouverte/Pro/Business/Enterprise), prix en FCFA, features en checklist, bouton CTA chacun. Plan Pro avec badge "Populaire"
- **Footer** : fond #1E293B, logo Cryptoneo, copyright, liens legaux

### Ecran 2 — Connexion (/login)
**Layout** : split 50/50
- **Gauche** : fond #1E293B, logo Cryptoneo centre, "SignTrust", cercles decoratifs
- **Droite** : fond blanc, formulaire :
  - Titre "Connexion"
  - Champ email/telephone
  - Champ mot de passe (avec toggle oeil)
  - Bouton "Se connecter" (#1E3A5F) → /dashboard
  - Bouton "Creer un compte" (outline) → /subscribe/plan
  - Bouton "Abonnement expire" (fond #FFFBEB, texte warning) → /renewal
  - Lien "Retour a l'accueil" → /

### Ecran 3 — Choix du plan (/subscribe/plan)
**Layout** : TopBar progression + contenu centre (max 800px)
**TopBar** : logo + "SignTrust" | "Etape 1 sur 4 — Choix du plan"
**Composants** :
- Titre "Choisissez votre abonnement" + sous-titre
- **Grille 4 plans** : cartes selectionnables (clic = selection), plan selectionne a une bordure coloree + coche. Enterprise grise (opacity 0.5, "Contactez-nous")
  - Decouverte : gratuit, 5 env/mois, 1 user, SES
  - Pro (defaut) : 4 900 FCFA, 30 env, 3 users, AES
  - Business : 24 900 FCFA, 150 env, 10 users, QES+API
  - Enterprise : sur mesure
- **Recapitulatif** : carte blanche avec lignes plan/essai/total. Total en gros accent (#C87B2E)
- **Navigation** : Retour (outline) → / | Continuer (accent) → /subscribe/register

### Ecran 4 — Inscription (/subscribe/register)
**Layout** : TopBar "Etape 2 sur 4 — Inscription" + formulaire centre (max 520px)
**Composants** :
- Titre "Creez votre compte"
- **Toggle** : 2 boutons Particulier / Entreprise (Entreprise selectionne par defaut = fond primary)
- **Formulaire dans carte blanche** :
  - Nom entreprise
  - Nom complet responsable
  - Email professionnel
  - Telephone (+225)
  - Mot de passe (avec indication "Min 8 car, 1 majuscule, 1 chiffre")
  - Confirmation mot de passe
  - Checkbox CGV (pre-cochee, texte avec liens vers CGV et Politique)
- **Navigation** : Retour → /subscribe/plan | Continuer → /subscribe/verify

### Ecran 5 — Verification OTP (/subscribe/verify)
**Layout** : TopBar "Etape 3 sur 4 — Verification OTP" + contenu centre (max 440px)
**Composants** :
- Icone telephone (cercle #EBF2FA, icone #1E3A5F)
- Titre "Verification OTP"
- Message "Code a 6 chiffres envoye au +225 07 XX XX XX XX"
- **6 cases de saisie** : 48x56px chacune, border-radius 10, focus auto sur la suivante. Remplies = fond #EBF2FA + bordure #1E3A5F
- Bouton "Verifier et continuer" (accent) → /subscribe/payment
- Lien "Renvoyer le code" avec compteur (60s)
- **Regles** : 3 tentatives max, code valide 10 min, renvoi apres 60s

### Ecran 6 — Paiement Paystack (/subscribe/payment)
**Layout** : TopBar "Etape 4 sur 4 — Paiement Paystack" + formulaire centre (max 540px)
**Composants** :
- **Badge securite** : icone cadenas vert + "Paiement securise par Paystack" + "SSL 256-bit"
- **3 onglets methode** (cartes cliquables, selectionnee = bordure primary + fond #EBF2FA) :
  - **Carte bancaire** : champs numero carte (logos Visa/MC), expiration, CVV, nom
  - **Mobile Money** (defaut) : grille 4 operateurs (Orange Money #FF6600, MTN MoMo #FFCC00, Moov Money #0066CC, Wave #1DC4E9), selectionne = fond couleur 15% + bordure couleur. Champ telephone. Texte "Validez avec votre PIN"
  - **Virement** : selecteur banque, texte redirection
- **Recapitulatif** : Plan + prix, deduction essai (-prix), Total = 0 FCFA, mention "1er prelevement le [date+14j]"
- **Navigation** : Retour → /subscribe/verify | "Payer avec Paystack" (bouton vert #177A4B, icone cadenas) → /subscribe/success
- **Integration** : Paystack Inline JS ou Popup. Reference unique. Webhook backend.

### Ecran 7 — Confirmation paiement (/subscribe/success)
**Layout** : contenu centre (max 480px), pas de TopBar
**Composants** :
- Animation succes : cercle vert #ECFDF3 → cercle #177A4B → icone coche blanche
- Titre "Bienvenue sur SignTrust !"
- Sous-titre "Abonnement [plan] actif. Essai gratuit 14 jours."
- **Carte recu** : Reference (PAY-2026-...), Plan, Methode, Essai, Prochain prelevement, Statut (badge vert "Actif")
- Boutons : "Telecharger le recu" (outline) + "Acceder a SignTrust" (primary) → /dashboard

### Ecran 8 — Renouvellement (/renewal)
**Layout** : contenu centre (max 540px), pas de sidebar
**Acces** : affiche automatiquement si subscription_status = EXPIRED apres login
**Composants** :
- Icone alerte (cercle #FFFBEB, triangle jaune)
- Titre "Abonnement expire" + message avec date expiration
- **2 options radio** :
  - Renouveler meme plan (pre-selectionne, bordure accent)
  - Upgrader (bordure primary)
  - Chaque option : nom, description, prix FCFA
- **Encart rassurant** : fond #FEF3E2, icone eclair, "Vos donnees sont conservees" + explication
- Boutons : Deconnexion (outline) | "Renouveler — Payer avec Paystack" (accent) → /subscribe/payment

---

## ECRANS APPLICATION (avec sidebar)

### Layout commun
- **Sidebar** (230px fixe, fond blanc, bord droit) : logo Cryptoneo + "SignTrust" | nav items (Dashboard, Enveloppes, Nouvelle enveloppe [accent], Modeles, Contacts, Equipe) | Parametres | profil utilisateur (avatar initiales, nom, plan)
- **Zone contenu** (flexible) : Header (titre + sous-titre + actions) | contenu scrollable
- **Panneau droit** (320-340px, optionnel) : sur ecrans detail et signature

### Ecran 9 — Tableau de bord (/dashboard)
**Composants** :
- **Header** : "Tableau de bord" | icone cloche avec badge rouge (3)
- **4 metriques** (grille 4 col) : Total enveloppes (#1E3A5F), En attente (#B8860B), Signees (#177A4B), Taux (#C87B2E). Chaque carte : label uppercase 11px, valeur 28px bold
- **Grille 2 col** (contenu + panneau 320px) :
  - **Tableau enveloppes recentes** : colonnes Enveloppe/Docs (badge "3 PDF")/Signataires/Statut. 5 lignes. Bouton "Tout voir"
  - **Actions rapides** : 3 cartes (Nouvelle enveloppe, Signer, Modele)
  - **Encart abonnement** : fond #FEF3E2, badge plan, jauge N/max, date renouvellement, bouton Gerer

### Ecran 10 — Liste enveloppes (/envelopes)
**Composants** :
- **Header** : "Enveloppes" + compteur | boutons Filtres, Export, Nouvelle (primary)
- **Pilules filtre** : Toutes (active=primary), En attente, Signees, Refusees, Brouillons
- **Tableau** : colonnes Checkbox, Enveloppe (icone dossier + nom), Docs (badge), Signataires, Statut (badge), Creee le, Expire le (orange si proche). 8 lignes
- **Pagination** : "1-8 sur 156" + boutons de pages

### Ecran 11 — Nouvelle enveloppe (/envelopes/new)
**Layout** : wizard avec stepper horizontal 5 etapes
**Stepper** : 5 pastilles (Documents, Signataires, Champs, Options, Envoi). Active = #1E3A5F, done = coche, future = gris
- **Etape 1 (Documents)** : grille 2 col. Gauche : zone drag-and-drop + liste documents (nom, poids, pages, bouton X) + bouton "+ Ajouter" + section modeles. Droite : apercu
- **Etape 2 (Signataires)** : grille 2 col. Gauche : liste signataires (poignee drag, numero, avatar, nom, email, select role, bouton X) + bouton "+ Ajouter". Droite : radio sequentiel/parallele + resume
- **Etape 3 (Champs)** : grille 2 col. Gauche : onglets par document + zone apercu avec champs en absolute (bordure dashed, couleur par signataire). Droite : palette outils (Signature, Date, Initiales, Texte, Case)
- **Etape 4 (Resume)** : carte recapitulative (documents, signataires, champs, delai, rappels, niveau, message)
- **Etape 5 (Envoi)** : ecran succes
- **Navigation** : Precedent (masque etape 1) | Suivant → "Envoyer" → "Confirmer"

### Ecran 12 — Detail enveloppe (/envelopes/:id)
**Layout** : split (contenu + panneau droit 320px)
- **Header** : bouton retour, titre, date, nombre docs, badge statut. Boutons ZIP, Annuler, Relancer
- **Gauche** : onglets par document + zone apercu
- **Droite** : liste documents (surlignage actif) + cartes signataires (avatar, statut) + timeline audit (pastilles vertes/grises)

### Ecran 13 — Signer (/sign/:token)
**Layout** : split (document + panneau signature 340px)
- **Header** : titre enveloppe, expediteur, nombre docs, bouton ZIP
- **Gauche** : onglets documents (coche si signe), document scrollable, champs surlignes "Votre signature ici"
- **Droite** : 3 onglets (Dessiner/Texte/Sauvegardee), canvas signature (bordure primary), bouton Effacer, infos securite (icone bouclier + niveau), progression par document (coches)
- **Barre bas** : Refuser (danger) | "Signer les N documents" (accent)

### Ecran 14 — Confirmation signature (/sign/success)
**Composants** : icone bouclier vert, "N documents signes", preuve SHA-256 + timestamp UTC, boutons ZIP + Dashboard

### Ecran 15 — Equipe (/team)
**Composants** :
- **Header** : "Gestion equipe" + compteur | boutons Cles API (outline), Inviter (primary)
- **3 metriques** : Membres actifs, Enveloppes mois, Quota
- **Tableau** : Membre (avatar couleur + nom + email), Role (badge Admin/Manager/Membre), Enveloppes, Activite, bouton Modifier

### Ecran 16 — Modeles (/templates)
**Composants** :
- **Header** : "Modeles" + compteur | bouton Creer
- **Grille 3 col** : cartes avec icone dossier coloree, nom, description, badge "N docs", compteur utilisations, bouton Utiliser

### Ecran 17 — Contacts (/contacts)
**Composants** :
- **Header** : "Contacts" + compteur | bouton Ajouter
- **Tableau** : Nom (avatar + nom), Email, Telephone, Enveloppes, bouton Envoyer

### Ecran 18 — Parametres (/settings)
**Layout** : contenu scrollable, max 660px
**4 sections** (cartes blanches empilees) :
- **Profil** : Nom, Email, Tel | bouton Modifier
- **Securite** : Mot de passe, 2FA (TOTP), Sessions | bouton Modifier
- **Abonnement & Facturation** : Plan actif + prix FCFA, methode paiement, prochain prelevement, jauge utilisation | bouton "Changer de plan" → /subscribe/plan
- **Notifications** : Toggles email/push/SMS, frequence rappels | bouton Modifier

### Ecran 19 — Notifications (/notifications)
**Composants** :
- **Header** : "Notifications" + compteur non-lues | bouton "Tout marquer lu"
- **Liste** : cartes empilees. Non-lue = fond #EBF2FA + bordure #1E3A5F 25%. Chaque notification : icone (receipt pour paiement, bell pour signature, alert pour renouvellement), titre (bold si non-lu), description mentionnant le nombre de docs, horodatage relatif. Clic → ecran concerne

---

## STATUTS D'ENVELOPPE (badges)

| Statut | Couleur fond | Couleur texte | Label |
|--------|-------------|---------------|-------|
| pending | #FFFBEB | #B8860B | En attente |
| signed | #ECFDF3 | #177A4B | Signe |
| rejected | #FEF2F0 | #C0392B | Refuse |
| draft | #EBF2FA | #1E3A5F | Brouillon |

---

## COMPOSANTS REUTILISABLES A CREER

1. **Sidebar** — navigation avec logo, items actifs, profil
2. **Header** — titre + sous-titre + actions
3. **Badge** — statut colore (pending/signed/rejected/draft)
4. **Button** — variants : primary, accent, success, danger, outline, default, white
5. **TopBar** — barre de progression pour le tunnel d'inscription
6. **Field** — label + input avec placeholder
7. **Table** — tableau avec headers, pagination, tri, filtres
8. **Card** — conteneur blanc avec bordure et padding
9. **MetricCard** — label + valeur + couleur
10. **Timeline** — piste d'audit avec pastilles et lignes
11. **TabBar** — onglets pour documents multiples
12. **SignaturePad** — canvas de signature avec modes dessin/texte/sauvegardee
