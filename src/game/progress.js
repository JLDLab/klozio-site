// Progression d'une édition : meilleurs résultats, roue, maîtrise, historique. Modifie la sauvegarde passée
// en argument. Les étapes viennent de l'édition (edition.stages), jamais d'une liste en dur.
import { config } from '../config.js';

const rank = { signed: 2, delayed: 1, lost: 0 };
const sum = (a) => a.reduce((n, x) => n + x, 0);
export const stageKeys = (edition) => edition.stages.map((s) => s.key);

// Meilleur résultat d'un deal : le montant signé d'abord, puis le verdict, puis les notes.
export function isBetter(a, b) {
  if (!b) return true;
  if ((a.revenue || 0) !== (b.revenue || 0)) return (a.revenue || 0) > (b.revenue || 0);
  if (rank[a.verdict] !== rank[b.verdict]) return rank[a.verdict] > rank[b.verdict];
  return sum(a.grades) > sum(b.grades || []);
}

// Compte un réflexe senior sur l'étape `key` pour la roue. Retourne true s'il fait progresser la part.
function addHit(save, key, dealId, cfg) {
  if (save.wedges[key]) return false;
  const hits = (save.wheelHits[key] ||= []);
  if (cfg.wheel.distinctDeals && hits.includes(dealId)) return false;
  hits.push(dealId);
  return true;
}

// Applique le résultat d'un deal. Retourne les parts gagnées, les étapes qui ont progressé (+1) et si
// c'est un record.
export function applyResult(save, deal, res, edition, now = new Date(), cfg = config) {
  const entry = { verdict: res.verdict, revenue: res.revenue, grades: res.grades.slice() };
  const record = isBetter(entry, save.best[deal.id]);
  if (record) save.best[deal.id] = entry;

  const newWedges = [];
  const hits = [];
  save.wheelHits ||= {};
  res.grades.forEach((grade, i) => {
    const key = edition.stages[i].key;
    const hist = (save.history[key] ||= []);
    hist.push(grade);
    if (hist.length > cfg.mastery.window) hist.splice(0, hist.length - cfg.mastery.window);
    if (grade === cfg.wheel.hitGrade && addHit(save, key, deal.id, cfg)) {
      hits.push(key);
      if (save.wheelHits[key].length >= cfg.wheel.requiredHits) {
        save.wedges[key] = now.toISOString();
        newWedges.push(key);
      }
    }
  });

  save.deals.unshift({ id: deal.id, ...entry, at: now.toISOString() });
  if (save.deals.length > cfg.mastery.historySize) save.deals.length = cfg.mastery.historySize;
  return { newWedges, hits, record };
}

// Progression de chaque part : [{ stage, hits, required, done }].
export function wheelProgress(save, edition, cfg = config) {
  const required = cfg.wheel.requiredHits;
  return edition.stages.map((stage) => {
    const done = Boolean(save.wedges[stage.key]);
    return { stage, done, required, hits: done ? required : Math.min(required, save.wheelHits?.[stage.key]?.length || 0) };
  });
}

// CA cumulé : somme des deals dont le meilleur résultat est signé.
export function totalRevenue(save) {
  return Object.values(save.best).reduce((n, b) => n + (b.verdict === 'signed' ? b.revenue || 0 : 0), 0);
}

export function signedCount(save) {
  return Object.values(save.best).filter((b) => b.verdict === 'signed').length;
}

// §4.6 sur les deals disponibles : CA signé (somme des meilleurs montants), CA possible (somme des valeurs),
// part capturée, nombre de deals signés.
export function revenueSummary(save, deals) {
  let signed = 0;
  let possible = 0;
  let count = 0;
  for (const d of deals) {
    possible += d.value;
    const b = save.best[d.id];
    if (b?.verdict === 'signed') {
      signed += b.revenue || 0;
      count += 1;
    }
  }
  return { signed, possible, share: possible ? signed / possible : 0, signedCount: count };
}

export function wheelComplete(save, edition) {
  return stageKeys(edition).every((k) => save.wedges[k]);
}

// Maîtrise d'une compétence : moyenne des dernières notes, ramenée entre 0 et 1. null si jamais jouée.
export function mastery(save, key, cfg = config) {
  const hist = save.history[key] || [];
  if (!hist.length) return null;
  return sum(hist) / hist.length / Math.max(...cfg.deal.grades);
}

// Maîtrise moyenne pour le titre : sur chaque compétence, les notes manquantes de la fenêtre
// comptent 0. Un titre se gagne donc sur la durée, pas sur un seul deal réussi.
export function masteryAverage(save, edition, cfg = config) {
  const keys = stageKeys(edition);
  const full = cfg.mastery.window * Math.max(...cfg.deal.grades);
  return keys.reduce((n, k) => n + sum(save.history[k] || []) / full, 0) / keys.length;
}

// Indice du titre de profil atteint selon la maîtrise moyenne.
export function titleIndex(save, edition, cfg = config) {
  const avg = masteryAverage(save, edition, cfg);
  let index = 0;
  cfg.profile.titleThresholds.forEach((min, i) => { if (avg >= min) index = i; });
  return index;
}
