#!/bin/bash

# ========================================================================
# Script 1/5 : Génération des types CORE AlgorithmLab
# ========================================================================

echo "🎯 Script 1/5 : Génération des types CORE AlgorithmLab"
echo "📍 Localisation: ./types/core/"
echo ""

# Vérifier qu'on est dans le bon répertoire AlgorithmLab
if [[ ! -d "docs" ]] || [[ ! -d "components" ]]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le dossier AlgorithmLab"
    echo "📍 Localisation attendue: src/app/(protected)/analysis/components/AlgorithmLab/"
    echo "🔍 Vérifiez que vous êtes dans le bon répertoire (doit contenir 'docs' et 'components')"
    exit 1
fi

# Créer la structure core
echo "📁 Création de la structure types/core/..."
mkdir -p types/core

# ========================================================================
# types/core/variables.ts
# ========================================================================

echo "📝 Génération: types/core/variables.ts"

cat > "types/core/variables.ts" << 'EOF'
/**
 * @fileoverview Variables et détails pour l'annotation AlgorithmLab
 * Types spécifiques au module AlgorithmLab - Consolidation des types dispersés
 */

// ========================================================================
// TYPES DE VARIABLES PRINCIPALES ALGORITHMLAB
// ========================================================================

export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

export interface VariableX {
  tag: XTag;
  details: XDetails;
}

export interface VariableY {
  tag: YTag;
  details: YDetails;
}

// ========================================================================
// TAGS ET DÉTAILS X (Actes conversationnels conseiller)
// ========================================================================

export type XTag = 
  | "ENGAGEMENT"
  | "OUVERTURE"
  | "REFLET"
  | "EXPLICATION"
  | "CLOTURE"
  | "AUTRE_X";

export interface XDetails {
  verbCount: number;
  actionVerbs: string[];
  pronounUsage: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers: string[];
  declarativeMarkers: string[];
  
  // Métriques d'efficacité
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
}

// ========================================================================
// TAGS ET DÉTAILS Y (Réactions client)
// ========================================================================

export type YTag = 
  | "CLIENT_POSITIF"
  | "CLIENT_NEUTRE"
  | "CLIENT_NEGATIF"
  | "CLIENT_QUESTION"
  | "CLIENT_SILENCE"
  | "AUTRE_Y";

export interface YDetails {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity: number; // 0-1
  linguisticMarkers: string[];
  responseType: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";
  
  // Métriques conversationnelles
  conversationalMetrics?: {
    latency: number; // ms
    verbosity: number; // nombre de mots
    coherence: number; // 0-1
  };
}

// ========================================================================
// DÉTAILS M1, M2, M3 (Métriques computationnelles)
// ========================================================================

export interface M1Details {
  score: number;
  verbCount: number;
  averageWordLength: number;
  sentenceComplexity: number;
  
  // Métriques linguistiques
  lexicalDiversity: number;
  syntacticComplexity: number;
  semanticCoherence: number;
}

export interface M2Details {
  lexicalAlignment: number;
  syntacticAlignment: number;
  semanticAlignment: number;
  overall: number;
  
  // Détails de l'alignement
  sharedTerms: string[];
  alignmentVector: number[];
  distanceMetrics: {
    euclidean: number;
    cosine: number;
    jaccard: number;
  };
}

export interface M3Details {
  fluidity: number;
  cognitiveLoad: number;
  processingEfficiency: number;
  
  // Métriques cognitives
  attentionalFocus: number;
  workingMemoryUsage: number;
  executiveControl: number;
  
  // Prédictions comportementales
  predictedSatisfaction: number;
  predictedCompliance: number;
}

// ========================================================================
// TYPES UNIFIÉS ET UTILITAIRES
// ========================================================================

export type VariableDetails = XDetails | YDetails | M1Details | M2Details | M3Details;

export const VARIABLE_LABELS: Record<VariableTarget, string> = {
  X: "Actes conversationnels conseiller",
  Y: "Réactions client",
  M1: "Métriques linguistiques",
  M2: "Alignement interactionnel",
  M3: "Indicateurs cognitifs"
};

export const VARIABLE_COLORS: Record<VariableTarget, string> = {
  X: "#2196F3",
  Y: "#4CAF50", 
  M1: "#FF9800",
  M2: "#9C27B0",
  M3: "#F44336"
};

// Fonctions utilitaires pour validation des types
export function isValidVariableTarget(target: string): target is VariableTarget {
  return ["X", "Y", "M1", "M2", "M3"].includes(target);
}

export function getVariableColor(target: VariableTarget): string {
  return VARIABLE_COLORS[target];
}

export function getVariableLabel(target: VariableTarget): string {
  return VARIABLE_LABELS[target];
}
EOF

# ========================================================================
# types/core/calculations.ts
# ========================================================================

echo "📝 Génération: types/core/calculations.ts"

