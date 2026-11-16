// Palette unique (M8 v2, identité crème / bleu / chocolat) : injectée en variables CSS au démarrage, contrôlée
// par le selftest (A2). Pas de mode sombre pour l'instant ; pas de noir pur (le plus sombre est fg, chocolat).
// Noms du brief → noms du jeu : --text = fg, --text-muted = muted, --senior = good, --passe = mid, --faute = bad,
// --temp-cold = cold, --temp-hot = hot.
export const tokens = {
  light: {
    bg: '#FFF1E1', // crème, fond de l'app
    surface: '#FFFFFF', // cartes
    'surface-2': '#FBE6CF', // cartes secondaires, chips, options au repos
    line: '#EBD3B8', // bordures décoratives
    'line-strong': '#3B1F14', // A13 bordure d'un élément interactif : le chocolat, comme le contour du O du logo
    fg: '#3B1F14', // texte : chocolat
    muted: '#735540', // texte secondaire : M17-A, foncé pour ≥ 4,5:1 partout (6,1:1 sur le fond, 6,8:1 sur le blanc, 5,6:1 sur surface-2)
    accent: '#1F4BD8', // bleu : M17-A, l'action principale (un seul bouton bleu plein par écran) et le réflexe senior
    'accent-ink': '#FFF1E1', // texte sur bleu
    good: '#1F4BD8', // senior : bonne réponse = bleu
    mid: '#F5A341', // passe (miel) : en aplat sous du texte chocolat, jamais en couleur de texte
    bad: '#F26B3A', // faute (corail) : idem
    'skill-ink': '#FFF1E1', // texte sur une étape faite (bleu)
    hot: '#F26B3A', // jauge : corail
    cold: '#8FA8EC', // jauge : bleu pâle
    'delta-up': '#DCE5FB', // M18 : fond clair du delta de température, montée (bleu clair, texte chocolat)
    'delta-down': '#FCE0D6', // M18 : fond clair du delta de température, baisse (corail clair, texte chocolat)
  },
};

// M22 : formes, ombres et mouvement, centralisés ici comme les couleurs (aucune couleur nouvelle : les ombres
// mélangent le chocolat fg). Injectés en variables CSS par themeCss, comme la palette : --r-*, --shadow-*, --ease*, --dur-*.
// Valeurs reprises telles quelles de app.css (aucun rendu ne change) ; 99px et 999px deviennent --r-pill.
export const shape = {
  'r-xs': '4px', // barres fines
  'r-s': '7px', // pastilles d'étape
  'r-m': '8px', // bandeau, tampon
  'r-ml': '10px', // onglets, lignes de classement
  'r-l': '12px', // boutons, options, champs
  'r-xl': '14px', // cartes, bouton principal
  'r-2xl': '16px', // cartes ordinateur
  'r-3xl': '20px', // bandeau du débrief ordinateur
  'r-pill': '999px', // pastilles, jauges
  'r-round': '50%', // ronds
};
export const shadow = {
  'shadow-card': '0 1px 2px color-mix(in srgb,var(--fg) 8%,transparent)', // option au repos
  'shadow-marker': '0 1px 3px color-mix(in srgb,var(--fg) 35%,transparent)', // repère de la jauge
  'shadow-edge': '0 8px 8px -8px color-mix(in srgb,var(--fg) 25%,transparent)', // bord bas d'un en-tête collé
  'shadow-float': '0 6px 20px color-mix(in srgb,var(--fg) 20%,transparent)', // toast (avant : rgb(59 31 20 / .2), le même chocolat)
};
export const motion = {
  ease: 'cubic-bezier(0.32, 0.72, 0, 1)', // M22 : courbe des nouvelles animations (héros), 120 à 300 ms par étape
  'ease-splash-out': 'cubic-bezier(.22,1,.36,1)', // écran d'ouverture (M8 v2)
  'ease-splash-inout': 'cubic-bezier(.65,0,.35,1)',
  'ease-splash-pop': 'cubic-bezier(.34,1.4,.64,1)',
  'dur-switch': '150ms', // interrupteur des options
  'dur-toast': '200ms', // toast
  'dur-boot': '250ms', // fondu de l'écran de démarrage (index.html)
};

// Couleurs de texte posées sur un aplat de note : crème sur bleu, chocolat sur miel et sur corail (miel et corail
// sont trop clairs pour du texte sur la crème). Les pictos de note suivent (currentColor).
export const gradeInk = { good: 'accent-ink', mid: 'fg', bad: 'fg' };

// Paires texte / fond réellement affichées, vérifiées à 4,5:1.
export const textPairs = [
  ['fg', 'bg'], ['fg', 'surface'], ['muted', 'bg'], ['muted', 'surface'],
  ['accent', 'bg'], ['accent', 'surface'], ['accent-ink', 'accent'],
  ['good', 'bg'], ['good', 'surface'], // « Réflexe senior » et montants signés en bleu
  ...Object.entries(gradeInk).map(([k, ink]) => [ink, k]), // notes et verdicts en aplat
  ['fg', 'surface-2'], // texte d'une option au repos
  ['muted', 'surface-2'], // M17-A : texte secondaire sur les cartes secondaires
  ['fg', 'delta-up'], ['fg', 'delta-down'], // M18 : delta de température, sur fond clair
  ['bg', 'fg'], // M17-A : texte crème sur aplat chocolat (FR / EN actif, onglet actif, verdict signé)
];

// A11, A13 : éléments graphiques visibles sur le fond (≥ 3:1). La jauge (dégradé cold → hot, sans couleur au milieu)
// est cernée d'un liseré line-strong : bleu pâle et corail, clairs par choix, se fondent dans la crème.
export const gaugeStops = ['cold', 'hot'];
export const graphicPairs = ['accent', 'line-strong'].flatMap((k) => [[k, 'bg'], [k, 'surface']]);

// Couleurs propres à une édition. M8 v2 : une seule palette pour toutes les éditions, les étapes faites et la
// signature prennent le bleu (les couleurs d'étape de edition.js ne sont plus affichées).
export function editionTones(edition, theme = 'light') {
  const out = { sig: tokens[theme].accent };
  for (const s of edition.stages) out[`stage-${s.key}`] = tokens[theme].accent;
  return out;
}

// Paires d'une édition : couleur d'étape en texte sur les fonds, pastille (encre sur couleur), signature.
export function editionPairs(edition) {
  return [
    ...edition.stages.flatMap((s) => [[`stage-${s.key}`, 'surface'], [`stage-${s.key}`, 'bg'], ['skill-ink', `stage-${s.key}`]]),
    ['sig', 'bg'], ['sig', 'surface'],
  ];
}

export function themeCss(edition) {
  const vars = Object.entries({ ...tokens.light, ...(edition ? editionTones(edition) : {}), ...shape, ...shadow, ...motion })
    .map(([k, v]) => `--${k}:${v}`).join(';');
  // « light dark » ne crée pas de mode sombre : toutes les couleurs restent celles de la palette. Il dit au
  // navigateur que la page gère le sombre, pour qu'il ne l'assombrisse pas lui-même (assombrissement automatique
  // de Chrome Android en thème sombre : fond brun, cartes grises, aplats foncés). « only light » ne suffit pas.
  return `:root{${vars};color-scheme:light dark}`;
}
