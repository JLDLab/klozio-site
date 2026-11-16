// Duel asynchrone (§4.8), sans serveur : un code encode l'édition, le deal (numéro stable `num`) et les
// 5 notes. Format : KLZ-AE-XXXXC (4 caractères de données en base 32 Crockford + 1 caractère de contrôle).
// Le segment d'édition vient du catalogue (AE, VP…) ; le contrôle porte sur ce segment.
// Données : num × 3^5 + notes en base 3 (0 → 0, 1 → 1, 3 → 2). Contrôle : somme pondérée (poids impairs,
// donc toute faute de frappe sur un caractère est détectée) + empreinte de l'édition, modulo 32.
import { config } from '../config.js';
import { catalogue, duelSegment } from '../content/editions/index.js';
import { startDeal, choose, result } from './deal.js';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DIGIT_OF_GRADE = { 0: 0, 1: 1, 3: 2 };
const GRADE_OF_DIGIT = [0, 1, 3];
const WEIGHTS = [1, 3, 5, 7, 9, 11];

function editionHash(segment) {
  return [...segment.toUpperCase()].reduce((n, ch, i) => n + ch.charCodeAt(0) * (i + 1), 0);
}

function checkChar(segment, digits) {
  const sum = digits.reduce((n, d, i) => n + d * WEIGHTS[i % WEIGHTS.length], editionHash(segment));
  return ALPHABET[sum % 32];
}

// M17-B : lien de défi, qui ouvre directement le deal ; `lang` : la langue de l'émetteur (indice pour le receveur).
export function duelLink(code, lang, cfg = config) {
  return `${cfg.pwa.siteUrl}?${cfg.pwa.duelParam}=${encodeURIComponent(code)}&${cfg.i18n.hintParam}=${lang}`;
}

export function encodeDuel(editionId, num, grades, cfg = config) {
  const n = cfg.duel.payloadChars;
  if (!Number.isInteger(num) || num < 1 || num > cfg.duel.maxDealNum) throw new Error(`numéro de deal hors bornes : ${num}`);
  let value = num * 3 ** grades.length + grades.reduce((acc, g) => acc * 3 + DIGIT_OF_GRADE[g], 0);
  const digits = [];
  for (let i = 0; i < n; i += 1) {
    digits.unshift(value % 32);
    value = Math.floor(value / 32);
  }
  const segment = duelSegment(editionId);
  return `${cfg.duel.prefix}-${segment}-${digits.map((d) => ALPHABET[d]).join('')}${checkChar(segment, digits)}`;
}

// { ok: true, edition, num, grades } ou { ok: false, error: 'format' | 'check' }.
// Tolère minuscules et espaces ; dans les données, O → 0 et I, L → 1 (base 32 Crockford).
export function decodeDuel(code, steps = config.deal.stepsPerDeal, cfg = config) {
  const parts = String(code || '').trim().toUpperCase().replace(/\s+/g, '-').split('-').filter(Boolean);
  if (parts.length !== 3 || parts[0] !== cfg.duel.prefix || !/^[A-Z0-9]+$/.test(parts[1])) return { ok: false, error: 'format' };
  const payload = parts[2].replace(/O/g, '0').replace(/[IL]/g, '1');
  if (payload.length !== cfg.duel.payloadChars + 1) return { ok: false, error: 'format' };
  const digits = [...payload].map((ch) => ALPHABET.indexOf(ch));
  if (digits.some((d) => d < 0)) return { ok: false, error: 'format' };
  const data = digits.slice(0, -1);
  if (checkChar(parts[1], data) !== payload.at(-1)) return { ok: false, error: 'check' };
  const edition = catalogue.find((e) => duelSegment(e.id) === parts[1])?.id ?? parts[1].toLowerCase();
  let value = data.reduce((acc, d) => acc * 32 + d, 0);
  const grades = [];
  for (let i = 0; i < steps; i += 1) {
    grades.unshift(GRADE_OF_DIGIT[value % 3]);
    value = Math.floor(value / 3);
  }
  if (value < 1) return { ok: false, error: 'format' };
  return { ok: true, edition, num: value, grades };
}

// Résultat que les notes d'un adversaire donnent sur ce deal (une seule option par note et par étape).
export function replayGrades(deal, edition, grades) {
  const run = startDeal(deal, edition);
  grades.forEach((g, i) => choose(run, deal.steps[i].options.findIndex((o) => o.grade === g)));
  return result(run);
}

// > 0 si `a` gagne : montant signé, puis verdict, puis somme des notes.
export function compareResults(a, b) {
  const rank = { signed: 2, delayed: 1, lost: 0 };
  const sum = (r) => r.grades.reduce((n, g) => n + g, 0);
  return (a.revenue - b.revenue) || (rank[a.verdict] - rank[b.verdict]) || (sum(a) - sum(b));
}
