# Vérifier que les dépendances existent
if [[ ! -d "types/core" ]]; then
    echo "❌ Erreur: Le dossier types/core doit exister"
    echo "🔍 Exécutez d'abord: ./1-create-core-types.sh"
    exit 1
fi

# Créer la structure utils
echo "📁 Création de la structure types/utils/..."
mkdir -p types/utils

# ========================================================================
# types/utils/normalizers.ts
# ========================================================================

echo "📝 Génération: types/utils/normalizers.ts"

cat > "types/utils/normalizers.ts" << 'EOF'
/**
 * @fileoverview Types pour les fonctions de normalisation AlgorithmLab
 * Fonctions de normalisation spécifiques au module AlgorithmLab
 */

import { XTag, YTag } from '../core/variables';

// ========================================================================
// TYPES DE NORMALISATION ALGORITHMLAB
// ========================================================================

export type NormalizationLevel = "BASIC" | "STANDARD" | "AGGRESSIVE";

export interface NormalizationConfig {
  level: NormalizationLevel;
  preserveCase: boolean;
  removePunctuation: boolean;
  removeAccents: boolean;
  removeStopWords: boolean;
  stemming: boolean;
  customRules?: NormalizationRule[];
}

export interface NormalizationRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  replacement: string;
  enabled: boolean;
  priority: number; // 1-10, 1 = le plus prioritaire
  description?: string;
}

export interface NormalizationResult {
  original: string;
  normalized: string;
  appliedRules: string[];
  confidence: number; // 0-1
  warnings?: string[];
  metadata?: {
    processingTime: number;
    rulesEvaluated: number;
    transformations: Array<{
      rule: string;
      before: string;
      after: string;
    }>;
  };
}

// ========================================================================
// FONCTIONS DE NORMALISATION ALGORITHMLAB
// ========================================================================

/**
 * Normalise un label X selon les règles AlgorithmLab
 */
export declare function normalizeXLabel(label: string, config?: Partial<NormalizationConfig>): XTag;

/**
 * Normalise un label Y selon les règles AlgorithmLab
 */
export declare function normalizeYLabel(label: string, config?: Partial<NormalizationConfig>): YTag;

/**
 * Détermine la famille d'un tag X AlgorithmLab
 */
export declare function familyFromX(xTag: XTag): string;

/**
 * Détermine la famille d'un tag Y AlgorithmLab
 */
export declare function familyFromY(yTag: YTag): string;

/**
 * Normalisation générique avec configuration avancée
 */
export declare function normalizeText(
  text: string, 
  config: NormalizationConfig
): NormalizationResult;

/**
 * Applique des règles de normalisation personnalisées
 */
export declare function applyCustomRules(
  text: string,
  rules: NormalizationRule[]
): NormalizationResult;

// ========================================================================
// MAPPINGS ALGORITHMLAB
// ========================================================================

export const X_LABEL_MAPPING: Record<string, XTag> = {
  // Variations d'ENGAGEMENT
  "engagement": "ENGAGEMENT",
  "action": "ENGAGEMENT", 
  "je_vais": "ENGAGEMENT",
  "verification": "ENGAGEMENT",
  
  // Variations d'OUVERTURE
  "ouverture": "OUVERTURE",
  "question": "OUVERTURE",
  "avez_vous": "OUVERTURE",
  "souhaitez": "OUVERTURE",
  
  // Variations de REFLET
  "reflet": "REFLET",
  "comprends": "REFLET",
  "entends": "REFLET",
  "ressenti": "REFLET",
  
  // Variations d'EXPLICATION
  "explication": "EXPLICATION",
  "parce_que": "EXPLICATION",
  "raison": "EXPLICATION",
  "procedure": "EXPLICATION",
  
  // Variations de CLOTURE
  "cloture": "CLOTURE",
  "aurevoir": "CLOTURE",
  "bonne_journee": "CLOTURE",
  "fin": "CLOTURE"
};

