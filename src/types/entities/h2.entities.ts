/**
 * Types entités métier pour l'analyse H2
 * 
 * Ces types représentent les concepts du domaine métier pour l'hypothèse H2 :
 * L'efficacité des stratégies conversationnelles (ENGAGEMENT, OUVERTURE) 
 * dépend de trois mécanismes de médiation (M1, M2, M3).
 */

import { Tables } from '@/types/database.types';

// ============================================================================
// TYPES DE BASE DEPUIS LA BDD
// ============================================================================

/**
 * Type pour une paire stratégie-réaction depuis la base de données
 */
export type H2AnalysisPairRow = Tables<'h2_analysis_pairs'>;

/**
 * Type pour un turn tagué depuis la base de données
 */
export type TurnTaggedRow = Tables<'turntagged'>;

/**
 * Type pour un tag LPL depuis la base de données
 */
export type LPLTagRow = Tables<'lpltag'>;

// ============================================================================
// ENTITÉS MÉTIER - STRATÉGIES CONVERSATIONNELLES
// ============================================================================

/**
 * Familles de stratégies conversationnelles étudiées dans H2
 */
export type StrategyFamily = 'ENGAGEMENT' | 'OUVERTURE' | 'EXPLICATION' | 'REFLET';

/**
 * Représente une stratégie conversationnelle utilisée par le conseiller
 */
export interface ConversationalStrategy {
  /** ID unique du turn */
  turnId: number;
  
  /** Tag de la stratégie (ex: "ENGAGEMENT POSITIF") */
  tag: string;
  
  /** Famille de la stratégie */
  family: StrategyFamily;
  
  /** Couleur d'affichage du tag */
  color: string;
  
  /** Verbatim du conseiller */
  verbatim: string;
  
  /** Locuteur (normalement "CONSEILLER") */
  speaker: string;
  
  /** Temps de début (en secondes) */
  startTime: number;
  
  /** Temps de fin (en secondes) */
  endTime: number;
}

// ============================================================================
// ENTITÉS MÉTIER - RÉACTIONS CLIENTS
// ============================================================================

/**
 * Types de réactions clients possibles
 */
export type ReactionType = 'CLIENT POSITIF' | 'CLIENT NEGATIF' | 'CLIENT NEUTRE';

/**
 * Représente la réaction du client suite à une stratégie
 */
export interface ClientReaction {
  /** ID unique du turn */
  turnId: number;
  
  /** Tag de la réaction */
  tag: ReactionType;
  
  /** Verbatim du client */
  verbatim: string;
  
  /** Locuteur (normalement "CLIENT") */
  speaker: string;
  
  /** Temps de début (en secondes) */
  startTime: number;
  
  /** Temps de fin (en secondes) */
  endTime: number;
}

// ============================================================================
// ENTITÉS MÉTIER - MÉCANISMES DE MÉDIATION
// ============================================================================

/**
 * M1 : Densité de verbes d'action dans la stratégie du conseiller
 * Hypothèse : Les stratégies avec plus de verbes d'action sont plus efficaces
 */
export interface M1ActionVerbs {
  /** Nombre total de mots dans le verbatim */
  totalWords: number;
  
  /** Nombre de verbes d'action identifiés */
  verbCount: number;
  
  /** Densité = verbCount / totalWords */
  density: number;
  
  /** Liste des verbes d'action trouvés */
  actionVerbs: string[];
}

/**
 * M2 : Alignement linguistique entre conseiller et client
 * Hypothèse : Plus d'alignement = meilleure réception
 */
export interface M2LinguisticAlignment {
  /** Alignement lexical (mots communs) */
  lexicalAlignment: number;
  
  /** Alignement sémantique (concepts similaires) */
  semanticAlignment: number;
  
  /** Score global d'alignement */
  globalAlignment: number;
  
  /** Termes partagés entre conseiller et client */
  sharedTerms: string[];
}

/**
 * M3 : Charge cognitive (pauses et hésitations du conseiller)
 * Hypothèse : Moins de pauses = message plus fluide = meilleure réception
 */
export interface M3CognitiveLoad {
  /** Nombre de pauses/hésitations détectées */
  hesitationCount: number;
  
  /** Nombre de clarifications nécessaires */
  clarificationCount: number;
  
  /** Score de charge cognitive (0-10, plus = pire) */
  cognitiveScore: number;
  
