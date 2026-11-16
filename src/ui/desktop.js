// Version ordinateur (M16) : à partir de config.ui.desktopMinPx de large ; en dessous, le mobile inchangé.
import { config } from '../config.js';

export const desktopQuery = (cfg = config) => `(min-width: ${cfg.ui.desktopMinPx}px)`;
export const isDesktop = (cfg = config) => Boolean(globalThis.matchMedia?.(desktopQuery(cfg)).matches);

// Prévient `fn(desktop)` quand la fenêtre franchit le seuil ; retourne de quoi arrêter l'écoute.
export function onDesktopChange(fn, cfg = config) {
  const mql = globalThis.matchMedia?.(desktopQuery(cfg));
  if (!mql?.addEventListener) return () => {};
  const listener = (ev) => fn(ev.matches);
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
}
