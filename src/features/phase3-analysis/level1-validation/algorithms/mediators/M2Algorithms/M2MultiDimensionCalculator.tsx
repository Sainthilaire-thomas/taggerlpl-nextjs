// algorithms/level1/M2Algorithms/M2MultiDimensionCalculator.ts
/**
 * @fileoverview M2 Multi-Dimension Calculator
 * Calcule les 6 dimensions d'alignement linguistique :
 * - lexical : Jaccard sur lemmes
 * - semantic : Cosine embeddings (placeholder)
 * - verb_repetition : Verbes d'action repris
 * - pragmatic.acceptance : "D'accord", "OK", "Merci"
 * - pragmatic.comprehension : "Je vois", "Ah ok"
 * - pragmatic.cooperation : Client fournit l'info demandée
 */

import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";
import type { M2Input } from "@/types/algorithm-lab";
import type { M2Scores, M2DetailsExtended } from "@/types/algorithm-lab";
import { tokenize, jaccard, shared, normalize } from "./shared/m2-utils";

// ========================================================================
// CONFIGURATION
// ========================================================================

interface M2MultiDimConfig {
  // Poids pour le score global
  weights: {
    lexical: number;
    semantic: number;
    verb_repetition: number;
    pragmatic_acceptance: number;
    pragmatic_comprehension: number;
    pragmatic_cooperation: number;
  };
}

const DEFAULT_CONFIG: M2MultiDimConfig = {
  weights: {
    lexical: 0.15,
    semantic: 0.15,
    verb_repetition: 0.20,
    pragmatic_acceptance: 0.20,
    pragmatic_comprehension: 0.15,
    pragmatic_cooperation: 0.15,
  },
};

// ========================================================================
// PATTERNS PRAGMATIQUES
// ========================================================================

