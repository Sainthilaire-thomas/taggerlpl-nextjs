#!/bin/bash

# ========================================================================
# Script 3/5 : Génération des types UI AlgorithmLab
# ========================================================================

echo "🎨 Script 3/5 : Génération des types UI AlgorithmLab"
echo "📍 Localisation: ./types/ui/"
echo ""

# Vérifier que les dépendances existent
if [[ ! -d "types/core" ]] || [[ ! -d "types/algorithms" ]]; then
    echo "❌ Erreur: Les dossiers types/core et types/algorithms doivent exister"
    echo "🔍 Exécutez d'abord: ./1-create-core-types.sh et ./2-create-algorithms-types.sh"
    exit 1
fi

# Créer la structure ui
echo "📁 Création de la structure types/ui/..."
mkdir -p types/ui

# ========================================================================
# types/ui/components.ts
# ========================================================================

echo "📝 Génération: types/ui/components.ts"

cat > "types/ui/components.ts" << 'EOF'
/**
 * @fileoverview Types de composants UI AlgorithmLab
 * Interfaces spécifiques aux composants d'interface AlgorithmLab
 */

import { ReactNode } from 'react';
import { VariableTarget } from '../core/variables';
import { ValidationMetrics } from '../core/validation';

// ========================================================================
// PROPS DE VALIDATION DE BASE ALGORITHMLAB
// ========================================================================

export interface BaseValidationProps {
  // Identifiants
  callId: string;
  algorithmName: string;
  
  // Configuration AlgorithmLab
  target: VariableTarget;
  autoValidate?: boolean;
  showMetrics?: boolean;
  
  // Données
  testData?: Array<{
    input: string;
    expected: string;
    metadata?: Record<string, any>;
  }>;
  
  // Callbacks
  onValidationComplete?: (metrics: ValidationMetrics) => void;
  onValidationError?: (error: Error) => void;
  onConfigChange?: (config: any) => void;
  
  // UI
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ========================================================================
// CONFIGURATION D'AFFICHAGE ALGORITHMLAB
// ========================================================================

export interface DisplayConfig {
  // Thème et apparence
  theme: "light" | "dark" | "auto";
  compact: boolean;
  showAdvanced: boolean;
  
  // Colonnes et sections
  visibleColumns: string[];
  collapsedSections: string[];
  
  // Métriques
  showConfidence: boolean;
  showProcessingTime: boolean;
  showMetadata: boolean;
  
  // Graphiques et visualisations
  chartsEnabled: boolean;
  animationsEnabled: boolean;
  colorScheme: "default" | "accessibility" | "colorblind";
  
  // Pagination et filtres
  pageSize: number;
  defaultFilters: Record<string, any>;
  sortOrder: "asc" | "desc";
  sortBy: string;
}

// ========================================================================
// INTERFACES DE CONFIGURATION ALGORITHMLAB
// ========================================================================

export interface ConfigFormProps {
  // Configuration actuelle
  config: Record<string, any>;
  
  // Schema de configuration
  schema: {
    [key: string]: {
      type: "string" | "number" | "boolean" | "select" | "multiselect";
      label: string;
      description?: string;
      required?: boolean;
      default?: any;
      options?: Array<{label: string, value: any}>;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    };
  };
  
  // Callbacks
  onChange: (config: Record<string, any>) => void;
  onSubmit?: (config: Record<string, any>) => void;
  onReset?: () => void;
  onValidate?: (config: Record<string, any>) => string[] | null;
  
  // UI
  layout: "vertical" | "horizontal" | "grid";
  showAdvanced: boolean;
  disabled?: boolean;
}

// ========================================================================
// INTERFACES DE RÉSULTATS ALGORITHMLAB
// ========================================================================

export interface ResultDisplayProps {
  // Données des résultats
  results: Array<{
    id: string;
    input: string;
    predicted: string;
    expected?: string;
    confidence: number;
    processingTime: number;
    metadata?: Record<string, any>;
  }>;
  
  // Configuration d'affichage
  displayConfig: DisplayConfig;
  
  // Interactions
  onResultSelect?: (id: string) => void;
  onResultEdit?: (id: string, newValue: string) => void;
  onResultDelete?: (id: string) => void;
  
  // Filtres et tri
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  
  // Actions groupées
  selectedResults?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

// ========================================================================
// MODALES ET DIALOGUES ALGORITHMLAB
// ========================================================================

export interface ModalProps {
  // État
  open: boolean;
  onClose: () => void;
  
  // Contenu
  title: string;
  content: ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
  }>;
  
  // Configuration
  size: "small" | "medium" | "large" | "fullscreen";
  closable: boolean;
  backdrop: boolean;
  escapeToClose: boolean;
  