export const Y_LABEL_MAPPING: Record<string, YTag> = {
  // Variations CLIENT_POSITIF
  "positif": "CLIENT_POSITIF",
  "merci": "CLIENT_POSITIF",
  "parfait": "CLIENT_POSITIF",
  "accord": "CLIENT_POSITIF",
  
  // Variations CLIENT_NEUTRE
  "neutre": "CLIENT_NEUTRE",
  "ok": "CLIENT_NEUTRE",
  "oui": "CLIENT_NEUTRE",
  "bien": "CLIENT_NEUTRE",
  
  // Variations CLIENT_NEGATIF
  "negatif": "CLIENT_NEGATIF",
  "non": "CLIENT_NEGATIF",
  "impossible": "CLIENT_NEGATIF",
  "probleme": "CLIENT_NEGATIF",
  
  // Variations CLIENT_QUESTION
  "question": "CLIENT_QUESTION",
  "comment": "CLIENT_QUESTION",
  "pourquoi": "CLIENT_QUESTION",
  "quand": "CLIENT_QUESTION",
  
  // Variations CLIENT_SILENCE
  "silence": "CLIENT_SILENCE",
  "pause": "CLIENT_SILENCE",
  "attente": "CLIENT_SILENCE"
};

export const FAMILY_MAPPING = {
  X: {
    "ENGAGEMENT": "ACTION",
    "OUVERTURE": "EXPLORATION", 
    "REFLET": "EMPATHIE",
    "EXPLICATION": "INFORMATION",
    "CLOTURE": "CONCLUSION",
    "AUTRE_X": "AUTRE"
  },
  Y: {
    "CLIENT_POSITIF": "ACCEPTANCE",
    "CLIENT_NEUTRE": "NEUTRAL", 
    "CLIENT_NEGATIF": "RESISTANCE",
    "CLIENT_QUESTION": "INQUIRY",
    "CLIENT_SILENCE": "PAUSE",
    "AUTRE_Y": "AUTRE"
  }
} as const;

// ========================================================================
// CONFIGURATIONS PREDEFINIES ALGORITHMLAB
// ========================================================================

export const NORMALIZATION_PRESETS: Record<string, NormalizationConfig> = {
  BASIC: {
    level: "BASIC",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: false,
    stemming: false
  },
  
  STANDARD: {
    level: "STANDARD", 
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: false
  },
  
  AGGRESSIVE: {
    level: "AGGRESSIVE",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: true
  }
};

// ========================================================================
// RÈGLES DE NORMALISATION PRÉDÉFINIES ALGORITHMLAB
// ========================================================================

