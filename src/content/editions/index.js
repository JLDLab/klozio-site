// Catalogue des éditions (§4.10). Une édition active a son dossier ./<id>/ : edition.js, texts.js, deals/. Ses textes
// d'interface (étapes, introduction, manager, vocabulaire) sont dans i18n/<lang>.json (M14), posés au chargement.
// Une édition « a-venir » n'a pas de contenu : elle apparaît verrouillée sur l'accueil, sauf si `hidden: true`
// (M9 : masquée tant qu'elle n'a pas de premier deal).
// Les cycles des éditions à venir sont indicatifs, à valider par Jordan. `duel` : segment des codes de défi
// (KLZ-<duel>-XXXXC), lettres et chiffres seulement ; par défaut l'identifiant en majuscules.
import { localizeEdition } from '../texts.js';

export const catalogue = [
  { id: 'ae', name: 'Sales · AE', status: 'active', duel: 'AE' },
  { id: 'sales-vp', name: 'VP · Head of Sales', status: 'active', duel: 'VP' },
  { id: 'sales-sdr', name: 'SDR · BDR', status: 'active', duel: 'SDR' },
  { id: 'csm', name: 'CSM', status: 'a-venir', hidden: true, cycle: ['Onboarding', 'Adoption', 'Santé du compte', 'Renouvellement', 'Expansion'] },
  { id: 'mops', name: 'Marketing & RevOps', status: 'a-venir', hidden: true, cycle: ['Ciblage', 'Campagne', 'Conversion', 'Alignement sales', 'Pilotage du pipeline'] },
];

export const activeEditions = () => catalogue.filter((e) => e.status === 'active');

// Segment des codes de défi d'une édition (hors catalogue, comme l'édition fictive : son identifiant).
export const duelSegment = (id) => catalogue.find((e) => e.id === id)?.duel ?? id.toUpperCase();

// Dossier d'une édition du catalogue (URL absolue, valable dans le navigateur comme dans Node).
export function editionBase(id) {
  if (!catalogue.some((e) => e.id === id && e.status === 'active')) throw new Error(`édition inconnue ou inactive : ${id}`);
  return new URL(`./${id}/`, import.meta.url).href;
}

// Étapes, couleurs et textes d'une édition, sans ses deals : de quoi afficher l'accueil (M9). Textes dans la langue
// chargée (src/content/texts.js, setLang).
export async function loadEditionMeta(id, base = editionBase(id)) {
  const at = (file) => new URL(file, base).href;
  const [{ edition }, { texts }] = await Promise.all([import(at('edition.js')), import(at('texts.js'))]);
  return localizeEdition(id, edition, texts);
}

// Index des deals d'une édition, chargé à la demande après l'accueil (M9) et mis en cache par le service worker.
// `total` : deals de l'édition complète, écrit dans l'index publié (M10-A, seuls les deals gratuits y sont) ;
// null pendant le développement (index complet).
// M14 : `lang` autre que le français → deals-<lang>/index.js (deals de cette langue ; un deal sans version dans la
// langue n'y est pas). `nums` : numéros des deals de l'édition complète dans cette langue (codes de défi), au build.
export async function loadDealIndex(id, base = editionBase(id), lang = 'fr') {
  const m = await import(new URL(lang === 'fr' ? 'deals/index.js' : `deals-${lang}/index.js`, base).href);
  return { deals: m.deals, total: m.total ?? null, offer: m.offer ?? null, nums: m.nums ?? null }; // offer (M13) : chiffres des offres, au build
}

export async function loadDeals(id, base = editionBase(id), lang = 'fr') {
  return (await loadDealIndex(id, base, lang)).deals;
}

// Charge une édition depuis son dossier : { edition, texts, deals }. `base` permet de charger une édition
// hors catalogue (édition fictive du selftest).
export async function loadEdition(id, base = editionBase(id), lang = 'fr') {
  const [meta, deals] = await Promise.all([loadEditionMeta(id, base), loadDeals(id, base, lang)]);
  return { ...meta, deals };
}
