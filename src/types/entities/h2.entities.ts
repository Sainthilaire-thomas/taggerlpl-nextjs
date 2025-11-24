/**
 * Types entitÃ©s mÃ©tier pour l'analyse H2
 * 
 * Ces types reprÃ©sentent les concepts du domaine mÃ©tier pour l'hypothÃ¨se H2 :
 * L'efficacitÃ© des stratÃ©gies conversationnelles (ENGAGEMENT, OUVERTURE) 
 * dÃ©pend de trois mÃ©canismes de mÃ©diation (M1, M2, M3).
 */

import { Tables } from '@/types/database.types';

// ============================================================================
// TYPES DE BASE DEPUIS LA BDD
// ============================================================================

/**
 * Type pour une paire stratÃ©gie-rÃ©action depuis la base de donnÃ©es
 */
export type H2AnalysisPairRow = Tables<'h2_analysis_pairs'>;

/**
 * Type pour un turn taguÃ© depuis la base de donnÃ©es
 */
export type TurnTaggedRow = Tables<'turntagged'>;

/**
 * Type pour un tag LPL depuis la base de donnÃ©es
 */
export type LPLTagRow = Tables<'lpltag'>;

// ============================================================================
// ENTITÃ‰S MÃ‰TIER - STRATÃ‰GIES CONVERSATIONNELLES
// ============================================================================

/**
 * Familles de stratÃ©gies conversationnelles Ã©tudiÃ©es dans H2
 */
export type StrategyFamily = 'ENGAGEMENT' | 'OUVERTURE' | 'EXPLICATION' | 'REFLET';

/**
 * ReprÃ©sente une stratÃ©gie conversationnelle utilisÃ©e par le conseiller
 */
export interface ConversationalStrategy {
  /** ID unique du turn */
  turnId: number;
  
  /** Tag de la stratÃ©gie (ex: "ENGAGEMENT POSITIF") */
  tag: string;
  
  /** Famille de la stratÃ©gie */
  family: StrategyFamily;
  
  /** Couleur d'affichage du tag */
  color: string;
  
  /** Verbatim du conseiller */
  verbatim: string;
  
  /** Locuteur (normalement "CONSEILLER") */
  speaker: string;
  
  /** Temps de dÃ©but (en secondes) */
  startTime: number;
  
  /** Temps de fin (en secondes) */
  endTime: number;
}

// ============================================================================
// ENTITÃ‰S MÃ‰TIER - RÃ‰ACTIONS CLIENTS
// ============================================================================

/**
 * Types de rÃ©actions clients possibles
 */
export type ReactionType = 'CLIENT POSITIF' | 'CLIENT NEGATIF' | 'CLIENT NEUTRE';

/**
 * ReprÃ©sente la rÃ©action du client suite Ã  une stratÃ©gie
 */
export interface ClientReaction {
  /** ID unique du turn */
  turnId: number;
  
  /** Tag de la rÃ©action */
  tag: ReactionType;
  
  /** Verbatim du client */
  verbatim: string;
  
  /** Locuteur (normalement "CLIENT") */
  speaker: string;
  
  /** Temps de dÃ©but (en secondes) */
  startTime: number;
  
  /** Temps de fin (en secondes) */
  endTime: number;
}

// ============================================================================
// ENTITÃ‰S MÃ‰TIER - MÃ‰CANISMES DE MÃ‰DIATION
// ============================================================================

/**
 * M1 : DensitÃ© de verbes d'action dans la stratÃ©gie du conseiller
 * HypothÃ¨se : Les stratÃ©gies avec plus de verbes d'action sont plus efficaces
 */
export interface M1ActionVerbs {
  /** Nombre total de mots dans le verbatim */
  totalWords: number;
  
  /** Nombre de verbes d'action identifiÃ©s */
  verbCount: number;
  
  /** DensitÃ© = verbCount / totalWords */
  density: number;
  
  /** Liste des verbes d'action trouvÃ©s */
  actionVerbs: string[];
}

/**
 * M2 : Alignement linguistique entre conseiller et client
 * HypothÃ¨se : Plus d'alignement = meilleure rÃ©ception
 */
export interface M2LinguisticAlignment {
  /** Alignement lexical (mots communs) */
  lexicalAlignment: number;
  
  /** Alignement sÃ©mantique (concepts similaires) */
  semanticAlignment: number;
  
  /** Score global d'alignement */
  globalAlignment: number;
  
  /** Termes partagÃ©s entre conseiller et client */
  sharedTerms: string[];
}

/**
 * M3 : Charge cognitive (pauses et hÃ©sitations du conseiller)
 * HypothÃ¨se : Moins de pauses = message plus fluide = meilleure rÃ©ception
 */
export interface M3CognitiveLoad {
  /** Nombre de pauses/hÃ©sitations dÃ©tectÃ©es */
  hesitationCount: number;
  
  /** Nombre de clarifications nÃ©cessaires */
  clarificationCount: number;
  
  /** Score de charge cognitive (0-10, plus = pire) */
  cognitiveScore: number;
  
  /** Niveau de charge : "LOW", "MEDIUM", "HIGH" */
  cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  
  /** Patterns dÃ©tectÃ©s (pauses, euh, hÃ©sitations...) */
  patterns: Record<string, unknown>;
}

/**
 * Ensemble complet des trois mÃ©canismes de mÃ©diation
 */
export interface MediationMechanisms {
  m1: M1ActionVerbs;
  m2: M2LinguisticAlignment;
  m3: M3CognitiveLoad;
}

// ============================================================================
// ENTITÃ‰ PRINCIPALE - PAIRE STRATÃ‰GIE-RÃ‰ACTION
// ============================================================================