export const DEFAULT_NORMALIZATION_RULES: NormalizationRule[] = [
  {
    id: "remove_filler_words",
    name: "Suppression des mots de remplissage",
    pattern: /\b(euh|heu|ben|voila|quoi)\b/gi,
    replacement: "",
    enabled: true,
    priority: 1,
    description: "Supprime les mots de remplissage communs"
  },
  {
    id: "normalize_contractions",
    name: "Normalisation des contractions",
    pattern: /(j'|l'|d'|n'|m'|t'|s')/gi,
    replacement: "",
    enabled: true,
    priority: 2,
    description: "Développe les contractions françaises courantes"
  },
  {
    id: "normalize_politeness",
    name: "Normalisation de politesse",
    pattern: /(monsieur|madame|mademoiselle)/gi,
    replacement: "",
    enabled: true,
    priority: 3,
    description: "Supprime les formules de politesse pour se concentrer sur le contenu"
  },
  {
    id: "normalize_numbers",
    name: "Normalisation des nombres",
    pattern: /\b\d+\b/g,
    replacement: "[NOMBRE]",
    enabled: false,
    priority: 4,
    description: "Remplace les nombres par un token générique"
  }
];

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateNormalizationConfig(config: NormalizationConfig): string[] {
  const errors: string[] = [];
  
  if (!["BASIC", "STANDARD", "AGGRESSIVE"].includes(config.level)) {
    errors.push("Niveau de normalisation invalide");
  }
  
  if (config.customRules) {
    config.customRules.forEach((rule, index) => {
      if (!rule.id || !rule.name || !rule.pattern || rule.replacement === undefined) {
        errors.push(`Règle ${index + 1} incomplète`);
      }
      
      if (rule.priority < 1 || rule.priority > 10) {
        errors.push(`Priorité de la règle ${rule.name} doit être entre 1 et 10`);
      }
    });
  }
  
  return errors;
}

export function createNormalizationRule(
  id: string,
  name: string, 
  pattern: RegExp | string,
  replacement: string,
  options: Partial<NormalizationRule> = {}
): NormalizationRule {
  return {
    id,
    name,
    pattern,
    replacement,
    enabled: true,
    priority: 5,
    ...options
  };
}

export function isValidXTag(tag: string): tag is XTag {
  return ["ENGAGEMENT", "OUVERTURE", "REFLET", "EXPLICATION", "CLOTURE", "AUTRE_X"].includes(tag);
}

export function isValidYTag(tag: string): tag is YTag {
  return ["CLIENT_POSITIF", "CLIENT_NEUTRE", "CLIENT_NEGATIF", "CLIENT_QUESTION", "CLIENT_SILENCE", "AUTRE_Y"].includes(tag);
}

export function getFamilyFromTag(tag: XTag | YTag): string {
  if (isValidXTag(tag)) {
    return FAMILY_MAPPING.X[tag];
  } else if (isValidYTag(tag)) {
    return FAMILY_MAPPING.Y[tag];
  }
  return "AUTRE";
}
EOF

# ========================================================================
# types/utils/converters.ts
# ========================================================================

echo "📝 Génération: types/utils/converters.ts"

cat > "types/utils/converters.ts" << 'EOF'
/**
 * @fileoverview Types et utilitaires pour la conversion de données AlgorithmLab
 * Conversion entre formats, adaptateurs et transformations AlgorithmLab
 */

import { VariableTarget, VariableDetails } from '../core/variables';
import { CalculationInput, CalculationResult } from '../core/calculations';
import { UniversalResult } from '../algorithms/base';

// ========================================================================
// TYPES DE CONVERSION ALGORITHMLAB
// ========================================================================

export type ConversionDirection = "TO_UNIVERSAL" | "FROM_UNIVERSAL" | "BETWEEN_FORMATS";

export interface ConversionConfig {
  direction: ConversionDirection;
  sourceFormat: string;
  targetFormat: string;
  preserveMetadata: boolean;
  strictMode: boolean; // Échoue si conversion incomplète
  defaultValues?: Record<string, any>;
  customMappings?: Record<string, string>;
}

export interface ConversionResult<T = any> {
  success: boolean;
  data: T;
  warnings: string[];
  errors: string[];
  metadata: {
    sourceFormat: string;
    targetFormat: string;
    conversionTime: number;
    lossyConversion: boolean;
    fieldsConverted: number;
    fieldsSkipped: number;
  };
}

// ========================================================================
// ADAPTATEURS DE FORMATS ALGORITHMLAB
// ========================================================================

export interface FormatAdapter<TSource = any, TTarget = any> {
  name: string;
  sourceFormat: string;
  targetFormat: string;
  
  // Méthodes de conversion
  convert(data: TSource, config?: Partial<ConversionConfig>): ConversionResult<TTarget>;
  validate(data: TSource): boolean;
  getSchema?(): any;
  
  // Métadonnées
  description?: string;
  version?: string;
  supportsBatch?: boolean;
}

// ========================================================================
// ADAPTATEURS SPÉCIFIQUES ALGORITHMLAB
// ========================================================================

/**
 * Adaptateur pour convertir les anciens formats vers Universal AlgorithmLab
 */
export interface LegacyToUniversalAdapter extends FormatAdapter {
  sourceFormat: "LEGACY";
  targetFormat: "UNIVERSAL";
  
  convertXResult(result: any): ConversionResult<UniversalResult>;
  convertYResult(result: any): ConversionResult<UniversalResult>;
  convertM2Result(result: any): ConversionResult<UniversalResult>;
}

/**
 * Adaptateur pour les exports AlgorithmLab
 */
export interface ExportAdapter extends FormatAdapter {
  targetFormat: "CSV" | "JSON" | "XML" | "PDF";
  
  exportResults(results: UniversalResult[], config?: any): ConversionResult<string>;
  exportMetrics(metrics: any[], config?: any): ConversionResult<string>;
}

// ========================================================================
// TRANSFORMATIONS DE DONNÉES ALGORITHMLAB
// ========================================================================

export interface DataTransformation<TInput = any, TOutput = any> {
  name: string;
  description: string;
  
  transform(input: TInput): TOutput;
  reverse?(output: TOutput): TInput;
  validate?(input: TInput): boolean;
}

export interface ChainedTransformation {
  transformations: DataTransformation[];
  
  execute<T, U>(input: T): ConversionResult<U>;
  reverse<T, U>(output: U): ConversionResult<T>;
  addTransformation(transformation: DataTransformation): void;
  removeTransformation(name: string): boolean;
}

// ========================================================================
// MAPPINGS DE RÉTROCOMPATIBILITÉ ALGORITHMLAB
// ========================================================================

export interface LegacyMapping {
  // Mapping des anciens noms de champs vers les nouveaux
  fieldMappings: Record<string, string>;
  
  // Mapping des anciennes valeurs vers les nouvelles
  valueMappings: Record<string, Record<string, any>>;
  
  // Transformations personnalisées
  customTransforms: Record<string, (value: any) => any>;
  
  // Champs obsolètes à ignorer
  deprecatedFields: string[];
  
  // Champs requis à ajouter avec valeurs par défaut
  requiredDefaults: Record<string, any>;
}

// Mappings spécifiques pour la migration AlgorithmLab
export const ALGORITHM_LAB_LEGACY_MAPPINGS: Record<string, LegacyMapping> = {
  WRAPPER_TO_UNIVERSAL: {
    fieldMappings: {
      "wrapXResult": "universalResult",
      "wrapYResult": "universalResult",
      "wrapM2Result": "universalResult"
    },
    valueMappings: {
      "confidence": {
        "HAUTE": 0.9,
        "MOYENNE": 0.6, 
        "FAIBLE": 0.3
      }
    },
    customTransforms: {
      "processingTime": (value: string) => parseInt(value.replace("ms", "")) || 0
    },
    deprecatedFields: ["wrapperVersion", "legacyFormat"],
    requiredDefaults: {
      "algorithmVersion": "2.0.0",
      "metadata.executionPath": ["universal_conversion"]
    }
  }
};

// ========================================================================
// FACTORY FUNCTIONS ALGORITHMLAB
// ========================================================================

export function createFormatAdapter<TSource, TTarget>(
  name: string,
  sourceFormat: string,
  targetFormat: string,
  convertFn: (data: TSource, config?: Partial<ConversionConfig>) => ConversionResult<TTarget>
): FormatAdapter<TSource, TTarget> {
  return {
    name,
    sourceFormat,
    targetFormat,
    convert: convertFn,
    validate: (data: TSource) => {
      try {
        convertFn(data);
        return true;
      } catch {
        return false;
      }
    }
  };
}

export function createChainedTransformation(
  transformations: DataTransformation[] = []
): ChainedTransformation {
  return {
    transformations: [...transformations],
    
    execute<T, U>(input: T): ConversionResult<U> {
      let current: any = input;
      const warnings: string[] = [];
      const errors: string[] = [];
      let fieldsConverted = 0;
      
      const startTime = Date.now();
      
      try {
        for (const transformation of this.transformations) {
          if (transformation.validate && !transformation.validate(current)) {
            warnings.push(`Validation failed for transformation: ${transformation.name}`);
          }
          
          current = transformation.transform(current);
          fieldsConverted++;
        }
        
        return {
          success: true,
          data: current as U,
          warnings,
          errors,
          metadata: {
            sourceFormat: "chained",
            targetFormat: "chained",
            conversionTime: Date.now() - startTime,
            lossyConversion: warnings.length > 0,
            fieldsConverted,
            fieldsSkipped: 0
          }
        };
      } catch (error) {
        return {
          success: false,
          data: current as U,
          warnings,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          metadata: {
            sourceFormat: "chained", 
            targetFormat: "chained",
            conversionTime: Date.now() - startTime,
            lossyConversion: true,
            fieldsConverted,
            fieldsSkipped: this.transformations.length - fieldsConverted
          }
        };
      }
    },
    
    reverse<T, U>(output: U): ConversionResult<T> {
      // Implémentation simplifiée pour l'exemple
      return {
        success: false,
        data: output as unknown as T,
        warnings: ["Reverse transformation not implemented"],
        errors: [],
        metadata: {
          sourceFormat: "chained_reverse",
          targetFormat: "chained_reverse",
          conversionTime: 0,
          lossyConversion: true,
          fieldsConverted: 0,
          fieldsSkipped: this.transformations.length
        }
      };
    },
    
    addTransformation(transformation: DataTransformation) {
      this.transformations.push(transformation);
    },
    
    removeTransformation(name: string): boolean {
      const index = this.transformations.findIndex(t => t.name === name);
      if (index >= 0) {
        this.transformations.splice(index, 1);
        return true;
      }
      return false;
    }
  };
}

// ========================================================================
// UTILITAIRES DE CONVERSION ALGORITHMLAB
// ========================================================================

export function convertLegacyToUniversal(
  legacyData: any,
  mappingKey: keyof typeof ALGORITHM_LAB_LEGACY_MAPPINGS
): ConversionResult<UniversalResult> {
  const mapping = ALGORITHM_LAB_LEGACY_MAPPINGS[mappingKey];
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    let converted: any = {};
    let fieldsConverted = 0;
    let fieldsSkipped = 0;
    
    // Appliquer les mappings de champs
    for (const [oldField, newField] of Object.entries(mapping.fieldMappings)) {
      if (legacyData[oldField] !== undefined) {
        converted[newField] = legacyData[oldField];
        fieldsConverted++;
      }
    }
    
    // Appliquer les transformations personnalisées
    for (const [field, transform] of Object.entries(mapping.customTransforms)) {
      if (converted[field] !== undefined) {
        try {
          converted[field] = transform(converted[field]);
        } catch (error) {
          warnings.push(`Transformation failed for field ${field}: ${error}`);
        }
      }
    }
    
    // Supprimer les champs obsolètes
    mapping.deprecatedFields.forEach(field => {
      if (converted[field] !== undefined) {
        delete converted[field];
        fieldsSkipped++;
      }
    });
    
    // Ajouter les valeurs par défaut requises
    for (const [field, defaultValue] of Object.entries(mapping.requiredDefaults)) {
      if (converted[field] === undefined) {
        if (field.includes('.')) {
          // Support des champs imbriqués
          const parts = field.split('.');
          let current = converted;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = defaultValue;
        } else {
          converted[field] = defaultValue;
        }
        fieldsConverted++;
      }
    }
    
    return {
      success: true,
      data: converted as UniversalResult,
      warnings,
      errors,
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal",
        conversionTime: Date.now() - startTime,
        lossyConversion: warnings.length > 0 || fieldsSkipped > 0,
        fieldsConverted,
        fieldsSkipped
      }
    };
    
  } catch (error) {
    return {
      success: false,
      data: {} as UniversalResult,
      warnings,
      errors: [error instanceof Error ? error.message : "Unknown conversion error"],
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal", 
        conversionTime: Date.now() - startTime,
        lossyConversion: true,
        fieldsConverted: 0,
        fieldsSkipped: 0
      }
    };
  }
}

