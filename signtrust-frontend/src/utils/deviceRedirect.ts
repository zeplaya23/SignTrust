/**
 * Auto-redirige vers signtrust-webmobile si le périphérique est un mobile.
 *
 * Logique de détection :
 *  1. user-agent (regex iPhone/Android/Windows Phone…)
 *  2. fallback : largeur d'écran < 768px ET pointeur tactile
 *  3. respect d'un opt-out : `?desktop=1` ou clé localStorage `forceDesktop=1`
 *
 * Cible : `VITE_MOBILE_URL` (ex: https://m.disign.example) ;
 * en dev on retombe sur `http://<host>:5273` (port du projet webmobile).
 */

const MOBILE_UA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;

function getMobileUrl(): string {
  const override = import.meta.env.VITE_MOBILE_URL;
  if (override) return override.replace(/\/$/, '');
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5273`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (MOBILE_UA.test(navigator.userAgent)) return true;
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return narrow && coarse;
}

export function maybeRedirectToMobile(): void {
  try {
    const params = new URLSearchParams(window.location.search);

    // Opt-out explicite
    if (params.get('desktop') === '1') {
      localStorage.setItem('forceDesktop', '1');
      return;
    }
    if (localStorage.getItem('forceDesktop') === '1') return;

    if (!isMobileDevice()) return;

    const target = getMobileUrl();
    // Ne redirige que si la cible est différente de l'origine actuelle
    if (target.startsWith(window.location.origin)) return;

    const dest = `${target}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(dest);
  } catch {
    // En cas d'erreur de détection, on ne bloque pas l'app desktop
  }
}
