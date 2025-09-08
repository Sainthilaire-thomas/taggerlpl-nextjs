// ===================================================================
// 3. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/variables.ts
// ===================================================================

/**
 * @fileoverview Variables & détails AlgorithmLab — version unifiée et canonique
 * - Ordre logique (tags avant usages)
 * - Pas de redéclarations : une seule interface par nom
 * - Compat ascendante : anciens champs conservés en option
 * ✅ CORRECTION: Ajout des propriétés M3Details manquantes (pauseCount, hesitationCount, speechRate, markers)
 */

// ========================================================================
// 1) Cibles principales
// ========================================================================
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// (utilisé par useWorkflowManagement)
export type ValidationLevel = "LEVEL0" | "LEVEL1" | "LEVEL2";

// ========================================================================
// 2) Tags X/Y (catégories canoniques)
// ========================================================================

// VariableX est utilisée comme union de libellés
export type VariableX =
  | "ENGAGEMENT"
  | "EXPLICATION"
  | "REFLET_ACQ"
  | "REFLET_JE"
  | "REFLET_VOUS"
  | "OUVERTURE";

// XTag = VariableX avec extensions
export type XTag = VariableX | "REFLET" | "CLOTURE" | "AUTRE_X";

export type YTag =
  | "CLIENT_POSITIF"
  | "CLIENT_NEUTRE"
  | "CLIENT_NEGATIF"
  | "CLIENT_QUESTION"
  | "CLIENT_SILENCE"
  | "AUTRE_Y";

export type VariableY = YTag;

// ========================================================================
// 3) Détails par variable (définitions uniques)
// ========================================================================

export interface XDetails {
  // Propriétés existantes
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  verbCount?: number;
  actionVerbs?: string[];
  pronounUsage?: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers?: string[];
  declarativeMarkers?: string[];
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
  label?: string;

  // ✅ NOUVELLES propriétés optionnelles pour useLevel1Testing
  confidence?: number; // Erreur ligne 94
  matchedPatterns?: string[]; // Utilisé ligne 96
  rationale?: string; // Utilisé ligne 97
  probabilities?: any; // Utilisé ligne 98
  spans?: any; // Utilisé ligne 99
}

export interface YDetails {
  // Propriétés existantes
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity?: number;
  linguisticMarkers?: string[];
  responseType?: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";
  conversationalMetrics?: {
    latency: number;
    verbosity: number;
    coherence: number;
  };
  label?: string;

  // ✅ NOUVELLES propriétés optionnelles pour useLevel1Testing
  confidence?: number; // Erreur ligne 108
  cues?: string[]; // Utilisé ligne 110
  sentimentProxy?: any; // Utilisé ligne 111
  spans?: any; // Utilisé ligne 112
}

export interface M1Details {
  // Ancienne spec (compat)
  value?: number;
  actionVerbCount?: number;
  totalTokens?: number;
  verbsFound?: string[];

  // Spec enrichie
  score?: number;
  verbCount?: number;
  averageWordLength?: number;
  sentenceComplexity?: number;
  lexicalDiversity?: number;
  syntacticComplexity?: number;
  semanticCoherence?: number;
}

export interface M2Details {
  // Ancienne spec (compat)
  value?: string | number;
  scale?: string;

  // Spec enrichie
  lexicalAlignment?: number;
  syntacticAlignment?: number;
  semanticAlignment?: number;
  overall?: number;

  sharedTerms?: string[];
  alignmentVector?: number[];
  distanceMetrics?: {
    euclidean: number;
    cosine: number;
    jaccard: number;
  };
}

export interface M3Details {
  // Ancienne spec (compat)
  value?: number;
  unit?: "ms" | "s";

  // Spec enrichie
  fluidity?: number;
  cognitiveLoad?: number;
  processingEfficiency?: number;

  attentionalFocus?: number;
  workingMemoryUsage?: number;
  executiveControl?: number;

  predictedSatisfaction?: number;
  predictedCompliance?: number;

  // ✅ CORRECTION MAJEURE: Ajout des propriétés manquantes signalées dans les erreurs
  pauseCount?: number; // Erreur dans M3ValidationInterface.tsx:107,300
  hesitationCount?: number; // Erreur dans M3ValidationInterface.tsx:109,302
  speechRate?: number; // Erreur dans M3ValidationInterface.tsx:111,305
  markers?: Array<{
    type: string;
    timestamp: number;
    confidence: number;
    value?: string | number;
  }>; // Erreur dans M3ValidationInterface.tsx:314
}

// ========================================================================
// 4) Objets composés X/Y (tag + détails)
// ========================================================================
export interface XValue {
  tag: XTag;
  details: XDetails;
}

export interface YValue {
  tag: YTag;
  details: YDetails;
}

export interface VariableM1Score {
  value: number;
  components?: Record<string, number>;
}

export interface VariableM2Score {
  value: number;
  alignment?: "low" | "medium" | "high";
  components?: Record<string, number>;
}

export interface VariableM3Score {
  value: number;
  components?: Record<string, number>;
}

// ========================================================================
// 5) Union de détails + utilitaires d'affichage
// ========================================================================
export type VariableDetails =
  | XDetails
  | YDetails
  | M1Details
  | M2Details
  | M3Details;

export const VARIABLE_LABELS = {
  X: "Actes conversationnels conseiller",
  Y: "Réactions client",
  M1: "Métriques linguistiques",
  M2: "Alignement interactionnel",
  M3: "Indicateurs cognitifs",
} as const satisfies Record<VariableTarget, string>;

export const VARIABLE_COLORS = {
  X: "#2196F3",
  Y: "#4CAF50",
  M1: "#FF9800",
  M2: "#9C27B0",
  M3: "#F44336",
} as const satisfies Record<VariableTarget, string>;

// ========================================================================
// 6) Helpers
// ========================================================================
export function isValidVariableTarget(
  target: string
): target is VariableTarget {
  return (
    target === "X" ||
    target === "Y" ||
    target === "M1" ||
    target === "M2" ||
    target === "M3"
  );
}

export function getVariableColor(target: VariableTarget): string {
  return VARIABLE_COLORS[target];
}

export function getVariableLabel(target: VariableTarget): string {
  return VARIABLE_LABELS[target];
}
