// M22 — le héros dans l'accueil (mobile et ordinateur) : première visite (titre, carte, « Jouer », ligne de
// crédibilité, « Voir tous les deals »), ou carte compacte au-dessus du deal du jour en visite suivante. Le balisage
// vient de ui/hero.js, le même que le héros statique publié dans index.html.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { heroFor } from '../../content/hero.js';
import { h } from '../dom.js';
import { heroCard, heroPage, mountHero, toDom } from '../hero.js';

// L'étape du héros pour l'édition et la langue en cours, ou null (autre édition, Pack Live, langue sans ce deal).
export function heroData(ctx, cfg = config) {
  if (ctx.edition.live || ctx.edition.id !== cfg.content.hero.edition) return null;
  return heroFor(ctx.lang, cfg);
}

const fromTree = (tree) => toDom(tree, h);

// Clic sur une option : la boucle s'arrête, puis ce deal s'ouvre, l'option prise en compte comme premier choix (partie
// normale, mesurée : son deal_start part de l'écran de partie). La boucle démarre une fois la carte dans le document
// affiché (elle mesure la place du verdict). Retourne { stop }.
function start(card, ctx, data) {
  let loop = null;
  const stop = () => { if (loop) loop.stop(); else loop = { stop() {} }; };
  card.addEventListener('click', (e) => {
    const b = e.target.closest('.hero-opt');
    if (!b) return;
    stop();
    ctx.go('game', { id: data.id, pick: Number(b.getAttribute('data-i')) });
  });
  queueMicrotask(() => { if (card.isConnected && card.ownerDocument === globalThis.document && !loop) loop = mountHero(card, data, texts, { options: ctx.prefs.options }); });
  return { stop };
}

// Carte compacte (visite suivante).
export function heroCompact(ctx, data) {
  const node = fromTree(heroCard(data, texts, { compact: true }));
  return { node, ...start(node, ctx, data) };
}

// Première visite. `onAll` : « Voir tous les deals ». « Jouer » ouvre le deal du héros (validé 16/11/2026 ; le premier
// deal imposé, config.content.firstDeal, reste celui des éditions sans héros). La ligne de crédibilité arrive avec
// l'index des deals (fillCred).
export function heroFirstVisit(ctx, data, { onAll }) {
  // M22 : la page de première visite déjà à l'écran (héros statique publié, même balisage) est reprise, une seule fois
  const node = ctx.staticPage?.querySelector('.hero-opt') ? ctx.staticPage : fromTree(heroPage(data, texts));
  ctx.staticPage = null;
  node.querySelector('.hero-play').addEventListener('click', () => ctx.go('game', { id: data.id }));
  node.querySelector('.fv-all').addEventListener('click', onAll);
  const slot = node.querySelector('.cred-slot');
  const fillCred = (line) => slot.replaceChildren(...[line].filter(Boolean));
  return { node, fillCred, ...start(node.querySelector('.hero'), ctx, data) };
}
