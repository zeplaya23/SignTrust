# SignTrust — Parapheur Electronique Grand Public

Plateforme de signature electronique multi-tenant permettant la creation, l'envoi et la signature de documents PDF avec verification OTP et horodatage.

## Architecture

```
signtrust-parent/          # Backend Java 21 — Quarkus 3.17.8
  signtrust-app/           # Application principale (REST API, services, entities)
  signtrust-mod-tenant/    # Gestion multi-tenant
  signtrust-mod-iam/       # Identity & Access Management (Keycloak)
  signtrust-mod-hsm/       # Hardware Security Module
  signtrust-mod-pki/       # Public Key Infrastructure (EJBCA)
  signtrust-mod-signature/ # Signature PDF (PDFBox, DSS)
  signtrust-mod-storage/   # Stockage documents (MinIO S3)
  signtrust-mod-payment/   # Paiement / abonnement
  signtrust-mod-notification/ # Envoi d'emails (SMTP)
  signtrust-mod-audit/     # Journal d'audit avec chaine de hachage SHA-256
  signtrust-mod-envelope/  # Interface metier enveloppes

signtrust-frontend/        # Frontend React 18 + TypeScript + Vite
  src/
    pages/                 # Pages (Dashboard, Envelopes, Contacts, Team, etc.)
    pages/envelopes/       # Creation, liste, detail d'enveloppes
    pages/sign/            # Parcours de signature (OTP, vue PDF, signature)
    pages/subscribe/       # Inscription, verification OTP, paiement
    components/ui/         # Composants reutilisables (Card, Badge, Button, PdfViewer)
    services/              # Appels API (axios)
    stores/                # Etat global (Zustand)
    types/                 # Types TypeScript

docker/                    # Configuration Docker Compose
  nginx/                   # Nginx (reverse proxy + SPA)
  keycloak/                # Realm Keycloak
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Java 21, Quarkus 3.17.8, JPA/Hibernate, Jakarta EE |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4, Zustand |
| Auth | Keycloak (OIDC) |
| BDD | MySQL 8 |
| Stockage | MinIO (S3) |
| Email | SMTP (Mailpit en dev) |
| PDF | Apache PDFBox 3.0.4, react-pdf |
| PKI | EJBCA |
| Signature | DSS (Digital Signature Service) |
| Reverse proxy | Nginx |

## Prerequis

- Docker & Docker Compose
- Java 21 + Maven 3.9+ (pour le build backend)
- Node.js 18+ (pour le build frontend)

## Installation et demarrage

### 1. Cloner le repo

```bash
git clone https://github.com/zeplaya23/SignTrust.git
cd SignTrust
```

### 2. Configurer les variables d'environnement

Copier et adapter le fichier d'environnement :

```bash
cp docker/.env.example docker/.env
# Editer docker/.env avec vos valeurs
```

Variables requises dans `docker/.env` :

```env
# Base de donnees
SIGNTRUST_DB_USER=signtrust
SIGNTRUST_DB_PASSWORD=<mot_de_passe>
SIGNTRUST_DB_NAME=signtrust_db

# MinIO
MINIO_ROOT_USER=signtrust-admin
MINIO_ROOT_PASSWORD=<mot_de_passe>

# Keycloak
KEYCLOAK_URL=http://trust-keycloak:8080/auth

# EJBCA PKI
EJBCA_URL=https://trust-ejbca-pki:8443

# DSS
DSS_URL=http://trust-dss:8080
```

### 3. Build

```bash
# Backend
cd signtrust-parent
mvn package -DskipTests -q

# Frontend
cd ../signtrust-frontend
npm install
npm run build
```

### 4. Deployer avec Docker

```bash
cd docker
docker compose build
docker compose up -d
```

### 5. Acceder a l'application

| Service | URL |
|---------|-----|
| Application | http://localhost:5080 |
| API Backend | http://localhost:5080/api |
| Mailpit (dev) | http://localhost:8225 |
| MinIO Console | http://localhost:9101 |

## API Endpoints principaux

### Authentification (`/api/auth`) — public
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/verify-otp` | Verification OTP inscription |
| POST | `/api/auth/refresh` | Rafraichir le token JWT |

### Enveloppes (`/api/envelopes`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/envelopes` | Lister (pagination, filtre par statut) |
| POST | `/api/envelopes` | Creer une enveloppe |
| GET | `/api/envelopes/{id}` | Detail (avec audit trail) |
| PUT | `/api/envelopes/{id}` | Modifier |
| DELETE | `/api/envelopes/{id}` | Supprimer |
| POST | `/api/envelopes/{id}/send` | Envoyer aux signataires |
| POST | `/api/envelopes/{id}/cancel` | Annuler |