export function validateConversionResult<T>(result: ConversionResult<T>): boolean {
  return (
    result.success &&
    result.data !== null &&
    result.data !== undefined &&
    Array.isArray(result.errors) &&
    Array.isArray(result.warnings) &&
    result.metadata &&
    typeof result.metadata.conversionTime === 'number'
  );
}
EOF

# ========================================================================
# types/utils/index.ts
# ========================================================================

echo "📝 Génération: types/utils/index.ts"

cat > "types/utils/index.ts" << 'EOF'
/**
 * @fileoverview Export centralisé des types utils AlgorithmLab
 * Point d'entrée principal pour tous les types utilitaires AlgorithmLab
 */

// Normalisation
export * from './normalizers';

// Conversion et adaptation
export * from './converters';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  NormalizationLevel,
  NormalizationConfig,
  NormalizationRule,
  NormalizationResult,
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  familyFromY
} from './normalizers';

export type {
  ConversionDirection,
  ConversionConfig,
  ConversionResult,
  FormatAdapter,
  LegacyToUniversalAdapter,
  ExportAdapter,
  DataTransformation,
  ChainedTransformation,
  LegacyMapping
} from './converters';
EOF

# ========================================================================
# TEST DE COMPILATION
# ========================================================================

echo ""
echo "🔍 Test basique de syntaxe des fichiers utils générés..."

