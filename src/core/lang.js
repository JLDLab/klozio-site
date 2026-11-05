// Langue de l'interface (M14) : ?lang= (liens partagés), sinon le choix mémorisé sur l'appareil, sinon la langue du
// navigateur (en* → anglais, sinon français). Les textes sont dans i18n/<lang>.json, chargé au démarrage.
import { config } from '../config.js';

// M17-B : `hint` (langue de l'émetteur d'un lien de défi) passe après le choix mémorisé, avant le navigateur.
export function pickLang({ param = null, saved = null, hint = null, browser = '' } = {}, cfg = config) {
  const ok = (l) => cfg.i18n.langs.includes(l);
  if (ok(param)) return param;
  if (ok(saved)) return saved;
  if (ok(hint)) return hint;
  return /^en/i.test(browser || '') ? 'en' : cfg.i18n.default;
}

export const dictUrl = (lang) => new URL(`../../i18n/${lang}.json`, import.meta.url).href;

export async function loadDict(lang, f = globalThis.fetch) {
  const res = await f(dictUrl(lang));
  if (!res.ok) throw new Error(`i18n/${lang}.json : ${res.status}`);
  return res.json();
}

// Pages du site (offres/, code/, confidentialite/) : la version anglaise est sous en/ (même nom de page).
export const pagePath = (page, lang) => `${lang === config.i18n.default ? '' : `${lang}/`}${page}/`;
