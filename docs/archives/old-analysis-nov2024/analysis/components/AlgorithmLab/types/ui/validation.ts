/**
 * @fileoverview Types de validation UI AlgorithmLab
 * Props spécifiques pour validation des algorithmes AlgorithmLab
 */

import { BaseValidationProps } from './components';
import { XInput, YInput, M1Input, M2Input, M3Input } from '../core/calculations';
import { XDetails, YDetails, M1Details, M2Details, M3Details } from '../core/variables';

// ========================================================================
// PROPS DE VALIDATION SPÉCIALISÉES ALGORITHMLAB
// ========================================================================

export interface XValidationProps extends BaseValidationProps {
  target: "X";
  
  // Configuration spécifique X AlgorithmLab
  xConfig: {
    analyzeActionVerbs: boolean;
    detectPronouns: boolean;
    classifyQuestions: boolean;
    contextWindow: number; // tours de contexte
  };
  
  // Données spécifiques X
  testInputs?: XInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<XDetails>;
  }>;
  
  // Callbacks spécialisés
  onActionVerbsAnalyzed?: (verbs: string[]) => void;
  onPronounUsageDetected?: (usage: {je: number, vous: number, nous: number}) => void;
  onQuestionTypeClassified?: (type: "OPEN" | "CLOSED" | "NONE") => void;
}

export interface YValidationProps extends BaseValidationProps {
  target: "Y";
  
  // Configuration spécifique Y AlgorithmLab
  yConfig: {
    analyzeSentiment: boolean;
    detectEmotion: boolean;
    classifyResponse: boolean;
    emotionThreshold: number; // 0-1
  };
  
