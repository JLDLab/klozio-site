// M18 — sensation de jeu : ce que le CSS ne sait pas faire seul. Rien ici ne retarde une action.
import { config } from '../config.js';
import { reducedMotion } from './theme.js';
import { svg } from './dom.js';

// L'ancienne scène s'efface au-dessus de la nouvelle, déjà jouable : une copie inerte, que le toucher traverse.
export function ghostOut(node, cfg = config) {
  const { top, left, width } = node.getBoundingClientRect();
  const ghost = node.cloneNode(true);
  ghost.classList.remove('fx', 'fx-enter');
  ghost.classList.add('fx-ghost');
  ghost.inert = true;
  ghost.setAttribute('aria-hidden', 'true');
  for (const el of ghost.querySelectorAll('[id]')) el.removeAttribute('id');
  Object.assign(ghost.style, { top: `${top}px`, left: `${left}px`, width: `${width}px` });
  document.body.append(ghost);
  const drop = () => ghost.remove();
  ghost.addEventListener('animationend', drop);
  setTimeout(drop, cfg.feel.sceneMs + 50); // au cas où l'animation ne se joue pas
}

// Réflexe senior : vibration courte au moment où la pastille apparaît. Sans effet là où l'appareil ne vibre pas.
export function verdictHaptic(grade, options, cfg = config) {
  if (grade !== Math.max(...cfg.deal.grades) || reducedMotion(options)) return;
  setTimeout(() => navigator.vibrate?.(cfg.feel.vibrateMs), cfg.feel.verdictDelayMs);
}

// Deal signé : 2 × 20 ms.
export function signedHaptic(options, cfg = config) {
  if (!reducedMotion(options)) navigator.vibrate?.([...cfg.feel.signedVibrate]);
}

// Compteur de chiffres : le nœud porte déjà la valeur finale (lue par les lecteurs d'écran, et affichée si l'image
// suivante n'arrive jamais) ; la première image repart de `from`, avant tout affichage. Effets réduits : valeur finale.
export function countTo(node, { from, to, ms, format = String, options = {} }) {
  if (reducedMotion(options)) return;
  node.setAttribute('aria-live', 'off');
  let t0 = null;
  const tick = (now) => {
    t0 ??= now;
    const k = Math.min(1, (now - t0) / ms);
    // ease-out, départ immédiat ; la valeur finale tombe à la durée exacte, pas avant (l'arrondi l'avancerait)
    const value = from + Math.round((to - from) * (1 - (1 - k) ** 2));
    node.textContent = format(k < 1 && value === to ? to - Math.sign(to - from) : value);
    if (k < 1 && node.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// `fn` une fois, la première fois que le nœud est à l'écran (une animation jouée hors champ serait perdue).
// Retourne de quoi renoncer, si l'écran est quitté avant.
export function whenSeen(node, fn, threshold = 0.2) {
  const Observer = globalThis.IntersectionObserver;
  if (!Observer) { fn(); return () => {}; }
  const io = new Observer((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    fn();
  }, { threshold });
  io.observe(node);
  return () => io.disconnect();
}

// Roue de compétences : la part gagnée (ctx.wheelPending, en mémoire) se remplit en arc la première fois qu'elle est
// vue, au débrief ou à l'accueil, une seule fois, puis reste pleine. `draw(highlight)` : le SVG de la roue.
export function wonWheel(ctx, draw, onStop = () => {}) {
  const highlight = [...(ctx.wheelPending || [])];
  const node = svg(draw(highlight));
  if (highlight.length) {
    document.adoptNode?.(node); // né dans le document d'un <template> : observé là, il ne serait jamais libéré
    onStop(whenSeen(node, () => {
      node.classList.add('seen');
      for (const k of highlight) ctx.wheelPending.delete(k);
    }, 0.5));
  }
  return node;
}