  // Styles
  className?: string;
  contentClassName?: string;
}

// ========================================================================
// UTILITAIRES DE COMPOSANTS ALGORITHMLAB
// ========================================================================

export function createDefaultDisplayConfig(): DisplayConfig {
  return {
    theme: "auto",
    compact: false,
    showAdvanced: false,
    visibleColumns: ["input", "predicted", "confidence"],
    collapsedSections: [],
    showConfidence: true,
    showProcessingTime: true,
    showMetadata: false,
    chartsEnabled: true,
    animationsEnabled: true,
    colorScheme: "default",
    pageSize: 25,
    defaultFilters: {},
    sortOrder: "desc",
    sortBy: "confidence"
  };
}

export function validateConfigSchema(
  config: Record<string, any>,
  schema: ConfigFormProps['schema']
): string[] {
  const errors: string[] = [];
  
  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = config[key];
    
    // Champ requis
    if (fieldSchema.required && (value === undefined || value === null || value === "")) {
      errors.push(`${fieldSchema.label} est requis`);
      continue;
    }
    
    // Validation par type
    if (value !== undefined && value !== null) {
      switch (fieldSchema.type) {
        case "number":
          if (typeof value !== "number") {
            errors.push(`${fieldSchema.label} doit être un nombre`);
          } else {
            if (fieldSchema.validation?.min !== undefined && value < fieldSchema.validation.min) {
              errors.push(`${fieldSchema.label} doit être au moins ${fieldSchema.validation.min}`);
            }
            if (fieldSchema.validation?.max !== undefined && value > fieldSchema.validation.max) {
              errors.push(`${fieldSchema.label} ne peut pas dépasser ${fieldSchema.validation.max}`);
            }
          }
          break;
          
        case "string":
          if (typeof value !== "string") {
            errors.push(`${fieldSchema.label} doit être une chaîne de caractères`);
          } else if (fieldSchema.validation?.pattern) {
            const regex = new RegExp(fieldSchema.validation.pattern);
            if (!regex.test(value)) {
              errors.push(`${fieldSchema.label} ne respecte pas le format requis`);
            }
          }
          break;
          
        case "boolean":
          if (typeof value !== "boolean") {
            errors.push(`${fieldSchema.label} doit être vrai ou faux`);
          }
          break;
      }
    }
  }
  
  return errors;
}
EOF

# ========================================================================
# types/ui/validation.ts
# ========================================================================

echo "📝 Génération: types/ui/validation.ts"

cat > "types/ui/validation.ts" << 'EOF'
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
EOF

# ========================================================================
# types/ui/index.ts
# ========================================================================

echo "📝 Génération: types/ui/index.ts"

cat > "types/ui/index.ts" << 'EOF'
/**
 * @fileoverview Export centralisé des types UI AlgorithmLab
 * Point d'entrée principal pour tous les types d'interface utilisateur AlgorithmLab
 */

// Composants génériques
export * from './components';

// Validation spécialisée
export * from './validation';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  BaseValidationProps,
  DisplayConfig,
  ConfigFormProps,
  ResultDisplayProps,
  ModalProps
} from './components';

export type {
  XValidationProps,
  YValidationProps,
  M1ValidationProps,
  M2ValidationProps,
  M3ValidationProps,
  AllValidationProps
} from './validation';
EOF

# ========================================================================
# TEST DE COMPILATION
# ========================================================================

echo ""
echo "🔍 Test basique de syntaxe des fichiers ui générés..."

# Test simple de syntaxe TypeScript
for file in types/ui/*.ts; do
    if [[ -f "$file" ]]; then
        echo "   Vérification: $(basename "$file")"
        # Test basique de syntaxe
        if grep -q "export" "$file" && grep -q "interface\|type" "$file"; then
            echo "   ✅ Syntaxe OK"
        else
            echo "   ⚠️  Possible problème de syntaxe"
        fi
    fi
done

echo ""
echo "✅ Script 3/5 terminé avec succès!"
echo ""
echo "📊 Fichiers créés:"
echo "   - types/ui/components.ts (Composants et interfaces génériques)"
echo "   - types/ui/validation.ts (Props spécialisées par variable)"
echo "   - types/ui/index.ts (Export centralisé)"
echo ""
echo "🎯 Fonctionnalités clés:"
echo "   Props de validation spécialisées pour X, Y, M1, M2, M3"
echo "   Interfaces de configuration et d'affichage"
echo "   Factory functions pour création rapide de configs"
echo ""
echo "🚀 Prochaine étape:"
echo "   Exécuter: ./4-create-utils-types.sh"
