// Deal du jour (§4.7) : un deal tiré chaque jour depuis la date LOCALE et l'édition. Même date, même
// édition, même liste de deals = même deal pour tous. Premier essai officiel, les suivants en entraînement.
import { config } from '../config.js';
import { mulberry32, hashString } from '../core/rng.js';

const pad = (n) => String(n).padStart(2, '0');

// AAAAMMJJ en heure locale (jamais UTC : à 0 h 30 à Paris, c'est déjà le jour suivant).
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function fromKey(key) {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)), 12);
}

// M17-B : le lendemain (« Demain : un deal … »).
export function nextDayKey(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() + 1);
  return dayKey(d);
}

export function prevDayKey(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

// Deals éligibles : les validés ; s'il n'y en a aucun, les brouillons en mode développeur seulement.
export function dailyPool(deals, { dev = false } = {}, cfg = config) {
  const validated = deals.filter((d) => d.status === cfg.content.publicStatus);
  if (validated.length) return { deals: validated, drafts: false };
  return { deals: dev ? deals : [], drafts: dev && deals.length > 0 };
}

// Identifiant du deal du jour, ou null si la liste est vide. Tirage dans les identifiants triés.
export function dailyDealId(pool, editionId, key) {
  if (!pool.length) return null;
  const ids = pool.map((d) => d.id).sort();
  const rand = mulberry32((Number(key) ^ hashString(editionId)) >>> 0);
  return ids[Math.floor(rand() * ids.length)];
}

// Le premier essai du jour est officiel s'il n'a pas encore commencé.
export function isOfficial(save, key) {
  return !save.daily?.[key];
}

// Marque l'essai officiel comme commencé (au premier choix) : quitter en cours le consomme.
export function startDaily(save, key, dealId) {
  save.daily ||= {};
  if (save.daily[key]) return false;
  save.daily[key] = { id: dealId, status: 'started' };
  return true;
}

// Enregistre le résultat officiel du jour et met la série à jour. Ne garde que les derniers jours.
export function finishDaily(save, key, res, cfg = config) {
  const entry = save.daily?.[key];
  if (!entry || entry.status !== 'started') return null;
  Object.assign(entry, { status: 'done', verdict: res.verdict, revenue: res.revenue, grades: res.grades.slice() });
  const s = save.streak;
  if (s.last !== key) {
    s.count = s.last === prevDayKey(key) ? s.count + 1 : 1;
    s.last = key;
  }
  const keys = Object.keys(save.daily).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - cfg.daily.keepDays))) delete save.daily[k];
  return entry;
}

// Série affichée : jours consécutifs avec un deal du jour terminé, jusqu'à aujourd'hui ou hier.
export function currentStreak(save, key) {
  const s = save.streak || {};
  return s.last === key || s.last === prevDayKey(key) ? s.count || 0 : 0;
}
