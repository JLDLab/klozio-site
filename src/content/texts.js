// Textes d'interface : i18n/fr.json et i18n/en.json (M14), une langue chargée au démarrage (setLang). Ce module
// compile leurs gabarits en chaînes et en fonctions, avec la même forme que l'ancien objet `texts` : les écrans
// appellent toujours texts.ui.wheelHint(n). Une ligne ≤ 60 caractères (config.limits.uiLine, vérifié par le selftest).
//
// Gabarits : {nom} est remplacé par l'argument de même nom (SPEC donne leur ordre) ; {n|un|plusieurs} choisit la
// forme selon n (français : pluriel au-delà de 1 ; anglais : pluriel sauf pour 1). Suffixes dans SPEC : `$` montant
// formaté avec l'argument `unit` (« 108 k€ », « €108k »), `±` nombre signé avec le vrai signe moins.

import { config } from '../config.js';

export const LANGS = config.i18n.langs;
export const DEFAULT_LANG = config.i18n.default;

// Ordre des arguments de chaque texte-fonction (les autres textes sont des chaînes).
const SPEC = {
  share: {
    amountOf: 'amount value',
    askLine: 'url',
    playedOn: 'brand',
  },
  ui: {
    dealsInvalid: 'n',
    wheelHint: 'n',
    wheelStage: 'n total',
    wheelStageAria: 'name n total',
    wheelHit: 'name n total',
    wheelCount: 'n total',
    wheelAria: 'n total',
    revenueOf: 'possible pct',
    revenueAria: 'a b pct',
    signedDeals: 'n total',
    bestAmount: 'a$ unit',
    difficulty: 'd max',
    editionSwitchAria: 'name',
    editionAria: 'name',
    dailyResult: 'verdict amount$ value$ unit',
    streak: 'n',
    trainingHint: 'n',
    trainingOf: 'name',
    trainingScore: 'n total',
    trainingMastery: 'before after',
    duelPlaceholder: 'format',
    duelBadFormat: 'format',
    duelOtherEdition: 'name',
    fullEditionCount: 'n segment',
    fullEditionBody: 'seats',
    buyButton: 'price',
    codeOpened: 'names',
    teamRank: 'rank total',
    teamRankFirst: 'total',
    teamPlayerLine: 'deals signed',
    weekOther: 'name',
    weekReminder: 'title',
    fullEditionAll: 'n',
    duelTag: 'code',
    challengeText: 'edition title code',
    duelGap: 'gap±$ unit',
    duelAmount: 'verdict amount$ unit',
    groupProgress: 's n',
    eventEffect: 't±',
    masteryHint: 'n',
    titleHint: 'n',
    nextTitle: 'name',
    stepOf: 'i n',
    tempDelta: 'd±',
    gaugeAria: 't',
    optionAria: 'i text',
    // M16 : accueil ordinateur
    dkWeakSpot: 'stage',
    dkWeakSpotWhy: 'n total',
    dkDailyMeta: 'steps min',
    dkCampaignCount: 'n s',
    dkLockedMore: 'n segment',
    dkAccessAll: 'n',
    dkAccessEdition: 'segment n',
    dkAccessFree: 'n',
    dkTeamTitle: 'name',
    dkSeeMore: 'n',
    dkWeekPlayed: 'n',
    dkWorkOnAction: 'stage',
    dkStepLabel: 'i n stage',
    dkStageState: 'name state',
    dkSignAt: 'mark n',
    dkDeltaLast: 'd±',
    dkDecisionLine: 'stage grade',
    dkDebriefTag: 'title',
    dkSumGood: 'good',
    dkSumBad: 'bad',
    dkSeniorCount: 'n total',
    dkOfValue: 'value pct',
    dkAtStake: 'value',
    dkDecisionsTitle: 'n',
    dkRowStage: 'i stage',
    dkOutOf: 'n total',
    dkTeamMissed: 'n total stage',
    dkTeamMissedOne: 'total stage',
    // M17-A : première visite, achat, position, crédibilité
    credLine: 'n',
    unlockLine: 'n segment price',
    rankBetter: 'n',
    rankHard: 'x k',
    // M17-B : chiffres justes et noms d'offre (Édition AE, KLOZIO Complete), une seule durée
    inFullEdition: 'segment',
    fullEditionTitle: 'segment',
    dkLockedOpen: 'segment',
    dkCampaignFree: 'n m',
    signedFree: 'n total',
    fvLead: 'min',
    streakDays: 'n',
    tomorrow: 'sector',
    challengeScore: 'amount$ unit',
    revealAnnounce: 'i grade feedback',
    lessonText: 't hook brand',
    tempAnnounce: 't',
    valueCost: 'pct',
    signedOf: 'amount$ value$ unit',
    notSigned: 'value$ unit',
    costliestStep: 'name pct',
    finalTemp: 't',
    wedgeWon: 'name',
    dealTally: 'senior pass fault',
    reset: 'name',
    resetConfirm: 'name',
    resetDone: 'name',
    introStep: 'i n',
    publisher: 'name',
    splashBy: 'studio',
  },
};

