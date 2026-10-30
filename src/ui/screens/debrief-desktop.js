// Débrief de fin de deal, ordinateur (M16 lot C), à partir de config.ui.desktopMinPx ; en dessous, debrief.js.
// Bandeau (verdict, synthèse, montant capturé / en jeu, réflexes seniors), les 5 décisions face au réflexe senior,
// la leçon à garder (« Copier pour LinkedIn »), l'équipe sur ce deal (code Team), puis Deal suivant, Rejouer, Défier.
// Le résultat est déjà appliqué (debrief.js) : ce rendu ne touche à rien.
import { config } from '../../config.js';
import { texts, formats } from '../../content/texts.js';
import { h } from '../dom.js';
import { startDeal, choose } from '../../game/deal.js';
import { teamRole, teamState, fetchTeam } from '../../access/team.js';

// Les 5 décisions rejouées : option choisie (chaque note est unique dans une étape), réflexe senior, écart de
// température réel (plafonds et événements compris, comme dans la partie).
export function decisionRows(deal, edition, grades, cfg = config) {
  const run = startDeal(deal, edition);
  const top = Math.max(...cfg.deal.grades);
  return grades.map((g, i) => {
    const step = deal.steps[i];
    const picked = step.options.findIndex((o) => o.grade === g);
    const before = run.temp;
    choose(run, picked, cfg);
    return { stage: edition.stages[i], grade: g, choice: step.options[picked], best: g === top ? null : step.options.find((o) => o.grade === top), delta: run.temp - before };
  });
}

// La leçon : le post de l'étape la plus ratée (la plus tardive à égalité) ; sans post, le commentaire de son réflexe
// senior.
export function lessonOf(deal, grades, cfg = config) {
  const low = Math.min(...grades);
  const i = grades.lastIndexOf(low);
  const step = deal.steps[i];
  if (step.post) return { step: i, t: step.post.t, h: step.post.h };
  return { step: i, t: step.options.find((o) => o.grade === Math.max(...cfg.deal.grades)).feedback, h: '' };
}

// Phrase de synthèse, depuis les étapes réussies (réflexes seniors) et ratées (fautes, sinon passes).
export function synthesis(edition, grades, lang) {
  const ui = texts.ui;
  const list = (idx) => new Intl.ListFormat(lang, { type: 'conjunction' }).format(idx.map((i) => edition.stages[i].name.toLocaleLowerCase(lang)));
  const at = (g) => grades.map((x, i) => (x === g ? i : -1)).filter((i) => i >= 0);
  const good = at(3);
  const bad = at(0).length ? at(0) : at(1);
  if (good.length === grades.length) return ui.dkSumPerfect;
  return [good.length ? ui.dkSumGood(list(good)) : ui.dkSumNoGood, bad.length ? ui.dkSumBad(list(bad)) : null].filter(Boolean).join(' ');
}