/**
 * Contexte conversationnel autour de la paire
 * Permet d'analyser l'effet des turns prÃ©cÃ©dents et suivants
 */
export interface ConversationalContext {
  /** Turns prÃ©cÃ©dents (prev1 = juste avant conseiller) */
  previous: Array<{
    turnId: number | null;
    tag: string | null;
    verbatim: string | null;
    speaker: string | null;
    startTime: number | null;
    endTime: number | null;
  }>;
  
  /** Turns suivants (next1 = juste aprÃ¨s client) */
  next: Array<{
    turnId: number | null;
    tag: string | null;
    verbatim: string | null;
    speaker: string | null;
    startTime: number | null;
    endTime: number | null;
  }>;
}

/**
 * Une paire stratÃ©gie-rÃ©action complÃ¨te avec tous ses mÃ©canismes
 * 
 * ReprÃ©sente l'unitÃ© d'analyse fondamentale de H2 :
 * - Le conseiller utilise une stratÃ©gie (ENGAGEMENT/OUVERTURE/EXPLICATION)
 * - Le client rÃ©agit (POSITIF/NEGATIF/NEUTRE)
 * - On mesure M1, M2, M3 pour comprendre pourquoi
 */
export interface StrategyReactionPair {
  /** ID unique de la paire */
  pairId: number;
  
  /** Index de la paire dans l'appel (ordre chronologique) */
  pairIndex: number;
  
  /** ID de l'appel */
  callId: string;
  
  /** La stratÃ©gie du conseiller */
  strategy: ConversationalStrategy;
  
  /** La rÃ©action du client */
  reaction: ClientReaction;
  
  /** Les trois mÃ©canismes de mÃ©diation */
  mediation: MediationMechanisms;
  
  /** Contexte conversationnel (turns avant/aprÃ¨s) */
  context: ConversationalContext;
  
  /** Version de l'algorithme utilisÃ© pour calculer M1/M2/M3 */
  algorithmVersion: string | null;
  
  /** Statut du calcul : "pending", "completed", "error" */
  computationStatus: string | null;
  
  /** Date de calcul */
  computedAt: string | null;
  
  /** Annotations manuelles Ã©ventuelles */
  annotations: Record<string, unknown>;
  
  /** MÃ©tadonnÃ©es de version */
  versionMetadata: Record<string, unknown> | null;
}

// ============================================================================
// TYPES POUR LES REQUÃŠTES ET FILTRES
// ============================================================================

/**
 * Filtre pour rÃ©cupÃ©rer des paires selon des critÃ¨res
 */
export interface PairFilter {
  /** Filtrer par ID d'appel */
  callIds?: string[];
  
  /** Filtrer par famille de stratÃ©gie */
  strategyFamilies?: StrategyFamily[];
  
  /** Filtrer par type de rÃ©action */
  reactionTypes?: ReactionType[];
  
  /** Filtrer par statut de calcul */
  computationStatus?: string[];
  
  /** Limite de rÃ©sultats */
  limit?: number;
  
  /** Offset pour pagination */
  offset?: number;
}

/**
 * RÃ©sultat d'une requÃªte de paires
 */
export interface PairsQueryResult {
  /** Les paires trouvÃ©es */
  pairs: StrategyReactionPair[];
  
  /** Nombre total de paires (sans limite) */
  totalCount: number;
  
  /** Statistiques rapides */
  stats: {
    byStrategy: Record<StrategyFamily, number>;
    byReaction: Record<ReactionType, number>;
    computationComplete: number;
    computationPending: number;
  };
}

// ============================================================================
// TYPES POUR LA CONVERSION BDD -> ENTITÃ‰S MÃ‰TIER
// ============================================================================

/**
 * Options pour la conversion d'une row BDD en entitÃ© mÃ©tier
 */
export interface ConversionOptions {
  /** Inclure le contexte conversationnel ? */
  includeContext?: boolean;
  
  /** Valider les donnÃ©es ? */
  validate?: boolean;
  
  /** Enrichir avec des donnÃ©es supplÃ©mentaires ? */
  enrich?: boolean;
}

/**
 * RÃ©sultat de la conversion
 */
export interface H2ConversionResult {
  /** L'entitÃ© convertie */
  pair: StrategyReactionPair | null;
  
  /** Erreurs Ã©ventuelles */
  errors: string[];
  
  /** Avertissements */
  warnings: string[];
}

// ============================================================================
// TYPES POUR L'ANALYSE STATISTIQUE
// ============================================================================

/**
 * Statistiques descriptives sur un ensemble de paires
 */
export interface H2DescriptiveStats {
  /** Nombre total de paires */
  n: number;
  
  /** Distribution des stratÃ©gies */
  strategyDistribution: Record<StrategyFamily, number>;
  
  /** Distribution des rÃ©actions */
  reactionDistribution: Record<ReactionType, number>;
  
  /** Statistiques M1 */
  m1Stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    sd: number;
  };
  
  /** Statistiques M2 */
  m2Stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    sd: number;
  };
  
  /** Statistiques M3 */
  m3Stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    sd: number;
  };
}

/**
 * Table de contingence stratÃ©gie Ã— rÃ©action
 */
export interface ContingencyTable {
  /** Lignes = stratÃ©gies, colonnes = rÃ©actions */
  table: Record<StrategyFamily, Record<ReactionType, number>>;
  
  /** Totaux par ligne */
  rowTotals: Record<StrategyFamily, number>;
  
  /** Totaux par colonne */
  colTotals: Record<ReactionType, number>;
  
  /** Total gÃ©nÃ©ral */
  grandTotal: number;
}
