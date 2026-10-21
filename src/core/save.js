// Sauvegarde locale versionnée, une par édition (klozio.<id>.save.v1), plus des préférences communes
// (klozio.prefs.v1). Toujours dans try/catch : le jeu fonctionne sans stockage.
import { config } from '../config.js';

export function saveKey(editionId, cfg = config) {
  return `${cfg.save.prefix}${editionId}${cfg.save.suffix}`;
}

export function emptySave(cfg = config) {
  return {
    version: cfg.save.version,
    best: {}, // dealId → { verdict, revenue, grades }
    wedges: {}, // clé d'étape → date du gain (ou 'proto' / 'v1' si gagnée sous d'anciennes règles)
    wheelHits: {}, // clé d'étape → deals où un réflexe senior a compté pour la part (§4.5)
    history: {}, // clé d'étape → dernières notes (fenêtre de maîtrise)
    deals: [], // derniers deals joués : { id, verdict, revenue, grades, at }
    streak: { count: 0, last: null }, // série de jours consécutifs avec un deal du jour terminé (AAAAMMJJ)
    daily: {}, // AAAAMMJJ → { id, status: 'started' | 'done', verdict?, revenue?, grades? } (essai officiel)
  };
}

export function emptyPrefs() {
  return {
    options: { sound: false, reducedMotion: false, theme: 'system' },
    introSeen: false,
    edition: null, // dernière édition ouverte
  };
}

// Prototype (sans version) → v1 : { wedges: { p: true }, best: { id: 'signed' } }.
function fromPrototype(raw) {
  const wedges = {};
  for (const [k, on] of Object.entries(raw.wedges || {})) if (on) wedges[k] = 'proto';
  const best = {};
  for (const [id, verdict] of Object.entries(raw.best || {})) {
    if (['signed', 'delayed', 'lost'].includes(verdict)) best[id] = { verdict, revenue: null, grades: [] };
  }
  return { version: 1, wedges, best, history: {}, deals: [] };
}

// v1 → v2 : les parts déjà gagnées restent acquises ; les réflexes seniors de l'historique récent comptent
// pour les parts en cours ; un meilleur résultat signé sans montant vaut la valeur pleine du deal (dealValue).
// Les clés d'étape v1 sont celles de l'édition AE, la seule qui existait.
const V1_STAGES = ['p', 'q', 'pr', 'n', 'c'];
function v1ToV2(raw, dealValue, cfg) {
  const wheelHits = {};
  for (const entry of [...(raw.deals || [])].reverse()) {
    (entry.grades || []).forEach((g, i) => {
      const key = V1_STAGES[i];
      if (g !== cfg.wheel.hitGrade || !key || raw.wedges?.[key]) return;
      const hits = (wheelHits[key] ||= []);
      if (!cfg.wheel.distinctDeals || !hits.includes(entry.id)) hits.push(entry.id);
    });
  }
  for (const hits of Object.values(wheelHits)) hits.splice(cfg.wheel.requiredHits - 1);
  const best = {};
  for (const [id, b] of Object.entries(raw.best || {})) {
    const full = b.verdict === 'signed' && (b.revenue === null || b.revenue === undefined) ? dealValue(id) : undefined;
    best[id] = { ...b, revenue: full ?? b.revenue ?? 0 };
  }
  return { ...raw, version: 2, wheelHits, best };
}

// Toute forme antérieure → version courante. Ne lève jamais : au pire, une sauvegarde vide.
// `dealValue(dealId)` donne la valeur d'un deal de l'édition (migration des montants).
export function migrate(raw, cfg = config, { dealValue = () => undefined } = {}) {
  const base = emptySave(cfg);
  if (!raw || typeof raw !== 'object') return base;
  let data = raw.version === undefined ? fromPrototype(raw) : raw;
  if (data.version === 1) data = v1ToV2(data, dealValue, cfg);
  if (data.version === cfg.save.version) {
    const { options: _options, introSeen: _intro, ...rest } = data; // anciennes préférences : voir loadPrefs
    return { ...base, ...rest, wheelHits: { ...(rest.wheelHits || {}) }, streak: { ...base.streak, ...(data.streak || {}) } };
  }
  return base; // version future ou inconnue : on repart à zéro plutôt que de planter
}

function readJson(storage, key) {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// Sauvegarde d'une édition. L'édition legacyEdition reprend les anciennes clés (avant le multi-éditions).
// Vrai si la sauvegarde de l'édition doit être migrée (ancienne version ou ancienne clé) : la migration a besoin
// de la valeur des deals, le démarrage attend alors leur index (M9 : sinon, l'accueil s'affiche sans lui).
export function needsMigration(editionId, storage = globalThis.localStorage, cfg = config) {
  try {
    const current = readJson(storage, saveKey(editionId, cfg));
    if (current) return current.version !== cfg.save.version;
    return editionId === cfg.save.legacyEdition && cfg.save.legacyKeys.some((key) => readJson(storage, key));
  } catch {
    return false;
  }
}

export function load(editionId, storage = globalThis.localStorage, cfg = config, opts = {}) {
  try {
    const current = readJson(storage, saveKey(editionId, cfg));
    if (current) return migrate(current, cfg, opts);
    if (editionId === cfg.save.legacyEdition) {
      for (const key of cfg.save.legacyKeys) {
        const legacy = readJson(storage, key);
        if (legacy) return migrate(legacy, cfg, opts);
      }
    }
  } catch {
    // stockage indisponible ou corrompu
  }
  return emptySave(cfg);
}

export function store(editionId, save, storage = globalThis.localStorage, cfg = config) {
  try {
    storage.setItem(saveKey(editionId, cfg), JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

// Efface la sauvegarde d'une édition (et les anciennes clés qu'elle reprend, sinon elles reviendraient).
export function clear(editionId, storage = globalThis.localStorage, cfg = config) {
  try {
    storage.removeItem(saveKey(editionId, cfg));
    if (editionId === cfg.save.legacyEdition) for (const key of cfg.save.legacyKeys) storage.removeItem(key);
  } catch {
    // rien à faire
  }
  return emptySave(cfg);
}

// Préférences communes. Au premier lancement, reprises de l'ancienne sauvegarde unique si elle existe.
export function loadPrefs(storage = globalThis.localStorage, cfg = config) {
  const base = emptyPrefs();
  try {
    const raw = readJson(storage, cfg.save.prefsKey)
      ?? cfg.save.legacyKeys.map((k) => readJson(storage, k)).find((x) => x && x.options);
    if (raw && typeof raw === 'object') {
      return {
        ...base,
        options: { ...base.options, ...(raw.options || {}) },
        introSeen: Boolean(raw.introSeen),
        edition: typeof raw.edition === 'string' ? raw.edition : null,
      };
    }
  } catch {
    // stockage indisponible ou corrompu
  }
  return base;
}

export function storePrefs(prefs, storage = globalThis.localStorage, cfg = config) {
  try {
    storage.setItem(cfg.save.prefsKey, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}
