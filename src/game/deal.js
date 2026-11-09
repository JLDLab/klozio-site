// Moteur d'un deal : température, choix, événements, valeur préservée, verdict. Pur, sans DOM.
import { config } from '../config.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round4 = (x) => Math.round(x * 10000) / 10000;

// `edition` fournit les étapes « valeur » (edition.valueStages), où le barème de perte est multiplié.
export function startDeal(deal, edition, cfg = config) {
  return {
    deal,
    valueStages: edition.stages.map((s) => edition.valueStages.includes(s.key)),
    step: 0,
    temp: cfg.deal.startTemp,
    grades: [],
    picks: [],
    events: [],
    impacts: [], // perte de valeur de chaque étape (0 ou négatif)
  };
}

export function isOver(run) {
  return run.step >= run.deal.steps.length;
}

// Perte de valeur d'une option (§4.4) : son valueImpact s'il existe, sinon le barème de sa note,
// multiplié aux étapes « valeur ».
export function optionImpact(option, isValueStage, cfg = config) {
  if (typeof option.valueImpact === 'number') return option.valueImpact;
  const base = cfg.deal.valueImpact[option.grade] ?? 0;
  return isValueStage ? base * cfg.deal.valueStageFactor : base;
}

// Part de la valeur préservée : 1 + somme des pertes, jamais sous le plancher.
export function valueShare(impacts, cfg = config) {
  return Math.max(cfg.deal.valueFloor, round4(1 + impacts.reduce((n, x) => n + x, 0)));
}

// Joue l'option d'indice `index` à l'étape courante. Retourne { grade, delta, event, impact }.
// Un événement (§4.3) s'ajoute à l'effet de la note et sera montré avant l'étape suivante.
export function choose(run, index, cfg = config) {
  if (isOver(run)) throw new Error(`deal ${run.deal.id} déjà terminé`);
  const option = run.deal.steps[run.step].options[index];
  if (!option) throw new Error(`option ${index} absente (deal ${run.deal.id}, étape ${run.step + 1})`);
  const gradeDelta = cfg.deal.delta[option.grade];
  if (gradeDelta === undefined) throw new Error(`note ${option.grade} sans delta en config`);
  const before = run.temp;
  run.temp = clamp(run.temp + gradeDelta, cfg.deal.minTemp, cfg.deal.maxTemp);
  let event = null;
  if (option.event) {
    event = { step: run.step, text: option.event.text, temp: option.event.temp };
    run.temp = clamp(run.temp + option.event.temp, cfg.deal.minTemp, cfg.deal.maxTemp);
    run.events.push(event);
  }
  const impact = optionImpact(option, run.valueStages[run.step], cfg);
  run.impacts.push(impact);
  run.grades.push(option.grade);
  run.picks.push(index);
  run.step += 1;
  return { grade: option.grade, delta: run.temp - before, event, impact };
}

// 'signed' | 'delayed' | 'lost'
export function verdictFor(temp, cfg = config) {
  if (temp >= cfg.deal.thresholds.signed) return 'signed';
  if (temp >= cfg.deal.thresholds.delayed) return 'delayed';
  return 'lost';
}

// Étape qui a coûté le plus de valeur : { step, impact, reason } (reason : valueReason de l'option ou null).
export function costliestStep(run) {
  let at = -1;
  run.impacts.forEach((x, i) => { if (x < 0 && (at < 0 || x < run.impacts[at])) at = i; });
  if (at < 0) return null;
  const option = run.deal.steps[at].options[run.picks[at]];
  return { step: at, impact: run.impacts[at], reason: option.valueReason || null };
}

export function result(run, cfg = config) {
  const verdict = verdictFor(run.temp, cfg);
  const share = valueShare(run.impacts, cfg);
  return {
    dealId: run.deal.id,
    verdict,
    temp: run.temp,
    grades: run.grades.slice(),
    events: run.events.length,
    value: run.deal.value,
    share, // part de la valeur préservée (plancher compris), même si le deal n'est pas signé
    revenue: verdict === 'signed' ? Math.round(run.deal.value * share) : 0, // montant signé
    costliest: costliestStep(run),
  };
}
