// src/app/(protected)/analysis/components/AlgorithmLab/types/ThesisVariables.ts

// =====================
// VARIABLES PRINCIPALES
// =====================

export type VariableX =
  | "ENGAGEMENT"
  | "EXPLICATION"
  | "REFLET_ACQ"
  | "REFLET_JE"
  | "REFLET_VOUS"
  | "OUVERTURE";

export type VariableY = "CLIENT_POSITIF" | "CLIENT_NEUTRE" | "CLIENT_NEGATIF";

export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// =====================
// STRUCTURE DE BASE
// =====================

export interface ThesisDataPoint {
  pairId: string;
  callId: string;
  timestamp: number;

  conseillerVerbatim: string;
  clientVerbatim: string;

  X_goldStandard?: VariableX;
  Y_goldStandard?: VariableY;

  X_computed?: VariableX;
  Y_computed?: VariableY;

  // Les médiateurs seront ajoutés plus tard
  M1_score?: number;
  M2_score?: number;
  M3_score?: number;

  confidence?: {
    X_confidence?: number;
    Y_confidence?: number;
    M1_confidence?: number;
    M2_confidence?: number;
    M3_confidence?: number;
  };
}

// =====================
// SLOTS EXTENSIBLES (M1/M2/M3)
// =====================
// Ces interfaces sont volontairement vides et seront
// enrichies plus tard via "declaration merging".
export interface M1Details {}
export interface M2Details {}
export interface M3Details {}

// Couleurs/labels de base (extensibles)
export const VARIABLE_LABELS = {
  ENGAGEMENT: "Engagement",
  EXPLICATION: "Explication",
  REFLET_ACQ: "Reflet - Acquiescement",
  REFLET_JE: "Reflet - Centré conseiller",
  REFLET_VOUS: "Reflet - Centré client",
  OUVERTURE: "Ouverture",
  CLIENT_POSITIF: "Réaction positive",
  CLIENT_NEUTRE: "Réaction neutre",
  CLIENT_NEGATIF: "Réaction négative",
} as const;

export const VARIABLE_COLORS = {
  ENGAGEMENT: "#1976d2",
  EXPLICATION: "#1565c0",
  REFLET_ACQ: "#42a5f5",
  REFLET_JE: "#64b5f6",
  REFLET_VOUS: "#90caf9",
  OUVERTURE: "#bbdefb",
  CLIENT_POSITIF: "#4caf50",
  CLIENT_NEUTRE: "#ff9800",
  CLIENT_NEGATIF: "#f44336",
  M1: "#9c27b0",
  M2: "#673ab7",
  M3: "#3f51b5",
} as const;

// =====================
// SCORES M1 / M2 / M3
// =====================
// Échelles simples [0,1] — pourront être remplacées par des types plus riches
export type VariableM1Score = number;
export type VariableM2Score = number;
export type VariableM3Score = number;

// =====================
// METRIQUES DE VALIDATION
// =====================
// Forme générique et compacte, compatible avec L1 et L2
export interface ValidationMetrics {
  // Global
  accuracy?: number;
  macroPrecision?: number;
  macroRecall?: number;
  macroF1?: number;

  // Par classe (clé = label de classe)
  perClass?: Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }
  >;

  // Matrice de confusion (pred → actual → count)
  confusionMatrix?: Record<string, Record<string, number>>;
}

// =====================
// CONFIG & ETAT DE TEST ALGO
// =====================
export interface CrossValidationConfig {
  folds: number;
  stratified: boolean; // requis (le hook l'utilise comme non-optionnel)
}

export interface AlgorithmTestConfig {
  algorithmId: string;
  variable: VariableTarget; // "X" | "Y" | "M1" | "M2" | "M3"
  sampleSize?: number;
  randomSeed?: number;
  useGoldStandard?: boolean;
  crossValidation?: CrossValidationConfig;
  thresholds?: Record<string, number>;
  options?: Record<string, unknown>; // ex: { metricsToCalculate: string[] }
}

// ⚠️ étendez ValidationMetrics pour coller au hook & à l'UI
export interface ValidationMetrics {
  // Global
  accuracy?: number;
  errorRate?: number; // 1 - accuracy (utilisé par le hook)
  sampleSize?: number; // taille de l'échantillon
  processingSpeed?:
    | number
    | {
        // ms moyen, ou objet {avgTime,...}
        avgTime: number;
        medianTime?: number;
        minTime?: number;
        maxTime?: number;
      };

  // Par classe (deux formats acceptés)
  precision?: Record<string, number>;
  recall?: Record<string, number>;
  f1Score?: Record<string, number>;

  // Alternative générique déjà utile ailleurs
  perClass?: Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support?: number;
    }
  >;

  // Matrice (optionnelle)
  confusionMatrix?: Record<string, Record<string, number>>;
}

export type AlgorithmTestState = "idle" | "running" | "completed" | "error";
