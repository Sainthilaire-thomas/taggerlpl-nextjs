// ============================================================================
// Types Level 0 - Contra-annotation LLM et Multi-chartes
// ============================================================================

import { XTag, YTag } from "@/types/algorithm-lab/tags";

// ============================================================================
// OpenAI Annotation
// ============================================================================

export interface OpenAIAnnotationRequest {
  pairId: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  prev1_verbatim?: string;
  next1_verbatim?: string;
}

export interface OpenAIAnnotationResult {
  pairId: number;
  x_predicted?: XTag;
  x_confidence?: number;
  x_reasoning?: string;
  y_predicted?: YTag;
  y_confidence?: number;
  y_reasoning?: string;
}

// ============================================================================
// Kappa Calculation
// ============================================================================

export interface AnnotationPair {
  manual: string;
  llm: string;
}

export interface KappaResult {
  po: number;      // Proportion d'accord observé
  pe: number;      // Proportion d'accord attendu par hasard
  kappa: number;   // (Po - Pe) / (1 - Pe)
  interpretation: "Inférieur au hasard" | "Accord faible" | "Accord acceptable" | 
                  "Accord modéré" | "Accord substantiel" | "Accord quasi-parfait";
}

export interface DisagreementCase {
  pairId: number;
  verbatim: string;
  manualTag: string;
  llmTag: string;
  llmReasoning?: string;
  llmConfidence?: number;
  turnId?: number;
}

// ============================================================================
// Multi-chartes
// ============================================================================

export interface CharteDefinition {
  charte_id: string;
  charte_name: string;
  charte_description?: string;
  variable: "X" | "Y";
  definition: {
    categories: Record<string, {
      description: string;
      patterns?: string[];
      rules?: string[];
      examples?: string[];
    }>;
    priority_rules?: string[];
    rules?: {
      approach?: string;
      examples_per_category?: number;
      context_included?: boolean;
    };
  };
  created_at?: string;
  is_baseline?: boolean;
}

export interface CharteTestResult {
  test_id: string;
  charte_id: string;
  charte_name: string;
  variable: "X" | "Y";
  kappa: number;
  accuracy: number;
  total_pairs: number;
  disagreements_count: number;
  disagreements: DisagreementCase[];
  metrics?: {
    precision?: Record<string, number>;
    recall?: Record<string, number>;
    f1Score?: Record<string, number>;
    confusionMatrix?: Record<string, Record<string, number>>;
  };
  execution_time_ms: number;
  openai_model: string;
  tested_at: string;
}

// ============================================================================
// Gold Standard
// ============================================================================

export interface GoldStandardUpdate {
  pairId: number;
  level0_gold_conseiller?: string;
  level0_gold_client?: string;
  level0_annotator_agreement: number;
  level0_validated_at: string;
}

export interface ComparisonResult {
  pairId: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  
  // X comparison
  manualX: string;
  llmX?: string;
  agreementX: boolean;
  
  // Y comparison
  manualY: string;
  llmY?: string;
  agreementY: boolean;
  
  // Metadata
  llm_x_confidence?: number;
  llm_x_reasoning?: string;
  llm_y_confidence?: number;
  llm_y_reasoning?: string;
}

// ============================================================================
// Legacy types (gardés pour compatibilité si nécessaire)
// ============================================================================

export interface InterAnnotatorData {
  id: string;
  verbatim: string;
  expert1: string;
  expert2: string;
  agreed: boolean;
  callId: string;
  speaker: "conseiller" | "client";
  turnIndex: number;
  context: string;
  annotationTimestamp: Date;
}

export interface KappaMetrics {
  observed: number;
  expected: number;
  kappa: number;
  interpretation:
    | "poor"
    | "slight"
    | "fair"
    | "moderate"
    | "substantial"
    | "almost_perfect";
  confidenceInterval: [number, number];
}