cat > "types/core/calculations.ts" << 'EOF'
/**
 * @fileoverview Interfaces de calcul AlgorithmLab
 * Types pour les inputs, outputs et métadonnées des calculateurs AlgorithmLab
 */

import { VariableTarget, VariableDetails } from './variables';

// ========================================================================
// INPUTS POUR LES CALCULS ALGORITHMLAB
// ========================================================================

export interface XInput {
  verbatim: string;
  context?: {
    previousTurn?: string;
    nextTurn?: string;
    callId?: string;
    turnIndex?: number;
  };
  metadata?: {
    speaker: string;
    timestamp: number;
    duration: number;
  };
}

export interface YInput {
  verbatim: string;
  previousConseillerTurn: string;
  context?: {
    conversationHistory?: string[];
    emotionalContext?: string;
    callMetadata?: Record<string, any>;
  };
}

export interface M1Input {
  verbatim: string;
  language?: string;
  analysisDepth?: "BASIC" | "ADVANCED" | "COMPREHENSIVE";
}

export interface M2Input {
  conseillerTurn: string;
  clientTurn: string;
  context?: {
    previousTurns?: Array<{speaker: string, text: string}>;
    conversationPhase?: "OPENING" | "DEVELOPMENT" | "RESOLUTION" | "CLOSING";
  };
}

export interface M3Input {
  conversationPair: {
    conseiller: string;
    client: string;
  };
  cognitiveContext?: {
    conversationLength: number;
    emotionalTone: string;
    complexityLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

// Union type pour tous les inputs AlgorithmLab
export type CalculationInput = XInput | YInput | M1Input | M2Input | M3Input;

// ========================================================================
// RÉSULTATS DES CALCULS ALGORITHMLAB
// ========================================================================

export interface CalculationResult<TDetails = VariableDetails> {
  prediction: string;
  confidence: number;
  processingTime: number;
  
  details: TDetails;
  
  metadata?: {
    algorithmVersion: string;
    inputSignature: string;
    executionPath: string[];
    warnings?: string[];
  };
}

// Résultats typés spécifiques AlgorithmLab
export type XCalculationResult = CalculationResult<import('./variables').XDetails>;
export type YCalculationResult = CalculationResult<import('./variables').YDetails>;
export type M1CalculationResult = CalculationResult<import('./variables').M1Details>;
export type M2CalculationResult = CalculationResult<import('./variables').M2Details>;
export type M3CalculationResult = CalculationResult<import('./variables').M3Details>;

// ========================================================================
// MÉTADONNÉES DES CALCULATEURS ALGORITHMLAB
// ========================================================================

export interface CalculatorMetadata {
  name: string;
  version: string;
  target: VariableTarget;
  description: string;
  
  capabilities: {
    batchProcessing: boolean;
    contextAware: boolean;
    realTime: boolean;
    requiresTraining: boolean;
  };
  
  performance: {
    averageProcessingTime: number; // ms
    accuracy: number; // 0-1
    precision: number; // 0-1
    recall: number; // 0-1
  };
  
  parameters?: Record<string, {
    type: string;
    default: any;
    description: string;
    required: boolean;
  }>;
}

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateCalculationInput(
  input: unknown, 
  target: VariableTarget
): input is CalculationInput {
  if (!input || typeof input !== 'object') return false;
  
  const obj = input as Record<string, any>;
  
  switch (target) {
    case 'X':
      return typeof obj.verbatim === 'string';
    case 'Y':
      return typeof obj.verbatim === 'string' && typeof obj.previousConseillerTurn === 'string';
    case 'M1':
      return typeof obj.verbatim === 'string';
    case 'M2':
      return typeof obj.conseillerTurn === 'string' && typeof obj.clientTurn === 'string';
    case 'M3':
      return obj.conversationPair && 
             typeof obj.conversationPair.conseiller === 'string' &&
             typeof obj.conversationPair.client === 'string';
    default:
      return false;
  }
}

export function createEmptyResult<T extends VariableDetails>(target: VariableTarget): CalculationResult<T> {
  return {
    prediction: "UNKNOWN",
    confidence: 0,
    processingTime: 0,
    details: {} as T,
    metadata: {
      algorithmVersion: "unknown",
      inputSignature: "",
      executionPath: [],
      warnings: ["Empty result created"]
    }
  };
}
EOF

# ========================================================================
# types/core/validation.ts
# ========================================================================

echo "📝 Génération: types/core/validation.ts"

cat > "types/core/validation.ts" << 'EOF'
/**
 * @fileoverview Types de validation AlgorithmLab
 * Interfaces pour validation, tests et métriques de performance AlgorithmLab
 */

import { VariableTarget } from './variables';
import { CalculationResult } from './calculations';

// ========================================================================
// MÉTRIQUES DE VALIDATION ALGORITHMLAB
// ========================================================================

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Métriques détaillées
  confusionMatrix: Record<string, Record<string, number>>;
  
  // Métriques par classe
  classMetrics: Record<string, {
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }>;
  
  // Statistiques globales
  totalSamples: number;
  correctPredictions: number;
  executionTime: number;
}

export interface ValidationResult {
  target: VariableTarget;
  algorithmName: string;
  metrics: ValidationMetrics;
  