export function desktopDebrief(root, { deal, result, daily, dailyEntry, duelNode, progressLines, nextId, onReplay, onNext, challengeButton, challengeZone, rankNode = null, unlockNode = null, scoreNode = null }, ctx) {
  const ui = texts.ui;
  const { edition } = ctx;
  const unit = edition.valueUnit;
  const seniors = result.grades.filter((g) => g === 3).length;
  const rows = decisionRows(deal, edition, result.grades);
  root.replaceChildren();
  root.append(h('section.dd-banner', { 'aria-live': 'polite' },
    h('div.dd-banner-main', {},
      h('span.eyebrow', {}, ui.dkDebriefTag(deal.title)),
      h('h1', {}, `${texts.bestVerdicts[result.verdict]}.`),
      h('p.dd-summary', {}, synthesis(edition, result.grades, ctx.lang)),
      rankNode, // M17-A : position face aux autres joueurs (si assez de parties mesurées)
      daily ? h('p.small', {}, dailyEntry ? `${ui.dailyOfficial} — ${ui.dailyRecorded}` : ui.dailyTraining) : null),
    // non signé : « Rien de signé · 134 k€ en jeu », comme le débrief mobile
    h('div.dd-banner-side', {}, ...(result.verdict === 'signed' ? [
      h('b.dd-amount', {}, ui.amount(result.revenue, unit)),
      h('p.mono', {}, ui.dkOfValue(ui.amount(deal.value, unit), Math.round((result.revenue / deal.value) * 100)))] : [
      h('b.dd-amount.none', {}, ui.dkNothing),
      h('p.mono', {}, ui.dkAtStake(ui.amount(deal.value, unit)))]),
      h('span.dd-seniors', {}, ui.dkSeniorCount(seniors, result.grades.length)))));

  const decisions = h('section.card.dd-decisions', {},
    h('h2', {}, ui.dkDecisionsTitle(rows.length)),
    h('ol', {}, rows.map((r, i) => h('li', {},
      h('div.dd-row-head', {}, h('span.dd-stage', {}, ui.dkRowStage(i + 1, r.stage.name)), h(`span.dd-grade.g${r.grade}`, {}, texts.grades[r.grade])),
      h('div.dd-row-body', {},
        h('p', {}, h('b', {}, ui.dkChoiceLabel), ' ', r.choice.text),
        r.best ? h('p.dd-best', {}, h('b', {}, ui.dkBestLabel), ' ', r.best.text) : null,
        h('p.small.muted', {}, r.choice.feedback)),
      h(`span.mono.dd-delta${r.delta < 0 ? '.down' : ''}`, { 'aria-label': ui.eventEffect(r.delta) }, ui.tempDelta(r.delta))))));

  const lesson = lessonOf(deal, result.grades);
  const lessonStatus = h('p.small.muted', { role: 'status' });
  const lessonCard = h('section.card.dd-lesson', {},
    h('span.eyebrow', {}, ui.dkLesson),
    h('p.dd-lesson-t', {}, lesson.t),
    lesson.h ? h('p', {}, lesson.h) : null,
    h('button.ghost', {
      type: 'button',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(lesson.h ? ui.lessonText(lesson.t, lesson.h, config.brand.name) : `${lesson.t}\n\n${texts.share.playedOn(config.brand.name)}`);
          lessonStatus.textContent = ui.lessonCopied;
        } catch {
          lessonStatus.textContent = ui.lessonCopyFailed;
        }
      },
    }, ui.dkCopyLinkedIn),
    lessonStatus);

  const side = h('div.dd-side', {}, lessonCard, scoreNode); // M17-B : le défi après un deal signé, sous la leçon
  // Code Team : toi, la moyenne de l'équipe et le meilleur résultat sur ce deal (réflexes seniors), et l'étape la plus
  // ratée par l'équipe. Sans code Team, ou sans réponse du Worker, ce bloc n'apparaît pas.
  if (teamRole() === 'team' && teamState().pseudo) {
    const slot = h('div');
    side.append(slot);
    fetchTeam({ deal: deal.id }).then((r) => {
      const d = r.ok ? r.data.deal : null;
      if (!d || d.id !== deal.id || !side.contains(slot)) return;
      const total = result.grades.length;
      const bar = (label, value, cls) => h('div.dd-bar-row', {},
        h('div.dd-bar-head', {}, h('span', {}, label), h('span.mono', {}, ui.dkOutOf(formats().decimal(value), total))),
        h('span.dd-bar', { 'aria-hidden': 'true' }, h(`i.${cls}`, { style: { width: `${Math.round((value / total) * 100)}%` } })));
      const missed = d.missed
        ? (d.missed.players === 1 ? ui.dkTeamMissedOne(d.players, edition.stages[d.missed.step].name.toLocaleLowerCase(ctx.lang))
          : ui.dkTeamMissed(d.missed.players, d.players, edition.stages[d.missed.step].name.toLocaleLowerCase(ctx.lang)))
        : ui.dkTeamNoMiss;
      slot.replaceWith(h('section.card.dd-team', {},
        h('span.eyebrow', {}, ui.dkTeamVs),
        h('p.small.muted', {}, ui.dkTeamUnit),
        bar(ui.duelYou, seniors, 'you'), bar(ui.dkTeamAvg, d.avg, 'avg'), bar(ui.dkTeamBest, d.best, 'best'),
        h('p.small.muted', {}, missed)));
    }).catch(() => {});
  }
  if (progressLines.length) side.append(h('section.card.dd-progress', {}, progressLines));
  const next = h('button.cta', { type: 'button', onclick: onNext }, ui.nextDeal);
  // M17-B : « Deal suivant » seul bouton plein ; « Rejouer » et « Défier un collègue » en liens texte sur une ligne
  side.append(h('div.dd-actions', {}, next, unlockNode, h('div.dd-links', {}, h('button.link', { type: 'button', onclick: onReplay }, ui.replayLink), challengeButton)), challengeZone);
  // M17-B : le résultat comparé d'un défi, en haut (sous le bandeau)
  if (duelNode) root.append(h('div.dd-duel', {}, duelNode));
  root.append(h('div.dd-grid', {}, decisions, side));
  next.focus({ preventScroll: true });
  return { nextId };
}
