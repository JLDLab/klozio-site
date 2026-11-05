// Profil : roue, titre, maîtrise par compétence, historique des 20 derniers deals.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { h, svg } from '../dom.js';
import { gradeIcon } from '../icons.js';
import { wheelSvg } from '../wheel.js';
import { mastery, titleIndex, wheelProgress } from '../../game/progress.js';
import { revenueCard } from '../revenue.js';
import { dayKey, currentStreak } from '../../game/daily.js';

export function profileScreen(root, _params, ctx) {
  const ui = texts.ui;
  const { save, edition } = ctx;
  const stages = edition.stages;
  const titles = edition.profileTitles;
  const t = titleIndex(save, edition);
  const parts = stages.filter((s) => save.wedges[s.key]).length;

  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.profileTitle)));

  root.append(h('section.card.board', {},
    svg(wheelSvg(132, save.wedges, edition, { progress: Object.fromEntries(wheelProgress(save, edition).map((x) => [x.stage.key, x.hits / x.required])) })),
    h('div', {},
      h('span.eyebrow', {}, ui.titleLabel),
      h('h2', {}, titles[t]),
      t + 1 < titles.length ? h('p', {}, ui.nextTitle(titles[t + 1])) : null,
      h('p.small.muted', {}, ui.titleHint(config.mastery.window)),
      h('p.count', {}, ui.wheelCount(parts, stages.length)),
      h('p.count', {}, ui.streak(currentStreak(save, dayKey()))))));

  root.append(revenueCard(ctx));

  root.append(h('section.card.mastery', {},
    h('span.eyebrow', {}, ui.masteryTitle),
    h('p.muted.small', {}, ui.masteryHint(config.mastery.window)),
    stages.map((s) => {
      const m = mastery(save, s.key);
      return h('div.mastery-row', {},
        h('span', {}, s.name),
        h('span.meter', { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': m === null ? 0 : Math.round(m * 100), 'aria-label': ui.masteryAria(s.name, m) },
          h('i', { style: { width: `${Math.round((m ?? 0) * 100)}%`, background: `var(--stage-${s.key})` } })),
        h('span.mono.muted', {}, ui.masteryValue(m)));
    })));

  const historyCard = h('section.card.history', {}, h('span.eyebrow', {}, ui.historyTitle));
  if (save.deals.length === 0) historyCard.append(h('p.muted', {}, ui.noHistory));
  for (const entry of save.deals) {
    const deal = ctx.allDeals.find((d) => d.id === entry.id);
    historyCard.append(h('div.history-row', {},
      h('span', {}, deal ? deal.title : ctx.partial() ? ui.fullEditionDeal : ui.deletedDeal),
      h('span.pips', { 'aria-label': entry.grades.map((g) => texts.grades[g]).join(', ') },
        entry.grades.map((g) => h(`span.g${g}`, {}, svg(gradeIcon(g, 14))))),
      h(`span.st.${entry.verdict}`, {}, entry.verdict === 'signed' && entry.revenue ? ctx.money(entry.revenue) : texts.bestVerdicts[entry.verdict])));
  }
  root.append(historyCard);
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
