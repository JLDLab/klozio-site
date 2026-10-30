// Roue des 5 étapes (M8 v2) : géométrie du O du logo. Cercle r56 sur un viewBox de 120, 5 secteurs depuis midi,
// séparateurs de 5 en couleur du fond, contour de 6 en chocolat. Part remplie = bleu, « passe » = miel,
// « faute » = corail, à venir = vide. Une part qui vient de se remplir apparaît en scale(0,6 → 1) depuis le centre.
import { texts } from '../content/texts.js';

const C = 60;
const R = 56;
const gradeFill = { 3: 'var(--accent)', 1: 'var(--mid)', 0: 'var(--bad)' };

// Accueil, profil, débrief : `wedges` = parts gagnées ; `progress` (optionnel) : { clé → part de 0 à 1 }, une part en
// cours se remplit depuis le centre ; `highlight` : parts gagnées à l'instant (animées).
// Partie : `grades` = notes des étapes jouées (3, 1, 0), `filled` = étape qui vient d'être notée (animée).
// Sans `label`, la roue est décorative (aria-hidden). Pas de lettres dans la roue : elle se lit comme le O du logo.
export function wheelSvg(size, wedges, edition, { highlight = [], progress = {}, grades = null, filled = -1, label = true } = {}) {
  const keys = edition.stages.map((s) => s.key);
  const n = keys.length;
  const angle = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const p = (a, rr) => `${(C + rr * Math.cos(a)).toFixed(2)} ${(C + rr * Math.sin(a)).toFixed(2)}`;
  const sector = (i, rr) => `M${C} ${C} L${p(angle(i), rr)} A${rr} ${rr} 0 0 1 ${p(angle(i + 1), rr)} Z`;
  let parts = '';
  keys.forEach((k, i) => {
    const grade = grades ? grades[i] : wedges[k] ? 3 : undefined;
    const fill = gradeFill[grade];
    const anim = (grades ? i === filled : highlight.includes(k)) ? ' class="part-in"' : '';
    if (fill) parts += `<path${anim} d="${sector(i, R)}" fill="${fill}"/>`;
    else if (progress[k] > 0) parts += `<path d="${sector(i, R * progress[k])}" fill="var(--mid)"/>`; // M17-A : la progression en miel
  });
  const seps = keys.map((_, i) => `M${C} ${C} L${p(angle(i), R)}`).join(' ');
  const body = `${parts}<path d="${seps}" stroke="var(--bg)" stroke-width="5" stroke-linecap="round"/>`
    + `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="var(--fg)" stroke-width="6"/>`;
  const won = keys.filter((k) => wedges[k]).length;
  const aria = label ? `role="img" aria-label="${texts.ui.wheelAria(won, n)}"` : 'aria-hidden="true"';
  return `<svg class="wheel" width="${size}" height="${size}" viewBox="0 0 120 120" ${aria}>${body}</svg>`;
}
