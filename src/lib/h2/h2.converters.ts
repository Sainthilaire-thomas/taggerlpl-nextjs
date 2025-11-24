/**
 * Fonctions de conversion BDD â†’ EntitÃ©s mÃ©tier H2
 * 
 * Transforme les rows Supabase en objets mÃ©tier typÃ©s et validÃ©s
 */

import type {
  H2AnalysisPairRow,
  StrategyReactionPair,
  ConversationalStrategy,
  ClientReaction,
  M1ActionVerbs,
  M2LinguisticAlignment,
  M3CognitiveLoad,
  MediationMechanisms,
  ConversationalContext,
  StrategyFamily,
  ReactionType,
  ConversionOptions,
  H2ConversionResult,
} from '@/types/entities/h2.entities';

// ============================================================================
// VALIDATION ET PARSING
// ============================================================================

/**
 * Valide qu'une famille de stratÃ©gie est valide
 */
function isValidStrategyFamily(family: string | null): family is StrategyFamily {
  return family === 'ENGAGEMENT' || family === 'OUVERTURE' || family === 'EXPLICATION';
}

/**
 * Valide qu'un type de rÃ©action est valide
 */
function isValidReactionType(tag: string): tag is ReactionType {
  return tag === 'CLIENT POSITIF' || tag === 'CLIENT NEGATIF' || tag === 'CLIENT NEUTRE';
}

/**
 * Parse un objet JSON de maniÃ¨re sÃ©curisÃ©e
 */