// Textes calculés : formatage dans le code, mots dans le fichier de langue.
const COMPUTED = {
  ui: {
    money: (d, f) => (v, unit) => f.money(v, unit),
    amount: (d, f) => (v, unit) => f.amount(v, unit),
    teamAvg: (d, f) => (a) => (a === null ? d.teamAvgNone : fill(d.teamAvg, { avg: f.decimal(a) }, f)),
    masteryValue: (d, f) => (m) => (m === null ? d.masteryNone : fill(d.masteryValue, { v: f.decimal((m * 3).toFixed(1)) }, f)),
    masteryAria: (d, f) => (name, m) => (m === null ? fill(d.masteryAriaNone, { name }, f) : fill(d.masteryAria, { name, pct: Math.round(m * 100) }, f)),
  },
};

// Nombre signé avec le vrai signe moins (−), jamais un tiret.
const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '');

// Formats de nombre et de montant par langue. Français : « 108 k€ », « 1,24 M€ », « 2,3 » ; anglais : « €108k »,
// « €1.24m », « 2.3 ».
const FORMATS = {
  fr: {
    plural: (n) => n > 1,
    decimal: (x) => String(x).replace('.', ','),
    money: (v, unit) => `${v} ${unit}`,
    amount: (v, unit) => (unit === 'k€' && v >= 1000 ? `${(v / 1000).toFixed(2).replace('.', ',')} M€` : `${v} ${unit}`),
  },
  en: {
    plural: (n) => Number(n) !== 1,
    decimal: (x) => String(x),
    money: (v, unit) => (unit === 'k€' ? `€${v}k` : `${v} ${unit}`),
    amount: (v, unit) => (unit === 'k€' && v >= 1000 ? `€${(v / 1000).toFixed(2)}m` : FORMATS.en.money(v, unit)),
  },
};

export const texts = {};
let state = { lang: DEFAULT_LANG, dict: null, f: FORMATS[DEFAULT_LANG] };

export const currentLang = () => state.lang;
export const currentDict = () => state.dict;
export const formats = () => state.f;
export const formatsFor = (lang) => FORMATS[lang];

// Remplit un gabarit (pages du site, scripts) : fillTemplate('{n} deal{n||s}', { n: 2 }, 'en').
export const fillTemplate = (tpl, vars, lang = state.lang) => fill(tpl, vars, FORMATS[lang]);

function fill(tpl, vars, f) {
  return tpl.replace(/\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g, (m, name, one, many) => {
    if (!(name in vars)) throw new Error(`gabarit : {${name}} inconnu dans « ${tpl} »`);
    if (one !== undefined) return f.plural(vars[name]) ? many : one;
    return String(vars[name]);
  });
}

// Gabarit → fonction, selon la signature de SPEC (« amount$ value$ unit »).
export function compile(tpl, signature, f = state.f) {
  const params = signature.split(' ').map((p) => ({ name: p.replace(/[$±]/g, ''), money: p.includes('$'), signed: p.includes('±') }));
  return (...args) => {
    const raw = Object.fromEntries(params.map((p, i) => [p.name, args[i]]));
    const vars = {};
    for (const p of params) {
      let v = raw[p.name];
      if (p.signed || p.money) {
        const abs = p.signed ? Math.abs(v) : v;
        v = `${p.signed ? sign(v) : ''}${p.money ? f.money(abs, raw.unit) : abs}`;
      }
      vars[p.name] = v;
    }
    return fill(tpl, vars, f);
  };
}

