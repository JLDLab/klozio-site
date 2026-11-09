// KLOZIO Team (M11 lot C), côté jeu : pseudo, classement et deal de la semaine (/team/me), scores des deals terminés
// (/team/score, codes team seulement : l'individuel n'envoie rien), rappel à J+3 du deal de la semaine.
// Stockage : klozio.team.v1 (pseudo, dernier état reçu), klozio.team.queue.v1 (scores à envoyer, hors ligne),
// klozio.team.remind.v1 (jour du dernier rappel par notification).
import { config } from '../config.js';
import { errorMessage } from '../content/texts.js';
import { savedAccess, deviceId } from './client.js';

const TEAM_KEY = 'klozio.team.v1';
const QUEUE_KEY = 'klozio.team.queue.v1';
const REMIND_KEY = 'klozio.team.remind.v1';
export const PSEUDO = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{0,18}[\p{L}\p{N}.]$/u; // même règle que le Worker (stats/team.js)
const readJson = (storage, key) => { try { return JSON.parse(storage.getItem(key)) ?? null; } catch { return null; } };
const writeJson = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); } catch { /* sans stockage */ } };
export const cleanPseudo = (p) => String(p ?? '').trim().replace(/\s+/g, ' ');

// 'team' (joueur), 'manager', ou null (code individuel ou aucun code).
export function teamRole(storage = globalThis.localStorage) {
  const kind = savedAccess(storage)?.kind;
  return kind === 'team' || kind === 'manager' ? kind : null;
}

export function teamState(storage = globalThis.localStorage) {
  return readJson(storage, TEAM_KEY) ?? { pseudo: null, data: null };
}

const post = async (path, body, { storage, fetch: f, endpoint }) => {
  let res;
  try {
    res = await f(`${endpoint}${path}`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ ...body, code: savedAccess(storage).code, device_id: deviceId(storage) }) });
  } catch {
    return { ok: false, error: 'network', message: errorMessage('network') };
  }
  const json = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, json } : { ok: false, error: json.error ?? 'invalid', message: errorMessage(json.error ?? 'invalid', json.message) };
};
const defaults = (o) => ({ storage: globalThis.localStorage, fetch: globalThis.fetch, endpoint: config.access.endpoint, ...o });

// Classement et deal de la semaine de l'équipe ; enregistre le pseudo s'il est donné. Hors ligne : le dernier état
// reçu, { ok: true, data, offline: true }. M16 lot C : `deal` (id) → data.deal, l'équipe sur ce deal (débrief).
export async function fetchTeam({ pseudo, deal, ...o } = {}) {
  const opts = defaults(o);
  if (teamRole(opts.storage) !== 'team') return { ok: false, error: 'team' };
  const state = teamState(opts.storage);
  const p = pseudo === undefined ? undefined : cleanPseudo(pseudo);
  if (p !== undefined && !PSEUDO.test(p)) return { ok: false, error: 'pseudo', message: errorMessage('pseudo') };
  const r = await post('/team/me', { ...(p === undefined ? {} : { pseudo: p }), ...(deal ? { deal_id: deal } : {}) }, opts);
  if (!r.ok) return r.error === 'network' && state.data ? { ok: true, data: state.data, offline: true } : r;
  writeJson(opts.storage, TEAM_KEY, { pseudo: r.json.me?.pseudo ?? p ?? state.pseudo, data: r.json });
  await flushScores(opts);
  return { ok: true, data: r.json, offline: false };
}

// Envoie les scores en attente, dans l'ordre ; s'arrête au premier échec réseau (nouvel essai plus tard).
export async function flushScores(o = {}) {
  const opts = defaults(o);
  const queue = readJson(opts.storage, QUEUE_KEY) ?? [];
  while (queue.length) {
    const r = await post('/team/score', queue[0], opts);
    if (!r.ok && r.error === 'network') break;
    queue.shift(); // envoyé, ou refusé pour de bon (code révoqué, deal inconnu) : on ne le renvoie pas
    writeJson(opts.storage, QUEUE_KEY, queue);
  }
  return queue.length;
}

// Un deal terminé : { pseudo, deal_id, notes[5], result }, rien d'autre. Codes team seulement.
export function reportScore(dealId, res, o = {}) {
  const opts = defaults(o);
  const pseudo = teamState(opts.storage).pseudo;
  if (teamRole(opts.storage) !== 'team' || !pseudo) return false;
  const queue = readJson(opts.storage, QUEUE_KEY) ?? [];
  queue.push({ pseudo, deal_id: dealId, notes: res.grades.slice(0, 5), result: res.verdict });
  writeJson(opts.storage, QUEUE_KEY, queue.slice(-config.team.queueMax));
  flushScores(opts).catch(() => {});
  return true;
}

// Le joueur a-t-il terminé le deal de la semaine depuis qu'il a été choisi ? Lu dans la sauvegarde de son édition.
export function weekPlayed(week, storage = globalThis.localStorage) {
  const save = readJson(storage, `${config.save.prefix}${week.edition}${config.save.suffix}`);
  return Boolean(save?.deals?.some((d) => d.id === week.deal && d.at >= week.at));
}

// Rappel du deal de la semaine : dû à J+3 du choix du manager s'il n'est pas joué.
export function weekReminderDue(week, played, now = new Date()) {
  return Boolean(week?.at) && !played && now - new Date(week.at) >= config.team.remindDays * 86400000;
}

// Notification locale une fois par jour si la PWA a la permission ; sinon false (l'accueil montre un bandeau).
export async function notifyWeek(text, { storage = globalThis.localStorage, day } = {}) {
  if (globalThis.Notification?.permission !== 'granted') return false;
  if (readJson(storage, REMIND_KEY) === day) return true;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification('KLOZIO', { body: text, tag: 'klozio-week' });
    else new Notification('KLOZIO', { body: text, tag: 'klozio-week' });
    writeJson(storage, REMIND_KEY, day);
    return true;
  } catch {
    return false;
  }
}
