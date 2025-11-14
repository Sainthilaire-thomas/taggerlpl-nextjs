// ==========================================
// 📁 FeedbackAlignmentIndicator/types.ts
// ==========================================

import { BaseIndicatorResult } from "../../../metrics-framework/core/types/base";

// Types spécifiques au Feedback Alignment
// Types spécifiques au Feedback Alignment
export interface FeedbackAlignmentResult extends BaseIndicatorResult {
  value: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  confidence: number; // ✅ Ajouté au niveau principal
  details: {
    positive_markers: string[];
    negative_markers: string[];
    neutral_markers: string[];
    sentiment_score?: number;
    reaction_type: "CLIENT_POSITIF" | "CLIENT_NEUTRE" | "CLIENT_NEGATIF";
    // confidence retiré d'ici pour éviter la duplication
  };
}

export interface TurnTaggedData {
  id: number;
  call_id: number;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_tag: string;
  next_turn_verbatim: string;
  speaker: string;
  score_auto?: number;
}

export interface FeedbackAlignmentConfig {
  algorithm: "basic" | "sentiment_enhanced" | "ml_supervised";
  confidence_threshold: number;
  enable_context_analysis: boolean;
}
