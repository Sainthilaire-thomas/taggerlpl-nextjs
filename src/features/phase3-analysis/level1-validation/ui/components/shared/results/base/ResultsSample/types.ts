// types.tsx — pont de compatibilité ResultsPanel ⇄ AlgorithmLab/types
// ✅ Recommandé : alias TS "AlgorithmLab/types/*" (voir referencetypes.md)
// ⛳️ Si tu n'as pas d'alias, remplace la ligne d'import par un chemin relatif vers /types/core

import type {
  TVValidationResultCore as CoreTVValidationResult,
  TVMetadataCore as CoreTVMetadata,
} from "@/types/algorithm-lab/core"; // <-- sinon ex: "../../../../types/core"

// =========================
//   Auxiliaires UI locaux
// =========================

export interface TVTopProb {
  label: string;
  prob: number;
}

export interface TVMMetric {
  value?: number;
  actionVerbCount?: number;
  totalTokens?: number;
  verbsFound?: string[];
}

export interface TVDetails {
  family?: string;
}

// =========================
//   Métadonnées unifiées
// =========================
// On ÉTEND la définition canonique (CoreTVMetadata)
// pour conserver des champs UI additionnels.

export interface TVMetadata extends CoreTVMetadata {
  // --- Contexte conversationnel (UI) ---
  prev2_turn_verbatim?: string;
  prev1_turn_verbatim?: string;
  next_turn_verbatim?: string;
  prev2_speaker?: string;
  prev1_speaker?: string;

  // --- Infos algo / LLM (affichage/debug) ---
  classifier?: string; // nom du classificateur
  type?: string; // rule-based | ml | llm | hybrid
  model?: string;
  temperature?: number;
  maxTokens?: number;

  // --- Traces / erreurs LLM ---
  rawResponse?: string;
  error?: string;

  // --- Détails X / Y (UI) ---
  x_details?: TVDetails;
  y_details?: TVDetails;
  x_evidences?: string[];
  y_evidences?: string[];
  x_topProbs?: TVTopProb[];
  y_topProbs?: TVTopProb[];
  evidences?: string[];
  rationales?: string[];

  // --- M1 / M2 / M3 (affinage métriques) ---
  m1?: {
    value?: number; // densité calculée
    actionVerbCount?: number;
    totalTokens?: number;
    verbsFound?: string[];
  };

  m2?: {
    value?: string | number; // ex: catégorie ou score
    scale?: string; // ex: Likert, ouverture/fermeture
  };

  m3?: {
    value?: number; // durée, pauses, etc.
    unit?: "ms" | "s";
  };
}

// =========================
//   Résultat unifié
// =========================
// On reprend le résultat "core" et on remplace le type
// de metadata par la version étendue locale.

export interface TVValidationResult
  extends Omit<CoreTVValidationResult, "metadata"> {
  metadata?: TVMetadata;
}

// =========================
//   Types utilitaires
// =========================

export interface FineTuningData {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  metadata: {
    turnId: number;
    verbatim: string;
    context: any;
    predicted: string;
    goldStandard: string;
    confidence: number;
    annotations: string[];
    algo: any;
  };
}

export interface ResultsSampleProps {
  results: TVValidationResult[];
  limit?: number;
  initialPageSize?: number;
}

export interface ContextData {
  prev2?: string;
  prev1?: string;
  current: string;
  next1?: string;
}

export type Tone = "A" | "B" | "CURRENT";

// =========================
//   Helper d’adaptation
// =========================
// Permet de convertir un résultat "core" en résultat UI
// sans friction côté typage (optionnel).

export const asUIResult = (r: CoreTVValidationResult): TVValidationResult => ({
  ...r,
  metadata: r.metadata ?? {},
});
