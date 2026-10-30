// Entraînement ciblé (§4.9) : une même compétence (étape du cycle), tirée de deals différents.
// Tirage seedé (mulberry32) : même graine, même série. Ne touche ni au CA ni à la roue, seulement à la maîtrise.
import { config } from '../config.js';
import { mulberry32 } from '../core/rng.js';

// [{ deal, step }] : jusqu'à training.steps deals distincts, l'étape `step` est celle de la compétence.
export function drawTraining(deals, edition, stageKey, seed, cfg = config) {
  const step = edition.stages.findIndex((s) => s.key === stageKey);
  if (step < 0) return [];
  const pool = [...deals].sort((a, b) => (a.id < b.id ? -1 : 1));
  const rand = mulberry32(seed >>> 0);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cfg.training.steps).map((deal) => ({ deal, step }));
}

// Ajoute les notes de la série à la maîtrise de la compétence. Retourne la maîtrise avant / après (0–1).
export function applyTraining(save, stageKey, grades, cfg = config) {
  const max = Math.max(...cfg.deal.grades);
  const avg = (h) => (h.length ? h.reduce((n, g) => n + g, 0) / h.length / max : null);
  const hist = (save.history[stageKey] ||= []);
  const before = avg(hist);
  hist.push(...grades);
  if (hist.length > cfg.mastery.window) hist.splice(0, hist.length - cfg.mastery.window);
  return { before, after: avg(hist) };
}
