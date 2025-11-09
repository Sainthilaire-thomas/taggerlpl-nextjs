/**
 * Entity types barrel export
 *
 * Import with: import { Call, Tag, TurnTagged, ... } from '@/types/entities'
 */

// Call entities
export * from './call';

// Tag entities
export * from './tag';

// Turn entities
export * from './turn';

// Transcription entities
export * from './transcription';

// H2 analysis entities
// Note: Exporting only H2-specific types to avoid conflicts with tag/turn exports
export type {
  // Types de base H2
  H2AnalysisPairRow,
  
  // Stratégies et réactions
  StrategyFamily,
  ConversationalStrategy,
  ReactionType,
  ClientReaction,
  
  // Mécanismes de médiation
  M1ActionVerbs,
  M2LinguisticAlignment,
  M3CognitiveLoad,
  MediationMechanisms,
  
  // Entité principale
  ConversationalContext,
  StrategyReactionPair,
  
  // Requêtes et filtres
  PairFilter,
  PairsQueryResult,
  
  // Conversion
  ConversionOptions,
  ConversionResult,
  
  // Statistiques
  H2DescriptiveStats,
  ContingencyTable
} from './h2.entities';