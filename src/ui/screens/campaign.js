// Campagne : deals par type de vente, verdict obtenu et valeur. Deals ouverts au fil des signatures.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h, svg } from '../dom.js';
import { gradeIcon, lockIcon } from '../icons.js';
import { saleTypeIllustration } from '../illustrations.js';
import { campaignGroups } from '../../game/campaign.js';
import { duelSegment } from '../../content/editions/index.js';
import { pagePath } from '../../core/lang.js';
import { buyReady } from './first-visit.js';

// M10-A : sous la liste, quand seuls les deals gratuits sont publiés.
// M12 : « J'ai un code » ouvre l'édition complète (codes du test fermé, puis achats du lot B).
// M13 : « Voir les offres » ouvre la page offres/ du site ; absent de l'app Play (pas de prix dans l'app).
export function offersButton(ctx) {
  if (ctx.play) return null;
  return h('button.ghost.offers-button', { type: 'button', onclick: () => location.assign(pagePath('offres', ctx.lang)) }, texts.ui.offersButton);
}

// M10-B lot B : « Acheter » ouvre le Payment Link Stripe de l'édition ; Stripe renvoie ensuite sur code/ (le code).
// Absent de l'app Play, comme les offres.
// M17-A : un seul bouton bleu plein par écran ; « Acheter » ne l'est que là où il est l'action principale (campagne).
function buyButton(ctx, primary = false) {
  const url = config.offers.buy[ctx.edition.id];
  if (ctx.play || !url) return null;
  return h(primary ? 'button.cta' : 'button.ghost', { type: 'button', onclick: () => location.assign(url) }, texts.ui.buyButton(config.offers.edition));
}

// Chiffres : ceux des offres (index publié, M13), sinon le total de l'édition complète.
export function fullEditionCard(ctx, { primary = false } = {}) {
  const ui = texts.ui;
  return h('section.card.full-edition', {},
    h('span.eyebrow', {}, ui.fullEditionTitle(duelSegment(ctx.edition.id))),
    h('h2', {}, ui.fullEditionCount(ctx.offer?.edition ?? ctx.dealsTotal, duelSegment(ctx.edition.id))),
    ctx.offer ? h('p.mono', {}, ui.fullEditionAll(ctx.offer.all)) : null,
    h('p', {}, ctx.play ? ui.fullEditionPlay : ui.fullEditionBody(config.offers.seats)),
    buyButton(ctx, primary),
    h('button.ghost', { type: 'button', onclick: () => ctx.go('code') }, ui.codeButton),
    offersButton(ctx));
}

// M17-A : au débrief, sous « Deal suivant », une ligne vers les offres, à partir de 2 deals terminés ; ni dans l'app
// Play, ni une fois l'édition débloquée.
export function unlockLine(ctx) {
  if (ctx.play || !ctx.partial?.() || !buyReady(ctx.save)) return null;
  return h('a.unlock-line', { href: pagePath('offres', ctx.lang) },
    texts.ui.unlockLine(ctx.offer?.edition ?? ctx.dealsTotal, duelSegment(ctx.edition.id), config.offers.edition));
}

// M17-B : joueur gratuit, deals de l'édition encore fermés = deals de l'édition à son prix (offre publiée) moins les
// gratuits ; jamais le catalogue entier.
export const lockedCount = (ctx) => Math.max(0, (ctx.offer?.edition ?? ctx.dealsTotal) - ctx.deals.length);

// Les deals de l'édition complète, sous un cadenas : leur nombre, puis les offres (ou « J'ai un code » dans l'app Play).
function lockedMore(ctx) {
  const ui = texts.ui;
  const more = lockedCount(ctx);
  return h('button.deal-card.locked-more', {
    type: 'button',
    onclick: () => (ctx.play ? ctx.go('code') : location.assign(pagePath('offres', ctx.lang))),
  },
  svg(lockIcon(18)),
  h('span.main', {}, h('b', {}, ui.dkLockedMore(more, duelSegment(ctx.edition.id))), h('span.small.muted', {}, ctx.play ? ui.codeButton : ui.dkLockedOpen(duelSegment(ctx.edition.id)))));
}

const verdictGrade = { signed: 3, delayed: 1, lost: 0 };

export function dealCard(deal, best, ctx, { locked = false } = {}) {
  const ui = texts.ui;
  return h('button.deal-card', {
    type: 'button',
    disabled: locked,
    'aria-label': locked ? `${deal.title}, ${ui.locked}` : null,
    onclick: locked ? null : () => ctx.go('game', { id: deal.id }),
  },
  h('span.main', {},
    deal.status !== config.content.publicStatus ? h('span.draft', {}, ui.draftBanner) : null,
    h('h3', {}, deal.title),
    h('span.who', {}, contactLine(deal.contact)),
    config.content.showDifficulty ? h('span.who', {}, ui.difficulty(deal.difficulty, config.deal.maxDifficulty)) : null),
  h('span.side', {},
    h('span.val', {}, ctx.money(deal.value)),
    locked
      ? h('span.st', {}, ui.locked)
      : best
        ? h(`span.st.${best.verdict}`, {}, svg(gradeIcon(verdictGrade[best.verdict], 14)),
          best.verdict === 'signed' && best.revenue ? ui.bestAmount(best.revenue, ctx.edition.valueUnit) : texts.bestVerdicts[best.verdict])
        : h('span.st', {}, ui.notPlayed)));
}

export function campaignScreen(root, _params, ctx) {
  const ui = texts.ui;
  if (ctx.dev) root.append(h('div.banner', {}, ui.devBanner));
  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.campaignTitle)));
  root.append(h('p.muted', {}, config.campaign.lockEnabled ? ui.campaignHintLocked : ui.campaignHint));

  const groups = campaignGroups(ctx.deals, ctx.save, ctx.edition, { dev: ctx.dev });
  if (groups.length === 0) {
    root.append(h('section.card.empty', {}, h('p', {}, ui.noDeals), h('p.muted', {}, ui.noDealsHint)));
  }
  for (const g of groups) {
    const locked = g.entries.some((e) => !e.unlocked);
    root.append(h('section.group', { 'aria-label': ctx.et.saleTypes[g.type] },
      h('div.group-head', {},
        svg(saleTypeIllustration(g.type)),
        h('div', {}, h('h2', {}, ctx.et.saleTypes[g.type]), h('p.mono.muted', {}, ui.groupProgress(g.signed, g.total)))),
      h('div.deals', {}, g.entries.map((e) => dealCard(e.deal, e.best, ctx, { locked: !e.unlocked }))),
      locked ? h('p.muted.small', {}, ui.lockedHint) : null));
  }
  // M17-A : avant 2 deals terminés, pas de carte d'achat ; les deals non publiés restent derrière un cadenas qui mène
  // aux offres (dans l'app Play, à « J'ai un code »)
  if (ctx.partial()) root.append(buyReady(ctx.save) ? fullEditionCard(ctx, { primary: true }) : lockedMore(ctx));
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
