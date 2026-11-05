// Schéma d'un deal et contrôles de conformité (A4 longueurs, A6 équité). Pur, utilisable en jeu,
// dans le selftest et dans l'éditeur.
//
// Deal : { id, edition, num, title, contact: { role, org }, value, sector, saleType, difficulty, status,
//          author, vecu?, steps: [ { context, question,
//                             options: [ { grade, text, feedback, event?, valueImpact?, valueReason? } ],
//                             post?: { t, h } } ] }   post : leçon à partager (titre, accroche)
// Un deal se valide toujours contre son édition (editions/<id>/edition.js) : types de vente, nombre d'étapes.
import { config } from '../config.js';
import { positionIssues } from './arrange.js';

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const len = (s) => [...s].length;

// Ligne « fonction · organisation » d'un deal, sans séparateur quand l'organisation est vide.
export const contactLine = (contact) => [contact.role, contact.org].filter(isText).join(' · ');

// Erreurs de structure : un deal qui en a une est ignoré en jeu.
export function validateDeal(deal, edition, cfg = config) {
  const errors = [];
  const err = (msg) => errors.push(msg);
  if (!deal || typeof deal !== 'object') return ['deal absent ou non objet'];

  if (!isText(deal.id) || !/^[a-z0-9-]+$/.test(deal.id)) err('id : minuscules, chiffres et tirets');
  if (deal.edition !== edition.id) err(`edition : « ${edition.id} » attendu, trouvé « ${deal.edition} »`);
  if (!Number.isInteger(deal.num) || deal.num < 1 || deal.num > cfg.duel.maxDealNum) {
    err(`num : numéro stable du deal (codes de duel), entier de 1 à ${cfg.duel.maxDealNum}`);
  }
  if (!isText(deal.title)) err('title manquant');
  if (!deal.contact || !isText(deal.contact.role) || typeof deal.contact.org !== 'string') err('contact.role requis, contact.org texte (vide si le who source est sans séparateur)');
  if (!Number.isFinite(deal.value) || deal.value <= 0) err('value : montant en k€ > 0');
  if (!isText(deal.sector)) err('sector manquant');
  if (!edition.saleTypes.includes(deal.saleType)) err(`saleType inconnu : ${deal.saleType}`);
  if (!Number.isInteger(deal.difficulty) || deal.difficulty < cfg.deal.minDifficulty || deal.difficulty > cfg.deal.maxDifficulty) {
    err(`difficulty : entier de ${cfg.deal.minDifficulty} à ${cfg.deal.maxDifficulty}`);
  }
  if (!cfg.content.statuses.includes(deal.status)) err(`status inconnu : ${deal.status}`);
  if (!isText(deal.author)) err('author manquant');
  if (deal.vecu !== undefined && deal.vecu !== true) err('vecu : true ou absent');

  if (!Array.isArray(deal.steps) || deal.steps.length !== edition.stages.length) {
    err(`steps : exactement ${edition.stages.length} étapes`);
    return errors;
  }
  deal.steps.forEach((step, si) => {
    const at = `étape ${si + 1}`;
    if (!isText(step?.context)) err(`${at} : context manquant`);
    if (!isText(step?.question)) err(`${at} : question manquante`);
    if (step?.post !== undefined && (!step.post || !isText(step.post.t) || !isText(step.post.h))) err(`${at} : post { t, h } incomplet`);
    if (!Array.isArray(step?.options) || step.options.length !== cfg.deal.optionsPerStep) {
      err(`${at} : exactement ${cfg.deal.optionsPerStep} options`);
      return;
    }
    step.options.forEach((o, oi) => {
      if (!isText(o?.text)) err(`${at}, option ${oi + 1} : text manquant`);
      if (!isText(o?.feedback)) err(`${at}, option ${oi + 1} : feedback manquant`);
      if (o?.valueImpact !== undefined) {
        const d = cfg.deal;
        if (typeof o.valueImpact !== 'number' || !(o.valueImpact >= d.optionImpactMin && o.valueImpact <= d.optionImpactMax)) {
          err(`${at}, option ${oi + 1} : valueImpact de ${d.optionImpactMin} à ${d.optionImpactMax} (ex. -0.15)`);
        }
        if (!d.optionImpactGrades.includes(o.grade)) err(`${at}, option ${oi + 1} : valueImpact réservé aux notes ${d.optionImpactGrades.join('/')}`);
      }
      if (o?.valueReason !== undefined && !isText(o.valueReason)) err(`${at}, option ${oi + 1} : valueReason vide`);
      if (o?.event !== undefined) {
        const ev = o.event;
        const where = `${at}, option ${oi + 1}, event`;
        if (typeof ev !== 'object' || ev === null) err(`${where} : doit être un objet { text, temp }`);
        else {
          if (!isText(ev.text)) err(`${where} : text manquant`);
          if (!Number.isInteger(ev.temp) || ev.temp < cfg.event.minTemp || ev.temp > cfg.event.maxTemp) {
            err(`${where} : temp entier de ${cfg.event.minTemp} à ${cfg.event.maxTemp}`);
          }
          if (!cfg.event.grades.includes(o.grade)) err(`${where} : réservé aux options notées ${cfg.event.grades.join('/')}`);
          if (si === deal.steps.length - 1) err(`${where} : impossible à la dernière étape`);
        }
      }
    });
    const grades = step.options.map((o) => o?.grade).sort().join(',');
    const want = [...cfg.deal.grades].sort().join(',');
    if (grades !== want) err(`${at} : notes attendues ${cfg.deal.grades.join('/')}, trouvées ${step.options.map((o) => o?.grade).join('/')}`);
  });
  return errors;
}

