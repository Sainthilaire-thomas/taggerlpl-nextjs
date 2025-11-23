// Types spécialisés pour les interfaces de validation et vérification
// Complément à ThesisVariables.ts pour les composants UI

import type {
  VariableX,
  VariableY,
  VariableM1Score,
  VariableM2Score,
  VariableM3Score,
  M1Details,
  M2Details,
  M3Details,
  ValidationMetrics,
  AlgorithmTestConfig,
  AlgorithmTestState,
} from "./ThesisVariables";

// =============================================================================
// INTERFACES DE VÉRIFICATION SPÉCIALISÉES
// =============================================================================

/**
 * Configuration générale pour toutes les interfaces de validation
 */
export interface BaseValidationProps {
  isLoading: boolean;
  error?: string;
  onRefresh?: () => void;
  showDebugInfo?: boolean;
}

/**
 * Props pour XValidationInterface
 * Interface de vérification des stratégies conseiller (X)
 */
export interface XValidationInterfaceProps extends BaseValidationProps {
  testResults: XValidationResult[];
  selectedAlgorithm: string;
  goldStandardData?: XGoldStandardItem[];

  // Configuration affichage
  config: {
    showConfidence: boolean;
    showEvidence: boolean;
    showGoldComparison: boolean;
    itemsPerPage: number;
  };

  // Callbacks
  onItemSelect?: (item: XValidationResult) => void;
  onExportResults?: () => void;
}

/**
 * Résultat de validation X (stratégies conseiller)
 */
export interface XValidationResult {
  id: string;
  verbatim: string;

  // Classification
  predicted: VariableX;
  goldStandard?: VariableX;
  confidence: number;

  // Analyse
  correct?: boolean;
  evidence: string[];
  processingTime: number;

  // Contexte
  callId: string;
  speaker: string;
  timestamp: number;

  // Détails algorithme
  algorithmDetails?: {
    detectedPatterns: string[];
    linguisticMarkers: string[];
    confidenceBreakdown: Record<VariableX, number>;
  };
}

/**
 * Props pour YValidationInterface
 * Interface de vérification des réactions client (Y)
 */
export interface YValidationInterfaceProps extends BaseValidationProps {
  testResults: YValidationResult[];
  selectedAlgorithm: string;
  goldStandardData?: YGoldStandardItem[];

  // Configuration spécialisée Y
  config: {
    showConfidence: boolean;
    showSentimentScore: boolean;
    showContext: boolean; // Tour conseiller précédent
    itemsPerPage: number;
  };

  onItemSelect?: (item: YValidationResult) => void;
  onExportResults?: () => void;
}

/**
 * Résultat de validation Y (réactions client)
 */
export interface YValidationResult {
  id: string;
  clientVerbatim: string;
  conseillerContext?: string; // Tour précédent du conseiller

  // Classification
  predicted: VariableY;
  goldStandard?: VariableY;
  confidence: number;
  sentimentScore: number; // [-1, 1]

  // Validation
  correct?: boolean;
  processingTime: number;

  // Contexte conversationnel
  callId: string;
  timestamp: number;
  turnSequence: number;

  // Détails analyse sentiment
  sentimentDetails?: {
    positiveWords: string[];
    negativeWords: string[];
    neutralMarkers: string[];
    emotionalIntensity: number;
  };
}

/**
 * Props pour M1ValidationInterface
 * Interface de vérification verbes d'action (M1)
 */
export interface M1ValidationInterfaceProps extends BaseValidationProps {
  testResults: M1ValidationResult[];
  selectedAlgorithm: string;
  referenceData?: M1ReferenceItem[]; // Si annotations manuelles disponibles

  // Configuration spécialisée M1
  config: {
    highlightVerbs: boolean;
    showVerbCategories: boolean;
    showDensityStats: boolean;
    showConfidence: boolean;
    itemsPerPage: number;
  };

  // Callbacks spécialisés M1
  onVerbClick?: (verb: string, context: string) => void;
  onScoreAdjustment?: (itemId: string, newScore: number) => void;
  onExportResults?: () => void;
}

/**
 * Résultat de validation M1 (verbes d'action)
 */
export interface M1ValidationResult {
  id: string;
  verbatim: string;

  // Score calculé
  score: VariableM1Score;
  details: M1Details;
  referenceScore?: number; // Si annotation manuelle disponible

  // Visualisation verbes
  highlightedText: {
    text: string;
    highlights: Array<{
      start: number;
      end: number;
      word: string;
      category: "institutional" | "cognitive" | "communicative";
      confidence: number;
    }>;
  };

  // Métriques
  processingTime: number;
  qualityScore: number; // [0-1] Qualité de la détection

  // Contexte
  callId: string;
  speaker: string;
  timestamp: number;
}

