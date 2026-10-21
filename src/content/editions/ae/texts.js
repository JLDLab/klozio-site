// Textes de l'édition Sales · AE. Une ligne ≤ 60 caractères (vérifié par le selftest).
export const texts = {
  // Libellés des types de vente (clés : edition.saleTypes)
  saleTypes: {
    corporate: 'Grands comptes',
    public: 'Secteur public',
    'eti-pme': 'ETI et PME',
    conseil: 'Conseil',
    finance: 'Banque et assurance',
  },
  // Exemple de montant du 3e écran d'introduction : signé, valeur (k€)
  introAmount: [108, 180],
  // Introduction : 3 écrans au plus (titre ≤ 60 caractères, texte ≤ 160).
  intro: [
    {
      title: 'Tu es Account Executive',
      body: 'Chaque partie est un deal B2B mené en 5 étapes, de la prospection au closing. Une décision par étape.',
    },
    {
      title: 'Trois réponses, un seul réflexe senior',
      body: 'Réflexe senior, ça passe ou faute de jeu : chaque choix réchauffe ou refroidit le deal. À 70, il signe.',
    },
    {
      title: 'Signe, et au bon prix',
      body: 'Le montant signé dépend de tes réponses, surtout en négociation et au closing. Ton CA, c\'est ce que tu préserves.',
    },
  ],
  // Commentaires du manager selon le verdict (≥ 8 par verdict).
  manager: {
    signed: [
      'Celui-là, je le mets dans le forecast.',
      'Propre. Tu peux raconter ce deal à l\'équipe lundi.',
      'Signé avant la fin du trimestre. Merci.',
      'Bon cycle. Garde le compte rendu, il servira.',
      'Le client a signé sans relance. C\'est rare.',
      'Joli. Pense déjà à l\'extension dans un an.',
      'Je n\'ai rien à ajouter. Ça aussi, c\'est rare.',
      'Bien joué. La finance va enfin sourire.',
    ],
    delayed: [
      'On en reparle lundi.',
      'Ça sent le report au trimestre prochain.',
      'Pas perdu. Pas gagné non plus.',
      'Je le laisse dans le pipeline, pas dans le forecast.',
      'Il manque un décideur quelque part. Cherche-le.',
      'Garde le contact au chaud, ça peut revenir.',
      '« On revient vers vous. » On connaît la chanson.',
      'Une étape a coincé. Laquelle, à ton avis ?',
    ],
    // Signé à moins de config.deal.lowValueShare de la valeur (≥ 4)
    signedLow: [
      'Signé, oui. Mais regarde ce qu\'il reste de la valeur.',
      'Le client a signé. La finance va regarder la remise.',
      'Bon deal pour le client. Pour nous, à revoir.',
      'Tu as gagné le deal et perdu la marge. Rejoue-le.',
    ],
    lost: [
      'On fait le débrief ensemble ?',
      'Rappelez-moi en janvier, comme dirait le client.',
      'Ça arrive. Regarde où ça a basculé.',
      'Perdu, mais tu sais maintenant pourquoi.',
      'Le concurrent était là au bon moment. Pas toi.',
      'Ceux-là ne se perdent pas au closing, mais avant.',
      'Note ce que tu ferais autrement. Puis rejoue.',
      'Un deal perdu tôt coûte moins cher qu\'un perdu tard.',
    ],
  },
};

export default texts;