function safeJsonParse<T>(json: unknown, defaultValue: T): T {
  if (json === null || json === undefined) return defaultValue;
  if (typeof json === 'object') return json as T;
  try {
    return JSON.parse(String(json)) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================================================
// CONVERSION - STRATÃ‰GIE CONVERSATIONNELLE
// ============================================================================

/**
 * Convertit les donnÃ©es de stratÃ©gie d'une row en entitÃ© ConversationalStrategy
 */
function convertToStrategy(row: H2AnalysisPairRow): ConversationalStrategy | null {
  // Validation de base
  if (!row.strategy_family || !isValidStrategyFamily(row.strategy_family)) {
    return null;
  }

  return {
    turnId: row.conseiller_turn_id,
    tag: row.strategy_tag,
    family: row.strategy_family,
    color: row.strategy_color || '#808080',
    verbatim: row.conseiller_verbatim,
    speaker: row.conseiller_speaker || 'CONSEILLER',
    startTime: row.conseiller_start_time,
    endTime: row.conseiller_end_time,
  };
}

// ============================================================================
// CONVERSION - RÃ‰ACTION CLIENT
// ============================================================================

/**
 * Convertit les donnÃ©es de rÃ©action d'une row en entitÃ© ClientReaction
 */
function convertToReaction(row: H2AnalysisPairRow): ClientReaction | null {
  // Validation de base
  if (!isValidReactionType(row.reaction_tag)) {
    return null;
  }

  return {
    turnId: row.client_turn_id,
    tag: row.reaction_tag,
    verbatim: row.client_verbatim,
    speaker: row.client_speaker || 'CLIENT',
    startTime: row.client_start_time,
    endTime: row.client_end_time,
  };
}

// ============================================================================
// CONVERSION - MÃ‰CANISMES DE MÃ‰DIATION
// ============================================================================

/**
 * Convertit les donnÃ©es M1 d'une row en entitÃ© M1ActionVerbs
 */
function convertToM1(row: H2AnalysisPairRow): M1ActionVerbs | null {
  // Si pas de donnÃ©es M1, retourner null
  if (row.m1_verb_density === null || row.m1_verb_density === undefined) {
    return null;
  }

  return {
    totalWords: row.m1_total_words ?? 0,
    verbCount: row.m1_verb_count ?? 0,
    density: row.m1_verb_density,
    actionVerbs: row.m1_action_verbs ?? [],
  };
}

/**
 * Convertit les donnÃ©es M2 d'une row en entitÃ© M2LinguisticAlignment
 */
function convertToM2(row: H2AnalysisPairRow): M2LinguisticAlignment | null {
  // Si pas de donnÃ©es M2, retourner null
  if (row.m2_global_alignment === null || row.m2_global_alignment === undefined) {
    return null;
  }

  return {
    lexicalAlignment: row.m2_lexical_alignment ?? 0,
    semanticAlignment: row.m2_semantic_alignment ?? 0,
    globalAlignment: row.m2_global_alignment,
    sharedTerms: row.m2_shared_terms ?? [],
  };
}

/**
 * Convertit les donnÃ©es M3 d'une row en entitÃ© M3CognitiveLoad
 */
function convertToM3(row: H2AnalysisPairRow): M3CognitiveLoad | null {
  // Si pas de donnÃ©es M3, retourner null
  if (row.m3_cognitive_score === null || row.m3_cognitive_score === undefined) {
    return null;
  }

  // DÃ©terminer le niveau de charge cognitive
  let cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (row.m3_cognitive_load === 'LOW' || row.m3_cognitive_load === 'MEDIUM' || row.m3_cognitive_load === 'HIGH') {
    cognitiveLoad = row.m3_cognitive_load;
  }

  return {
    hesitationCount: row.m3_hesitation_count ?? 0,
    clarificationCount: row.m3_clarification_count ?? 0,
    cognitiveScore: row.m3_cognitive_score,
    cognitiveLoad,
    patterns: safeJsonParse(row.m3_patterns, {}),
  };
}

/**
 * Convertit tous les mÃ©canismes de mÃ©diation
 */
function convertToMediation(row: H2AnalysisPairRow): MediationMechanisms | null {
  const m1 = convertToM1(row);
  const m2 = convertToM2(row);
  const m3 = convertToM3(row);

  // Si aucun mÃ©canisme n'est disponible, retourner null
  if (!m1 && !m2 && !m3) {
    return null;
  }

  // CrÃ©er des valeurs par dÃ©faut pour les mÃ©canismes manquants
  return {
    m1: m1 ?? {
      totalWords: 0,
      verbCount: 0,
      density: 0,
      actionVerbs: [],
    },
    m2: m2 ?? {
      lexicalAlignment: 0,
      semanticAlignment: 0,
      globalAlignment: 0,
      sharedTerms: [],
    },
    m3: m3 ?? {
      hesitationCount: 0,
      clarificationCount: 0,
      cognitiveScore: 0,
      cognitiveLoad: 'LOW',
      patterns: {},
    },
  };
}

// ============================================================================
// CONVERSION - CONTEXTE CONVERSATIONNEL
// ============================================================================

/**
 * Convertit le contexte conversationnel d'une row
 */
function convertToContext(row: H2AnalysisPairRow): ConversationalContext {
  return {
    previous: [
      {
        turnId: row.prev4_turn_id,
        tag: row.prev4_tag,
        verbatim: row.prev4_verbatim,
        speaker: row.prev4_speaker,
        startTime: row.prev4_start_time,
        endTime: row.prev4_end_time,
      },
      {
        turnId: row.prev3_turn_id,
        tag: row.prev3_tag,
        verbatim: row.prev3_verbatim,
        speaker: row.prev3_speaker,
        startTime: row.prev3_start_time,
        endTime: row.prev3_end_time,
      },
      {
        turnId: row.prev2_turn_id,
        tag: row.prev2_tag,
        verbatim: row.prev2_verbatim,
        speaker: row.prev2_speaker,
        startTime: row.prev2_start_time,
        endTime: row.prev2_end_time,
      },
      {
        turnId: row.prev1_turn_id,
        tag: row.prev1_tag,
        verbatim: row.prev1_verbatim,
        speaker: row.prev1_speaker,
        startTime: row.prev1_start_time,
        endTime: row.prev1_end_time,
      },
    ],
    next: [
      {
        turnId: row.next1_turn_id,
        tag: row.next1_tag,
        verbatim: row.next1_verbatim,
        speaker: row.next1_speaker,
        startTime: row.next1_start_time,
        endTime: row.next1_end_time,
      },
      {
        turnId: row.next2_turn_id,
        tag: row.next2_tag,
        verbatim: row.next2_verbatim,
        speaker: row.next2_speaker,
        startTime: row.next2_start_time,
        endTime: row.next2_end_time,
      },
      {
        turnId: row.next3_turn_id,
        tag: row.next3_tag,
        verbatim: row.next3_verbatim,
        speaker: row.next3_speaker,
        startTime: row.next3_start_time,
        endTime: row.next3_end_time,
      },
      {
        turnId: row.next4_turn_id,
        tag: row.next4_tag,
        verbatim: row.next4_verbatim,
        speaker: row.next4_speaker,
        startTime: row.next4_start_time,
        endTime: row.next4_end_time,
      },
    ],
  };
}

// ============================================================================
// CONVERSION PRINCIPALE
// ============================================================================

/**
 * Convertit une row de h2_analysis_pairs en entitÃ© StrategyReactionPair complÃ¨te
 * 
 * @param row - La row depuis Supabase
 * @param options - Options de conversion
 * @returns Le rÃ©sultat de la conversion avec erreurs Ã©ventuelles
 */
export function convertH2RowToPair(
  row: H2AnalysisPairRow,
  options: ConversionOptions = {}
): H2ConversionResult {
  const { includeContext = true, validate = true } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];

  // Conversion de la stratÃ©gie
  const strategy = convertToStrategy(row);
  if (!strategy) {
    errors.push(`Invalid strategy family: ${row.strategy_family}`);
    return { pair: null, errors, warnings };
  }

  // Conversion de la rÃ©action
  const reaction = convertToReaction(row);
  if (!reaction) {
    errors.push(`Invalid reaction type: ${row.reaction_tag}`);
    return { pair: null, errors, warnings };
  }

  // Conversion de la mÃ©diation
  const mediation = convertToMediation(row);
  if (!mediation) {
    warnings.push('No mediation mechanisms available');
  }

  // Conversion du contexte
  const context = includeContext ? convertToContext(row) : {
    previous: [],
    next: [],
  };

  // Validation supplÃ©mentaire si demandÃ©e
  if (validate) {
    // VÃ©rifier la cohÃ©rence temporelle
    if (strategy.startTime >= strategy.endTime) {
      warnings.push(`Invalid strategy time range: ${strategy.startTime} >= ${strategy.endTime}`);
    }
    if (reaction.startTime >= reaction.endTime) {
      warnings.push(`Invalid reaction time range: ${reaction.startTime} >= ${reaction.endTime}`);
    }
    
    // VÃ©rifier l'ordre chronologique
    if (strategy.endTime > reaction.startTime) {
      warnings.push('Strategy ends after reaction starts - possible temporal overlap');
    }
  }

  // Construire l'entitÃ© finale
  const pair: StrategyReactionPair = {
    pairId: row.pair_id,
    pairIndex: row.pair_index,
    callId: row.call_id,
    strategy,
    reaction,
    mediation: mediation ?? {
      m1: { totalWords: 0, verbCount: 0, density: 0, actionVerbs: [] },
      m2: { lexicalAlignment: 0, semanticAlignment: 0, globalAlignment: 0, sharedTerms: [] },
      m3: { hesitationCount: 0, clarificationCount: 0, cognitiveScore: 0, cognitiveLoad: 'LOW', patterns: {} },
    },
    context,
    algorithmVersion: row.algorithm_version,
    computationStatus: row.computation_status,
    computedAt: row.computed_at,
    annotations: safeJsonParse(row.annotations, {}),
    versionMetadata: safeJsonParse(row.version_metadata, null),
  };

  return { pair, errors, warnings };
}

/**
 * Convertit plusieurs rows en entitÃ©s
 */
export function convertH2RowsToPairs(
  rows: H2AnalysisPairRow[],
  options: ConversionOptions = {}
): {
  pairs: StrategyReactionPair[];
  errors: Array<{ rowIndex: number; errors: string[] }>;
  warnings: Array<{ rowIndex: number; warnings: string[] }>;
} {
  const pairs: StrategyReactionPair[] = [];
  const allErrors: Array<{ rowIndex: number; errors: string[] }> = [];
  const allWarnings: Array<{ rowIndex: number; warnings: string[] }> = [];

  rows.forEach((row, index) => {
    const result = convertH2RowToPair(row, options);
    
    if (result.pair) {
      pairs.push(result.pair);
    }
    
    if (result.errors.length > 0) {
      allErrors.push({ rowIndex: index, errors: result.errors });
    }
    
    if (result.warnings.length > 0) {
      allWarnings.push({ rowIndex: index, warnings: result.warnings });
    }
  });

  return {
    pairs,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// HELPERS POUR FILTRAGE
// ============================================================================

/**
 * Filtre les paires selon des critÃ¨res mÃ©tier
 */
export function filterPairs(
  pairs: StrategyReactionPair[],
  filter: {
    strategyFamilies?: StrategyFamily[];
    reactionTypes?: ReactionType[];
    hasMediation?: boolean;
    computationComplete?: boolean;
  }
): StrategyReactionPair[] {
  return pairs.filter(pair => {
    // Filtrer par famille de stratÃ©gie
    if (filter.strategyFamilies && filter.strategyFamilies.length > 0) {
      if (!filter.strategyFamilies.includes(pair.strategy.family)) {
        return false;
      }
    }

    // Filtrer par type de rÃ©action
    if (filter.reactionTypes && filter.reactionTypes.length > 0) {
      if (!filter.reactionTypes.includes(pair.reaction.tag)) {
        return false;
      }
    }

    // Filtrer par prÃ©sence de mÃ©diation
    if (filter.hasMediation !== undefined) {
      const hasMediation = pair.mediation.m1.density > 0 || 
                          pair.mediation.m2.globalAlignment > 0 || 
                          pair.mediation.m3.cognitiveScore > 0;
      if (hasMediation !== filter.hasMediation) {
        return false;
      }
    }

    // Filtrer par statut de calcul
    if (filter.computationComplete !== undefined) {
      const isComplete = pair.computationStatus === 'completed';
      if (isComplete !== filter.computationComplete) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Groupe les paires par critÃ¨re
 */
export function groupPairs<K extends string>(
  pairs: StrategyReactionPair[],
  keyFn: (pair: StrategyReactionPair) => K
): Record<K, StrategyReactionPair[]> {
  return pairs.reduce((acc, pair) => {
    const key = keyFn(pair);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(pair);
    return acc;
  }, {} as Record<K, StrategyReactionPair[]>);
}

/**
 * Groupe par famille de stratÃ©gie
 */
export function groupByStrategy(pairs: StrategyReactionPair[]): Record<StrategyFamily, StrategyReactionPair[]> {
  return groupPairs(pairs, p => p.strategy.family);
}

/**
 * Groupe par type de rÃ©action
 */
export function groupByReaction(pairs: StrategyReactionPair[]): Record<ReactionType, StrategyReactionPair[]> {
  return groupPairs(pairs, p => p.reaction.tag);
}

/**
 * Groupe par call_id
 */
export function groupByCall(pairs: StrategyReactionPair[]): Record<string, StrategyReactionPair[]> {
  return groupPairs(pairs, p => p.callId);
}
