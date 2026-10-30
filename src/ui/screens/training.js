// Entraînement ciblé (§4.9) : choix d'une compétence, puis 5 étapes de cette compétence tirées de deals
// différents, révélation comme en partie, bilan de maîtrise. Pas de température, pas de montant.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h, svg } from '../dom.js';
import { gradeIcon, stageIcon, checkIcon } from '../icons.js';
import { choiceList } from '../choices.js';
import { drawTraining, applyTraining } from '../../game/training.js';
import { mastery } from '../../game/progress.js';
import { reducedMotion } from '../theme.js';

export function trainingScreen(root, _params, ctx) {
  const ui = texts.ui;
  const { edition, save } = ctx;
  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.trainingTitle)));
  root.append(h('p.muted', {}, ui.trainingHint(Math.min(config.training.steps, ctx.deals.length))));
  root.append(h('nav.stack', { 'aria-label': ui.trainingTitle }, edition.stages.map((s) => {
    const m = mastery(save, s.key);
    return h('button.ghost.wide.skill', {
      type: 'button',
      disabled: ctx.deals.length === 0,
      onclick: () => ctx.go('drill', { stage: s.key, seed: Date.now() >>> 0 }),
    },
    h('span', { style: { color: `var(--stage-${s.key})` } }, svg(stageIcon(s)), ' ', h('b', { style: { color: 'var(--fg)' } }, s.name)),
    h('span.mono.muted', {}, ui.masteryValue(m)));
  })));
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}

export function drillScreen(root, { stage: stageKey, seed }, ctx) {
  const ui = texts.ui;
  const { edition } = ctx;
  const stage = edition.stages.find((s) => s.key === stageKey);
  const items = stage ? drawTraining(ctx.deals, edition, stageKey, seed) : [];
  if (!items.length) {
    queueMicrotask(() => ctx.go('home', {}, { push: false }));
    return {};
  }
  const picks = [];
  let index = 0;
  let revealed = false;

  function track() {
    return h('div.track', { 'aria-hidden': 'true', style: { gridTemplateColumns: `repeat(${items.length},1fr)` } }, items.map((_, i) => {
      const done = i < picks.length && !(revealed && i === index);
      const state = done ? 'done' : i === index ? 'now' : 'next';
      return h(`div.seg.${state}`, { style: done ? { background: `var(--stage-${stage.key})` } : null }, i + 1, done ? svg(checkIcon(12)) : null);
    }));
  }

  function render() {
    root.replaceChildren();
    const { deal, step: si } = items[index];
    const step = deal.steps[si];
    root.append(h('div.topbar', {},
      h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
      h('div.meta', {}, h('b', {}, ui.trainingOf(stage.name)), h('span', {}, ui.stepOf(index + 1, items.length)))));
    root.append(track());
    root.append(h('section.card.scene', {},
      h('div.stage', { style: { color: `var(--stage-${stage.key})` } }, svg(stageIcon(stage)), stage.name),
      h('p.small.muted', {}, `${deal.title} · ${contactLine(deal.contact)}`),
      h('p.ctx', {}, step.context),
      h('h2.ask', { id: 'ask' }, step.question)));
    root.append(choiceList(step, { revealed, picked: revealed ? picks[index] : null, onPick: pick }));
    if (revealed) {
      const o = step.options[picks[index]];
      root.append(h('p.sr-only', { role: 'status' }, ui.revealAnnounce(picks[index] + 1, texts.grades[o.grade], o.feedback)));
    }
    if (revealed) {
      const btn = h('button.cta', { type: 'button', onclick: next }, index + 1 < items.length ? ui.next : ui.trainingFinish);
      root.append(btn);
      btn.focus({ preventScroll: true });
      btn.scrollIntoView({ block: 'nearest', behavior: reducedMotion(ctx.prefs.options) ? 'auto' : 'smooth' });
    } else {
      root.append(h('p.keyhint', {}, ui.keyHint));
      window.scrollTo(0, 0);
    }
  }

  function pick(i) {
    if (revealed) return;
    picks.push(i);
    ctx.sound?.play('click');
    ctx.sound?.play('reveal', items[index].deal.steps[items[index].step].options[i].grade);
    revealed = true;
    render();
  }

  function next() {
    if (!revealed) return;
    revealed = false;
    if (index + 1 < items.length) {
      index += 1;
      render();
    } else summary();
  }

  function summary() {
    const grades = items.map(({ deal, step }, i) => deal.steps[step].options[picks[i]].grade);
    const { before, after } = applyTraining(ctx.save, stage.key, grades);
    ctx.persist();
    const seniors = grades.filter((g) => g === Math.max(...config.deal.grades)).length;
    root.replaceChildren();
    root.append(h('div.topbar', {},
      h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
      h('h1.page-title', {}, ui.trainingTitle)));
    root.append(h('section.card.drill-sum', { 'aria-live': 'polite' },
      h('span.eyebrow', { style: { color: `var(--stage-${stage.key})` } }, stage.name),
      h('h2', {}, ui.trainingScore(seniors, grades.length)),
      h('p.mono', {}, ui.trainingMastery(ui.masteryValue(before), ui.masteryValue(after)))));
    root.append(h('section.card.steps', {},
      h('span.eyebrow', {}, ui.decisions),
      items.map(({ deal }, i) => h('div.step-row.drill-row', {},
        h('span', {}, deal.title),
        h(`span.g.g${grades[i]}`, {}, svg(gradeIcon(grades[i], 16)), texts.grades[grades[i]])))));
    const again = h('button.cta', { type: 'button', onclick: () => ctx.go('drill', { stage: stage.key, seed: (seed + 1) >>> 0 }, { push: false }) }, ui.trainingAgain);
    root.append(h('div.row', {},
      h('button.ghost', { type: 'button', onclick: () => ctx.go('training', {}, { push: false }) }, ui.trainingOther), again));
    again.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  render();
  return {
    onKey(ev) {
      if (!revealed && ['1', '2', '3'].includes(ev.key) && picks.length === index) {
        ev.preventDefault();
        pick(Number(ev.key) - 1);
      } else if (revealed && ev.key === 'Enter') {
        ev.preventDefault();
        next();
      } else if (ev.key === 'Escape') {
        history.back();
      }
    },
  };
}
