// src/app/(protected)/analysis/components/AlgorithmLab/types/h2Types.ts
// Types étendus pour supporter les métadonnées H2

import type { TVMetadataCore } from "./core";

/**
 * Extension de TVMetadataCore pour inclure les champs H2
 * Ces champs sont utilisés pour stocker et récupérer les résultats
 * des algorithmes depuis la table h2_analysis_pairs
 */
export interface TVMetadataH2 extends TVMetadataCore {
  // Référence à la paire H2
  pairId?: number;
  
  // Métadonnées M1 (densité de verbes)
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  
  // Métadonnées M2 (alignement)
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // Métadonnées M3 (charge cognitive)
  m3_hesitation_count?: number;
  m3_clarification_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
}

/**
 * Type guard pour vérifier si metadata a les propriétés H2
 */
export function isH2Metadata(metadata: any): metadata is TVMetadataH2 {
  return metadata && typeof metadata === 'object';
}

/**
 * Helper pour accéder en toute sécurité aux propriétés H2
 */
export function getH2Property<K extends keyof TVMetadataH2>(
  metadata: TVMetadataCore | Record<string, unknown> | undefined,
  key: K
): TVMetadataH2[K] | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  return (metadata as any)[key];
}
