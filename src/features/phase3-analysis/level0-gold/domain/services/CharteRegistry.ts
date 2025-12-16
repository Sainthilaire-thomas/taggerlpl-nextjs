// ============================================================================
// CharteRegistry - Définitions des chartes d'annotation
// ============================================================================

import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";

export class CharteRegistry {
  /**
   * Retourne toutes les chartes définies
   */
  static getAllChartes(): CharteDefinition[] {
    return [
      this.getCharteY_A(),
      this.getCharteY_B(),
      this.getCharteY_C(),
      this.getCharteX_A(),
      this.getCharteX_B(),
    ];
  }

  /**
   * Retourne les chartes pour une variable spécifique
   */
  static getChartesForVariable(variable: "X" | "Y"): CharteDefinition[] {
    return this.getAllChartes().filter(c => c.variable === variable);
  }

  /**
   * Retourne une charte par son ID
   */
  static getCharteById(charteId: string): CharteDefinition | undefined {
    return this.getAllChartes().find(c => c.charte_id === charteId);
  }

  // ==========================================================================
  // VARIABLE Y : Réaction Client
  // ==========================================================================

  /**
   * CharteY_A - Minimaliste (3 exemples par catégorie)
   */
  static getCharteY_A(): CharteDefinition {
    return {
      charte_id: "CharteY_A_v1.0.0",
      charte_name: "Charte A - Minimaliste",
      charte_description: "Instructions minimales avec 3 exemples par catégorie",
      variable: "Y",
      definition: {
        categories: {
          CLIENT_POSITIF: {
            description: "Le client exprime un accord ou une satisfaction",
            examples: ["oui", "d'accord", "merci"]
          },
          CLIENT_NEGATIF: {
            description: "Le client exprime un désaccord ou une insatisfaction",
            examples: ["non", "mais", "pas normal"]
          },
          CLIENT_NEUTRE: {
            description: "Le client donne une réponse neutre ou ambiguë",
            examples: ["hm", "mh", "mmh"]
          }
        },
        rules: {
          approach: "few_shot",
          examples_per_category: 3,
          context_included: false
        }
      }
    };
  }

  /**
   * CharteY_B - Enrichie (recommandée, baseline)
   */
  static getCharteY_B(): CharteDefinition {
    return {
      charte_id: "CharteY_B_v1.0.0",
      charte_name: "Charte B - Enrichie",
      charte_description: "d'accord/oui/voilà = POSITIF, seuls hm/mh = NEUTRE",
      variable: "Y",
      is_baseline: true,
      definition: {
        categories: {
          CLIENT_POSITIF: {
            description: "Le client exprime un accord clair ou une satisfaction",
            patterns: [
              "d'accord", "oui", "ouais", "ok", "voilà",
              "merci", "parfait", "très bien", "super", "excellent",
              "ça marche", "entendu", "bien sûr", "tout à fait",
              "c'est bon", "impeccable", "génial", "top"
            ],
            rules: [
              "Les marques d'accord explicites sont toujours POSITIF",
              "Les remerciements sont POSITIF même s'ils sont brefs",
              "Les évaluations positives (super, génial) sont POSITIF"
            ]
          },
          CLIENT_NEGATIF: {
            description: "Le client exprime un désaccord, une contestation ou une insatisfaction",
            patterns: [
              "mais", "non", "pas d'accord", "impossible",
              "pas normal", "inadmissible", "scandaleux",
              "j'hallucine", "vous rigolez", "c'est une blague",
              "c'est pas possible", "ça va pas", "n'importe quoi"
            ],
            rules: [
              "Le mot 'mais' en début de phrase est généralement NEGATIF",
              "Les contestations explicites sont toujours NEGATIF",
              "Les expressions d'indignation sont NEGATIF"
            ]
          },
          CLIENT_NEUTRE: {
            description: "Le client donne une réponse neutre, back-channel minimal, ou ambiguë",
            patterns: ["hm", "mh", "mmh", "euh"],
            rules: [
              "SEULEMENT les back-channels minimaux (hm, mh) sont NEUTRE",
              "Les acquiescements comme 'oui' ou 'd'accord' sont POSITIF, pas NEUTRE",
              "En cas de doute entre POSITIF et NEUTRE, privilégier POSITIF"
            ]
          }
        },
        priority_rules: [
          "Si accord explicite (oui, d'accord, voilà) → POSITIF",
          "Si désaccord explicite (non, mais, pas normal) → NEGATIF",
          "Si back-channel minimal uniquement (hm, mh) → NEUTRE"
        ]
      }
    };
  }

