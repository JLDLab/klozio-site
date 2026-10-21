// KLOZIO — paramètres de jeu. Une ligne de doc par valeur. Aucune valeur de gameplay ailleurs.
export const config = Object.freeze({
  brand: Object.freeze({
    name: 'KLOZIO', // nom du jeu affiché (le nom de l'édition vient de son edition.js)
    publisher: 'Squadra Nostra Games', // nom de l'éditeur, affiché dans les options
    studio: 'Squadra Nostra Games', // studio affiché sous le nom du jeu sur l'écran d'ouverture
    tagline: 'Deviens le commercial que tu aurais voulu avoir en face.', // phrase de l'écran d'ouverture
    // M8 v2 — fichiers de marque (public/brand/), intégrés tels quels
    wordmark: 'public/brand/klozio_wordmark_chocolat_bleu.svg', // logo principal : écran d'ouverture et accueil
  }),

  // M8 v2 — écran d'ouverture animé (une fois par jour, date locale), puis fondu vers le premier écran
  splash: Object.freeze({
    // Les phases se chevauchent pour un mouvement continu ; 2,4 s en tout, fondu de sortie compris.
    lettersMs: 450, // 0 → 0,45 s : « KLO » et « I » en fondu, en montant légèrement
    zStartMs: 250, // 0,25 → 0,95 s : les 3 traits du Z se dessinent (haut, diagonale, bas)
    zStrokeMs: 300, // durée du tracé de chaque trait
    zGapMs: 200, // écart entre deux traits (chaque trait commence avant la fin du précédent)
    partsStartMs: 850, // 0,85 → 1,55 s : les 3 parts du camembert, une à une
    partGapMs: 160, // écart entre deux parts
    partMs: 380, // durée d'apparition d'une part (scale 0,6 → 1, léger rebond)
    tagStartMs: 1300, // 1,3 → 1,7 s : studio et tagline en fondu, en montant légèrement
    tagMs: 400, // durée du fondu du studio et de la tagline
    totalMs: 2050, // fin de l'animation, logo complet tenu 0,5 s : le fondu de sortie commence
    fadeMs: 350, // fondu de sortie vers l'introduction ou l'accueil
    reducedHoldMs: 800, // effets réduits : logo complet affiché d'un coup, tenu 0,8 s, puis le premier écran
    reducedFadeMs: 200, // effets réduits : fondus d'entrée et de sortie de 200 ms
    storageKey: 'klozio.splash.v1', // date (AAAAMMJJ) du dernier affichage
  }),

  deal: Object.freeze({
    stepsPerDeal: 5, // nombre d'étapes d'un deal = nombre d'étapes du cycle de chaque édition
    optionsPerStep: 3, // nombre d'options par étape
    grades: Object.freeze([3, 1, 0]), // notes possibles : 3 réflexe senior, 1 ça passe, 0 faute de jeu
    startTemp: 40, // température de départ de la jauge (0–100)
    minTemp: 0, // borne basse de la jauge
    maxTemp: 100, // borne haute de la jauge
    delta: Object.freeze({ 3: 14, 1: 2, 0: -12 }), // variation de température selon la note
    thresholds: Object.freeze({ signed: 70, delayed: 45 }), // ≥ signed : SIGNÉ ; ≥ delayed : REPORTÉ ; sinon PERDU
    valueImpact: Object.freeze({ 3: 0, 1: -0.08, 0: -0.2 }), // §4.4 perte de valeur selon la note (part de la valeur du deal)
    valueStageFactor: 2, // multiplicateur du barème aux étapes « valeur » de l'édition (edition.valueStages)
    valueFloor: 0.4, // part minimale de la valeur signée, quelles que soient les pertes
    optionImpactMin: -0.5, // valueImpact d'une option : entre cette valeur et optionImpactMax
    optionImpactMax: -0.01, // valueImpact d'une option : toujours une perte (A14)
    optionImpactGrades: Object.freeze([1, 0]), // notes pouvant porter un valueImpact (5 réflexes seniors = 100 %)
    lowValueShare: 0.7, // sous cette part signée, le manager commente le prix (texts.manager.signedLow)
    minDifficulty: 1, // difficulté minimale d'un deal
    maxDifficulty: 3, // difficulté maximale d'un deal
  }),

  content: Object.freeze({
    statuses: Object.freeze(['draft', 'valide']), // statuts possibles d'un deal
    publicStatus: 'valide', // seul statut visible hors mode développeur
    devFlag: 'dev', // paramètre d'URL qui active le mode développeur (?dev)
    showDifficulty: false, // false tant que la difficulté n'est pas renseignée deal par deal : ni affichée, ni utilisée pour l'ordre
  }),

  // A4 — longueurs maximales en caractères (le selftest échoue au-delà sur les deals validés)
  limits: Object.freeze({
    context: 160, // contexte d'une étape
    question: 60, // question d'une étape
    option: 140, // texte d'une option
    feedback: 160, // feedback d'une option
    event: 160, // texte d'un événement de deal
    valueReason: 90, // raison d'une perte de valeur (valueReason d'une option, raisons génériques)
    postTitle: 60, // titre d'une leçon à partager (post.t d'une étape)
    postHook: 160, // accroche d'une leçon à partager (post.h d'une étape)
    introBody: 160, // texte d'un écran d'introduction (editions/<id>/texts.js, intro)
    uiLine: 60, // ligne d'interface (src/content/texts.js)
    gaugeMark: 8, // libellé d'un seuil de la jauge (texts.gaugeMarks) : deux tiennent côte à côte sur 360 px
  }),

  // §4.3 — événements de deal (champ optionnel `event` d'une option)
  event: Object.freeze({
    grades: Object.freeze([0]), // notes d'option pouvant porter un événement
    minTemp: -20, // effet minimal d'un événement sur la température
    maxTemp: 0, // effet maximal d'un événement sur la température
  }),

  // §4.9 — campagne
  campaign: Object.freeze({
    lockEnabled: false, // false : tous les deals ouverts ; true : ouverture progressive ci-dessous
    openAtStart: 3, // deals ouverts d'emblée dans chaque type de vente
    unlockPerSigned: 1, // deals déverrouillés par deal signé dans le même type
  }),

  // §4.10 — éditions (catalogue : src/content/editions/index.js)
  editions: Object.freeze({
    statuses: Object.freeze(['active', 'a-venir']), // statuts d'une édition du catalogue
    default: 'ae', // édition ouverte au premier lancement
    maxAbbr: 3, // longueur maximale de l'abréviation d'une étape (pastilles)
    maxIntroSlides: 3, // écrans d'introduction au plus
  }),

  // §4.7 — deal du jour
  daily: Object.freeze({
    keepDays: 60, // jours d'historique du deal du jour gardés dans la sauvegarde
  }),

  // §4.8 — duel par code (KLZ-AE-XXXXC)
  duel: Object.freeze({
    prefix: 'KLZ', // début de tout code de défi
    payloadChars: 4, // caractères de données (base 32) ; un caractère de contrôle s'ajoute
    maxDealNum: 4095, // numéro de deal maximal (champ `num`), (max + 1) × 3^5 doit tenir dans 32^payloadChars
  }),

  // §4.9 — entraînement ciblé
  training: Object.freeze({
    steps: 5, // étapes d'une série, chacune tirée d'un deal différent
  }),

  // §4.7 — partage
  share: Object.freeze({
    copiedMs: 2000, // M9 : durée de « Copié » sur le bouton de partage de fin de deal
  }),

  // §4.5 — profil : maîtrise moyenne minimale de chaque titre (même ordre que edition.profileTitles)
  profile: Object.freeze({
    titleThresholds: Object.freeze([0, 0.3, 0.45, 0.6, 0.75, 0.9]),
  }),

  // A6 — équité des positions et des longueurs
  fairness: Object.freeze({
    minPositionShare: 0.25, // part minimale de meilleures réponses par position (1, 2, 3)
    maxPositionShare: 0.42, // part maximale de meilleures réponses par position
    maxLengthGap: 0.15, // écart de longueur moyen max entre la meilleure option et les autres
    maxSamePosition: 2, // par deal : fois maximum où la meilleure réponse occupe la même position (jamais 2 étapes consécutives)
  }),

  // A5 — rythme mesuré par le bot
  pacing: Object.freeze({
    wordsPerMinute: 250, // vitesse de lecture du lecteur moyen
    thinkSeconds: 3, // temps de réflexion par choix
    minDealMinutes: 2, // durée minimale d'un deal
    maxDealMinutes: 4, // durée maximale d'un deal
    tolerance: 0.05, // tolérance sur ces bornes (décision de Jordan, 17/10/2026) : 1 min 54 à 4 min 12
  }),

  // §4.5 — roue : une part par étape du cycle
  wheel: Object.freeze({
    hitGrade: 3, // note qui compte pour une part (réflexe senior)
    requiredHits: 3, // réflexes seniors nécessaires sur l'étape pour gagner la part
    distinctDeals: true, // true : chaque réflexe doit venir d'un deal différent (rejouer ne compte qu'une fois)
    partMs: 140, // durée d'apparition d'une part gagnée sur la roue du jeu (indépendante de l'écran d'ouverture)
  }),

  // §4.5 — maîtrise et historique
  mastery: Object.freeze({
    window: 10, // nombre de dernières notes prises en compte par compétence
    historySize: 20, // derniers deals gardés pour le profil
  }),

  // Interface : minutage (ms) et seuils d'accessibilité (A2, A3, A8)
  ui: Object.freeze({
    revealStaggerMs: 60, // décalage entre les trois options révélées en cascade
    revealMs: 160, // durée de l'apparition d'une option révélée (cascade complète < 300 ms)
    gaugeMs: 600, // durée de l'animation de la jauge
    stampMs: 500, // durée de l'animation du tampon de verdict
    countMs: 600, // durée du décompte du montant signé, de la valeur pleine au montant obtenu
    toastMs: 4000, // M10-A : durée d'affichage d'un toast
    minContrast: 4.5, // contraste minimal texte / fond
    minGraphicContrast: 3, // A11 contraste minimal d'un élément graphique (dégradé de la jauge) avec le fond
    minFontPx: 12, // taille de texte minimale
    sceneFontPx: 17, // taille du texte de scène
    optionFontPx: 16, // taille du texte d'option (≥ 15)
    tapPx: 48, // hauteur minimale d'une cible tactile
    ctaPx: 56, // hauteur minimale du bouton principal (M8 v2)
    tapGapPx: 10, // espacement entre cibles tactiles (≥ 8)
    revealBudgetMs: 300, // délai maximal de révélation (A8)
  }),

  // §9 — sauvegarde
  save: Object.freeze({
    prefix: 'klozio.', // début de la clé localStorage d'une édition : klozio.<id>.save.v1
    suffix: '.save.v1', // fin de la clé localStorage d'une édition
    version: 2, // version du format de sauvegarde d'une édition (2 : roue par réflexes, montants signés)
    prefsKey: 'klozio.prefs.v1', // préférences communes à toutes les éditions (thème, effets, son)
    legacyKeys: Object.freeze(['klozio.save.v1', 'klozio.sales.v1']), // anciennes clés, migrées vers legacyEdition
    legacyEdition: 'ae', // édition qui reprend les anciennes sauvegardes
  }),

  // §7 — audio (WebAudio synthétisé)
  audio: Object.freeze({
    volume: 0.18, // volume maximal d'un son (0–1)
  }),

  // §9 — performance (selftest et npm run check:browser)
  perf: Object.freeze({
    maxBytesKb: 400, // poids des fichiers publiés, polices exclues
    firstScreenMs: 1500, // premier écran utilisable en 4G (profil network4g), processeur ralenti ×4, cache vide
    network4g: Object.freeze({ latencyMs: 100, downKbps: 9000, upKbps: 1500 }), // 4G typique : budget ci-dessus
    networkSlow4g: Object.freeze({ latencyMs: 150, downKbps: 1600, upKbps: 750 }), // 4G dégradée : mesurée pour information
    cpuSlowdown: 4, // ralentissement processeur (téléphone milieu de gamme)
    soakDeals: 20, // deals joués d'affilée pour chercher une fuite
    maxHeapGrowthKb: 1024, // croissance maximale de la mémoire JS sur ces deals
  }),

  // §9 — PWA
  // M10-A : prix annoncés sur la carte « Édition complète » (achat unique ; aucun paiement pour l'instant)
  pricing: Object.freeze({
    edition: '14,90', // une édition (€)
    bundle: '29', // les trois éditions (€)
  }),

  pwa: Object.freeze({
    testFlag: 'sw', // sur localhost, ?sw active le service worker (essai de dist/ : npm run dist:serve)
    dealParam: 'deal', // lien profond : ?deal=<id> ouvre ce deal (M9)
    siteUrl: 'https://jldlab.github.io/klozio-site/', // adresse publique (balises Open Graph, page 404)
  }),

  // Bot de test
  bot: Object.freeze({
    seed: 20261016, // graine de la politique aléatoire
    randomRuns: 20, // parties aléatoires jouées par deal
  }),
});

export default config;