/**
 * Props pour M2ValidationInterface
 * Interface de vérification alignement conversationnel (M2)
 */
export interface M2ValidationInterfaceProps extends BaseValidationProps {
  testResults: M2ValidationResult[];
  selectedAlgorithm: string;
  referenceData?: M2ReferenceItem[];

  // Configuration spécialisée M2
  config: {
    showAlignmentVisualization: boolean;
    showComponentBreakdown: boolean; // lexical/sémantique/prosodique
    showTemporalAnalysis: boolean;
    highlightAlignedElements: boolean;
    itemsPerPage: number;
  };

  // Callbacks spécialisés M2
  onAlignmentElementClick?: (element: AlignmentElement) => void;
  onScoreComponentFilter?: (
    component: "lexical" | "semantic" | "prosodic"
  ) => void;
  onExportResults?: () => void;
}

/**
 * Résultat de validation M2 (alignement)
 */
export interface M2ValidationResult {
  id: string;
  conseillerVerbatim: string;
  clientVerbatim: string;

  // Score et détails
  score: VariableM2Score;
  details: M2Details;
  referenceScore?: number;

  // Visualisation alignement
  alignmentVisualization: {
    lexicalAlignments: AlignmentElement[];
    semanticBridges: AlignmentElement[];
    prosodicMatches: AlignmentElement[];
  };

  // Métriques
  processingTime: number;
  reliabilityScore: number;

  // Contexte
  callId: string;
  pairSequence: number;
  timestamp: number;
}

/**
 * Élément d'alignement pour visualisation M2
 */
export interface AlignmentElement {
  type: "lexical" | "semantic" | "prosodic";
  conseillerElement: {
    text: string;
    start: number;
    end: number;
  };
  clientElement: {
    text: string;
    start: number;
    end: number;
  };
  strength: number; // [0-1] Force de l'alignement
  confidence: number;
}

/**
 * Props pour M3ValidationInterface
 * Interface de vérification charge cognitive (M3)
 */
export interface M3ValidationInterfaceProps extends BaseValidationProps {
  testResults: M3ValidationResult[];
  selectedAlgorithm: string;
  referenceData?: M3ReferenceItem[];

  // Configuration spécialisée M3
  config: {
    showCognitiveMarkers: boolean;
    showTemporalTimeline: boolean;
    showComponentBreakdown: boolean; // pauses/hésitations/prosodique
    highlightAnomalies: boolean;
    itemsPerPage: number;
  };

  // Callbacks spécialisés M3
  onMarkerClick?: (marker: CognitiveMarker) => void;
  onTimelineSeek?: (timestamp: number) => void;
  onThresholdAdjustment?: (threshold: number) => void;
  onExportResults?: () => void;
}

/**
 * Résultat de validation M3 (charge cognitive)
 */
export interface M3ValidationResult {
  id: string;
  clientVerbatim: string;

  // Score et détails
  score: VariableM3Score;
  details: M3Details;
  referenceScore?: number;

  // Visualisation marqueurs cognitifs
  cognitiveMarkers: CognitiveMarker[];
  timeline: CognitiveTimeline;

  // Métriques
  processingTime: number;
  detectionReliability: number;

  // Contexte
  callId: string;
  turnNumber: number;
  timestamp: number;

  // Données audio si disponibles
  audioFeatures?: {
    duration: number;
    avgPitch: number;
    pitchVariability: number;
    speechRate: number;
  };
}

/**
 * Marqueur cognitif détecté
 */
export interface CognitiveMarker {
  type: "pause" | "hesitation" | "prosodic_anomaly";
  position: number; // Position dans le verbatim
  duration?: number; // Pour les pauses (ms)
  severity: number; // [0-1] Intensité
  confidence: number;

  // Détails spécialisés
  details: {
    text?: string; // Pour hésitations
    pauseDuration?: number; // Pour pauses
    prosodicFeature?: "pitch" | "tempo" | "intensity"; // Pour anomalies prosodiques
  };
}

/**
 * Timeline cognitive pour visualisation M3
 */
export interface CognitiveTimeline {
  totalDuration: number;
  segments: Array<{
    start: number;
    end: number;
    loadLevel: "low" | "medium" | "high";
    markers: CognitiveMarker[];
  }>;
  globalTrend: "increasing" | "decreasing" | "stable";
}

// =============================================================================
// TYPES POUR GOLD STANDARD ET RÉFÉRENCES
// =============================================================================

/**
 * Item gold standard pour X
 */
export interface XGoldStandardItem {
  id: string;
  verbatim: string;
  goldStandard: VariableX;
  annotatorConfidence: number;
  annotatorId: string;
  annotationDate: Date;

  // Contexte annotation
  callId: string;
  annotationNotes?: string;
}

/**
 * Item gold standard pour Y
 */
