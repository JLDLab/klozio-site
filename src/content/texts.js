// Textes d'interface communs à toutes les éditions (ceux d'une édition : editions/<id>/texts.js).
// Une ligne ≤ 60 caractères (config.limits.uiLine, vérifié par le selftest).
const plural = (n, one, many) => (n > 1 ? many : one);
// Nombre signé avec le vrai signe moins (−), jamais un tiret.
const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

export const texts = {
  grades: { 3: 'Réflexe senior', 1: 'Ça passe', 0: 'Faute de jeu' },
  verdicts: { signed: 'SIGNÉ', delayed: 'REPORTÉ', lost: 'PERDU' },
  bestVerdicts: { signed: 'Signé', delayed: 'Reporté', lost: 'Perdu' },
  // Libellés des deux seuils de la jauge (A11) : courts, ils tiennent côte à côte sur 360 px
  gaugeMarks: { delayed: 'Reporté', signed: 'Signé' },
  // Partage (§4.7) : texte et image
  share: {
    amountOf: (amount, value) => `${amount} sur ${value}`,
    askLine: (url) => `Tu aurais fait quoi ? ${url}`,
    playedOn: (brand) => `— joué sur ${brand}`,
  },
  ui: {
    devBanner: 'MODE DÉVELOPPEUR',
    draftBanner: 'BROUILLON',
    dealsInvalid: (n) => `${n} deal${plural(n, '', 's')} invalide${plural(n, '', 's')} ignoré${plural(n, '', 's')}`,
    money: (v, unit) => `${v} ${unit}`,
    // Montant lisible : au-delà de 1 000 k€, en M€ avec deux décimales (1 240 k€ → 1,24 M€).
    amount: (v, unit) => (unit === 'k€' && v >= 1000 ? `${(v / 1000).toFixed(2).replace('.', ',')} M€` : `${v} ${unit}`),

    // Accueil
    wheelTitle: 'Ta roue de compétences',
    wheelHint: (n) => `Une part : ${n} réflexes seniors sur l'étape, dans ${n} deals.`,
    wheelStage: (n, total) => `${n}/${total}`,
    wheelDone: '✓',
    wheelStageAria: (name, n, total) => `${name} : ${n} sur ${total}`,
    wheelHit: (name, n, total) => `+1 en ${name} (${n}/${total})`,
    wheelCount: (n, total) => `${n} / ${total} parts`,
    wheelAria: (n, total) => `Roue de compétences : ${n} parts sur ${total}`,
    revenueLabel: 'CA signé',
    revenueOf: (possible, pct) => `sur ${possible} — ${pct} % capturé`,
    revenueAria: (a, b, pct) => `CA signé ${a} sur ${b}, ${pct} % capturé`,
    signedDeals: (n, total) => `${n} / ${total} deals signés`,
    bestAmount: (a, unit) => `Signé ${a} ${unit}`,
    noDeals: 'Aucun deal validé pour l\'instant.',
    noDealsHint: 'Les premiers deals arrivent bientôt.',
    dealsLoading: 'Chargement des deals…',
    dealsFailed: 'Les deals n\'ont pas pu se charger. Vérifie ta connexion.',
    dealsRetry: 'Réessayer',
    notPlayed: 'À jouer',
    difficulty: (d, max) => `Difficulté ${d}/${max}`,
    optionsButton: 'Options',
    campaignButton: 'Campagne',
    profileButton: 'Profil',
    otherEditions: 'Autres éditions',
    editionSoon: 'À venir',
    editionPlay: 'Jouer',
    editionSwitchAria: (name) => `Passer à l'édition ${name}`,
    editionAria: (name) => `Édition ${name} : à venir`,

    // Deal du jour (§4.7)
    dailyTitle: 'Deal du jour',
    dailyPlay: 'Jouer le deal du jour',
    dailyReplay: 'Rejouer en entraînement',
    dailyOfficial: 'Deal du jour · essai officiel',
    dailyTraining: 'Deal du jour · entraînement',
    dailyAbandoned: 'Essai officiel abandonné en cours de route.',
    dailyEmpty: 'Pas de deal du jour : aucun deal validé.',
    dailyDrafts: 'Tiré parmi les brouillons (mode développeur).',
    dailyResult: (verdict, amount, value, unit) => `${verdict} · ${amount} ${unit} / ${value} ${unit}`,
    dailyRecorded: 'Résultat officiel du jour enregistré.',
    streak: (n) => `Série : ${n} jour${plural(n, '', 's')}`,

    // Entraînement ciblé (§4.9)
    trainingButton: 'Entraînement',
    trainingTitle: 'Entraînement',
    trainingHint: (n) => `${n} étapes d'une même compétence, de deals différents.`,
    trainingOf: (name) => `Entraînement · ${name}`,
    trainingFinish: 'Voir le bilan',
    trainingScore: (n, total) => `${n} réflexe${plural(n, '', 's')} senior${plural(n, '', 's')} sur ${total}`,
    trainingMastery: (before, after) => `Maîtrise : ${before} → ${after}`,
    trainingAgain: 'NOUVELLE SÉRIE',
    trainingOther: 'Autre compétence',

    // Duel (§4.8)
    duelButton: 'Relever un défi',
    duelTitle: 'Relever un défi',
    duelHint: 'Saisis le code reçu : même deal, puis comparaison.',
    duelPlaceholder: (format) => format,
    duelInputAria: 'Code de défi',
    duelPlay: 'Jouer le défi',
    duelBadFormat: (format) => `Code illisible. Format attendu : ${format}.`,
    duelBadCheck: 'Code incorrect : un caractère est mal recopié.',
    duelOtherEdition: (name) => `Ce code est pour l'édition ${name}.`,
    duelNoDeal: 'Ce deal n\'est pas disponible ici.',
    // M10-A : deal non publié (lien profond, code de défi), carte « Édition complète », historique
    inFullEdition: 'Ce deal est dans l\'édition complète',
    fullEditionTitle: 'Édition complète',
    fullEditionCount: (n, segment) => `${n} deals ${segment}`,
    fullEditionBody: (edition, bundle) => `L'édition complète arrive. ${edition} € l'édition, ${bundle} € les trois.`,
    fullEditionSoon: 'Bientôt',
    fullEditionDeal: 'Deal de l\'édition complète',
    duelTag: (code) => `Duel · défi ${code}`,
    challenge: 'DÉFIER UN COLLÈGUE',
    challengeTitle: 'Ton code de défi',
    challengeHint: 'Ton collègue le saisit dans Accueil › Relever un défi.',
    challengeCopy: 'Copier le défi',
    challengeCopied: 'Défi copié.',
    challengeCopyFailed: 'Copie refusée : recopie le code à la main.',
    challengeText: (edition, title, code) => `Défi KLOZIO ${edition} : ${title}. Code : ${code}`,
    duelResult: 'Résultat du duel',
    duelYou: 'Toi',
    duelThem: 'Ton collègue',
    duelWin: 'Tu remportes le duel.',
    duelLose: 'Ton collègue remporte le duel.',
    duelTie: 'Égalité parfaite.',
    duelGap: (gap, unit) => `Écart : ${signed(gap)} ${unit}`,
    duelAmount: (verdict, amount, unit) => `${verdict} · ${amount} ${unit}`,

    // Campagne
    campaignTitle: 'Campagne',
    campaignHint: 'Les deals par type de vente. Commence où tu veux.',
    campaignHintLocked: 'Chaque deal signé ouvre le suivant du même type.',
    groupProgress: (s, n) => `${s} / ${n} signés`,
    locked: 'Verrouillé',
    lockedHint: 'Signe un deal de ce type pour l\'ouvrir.',

    // Événements
    eventTitle: 'Événement',
    eventEffect: (t) => `Température ${signed(t)}`,

    // Profil
    profileTitle: 'Profil',
    masteryTitle: 'Maîtrise par compétence',
    masteryHint: (n) => `Moyenne de tes ${n} dernières notes sur chaque étape.`,
    titleHint: (n) => `Le titre se gagne sur ${n} deals : chaque note compte.`,
    masteryValue: (m) => (m === null ? 'non jouée' : `${(m * 3).toFixed(1).replace('.', ',')} / 3`),
    masteryAria: (name, m) => `${name} : ${m === null ? 'non jouée' : `${Math.round(m * 100)} %`}`,
    titleLabel: 'Titre',
    nextTitle: (name) => `Prochain titre : ${name}`,
    historyTitle: 'Derniers deals',
    noHistory: 'Aucun deal joué pour l\'instant.',
    deletedDeal: 'Deal retiré',

    // Partie
    home: 'Accueil',
    stepOf: (i, n) => `Étape ${i} / ${n}`,
    lived: 'Vécu.', // deal construit sur une anecdote réelle (champ vecu)
    temperature: 'Température du deal',
    tempDelta: (d) => signed(d),
    cold: 'Froid',
    hot: 'Chaud',
    gaugeAria: (t) => `Température du deal : ${t} sur 100`,
    next: 'Étape suivante',
    finish: 'Voir le verdict',
    keyHint: 'Clavier : 1, 2 ou 3 pour choisir, Entrée pour continuer',
    optionAria: (i) => `Option ${i}`,
    revealAnnounce: (i, grade, feedback) => `Option ${i} : ${grade}. ${feedback}`,
    shareLesson: 'Partager cette leçon',
    lessonText: (t, hook, brand) => `${t}\n\n${hook}\n\n— joué sur ${brand}`,
    lessonCopied: 'Leçon copiée.',
    lessonCopyFailed: 'Copie refusée par le navigateur.',
    tempAnnounce: (t) => `Température ${t} sur 100.`,

    // Valeur (§4.4)
    valueStage: 'Étape valeur',
    valueCost: (pct) => `Valeur −${pct} %`,
    signedOf: (amount, value, unit) => `Signé ${amount} ${unit} sur ${value} ${unit}`,
    notSigned: (value, unit) => `Rien de signé sur ${value} ${unit}`,
    costliestTitle: 'Ce qui a coûté le plus',
    costliestStep: (name, pct) => `${name} : −${pct} % de la valeur`,
    nothingLost: 'Aucune perte de valeur : prix tenu de bout en bout.',

    // Débrief
    finalTemp: (t) => `Température finale ${t}/100`,
    decisions: 'Tes décisions',
    wedgeWon: (name) => `Part gagnée : ${name}`,
    dealTally: (senior, pass, fault) => `${senior}\u00a0senior${senior > 1 ? 's' : ''} · ${pass}\u00a0passe${pass > 1 ? 's' : ''} · ${fault}\u00a0faute${fault > 1 ? 's' : ''}`,
    record: 'Meilleur résultat sur ce deal',
    managerSays: 'Ton manager',
    replay: 'REJOUER',
    share: 'PARTAGER',
    shareCopied: 'COPIÉ',
    shareCopiedStatus: 'Texte et lien copiés.',
    shareFailed: 'Partage et copie refusés par le navigateur.',
    nextDeal: 'DEAL SUIVANT',

    // Options
    optionsTitle: 'Options',
    reducedMotion: 'Effets réduits',
    reducedMotionHint: 'Coupe les animations et les transitions.',
    sound: 'Son',
    soundHint: 'Clic, révélation et tampon.',
    soundOn: 'Son activé',
    soundOff: 'Son coupé',
    replayIntro: 'Revoir l\'introduction',
    reset: (name) => `Effacer la sauvegarde de ${name}`,
    resetConfirm: (name) => `Tout effacer pour ${name} ? Roue, CA, historique.`,
    resetYes: 'Oui, effacer',
    resetNo: 'Annuler',
    resetDone: (name) => `Sauvegarde de ${name} effacée.`,

    // Introduction
    introStep: (i, n) => `${i} / ${n}`,
    introVoice: 'Dans les deals, on vous vouvoie. C\'est le client qui parle.', // seul « vous » hors deals (écran 1)
    introSkip: 'Passer',
    introNext: 'Suivant',
    introStart: 'Commencer',
    back: 'Retour',
    publisher: (name) => `Éditeur : ${name}`,
    splashBy: (studio) => `par ${studio}`,
    splashAria: 'Écran d\'ouverture. Touche l\'écran pour passer.',
  },
};

// Vocabulaire d'une édition (editions/<id>/texts.js, `vocab`) : remplace, dans `target`, les textes communs de
// mêmes clés. Appliqué une fois au démarrage, pour l'édition en cours. Une clé inconnue est refusée.
export function applyVocab(vocab, target = texts, path = 'texts') {
  for (const [k, v] of Object.entries(vocab || {})) {
    if (!(k in target)) throw new Error(`vocabulaire : clé inconnue ${path}.${k}`);
    if (v && typeof v === 'object' && typeof target[k] === 'object') applyVocab(v, target[k], `${path}.${k}`);
    else target[k] = v;
  }
  return target;
}

export default texts;
