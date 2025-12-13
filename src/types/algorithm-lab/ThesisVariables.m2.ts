/**
 * @fileoverview Types M2 (Alignement linguistique)
 * - M2Details : compatibilité existante (metadata.m2)
 * - M2Scores / M2DetailsExtended : JSONB analysis_pairs (m2_scores, m2_details)
 */

import type {} from "./ThesisVariables";

// ========================================================================
// Extension existante (compatibilité metadata.m2)
// ========================================================================
declare module "./ThesisVariables" {
  interface M2Details {
    score: number; // [0-1], ex. similarité/alignement
    tokenOverlap?: number; // Jaccard lexical simple
    semanticSimilarity?: number; // cosine embeddings si dispo plus tard
    prosodicDivergence?: number; // placeholder si features prosodie
    alignedTokens?: Array<{ token: string; inA: boolean; inB: boolean }>;
  }
}

// ========================================================================
// NOUVEAUX TYPES - Structure JSONB pour analysis_pairs
// ========================================================================

/** Scores pragmatiques (binaires) */
export interface M2PragmaticScores {
  /** Client accepte l'action ("D'accord", "OK", "Merci") */
  acceptance: 0 | 1;
  /** Client montre qu'il comprend ("Je vois", "Ah ok") */
  comprehension: 0 | 1;
  /** Client fournit l'info demandée */
  cooperation: 0 | 1;
}

/** Structure complète des scores M2 (JSONB m2_scores) */
export interface M2Scores {
  /** Alignement lexical - Jaccard sur lemmes (0-1) */
  lexical: number;
  /** Alignement sémantique - Cosine embeddings (0-1) */
  semantic: number;
  /** Répétition des verbes d'action du conseiller (0-1) */
  verb_repetition: number;
  /** Scores pragmatiques (binaires) */
  pragmatic: M2PragmaticScores;
  /** Score global agrégé (0-1) */
  global: number;
}

/** Détails M2 pour debug/analyse (JSONB m2_details) */
export interface M2DetailsExtended {
  /** Lemmes partagés entre conseiller et client */
  shared_lemmas?: string[];
  /** Patterns pragmatiques détectés (ex: "ACTION_ANNOUNCED → ACCEPTANCE") */
  pragmatic_patterns?: string[];
  /** Verbes d'action utilisés par le conseiller */
  conseiller_verbs?: string[];
  /** Marqueurs linguistiques du client */
  client_markers?: string[];
}

// ========================================================================
// Configuration des dimensions pour l'UI
// ========================================================================

/** Dimension M2 individuelle pour affichage */
export type M2Dimension = 
  | 'lexical' 
  | 'semantic' 
  | 'verb_repetition' 
  | 'pragmatic.acceptance' 
  | 'pragmatic.comprehension' 
  | 'pragmatic.cooperation'
  | 'global';

/** Configuration d'une dimension M2 */
export interface M2DimensionConfig {
  key: M2Dimension;
  label: string;
  type: 'continuous' | 'binary';
  description: string;
}

/** Liste des dimensions M2 avec métadonnées */
export const M2_DIMENSIONS: M2DimensionConfig[] = [
  { key: 'lexical', label: 'Lexical', type: 'continuous', description: 'Jaccard lemmes' },
  { key: 'semantic', label: 'Sémantique', type: 'continuous', description: 'Cosine embeddings' },
  { key: 'verb_repetition', label: 'Verbes', type: 'continuous', description: 'Répétition verbes action' },
  { key: 'pragmatic.acceptance', label: 'Accept.', type: 'binary', description: 'Acceptation' },
  { key: 'pragmatic.comprehension', label: 'Compr.', type: 'binary', description: 'Compréhension' },
  { key: 'pragmatic.cooperation', label: 'Coop.', type: 'binary', description: 'Coopération' },
  { key: 'global', label: 'Global', type: 'continuous', description: 'Score agrégé' },
];
