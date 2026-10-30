// Accueil : édition en cours, roue, CA signé, accès Campagne, Profil, Options, autres éditions (actives, à venir).
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { contactLine } from '../../content/schema.js';
import { h, svg } from '../dom.js';
import { wheelSvg } from '../wheel.js';
import { lockIcon, soundIcon } from '../icons.js';
import { applyOptions } from '../theme.js';
import { wheelComplete, titleIndex, wheelProgress } from '../../game/progress.js';
import { revenueCard } from '../revenue.js';
import { dayKey, dailyPool, dailyDealId, currentStreak } from '../../game/daily.js';
import { fullEditionCard, offersButton } from './campaign.js';
import { teamRole, teamState, fetchTeam, weekPlayed, weekReminderDue, notifyWeek } from '../../access/team.js';
import { weekCard, weekTitle } from './team.js';
import { langSwitch } from '../lang.js';
import { isDesktop, desktopHomeScreen, nextToPlay, streakLine, tomorrowLine } from './home-desktop.js';
import { isFirstVisit, firstDeal, buyReady, firstVisitBlock, credLine } from './first-visit.js';

// Progression par part : « Négociation 2/3 ». Une part gagnée est marquée d'une coche (pas seulement la couleur).
export function wheelList(progress) {
  const ui = texts.ui;
  return h('ul.wp', {}, progress.map(({ stage, hits, required, done }) => h(`li${done ? '.done' : ''}`, {
    'aria-label': ui.wheelStageAria(stage.name, hits, required),
  },
  h('i', { style: { borderColor: 'var(--fg)', background: done ? 'var(--mid)' : null }, 'aria-hidden': 'true' }), // M17-A : chocolat, miel une fois gagnée
  h('span', {}, stage.name),
  h('span.mono', {}, done ? ui.wheelDone : ui.wheelStage(hits, required)))));
}

// Carte du deal du jour : titre, état de l'essai officiel, série de jours.
function dailyCard(ctx) {
  const ui = texts.ui;
  const key = dayKey();
  const pool = dailyPool(ctx.deals, { dev: ctx.dev });
  // M17-A : tant qu'aucun deal n'est joué, le premier deal imposé (hors deal du jour)
  const first = isFirstVisit(ctx.save) ? firstDeal(pool.deals, ctx.edition.id) : null;
  const id = first?.id ?? dailyDealId(pool.deals, ctx.edition.id, key);
  const deal = pool.deals.find((d) => d.id === id);
  const card = h('section.card.daily', {}, h('span.eyebrow', {}, first ? ui.fvTitle : ui.dailyTitle));
  if (first) {
    card.append(h('h2', {}, first.title), h('p.muted', {}, `${contactLine(first.contact)} · ${ctx.money(first.value)}`),
      h('button.cta', { type: 'button', onclick: () => ctx.go('game', { id: first.id }) }, ui.fvPlay));
    return card;
  }
  if (!deal) {
    card.append(h('p.muted', {}, ui.dailyEmpty));
    return card;
  }
  const entry = ctx.save.daily?.[key];
  const unit = ctx.edition.valueUnit;
  card.append(h('h2', {}, deal.title), h('p.muted', {}, `${contactLine(deal.contact)} · ${ctx.money(deal.value)}`));
  if (entry?.status === 'done') {
    card.append(h(`p.daily-result.${entry.verdict}`, {}, ui.dailyResult(texts.verdicts[entry.verdict], entry.revenue, deal.value, unit)));
  } else if (entry?.status === 'started') {
    card.append(h('p.muted', {}, ui.dailyAbandoned));
  }
  // M17-B : la série dès 2 jours (compteur miel) ; deal du jour fait : « Fait. Reviens demain… » et « Continuer » vers le
  // prochain deal non joué ; puis le secteur du deal de demain
  const streak = streakLine(ctx, key);
  if (streak) card.append(streak);
  if (pool.drafts) card.append(h('p.small.muted', {}, ui.dailyDrafts));
  if (entry?.status === 'done') {
    card.append(h('p.daily-done', {}, ui.dailyDone));
    const next = nextToPlay(ctx, deal.id);
    if (next) card.append(h('button.cta', { type: 'button', onclick: () => ctx.go('game', { id: next.id }) }, ui.dkContinue));
  } else {
    card.append(h(entry ? 'button.ghost' : 'button.cta', { type: 'button', onclick: () => ctx.go('game', { id: deal.id, daily: key }) },
      entry ? ui.dailyReplay : ui.dailyPlay));
  }
  const tomorrow = tomorrowLine(ctx, pool.deals, key);
  if (tomorrow) card.append(tomorrow);
  return card;
}

