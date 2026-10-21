// Édition SDR · BDR : un deal est un compte à ouvrir, la valeur est le montant estimé du deal passé à l'AE (k€).
// Couleurs : celles de l'édition AE, dans le même ordre (contrastes vérifiés par le selftest).
// Pictogrammes : SVG 24×24, trait currentColor.
const stroke = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const edition = {
  id: 'sales-sdr',
  name: 'SDR · BDR',
  role: 'Trois minutes. Quelqu\'un qui n\'a rien demandé.', // sous-titre affiché sous le nom
  signature: { light: '#1f7570', dark: '#81bbb6' },
  valueUnit: 'k€', // montant estimé du deal passé à l'AE
  valueStages: ['qu', 're'], // §4.4 : mêmes positions que l'AE (4e et 5e étapes)
  saleTypes: ['corporate', 'eti-pme'],
  stages: [
    { key: 'ci', name: 'Ciblage', abbr: 'Ci', color: { light: '#1f7570', dark: '#81bbb6' },
      icon: `<circle cx="12" cy="12" r="8" ${stroke}/><circle cx="12" cy="12" r="3" ${stroke}/>` },
    { key: 'ac', name: 'Accroche', abbr: 'Ac', color: { light: '#4655c4', dark: '#a6abcf' },
      icon: `<path d="M4 5h16v10H9l-5 4V5zM8 9h8M8 12h5" ${stroke}/>` },
    { key: 'so', name: 'Standard & objections', abbr: 'St', color: { light: '#93600f', dark: '#bba481' },
      icon: `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" ${stroke}/>` },
    { key: 'qu', name: 'Qualification', abbr: 'Q', color: { light: '#b53c55', dark: '#c3909b' },
      icon: `<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" ${stroke}/>` },
    { key: 're', name: 'Passage de relais', abbr: 'Re', color: { light: '#277536', dark: '#81bb8b' },
      icon: `<path d="M3 12h14M13 7l5 5-5 5M21 5v14" ${stroke}/>` },
  ],
  // Titres de profil selon la maîtrise moyenne (seuils : config.profile.titleThresholds)
  profileTitles: [
    'Premier jour',
    'SDR en rodage',
    'SDR confirmé',
    'Ouvreur de comptes',
    'Lead SDR',
    'SDR de référence',
  ],
  completeTitle: 'Roue complète',
  // Raisons génériques d'une perte de valeur, par étape (≤ 90 caractères), quand l'option n'a pas de valueReason
  valueReasons: {
    ci: [
      'Le mauvais interlocuteur : le rendez-vous a eu lieu, pas avec celui qui décide.',
      'Un compte choisi sans raison du moment : l\'intérêt est retombé avant le rendez-vous.',
    ],
    ac: [
      'Une accroche sur toi, pas sur lui : il a accepté par politesse.',
      'Les quinze premières secondes ont été perdues : le prospect écoute à moitié.',
    ],
    so: [
      'L\'objection a été contournée, pas traitée : elle reviendra chez l\'AE.',
      'Le filtre a été forcé : le rendez-vous part avec un a priori.',
    ],
    qu: [
      'Ni enjeu, ni décideur, ni date : l\'AE repart de zéro.',
      'Une qualification de surface : le deal estimé a fondu au premier échange.',
    ],
    re: [
      'Un relais incomplet : l\'AE a reposé les questions déjà posées.',
      'Le contexte est resté dans ta tête : le prospect a dû tout redire.',
    ],
  },
};

export default edition;
