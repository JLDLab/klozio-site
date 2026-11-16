// Partage de fin de deal (M9) : texte (pur, testable) et envoi (navigator.share, sinon copie du texte).
import { config } from '../config.js';
import { texts, currentLang } from '../content/texts.js';

// { title, text, url } pour navigator.share, avec le lien profond du deal. Jamais la
// température chiffrée ni la bonne réponse. AE / SDR :
//   SIGNÉ · Le groupe cosmétique · 108 k€ sur 180 k€
//
//   Tu aurais fait quoi ? https://…/?deal=cosmetique
//   — joué sur KLOZIO
// Édition à leçons (edition.share === 'lesson', VP) : la leçon (post) de l'étape la moins bien jouée (la plus tardive
// en cas d'égalité) : post.t, post.h, le lien, la signature. Sans leçon sur ce deal : format AE.
export function dealShare({ edition, deal, result }) {
  const s = texts.share;
  // M14 : hors français, la langue suit le lien (?lang=en), le destinataire ouvre le jeu dans la même langue.
  const lang = currentLang() === config.i18n.default ? '' : `&${config.i18n.param}=${currentLang()}`;
  const url = `${config.pwa.siteUrl}?${config.pwa.dealParam}=${encodeURIComponent(deal.id)}${lang}`;
  const brand = s.playedOn(config.brand.name);
  const low = Math.min(...result.grades);
  const post = edition.share === 'lesson' ? deal.steps[result.grades.lastIndexOf(low)]?.post : null;
  const amount = (v) => texts.ui.amount(v, edition.valueUnit);
  const text = post
    ? [post.t, '', post.h, '', url, brand].join('\n')
    : [`${texts.verdicts[result.verdict]} · ${deal.title} · ${s.amountOf(amount(result.revenue), amount(deal.value))}`,
      '', s.askLine(url), brand].join('\n');
  return { title: `${config.brand.name} · ${deal.title}`, text, url };
}

// navigator.share si disponible, sinon copie du texte. Retourne 'shared' | 'cancelled' | 'copied' | 'failed'.
// Le lien est déjà dans le texte : passer aussi `url` le ferait apparaître deux fois sur Android (texte + url collés).
export async function sendDealShare(data) {
  if (navigator.share) {
    try {
      await navigator.share({ title: data.title, text: data.text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(data.text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