  /** Niveau de charge : "LOW", "MEDIUM", "HIGH" */
  cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  
  /** Patterns détectés (pauses, euh, hésitations...) */
  patterns: Record<string, unknown>;
}

/**
 * Ensemble complet des trois mécanismes de médiation
 */
export interface MediationMechanisms {
  m1: M1ActionVerbs;
  m2: M2LinguisticAlignment;
  m3: M3CognitiveLoad;
}

// ============================================================================
// ENTITÉ PRINCIPALE - PAIRE STRATÉGIE-RÉACTION
// ============================================================================

/**
 * Contexte conversationnel autour de la paire
 * Permet d'analyser l'effet des turns précédents et suivants
 */
export interface ConversationalContext {
  /** Turns précédents (prev1 = juste avant conseiller) */
  previous: Array<{
    turnId: number | null;
    tag: string | null;
    verbatim: string | null;
    speaker: string | null;
    startTime: number | null;
    endTime: number | null;
  }>;
  
  /** Turns suivants (next1 = juste après client) */
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
 * Une paire stratégie-réaction complète avec tous ses mécanismes
 * 
 * Représente l'unité d'analyse fondamentale de H2 :
 * - Le conseiller utilise une stratégie (ENGAGEMENT/OUVERTURE/EXPLICATION)
 * - Le client réagit (POSITIF/NEGATIF/NEUTRE)
 * - On mesure M1, M2, M3 pour comprendre pourquoi
 */
export interface StrategyReactionPair {
  /** ID unique de la paire */
  pairId: number;
  
  /** Index de la paire dans l'appel (ordre chronologique) */
  pairIndex: number;
  
  /** ID de l'appel */
  callId: string;
  
  /** La stratégie du conseiller */
  strategy: ConversationalStrategy;
  
  /** La réaction du client */
  reaction: ClientReaction;
  
  /** Les trois mécanismes de médiation */
  mediation: MediationMechanisms;
  
  /** Contexte conversationnel (turns avant/après) */
  context: ConversationalContext;
  
  /** Version de l'algorithme utilisé pour calculer M1/M2/M3 */
  algorithmVersion: string | null;
  
  /** Statut du calcul : "pending", "completed", "error" */
  computationStatus: string | null;
  
  /** Date de calcul */
  computedAt: string | null;
  
  /** Annotations manuelles éventuelles */
  annotations: Record<string, unknown>;
  
  /** Métadonnées de version */
  versionMetadata: Record<string, unknown> | null;
}

// ============================================================================
// TYPES POUR LES REQUÊTES ET FILTRES
// ============================================================================

/**
 * Filtre pour récupérer des paires selon des critères
 */
export interface PairFilter {
  /** Filtrer par ID d'appel */
  callIds?: string[];
  
  /** Filtrer par famille de stratégie */
  strategyFamilies?: StrategyFamily[];
  
  /** Filtrer par type de réaction */
  reactionTypes?: ReactionType[];
  
  /** Filtrer par statut de calcul */
  computationStatus?: string[];
  
  /** Limite de résultats */
  limit?: number;
  
  /** Offset pour pagination */
  offset?: number;
}

/**
 * Résultat d'une requête de paires
 */
export interface PairsQueryResult {
  /** Les paires trouvées */
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
// TYPES POUR LA CONVERSION BDD -> ENTITÉS MÉTIER
// ============================================================================

/**
 * Options pour la conversion d'une row BDD en entité métier
 */
export interface ConversionOptions {
  /** Inclure le contexte conversationnel ? */
  includeContext?: boolean;
  
  /** Valider les données ? */
  validate?: boolean;
  
  /** Enrichir avec des données supplémentaires ? */
  enrich?: boolean;
}

/**
 * Résultat de la conversion
 */
export interface ConversionResult {
  /** L'entité convertie */
  pair: StrategyReactionPair | null;
  
  /** Erreurs éventuelles */
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
  
  /** Distribution des stratégies */
  strategyDistribution: Record<StrategyFamily, number>;
  
  /** Distribution des réactions */
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
 * Table de contingence stratégie × réaction
 */
export interface ContingencyTable {
  /** Lignes = stratégies, colonnes = réactions */
  table: Record<StrategyFamily, Record<ReactionType, number>>;
  
  /** Totaux par ligne */
  rowTotals: Record<StrategyFamily, number>;
  
  /** Totaux par colonne */
  colTotals: Record<ReactionType, number>;
  
  /** Total général */
  grandTotal: number;
}
