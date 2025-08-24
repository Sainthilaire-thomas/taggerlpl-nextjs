// tabs/types.ts - Types partagés pour les onglets FeedbackAlignment
// Mis à jour pour la taxonomie de la thèse

// Types de base pour tous les onglets
export interface TabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

// Types d'onglets disponibles
export type TabType = "basic" | "lica" | "comparison";

// Configuration d'un onglet
export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType;
  color: "primary" | "secondary" | "info";
  description: string;
}

// Informations sur l'algorithme utilisé dans un onglet
export interface AlgorithmInfo {
  type: TabType;
  name: string;
  shortDescription: string;
  fullDescription: string;
  scientificBasis: string[];
  keyFeatures: string[];
  limitations?: string[];
}

// Statistiques globales adaptées aux onglets
export interface TabStats {
  totalTurns: number;
  totalResponses: number;
  overallScore: number;
  coverage: number;
  bestStrategy?: {
    name: string;
    score: number;
  };
  strategiesBreakdown: Record<
    string,
    {
      alignmentScore: number;
      totalOccurrences: number;
      details: {
        positiveRate: number;
        negativeRate: number;
        neutralRate: number;
        analysisRate: number;
      };
    }
  >;
  algorithmInfo: AlgorithmInfo;
}

// Données de debug pour les onglets
export interface TabDebugInfo {
  families: string[];
  nextTurnTags: string[];
  origines: string[];
  patterns?: string[]; // Spécifique LI-CA
  actions?: string[]; // Spécifique LI-CA
}

// Configuration des actions par onglet
export interface TabActions {
  primary: {
    label: string;
    action: () => void;
    disabled?: boolean;
    icon?: React.ComponentType;
  };
  secondary: Array<{
    label: string;
    action: () => void;
    disabled?: boolean;
    icon?: React.ComponentType;
    color?: "primary" | "secondary" | "info" | "warning" | "error";
  }>;
}

// Métadonnées d'export spécifiques par onglet
export interface TabExportData {
  algorithm: string;
  timestamp: string;
  origine: string | null;
  results: any;
  stats: TabStats;
  metadata: {
    approach: string;
    scientificSources?: string[];
    methodology?: any;
    lexicons?: any;
  };
}

// Configuration des seuils pour les onglets
export interface TabThresholds {
  excellent: number;
  good: number;
  warning?: number;
}

// Props pour les composants d'actions spécifiques
export interface AlgorithmControlsProps {
  tabType: TabType;
  analysisResults?: any;
  stats?: TabStats;
  onAction: (actionType: string, data?: any) => void;
  disabled?: boolean;
}

// Configuration des couleurs par onglet
export const TAB_COLORS: Record<TabType, string> = {
  basic: "primary",
  lica: "secondary",
  comparison: "info",
} as const;

// Configuration des icônes par onglet (pour référence)
export const TAB_ICONS = {
  basic: "Analytics",
  lica: "Psychology",
  comparison: "Compare",
} as const;

// Messages d'état par onglet
export interface TabStatusMessages {
  loading: string;
  analyzing: string;
  noData: string;
  error: string;
  success: string;
}

export const DEFAULT_TAB_MESSAGES: Record<TabType, TabStatusMessages> = {
  basic: {
    loading: "Chargement des données...",
    analyzing: "Analyse sémantique en cours...",
    noData: "Aucune donnée disponible pour l'analyse sémantique",
    error: "Erreur d'analyse sémantique",
    success: "Analyse sémantique terminée avec succès",
  },
  lica: {
    loading: "Chargement des données...",
    analyzing: "Analyse LI-CA en cours...",
    noData: "Aucune paire conversationnelle trouvée",
    error: "Erreur d'analyse LI-CA",
    success: "Analyse LI-CA terminée avec succès",
  },
  comparison: {
    loading: "Chargement des données...",
    analyzing: "Comparaison en cours...",
    noData: "Aucune donnée disponible pour la comparaison",
    error: "Erreur de comparaison",
    success: "Comparaison terminée avec succès",
  },
} as const;

// ========================================
// TYPES ADAPTÉS À LA TAXONOMIE DE LA THÈSE
// ========================================

// Import des nouveaux types de l'algorithme adapté
import {
  ConseillerStrategy,
  ClientReaction,
  ProcessingMode,
  ThesisConversationalAnalysis,
} from "../../algorithms/ConversationalPatternAlgorithm";

// Structure détaillée pour l'interface interactive selon la thèse
export interface DetailedThesisResults {
  familyDetails: Record<string, FamilyThesisAnalysis>;
  globalMetrics: {
    totalTurns: number;
    totalAnalyzedPairs: number;
    overallScore: number;
    coverage: number;
    bestFamily: { name: string; score: number } | null;
    hypothesesSupport: {
      h1_differential_effectiveness: number;
      h2_cognitive_mechanisms: number;
      h3_practical_transferability: number;
    };
  };
}

export interface FamilyThesisAnalysis {
  totalTours: number;
  scoreGlobal: number;
  familyGoal: "VALIDATION" | "INFORMATION" | "ACTION" | "ENGAGEMENT";
  familyDescription: string;

  // Distribution selon taxonomie hiérarchisée de la thèse
  strategiesConseiller: Record<ConseillerStrategy, StrategyConseillerDetails>;

  // Métriques spécifiques à la thèse
  actionDescriptionMetrics: {
    engagement_effectiveness: number;
    ouverture_effectiveness: number;
    explanation_resistance: number;
  };

  processingModeDistribution: {
    automatic_motor: number;
    controlled_metaphor: number;
    empathic_processing: number;
    neutral_information: number;
  };
}