// A4 : dépassements de longueur. Retourne [{ step, field, option?, length, max }].
export function lengthIssues(deal, cfg = config) {
  const out = [];
  const lim = cfg.limits;
  deal.steps.forEach((step, si) => {
    const s = si + 1;
    if (len(step.context) > lim.context) out.push({ step: s, field: 'contexte', length: len(step.context), max: lim.context });
    if (len(step.question) > lim.question) out.push({ step: s, field: 'question', length: len(step.question), max: lim.question });
    if (step.post && len(step.post.t) > lim.postTitle) out.push({ step: s, field: 'post.t', length: len(step.post.t), max: lim.postTitle });
    if (step.post && len(step.post.h) > lim.postHook) out.push({ step: s, field: 'post.h', length: len(step.post.h), max: lim.postHook });
    step.options.forEach((o, oi) => {
      if (len(o.text) > lim.option) out.push({ step: s, field: 'option', option: oi + 1, length: len(o.text), max: lim.option });
      if (len(o.feedback) > lim.feedback) out.push({ step: s, field: 'feedback', option: oi + 1, length: len(o.feedback), max: lim.feedback });
      if (o.event && len(o.event.text) > lim.event) out.push({ step: s, field: 'événement', option: oi + 1, length: len(o.event.text), max: lim.event });
      if (o.valueReason && len(o.valueReason) > lim.valueReason) out.push({ step: s, field: 'valueReason', option: oi + 1, length: len(o.valueReason), max: lim.valueReason });
    });
  });
  return out;
}

const bestIndex = (step) => step.options.findIndex((o) => o.grade === 3);

// A6 pour une étape : longueur des options, écart de la meilleure avec la moyenne des autres, et alerte si
// la meilleure est la plus longue de plus de fairness.maxLengthGap (le défaut le plus fréquent des brouillons).
export function stepLengths(step, cfg = config) {
  const lengths = step.options.map((o) => len(o.text || ''));
  const best = bestIndex(step);
  const others = lengths.filter((_, i) => i !== best);
  const mean = others.reduce((n, x) => n + x, 0) / (others.length || 1);
  const gap = best < 0 || mean === 0 ? 0 : lengths[best] / mean - 1;
  const longest = best >= 0 && others.every((x) => x < lengths[best]);
  return { lengths, best, gap, longest, warn: longest && gap > cfg.fairness.maxLengthGap };
}

// A6 pour un deal : positions de la meilleure réponse et écart de longueur.
export function dealFairness(deal) {
  const positions = deal.steps.map((s) => bestIndex(s) + 1);
  let best = 0;
  let others = 0;
  let longest = 0;
  for (const step of deal.steps) {
    const b = bestIndex(step);
    best += len(step.options[b].text);
    others += step.options.filter((_, i) => i !== b).reduce((n, o) => n + len(o.text), 0) / (step.options.length - 1);
    if (step.options.every((o, i) => i === b || len(o.text) < len(step.options[b].text))) longest += 1;
  }
  return {
    positions,
    varies: new Set(positions).size > 1,
    lengthGap: best / others - 1,
    bestIsLongest: longest,
  };
}

// A6 sur un ensemble de deals : part de chaque position, écart de longueur global.
export function setFairness(deals, cfg = config) {
  const counts = new Array(cfg.deal.optionsPerStep).fill(0);
  let best = 0;
  let others = 0;
  let steps = 0;
  for (const deal of deals) {
    for (const step of deal.steps) {
      const b = bestIndex(step);
      counts[b] += 1;
      best += len(step.options[b].text);
      others += step.options.filter((_, i) => i !== b).reduce((n, o) => n + len(o.text), 0) / (step.options.length - 1);
      steps += 1;
    }
  }
  const shares = counts.map((c) => (steps ? c / steps : 0));
  const f = cfg.fairness;
  return {
    steps,
    counts,
    shares,
    sharesOk: steps > 0 && shares.every((x) => x >= f.minPositionShare && x <= f.maxPositionShare),
    lengthGap: steps ? best / others - 1 : 0,
    lengthOk: steps === 0 || best / others - 1 < f.maxLengthGap,
  };
}

