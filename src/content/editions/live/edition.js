// Édition Pack Spécial Live (M19) : 6 deals AE réservés aux séances Live de Jordan, ouverts par un code Live et rien
// d'autre. Même métier que l'AE (étapes, couleurs, textes). Ses deals ne sont jamais publiés (scripts/dist.js) : le
// Worker les sert depuis ses propres tables. Pas de mesure, de classement, de défi ni de partage (edition.live).
import ae from '../ae/edition.js';

export const edition = {
  ...ae,
  id: 'live',
  name: 'Pack Spécial Live',
  names: { fr: 'Pack Spécial Live', en: 'Live Special Pack' },
  live: true,
  textsFrom: 'ae', // i18n/<lang>.json : editions.ae
};

export default edition;
