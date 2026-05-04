# signtrust-webmobile

Version mobile-first de **DigiSign Parapheur** (Cryptoneo). Le site `signtrust-frontend`
détecte automatiquement les périphériques mobiles et redirige vers cette application,
qui propose une expérience repensée pour le tactile : navigation par onglets en bas,
sheets coulissantes, signature au doigt.

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (palette Cryptoneo : `#0083BF` / `#4E901F`)
- React Router v7 — React Query v5 — Zustand — react-hook-form + zod
- Axios (proxy vers `/api` → backend Spring Boot)

## Lancer en local
```bash
npm install
npm run dev
```
Le projet écoute sur le port **5273** (`signtrust-frontend` sur 5173).

## Variables d'environnement
- `VITE_API_BASE_URL` — par défaut `/api`
- `VITE_PAYSTACK_PUBLIC_KEY` — clé publique Paystack
- `VITE_DESKTOP_URL` — URL desktop (optionnel, pour basculer vers la version desktop)

## Routes
- Public : `/`, `/login`, `/subscribe/*`, `/renewal`
- Signataire externe : `/sign/:token`, `/sign/:token/view`, `/sign/success`
- Protégé (bottom-nav) : `/home`, `/envelopes`, `/envelopes/new`, `/envelopes/:id`, `/contacts`, `/activity`, `/notifications`, `/settings`