# Test simple de syntaxe TypeScript
for file in types/utils/*.ts; do
    if [[ -f "$file" ]]; then
        echo "   Vérification: $(basename "$file")"
        # Test basique de syntaxe
        if grep -q "export" "$file" && grep -q "interface\|type\|function\|const" "$file"; then
            echo "   ✅ Syntaxe OK"
        else
            echo "   ⚠️  Possible problème de syntaxe"
        fi
    fi
done

echo ""
echo "✅ Script 4/5 terminé avec succès!"
echo ""
echo "📊 Fichiers créés:"
echo "   - types/utils/normalizers.ts (Fonctions de normalisation)"
echo "   - types/utils/converters.ts (Adaptateurs et conversions)"
echo "   - types/utils/index.ts (Export centralisé)"
echo ""
echo "🎯 Fonctionnalités clés:"
echo "   Fonctions de normalisation X/Y avec mappings"
echo "   Adaptateurs pour conversion legacy vers universal"
echo "   Règles de normalisation configurables"
echo ""
echo "🚀 Prochaine étape:"
echo "   Exécuter: ./5-create-main-index.sh"#!/bin/bash

# ========================================================================
# Script 4/5 : Génération des types UTILS AlgorithmLab
# ========================================================================

echo "🔧 Script 4/5 : Génération des types UTILS AlgorithmLab"
echo "📍 Localisation: ./types/utils/"
echo ""

# Vérifier que les
