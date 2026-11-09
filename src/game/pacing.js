// Durée de lecture d'un deal (A5) : contexte, question, 3 options et 3 feedbacks révélés, plus la réflexion.
import { config } from '../config.js';

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export function dealSeconds(deal, cfg = config) {
  let total = 0;
  for (const step of deal.steps) {
    const w = words(step.context) + words(step.question)
      + step.options.reduce((n, o) => n + words(o.text) + words(o.feedback), 0);
    total += (w / cfg.pacing.wordsPerMinute) * 60 + cfg.pacing.thinkSeconds;
  }
  return total;
}

// A5 : bornes acceptées en secondes, tolérance comprise.
export function paceBounds(cfg = config) {
  const p = cfg.pacing;
  return { min: p.minDealMinutes * 60 * (1 - p.tolerance), max: p.maxDealMinutes * 60 * (1 + p.tolerance) };
}

export function paceOk(seconds, cfg = config) {
  const b = paceBounds(cfg);
  return seconds >= b.min && seconds <= b.max;
}

export function formatDuration(seconds) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}
