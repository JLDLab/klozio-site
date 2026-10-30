// Accueil ordinateur (M16 lot A), à partir de config.ui.desktopMinPx de large ; en dessous, l'accueil mobile (home.js).
// En-tête pleine largeur (logo, onglets d'édition, accès, FR / EN, réglages), puis trois colonnes : profil et CA
// à gauche, deal du jour et campagne au centre, équipe ou défi à droite. Tout se calcule depuis ce que le jeu garde
// déjà sur l'appareil (et, pour Team, ce que le Worker renvoie déjà) : aucune nouvelle donnée.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { duelSegment } from '../../content/editions/index.js';
import { h, svg } from '../dom.js';
import { wheelSvg } from '../wheel.js';
import { lockIcon } from '../icons.js';
import { langSwitch } from '../lang.js';
import { titleIndex, wheelProgress, revenueSummary, weakSpot, mastery } from '../../game/progress.js';
import { campaignOrder } from '../../game/campaign.js';
import { dayKey, nextDayKey, dailyPool, dailyDealId, currentStreak } from '../../game/daily.js';
import { dealSeconds } from '../../game/pacing.js';
import { encodeDuel, duelLink } from '../../game/duel.js';
import { savedAccess } from '../../access/client.js';
import { teamRole, teamState, fetchTeam } from '../../access/team.js';
import { pagePath } from '../../core/lang.js';
import { fullEditionCard, offersButton, lockedCount } from './campaign.js';
import { weekCard } from './team.js';
import { isFirstVisit, firstDeal, buyReady, firstVisitBlock, credLine, wantsAll, showAll } from './first-visit.js';

export { isDesktop } from '../desktop.js';

