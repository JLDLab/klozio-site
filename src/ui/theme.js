// Palette unique (crème / bleu / chocolat) et effets réduits, appliqués à la racine du document.
import { config } from '../config.js';
import { themeCss, tokens } from './tokens.js';

// Variables CSS de la palette et de l'édition en cours (étapes, signature).
export function installTokens(edition) {
  const style = document.getElementById('tokens') || document.createElement('style');
  style.id = 'tokens';
  style.textContent = themeCss(edition);
  if (!style.isConnected) document.head.prepend(style);
  const root = document.documentElement.style;
  root.setProperty('--reveal-ms', `${config.ui.revealMs}ms`);
  root.setProperty('--stagger-ms', `${config.ui.revealStaggerMs}ms`);
  root.setProperty('--gauge-ms', `${config.ui.gaugeMs}ms`);
  root.setProperty('--stamp-ms', `${config.ui.stampMs}ms`);
  root.setProperty('--tap', `${config.ui.tapPx}px`);
  root.setProperty('--cta', `${config.ui.ctaPx}px`);
  root.setProperty('--gap', `${config.ui.tapGapPx}px`);
  root.setProperty('--part-ms', `${config.wheel.partMs}ms`); // part de roue qui se remplit
}

// M8 v2 : pas de mode sombre ; l'ancienne préférence de thème est conservée dans la sauvegarde mais ignorée.
export function applyOptions(options) {
  const root = document.documentElement;
  delete root.dataset.theme;
  root.classList.toggle('reduced', Boolean(options.reducedMotion));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.light.bg);
}

export function reducedMotion(options) {
  return Boolean(options.reducedMotion) || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