export function homeScreen(root, _params, ctx) {
  // M16 : à partir de config.ui.desktopMinPx de large, l'accueil ordinateur ; en dessous, celui-ci, inchangé.
  if (_params?.desktop ?? isDesktop()) return desktopHomeScreen(root, _params, ctx);
  const { save, dev, edition } = ctx;
  const ui = texts.ui;
  const parts = edition.stages.filter((s) => save.wedges[s.key]).length;

  if (dev) root.append(h('div.banner', {}, ui.devBanner));

  const on = Boolean(ctx.prefs.options.sound);
  const sound = h('button.ghost.icon', {
    type: 'button',
    'aria-pressed': String(on),
    'aria-label': on ? ui.soundOn : ui.soundOff,
    title: on ? ui.soundOn : ui.soundOff,
    onclick: () => {
      ctx.prefs.options.sound = !ctx.prefs.options.sound;
      ctx.persistPrefs();
      applyOptions(ctx.prefs.options);
      ctx.sound.play('click');
      const now = ctx.prefs.options.sound;
      sound.setAttribute('aria-pressed', String(now));
      sound.setAttribute('aria-label', now ? ui.soundOn : ui.soundOff);
      sound.title = now ? ui.soundOn : ui.soundOff;
      sound.replaceChildren(svg(soundIcon(now, 20)));
    },
  }, svg(soundIcon(on, 20)));
  // M8 v2 : le logo en haut (56 % de la largeur), puis l'édition et les actions.
  // M14 : le bouton FR / EN sur la ligne du logo, à droite (le logo n'en occupe que 56 %).
  root.append(h('div.home-top', {},
    h('h1.wordmark', {}, h('img', { src: config.brand.wordmark, alt: config.brand.name, width: 475, height: 156 })),
    langSwitch(ctx)));
  // M17-A : la ligne de crédibilité sous le logo (son chiffre arrive avec l'index des deals)
  const cred = h('div.cred-slot');
  root.append(cred);
  ctx.onDeals(() => cred.replaceChildren(...[credLine(ctx)].filter(Boolean)), () => {});

  // M17-A : première visite (aucun deal terminé dans l'édition) : un seul bloc, le premier deal imposé ; « Voir tous les
  // deals » ouvre la campagne. Sans ce deal dans la liste, l'accueil complet.
  if (isFirstVisit(save) && !_params?.all) {
    const slot = h('div.fv-slot', {}, h('p.muted', { role: 'status' }, ui.dealsLoading));
    root.append(slot);
    ctx.onDeals(() => {
      if (!root.contains(slot)) return;
      const deal = firstDeal(dailyPool(ctx.deals, { dev }).deals, edition.id);
      if (deal) return slot.replaceWith(firstVisitBlock(ctx, deal, () => ctx.go('campaign')));
      root.replaceChildren();
      return homeScreen(root, { ..._params, all: true }, ctx);
    }, () => { if (root.contains(slot)) slot.replaceChildren(ctx.dealsFailed()); });
    return {};
  }
  root.append(h('header.brand', {},
    h('div', {}, h('span.ed', {}, edition.name), h('span.role', {}, edition.role)),
    h('div.brand-actions', {}, sound, h('button.ghost', { type: 'button', onclick: () => ctx.go('options') }, ui.optionsButton))));

  // M11 lot C : pour un joueur d'équipe, le deal de la semaine en tête ; à J+3 s'il n'est pas joué, une
  // notification si la PWA a la permission, sinon un bandeau.
  const role = teamRole();
  if (role === 'team' && teamState().pseudo) {
    const week = h('div.stack.week-slot');
    root.append(week);
    // M14 : après les deals, pour titrer le deal de la semaine dans la langue du jeu (weekTitle)
    const deals = new Promise((ok) => ctx.onDeals(ok, ok));
    Promise.all([fetchTeam(), deals]).then(async ([r]) => {
      if (!r.ok || !r.data.week || !root.contains(week)) return;
      const w = r.data.week;
      const due = weekReminderDue(w, weekPlayed(w));
      const notified = due && await notifyWeek(ui.weekReminder(weekTitle(ctx, w)), { day: dayKey() });
      week.replaceChildren(...[due && !notified ? h('div.banner', { role: 'status' }, ui.weekReminder(weekTitle(ctx, w))) : null, weekCard(ctx, w)].filter(Boolean));
    }).catch(() => {});
  }

  const progress = wheelProgress(save, edition);
  root.append(h('section.card.board', {},
    svg(wheelSvg(132, save.wedges, edition, { progress: Object.fromEntries(progress.map((x) => [x.stage.key, x.hits / x.required])) })),
    h('div', {},
      h('h2', {}, ui.wheelTitle),
      h('p', {}, ui.wheelHint(config.wheel.requiredHits)),
      h('p.count', {}, ui.wheelCount(parts, edition.stages.length)),
      wheelComplete(save, edition) ? h('p.complete', {}, edition.completeTitle) : null),
    wheelList(progress)));

  // M9 : les cartes qui lisent les deals (CA, deal du jour) attendent leur index, chargé après ce premier affichage ;
  // à sa place, une carte d'attente de même gabarit.
  const pending = h('div.deal-cards', {},
    h('section.card.revenue.pending', { 'aria-busy': 'true' }, h('span.eyebrow', {}, ui.revenueLabel), h('p.muted', {}, ui.dealsLoading)),
    h('section.card.daily.pending', { 'aria-busy': 'true' }, h('span.eyebrow', {}, ui.dailyTitle), h('p.muted', {}, ui.dealsLoading)));
  root.append(pending);

  // M17-A : un seul bouton bleu plein par écran (celui du deal du jour) ; la campagne passe en contour
  const campaign = h('button.ghost', { type: 'button', onclick: () => ctx.go('campaign') }, ui.campaignButton);
  const training = h('button.ghost', { type: 'button', onclick: () => ctx.go('training') }, ui.trainingButton);
  const duel = h('button.ghost', { type: 'button', onclick: () => ctx.go('duel') }, ui.duelButton);
  root.append(h('nav.stack', {},
    campaign,
    training,
    h('button.ghost.wide', { type: 'button', onclick: () => ctx.go('profile') },
      h('span', {}, ui.profileButton), h('span.muted', {}, edition.profileTitles[titleIndex(save, edition)])),
    duel,
    role ? h('button.ghost', { type: 'button', onclick: () => ctx.go('team') }, ui.teamButton) : null,
    offersButton(ctx))); // M13 : entre « Relever un défi » et « Autres éditions » ; absent de l'app Play

  // M10-A : carte « Édition complète » sous les éditions ; son total n'est connu qu'avec l'index des deals.
  const fullEdition = h('div.full-edition-slot');

  const fill = () => {
    if (!root.contains(pending)) return; // l'accueil a déjà été quitté
    const cards = [revenueCard(ctx)];
    if (ctx.deals.length === 0) cards.push(h('section.card.empty', {}, h('p', {}, ui.noDeals), h('p.muted', {}, ui.noDealsHint)));
    cards.push(dailyCard(ctx));
    pending.replaceChildren(...cards);
    for (const b of [campaign, training, duel]) b.disabled = ctx.deals.length === 0;
    if (ctx.partial() && buyReady(save)) fullEdition.replaceChildren(fullEditionCard(ctx)); // M17-A : après 2 deals
    if (dev && ctx.invalid.length) root.prepend(h('div.banner', {}, ui.dealsInvalid(ctx.invalid.length)));
  };
  ctx.onDeals(fill, () => { if (root.contains(pending)) pending.replaceChildren(ctx.dealsFailed()); });

  // Changer d'édition : chaque édition a sa sauvegarde ; l'application redémarre sur l'édition choisie.
  const others = ctx.catalogue.filter((e) => e.status === 'active' && e.id !== edition.id);
  const soon = ctx.catalogue.filter((e) => e.status !== 'active' && !e.hidden);
  if (others.length || soon.length) {
    root.append(h('section.editions', { 'aria-label': ui.otherEditions },
      h('span.eyebrow', {}, ui.otherEditions),
      h('ul', {},
        others.map((e) => h('li', {}, h('button.ghost.edition-switch', {
          type: 'button',
          'aria-label': ui.editionSwitchAria(e.name),
          onclick: () => {
            ctx.prefs.edition = e.id;
            ctx.persistPrefs();
            location.reload();
          },
        }, h('span', {}, e.name), h('span.soon', {}, ui.editionPlay)))),
        soon.map((e) => h('li.edition-soon', { 'aria-label': ui.editionAria(e.name) },
          svg(lockIcon(16)), h('span', {}, e.name), h('span.soon', {}, ui.editionSoon))))));
  }
  root.append(fullEdition);
  return {};
}
