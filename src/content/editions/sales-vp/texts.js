// Textes de l'édition VP · Head of Sales. Une ligne ≤ 60 caractères (vérifié par le selftest).
const plural = (n, one, many) => (n > 1 ? many : one);

export const texts = {
  // Libellés des types de vente (clés : edition.saleTypes)
  saleTypes: {
    corporate: 'Équipes grands comptes',
    'eti-pme': 'Équipes ETI et PME',
  },
  // Exemple de montant du 3e écran d'introduction : protégé, en jeu (k€)
  introAmount: [540, 900],
  // Introduction : 3 écrans au plus (titre ≤ 60 caractères, texte ≤ 160).
  intro: [
    {
      title: 'Tu es VP · Head of Sales',
      body: 'Chaque partie est un trimestre. Cinq décisions : forecast, pipe review, coaching, recrutement, arbitrage.',
    },
    {
      title: 'Trois réponses, un seul réflexe VP',
      body: 'Réflexe VP, ça passe ou faute de management : chaque choix réchauffe ou refroidit le trimestre. À 70, il est tenu.',
    },
    {
      title: 'Protège le CA de ton équipe',
      body: 'Le CA protégé dépend de tes réponses, surtout au recrutement et à l\'arbitrage. Ton CA, c\'est ce que l\'équipe garde.',
    },
  ],
  // Commentaires du DG selon le verdict (≥ 8 par verdict).
  manager: {
    signed: [
      'Trimestre tenu. Je le présente tel quel au board.',
      'Propre. Ton équipe sait où elle va.',
      'Le chiffre est là, et l\'équipe aussi. Merci.',
      'Bon trimestre. Écris ce que tu as fait, il resservira.',
      'Pas une surprise dans le forecast. C\'est rare.',
      'Tu as tranché au bon moment. Continue.',
      'Je n\'ai rien à ajouter. Ça aussi, c\'est rare.',
      'Le DAF a souri. Je note la date.',
    ],
    delayed: [
      'On en reparle lundi.',
      'Le chiffre glisse. Je veux savoir où.',
      'Pas raté. Pas tenu non plus.',
      'Je garde ton forecast, mais je le relis.',
      'Une décision a manqué quelque part. Laquelle ?',
      'Le board va poser des questions. Prépare-les.',
      '« Ça arrive au prochain trimestre. » On connaît.',
      'Ton équipe a couru. Dans quelle direction ?',
    ],
    // Tenu à moins de config.deal.lowValueShare de la valeur (≥ 4)
    signedLow: [
      'Tenu, oui. Mais regarde ce que ça a coûté.',
      'Le trimestre passe. L\'équipe, elle, a payé.',
      'Bon pour ce trimestre. Pour le suivant, à revoir.',
      'Tu as tenu le chiffre et perdu de la marge. Rejoue.',
    ],
    lost: [
      'On fait le point ensemble ?',
      'Ton équipe est en risque. Moi aussi, du coup.',
      'Ça arrive. Regarde où ça a basculé.',
      'Perdu, mais tu sais maintenant pourquoi.',
      'Le problème n\'était pas le marché. Cherche ailleurs.',
      'Les trimestres se perdent tôt, pas en fin de mois.',
      'Note ce que tu ferais autrement. Puis rejoue.',
      'Une équipe se reconstruit. Commence lundi.',
    ],
  },
  // Vocabulaire de l'édition : remplace des textes communs (src/content/texts.js) pendant la partie.
  vocab: {
    grades: { 3: 'Réflexe VP', 1: 'Ça passe', 0: 'Faute de management' },
    verdicts: { signed: 'TRIMESTRE TENU', delayed: 'ATTERRISSAGE RATÉ', lost: 'ÉQUIPE EN RISQUE' },
    bestVerdicts: { signed: 'Trimestre tenu', delayed: 'Atterrissage raté', lost: 'Équipe en risque' },
    gaugeMarks: { delayed: 'Raté', signed: 'Tenu' },
    ui: {
      dealsInvalid: (n) => `${n} trimestre${plural(n, '', 's')} invalide${plural(n, '', 's')} ignoré${plural(n, '', 's')}`,
      wheelHint: (n) => `Une part : ${n} réflexes VP sur l'étape, dans ${n} trimestres.`,
      revenueLabel: 'CA d\'équipe protégé',
      revenueOf: (possible, pct) => `sur ${possible} en jeu — ${pct} % protégé`,
      revenueAria: (a, b, pct) => `CA d'équipe protégé ${a} sur ${b} en jeu, ${pct} %`,
      signedDeals: (n, total) => `${n} / ${total} trimestres tenus`,
      bestAmount: (a, unit) => `Protégé ${a} ${unit}`,
      noDeals: 'Aucun trimestre validé pour l\'instant.',
      noDealsHint: 'Les premiers trimestres arrivent bientôt.',
      dailyTitle: 'Trimestre du jour',
      dailyPlay: 'Jouer le trimestre du jour',
      dailyOfficial: 'Trimestre du jour · essai officiel',
      dailyTraining: 'Trimestre du jour · entraînement',
      dailyEmpty: 'Pas de trimestre du jour : aucun validé.',
      trainingHint: (n) => `${n} étapes d'une même compétence, de trimestres différents.`,
      trainingScore: (n, total) => `${n} réflexe${plural(n, '', 's')} VP sur ${total}`,
      duelHint: 'Saisis le code reçu : même trimestre, puis comparaison.',
      duelNoDeal: 'Ce trimestre n\'est pas disponible ici.',
      campaignHint: 'Les trimestres par type d\'équipe. Commence où tu veux.',
      campaignHintLocked: 'Chaque trimestre tenu ouvre le suivant du même type.',
      groupProgress: (s, n) => `${s} / ${n} tenus`,
      lockedHint: 'Tiens un trimestre de ce type pour l\'ouvrir.',
      titleHint: (n) => `Le titre se gagne sur ${n} trimestres : chaque note compte.`,
      historyTitle: 'Trimestres joués',
      noHistory: 'Aucun trimestre joué pour l\'instant.',
      deletedDeal: 'Trimestre retiré',
      temperature: 'Température du trimestre',
      gaugeAria: (t) => `Température du trimestre : ${t} sur 100`,
      signedOf: (amount, value, unit) => `CA d'équipe protégé ${amount} ${unit} / en jeu ${value} ${unit}`,
      notSigned: (value, unit) => `Rien de protégé sur ${value} ${unit} en jeu`,
      dealTally: (vp, pass, fault) => `${vp}\u00a0VP · ${pass}\u00a0passe${pass > 1 ? 's' : ''} · ${fault}\u00a0faute${fault > 1 ? 's' : ''}`,
      record: 'Meilleur résultat sur ce trimestre',
      managerSays: 'Ton DG',
      nextDeal: 'TRIMESTRE SUIVANT',
    },
  },
};

export default texts;
