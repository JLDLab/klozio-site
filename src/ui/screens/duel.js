// Relever un défi (§4.8) : saisie d'un code, contrôle, lancement du même deal.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { h } from '../dom.js';
import { decodeDuel } from '../../game/duel.js';
import { duelSegment } from '../../content/editions/index.js';

// Format affiché d'un code de défi pour une édition : KLZ-AE-XXXXX, KLZ-VP-XXXXX.
const codeFormat = (edition) => `${config.duel.prefix}-${duelSegment(edition.id)}-${'X'.repeat(config.duel.payloadChars + 1)}`;

// Deal visé par un code, ou { error } avec la raison affichable.
export function resolveDuel(code, ctx) {
  const ui = texts.ui;
  const d = decodeDuel(code, ctx.edition.stages.length);
  if (!d.ok) return { error: d.error === 'check' ? ui.duelBadCheck : ui.duelBadFormat(codeFormat(ctx.edition)) };
  if (d.edition !== ctx.edition.id) {
    const other = ctx.catalogue.find((e) => e.id === d.edition);
    return { error: other ? ui.duelOtherEdition(other.name) : ui.duelBadFormat(codeFormat(ctx.edition)) };
  }
  const deal = ctx.deals.find((x) => x.num === d.num);
  // M10-A : un deal de l'édition complète (non publié) a un numéro valide mais n'est pas dans ctx.deals
  if (!deal) return { error: ctx.partial() && d.num <= ctx.dealsTotal ? ui.inFullEdition : ui.duelNoDeal };
  return { deal, grades: d.grades };
}

export function duelScreen(root, { code: initial = '' } = {}, ctx) {
  const ui = texts.ui;
  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.duelTitle)));
  root.append(h('p.muted', {}, ui.duelHint));

  const input = h('input.code-input', {
    type: 'text', value: initial, placeholder: ui.duelPlaceholder(codeFormat(ctx.edition)), autocomplete: 'off', autocapitalize: 'characters',
    spellcheck: 'false', 'aria-label': ui.duelInputAria, enterkeyhint: 'go',
  });
  const message = h('p.duel-msg', { role: 'status' });
  const go = () => {
    const r = resolveDuel(input.value, ctx);
    if (r.error) {
      message.textContent = r.error;
      message.className = 'duel-msg bad';
      input.focus();
      return;
    }
    ctx.go('game', { id: r.deal.id, duel: { code: input.value.trim().toUpperCase(), grades: r.grades } });
  };
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } });
  root.append(h('section.card.duel', {}, input, h('button.cta', { type: 'button', onclick: go }, ui.duelPlay), message));
  queueMicrotask(() => input.focus());
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
