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
    reducedHoldMs: 1300, // effets réduits : logo complet affiché d'un coup, tenu 1,3 s (1,5 s avec les fondus), puis le premier écran
    reducedFadeMs: 200, // effets réduits : fondus d'entrée et de sortie de 200 ms
    storageKey: 'klozio.splash.v1', // date (AAAAMMJJ) du dernier affichage
    bootMinMs: 1500, // écran de démarrage (index.html, #boot) : affiché au moins 1,5 s, ou jusqu'au chargement du jeu
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
    // M17-A : premier deal de chaque édition (accueil de première visite) ; le deal du jour tiré au hasard ne commence
    // qu'après lui. Un lien de défi reste prioritaire.
    firstDeal: Object.freeze({ ae: 'faux-pipe', 'sales-vp': 'vp-manque-ambition', 'sales-sdr': 'sdr-faux-chaud' }),
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
    sentence: 80, // M17-A : phrases sur deux lignes au besoin (crédibilité sous le logo, « Ce deal est dur » au débrief)
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
    streakFrom: 2, // M17-B : la série s'affiche sur l'accueil à partir de 2 jours d'affilée
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
    desktopMinPx: 1024, // M16 : à partir de cette largeur, mise en page ordinateur (en dessous, le mobile inchangé)
    dealMinutes: 3, // M17-B : durée d'un deal, une seule valeur partout (accueil, première visite, /offres)
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
    maxBytesKb: 500, // poids des fichiers publiés, polices exclues (M16 : 400 → 450 Ko ; M17 : 500 Ko, validé par Jordan ; docs/DESIGN.md §9)
    firstScreenMs: 1500, // premier écran utilisable en 4G (profil network4g), processeur ralenti ×4, cache vide
    network4g: Object.freeze({ latencyMs: 100, downKbps: 9000, upKbps: 1500 }), // 4G typique : budget ci-dessus
    networkSlow4g: Object.freeze({ latencyMs: 150, downKbps: 1600, upKbps: 750 }), // 4G dégradée : mesurée pour information
    cpuSlowdown: 4, // ralentissement processeur (téléphone milieu de gamme)
    soakDeals: 20, // deals joués d'affilée pour chercher une fuite
    maxHeapGrowthKb: 1024, // croissance maximale de la mémoire JS sur ces deals
  }),

  // M14 — langues de l'interface : i18n/<lang>.json ; ?lang=en dans l'adresse (liens partagés)
  i18n: Object.freeze({
    langs: Object.freeze(['fr', 'en']), // langues disponibles
    default: 'fr', // langue par défaut, et celle des pages du site sans préfixe (offres/ ; en/offres/ pour l'anglais)
    param: 'lang', // paramètre d'adresse : ?lang=en
    hintParam: 'from', // M17-B : langue de l'émetteur d'un lien de défi, retenue seulement si le receveur n'a pas choisi
  }),

  // §9 — PWA
  pwa: Object.freeze({
    testFlag: 'sw', // sur localhost, ?sw active le service worker (essai de dist/ : npm run dist:serve)
    dealParam: 'deal', // lien profond : ?deal=<id> ouvre ce deal (M9)
    codeParam: 'code', // lien de la page code/ (M10-B lot B) : ?code=KLZ-… ouvre « J'ai un code », code déjà saisi
    duelParam: 'defi', // M17-B : lien de défi ?defi=KLZ-AE-XXXXX : ouvre directement le deal du défi
    // Adresse publique (Open Graph, page 404, liens de partage et de défi, pages du site). M15 : variable de build
    // KLOZIO_SITE (ex. https://klozio.app/ pour un domaine à la racine) ; npm run dist écrit sa valeur dans le
    // config.js publié. Sans elle, https://klozio.app/ (M15 lot B ; l'ancienne adresse GitHub Pages par la variable).
    siteUrl: 'https://klozio.app/',
  }),

  // M9 lot 4 — mesure sans cookie : un sendBeacon par événement vers le Worker de stats/ (Cloudflare, gratuit)
  stats: Object.freeze({
    endpoint: 'https://klozio-stats.jldlabs.workers.dev/e', // Worker de stats/ ; null = aucun envoi
    // M17-A : répartition des réflexes seniors d'un deal (GET /stats/deal/:id) ; « Tu fais mieux que N % » à partir de
    // minPlays parties mesurées
    dealStats: 'https://klozio-stats.jldlabs.workers.dev/stats/deal/',
    minPlays: 30,
    // sous minBetter %, pas de « mieux que N % » : à la place, la part des parties à hardFrom réflexes seniors ou plus
    minBetter: 20,
    hardFrom: 4,
    hosts: ['jldlab.github.io', 'klozio.app'], // envoi depuis le site publié seulement (M15 : les deux adresses pendant la transition)
  }),

  // M10-B lot A — accès par code : le même Worker sert /unlock et /deals/:edition (deals payants, jamais dans dist/)
  access: Object.freeze({
    endpoint: 'https://klozio-stats.jldlabs.workers.dev', // Worker de stats/
    kdfIterations: 100000, // PBKDF2 : clé du cache local des deals, dérivée du code
  }),

  // M11 lot C — KLOZIO Team : scores des codes team vers le Worker (/team/score), deal de la semaine du manager
  team: Object.freeze({
    remindDays: 3, // rappel du deal de la semaine s'il n'est pas joué à J+3 (notification si permise, sinon bandeau)
    queueMax: 50, // scores gardés sur l'appareil en attendant le réseau
  }),

  // M13 — offres (DECISIONS.md, point 3), prix HT en euros. La page offres/ et la carte « Édition complète » en
  // tirent tous leurs chiffres ; les nombres de deals sont ceux du catalogue réel (config/catalog.json, deals
  // écrits, config/free.json), jamais la cible : ils montent seuls quand des deals s'ajoutent.
  offers: Object.freeze({
    edition: 39, // une édition
    buyAfter: 2, // M17-A : carte d'achat et ligne « Débloquer » du débrief à partir de 2 deals terminés dans l'édition
    seats: 3, // appareils par code individuel (= SEATS de stats/access.js, vérifié par le selftest)
    all: 99, // Tout KLOZIO : les trois éditions, les deals « all » en plus, et tout ajout futur
    team: Object.freeze({ price: 1200, seats: 10, extraSeat: 90 }), // par an, vendu par facture
    live: Object.freeze({ price: 2400, people: 12 }), // la demi-journée, Team 10 sièges inclus
    packs: Object.freeze([Object.freeze({ deals: 10, price: 2900 }), Object.freeze({ deals: 20, price: 4900 })]), // deals sur mesure
    contact: 'jordan@jldlabs.com', // « Me contacter »
    // M10-B lot B — Payment Links Stripe (mode test tant que le compte n'est pas en live), un par offre individuelle.
    // Après paiement, Stripe renvoie sur code/?session_id=… (page du site), qui affiche le code créé par le Worker.
    buy: Object.freeze({
      ae: 'https://buy.stripe.com/test_aFa5kD5T32L9cC72TkaAw00',
      'sales-vp': 'https://buy.stripe.com/test_9B66oH4OZgBZcC7fG6aAw01',
      'sales-sdr': 'https://buy.stripe.com/test_9B68wP5T3etR6dJctUaAw02',
      all: 'https://buy.stripe.com/test_fZucN5ftDclJeKfgKaaAw03',
    }),
  }),

  // Bot de test
  bot: Object.freeze({
    seed: 20261016, // graine de la politique aléatoire
    randomRuns: 20, // parties aléatoires jouées par deal
  }),
});

export default config;
