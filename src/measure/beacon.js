// Mesure (M9 lot 4) : un sendBeacon par événement vers le Worker de mesure (stats/), sur le site publié seulement.
// Champs envoyés : e (événement), ed (édition) et l (langue de l'interface, M14) ; pour deal_end, en plus d (id du deal)
// et r (signed, delayed ou lost), et (M17-A) s, le nombre de réflexes seniors du deal (0 à 5). Rien d'autre : ni cookie,
// ni stockage local, ni identifiant, ni heure.
import { config } from '../config.js';
import { currentLang } from '../content/texts.js';

let ended = 0; // deals terminés depuis le chargement de la page (en mémoire seulement)

export function beaconPayload(event, edition, { deal, result, seniors } = {}, lang = currentLang()) {
  if (event !== 'deal_end') return { e: event, ed: edition, l: lang };
  return { e: event, ed: edition, l: lang, d: deal, r: result, ...(Number.isInteger(seniors) ? { s: seniors } : {}) };
}

// Les options servent au selftest (faux navigator, hôte du site publié).
export function track(event, edition, extra, { nav = globalThis.navigator, host = globalThis.location?.hostname, endpoint = config.stats.endpoint } = {}) {
  if (!endpoint || !config.stats.hosts.includes(host) || !nav?.sendBeacon) return false;
  try {
    return nav.sendBeacon(endpoint, JSON.stringify(beaconPayload(event, edition, extra)));
  } catch {
    return false;
  }
}

// deal_end, puis deal_3 au troisième deal terminé de la session.
export function trackDealEnd(edition, deal, result, opts, seniors) {
  track('deal_end', edition, { deal, result, seniors }, opts);
  ended += 1;
  if (ended === 3) track('deal_3', edition, undefined, opts);
}
