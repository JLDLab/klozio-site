// Carte « CA signé X sur Y — Z % capturé » (§4.6), partagée par l'accueil et le profil.
import { texts } from '../content/texts.js';
import { h } from './dom.js';
import { revenueSummary } from '../game/progress.js';

export function revenueCard(ctx) {
  const ui = texts.ui;
  const unit = ctx.edition.valueUnit;
  const r = revenueSummary(ctx.save, ctx.deals);
  const pct = Math.round(r.share * 100);
  const signed = ui.amount(r.signed, unit);
  const possible = ui.amount(r.possible, unit);
  return h('section.card.revenue', { 'aria-label': ui.revenueAria(signed, possible, pct) },
    h('span.eyebrow', {}, ui.revenueLabel),
    h('b', {}, signed),
    h('p', {}, ui.revenueOf(possible, pct)),
    h('span.meter', { 'aria-hidden': 'true' }, h('i', { style: { width: `${pct}%`, background: 'var(--mid)' } })),
    h('p.small.muted', {}, ctx.partial?.() ? ui.signedFree(r.signedCount, ctx.deals.length) : ui.signedDeals(r.signedCount, ctx.deals.length)));
}
