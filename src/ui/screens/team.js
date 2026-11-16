// « Mon équipe » (M11 lot C) : pour un code joueur, le deal de la semaine, le classement de l'équipe et le pseudo ;
// pour un code manager, le bouton qui ouvre le tableau d'équipe servi par le Worker (/team).
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { catalogue } from '../../content/editions/index.js';
import { savedAccess, deviceId } from '../../access/client.js';
import { teamRole, teamState, fetchTeam, weekPlayed, PSEUDO, cleanPseudo } from '../../access/team.js';
import { h } from '../dom.js';

// Ouvre le deal de la semaine : dans l'édition en cours, ou en basculant sur la sienne (lien profond ?deal=).
function playWeek(ctx, week) {
  if (week.edition === ctx.edition.id) return ctx.go('game', { id: week.deal });
  ctx.prefs.edition = week.edition;
  ctx.persistPrefs();
  return location.replace(`${location.pathname}?${config.pwa.dealParam}=${encodeURIComponent(week.deal)}`);
}

// Titre du deal de la semaine : celui du deal dans la langue du jeu s'il est chargé (M14), sinon celui du Worker.
export const weekTitle = (ctx, week) => ctx.allDeals?.find((d) => d.id === week.deal)?.title ?? week.title ?? week.deal;

// Carte du deal de la semaine, en tête de l'accueil et de « Mon équipe ».
export function weekCard(ctx, week) {
  const ui = texts.ui;
  const card = h('section.card.daily.week', {}, h('span.eyebrow', {}, ui.weekTitle));
  if (!week) {
    card.append(h('p.muted', {}, ui.weekNone));
    return card;
  }
  const played = weekPlayed(week);
  card.append(h('h2', {}, weekTitle(ctx, week)), h('p', {}, ui.weekFromManager));
  if (week.edition !== ctx.edition.id) card.append(h('p.mono.small', {}, ui.weekOther(catalogue.find((e) => e.id === week.edition)?.name ?? week.edition)));
  if (played) card.append(h('p.mono.small', {}, ui.weekPlayed));
  card.append(h(played ? 'button.ghost' : 'button.cta', { type: 'button', onclick: () => playWeek(ctx, week) }, played ? ui.weekReplay : ui.weekPlay));
  return card;
}

// Saisie du pseudo (première saisie du code, ou changement). `done(data)` reçoit l'état de l'équipe.
export function pseudoForm(done, initial = '') {
  const ui = texts.ui;
  const input = h('input.code-input.pseudo-input', { type: 'text', value: initial, maxlength: 20, autocomplete: 'nickname', 'aria-label': ui.pseudoLabel, enterkeyhint: 'done' });
  const save = h('button.cta', { type: 'button' }, ui.pseudoSave);
  const message = h('p.duel-msg', { role: 'status' });
  let busy = false;
  const go = async () => {
    if (busy) return;
    if (!PSEUDO.test(cleanPseudo(input.value))) {
      message.textContent = ui.pseudoInvalid;
      message.className = 'duel-msg bad';
      return;
    }
    busy = true;
    save.disabled = true;
    const r = await fetchTeam({ pseudo: input.value });
    busy = false;
    save.disabled = false;
    if (!r.ok || r.offline) {
      message.textContent = r.message ?? ui.teamFailed;
      message.className = 'duel-msg bad';
      return;
    }
    done(r.data);
  };
  save.addEventListener('click', go);
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } });
  queueMicrotask(() => input.focus());
  return h('section.card.duel', {}, h('label.eyebrow', {}, ui.pseudoLabel), input, h('p.small.muted', {}, ui.pseudoHint), save, message);
}

function rankingCard(data) {
  const ui = texts.ui;
  const card = h('section.card.team-rank', {}, h('span.eyebrow', {}, ui.teamRankTitle));
  if (data.me) card.append(h('h2', {}, data.me.rank === 1 ? ui.teamRankFirst(data.players.length) : ui.teamRank(data.me.rank, data.players.length)));
  if (!data.players.some((p) => p.deals > 0)) card.append(h('p.muted', {}, ui.teamNoPlayers));
  card.append(h('ol.team-list', {}, data.players.map((p) => h(`li${p.me ? '.me' : ''}`, {},
    h('span', {}, p.pseudo, p.me ? h('span.muted', {}, ` · ${ui.teamYou}`) : null),
    h('span.mono.small.muted', {}, ui.teamPlayerLine(p.deals, p.signed)),
    h('span.mono', {}, ui.teamAvg(p.avg))))));
  return card;
}

// Formulaire du tableau d'équipe : le code et l'appareil partent en POST (jamais dans l'adresse), vers le Worker.
function managerCard() {
  const ui = texts.ui;
  const hidden = (name, value) => h('input', { type: 'hidden', name, value });
  return h('section.card.duel', {}, h('p', {}, ui.managerHint),
    h('form', { method: 'post', action: `${config.access.endpoint}/team`, target: '_blank' },
      hidden('code', savedAccess().code), hidden('device_id', deviceId()), hidden('action', 'view'),
      h('button.cta', { type: 'submit' }, ui.managerOpen)));
}

export function teamScreen(root, _params, ctx) {
  const ui = texts.ui;
  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.teamTitle)));
  const role = teamRole();
  if (role === 'manager') root.append(managerCard());
  if (role !== 'team') return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };

  const body = h('div.stack');
  root.append(body);
  const show = (data, offline) => body.replaceChildren(...[
    offline ? h('p.small.muted', {}, ui.teamOffline) : null,
    weekCard(ctx, data.week),
    rankingCard(data),
    h('button.ghost', { type: 'button', onclick: () => body.replaceChildren(pseudoForm((d) => show(d, false), teamState().pseudo ?? '')) }, ui.pseudoChange),
  ].filter(Boolean));
  if (!teamState().pseudo) body.append(pseudoForm((d) => show(d, false)));
  else {
    body.append(h('p.muted.loading', { role: 'status' }, ui.dealsLoading));
    fetchTeam().then((r) => {
      if (!root.contains(body)) return;
      if (r.ok) show(r.data, r.offline);
      else body.replaceChildren(h('p', { role: 'alert' }, r.error === 'team' ? ui.teamFailed : r.message ?? ui.teamFailed));
    });
  }
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
