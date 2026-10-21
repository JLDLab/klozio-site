// Édition VP · Head of Sales : un deal est un trimestre, la valeur est le CA d'équipe en jeu (k€).
// Couleurs : celles de l'édition AE, dans le même ordre (contrastes vérifiés par le selftest).
// Pictogrammes : SVG 24×24, trait currentColor.
const stroke = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const edition = {
  id: 'sales-vp',
  name: 'VP · Head of Sales',
  role: 'Un trimestre. Cinq décisions. Une équipe.', // sous-titre affiché sous le nom
  signature: { light: '#4655c4', dark: '#a6abcf' },
  valueUnit: 'k€', // CA d'équipe en jeu sur le trimestre
  share: 'lesson', // M9 : le partage de fin de deal reprend la leçon (post) d'une étape
  valueStages: ['rc', 'ar'], // §4.4 : mêmes positions que l'AE (4e et 5e étapes)
  saleTypes: ['corporate', 'eti-pme'],
  stages: [
    { key: 'fc', name: 'Forecast', abbr: 'F', color: { light: '#1f7570', dark: '#81bbb6' },
      icon: `<path d="M3 17l6-6 4 4 8-8M15 7h6v6" ${stroke}/>` },
    { key: 'pp', name: 'Pipe review', abbr: 'Pi', color: { light: '#4655c4', dark: '#a6abcf' },
      icon: `<path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" ${stroke}/>` },
    { key: 'co', name: 'Coaching', abbr: 'Co', color: { light: '#93600f', dark: '#bba481' },
      icon: `<path d="M4 5h16v10H9l-5 4V5z" ${stroke}/>` },
    { key: 'rc', name: 'Recrutement', abbr: 'R', color: { light: '#b53c55', dark: '#c3909b' },
      icon: `<circle cx="9" cy="8" r="4" ${stroke}/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6" ${stroke}/>` },
    { key: 'ar', name: 'Arbitrage', abbr: 'A', color: { light: '#277536', dark: '#81bb8b' },
      icon: `<path d="M12 4v16M8 20h8M4 8h16M4 8l-2 6h4l-2-6M20 8l-2 6h4l-2-6" ${stroke}/>` },
  ],
  // Titres de profil selon la maîtrise moyenne (seuils : config.profile.titleThresholds)
  profileTitles: [
    'Premier trimestre',
    'Manager en rodage',
    'Manager confirmé',
    'Patron de plateau',
    'Head of Sales',
    'VP de référence',
  ],
  completeTitle: 'Année complète',
  // Raisons génériques d'une perte de valeur, par étape (≤ 90 caractères), quand l'option n'a pas de valueReason
  valueReasons: {
    fc: [
      'Un chiffre mal défendu : le board a fixé le tien à ta place.',
      'Le forecast a glissé, et la confiance avec lui.',
    ],
    pp: [
      'Des deals sans date gardés dans le pipe : l\'équipe a travaillé du vent.',
      'Le pipe n\'a pas été tranché : le trimestre s\'est joué trop tard.',
    ],
    co: [
      'Un coaching générique : l\'AE a refait la même erreur au deal suivant.',
      'Le bon moment de coacher est passé sans la phrase qui change tout.',
    ],
    rc: [
      'Un recrutement de confort : l\'équipe a gagné une tête, pas une force.',
      'L\'équilibre de l\'équipe a cédé : le chiffre s\'est concentré sur trop peu.',
    ],
    ar: [
      'Un arbitrage repoussé : la direction a tranché sans toi.',
      'Tu as dit oui là où il fallait dire non : l\'équipe a payé.',
    ],
  },
};

export default edition;
