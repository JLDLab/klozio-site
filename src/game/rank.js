// Position face aux autres joueurs (M17-A) : la répartition des réflexes seniors d'un deal (GET /stats/deal/:id du
// Worker, compteurs 0 à 5, toutes langues), comparée au résultat du joueur. Rien n'est envoyé pour la lire.
import { config } from '../config.js';

// Part (en %) des parties mesurées avec strictement moins de réflexes seniors que `seniors` ; null sous
// config.stats.minPlays parties.
export function betterThan(dist, seniors, cfg = config) {
  const s = Array.isArray(dist?.s) && dist.s.length === 6 ? dist.s.map((n) => Math.max(0, Number(n) || 0)) : null;
  if (!s) return null;
  const total = s.reduce((a, b) => a + b, 0);
  if (total < cfg.stats.minPlays) return null;
  const below = s.slice(0, Math.max(0, Math.min(6, seniors))).reduce((a, b) => a + b, 0);
  return Math.round((100 * below) / total);
}

// Phrase à afficher au débrief : { kind: 'better', n } (mieux que n %), ou, sous config.stats.minBetter %,
// { kind: 'hard', x } (seuls x % des parties atteignent config.stats.hardFrom réflexes seniors) ; null sous
// config.stats.minPlays parties.
export function rankMessage(dist, seniors, cfg = config) {
  const n = betterThan(dist, seniors, cfg);
  if (n === null) return null;
  if (n >= cfg.stats.minBetter) return { kind: 'better', n };
  const s = dist.s.map((v) => Math.max(0, Number(v) || 0));
  const total = s.reduce((a, b) => a + b, 0);
  return { kind: 'hard', x: Math.round((100 * s.slice(cfg.stats.hardFrom).reduce((a, b) => a + b, 0)) / total) };
}

// La répartition d'un deal, ou null (hors ligne, Worker absent, réponse invalide).
export async function fetchDealStats(id, { fetch: f = globalThis.fetch, cfg = config } = {}) {
  if (!cfg.stats.dealStats || typeof f !== 'function' || !globalThis.location?.hostname) return null; // navigateur seulement
  try {
    const r = await f(`${cfg.stats.dealStats}${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.id === id ? j : null;
  } catch {
    return null;
  }
}
