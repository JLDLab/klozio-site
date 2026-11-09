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
  root.setProperty('--gauge-ms', `${config.ui.gaugeMs}ms`);
  root.setProperty('--stamp-ms', `${config.ui.stampMs}ms`);
  root.setProperty('--tap', `${config.ui.tapPx}px`);
  root.setProperty('--cta', `${config.ui.ctaPx}px`);
  root.setProperty('--gap', `${config.ui.tapGapPx}px`);
  root.setProperty('--part-ms', `${config.wheel.partMs}ms`); // part de roue qui se remplit
  const f = config.feel; // M18 : minutage et amplitudes de la sensation de jeu
  for (const [name, value] of Object.entries({
    'press-ms': `${f.pressMs}ms`, scale: f.pressScale, dim: f.dimOpacity, 'verdict-at': `${f.verdictDelayMs}ms`, 'verdict-ms': `${f.verdictMs}ms`,
    slide: `${f.verdictSlidePx}px`, pop: f.popScale, 'shake-ms': `${f.shakeMs}ms`, shake: `${f.shakePx}px`,
    'best-at': `${f.verdictDelayMs + f.bestDelayMs}ms`, 'late-at': `${f.verdictDelayMs + f.verdictMs}ms`,
    'hold-ms': `${f.tempHoldMs}ms`, 'arc-ms': `${f.arcMs}ms`, stagger: `${f.rowStaggerMs}ms`, 'bump-ms': `${f.bumpMs}ms`, 'scene-ms': `${f.sceneMs}ms`, scene: `${f.sceneSlidePx}px`, 'fade-ms': `${f.reducedFadeMs}ms`,
  })) root.setProperty(`--fx-${name}`, value);
}

// M8 v2 : pas de mode sombre ; l'ancienne préférence de thème est conservée dans la sauvegarde mais ignorée.
export function applyOptions(options) {
  const root = document.documentElement;
  delete root.dataset.theme;
  root.classList.toggle('reduced', reducedMotion(options)); // M18 : l'option du jeu et le réglage du système font la même chose
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.light.bg);
}

export function reducedMotion(options) {
  return Boolean(options.reducedMotion) || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
