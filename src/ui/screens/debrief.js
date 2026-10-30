// Débrief : tampon du verdict, CA, notes par étape, roue du deal, commentaire du manager.
// M16 lot C : à partir de config.ui.desktopMinPx, le débrief ordinateur (debrief-desktop.js) ; le résultat est
// appliqué une seule fois, puis l'un ou l'autre rendu s'affiche (et se redessine si la fenêtre franchit le seuil).
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h, svg } from '../dom.js';
import { gradeIcon } from '../icons.js';
import { wheelSvg } from '../wheel.js';
import { applyResult, wheelProgress } from '../../game/progress.js';
import { reducedMotion } from '../theme.js';
import { dealHead } from '../head.js';
import { nextDealId } from '../../game/campaign.js';
import { finishDaily, currentStreak } from '../../game/daily.js';
import { dealShare, sendDealShare } from '../../share/share.js';
import { track } from '../../measure/beacon.js';
import { encodeDuel, replayGrades, compareResults, duelLink } from '../../game/duel.js';
import { isDesktop, onDesktopChange } from '../desktop.js';
import { desktopDebrief } from './debrief-desktop.js';
import { unlockLine } from './campaign.js';
import { rankMessage, fetchDealStats } from '../../game/rank.js';

// Comparaison avec le collègue qui a lancé le défi : notes étape par étape, montants, écart.
function duelCard(deal, result, duel, ctx) {
  const ui = texts.ui;
  const { edition } = ctx;
  const unit = edition.valueUnit;
  const theirs = replayGrades(deal, edition, duel.grades);
  const cmp = compareResults(result, theirs);
  const cell = (g) => h(`span.g.g${g}`, {}, svg(gradeIcon(g, 16)), texts.grades[g]);
  return h('section.card.duel-result', {},
    h('span.eyebrow', {}, ui.duelResult),
    h('p.duel-verdict', {}, cmp > 0 ? ui.duelWin : cmp < 0 ? ui.duelLose : ui.duelTie),
    h('div.duel-grid', {},
      h('span'), h('b', {}, ui.duelYou), h('b', {}, ui.duelThem),
      edition.stages.flatMap((s, i) => [
        h('span.ab', { style: { background: `var(--stage-${s.key})` }, title: s.name }, s.abbr),
        cell(result.grades[i]),
        cell(duel.grades[i]),
      ]),
      h('span'),
      h('b.mono', {}, ui.duelAmount(texts.verdicts[result.verdict], result.revenue, unit)),
      h('b.mono', {}, ui.duelAmount(texts.verdicts[theirs.verdict], theirs.revenue, unit))),
    h('p.mono', {}, ui.duelGap(result.revenue - theirs.revenue, unit)));
}