function build(dict, spec, computed, f) {
  const out = {};
  for (const [k, v] of Object.entries(dict)) {
    if (typeof computed?.[k] === 'function') continue;
    if (typeof spec?.[k] === 'string') out[k] = compile(v, spec[k], f);
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = build(v, spec?.[k], computed?.[k], f);
    else out[k] = v;
  }
  for (const [k, make] of Object.entries(computed || {})) if (typeof make === 'function') out[k] = make(dict, f);
  return out;
}

// Charge une langue : `dict` est le contenu de i18n/<lang>.json. Remplace le contenu de `texts` sur place (les modules
// qui l'ont importé voient la nouvelle langue).
export function setLang(lang, dict) {
  if (!LANGS.includes(lang)) throw new Error(`langue inconnue : ${lang}`);
  const f = FORMATS[lang];
  state = { lang, dict, f };
  for (const k of Object.keys(texts)) delete texts[k];
  Object.assign(texts, build(dict.texts, SPEC, COMPUTED, f), { errors: { ...dict.errors } });
  return texts;
}

// Signature d'un texte-fonction (chemin « ui.wheelHint »), ou undefined.
export const signatureOf = (path) => path.split('.').reduce((o, k) => o?.[k], SPEC);

// Vocabulaire d'une édition (fichier de langue, editions.<id>.vocab) : remplace, dans `target`, les textes communs de
// mêmes clés. Appliqué une fois au démarrage, pour l'édition en cours. Une clé inconnue est refusée ; un gabarit
// remplace une fonction avec la signature du texte commun.
export function applyVocab(vocab, target = texts, path = 'texts', f = state.f) {
  for (const [k, v] of Object.entries(vocab || {})) {
    if (!(k in target)) throw new Error(`vocabulaire : clé inconnue ${path}.${k}`);
    if (v && typeof v === 'object' && typeof target[k] === 'object') applyVocab(v, target[k], `${path}.${k}`, f);
    else if (typeof target[k] === 'function' && typeof v === 'string') target[k] = compile(v, signatureOf(`${path}.${k}`.replace(/^texts\./, '')), f);
    else target[k] = v;
  }
  return target;
}

// Textes d'une langue sans changer celle du jeu (pages du site générées dans les deux langues), avec le vocabulaire
// de l'édition `editionId` si elle est donnée.
export function textsFor(lang, dict, editionId = null) {
  const f = FORMATS[lang];
  const t = { ...build(dict.texts, SPEC, COMPUTED, f), errors: { ...dict.errors } };
  const vocab = editionId && dict.editions?.[editionId]?.vocab;
  return vocab ? applyVocab(vocab, t, 'texts', f) : t;
}

// Textes d'une édition (fichier de langue, editions.<id>) posés sur ses fichiers edition.js et texts.js : sous-titre,
// noms et abréviations des étapes, titres de profil, raisons de perte de valeur, types de vente, introduction,
// commentaires du manager, vocabulaire. Une édition absente du fichier de langue (édition fictive) reste telle quelle.
export function localizeEdition(id, edition, et, dict = state.dict) {
  const l = dict?.editions?.[id];
  if (!l) return { edition, texts: et };
  return {
    edition: {
      ...edition,
      ...(l.role ? { role: l.role } : {}),
      stages: edition.stages.map((s) => ({ ...s, name: l.stages[s.key].name, abbr: l.stages[s.key].abbr })),
      profileTitles: l.profileTitles,
      completeTitle: l.completeTitle,
      valueReasons: l.valueReasons,
    },
    texts: { ...et, saleTypes: l.saleTypes, intro: l.intro, manager: l.manager, vocab: l.vocab },
  };
}

// Message d'erreur d'un code (accès, équipe) : en français, le message du Worker s'il en donne un (il connaît le
// nombre de sièges) ; sinon celui du fichier de langue.
export function errorMessage(error, workerMessage) {
  if (state.lang === 'fr' && workerMessage) return workerMessage;
  return texts.errors?.[error] ?? texts.errors?.invalid ?? workerMessage ?? error;
}

// Node (selftest, scripts de build) : le français est chargé d'office ; le navigateur appelle setLang (src/main.js).
if (globalThis.process?.versions?.node) {
  const { readFileSync } = await import('node:fs');
  setLang(DEFAULT_LANG, JSON.parse(readFileSync(new URL('../../i18n/fr.json', import.meta.url), 'utf8')));
}

export default texts;
