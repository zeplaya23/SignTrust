/**
 * Auto-redirige vers signtrust-webmobile si le périphérique est un mobile.
 *
 * Détection (du plus fort au plus faible) :
 *  1. UA-Client-Hints `navigator.userAgentData.mobile === true`  (Chromium récents)
 *  2. user-agent regex (iPhone/Android/Windows Phone…)
 *  3. écran tactile (`maxTouchPoints > 0` ou pointer:coarse) ET largeur < 820px
 *
 * Override :
 *  - `?mobile=1`  → force la redirection (utile en test desktop)
 *  - `?desktop=1` → opt-out persistant via localStorage `forceDesktop=1`
 *  - `localStorage.forceDesktop` à `0` ou suppression pour réinitialiser
 *
 * Cible : `VITE_MOBILE_URL` (ex: https://m.disign.example) ;
 * en dev on retombe sur `http://<host>:5273` (port du projet webmobile).
 */

const MOBILE_UA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;

interface UADataLike {
  mobile?: boolean;
}

function getMobileUrl(): string {
  const override = import.meta.env.VITE_MOBILE_URL as string | undefined;
  if (override) return override.replace(/\/$/, '');
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5273`;
}

export function detectMobile(): { mobile: boolean; reason: string } {
  if (typeof navigator === 'undefined') return { mobile: false, reason: 'no navigator' };

  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  if (uaData?.mobile === true) return { mobile: true, reason: 'userAgentData.mobile' };

  if (MOBILE_UA.test(navigator.userAgent)) return { mobile: true, reason: 'user-agent regex' };

  const touch = (navigator.maxTouchPoints ?? 0) > 0
    || window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 819px)').matches;
  if (touch && narrow) return { mobile: true, reason: `touch + narrow (w=${window.innerWidth}, mtp=${navigator.maxTouchPoints})` };

  return { mobile: false, reason: `desktop (ua=${navigator.userAgent.slice(0, 40)}…, w=${window.innerWidth}, mtp=${navigator.maxTouchPoints})` };
}

export function maybeRedirectToMobile(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const isDev = import.meta.env.DEV;
    const log = (...args: unknown[]) => { if (isDev) console.info('[mobile-redirect]', ...args); };

    // Opt-out explicite (persistant)
    if (params.get('desktop') === '1') {
      localStorage.setItem('forceDesktop', '1');
      log('opt-out via ?desktop=1 — version desktop forcée');
      return;
    }
    if (localStorage.getItem('forceDesktop') === '1') {
      log('opt-out actif (localStorage.forceDesktop=1) — pas de redirection');
      return;
    }

    // Force-redirect (testing)
    const force = params.get('mobile') === '1';

    const detection = detectMobile();
    log('détection:', detection);

    if (!force && !detection.mobile) return;

    const target = getMobileUrl();
    // Évite la boucle : si la cible matche déjà l'origine courante, on ne redirige pas
    if (target.replace(/:\d+$/, '') === window.location.origin.replace(/:\d+$/, '')
        && target.endsWith(window.location.port ? `:${window.location.port}` : '')) {
      log('cible identique à l\'origine — pas de redirection', target);
      return;
    }
    if (target === window.location.origin) {
      log('cible identique à l\'origine — pas de redirection');
      return;
    }

    const dest = `${target}${window.location.pathname}${window.location.search}${window.location.hash}`;
    log('redirection →', dest);
    window.location.replace(dest);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[mobile-redirect] erreur', err);
  }
}