export function debriefScreen(root, { id, result, daily = null, official = false, duel = null, desktop: forced }, ctx) {
  const deal = ctx.deals.find((d) => d.id === id);
  if (!deal || !result) {
    queueMicrotask(() => ctx.go('home', {}, { push: false }));
    return {};
  }
  const ui = texts.ui;
  const { edition } = ctx;
  const { newWedges, hits, record } = applyResult(ctx.save, deal, result, edition);
  const progress = wheelProgress(ctx.save, edition);
  const playedBefore = ctx.save.deals.filter((d) => d.id === deal.id).length > 1;
  const dailyEntry = daily && official ? finishDaily(ctx.save, daily, result) : null;
  ctx.persist();

  const low = result.verdict === 'signed' && result.share < config.deal.lowValueShare;
  const comments = ctx.et.manager[low ? 'signedLow' : result.verdict];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const nextId = nextDealId(ctx.deals, ctx.save, deal.id, edition, { dev: ctx.dev }) || deal.id;
  const unit = edition.valueUnit;
  const signed = result.verdict === 'signed';
  const code = encodeDuel(edition.id, deal.num, result.grades);
  const onReplay = () => ctx.go('game', { id: deal.id, daily }, { push: false });
  const onNext = () => ctx.go('game', { id: nextId }, { push: false });
  ctx.sound?.play('stamp');
  const seniors = result.grades.filter((g) => g === 3).length;

  // M17-A : « Tu fais mieux que N % des joueurs sur ce deal », seulement à partir de config.stats.minPlays parties
  // mesurées ; sous config.stats.minBetter %, « Ce deal est dur : seuls X % des joueurs font 4 réflexes seniors ou plus ».
  function rankLine(spec) {
    const line = h(spec, { hidden: true });
    fetchDealStats(deal.id).then((d) => {
      const m = rankMessage(d, seniors);
      if (!m || !line.isConnected) return;
      line.textContent = m.kind === 'better' ? ui.rankBetter(m.n) : ui.rankHard(m.x, config.stats.hardFrom);
      line.hidden = false;
    });
    return line;
  }

  // meilleur résultat, réflexes comptés pour la roue de compétences, parts gagnées (en bleu)
  const stageOf = (k) => progress.find((p) => p.stage.key === k);
  const progressLines = () => [
    record && playedBefore ? h('p.mono', {}, ui.record) : null,
    ...hits.filter((k) => !newWedges.includes(k)).map((k) => h('p.mono', {}, ui.wheelHit(stageOf(k).stage.name, stageOf(k).hits, stageOf(k).required))),
    ...newWedges.map((k) => h('p.mono.rec', {}, ui.wedgeWon(stageOf(k).stage.name))),
  ].filter(Boolean);

  // M17-B : le message de défi, prêt à coller (FR/EN), avec le lien qui ouvre directement le deal.
  const challengeMessage = () => `${ui.challengeText(edition.name, deal.title, code)}\n${duelLink(code, ctx.lang)}`;

  // Défier un collègue : le code de défi, révélé au clic avec sa copie (M17-B : un lien texte sous « Deal suivant »).
  function challengeParts() {
    const challengeZone = h('div');
    const challenge = h('button.link', {
      type: 'button',
      'aria-expanded': 'false',
      onclick: () => {
        challenge.setAttribute('aria-expanded', 'true');
        const copyStatus = h('p.muted.small', { role: 'status' });
        challengeZone.replaceChildren(h('section.card.challenge', {},
          h('span.eyebrow', {}, ui.challengeTitle),
          h('p.code', {}, code),
          h('p.small.muted', {}, ui.challengeHint),
          h('button.ghost', {
            type: 'button',
            onclick: async () => {
              try {
                await navigator.clipboard.writeText(challengeMessage());
                copyStatus.textContent = ui.challengeCopied;
              } catch {
                copyStatus.textContent = ui.challengeCopyFailed;
              }
            },
          }, ui.challengeCopy),
          copyStatus));
      },
    }, ui.challengeLink);
    return { challenge, challengeZone };
  }

  // M17-B : après un deal signé, « Ton score : 288 k€. Défie un collègue de faire mieux. » ; le bouton (contour) copie le
  // message et le lien de défi, et sur mobile ouvre le partage natif.
  function scoreChallenge() {
    if (!signed) return null;
    const status = h('p.small.muted', { role: 'status' });
    const send = h('button.ghost', {
      type: 'button',
      onclick: async () => {
        const text = challengeMessage();
        if (!desktop && navigator.share) {
          try { await navigator.share({ text }); return; } catch (e) { if (e?.name === 'AbortError') return; }
        }
        try {
          await navigator.clipboard.writeText(text);
          status.textContent = ui.challengeCopied;
        } catch {
          status.textContent = ui.challengeCopyFailed;
        }
      },
    }, ui.challengeSend);
    return h('section.card.challenge-score', {}, h('p', {}, ui.challengeScore(result.revenue, unit)), send, status);
  }

  function renderMobile() {
    root.replaceChildren();
    root.append(dealHead(deal, h('div.topbar', {},
      h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
      h('div.meta', {}, h('b', {}, deal.title), h('span.plain', {}, contactLine(deal.contact))))));

    if (daily) {
      root.append(h('p.mode-tag', {}, dailyEntry ? ui.dailyOfficial : ui.dailyTraining,
        dailyEntry ? h('span', {}, ` — ${ui.dailyRecorded} ${ui.streak(currentStreak(ctx.save, daily))}`) : null));
    }

    const amountText = (a) => (signed ? ui.signedOf(a, deal.value, unit) : ui.notSigned(deal.value, unit));
    const amount = h('p.ca', {}, amountText(result.revenue));
    root.append(h('section.verdict', { 'aria-live': 'polite' },
      h(`div.stamp.${result.verdict}`, {}, texts.verdicts[result.verdict]),
      amount,
      h('p.temp', {}, ui.finalTemp(result.temp)),
      rankLine('p.rank')));
    // le montant se compte de la valeur pleine au montant signé (désactivé en effets réduits)
    if (signed && result.revenue < deal.value && !reducedMotion(ctx.prefs.options)) {
      const t0 = performance.now();
      amount.setAttribute('aria-label', amountText(result.revenue));
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / config.ui.countMs);
        amount.textContent = amountText(Math.round(deal.value - (deal.value - result.revenue) * (1 - (1 - k) ** 3)));
        if (k < 1 && amount.isConnected) requestAnimationFrame(tick);
      };
      amount.textContent = amountText(deal.value);
      requestAnimationFrame(tick);
    }

    if (duel) root.append(duelCard(deal, result, duel, ctx)); // M17-B : le défi comparé, en haut du débrief

    const cost = result.costliest;
    if (signed && cost) {
      const stage = edition.stages[cost.step];
      const generic = edition.valueReasons[stage.key];
      root.append(h('section.card.costliest', {},
        h('span.eyebrow', {}, ui.costliestTitle),
        h('p.cost-step', { style: { color: `var(--stage-${stage.key})` } }, ui.costliestStep(stage.name, Math.round(-cost.impact * 100))),
        h('p', {}, cost.reason || generic[Math.floor(Math.random() * generic.length)])));
    } else if (signed) {
      root.append(h('section.card.costliest', {}, h('span.eyebrow', {}, ui.costliestTitle), h('p', {}, ui.nothingLost)));
    }

    const score = scoreChallenge();
    if (score) root.append(score);

    root.append(h('section.card.mgr', {}, h('span.eyebrow', {}, ui.managerSays), h('q', {}, comment)));

    root.append(h('section.card.steps', {},
      h('span.eyebrow', {}, ui.decisions),
      edition.stages.map((s, i) => {
        const g = result.grades[i];
        return h('div.step-row', {},
          h('span.ab', { style: { background: `var(--stage-${s.key})` }, 'aria-hidden': 'true' }, s.abbr),
          h('span', {}, s.name),
          h(`span.g.g${g}`, {}, svg(gradeIcon(g, 16)), texts.grades[g]));
      })));

    // roue du deal telle qu'elle a fini (une part par étape, couleur de la note), décompte des notes, puis, quand elles
    // s'appliquent : meilleur résultat, réflexes comptés pour la roue de compétences, parts gagnées (en bleu)
    const count = (g) => result.grades.filter((x) => x === g).length;
    root.append(h('section.card.won', {},
      svg(wheelSvg(96, {}, edition, { grades: result.grades, label: false })),
      h('div.stack', {},
        h('p.mono', {}, ui.dealTally(count(3), count(1), count(0))),
        progressLines())));

    // partage du deal sous la roue (M9) : navigator.share, sinon copie et « Copié » sur le bouton (annonce lue par les
    // lecteurs d'écran, sans décaler les boutons ; seul l'échec s'affiche)
    const shareStatus = h('p.sr-only', { role: 'status' });
    const share = h('button.ghost.share-deal', {
      type: 'button',
      onclick: async () => {
        const outcome = await sendDealShare(dealShare({ edition, deal, result }));
        if (outcome === 'shared' || outcome === 'copied') track('share', edition.id);
        if (outcome === 'copied') {
          share.textContent = ui.shareCopied;
          shareStatus.textContent = ui.shareCopiedStatus;
          setTimeout(() => { share.textContent = ui.share; shareStatus.textContent = ''; }, config.share.copiedMs);
        } else {
          shareStatus.className = outcome === 'failed' ? 'muted small' : 'sr-only';
          shareStatus.textContent = outcome === 'failed' ? ui.shareFailed : '';
        }
      },
    }, ui.share);
    root.append(share, shareStatus);

    // M17-B : « Deal suivant » seul bouton plein ; « Rejouer » et « Défier un collègue » en liens texte en dessous
    const next = h('button.cta', { type: 'button', onclick: onNext }, ui.nextDeal);
    root.append(next);
    const unlock = unlockLine(ctx);
    if (unlock) root.append(unlock);
    const { challenge, challengeZone } = challengeParts();
    root.append(h('div.debrief-links', {}, h('button.link', { type: 'button', onclick: onReplay }, ui.replayLink), challenge), challengeZone);
    next.focus({ preventScroll: true });
  }

  let desktop = forced ?? isDesktop();
  function render() {
    root.classList.toggle('wide', desktop);
    if (!desktop) return renderMobile();
    const { challenge, challengeZone } = challengeParts();
    return desktopDebrief(root, {
      deal, result, daily, dailyEntry, duelNode: duel ? duelCard(deal, result, duel, ctx) : null, progressLines: progressLines(),
      nextId, onReplay, onNext, challengeButton: challenge, challengeZone, rankNode: rankLine('p.dd-rank'), unlockNode: unlockLine(ctx), scoreNode: scoreChallenge(),
    }, ctx);
  }
  render();
  const stopWatch = forced !== undefined ? () => {} : onDesktopChange((on) => { desktop = on; render(); });

  return {
    cleanup() {
      stopWatch();
      root.classList.remove('wide');
    },
    onKey(ev) {
      if (ev.key === 'Escape') history.back();
    },
  };
}