export interface StrategyConseillerDetails {
  count: number;
  percentage: number;
  actionPriority: number; // Selon règle hiérarchique thèse
  cognitiveProcessing: ProcessingMode;
  expectedEffectiveness: number;
  conseillerExamples: string[];
  reactionsClient: Record<ClientReaction, ReactionClientDetails>;
}

export interface ReactionClientDetails {
  count: number;
  supportForStrategy: number; // Support différentiel selon la thèse
  examples: ThesisDetailedExample[];
}

export interface ThesisDetailedExample {
  conseillerVerbatim: string;
  clientVerbatim: string;
  callId: string;

  // Métriques spécifiques à la thèse
  actionDescriptionScore: number;
  cognitiveLoadEstimate: number;
  conflictManagementSuccess: number;

  // Validation des hypothèses
  h1_actionEffectiveness: boolean;
  h2_cognitiveProcessing: ProcessingMode;
  h3_practicalApplication: string;

  explanation: string;
}

// ========================================
// TYPES POUR LE NOUVEL ONGLET THESIS
// ========================================

// Configuration pour un onglet spécifique à la thèse
export interface ThesisTabConfig extends TabConfig {
  theoreticalFramework: {
    primaryTheory: string;
    cognitiveFramework: string;
    hypothesesTested: string[];
  };
  validationCriteria: {
    h1_threshold: number; // Seuil pour valider H1
    h2_confidence: number; // Seuil de confiance pour H2
    h3_applicability: number; // Seuil d'applicabilité pour H3
  };
}

// Résultats enrichis pour l'onglet thèse
export interface ThesisTabResults {
  primaryAnalysis: DetailedThesisResults;
  hypothesesValidation: {
    h1_differential_effectiveness: {
      validated: boolean;
      confidence: number;
      evidence: string[];
      actionVsExplanation: {
        actions_positive_rate: number;
        explanations_positive_rate: number;
        statistical_significance: number;
      };
    };
    h2_cognitive_mechanisms: {
      validated: boolean;
      confidence: number;
      evidence: ProcessingModeEvidence[];
      automaticVsControlled: {
        automatic_efficiency: number;
        controlled_difficulty: number;
        stress_modulation: number;
      };
    };
    h3_practical_transferability: {
      validated: boolean;
      confidence: number;
      recommendations: PracticalRecommendation[];
      applicability_score: number;
    };
  };

  scientificValidation: {
    taxonomyConsistency: number;
    cognitiveCoherence: number;
    empiricalSupport: number;
    practicalRelevance: number;
  };
}

export interface ProcessingModeEvidence {
  mode: ProcessingMode;
  strategies: ConseillerStrategy[];
  efficiency_indicators: {
    reaction_speed: number;
    effort_markers: number;
    success_rate: number;
  };
  supporting_theory: string;
}

export interface PracticalRecommendation {
  context: string;
  recommendedStrategy: ConseillerStrategy;
  avoidStrategy: ConseillerStrategy;
  rationale: string;
  cognitiveExplanation: string;
  expectedImprovement: number;
  implementationDifficulty: "easy" | "medium" | "hard";
}

// ========================================
// MÉTADONNÉES DE VALIDATION SCIENTIFIQUE
// ========================================

export interface ScientificValidationMetadata {
  algorithmVersion: "thesis_adapted_v1";
  theoreticalBasis: {
    linguisticFramework: "AC + LI + Cognition Incarnée";
    cognitiveTheories: [
      "Neurones miroirs",
      "Métaphores conceptuelles",
      "Traitement dual"
    ];
    thesisChapter: "3.2.1.1 Classification hiérarchisée";
  };
  validationCriteria: {
    taxonomyAlignment: boolean;
    hypothesesTesting: boolean;
    empiricalValidation: boolean;
    practicalTransferability: boolean;
  };
  exportCompatibility: {
    formats: ["json", "csv", "latex", "scientific_report"];
    scientificStandards: boolean;
    reproducibility: boolean;
  };
}

// ========================================
// TYPES POUR COMPATIBILITÉ DESCENDANTE
// ========================================

// Aliases pour maintenir la compatibilité avec l'ancien code
export type ConseillerActionType = ConseillerStrategy;
export type ClientResponseStrategy = ClientReaction;
export type SequentialAlignment =
  | "preferred"
  | "dispreferred"
  | "misaligned"
  | "neutral";
export type ConversationalAnalysis = ThesisConversationalAnalysis;

// Mapping pour la migration
export const LEGACY_TO_THESIS_MAPPING = {
  // Ancien système CA/LI vers nouveau système taxonomie thèse
  conseillerActions: {
    commitment: ConseillerStrategy.ENGAGEMENT,
    acknowledgment: ConseillerStrategy.REFLET_ACQ,
    explanation: ConseillerStrategy.EXPLICATION,
    question: ConseillerStrategy.QUESTION,
    proposal: ConseillerStrategy.OUVERTURE,
  },
  clientStrategies: {
    adherence: ClientReaction.POSITIF,
    elaboration: ClientReaction.POSITIF,
    resistance: ClientReaction.NEGATIF,
    negociation: ClientReaction.NEUTRE,
    neutral: ClientReaction.NEUTRE,
  },
} as const;

// ========================================
// EXPORTS POUR UTILISATION EXTERNE
// ========================================

export type {
  ConseillerStrategy,
  ClientReaction,
  ProcessingMode,
  ThesisConversationalAnalysis,
};

// Types principaux pour l'interface
export type {
  DetailedThesisResults as DetailedLICAResults, // Alias pour compatibilité
  FamilyThesisAnalysis as FamilyDetailedAnalysis, // Alias pour compatibilité
  StrategyConseillerDetails as ActionConseillerDetails, // Alias pour compatibilité
  ReactionClientDetails as StrategyClientDetails, // Alias pour compatibilité
  ThesisDetailedExample as DetailedExample, // Alias pour compatibilité
};
