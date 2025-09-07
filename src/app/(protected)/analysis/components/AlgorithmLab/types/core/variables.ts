// ===================================================================
// 3. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/variables.ts
// ===================================================================

/**
 * @fileoverview Variables & détails AlgorithmLab — version unifiée et canonique
 * - Ordre logique (tags avant usages)
 * - Pas de redéclarations : une seule interface par nom
 * - Compat ascendante : anciens champs conservés en option
 */

// ========================================================================
// 1) Cibles principales
// ========================================================================
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// Suppression de ValidationLevel (maintenant dans validation.ts)
// export type ValidationLevel = "LEVEL0" | "LEVEL1" | "LEVEL2";

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

// ========================================================================
// 3) Détails par variable (définitions uniques)
// ========================================================================

export interface XDetails {
  // Ancienne spec (facilitent la validation X↔famille)
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];

  // Mesures linguistiques/structurelles
  verbCount?: number;
  actionVerbs?: string[];
  pronounUsage?: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers?: string[];
  declarativeMarkers?: string[];

  // Métriques d'efficacité
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
}

export interface YDetails {
  // Ancienne spec
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];

  // Spec riche
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity?: number; // 0..1
  linguisticMarkers?: string[];
  responseType?: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";

  conversationalMetrics?: {
    latency: number; // ms
    verbosity: number; // nb mots
    coherence: number; // 0..1
  };
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
