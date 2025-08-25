export class AlgorithmeClassificationConseiller {
  private config: Record<string, any>;

  constructor(config: Record<string, any> = {}) {
    this.config = {
      seuilEngagement: config.seuilEngagement || 0.6,
      seuilOuverture: config.seuilOuverture || 0.5,
      seuilExplication: config.seuilExplication || 0.4,
      seuilReflet: config.seuilReflet || 0.3,
      poidsExpressions: config.poidsExpressions || 2.0,
      poidsMots: config.poidsMots || 1.0,
      ...config,
    };
  }

  private dictionnaires = {
    ENGAGEMENT: {
      expressions: [
        "je comprends",
        "je vois",
        "d'accord",
        "effectivement",
        "tout à fait",
        "je vous suis",
        "c'est clair",
        "bien sûr",
        "absolument",
        "c'est vrai",
        "vous avez raison",
        "exactement",
      ],
      mots: [
        "comprendre",
        "saisir",
        "suivre",
        "entendre",
        "voir",
        "accord",
        "oui",
        "exactement",
        "bien",
        "parfait",
        "clair",
        "évident",
        "logique",
        "normal",
      ],
    },
    OUVERTURE: {
      expressions: [
        "qu'est-ce que",
        "comment",
        "pourquoi",
        "pouvez-vous",
        "dites-moi",
        "expliquez-moi",
        "que pensez-vous",
        "qu'en pensez-vous",
        "comment ça se passe",
        "parlez-moi",
      ],
      mots: [
        "question",
        "demander",
        "savoir",
        "comprendre",
        "expliquer",
        "comment",
        "pourquoi",
        "quoi",
        "qui",
        "quand",
        "où",
        "quelle",
        "quel",
        "lesquels",
        "laquelle",
      ],
    },
    EXPLICATION: {
      expressions: [
        "en fait",
        "c'est-à-dire",
        "autrement dit",
        "pour clarifier",
        "je m'explique",
        "voici pourquoi",
        "la raison",
        "parce que",
        "du coup",
        "donc voilà",
        "en réalité",
        "concrètement",
      ],
      mots: [
        "parce",
        "car",
        "donc",
        "ainsi",
        "alors",
        "voilà",
        "expliquer",
        "raison",
        "cause",
        "effet",
        "résultat",
        "conséquence",
        "exemple",
        "cas",
        "situation",
      ],
    },
    REFLET: {
      expressions: [
        "si je comprends bien",
        "vous dites que",
        "donc pour vous",
        "en d'autres termes",
        "vous me confirmez",
        "c'est bien ça",
        "pour résumer",
        "si je reformule",
        "vous voulez dire",
      ],
      mots: [
        "donc",
        "alors",
        "ainsi",
        "résumer",
        "reformuler",
        "confirmer",
        "vérifier",
        "recap",
        "bref",
        "synthèse",
        "récapituler",
        "reprendre",
        "reformulation",
      ],
    },
  };

  classify(verbatim: string): { prediction: string; confidence: number } {
    const text = verbatim.toLowerCase().trim();

    if (!text) {
      return { prediction: "AUTRE", confidence: 0 };
    }

    // Calcul des scores pour chaque catégorie
    const scores: Record<string, number> = {
      ENGAGEMENT: this.calculateScore(text, this.dictionnaires.ENGAGEMENT),
      OUVERTURE: this.calculateScore(text, this.dictionnaires.OUVERTURE),
      EXPLICATION: this.calculateScore(text, this.dictionnaires.EXPLICATION),
      REFLET: this.calculateScore(text, this.dictionnaires.REFLET),
    };

    // Trouver le score maximum
    const maxScore = Math.max(...Object.values(scores));
    const prediction =
      Object.keys(scores).find((key) => scores[key] === maxScore) || "AUTRE";

    // Définir seuils avec index signature
    const seuils: Record<string, number> = {
      ENGAGEMENT: this.config.seuilEngagement,
      OUVERTURE: this.config.seuilOuverture,
      EXPLICATION: this.config.seuilExplication,
      REFLET: this.config.seuilReflet,
    };

    if (maxScore < (seuils[prediction] || 0)) {
      return { prediction: "AUTRE", confidence: 1 - maxScore };
    }

    return { prediction, confidence: maxScore };
  }

  private calculateScore(
    text: string,
    dictionary: { expressions: string[]; mots: string[] }
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Expressions (poids configurable)
    dictionary.expressions.forEach((expr) => {
      if (text.includes(expr.toLowerCase())) {
        score += this.config.poidsExpressions;
      }
      totalWeight += this.config.poidsExpressions;
    });

    // Mots individuels (poids configurable)
    dictionary.mots.forEach((mot) => {
      const regex = new RegExp(`\\b${mot.toLowerCase()}\\b`, "g");
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * this.config.poidsMots;
      }
      totalWeight += this.config.poidsMots;
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  getParameters(): Record<string, any> {
    return this.config;
  }

  updateParameters(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
