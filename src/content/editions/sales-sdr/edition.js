// Édition SDR · BDR : un deal est un compte à ouvrir, la valeur est le montant estimé du deal passé à l'AE (k€).
// Textes (sous-titre, noms et abréviations des étapes, titres de profil, raisons de perte de valeur) : i18n/<lang>.json.
// Couleurs : celles de l'édition AE, dans le même ordre (contrastes vérifiés par le selftest).
// Pictogrammes : SVG 24×24, trait currentColor.
const stroke = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const edition = {
  id: 'sales-sdr',
  name: 'SDR · BDR',
  signature: { light: '#1f7570', dark: '#81bbb6' },
  valueUnit: 'k€', // montant estimé du deal passé à l'AE
  valueStages: ['qu', 're'], // §4.4 : mêmes positions que l'AE (4e et 5e étapes)
  saleTypes: ['corporate', 'eti-pme'],
  stages: [
    { key: 'ci', color: { light: '#1f7570', dark: '#81bbb6' },
      icon: `<circle cx="12" cy="12" r="8" ${stroke}/><circle cx="12" cy="12" r="3" ${stroke}/>` },
    { key: 'ac', color: { light: '#4655c4', dark: '#a6abcf' },
      icon: `<path d="M4 5h16v10H9l-5 4V5zM8 9h8M8 12h5" ${stroke}/>` },
    { key: 'so', color: { light: '#93600f', dark: '#bba481' },
      icon: `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" ${stroke}/>` },
    { key: 'qu', color: { light: '#b53c55', dark: '#c3909b' },
      icon: `<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" ${stroke}/>` },
    { key: 're', color: { light: '#277536', dark: '#81bb8b' },
      icon: `<path d="M3 12h14M13 7l5 5-5 5M21 5v14" ${stroke}/>` },
  ],
};

export default edition;