### Documents (`/api/envelopes/{id}/documents`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/envelopes/{id}/documents` | Upload (multipart) |
| GET | `/api/envelopes/{id}/documents/{docId}` | Telecharger |
| GET | `/api/envelopes/{id}/documents/zip` | Telecharger tous (ZIP) |
| DELETE | `/api/envelopes/{id}/documents/{docId}` | Supprimer |

### Signataires (`/api/envelopes/{id}/signatories`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/envelopes/{id}/signatories` | Ajouter un signataire |
| PUT | `/api/envelopes/{id}/signatories/{sigId}` | Modifier |
| DELETE | `/api/envelopes/{id}/signatories/{sigId}` | Supprimer |

### Champs de signature (`/api/envelopes/{id}/fields`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/envelopes/{id}/fields` | Ajouter un champ |
| PUT | `/api/envelopes/{id}/fields/{fieldId}` | Modifier |
| DELETE | `/api/envelopes/{id}/fields/{fieldId}` | Supprimer |

### Signature (`/api/sign`) — public (token-based)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sign/{token}` | Infos de signature |
| POST | `/api/sign/{token}/otp/send` | Envoyer code OTP |
| POST | `/api/sign/{token}/otp/verify` | Verifier OTP |
| POST | `/api/sign/{token}/sign` | Signer (avec image base64) |
| POST | `/api/sign/{token}/reject` | Refuser |
| GET | `/api/sign/{token}/documents/{docId}` | Telecharger document |

### Contacts (`/api/contacts`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/contacts` | Lister les contacts |
| POST | `/api/contacts` | Creer un contact |
| DELETE | `/api/contacts/{id}` | Supprimer |

### Equipe (`/api/team`) — authentifie
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/team` | Lister les membres |
| POST | `/api/team/invite` | Inviter un membre |
| DELETE | `/api/team/{id}` | Retirer un membre |

## Parcours de signature

1. **Creation** — L'expediteur cree une enveloppe, ajoute des documents PDF, des signataires et positionne les champs de signature sur le PDF
2. **Envoi** — L'enveloppe est envoyee : chaque signataire recoit un email avec un lien unique
3. **Verification OTP** — Le signataire clique sur le lien, saisit le code OTP recu par email
4. **Signature** — Le signataire visualise le PDF avec les champs positionnes, dessine ou tape sa signature
5. **Stamping** — L'image de la signature est apposee sur le PDF aux coordonnees exactes du champ (PDFBox)
6. **Completion** — Quand tous les signataires ont signe, l'enveloppe passe en statut COMPLETED

## Variables d'environnement Docker

| Variable | Description | Defaut |
|----------|-------------|--------|
| `SIGNTRUST_FRONTEND_URL` | URL du frontend (pour les liens dans les emails) | `http://localhost:5080` |
| `KEYCLOAK_URL` | URL interne Keycloak | `http://trust-keycloak:8080/auth` |
| `KEYCLOAK_ADMIN_PASSWORD` | Mot de passe admin Keycloak | `ChangeMeKcAdminP@ss2024` |
| `SIGNTRUST_DB_USER` | Utilisateur MySQL | `signtrust` |
| `SIGNTRUST_DB_PASSWORD` | Mot de passe MySQL | — |
| `SIGNTRUST_DB_NAME` | Nom de la base | `signtrust_db` |
| `MINIO_ROOT_USER` | Utilisateur MinIO | `signtrust-admin` |
| `MINIO_ROOT_PASSWORD` | Mot de passe MinIO | — |

## Developpement

### Backend (hot-reload)

```bash
cd signtrust-parent
mvn quarkus:dev
```

### Frontend (hot-reload)

```bash
cd signtrust-frontend
npm run dev
```

### Rebuild et redeploy Docker

```bash
# Backend uniquement
cd signtrust-parent && mvn package -DskipTests -q
cd ../docker && docker compose build signtrust-app && docker compose up -d signtrust-app

# Frontend uniquement
cd signtrust-frontend && npm run build
cd ../docker && docker compose build signtrust-web && docker compose up -d signtrust-web

# Les deux
cd signtrust-parent && mvn package -DskipTests -q
cd ../signtrust-frontend && npm run build
cd ../docker && docker compose build signtrust-app signtrust-web && docker compose up -d
```

## Licence

Projet prive — CryptoNeo CI