export interface YGoldStandardItem {
  id: string;
  clientVerbatim: string;
  conseillerContext: string;
  goldStandard: VariableY;
  annotatorConfidence: number;
  annotatorId: string;
  annotationDate: Date;

  callId: string;
  annotationNotes?: string;
}

/**
 * Item de référence pour M1
 */
export interface M1ReferenceItem {
  id: string;
  verbatim: string;
  referenceScore: VariableM1Score;
  manualVerbCount: number;
  annotatorId: string;
  annotationDate: Date;

  // Verbes annotés manuellement
  annotatedVerbs: Array<{
    verb: string;
    position: number;
    category: "institutional" | "cognitive" | "communicative";
  }>;

  callId: string;
  annotationNotes?: string;
}

/**
 * Item de référence pour M2
 */
export interface M2ReferenceItem {
  id: string;
  conseillerVerbatim: string;
  clientVerbatim: string;
  referenceScore: VariableM2Score;
  annotatorId: string;
  annotationDate: Date;

  // Alignements annotés manuellement
  annotatedAlignments: AlignmentElement[];

  callId: string;
  annotationNotes?: string;
}

/**
 * Item de référence pour M3
 */
export interface M3ReferenceItem {
  id: string;
  clientVerbatim: string;
  referenceScore: VariableM3Score;
  annotatorId: string;
  annotationDate: Date;

  // Marqueurs annotés manuellement
  annotatedMarkers: CognitiveMarker[];

  callId: string;
  audioAvailable: boolean;
  annotationNotes?: string;
}

// =============================================================================
// TYPES POUR L'EXPORT ET REPORTING
// =============================================================================

/**
 * Configuration d'export pour résultats de validation
 */
export interface ValidationExportConfig {
  variable: "X" | "Y" | "M1" | "M2" | "M3";
  format: "csv" | "json" | "excel";
  includeDetails: boolean;
  includeConfidence: boolean;
  includeGoldStandard: boolean;

  // Filtres d'export
  filters?: {
    minConfidence?: number;
    onlyErrors?: boolean;
    dateRange?: [Date, Date];
  };
}

/**
 * Rapport de validation généré
 */
export interface ValidationReport {
  generatedAt: Date;
  algorithmId: string;
  variable: "X" | "Y" | "M1" | "M2" | "M3";

  // Métriques globales
  globalMetrics: ValidationMetrics;

  // Analyses détaillées
  detailedAnalysis: {
    errorAnalysis: ErrorAnalysis;
    performanceBreakdown: PerformanceBreakdown;
    recommendations: string[];
  };

  // Données brutes
  rawResults: Array<
    | XValidationResult
    | YValidationResult
    | M1ValidationResult
    | M2ValidationResult
    | M3ValidationResult
  >;
}

/**
 * Analyse des erreurs
 */
export interface ErrorAnalysis {
  totalErrors: number;
  errorRate: number;

  // Par catégorie (pour X/Y)
  errorsByCategory?: Record<string, number>;
  confusionPatterns?: Array<{
    predicted: string;
    actual: string;
    frequency: number;
    examples: string[];
  }>;

  // Par plage de score (pour M1/M2/M3)
  errorsByScoreRange?: Array<{
    range: [number, number];
    errorCount: number;
    avgDeviation: number;
  }>;

  // Recommandations d'amélioration
  improvementSuggestions: string[];
}

/**
 * Analyse de performance détaillée
 */
export interface PerformanceBreakdown {
  overallAccuracy?: number;

  // Performance par catégorie
  categoryPerformance?: Record<
    string,
    {
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    }
  >;

  // Performance par plage de confiance
  confidenceAnalysis: Array<{
    confidenceRange: [number, number];
    accuracy: number;
    sampleSize: number;
  }>;

  // Vitesse de traitement
  processingSpeed: {
    avgTime: number;
    medianTime: number;
    minTime: number;
    maxTime: number;
  };
}

// =============================================================================
// TYPES UTILITAIRES POUR LES COMPOSANTS
// =============================================================================

/**
 * État de pagination pour les interfaces de validation
 */
export interface ValidationPaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Filtres pour les interfaces de validation
 */
export interface ValidationFilters {
  searchText?: string;
  confidenceRange?: [number, number];
  showOnlyErrors?: boolean;
  categoryFilter?: string[];
  dateRange?: [Date, Date];
}

/**
 * Configuration d'affichage pour chaque variable
 */
export interface VariableDisplayConfig {
  variable: "X" | "Y" | "M1" | "M2" | "M3";
  label: string;
  icon: string;
  color: string;

  // Options d'affichage spécifiques
  displayOptions: {
    showConfidence: boolean;
    showDetails: boolean;
    compactMode: boolean;
  };

  // Colonnes du tableau
  tableColumns: Array<{
    key: string;
    label: string;
    width?: number;
    sortable: boolean;
  }>;
}
