// M21 — Prix affichés selon le régime de TVA de JLD Labs (VAT_MODE, src/config.js), un seul réglage pour le jeu et
// les pages du site :
//   - 'franchise' : franchise en base (art. 293 B du CGI), pas de TVA : « 39 € », mention « TVA non applicable,
//     art. 293 B du CGI » sous les prix ; Stripe Tax désactivé ;
//   - 'assujettie' : TVA 20 % : « 39 € HT · 46,80 € TTC » ; Stripe Tax actif, prix saisis HT dans Stripe.
// Les montants de la config restent les montants de DECISIONS.md (39, 99…) : HT si assujettie, prix payé sinon.
import { config } from '../config.js';

export const VAT_MODES = Object.freeze(['franchise', 'assujettie']);

export function vatMode(mode = config.offers.vat.mode) {
  if (!VAT_MODES.includes(mode)) throw new Error(`VAT_MODE inconnu : ${mode} (${VAT_MODES.join(' ou ')})`);
  return mode;
}

// Prix TTC au centime : 39 → 46.8, 99 → 118.8.
export const withVat = (ht, rate = config.offers.vat.rate) => Math.round(ht * (100 + rate)) / 100;

// Montants identiques dans les deux langues : « 1 200 € », « 46,80 € » ; « €1,200 », « €46.80 ».
const NB = ' ';
export function num(n, lang = config.i18n.default) {
  const [int, dec] = String(n).split('.');
  const fr = lang === config.i18n.default;
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, fr ? NB : ',');
  return dec ? `${grouped}${fr ? ',' : '.'}${dec.padEnd(2, '0')}` : grouped;
}
export const eur = (n, lang = config.i18n.default) => (lang === config.i18n.default ? `${num(n, lang)}${NB}€` : `€${num(n, lang)}`);

// Prix d'une offre individuelle, en une ligne : « 39 € » (franchise) ou « 39 € HT · 46,80 € TTC » (assujettie).
// `htTtc` : gabarit de la langue, « {ht} HT · {ttc} TTC » (i18n/<lang>.json, texts.ui.priceHtTtc).
export function priceLabel(ht, lang, htTtc, mode = config.offers.vat.mode) {
  if (vatMode(mode) === 'franchise') return eur(ht, lang);
  return htTtc.replace('{ht}', eur(ht, lang)).replace('{ttc}', eur(withVat(ht), lang));
}
