// Partie : roue des 5 étapes, jauge, scène, 3 options. Révélation sur place après le choix (A8).
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { h, svg } from '../dom.js';
import { stageIcon, checkIcon } from '../icons.js';
import { wheelSvg } from '../wheel.js';
import { choiceList } from '../choices.js';
import { startDeal, choose, isOver, result } from '../../game/deal.js';
import { isOfficial, startDaily } from '../../game/daily.js';
import { reducedMotion } from '../theme.js';
import { dealHead } from '../head.js';
import { ghostOut, verdictHaptic, countTo } from '../feel.js';
import { verdictSound } from '../../audio/sound.js';
import { track, trackDealEnd } from '../../measure/beacon.js';
import { reportScore } from '../../access/team.js';
import { isDesktop, onDesktopChange } from '../desktop.js';
import { contactLine } from '../../content/schema.js';

// params.step et params.preview : utilisés par l'aperçu de l'éditeur (src/tools/preview.html).
// params.daily : AAAAMMJJ si la partie est le deal du jour (premier essai officiel, ensuite entraînement).
// params.duel : { code, grades } si la partie relève un défi (comparaison au débrief).
// M16 lot B : à partir de config.ui.desktopMinPx (et hors aperçu), rendu ordinateur de la même partie (renderDesktop).
export function gameScreen(root, { id, step: startStep = 0, preview = false, daily = null, duel = null, desktop: forced }, ctx) {
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
  let fx = ''; // M18 : .fx au rendu qui suit un choix, .fx-enter à l'entrée d'une scène (une seule fois chacun)
  // aperçu : avance jusqu'à l'étape demandée en jouant les meilleures réponses
  while (run.step < Math.min(startStep, deal.steps.length - 1)) {
    choose(run, deal.steps[run.step].options.findIndex((o) => o.grade === 3));
  }
  if (!preview) track('deal_start', ctx.edition.id);
  ctx.sound?.warm?.();
  let desktop = !preview && (forced ?? isDesktop());

  // M8 v2 : roue du deal (géométrie du O du logo). Étape notée = part remplie à la couleur de la note, les autres
  // vides. La part qui vient d'être notée apparaît animée.
  function dealWheel() {
    const current = revealed ? run.step - 1 : run.step;
    return svg(wheelSvg(76, {}, ctx.edition, {
      grades: run.grades, filled: revealed ? current : -1, label: false,
    }));
  }

  // M18 : au rendu qui suit un choix, le chiffre compte et la jauge glisse en même temps, le delta paraît puis s'efface.
  const deltaTone = () => (lastDelta > 0 ? '.up' : lastDelta < 0 ? '.down' : ''); // le chiffre reste chocolat, le delta porte la couleur

  function tempMotion(number, slide) {
    const options = ctx.prefs?.options || {};
    countTo(number, { from: run.temp - lastDelta, to: run.temp, ms: config.feel.tempCountMs, options });
    if (!reducedMotion(options)) requestAnimationFrame(() => requestAnimationFrame(slide));
  }

  function gauge(motion) {
    const range = config.deal.maxTemp - config.deal.minTemp;
    const pos = (t) => `${((t - config.deal.minTemp) / range) * 100}%`;
    const sliding = motion === '.fx' && !reducedMotion(ctx.prefs?.options || {});
    const marker = h('i', { style: { left: pos(sliding ? run.temp - lastDelta : run.temp) } });
    const delta = lastDelta === null ? null
      : h(`span.delta${deltaTone()}`, {}, ui.tempDelta(lastDelta));
    const number = h('b', {}, run.temp);
    const node = h(`div.gauge${motion === '.fx' ? '.fx-temp' : ''}`, { role: 'meter', 'aria-valuemin': config.deal.minTemp, 'aria-valuemax': config.deal.maxTemp, 'aria-valuenow': run.temp, 'aria-label': ui.gaugeAria(run.temp) },
      h('div.gauge-row', {}, h('span', {}, ui.temperature), h('span', {}, number, delta)),
      h('div.bar', {},
        h('span.tick', { style: { left: pos(config.deal.thresholds.delayed) } }),
        h('span.tick', { style: { left: pos(config.deal.thresholds.signed) } }),
        marker),
      h('div.gauge-scale', {},
        h('span', {}, ui.cold),
        h('span.th', { style: { left: pos(config.deal.thresholds.delayed) } }, texts.gaugeMarks.delayed),
        h('span.th', { style: { left: pos(config.deal.thresholds.signed) } }, texts.gaugeMarks.signed),
        h('span', {}, ui.hot)));
    if (motion === '.fx') tempMotion(number, () => { marker.style.left = pos(run.temp); });
    return node;
  }

  function render() {
    root.classList.toggle('wide', desktop);
    const motion = fx;
    fx = '';
    if (desktop) return renderDesktop(motion);
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
    root.append(h('div.dealbar', {}, dealWheel(), gauge(motion)));

    const play = h(`div.fx-stage${motion}`);
    root.append(play);
    play.append(h('section.card.scene', {},
      h('div.stage', { style: { color: `var(--stage-${stage.key})` } }, svg(stageIcon(stage)), stage.name,
        ctx.edition.valueStages.includes(stage.key) ? h('span.value-tag', {}, ui.valueStage) : null),
      h('p.ctx', {}, step.context),
      h('h2.ask', { id: 'ask' }, step.question)));

    play.append(choiceList(step, {
      revealed,
      picked: revealed ? run.picks[index] : null,
      onPick: pick,
      extra: () => (run.impacts[index] < 0 ? h('span.cost', {}, ui.valueCost(Math.round(-run.impacts[index] * 100))) : null),
    }));

    if (revealed) {
      // A9 : la note et la conséquence du choix sont annoncées aux lecteurs d'écran
      const o = step.options[run.picks[index]];
      play.append(h('p.sr-only', { role: 'status' },
        `${ui.revealAnnounce(run.picks[index] + 1, texts.grades[o.grade], o.feedback)} ${ui.tempAnnounce(run.temp)}`));
    }

    if (revealed && lastEvent) {
      play.append(h('section.card.event.fx-late', { role: 'status' },
        h('span.eyebrow', {}, ui.eventTitle),
        h('p', {}, lastEvent.text),
        h('p.event-temp', {}, ui.eventEffect(lastEvent.temp))));
    }

    if (revealed) {
      const last = isOver(run);
      const btn = h('button.cta.fx-late', { type: 'button', onclick: next }, last ? ui.finish : ui.next);
      play.append(btn);
      if (step.post) play.append(lessonButton(step.post));
      btn.focus({ preventScroll: true });
      if (!preview) btn.scrollIntoView({ block: 'nearest', behavior: reducedMotion(ctx.prefs?.options || {}) ? 'auto' : 'smooth' });
    } else {
      play.append(h('p.keyhint', {}, ui.keyHint));
      window.scrollTo(0, 0);
    }
  }

  // ── M16 lot B : ordinateur. En-tête (accueil, titre et qui, frise des 5 étapes) ; à gauche la jauge verticale et
  // « Ce que tu as décidé » ; au centre la scène, la question, les 3 options en grandes cartes. Après le choix :
  // l'option choisie révélée (verdict, commentaire), et le réflexe senior signalé si ce n'était pas elle.
  function frieze(index) {
    return h('ol.dg-frieze', { 'aria-label': ui.dkStagesAria }, stages.map((s, i) => {
      const done = i < run.grades.length && !(i === index && !revealed);
      const state = done ? 'done' : i === index ? 'now' : 'next';
      const label = { done: ui.dkStageDone, now: ui.dkStageNow, next: ui.dkStageNext }[state];
      return h(`li.${state}`, { 'aria-label': ui.dkStageState(s.name, label) }, done ? svg(checkIcon(12)) : null, s.name);
    }));
  }

  function verticalGauge(motion) {
    const { minTemp, maxTemp, thresholds } = config.deal;
    const pct = (t) => `${((t - minTemp) / (maxTemp - minTemp)) * 100}%`;
    const zone = run.temp >= thresholds.signed ? 'signed' : run.temp >= thresholds.delayed ? 'delayed' : 'lost';
    const fill = h(`i.${zone}`, { style: { height: pct(motion === '.fx' && !reducedMotion(ctx.prefs?.options || {}) ? run.temp - lastDelta : run.temp) } });
    const number = h('b.dg-temp', {}, run.temp);
    if (motion === '.fx') tempMotion(number, () => { fill.style.height = pct(run.temp); });
    return h(`section.card.dg-gauge${motion === '.fx' ? '.fx-temp' : ''}`, { role: 'meter', 'aria-valuemin': minTemp, 'aria-valuemax': maxTemp, 'aria-valuenow': run.temp, 'aria-label': ui.gaugeAria(run.temp) },
      h('span.eyebrow', {}, ui.temperature),
      h('div.dg-gauge-body', {},
        h('div.dg-vbar', { 'aria-hidden': 'true' },
          fill,
          h('span.dg-th', { style: { bottom: pct(thresholds.signed) } })),
        h('div.dg-gauge-info', {},
          h('span.mono.small', {}, ui.dkSignAt(texts.gaugeMarks.signed, thresholds.signed)),
          number,
          lastDelta !== null ? h(`span.mono.small.delta${deltaTone()}`, {}, ui.dkDeltaLast(lastDelta)) : h('span'),
          h('span.mono.small.muted', {}, ui.cold))));
  }

  function decisions(index) {
    const upto = revealed ? index + 1 : index;
    const items = deal.steps.slice(0, upto).map((s, i) => {
      const o = s.options[run.picks[i]];
      return h('li', {},
        h(`i.g${o.grade}`, { 'aria-hidden': 'true' }),
        h('div', {}, h('span.mono.small', {}, ui.dkDecisionLine(stages[i].name, texts.grades[o.grade].toLocaleLowerCase(ctx.lang))), h('p', {}, o.text)));
    });
    return h('section.card.dg-decided', {}, h('span.eyebrow', {}, ui.dkDecided),
      items.length ? h('ul', {}, items) : h('p.small.muted', {}, ui.dkDecidedNone));
  }

  function desktopOptions(step, index) {
    const picked = revealed ? run.picks[index] : null;
    const bestIndex = step.options.findIndex((o) => o.grade === Math.max(...config.deal.grades));
    return h('div.dg-opts', { role: 'group', 'aria-labelledby': 'ask' }, step.options.map((o, i) => {
      const isPicked = picked === i;
      const isBest = revealed && i === bestIndex && !isPicked;
      const cls = revealed ? (isPicked ? `.picked.g${o.grade}` : isBest ? '.best' : '.dim') : '';
      return h(`button.dg-opt${cls}`, {
        type: 'button',
        disabled: revealed,
        'aria-label': revealed ? null : ui.optionAria(i + 1, o.text),
        onclick: () => pick(i),
      },
      h('span.num', { 'aria-hidden': 'true' }, i + 1),
      h('span.dg-opt-body', {},
        h('span.txt', {}, o.text),
        isPicked ? h('span.dg-verdict', {}, h('b', {}, `${ui.dkYourChoice} · ${texts.grades[o.grade]}.`), ' ', o.feedback,
          run.impacts[index] < 0 ? h('span.cost', {}, ` ${ui.valueCost(Math.round(-run.impacts[index] * 100))}`) : null) : null,
        isBest ? h('span.dg-verdict', {}, h('b', {}, `${ui.dkBestAnswer}.`), ' ', o.feedback) : null));
    }));
  }

  function renderDesktop(motion) {
    root.replaceChildren();
    const index = revealed ? run.step - 1 : run.step;
    const step = deal.steps[index];
    const stage = stages[index];
    root.append(h('header.dg-head', {},
      h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
      h('div.dg-title', {},
        h('h1', {}, deal.title),
        h('p.muted', {}, [contactLine(deal.contact), ctx.money(deal.value)].filter(Boolean).join(' · '), deal.vecu ? h('span.lived', {}, ` · ${ui.lived}`) : null),
        daily ? h('p.mode-tag', {}, official ? ui.dailyOfficial : ui.dailyTraining) : duel ? h('p.mode-tag', {}, ui.duelTag(duel.code)) : null),
      frieze(index)));
    const center = h(`div.dg-center${motion}`, {},
      h('section.card.dg-scene', {},
        h('span.eyebrow.dg-step', {}, ui.dkStepLabel(index + 1, stages.length, stage.name),
          ctx.edition.valueStages.includes(stage.key) ? h('span.value-tag', {}, ui.valueStage) : null),
        h('p.dg-ctx', {}, step.context),
        h('h2.dg-ask', { id: 'ask' }, step.question)),
      desktopOptions(step, index));
    if (revealed) {
      const o = step.options[run.picks[index]];
      center.append(h('p.sr-only', { role: 'status' }, `${ui.revealAnnounce(run.picks[index] + 1, texts.grades[o.grade], o.feedback)} ${ui.tempAnnounce(run.temp)}`));
    }
    if (revealed && lastEvent) {
      center.append(h('section.card.event.fx-late', { role: 'status' },
        h('span.eyebrow', {}, ui.eventTitle), h('p', {}, lastEvent.text), h('p.event-temp', {}, ui.eventEffect(lastEvent.temp))));
    }
    const btn = revealed ? h('button.cta.fx-late', { type: 'button', onclick: next }, isOver(run) ? ui.finish : ui.next) : null;
    center.append(h('div.dg-foot', {}, h('p.keyhint', {}, ui.keyHint), revealed && step.post ? lessonButton(step.post) : null, btn));
    root.append(h('div.dg-grid', {}, h('div.dg-left', {}, verticalGauge(motion), decisions(index)), center));
    if (btn) btn.focus({ preventScroll: true });
    else window.scrollTo(0, 0);
  }

  // Leçon de l'étape à partager : copiée dans le presse-papier, aucune intégration réseau.
  function lessonButton(post) {
    if (ctx.edition.live) return null; // M19 : le Pack Spécial Live ne se partage pas
    const status = h('p.small.muted.lesson-msg', { role: 'status' });
    return h('div.lesson.fx-late', {},
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
    ctx.sound?.play(verdictSound(outcome.grade));
    lastDelta = outcome.delta;
    lastEvent = outcome.event;
    revealed = true;
    fx = '.fx';
    verdictHaptic(outcome.grade, ctx.prefs?.options || {});
    render();
  }

  function next() {
    if (!revealed) return;
    if (isOver(run)) {
      if (preview) return;
      const end = result(run);
      trackDealEnd(ctx.edition.id, deal.id, end.verdict, undefined, end.grades.filter((g) => g === 3).length);
      reportScore(deal.id, end); // M11 lot C : codes team seulement
      ctx.go('debrief', { id: deal.id, result: end, daily, official, duel }, { push: false });
      return;
    }
    const old = root.querySelector('.fx-stage,.dg-center');
    if (old) ghostOut(old);
    revealed = false;
    lastDelta = null;
    lastEvent = null;
    fx = '.fx-enter';
    render();
  }

  render();
  // la fenêtre franchit le seuil ordinateur en pleine partie : même partie, autre rendu
  const stopWatch = preview || forced !== undefined ? () => {} : onDesktopChange((on) => { desktop = on; render(); });
  return {
    cleanup() {
      stopWatch();
      root.classList.remove('wide');
    },
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
