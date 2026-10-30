// Première visite (M17-A) : tant qu'aucun deal n'est terminé dans l'édition affichée, l'accueil (ordinateur et mobile)
// ne montre qu'un bloc centré — « Ton premier deal. 3 minutes. Tu signes ou tu perds. », le titre et l'accroche du
// premier deal imposé (config.content.firstDeal), « Jouer », et en lien discret « Voir tous les deals ». Après le
// premier deal terminé, l'accueil complet. Aussi : le seuil d'achat (config.offers.buyAfter) et la ligne de crédibilité.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h } from '../dom.js';

export const dealsPlayed = (save) => (save.deals || []).length;
export const isFirstVisit = (save) => dealsPlayed(save) === 0;
// Carte d'achat, ligne « Débloquer » du débrief : à partir de config.offers.buyAfter deals terminés.
export const buyReady = (save, cfg = config) => dealsPlayed(save) >= cfg.offers.buyAfter;

// Premier deal imposé de l'édition, s'il est dans la liste des deals jouables (sinon null : accueil complet).
export function firstDeal(deals, editionId, cfg = config) {
  const id = cfg.content.firstDeal[editionId];
  return (id && deals.find((d) => d.id === id)) || null;
}

// « Voir tous les deals » sur ordinateur : l'accueil complet pour le reste de la session (en mémoire seulement).
let seeAll = false;
export const wantsAll = () => seeAll;
export function showAll(on = true) { seeAll = on; } // false : remise à zéro (selftest)

// Le bloc de première visite. `onAll` : « Voir tous les deals » (la campagne).
export function firstVisitBlock(ctx, deal, onAll) {
  const ui = texts.ui;
  const play = h('button.cta', { type: 'button', onclick: () => ctx.go('game', { id: deal.id }) }, ui.fvPlay);
  const block = h('section.card.first-visit', { 'aria-labelledby': 'fv-title' },
    h('p.fv-lead', {}, ui.fvLead(config.ui.dealMinutes)),
    h('h2', { id: 'fv-title' }, deal.title),
    h('p.muted', {}, contactLine(deal.contact)),
    h('p.fv-hook', {}, deal.steps[0].context),
    play,
    h('button.link.fv-all', { type: 'button', onclick: onAll }, ui.fvAll));
  queueMicrotask(() => play.focus({ preventScroll: true }));
  return block;
}

// Ligne de crédibilité sous le logo : le nombre de situations vient du catalogue de la langue (offre publiée : Tout
// KLOZIO), jamais écrit en dur ; sans ce chiffre (mode développeur), pas de ligne.
export function credLine(ctx, cls = 'p.cred') {
  const n = ctx.offer?.all;
  return n ? h(cls, {}, texts.ui.credLine(n)) : null;
}