/** Patterns d'acceptation du client */
const ACCEPTANCE_PATTERNS = [
  /\b(d'accord|daccord|d accord)\b/i,
  /\b(ok|okay|oui)\b/i,
  /\b(merci|merci beaucoup)\b/i,
  /\b(parfait|super|très bien|tres bien)\b/i,
  /\b(entendu|compris|noté)\b/i,
  /\b(ça marche|ca marche)\b/i,
  /\b(je veux bien|volontiers)\b/i,
  /\b(c'est bon|c est bon)\b/i,
];

/** Patterns de compréhension du client */
const COMPREHENSION_PATTERNS = [
  /\b(je vois|je comprends|ah ok|ah d'accord)\b/i,
  /\b(je saisis|je perçois)\b/i,
  /\b(effectivement|en effet)\b/i,
  /\b(ah oui|ah bon)\b/i,
  /\b(d'accord je comprends)\b/i,
  /\b(ok je vois)\b/i,
];

/** Patterns de coopération (le client fournit de l'info) */
const COOPERATION_PATTERNS = [
  /\b(c'est|c est)\s+.{2,}/i,  // "C'est [quelque chose]"
  /\b(j'ai|j ai)\s+.{2,}/i,    // "J'ai [quelque chose]"
  /\b(je suis)\s+.{2,}/i,      // "Je suis [quelque chose]"
  /\b(mon|ma|mes)\s+\w+/i,     // "Mon numéro", "Ma situation"
  /\b(le|la)\s+\w+\s+(est|c'est)/i,  // "Le problème est..."
  /\b\d{2,}/,                  // Présence de chiffres (numéro, date, etc.)
  /\b(voilà|voici)\b/i,        // "Voilà mon..."
];

/** Liste de verbes d'action courants (infinitifs) */
const ACTION_VERBS = new Set([
  "vérifier", "verifier", "envoyer", "faire", "appeler", "contacter",
  "transmettre", "traiter", "résoudre", "resoudre", "corriger",
  "modifier", "changer", "mettre", "prendre", "donner", "recevoir",
  "confirmer", "valider", "annuler", "créer", "creer", "supprimer",
  "ajouter", "retirer", "enregistrer", "sauvegarder", "télécharger",
  "telecharger", "imprimer", "scanner", "signer", "remplir",
  "compléter", "completer", "finaliser", "terminer", "commencer",
  "lancer", "arrêter", "arreter", "reprendre", "continuer",
  "attendre", "patienter", "rappeler", "recontacter", "noter",
  "regarder", "consulter", "accéder", "acceder", "ouvrir", "fermer",
  "cliquer", "sélectionner", "selectionner", "choisir", "trouver",
]);

// ========================================================================
// CLASSE PRINCIPALE
// ========================================================================

export class M2MultiDimensionCalculator implements UniversalAlgorithm {
  private config: M2MultiDimConfig;

  constructor(config?: Partial<M2MultiDimConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_CONFIG.weights,
        ...config?.weights,
      },
    };
  }

  // ========================================================================
  // INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "M2MultiDimension",
      displayName: "M2 — Multi-Dimensions (6 dimensions)",
      version: "1.0.0",
      type: "rule-based",
      target: "M2",
      batchSupported: true,
      requiresContext: true,
      description:
        "Calcule 6 dimensions d'alignement : lexical, sémantique, répétition verbes, acceptance, compréhension, coopération.",
      examples: [
        {
          input: {
            t0: "Je vais vérifier votre dossier",
            t1: "D'accord, merci",
          },
          output: { 
            prediction: "ALIGNEMENT_FORT", 
            confidence: 0.75,
          },
          note: "Acceptance détectée",
        },
      ],
    };
  }

  validateConfig(): boolean {
    const { weights } = this.config;
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1.0) < 0.01; // Somme des poids ≈ 1
  }

  async run(input: unknown): Promise<UniversalResult> {
    const m2Input = input as M2Input & {
      pairId?: number;
      prev1_turn_verbatim?: string;
      prev2_turn_verbatim?: string;
    };
    const startTime = Date.now();

    try {
      const scores = this.calculateAllDimensions(m2Input);
      const details = this.extractDetails(m2Input, scores);
      
      // Classification basée sur le score global
      const prediction = this.classifyAlignment(scores.global);
      
      return {
        prediction,
        confidence: scores.global,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          inputType: "M2Input",
          executionPath: ["lexical", "semantic", "verb_rep", "pragmatic", "global"],
          pairId: m2Input.pairId,

          // ✅ Structure JSONB pour analysis_pairs
          dbColumns: {
            m2_scores: scores,
            m2_details: details,
            m2_global_alignment: scores.global,
            m2_lexical_alignment: scores.lexical,
            m2_semantic_alignment: scores.semantic,
            computation_status: 'complete',
          },

          // Contexte UI
          prev2_turn_verbatim: m2Input.prev2_turn_verbatim,
          prev1_turn_verbatim: m2Input.prev1_turn_verbatim,
          next_turn_verbatim: m2Input.t1,
          
          // Pour affichage dans extraColumns
          m2_scores: scores,
          m2_details: details,
          
          classifier: "M2MultiDimension",
        },
      };
    } catch (e: any) {
      const emptyScores: M2Scores = {
        lexical: 0,
        semantic: 0,
        verb_repetition: 0,
        pragmatic: { acceptance: 0, comprehension: 0, cooperation: 0 },
        global: 0,
      };
      
      return {
        prediction: "DESALIGNEMENT",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          error: String(e?.message ?? e),
          m2_scores: emptyScores,
        },
      };
    }
  }

  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }

  // ========================================================================
  // CALCULS DES DIMENSIONS
  // ========================================================================

  private calculateAllDimensions(input: M2Input): M2Scores {
    const t0 = input.t0 || "";
    const t1 = input.t1 || "";

    // 1. Lexical (Jaccard)
    const lexical = this.calculateLexical(t0, t1);

    // 2. Semantic (placeholder - à implémenter avec embeddings)
    const semantic = this.calculateSemantic(t0, t1);

    // 3. Verb repetition
    const verb_repetition = this.calculateVerbRepetition(t0, t1);

    // 4. Pragmatic dimensions
    const pragmatic = this.calculatePragmatic(t0, t1);

    // 5. Score global pondéré
    const global = this.calculateGlobal({
      lexical,
      semantic,
      verb_repetition,
      pragmatic,
    });

    return {
      lexical,
      semantic,
      verb_repetition,
      pragmatic,
      global,
    };
  }

  /**
   * Dimension 1: Alignement lexical (Jaccard sur lemmes)
   */
  private calculateLexical(t0: string, t1: string): number {
    const tokensT0 = new Set(tokenize(t0));
    const tokensT1 = new Set(tokenize(t1));
    return jaccard(tokensT0, tokensT1);
  }

  /**
   * Dimension 2: Alignement sémantique
   * TODO: Implémenter avec embeddings (pour l'instant approximation)
   */
  private calculateSemantic(t0: string, t1: string): number {
    // Approximation simple : lexical + bonus si mêmes champs sémantiques
    const lexical = this.calculateLexical(t0, t1);
    
    // Bonus si mots de la même famille détectés
    const t0Norm = normalize(t0);
    const t1Norm = normalize(t1);
    
    // Chercher des racines communes (approximation lemmatisation)
    const roots0 = this.extractRoots(t0Norm);
    const roots1 = this.extractRoots(t1Norm);
    
    let rootOverlap = 0;
    for (const r of roots0) {
      if (roots1.has(r)) rootOverlap++;
    }
    
    const rootScore = roots0.size > 0 ? rootOverlap / roots0.size : 0;
    
    // Moyenne pondérée
    return Math.min(1, lexical * 0.5 + rootScore * 0.5);
  }

  /**
   * Extrait des "racines" simplifiées (premiers 4-5 caractères des mots longs)
   */
  private extractRoots(text: string): Set<string> {
    const words = text.split(/\s+/).filter(w => w.length > 4);
    return new Set(words.map(w => w.slice(0, Math.min(5, w.length - 1))));
  }

  /**
   * Dimension 3: Répétition des verbes d'action
   */
  private calculateVerbRepetition(t0: string, t1: string): number {
    const t0Norm = normalize(t0);
    const t1Norm = normalize(t1);
    
    // Trouver les verbes d'action dans T0 (conseiller)
    const verbsInT0: string[] = [];
    for (const verb of ACTION_VERBS) {
      if (t0Norm.includes(verb)) {
        verbsInT0.push(verb);
      }
    }
    
    if (verbsInT0.length === 0) return 0;
    
    // Compter combien sont repris dans T1 (client)
    let reprisCount = 0;
    for (const verb of verbsInT0) {
      // Chercher le verbe ou ses variantes conjuguées
      const root = verb.slice(0, Math.min(5, verb.length - 2));
      if (t1Norm.includes(root)) {
        reprisCount++;
      }
    }
    
    return reprisCount / verbsInT0.length;
  }

  /**
   * Dimensions 4-6: Pragmatiques (binaires)
   */
  private calculatePragmatic(t0: string, t1: string): M2Scores["pragmatic"] {
    const t1Norm = normalize(t1);
    
    // Acceptance
    const acceptance = ACCEPTANCE_PATTERNS.some(p => p.test(t1Norm)) ? 1 : 0;
    
    // Comprehension
    const comprehension = COMPREHENSION_PATTERNS.some(p => p.test(t1Norm)) ? 1 : 0;
    
    // Cooperation (client fournit info demandée)
    // Plus complexe : on vérifie si T0 est une question et T1 une réponse informative
    const t0IsQuestion = /\?|avez.vous|pouvez.vous|quel|quelle|combien/i.test(t0);
    const t1HasInfo = COOPERATION_PATTERNS.some(p => p.test(t1Norm));
    const cooperation = (t0IsQuestion && t1HasInfo) ? 1 : 0;
    
    return {
      acceptance: acceptance as 0 | 1,
      comprehension: comprehension as 0 | 1,
      cooperation: cooperation as 0 | 1,
    };
  }

  /**
   * Score global pondéré
   */
  private calculateGlobal(scores: Omit<M2Scores, "global">): number {
    const { weights } = this.config;
    
    const pragmaticScore = (
      scores.pragmatic.acceptance * weights.pragmatic_acceptance +
      scores.pragmatic.comprehension * weights.pragmatic_comprehension +
      scores.pragmatic.cooperation * weights.pragmatic_cooperation
    );
    
    const continuousScore = (
      scores.lexical * weights.lexical +
      scores.semantic * weights.semantic +
      scores.verb_repetition * weights.verb_repetition
    );
    
    return Math.min(1, continuousScore + pragmaticScore);
  }

  /**
   * Classification basée sur le score global
   */
  private classifyAlignment(globalScore: number): string {
    if (globalScore >= 0.6) return "ALIGNEMENT_FORT";
    if (globalScore >= 0.3) return "ALIGNEMENT_FAIBLE";
    return "DESALIGNEMENT";
  }

  /**
   * Extrait les détails pour m2_details
   */
  private extractDetails(input: M2Input, scores: M2Scores): M2DetailsExtended {
    const t0 = input.t0 || "";
    const t1 = input.t1 || "";
    const t0Norm = normalize(t0);
    const t1Norm = normalize(t1);
    
    // Lemmes partagés
    const tokensT0 = new Set(tokenize(t0));
    const tokensT1 = new Set(tokenize(t1));
    const shared_lemmas = shared(tokensT0, tokensT1);
    
    // Verbes d'action du conseiller
    const conseiller_verbs: string[] = [];
    for (const verb of ACTION_VERBS) {
      if (t0Norm.includes(verb)) {
        conseiller_verbs.push(verb);
      }
    }
    
    // Marqueurs client détectés
    const client_markers: string[] = [];
    if (scores.pragmatic.acceptance) client_markers.push("ACCEPTANCE");
    if (scores.pragmatic.comprehension) client_markers.push("COMPREHENSION");
    if (scores.pragmatic.cooperation) client_markers.push("COOPERATION");
    
    // Patterns pragmatiques
    const pragmatic_patterns: string[] = [];
    if (conseiller_verbs.length > 0 && scores.pragmatic.acceptance) {
      pragmatic_patterns.push("ACTION_ANNOUNCED → ACCEPTANCE");
    }
    if (/\?/.test(t0) && scores.pragmatic.cooperation) {
      pragmatic_patterns.push("QUESTION → COOPERATION");
    }
    
    return {
      shared_lemmas,
      pragmatic_patterns,
      conseiller_verbs,
      client_markers,
    };
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================

  getInfo() {
    const desc = this.describe();
    return {
      id: desc.name,
      displayName: desc.displayName,
      target: desc.target,
      version: desc.version,
      description: desc.description,
      supportsBatch: desc.batchSupported,
    };
  }
}

export default M2MultiDimensionCalculator;