  /**
   * CharteY_C - Binaire (POSITIF vs NON-POSITIF)
   */
  static getCharteY_C(): CharteDefinition {
    return {
      charte_id: "CharteY_C_v1.0.0",
      charte_name: "Charte C - Binaire",
      charte_description: "Simplifié : POSITIF vs NON-POSITIF (NEGATIF + NEUTRE fusionnés)",
      variable: "Y",
      definition: {
        categories: {
          CLIENT_POSITIF: {
            description: "Le client exprime un accord ou une satisfaction explicite",
            examples: ["oui", "d'accord", "merci", "parfait", "ok"]
          },
          CLIENT_NON_POSITIF: {
            description: "Le client n'exprime pas d'accord clair (désaccord, neutre, ambiguë)",
            examples: ["non", "mais", "hm", "mh", "pas normal"]
          }
        },
        rules: {
          approach: "binary",
          examples_per_category: 5,
          context_included: true
        }
      }
    };
  }

  // ==========================================================================
  // VARIABLE X : Stratégie Conseiller
  // ==========================================================================

  /**
   * CharteX_A - Sans contexte (classification isolée)
   */
  static getCharteX_A(): CharteDefinition {
    return {
      charte_id: "CharteX_A_v1.0.0",
      charte_name: "Charte A - Sans contexte",
      charte_description: "Classification basée uniquement sur le tour conseiller, sans contexte",
      variable: "X",
      definition: {
        categories: {
          ENGAGEMENT: {
            description: "Verbes d'action mobilisant le client",
            examples: ["vérifier", "regarder", "envoyer", "cliquer", "consulter"]
          },
          OUVERTURE: {
            description: "Questions ouvertes favorisant l'expression",
            examples: ["que se passe-t-il ?", "qu'en pensez-vous ?", "comment ça se passe ?"]
          },
          EXPLICATION: {
            description: "Apport d'informations factuelles, procédures",
            examples: ["il faut faire ceci", "la procédure est", "voici comment"]
          },
          REFLET_ACQ: {
            description: "Reformulation avec acquiescement",
            examples: ["d'accord", "je comprends", "je vois"]
          },
          REFLET_JE: {
            description: "Reformulation centrée sur l'émotion du conseiller",
            examples: ["je ressens que", "je constate que"]
          },
          REFLET_VOUS: {
            description: "Reformulation centrée sur le client",
            examples: ["vous me dites que", "vous ressentez"]
          }
        },
        rules: {
          approach: "isolated",
          context_included: false
        }
      }
    };
  }

  /**
   * CharteX_B - Avec contexte (héritage tours courts)
   */
  static getCharteX_B(): CharteDefinition {
    return {
      charte_id: "CharteX_B_v1.0.0",
      charte_name: "Charte B - Avec contexte",
      charte_description: "Classification avec contexte conversationnel (prev1 + next1)",
      variable: "X",
      definition: {
        categories: {
          ENGAGEMENT: {
            description: "Verbes d'action mobilisant le client",
            patterns: [
              "vérifier", "regarder", "envoyer", "cliquer", "consulter",
              "pouvez-vous", "pourriez-vous", "je vous invite à"
            ],
            rules: [
              "Les verbes d'action à l'impératif sont ENGAGEMENT",
              "Les formules 'pouvez-vous + verbe' sont ENGAGEMENT"
            ]
          },
          OUVERTURE: {
            description: "Questions ouvertes favorisant l'expression",
            patterns: [
              "que se passe-t-il", "qu'en pensez-vous", "comment",
              "pourquoi", "qu'est-ce qui", "parlez-moi de"
            ],
            rules: [
              "Les questions commençant par 'comment', 'pourquoi', 'que' sont souvent OUVERTURE",
              "Si le tour est très court (<5 mots), hériter du tour précédent si OUVERTURE"
            ]
          },
          EXPLICATION: {
            description: "Apport d'informations factuelles, procédures",
            patterns: [
              "il faut", "vous devez", "la procédure", "en fait",
              "c'est-à-dire", "donc", "parce que"
            ],
            rules: [
              "Les phrases avec 'il faut', 'vous devez' sont EXPLICATION",
              "Les connecteurs logiques (donc, parce que) indiquent EXPLICATION"
            ]
          },
          REFLET_ACQ: {
            description: "Reformulation avec acquiescement",
            examples: ["d'accord", "je comprends", "je vois", "très bien", "ok"]
          },
          REFLET_JE: {
            description: "Reformulation centrée sur l'émotion du conseiller",
            examples: ["je ressens que", "je constate que", "je vois que vous"]
          },
          REFLET_VOUS: {
            description: "Reformulation centrée sur le client",
            examples: ["vous me dites que", "vous ressentez", "vous êtes"]
          }
        },
        priority_rules: [
          "Si verbe d'action direct → ENGAGEMENT",
          "Si question ouverte (comment, pourquoi) → OUVERTURE",
          "Si information factuelle → EXPLICATION",
          "Si reformulation → REFLET_*"
        ],
        rules: {
          approach: "contextual",
          context_included: true
        }
      }
    };
  }
}
