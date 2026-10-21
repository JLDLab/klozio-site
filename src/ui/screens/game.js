// Partie : roue des 5 étapes, jauge, scène, 3 options. Révélation sur place après le choix (A8).
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { h, svg } from '../dom.js';
import { stageIcon } from '../icons.js';
import { wheelSvg } from '../wheel.js';
import { choiceList } from '../choices.js';
import { startDeal, choose, isOver, result } from '../../game/deal.js';
import { isOfficial, startDaily } from '../../game/daily.js';
import { reducedMotion } from '../theme.js';
import { dealHead } from '../head.js';

// params.step et params.preview : utilisés par l'aperçu de l'éditeur (src/tools/preview.html).
// params.daily : AAAAMMJJ si la partie est le deal du jour (premier essai officiel, ensuite entraînement).
// params.duel : { code, grades } si la partie relève un défi (comparaison au débrief).
export function gameScreen(root, { id, step: startStep = 0, preview = false, daily = null, duel = null }, ctx) {
  const deal = ctx.deals.find((d) => d.id === id);
  if (!deal) {
    queueMicrotask(() => ctx.go('home', {}, { push: false }));
    return {};
  }
  const ui = texts.ui;
  const stages = ctx.edition.stages;
  const run = startDeal(deal, ctx.edition);
  const official = Boolean(daily) && isOfficial(ctx.save, daily);
  let revealed = false;
  let lastDelta = null;
  let lastEvent = null;
  // aperçu : avance jusqu'à l'étape demandée en jouant les meilleures réponses
  while (run.step < Math.min(startStep, deal.steps.length - 1)) {
    choose(run, deal.steps[run.step].options.findIndex((o) => o.grade === 3));
  }

  // M8 v2 : roue du deal (géométrie du O du logo). Étape notée = part remplie à la couleur de la note, les autres
  // vides. La part qui vient d'être notée apparaît animée.
  function dealWheel() {
    const current = revealed ? run.step - 1 : run.step;
    return svg(wheelSvg(76, {}, ctx.edition, {
      grades: run.grades, filled: revealed ? current : -1, label: false,
    }));
  }

  function gauge() {
    const range = config.deal.maxTemp - config.deal.minTemp;
    const pos = (t) => `${((t - config.deal.minTemp) / range) * 100}%`;
    const marker = h('i', { style: { left: pos(lastDelta === null ? run.temp : run.temp - lastDelta) } });
    const delta = lastDelta === null ? null
      : h('span.delta', { style: { color: lastDelta > 0 ? 'var(--good)' : lastDelta < 0 ? 'var(--fg)' : 'var(--muted)' } },
        ui.tempDelta(lastDelta));
    const node = h('div.gauge', { role: 'meter', 'aria-valuemin': config.deal.minTemp, 'aria-valuemax': config.deal.maxTemp, 'aria-valuenow': run.temp, 'aria-label': ui.gaugeAria(run.temp) },
      h('div.gauge-row', {}, h('span', {}, ui.temperature), h('span', {}, h('b', {}, run.temp), delta)),
      h('div.bar', {},
        h('span.tick', { style: { left: pos(config.deal.thresholds.delayed) } }),
        h('span.tick', { style: { left: pos(config.deal.thresholds.signed) } }),
        marker),
      h('div.gauge-scale', {},
        h('span', {}, ui.cold),
        h('span.th', { style: { left: pos(config.deal.thresholds.delayed) } }, texts.gaugeMarks.delayed),
        h('span.th', { style: { left: pos(config.deal.thresholds.signed) } }, texts.gaugeMarks.signed),
        h('span', {}, ui.hot)));
    // la jauge glisse de l'ancienne à la nouvelle valeur
    if (lastDelta !== null) requestAnimationFrame(() => requestAnimationFrame(() => { marker.style.left = pos(run.temp); }));
    return node;
  }

  function render() {
    root.replaceChildren();
    const index = revealed ? run.step - 1 : run.step;
    const step = deal.steps[index];
    const stage = stages[index];

    root.append(dealHead(deal, h('div.topbar', {},
      preview ? h('span') : h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
      h('div.meta', {}, h('b', {}, deal.title), h('span', {}, `${ctx.money(deal.value)} · ${ui.stepOf(index + 1, stages.length)}`),
        deal.vecu ? h('span.lived', {}, ui.lived) : null))));
    if (daily) root.append(h('p.mode-tag', {}, official ? ui.dailyOfficial : ui.dailyTraining));
    if (duel) root.append(h('p.mode-tag', {}, ui.duelTag(duel.code)));
    root.append(h('div.dealbar', {}, dealWheel(), gauge()));

    root.append(h('section.card.scene', {},
      h('div.stage', { style: { color: `var(--stage-${stage.key})` } }, svg(stageIcon(stage)), stage.name,
        ctx.edition.valueStages.includes(stage.key) ? h('span.value-tag', {}, ui.valueStage) : null),
      h('p.ctx', {}, step.context),
      h('h2.ask', { id: 'ask' }, step.question)));

    root.append(choiceList(step, {
      revealed,
      picked: revealed ? run.picks[index] : null,
      onPick: pick,
      extra: () => (run.impacts[index] < 0 ? h('span.cost', {}, ui.valueCost(Math.round(-run.impacts[index] * 100))) : null),
    }));

    if (revealed) {
      // A9 : la note et la conséquence du choix sont annoncées aux lecteurs d'écran
      const o = step.options[run.picks[index]];
      root.append(h('p.sr-only', { role: 'status' },
        `${ui.revealAnnounce(run.picks[index] + 1, texts.grades[o.grade], o.feedback)} ${ui.tempAnnounce(run.temp)}`));
    }

    if (revealed && lastEvent) {
      root.append(h('section.card.event', { role: 'status' },
        h('span.eyebrow', {}, ui.eventTitle),
        h('p', {}, lastEvent.text),
        h('p.event-temp', {}, ui.eventEffect(lastEvent.temp))));
    }

    if (revealed) {
      const last = isOver(run);
      const btn = h('button.cta', { type: 'button', onclick: next }, last ? ui.finish : ui.next);
      root.append(btn);
      if (step.post) root.append(lessonButton(step.post));
      btn.focus({ preventScroll: true });
      if (!preview) btn.scrollIntoView({ block: 'nearest', behavior: reducedMotion(ctx.prefs?.options || {}) ? 'auto' : 'smooth' });
    } else {
      root.append(h('p.keyhint', {}, ui.keyHint));
      window.scrollTo(0, 0);
    }
  }

  // Leçon de l'étape à partager : copiée dans le presse-papier, aucune intégration réseau.
  function lessonButton(post) {
    const status = h('p.small.muted.lesson-msg', { role: 'status' });
    return h('div.lesson', {},
      h('button.link', {
        type: 'button',
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(ui.lessonText(post.t, post.h, config.brand.name));
            status.textContent = ui.lessonCopied;
          } catch {
            status.textContent = ui.lessonCopyFailed;
          }
        },
      }, ui.shareLesson),
      status);
  }

  function pick(i) {
    if (revealed) return;
    if (official && run.step === 0 && startDaily(ctx.save, daily, deal.id)) ctx.persist();
    const outcome = choose(run, i);
    ctx.sound?.play('click');
    ctx.sound?.play('reveal', outcome.grade);
    lastDelta = outcome.delta;
    lastEvent = outcome.event;
    revealed = true;
    render();
  }

  function next() {
    if (!revealed) return;
    if (isOver(run)) {
      if (preview) return;
      ctx.go('debrief', { id: deal.id, result: result(run), daily, official, duel }, { push: false });
      return;
    }
    revealed = false;
    lastDelta = null;
    lastEvent = null;
    render();
  }

  render();
  return {
    onKey(ev) {
      if (!revealed && ['1', '2', '3'].includes(ev.key)) {
        const i = Number(ev.key) - 1;
        if (i < deal.steps[run.step].options.length) { ev.preventDefault(); pick(i); }
      } else if (revealed && ev.key === 'Enter') {
        ev.preventDefault();
        next();
      } else if (ev.key === 'Escape') {
        history.back();
      }
    },
  };
}
