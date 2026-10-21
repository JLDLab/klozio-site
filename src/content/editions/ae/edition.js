// Édition Sales · AE : structure du métier joué. Le moteur ne connaît aucune étape en dur : tout vient d'ici.
// Couleurs : claire et sombre (contrastes vérifiés par le selftest). Pictogrammes : SVG 24×24, trait currentColor.
const stroke = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const edition = {
  id: 'ae',
  name: 'Sales · AE',
  role: 'Account Executive', // métier joué
  signature: { light: '#85601a', dark: '#d8ac52' }, // couleur de signature : nom de l'édition sur l'accueil
  valueUnit: 'k€', // unité des valeurs de deal
  valueStages: ['n', 'c'], // §4.4 étapes « valeur » : pertes de valeur doublées (config.deal.valueStageFactor)
  saleTypes: ['corporate', 'public', 'eti-pme', 'conseil', 'finance'], // types de vente (libellés dans texts.js)
  stages: [
    { key: 'p', name: 'Prospection', abbr: 'P', color: { light: '#1f7570', dark: '#81bbb6' },
      icon: `<path d="M3 12h13M11 6l6 6-6 6" ${stroke}/>` },
    { key: 'q', name: 'Qualification', abbr: 'Q', color: { light: '#4655c4', dark: '#a6abcf' },
      icon: `<circle cx="10.5" cy="10.5" r="6" ${stroke}/><path d="M15 15l5 5" ${stroke}/>` },
    { key: 'pr', name: 'Présentation', abbr: 'Pr', color: { light: '#93600f', dark: '#bba481' },
      icon: `<rect x="3" y="4" width="18" height="12" rx="2" ${stroke}/><path d="M12 16v4M8 20h8" ${stroke}/>` },
    { key: 'n', name: 'Négociation', abbr: 'N', color: { light: '#b53c55', dark: '#c3909b' },
      icon: `<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" ${stroke}/>` },
    { key: 'c', name: 'Closing', abbr: 'C', color: { light: '#277536', dark: '#81bb8b' },
      icon: `<path d="M4 12.5l5 5L20 6.5" ${stroke}/>` },
  ],
  // Titres de profil selon la maîtrise moyenne (seuils : config.profile.titleThresholds)
  profileTitles: [
    'Premier rendez-vous',
    'Commercial en rodage',
    'Commercial confirmé',
    'Chasseur fiable',
    'Senior du plateau',
    'Closer de référence',
  ],
  completeTitle: 'Cycle complet', // titre de la roue complète
  // Raisons génériques d'une perte de valeur, par étape (≤ 90 caractères), quand l'option n'a pas de valueReason
  valueReasons: {
    p: [
      'Un premier contact banal t\'a classé parmi les fournisseurs interchangeables.',
      'Entré par la mauvaise porte, tu as dû justifier ton prix plus tard.',
    ],
    q: [
      'Douleur mal chiffrée : le client n\'a jamais vu ce que coûtait le statu quo.',
      'Sans décideur identifié, le budget s\'est négocié sans toi.',
    ],
    pr: [
      'Une démo générique : le client a comparé des fonctions, donc des prix.',
      'Ta présentation n\'a pas relié la solution à un gain chiffré.',
    ],
    n: [
      'Une concession sans contrepartie : la remise est devenue la référence.',
      'Tu as négocié contre toi-même avant que le client ne demande.',
    ],
    c: [
      'Le closing a rouvert le prix : les derniers points ont coûté cher.',
      'Une signature arrachée à la dernière minute se paie en remise.',
    ],
  },
};

export default edition;
