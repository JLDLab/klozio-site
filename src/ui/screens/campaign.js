// Campagne : deals par type de vente, verdict obtenu et valeur. Deals ouverts au fil des signatures.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h, svg } from '../dom.js';
import { gradeIcon } from '../icons.js';
import { saleTypeIllustration } from '../illustrations.js';
import { campaignGroups } from '../../game/campaign.js';
import { duelSegment } from '../../content/editions/index.js';

// M10-A : sous la liste, quand seuls les deals gratuits sont publiés. Pas de lien de paiement pour l'instant.
export function fullEditionCard(ctx) {
  const ui = texts.ui;
  return h('section.card.full-edition', {},
    h('span.eyebrow', {}, ui.fullEditionTitle),
    h('h2', {}, ui.fullEditionCount(ctx.dealsTotal, duelSegment(ctx.edition.id))),
    h('p', {}, ui.fullEditionBody(config.pricing.edition, config.pricing.bundle)),
    h('button.ghost', { type: 'button', disabled: true }, ui.fullEditionSoon));
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
  if (ctx.partial()) root.append(fullEditionCard(ctx));
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