// Pictogramme des réglages (trait currentColor, comme les autres pictogrammes du jeu).
const gearIcon = (size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`;

// Statut d'accès : Tout KLOZIO (code all, team, manager), une édition (code edition), ou gratuit.
export function accessStatus(ctx, access = savedAccess()) {
  const ui = texts.ui;
  const offer = ctx.offer ?? {};
  if (access?.kind && access.kind !== 'edition') return { paid: true, text: ui.dkAccessAll(offer.all ?? ctx.deals?.length ?? 0) };
  if (access?.kind === 'edition' && access.editions?.includes(ctx.edition.id)) {
    return { paid: true, text: ui.dkAccessEdition(duelSegment(ctx.edition.id), offer.edition ?? ctx.deals?.length ?? 0) };
  }
  return { paid: false, text: ui.dkAccessFree(ctx.deals?.length ?? 0) }; // M17-B : les gratuits de l'édition, comme le CA
}

function header(ctx) {
  const ui = texts.ui;
  const status = accessStatus(ctx);
  const tabs = ctx.catalogue.filter((e) => e.status === 'active').map((e) => h(`button.dk-tab${e.id === ctx.edition.id ? '.on' : ''}`, {
    type: 'button',
    'aria-pressed': String(e.id === ctx.edition.id),
    onclick: () => {
      if (e.id === ctx.edition.id) return;
      ctx.prefs.edition = e.id;
      ctx.persistPrefs();
      location.reload();
    },
  }, e.name));
  return h('header.dk-head', {},
    h('div.dk-brand', {}, h('img.dk-logo', { src: config.brand.wordmark, alt: config.brand.name, width: 475, height: 156 }), credLine(ctx)), // M17-A
    h('nav.dk-tabs', { 'aria-label': ui.dkEditionsAria }, tabs),
    h('div.dk-head-right', {},
      h(`span.dk-access${status.paid ? '.paid' : ''}`, {}, status.text),
      status.paid ? null : offersButton(ctx),
      langSwitch(ctx),
      h('button.ghost.icon', { type: 'button', 'aria-label': ui.optionsTitle, title: ui.optionsTitle, onclick: () => ctx.go('options') }, svg(gearIcon()))));
}

// Colonne de gauche : titre de profil, roue, une barre par étape, point faible ; puis le CA signé.
function profileColumn(ctx) {
  const ui = texts.ui;
  const { save, edition } = ctx;
  const progress = wheelProgress(save, edition);
  const weak = weakSpot(save, edition);
  const weakText = !weak ? [ui.dkWeakNone]
    : [ui.dkWeakSpot(edition.stages[weak.stage].name.toLocaleLowerCase(ctx.lang)), weak.lost === 1 ? ui.dkWeakSpotOne : ui.dkWeakSpotWhy(weak.faults, weak.lost)];
  const profile = h('section.card.dk-profile', {},
    h('span.eyebrow', {}, ui.dkProfile),
    h('h2', {}, edition.profileTitles[titleIndex(save, edition)]),
    h('div.dk-wheel', {}, svg(wheelSvg(240, save.wedges, edition, { progress: Object.fromEntries(progress.map((x) => [x.stage.key, x.hits / x.required])) }))),
    h('ul.dk-bars', {}, progress.map(({ stage, hits, required, done }) => h('li', { 'aria-label': ui.wheelStageAria(stage.name, hits, required) },
      h('span', {}, stage.name),
      h('span.dk-bar', { 'aria-hidden': 'true' }, h(`i${done ? '.done' : ''}`, { style: { width: `${Math.round((hits / required) * 100)}%` } })),
      h('span.mono', {}, done ? ui.wheelDone : ui.wheelStage(hits, required))))),
    h('p.small.muted.dk-weak', {}, weakText.join(' ')),
    h('div.dk-links', {},
      h('button.ghost', { type: 'button', onclick: () => ctx.go('profile') }, ui.profileButton),
      h('button.ghost', { type: 'button', onclick: () => ctx.go('training') }, ui.trainingButton)));
  const r = revenueSummary(save, ctx.deals);
  const pct = Math.round(r.share * 100);
  const unit = edition.valueUnit;
  const revenue = h('section.dk-revenue', { 'aria-label': ui.revenueAria(ui.amount(r.signed, unit), ui.amount(r.possible, unit), pct) },
    h('span.eyebrow', {}, ui.revenueLabel),
    h('b', {}, ui.amount(r.signed, unit)),
    h('p', {}, ui.revenueOf(ui.amount(r.possible, unit), pct)),
    h('span.dk-meter', { 'aria-hidden': 'true' }, h('i', { style: { width: `${pct}%` } })),
    h('p.dk-revenue-foot', {}, h('span.mono', {}, ctx.partial() ? ui.signedFree(r.signedCount, ctx.deals.length) : ui.signedDeals(r.signedCount, ctx.deals.length))));
  return h('div.dk-col.dk-left', {}, profile, revenue);
}

// Statut d'un deal sur sa carte : Nouveau, ou le meilleur verdict obtenu (vocabulaire de l'édition).
const statusOf = (best) => (best ? { cls: best.verdict, text: texts.bestVerdicts[best.verdict] } : { cls: 'new', text: texts.ui.dkNew });

function dailyCard(ctx) {
  const ui = texts.ui;
  const key = dayKey();
  const pool = dailyPool(ctx.deals, { dev: ctx.dev });
  // M17-A : tant qu'aucun deal n'est joué (« Voir tous les deals »), le premier deal imposé, hors deal du jour
  const first = isFirstVisit(ctx.save) ? firstDeal(pool.deals, ctx.edition.id) : null;
  const deal = first ?? pool.deals.find((d) => d.id === dailyDealId(pool.deals, ctx.edition.id, key));
  if (!deal) return h('section.card.dk-daily', {}, h('span.eyebrow', {}, ui.dailyTitle), h('p.muted', {}, ui.dailyEmpty));
  const entry = first ? null : ctx.save.daily?.[key];
  return h('section.card.dk-daily', {},
    h('div.dk-daily-main', {},
      h('div.dk-tags', {},
        h('span.eyebrow', {}, first ? ui.fvTitle : entry ? ui.dailyTraining : ui.dailyTitle),
        h('span.dk-pill', {}, ctx.et.saleTypes[deal.saleType] ?? deal.sector),
        deal.vecu ? h('span.dk-pill', {}, ui.lived.replace(/\.$/, '')) : null, // « Vécu », sans le point de la mention en partie
        config.content.showDifficulty ? h('span.dk-pill', {}, ui.difficulty(deal.difficulty, config.deal.maxDifficulty)) : null),
      h('h2', {}, deal.title),
      h('p.muted', {}, contactLine(deal.contact)),
      h('p.dk-hook', {}, deal.steps[0].context)),
    h('div.dk-daily-side', {},
      h('b.dk-value', {}, ctx.money(deal.value)),
      h('p.small.muted', {}, ui.dkDailyMeta(deal.steps.length, config.ui.dealMinutes)),
      first ? null : streakLine(ctx, key),
      entry?.status === 'done' ? h('p.daily-done', {}, ui.dailyDone) : null, // M17-B
      // déjà joué aujourd'hui : « Continuer » vers le prochain deal non joué (ordre « À jouer »), sinon on le rejoue
      entry ? continueButton(ctx, deal, key) : h('button.cta', { type: 'button', onclick: () => ctx.go('game', first ? { id: deal.id } : { id: deal.id, daily: key }) }, first ? ui.fvPlay : ui.dailyPlay),
      first ? null : tomorrowLine(ctx, pool.deals, key)));
}

// Ordre « À jouer » : non joués, puis reportés et perdus, signés en dernier ; à égalité, l'ordre de la campagne.
const PRIORITY = { none: 0, delayed: 1, lost: 1, signed: 2 };
export const toPlayOrder = (deals, save) => deals.map((d, i) => ({ d, i, p: PRIORITY[save.best[d.id]?.verdict ?? 'none'] }))
  .sort((a, b) => a.p - b.p || a.i - b.i).map((x) => x.d);
const campaignDeals = (ctx) => ctx.edition.saleTypes.flatMap((t) => campaignOrder(ctx.deals.filter((d) => d.saleType === t)));

// M17-B : le prochain deal non joué (ordre « À jouer »), hors `except`.
export const nextToPlay = (ctx, except) => toPlayOrder(campaignDeals(ctx), ctx.save).find((d) => !ctx.save.best[d.id] && d.id !== except) ?? null;

// M17-B : la série, à partir de config.daily.streakFrom jours d'affilée (compteur miel) ; sinon rien.
export function streakLine(ctx, key) {
  const n = currentStreak(ctx.save, key);
  return n >= config.daily.streakFrom ? h('p.streak', {}, texts.ui.streakDays(n)) : null;
}

// M17-B : « Demain : un deal Grands comptes. » — le secteur du deal de demain (même tirage), jamais son titre.
export function tomorrowLine(ctx, pool, key) {
  const id = dailyDealId(pool, ctx.edition.id, nextDayKey(key));
  const deal = pool.find((d) => d.id === id);
  return deal ? h('p.small.muted.tomorrow', {}, texts.ui.tomorrow(ctx.et.saleTypes[deal.saleType] ?? deal.sector)) : null;
}

function continueButton(ctx, daily, key) {
  const next = nextToPlay(ctx, daily.id);
  return next
    ? h('button.cta', { type: 'button', onclick: () => ctx.go('game', { id: next.id }) }, texts.ui.dkContinue)
    : h('button.cta', { type: 'button', onclick: () => ctx.go('game', { id: daily.id, daily: key }) }, texts.ui.dailyReplay);
}

// Campagne groupée par secteur (type de vente) : titre, signés / total, 6 cartes puis « Voir les N autres ».
// Filtres : « À jouer » (par défaut, ordre de priorité), « Tous » (ordre de la campagne), ou un seul secteur.
const PER_SECTION = 6;
function campaign(ctx) {
  const ui = texts.ui;
  const byType = Object.fromEntries(ctx.edition.saleTypes.map((t) => [t, campaignOrder(ctx.deals.filter((d) => d.saleType === t))]));
  const types = ctx.edition.saleTypes.filter((t) => byType[t].length);
  const count = types.reduce((n, t) => n + byType[t].length, 0);
  let filter = 'play';
  const open = new Set(); // secteurs dépliés
  const body = h('div.dk-sections');
  const card = (deal) => {
    const best = ctx.save.best[deal.id] ?? null;
    const st = statusOf(best);
    return h('button.dk-card', { type: 'button', onclick: () => ctx.go('game', { id: deal.id }) },
      h('span.dk-card-top', {}, h('span.dk-type', {}, ctx.et.saleTypes[deal.saleType] ?? deal.sector), h(`span.dk-status.${st.cls}`, {}, st.text)),
      h('span.dk-card-title', {}, deal.title),
      h('span.small.muted', {}, deal.contact.role),
      h('span.mono.dk-card-value', {}, best?.verdict === 'signed' && best.revenue ? ui.bestAmount(best.revenue, ctx.edition.valueUnit) : ctx.money(deal.value)));
  };
  // M10-A : les deals de l'édition complète ne sont pas publiés ; une carte cadenas les résume et mène aux offres
  // (dans l'app Play, à « J'ai un code »).
  const more = ctx.partial() ? lockedCount(ctx) : 0;
  const lockedCard = () => h('button.dk-card.locked', {
    type: 'button',
    onclick: () => (ctx.play ? ctx.go('code') : location.assign(pagePath('offres', ctx.lang))),
  },
  h('span.dk-card-top', {}, svg(lockIcon(18))),
  h('span.dk-card-title', {}, ui.dkLockedMore(more, duelSegment(ctx.edition.id))),
  h('span.small', {}, ctx.play ? ui.codeButton : ui.dkLockedOpen(duelSegment(ctx.edition.id)))); // M17-A : « Voir les offres » une seule fois (en-tête)
  const section = (t) => {
    const list = filter === 'all' ? byType[t] : toPlayOrder(byType[t], ctx.save);
    const signed = byType[t].filter((d) => ctx.save.best[d.id]?.verdict === 'signed').length;
    const shown = open.has(t) ? list : list.slice(0, PER_SECTION);
    const rest = list.length - shown.length;
    const toggle = rest > 0
      ? h('button.link.dk-more', { type: 'button', onclick: () => { open.add(t); fill(); } }, ui.dkSeeMore(rest))
      : list.length > PER_SECTION ? h('button.link.dk-more', { type: 'button', onclick: () => { open.delete(t); fill(); } }, ui.dkSeeLess) : null;
    return h('section.dk-sector', { 'aria-label': ctx.et.saleTypes[t] },
      h('div.dk-sector-head', {}, h('h3', {}, ctx.et.saleTypes[t]), h('span.mono.muted', {}, ui.groupProgress(signed, byType[t].length))),
      h('div.dk-grid-cards', {}, shown.map(card)),
      toggle);
  };
  const fill = () => body.replaceChildren(...types.filter((t) => ['play', 'all', t].includes(filter)).map(section),
    ...(more && ['play', 'all'].includes(filter) ? [h('div.dk-grid-cards', {}, lockedCard())] : []));
  const options = [['play', ui.dkToPlay], ['all', ui.dkFilterAll], ...(types.length > 1 ? types.map((t) => [t, ctx.et.saleTypes[t]]) : [])];
  const chips = h('div.dk-filters', { role: 'group', 'aria-label': ui.dkFilterAria },
    options.map(([value, label]) => h('button.dk-chip', {
      type: 'button',
      'aria-pressed': String(value === filter),
      onclick: (ev) => {
        filter = value;
        for (const b of ev.currentTarget.parentNode.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === ev.currentTarget));
        fill();
      },
    }, label)));
  fill();
  return h('section.dk-campaign', {},
    // M17-B : joueur gratuit, « 9 deals gratuits · 41 de plus dans l'édition » ; jamais le catalogue entier
    h('div.dk-section-head', {}, h('h2', {}, ui.campaignTitle), h('span.muted', {}, ctx.partial() ? ui.dkCampaignFree(count, lockedCount(ctx)) : ui.dkCampaignCount(count, types.length))),
    chips, body);
}

// Sans Team : la semaine du joueur, depuis la sauvegarde — deals joués depuis lundi, meilleur deal signé, étape à
// travailler (le point faible, sinon la maîtrise la plus basse), avec l'entraînement existant sur cette étape.
function soloWeekCard(ctx) {
  const ui = texts.ui;
  const { save, edition } = ctx;
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const played = (save.deals || []).filter((e) => e.at && new Date(e.at) >= monday).length;
  const best = Object.entries(save.best).filter(([, b]) => b.verdict === 'signed')
    .map(([id, b]) => ({ deal: ctx.allDeals?.find((d) => d.id === id), b })).filter((x) => x.deal)
    .sort((a, b) => (b.b.revenue || 0) - (a.b.revenue || 0))[0];
  const weak = weakSpot(save, edition);
  const lowest = edition.stages.map((s) => ({ s, m: mastery(save, s.key) })).filter((x) => x.m !== null).sort((a, b) => a.m - b.m)[0]?.s;
  const stage = weak ? edition.stages[weak.stage] : lowest;
  return h('section.card.dk-week', {},
    h('span.eyebrow', {}, ui.dkWeekTitle),
    h('p.dk-week-played', {}, ui.dkWeekPlayed(played)),
    h('div.dk-week-item', {}, h('span.small.muted', {}, ui.dkBestDeal),
      best ? h('p', {}, h('b', {}, best.deal.title), h('span.mono', {}, ` · ${ui.amount(best.b.revenue, edition.valueUnit)}`)) : h('p.small.muted', {}, ui.dkBestNone)),
    h('div.dk-week-item', {}, h('span.small.muted', {}, ui.dkWorkOn),
      stage
        ? h('button.ghost', { type: 'button', disabled: !ctx.deals.length, onclick: () => ctx.go('drill', { stage: stage.key, seed: Date.now() >>> 0 }) }, ui.dkWorkOnAction(stage.name.toLocaleLowerCase(ctx.lang)))
        : h('p.small.muted', {}, ui.dkWorkOnNone)));
}

// Défier un collègue : le code de défi du dernier deal joué (même deal, mêmes choix), copié avec l'adresse du jeu.
function challengeCard(ctx) {
  const ui = texts.ui;
  const last = (ctx.save.deals || []).map((e) => ({ e, deal: ctx.allDeals?.find((d) => d.id === e.id) })).find((x) => x.deal && x.e.grades?.length === 5);
  const status = h('p.small.muted', { role: 'status' });
  const copy = async () => {
    const code = encodeDuel(ctx.edition.id, last.deal.num, last.e.grades);
    try {
      // M17-B : le lien ouvre directement le deal du défi, dans la langue de l'émetteur si le receveur n'a pas choisi
      await navigator.clipboard.writeText(`${ui.challengeText(ctx.edition.name, last.deal.title, code)}\n${duelLink(code, ctx.lang)}`);
      status.textContent = ui.challengeCopied;
    } catch {
      status.textContent = ui.challengeCopyFailed;
    }
  };
  return h('section.card.dk-challenge', {},
    h('span.eyebrow', {}, ui.challenge),
    h('p', {}, last ? ui.dkChallengeHint : ui.dkChallengeNone),
    last ? h('button.ghost', { type: 'button', onclick: copy }, ui.dkChallengeCopy) : null,
    h('button.link', { type: 'button', onclick: () => ctx.go('duel') }, ui.duelButton),
    status);
}

// Colonne de droite : Mon équipe (code Team), sinon la semaine du joueur ; puis Défier un collègue et, pour un joueur
// gratuit, l'édition complète.
function sideColumn(ctx) {
  const ui = texts.ui;
  const col = h('div.dk-col.dk-right');
  if (teamRole() === 'team' && teamState().pseudo) {
    const slot = h('section.card.dk-team', {}, h('span.eyebrow', {}, ui.teamTitle), h('p.muted', {}, ui.dealsLoading));
    col.append(slot);
    fetchTeam().then((r) => {
      if (!r.ok || !col.contains(slot)) return;
      const d = r.data;
      slot.replaceChildren(h('span.eyebrow', {}, ui.dkTeamTitle(d.team?.name ?? '')), weekCard(ctx, d.week),
        h('ol.dk-rank', {}, d.players.slice(0, 8).map((p, i) => h(`li${p.me ? '.me' : ''}`, {},
          h('span.mono', {}, i + 1),
          h('span', {}, p.me ? ui.duelYou : p.pseudo),
          h('span.mono.small.muted', {}, ui.teamAvg(p.avg))))));
    }).catch(() => {});
  } else if (teamRole() === 'team') {
    col.append(h('section.card', {}, h('span.eyebrow', {}, ui.teamTitle), h('button.ghost', { type: 'button', onclick: () => ctx.go('team') }, ui.teamButton)));
  } else {
    col.append(soloWeekCard(ctx)); // sans Team : la semaine du joueur
  }
  col.append(challengeCard(ctx));
  if (ctx.partial() && buyReady(ctx.save)) col.append(fullEditionCard(ctx)); // M17-A : après 2 deals terminés
  return col;
}

export function desktopHomeScreen(root, _params, ctx) {
  root.classList.add('wide');
  let head = header(ctx); // redessiné quand les deals sont là (chiffres des offres)
  root.append(head);
  const center = h('div.dk-col.dk-center', {}, h('p.muted.loading', { role: 'status' }, texts.ui.dealsLoading));
  const left = h('div.dk-col.dk-left');
  const right = h('div.dk-col.dk-right');
  const grid = h('div.dk-grid', {}, left, center, right);
  root.append(grid);
  const fill = () => {
    if (!root.contains(center)) return;
    const fresh = header(ctx);
    head.replaceWith(fresh);
    head = fresh;
    // M17-A : première visite, un seul bloc centré ; « Voir tous les deals » : l'accueil complet pour la session
    const first = isFirstVisit(ctx.save) && !wantsAll() ? firstDeal(dailyPool(ctx.deals, { dev: ctx.dev }).deals, ctx.edition.id) : null;
    if (first) {
      grid.replaceWith(h('div.fv-center', {}, firstVisitBlock(ctx, first, () => { showAll(); root.replaceChildren(); desktopHomeScreen(root, _params, ctx); })));
      return;
    }
    left.replaceWith(profileColumn(ctx));
    center.replaceChildren(dailyCard(ctx), campaign(ctx));
    right.replaceWith(sideColumn(ctx));
  };
  ctx.onDeals(fill, () => { if (root.contains(center)) center.replaceChildren(ctx.dealsFailed()); });
  return { cleanup() { root.classList.remove('wide'); } };
}
