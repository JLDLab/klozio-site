// Textes de l'édition SDR · BDR. Une ligne ≤ 60 caractères (vérifié par le selftest).
const plural = (n, one, many) => (n > 1 ? many : one);

export const texts = {
  // Libellés des types de vente (clés : edition.saleTypes)
  saleTypes: {
    corporate: 'Comptes grands groupes',
    'eti-pme': 'Comptes ETI et PME',
  },
  // Exemple de montant du 3e écran d'introduction : généré, possible (k€)
  introAmount: [36, 60],
  // Introduction : 3 écrans au plus (titre ≤ 60 caractères, texte ≤ 160).
  intro: [
    {
      title: 'Tu es SDR · BDR',
      body: 'Chaque partie est un compte à ouvrir. Cinq décisions : ciblage, accroche, standard et objections, qualification, relais.',
    },
    {
      title: 'Trois réponses, un seul réflexe SDR',
      body: 'Réflexe SDR, ça passe ou faute de prospection : chaque choix réchauffe ou refroidit le compte. À 70, le RDV est qualifié.',
    },
    {
      title: 'Génère du pipe pour ton AE',
      body: 'Le pipe généré dépend de tes réponses, surtout à la qualification et au relais. Un RDV mal qualifié ne vaut pas grand-chose.',
    },
  ],
  // Commentaires du manager selon le verdict (≥ 8 par verdict).
  manager: {
    signed: [
      'RDV propre. L\'AE n\'a rien eu à redemander.',
      'Bien ciblé, bien qualifié. C\'est ça, le métier.',
      'L\'AE m\'a dit merci. Ça n\'arrive pas tous les jours.',
      'Tu as ouvert un compte que d\'autres avaient lâché.',
      'Bonne accroche. Garde-la, elle resservira.',
      'Enjeu, décideur, date : tout y est.',
      'Ce RDV-là va tenir. Je le note.',
      'Trois minutes bien utilisées. Continue.',
    ],
    delayed: [
      'RDV pris, mais je ne parierais pas dessus.',
      'Il manque le décideur. Ou la date. Ou les deux.',
      'L\'AE va devoir tout requalifier.',
      'Pas raté. Pas solide non plus.',
      'Il a dit oui pour raccrocher plus vite ?',
      'Relis ta prise de notes avant de passer le relais.',
      'Un RDV fragile, c\'est un no-show qui attend.',
      'Le compte est ouvert. À moitié.',
    ],
    // Qualifié à moins de config.deal.lowValueShare de la valeur (≥ 4)
    signedLow: [
      'Qualifié, oui. Mais le deal a rétréci en route.',
      'RDV tenu, enjeu revu à la baisse. Regarde où.',
      'L\'AE a le RDV. Pas tout le contexte.',
      'Bon RDV, petit pipe. Rejoue la qualification.',
    ],
    lost: [
      'On fait le point ensemble ?',
      'Raccroché. Regarde à quelle phrase.',
      'Ça arrive. Le prochain appel est dans deux minutes.',
      'Le « non » était traitable. Cherche où.',
      'Mauvaise cible ou mauvaise accroche ? Rejoue.',
      'Note ce que tu dirais autrement. Puis rappelle.',
      'Un compte perdu au premier appel ne l\'est pas pour toujours.',
      'Les comptes se perdent dans les quinze premières secondes.',
    ],
  },
  // Vocabulaire de l'édition : remplace des textes communs (src/content/texts.js) pendant la partie.
  vocab: {
    grades: { 3: 'Réflexe SDR', 1: 'Ça passe', 0: 'Faute de prospection' },
    verdicts: { signed: 'RDV QUALIFIÉ', delayed: 'RDV FRAGILE', lost: 'RACCROCHÉ' },
    bestVerdicts: { signed: 'RDV qualifié', delayed: 'RDV fragile', lost: 'Raccroché' },
    gaugeMarks: { delayed: 'Fragile', signed: 'Qualifié' },
    ui: {
      dealsInvalid: (n) => `${n} compte${plural(n, '', 's')} invalide${plural(n, '', 's')} ignoré${plural(n, '', 's')}`,
      wheelHint: (n) => `Une part : ${n} réflexes SDR sur l'étape, dans ${n} comptes.`,
      revenueLabel: 'Pipe généré',
      revenueOf: (possible, pct) => `sur ${possible} de pipe possible — ${pct} % généré`,
      revenueAria: (a, b, pct) => `Pipe généré ${a} sur ${b} de pipe possible, ${pct} %`,
      signedDeals: (n, total) => `${n} / ${total} RDV qualifiés`,
      bestAmount: (a, unit) => `Pipe ${a} ${unit}`,
      noDeals: 'Aucun compte validé pour l\'instant.',
      noDealsHint: 'Les premiers comptes arrivent bientôt.',
      dailyTitle: 'Compte du jour',
      dailyPlay: 'Jouer le compte du jour',
      dailyOfficial: 'Compte du jour · essai officiel',
      dailyTraining: 'Compte du jour · entraînement',
      dailyEmpty: 'Pas de compte du jour : aucun validé.',
      trainingHint: (n) => `${n} étapes d'une même compétence, de comptes différents.`,
      trainingScore: (n, total) => `${n} réflexe${plural(n, '', 's')} SDR sur ${total}`,
      duelHint: 'Saisis le code reçu : même compte, puis comparaison.',
      duelNoDeal: 'Ce compte n\'est pas disponible ici.',
      campaignHint: 'Les comptes par taille. Commence où tu veux.',
      campaignHintLocked: 'Chaque RDV qualifié ouvre le compte suivant.',
      groupProgress: (s, n) => `${s} / ${n} qualifiés`,
      lockedHint: 'Qualifie un RDV de ce type pour l\'ouvrir.',
      titleHint: (n) => `Le titre se gagne sur ${n} comptes : chaque note compte.`,
      historyTitle: 'Comptes ouverts',
      noHistory: 'Aucun compte ouvert pour l\'instant.',
      deletedDeal: 'Compte retiré',
      temperature: 'Température du compte',
      gaugeAria: (t) => `Température du compte : ${t} sur 100`,
      signedOf: (amount, value, unit) => `Pipe généré ${amount} ${unit} / possible ${value} ${unit}`,
      notSigned: (value, unit) => `Aucun pipe généré sur ${value} ${unit} possibles`,
      dealTally: (sdr, pass, fault) => `${sdr}\u00a0SDR · ${pass}\u00a0passe${pass > 1 ? 's' : ''} · ${fault}\u00a0faute${fault > 1 ? 's' : ''}`,
      record: 'Meilleur résultat sur ce compte',
      nextDeal: 'COMPTE SUIVANT',
    },
  },
};

export default texts;
