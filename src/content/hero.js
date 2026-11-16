// M22 — étape du héros de l'accueil (config.content.hero) : contexte, question et options du deal, tels quels, dans
// chaque langue. Source : lue dans les fichiers du deal ; publié : npm run dist réécrit la ligne DEALS avec la seule
// étape du héros (les fichiers de deals ne sont pas publiés un par un, scripts/dist.js publishedHero). Le selftest
// vérifie que les deux versions donnent la même étape, mot pour mot.
import { config } from '../config.js';

const DEALS = {"fr":{"id":"no-show","title":"Le no-show","contact":{"role":"Directrice marketing","org":"groupe agroalimentaire"},"steps":[{"context":"Elle a accepté un rendez-vous pris par votre SDR. Vous ne l'avez jamais eue en direct.","question":"Que faites-vous avant le rendez-vous ?","options":[{"grade":1,"text":"Vous préparez la démo à partir des notes du SDR, qui semblent complètes et bien détaillées.","feedback":"Les notes d'un SDR sont un point de départ, pas un contact."},{"grade":3,"text":"Vous lui écrivez vous-même, avec une question sur un lancement récent, pour créer un lien.","feedback":"Un rendez-vous pris par un autre n'est pas le vôtre. Prenez-le avant qu'il ait lieu."},{"grade":0,"text":"Vous attendez le rendez-vous : elle a accepté l'invitation dans son agenda, c'est acquis.","feedback":"Accepter une invitation, c'est cliquer. Pas s'engager."}]}]},"en":{"id":"no-show","title":"The no-show","contact":{"role":"Marketing Director","org":"food manufacturing group"},"steps":[{"context":"She accepted a meeting booked by your SDR. You've never spoken to her directly.","question":"What do you do before the meeting?","options":[{"grade":1,"text":"You prep the demo from the SDR's notes, which look thorough and well detailed.","feedback":"SDR notes are a starting point, not a relationship."},{"grade":3,"text":"You email her yourself, with a question about a recent launch, to build a connection.","feedback":"A meeting someone else booked isn't yours yet. Make it yours before it happens."},{"grade":0,"text":"You wait for the meeting: she accepted the calendar invite, so it's in the bag.","feedback":"Accepting an invite is a click. Not a commitment."}]}]}}; // publié : l'étape du héros seule

// L'étape du héros dans la langue, ou null (deal absent de la langue, ou autre deal que celui de la config).
export function heroFor(lang, cfg = config) {
  const { edition, deal: id, step } = cfg.content.hero;
  const deal = DEALS[lang];
  if (!deal || deal.id !== id || !deal.steps?.[step]) return null;
  const s = deal.steps[step];
  return {
    edition,
    id,
    step,
    title: deal.title,
    contact: deal.contact,
    context: s.context,
    question: s.question,
    options: s.options.map((o) => ({ grade: o.grade, text: o.text, feedback: o.feedback, ...(o.event ? { event: o.event } : {}) })),
  };
}

// Version publiée de DEALS : pour chaque langue, le deal réduit à l'étape du héros (les autres étapes à null).
export function publishedDeals(deals = DEALS, cfg = config) {
  const { step } = cfg.content.hero;
  return Object.fromEntries(Object.entries(deals).map(([lang, d]) => [lang, {
    id: d.id, title: d.title, contact: d.contact,
    steps: d.steps.slice(0, step + 1).map((s, i) => (i === step ? s : null)),
  }]));
}