  // Données spécifiques Y
  testInputs?: YInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<YDetails>;
  }>;
  
  // Callbacks spécialisés
  onSentimentAnalyzed?: (sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL") => void;
  onEmotionDetected?: (intensity: number) => void;
  onResponseClassified?: (type: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL") => void;
}

export interface M1ValidationProps extends BaseValidationProps {
  target: "M1";
  
  // Configuration spécifique M1 AlgorithmLab
  m1Config: {
    calculateLexicalDiversity: boolean;
    analyzeSyntacticComplexity: boolean;
    measureSemanticCoherence: boolean;
    linguisticDepth: "BASIC" | "ADVANCED" | "COMPREHENSIVE";
  };
  
  // Données spécifiques M1
  testInputs?: M1Input[];
  expectedOutputs?: Array<{
    score: number;
    details: Partial<M1Details>;
  }>;
  
  // Callbacks spécialisés
  onLexicalDiversityCalculated?: (diversity: number) => void;
  onSyntacticComplexityAnalyzed?: (complexity: number) => void;
  onSemanticCoherenceMeasured?: (coherence: number) => void;
}

export interface M2ValidationProps extends BaseValidationProps {
  target: "M2";
  
  // Configuration spécifique M2 AlgorithmLab
  m2Config: {
    calculateLexicalAlignment: boolean;
    calculateSyntacticAlignment: boolean;
    calculateSemanticAlignment: boolean;
    extractSharedTerms: boolean;
    distanceMetrics: Array<"euclidean" | "cosine" | "jaccard">;
  };
  
  // Données spécifiques M2
  testInputs?: M2Input[];
  expectedOutputs?: Array<{
    alignment: number;
    details: Partial<M2Details>;
  }>;
  
  // Callbacks spécialisés
  onAlignmentCalculated?: (
    lexical: number,
    syntactic: number,
    semantic: number,
    overall: number
  ) => void;
  onSharedTermsExtracted?: (terms: string[]) => void;
  onDistanceMetricsCalculated?: (metrics: {euclidean: number, cosine: number, jaccard: number}) => void;
}

export interface M3ValidationProps extends BaseValidationProps {
  target: "M3";
  
  // Configuration spécifique M3 AlgorithmLab
  m3Config: {
    assessCognitiveLoad: boolean;
    measureProcessingEfficiency: boolean;
    predictSatisfaction: boolean;
    predictCompliance: boolean;
    cognitiveMetrics: Array<"fluidity" | "attentionalFocus" | "workingMemoryUsage" | "executiveControl">;
  };
  
  // Données spécifiques M3
  testInputs?: M3Input[];
  expectedOutputs?: Array<{
    cognitiveScore: number;
    details: Partial<M3Details>;
  }>;
  
  // Callbacks spécialisés
  onCognitiveLoadAssessed?: (load: number) => void;
  onProcessingEfficiencyMeasured?: (efficiency: number) => void;
  onSatisfactionPredicted?: (satisfaction: number) => void;
  onCompliancePredicted?: (compliance: number) => void;
}

// ========================================================================
// FACTORY FUNCTIONS ALGORITHMLAB
// ========================================================================

export function createXValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<XValidationProps> = {}
): XValidationProps {
  return {
    callId,
    algorithmName,
    target: "X",
    xConfig: {
      analyzeActionVerbs: true,
      detectPronouns: true,
      classifyQuestions: true,
      contextWindow: 3,
      ...overrides.xConfig
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

export function createYValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<YValidationProps> = {}
): YValidationProps {
  return {
    callId,
    algorithmName,
    target: "Y",
    yConfig: {
      analyzeSentiment: true,
      detectEmotion: true,
      classifyResponse: true,
      emotionThreshold: 0.5,
      ...overrides.yConfig
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

export function createM2ValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<M2ValidationProps> = {}
): M2ValidationProps {
  return {
    callId,
    algorithmName,
    target: "M2",
    m2Config: {
      calculateLexicalAlignment: true,
      calculateSyntacticAlignment: true,
      calculateSemanticAlignment: true,
      extractSharedTerms: true,
      distanceMetrics: ["euclidean", "cosine", "jaccard"],
      ...overrides.m2Config
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

// ========================================================================
// UTILITAIRES DE VALIDATION UI ALGORITHMLAB
// ========================================================================

export type AllValidationProps = 
  | XValidationProps 
  | YValidationProps 
  | M1ValidationProps 
  | M2ValidationProps 
  | M3ValidationProps;

export function validateValidationProps(props: AllValidationProps): string[] {
  const errors: string[] = [];
  
  // Validation commune
  if (!props.callId) {
    errors.push("callId est requis");
  }
  
  if (!props.algorithmName) {
    errors.push("algorithmName est requis");
  }
  
  if (!props.target) {
    errors.push("target est requis");
  }
  
  // Validation spécifique par type
  switch (props.target) {
    case "X":
      const xProps = props as XValidationProps;
      if (xProps.xConfig.contextWindow < 0) {
        errors.push("contextWindow doit être positif");
      }
      break;
      
    case "Y":
      const yProps = props as YValidationProps;
      if (yProps.yConfig.emotionThreshold < 0 || yProps.yConfig.emotionThreshold > 1) {
        errors.push("emotionThreshold doit être entre 0 et 1");
      }
      break;
      
    case "M2":
      const m2Props = props as M2ValidationProps;
      if (m2Props.m2Config.distanceMetrics.length === 0) {
        errors.push("Au moins une métrique de distance doit être sélectionnée");
      }
      break;
  }
  
  return errors;
}

export function getValidationConfigDefaults(target: string): any {
  switch (target) {
    case "X":
      return {
        analyzeActionVerbs: true,
        detectPronouns: true,
        classifyQuestions: true,
        contextWindow: 3
      };
      
    case "Y":
      return {
        analyzeSentiment: true,
        detectEmotion: true,
        classifyResponse: true,
        emotionThreshold: 0.5
      };
      
    case "M1":
      return {
        calculateLexicalDiversity: true,
        analyzeSyntacticComplexity: true,
        measureSemanticCoherence: true,
        linguisticDepth: "ADVANCED"
      };
      
    case "M2":
      return {
        calculateLexicalAlignment: true,
        calculateSyntacticAlignment: true,
        calculateSemanticAlignment: true,
        extractSharedTerms: true,
        distanceMetrics: ["euclidean", "cosine", "jaccard"]
      };
      
    case "M3":
      return {
        assessCognitiveLoad: true,
        measureProcessingEfficiency: true,
        predictSatisfaction: true,
        predictCompliance: true,
        cognitiveMetrics: ["fluidity", "attentionalFocus", "workingMemoryUsage", "executiveControl"]
      };
      
    default:
      return {};
  }
}