// Toutes les non-conformités A4/A6 d'un deal, en phrases.
export function dealIssues(deal, cfg = config) {
  const issues = lengthIssues(deal, cfg).map((i) =>
    `A4 étape ${i.step} ${i.field}${i.option ? ` ${i.option}` : ''} : ${i.length} car. > ${i.max}`);
  const f = dealFairness(deal);
  issues.push(...positionIssues(deal, cfg));
  if (f.lengthGap >= cfg.fairness.maxLengthGap) {
    issues.push(`A6 meilleure réponse plus longue de ${Math.round(f.lengthGap * 100)} % que les autres (max ${Math.round(cfg.fairness.maxLengthGap * 100)} %)`);
  }
  return issues;
}

// Numéros (`num`) et identifiants en double dans une liste de deals d'une même édition.
export function duplicateKeys(deals) {
  const dup = (key) => {
    const seen = new Set();
    return deals.map((d) => d?.[key]).filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
  };
  return { ids: dup('id'), nums: dup('num') };
}

// Prochain numéro libre : jamais réutilisé tant que la liste garde le plus grand.
export function nextDealNum(deals) {
  return deals.reduce((m, d) => Math.max(m, Number.isInteger(d?.num) ? d.num : 0), 0) + 1;
}

// Deals jouables : valides au schéma, et validés sauf en mode développeur.
export function playableDeals(deals, edition, { dev = false } = {}, cfg = config) {
  const ok = [];
  const invalid = [];
  for (const deal of deals) {
    const errors = validateDeal(deal, edition, cfg);
    if (errors.length) invalid.push({ id: deal?.id, errors });
    else if (dev || deal.status === cfg.content.publicStatus) ok.push(deal);
  }
  return { deals: ok, invalid };
}

const hex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

// Structure d'une édition (§4.10). Une édition invalide fait échouer le selftest.
export function validateEdition(edition, cfg = config) {
  const errors = [];
  const err = (msg) => errors.push(msg);
  if (!edition || typeof edition !== 'object') return ['édition absente'];
  if (!isText(edition.id) || !/^[a-z][a-z0-9-]*$/.test(edition.id)) err('id : minuscules, chiffres et tirets');
  for (const k of ['name', 'role', 'valueUnit', 'completeTitle']) if (!isText(edition[k])) err(`${k} manquant`);
  if (!hex(edition.signature?.light) || !hex(edition.signature?.dark)) err('signature : couleurs claire et sombre #rrggbb');
  if (!Array.isArray(edition.saleTypes) || edition.saleTypes.length === 0) err('saleTypes : au moins un type de vente');
  else if (edition.saleTypes.some((t) => !/^[a-z][a-z0-9-]*$/.test(t))) err('saleTypes : minuscules, chiffres et tirets');
  if (!Array.isArray(edition.stages) || edition.stages.length !== cfg.deal.stepsPerDeal) {
    err(`stages : exactement ${cfg.deal.stepsPerDeal} étapes`);
  } else {
    const keys = edition.stages.map((s) => s?.key);
    if (new Set(keys).size !== keys.length) err('stages : clés en double');
    edition.stages.forEach((s, i) => {
      const at = `étape ${i + 1}`;
      if (!isText(s?.key) || !/^[a-z][a-z0-9]*$/.test(s.key)) err(`${at} : key en minuscules et chiffres`);
      if (!isText(s?.name)) err(`${at} : name manquant`);
      if (!isText(s?.abbr) || len(s.abbr) > cfg.editions.maxAbbr) err(`${at} : abbr de 1 à ${cfg.editions.maxAbbr} caractères`);
      if (!hex(s?.color?.light) || !hex(s?.color?.dark)) err(`${at} : couleurs claire et sombre #rrggbb`);
      if (!isText(s?.icon) || /<script|\son\w+=/i.test(s.icon)) err(`${at} : icon SVG manquant ou non sûr`);
    });
  }
  const keys = Array.isArray(edition.stages) ? edition.stages.map((s) => s?.key) : [];
  if (!Array.isArray(edition.valueStages) || edition.valueStages.some((k) => !keys.includes(k))) err('valueStages : clés d\'étapes de l\'édition');
  for (const k of keys) {
    const reasons = edition.valueReasons?.[k];
    if (!Array.isArray(reasons) || reasons.length < 2 || !reasons.every(isText)) err(`valueReasons.${k} : au moins 2 raisons`);
    else if (reasons.some((r) => len(r) > cfg.limits.valueReason)) err(`valueReasons.${k} : raison > ${cfg.limits.valueReason} caractères`);
  }
  if (!Array.isArray(edition.profileTitles) || edition.profileTitles.length !== cfg.profile.titleThresholds.length) {
    err(`profileTitles : ${cfg.profile.titleThresholds.length} titres (un par seuil de config.profile.titleThresholds)`);
  }
  return errors;
}