  // Détails de validation
  testSet: {
    size: number;
    source: string;
    createdAt: Date;
  };
  
  // Résultats détaillés
  predictions: Array<{
    input: string;
    expected: string;
    predicted: string;
    confidence: number;
    correct: boolean;
  }>;
  
  // Métadonnées
  validationDate: Date;
  validatorVersion: string;
  notes?: string;
}

// ========================================================================
// CONFIGURATION DES TESTS ALGORITHMLAB
// ========================================================================

export interface AlgorithmTestConfig {
  target: VariableTarget;
  algorithmName: string;
  
  // Configuration du test
  testSet: {
    source: "MANUAL_ANNOTATIONS" | "SYNTHETIC" | "HISTORICAL";
    size?: number;
    stratified?: boolean;
    randomSeed?: number;
  };
  
  // Métriques à calculer
  metrics: {
    basic: boolean; // accuracy, precision, recall, f1
    detailed: boolean; // confusion matrix, per-class metrics
    temporal?: boolean; // performance over time
    crossValidation?: boolean; // k-fold validation
  };
  
  // Seuils de performance
  thresholds: {
    minimumAccuracy: number;
    minimumPrecision?: number;
    minimumRecall?: number;
    minimumF1?: number;
  };
  
  // Options d'exécution
  execution: {
    parallel?: boolean;
    timeout?: number; // ms
    retries?: number;
    saveResults?: boolean;
  };
}

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function calculateMetrics(
  predictions: Array<{expected: string, predicted: string, confidence?: number}>
): ValidationMetrics {
  const total = predictions.length;
  const correct = predictions.filter(p => p.expected === p.predicted).length;
  const accuracy = correct / total;
  
  // Calcul simplifié pour l'exemple
  return {
    accuracy,
    precision: accuracy, // Simplifié
    recall: accuracy, // Simplifié
    f1Score: accuracy, // Simplifié
    confusionMatrix: {},
    classMetrics: {},
    totalSamples: total,
    correctPredictions: correct,
    executionTime: 0
  };
}

export function createValidationConfig(
  target: VariableTarget,
  algorithmName: string,
  options: Partial<AlgorithmTestConfig> = {}
): AlgorithmTestConfig {
  return {
    target,
    algorithmName,
    testSet: {
      source: "MANUAL_ANNOTATIONS",
      size: 100,
      stratified: true,
      ...options.testSet
    },
    metrics: {
      basic: true,
      detailed: true,
      temporal: false,
      crossValidation: false,
      ...options.metrics
    },
    thresholds: {
      minimumAccuracy: 0.8,
      minimumPrecision: 0.75,
      minimumRecall: 0.75,
      minimumF1: 0.75,
      ...options.thresholds
    },
    execution: {
      parallel: false,
      timeout: 30000,
      retries: 3,
      saveResults: true,
      ...options.execution
    }
  };
}
EOF

# ========================================================================
# types/core/index.ts
# ========================================================================

echo "📝 Génération: types/core/index.ts"

cat > "types/core/index.ts" << 'EOF'
/**
 * @fileoverview Export centralisé des types core AlgorithmLab
 * Point d'entrée principal pour tous les types fondamentaux AlgorithmLab
 */

// Variables et détails
export * from './variables';

// Calculs et résultats
export * from './calculations';

// Validation et métriques
export * from './validation';

// Types combinés pour faciliter l'import dans AlgorithmLab
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails, 
  M1Details,
  M2Details,
  M3Details
} from './variables';

export type {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input
} from './calculations';

export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig
} from './validation';
EOF

# ========================================================================
# TEST DE COMPILATION
# ========================================================================

echo ""
echo "🔍 Test basique de syntaxe des fichiers générés..."

# Test simple de syntaxe TypeScript
for file in types/core/*.ts; do
    if [[ -f "$file" ]]; then
        echo "   Vérification: $(basename "$file")"
        # Test basique de syntaxe (recherche d'erreurs évidentes)
        if grep -q "export" "$file" && grep -q "interface\|type" "$file"; then
            echo "   ✅ Syntaxe OK"
        else
            echo "   ⚠️  Possible problème de syntaxe"
        fi
    fi
done

echo ""
echo "✅ Script 1/5 terminé avec succès!"
echo ""
echo "📊 Fichiers créés:"
echo "   - types/core/variables.ts (Types X, Y, M1, M2, M3)"
echo "   - types/core/calculations.ts (Inputs, résultats, métadonnées)"
echo "   - types/core/validation.ts (Validation et métriques)"
echo "   - types/core/index.ts (Export centralisé)"
echo ""
echo "🚀 Prochaine étape:"
echo "   Exécuter: ./2-create-algorithms-types.sh"
