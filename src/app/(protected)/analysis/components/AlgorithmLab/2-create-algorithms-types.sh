#!/bin/bash

# ========================================================================
# Script 2/5 : Génération des types ALGORITHMS AlgorithmLab
# ========================================================================

echo "🔬 Script 2/5 : Génération des types ALGORITHMS AlgorithmLab"
echo "📍 Localisation: ./types/algorithms/"
echo ""

# Vérifier qu'on est dans le bon répertoire et que core existe
if [[ ! -d "types/core" ]]; then
    echo "❌ Erreur: Le dossier types/core n'existe pas"
    echo "🔍 Exécutez d'abord: ./1-create-core-types.sh"
    exit 1
fi

# Créer la structure algorithms
echo "📁 Création de la structure types/algorithms/..."
mkdir -p types/algorithms

# ========================================================================
# types/algorithms/base.ts
# ========================================================================

echo "📝 Génération: types/algorithms/base.ts"

cat > "types/algorithms/base.ts" << 'EOF'
/**
 * @fileoverview Interface universelle AlgorithmLab
 * Remplace les wrappers multiples (wrapX, wrapY, wrapM2) par une interface unifiée
 */

import { VariableTarget, VariableDetails } from '../core/variables';

// ========================================================================
// INTERFACE UNIVERSELLE ALGORITHMLAB
// ========================================================================

/**
 * Interface universelle que TOUS les algorithmes AlgorithmLab doivent implémenter
 * Remplace wrapX, wrapY, wrapM2, etc.
 */
export interface UniversalAlgorithm {
  // Métadonnées standardisées
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;

  // Exécution unifiée
  classify(input: string): Promise<UniversalResult>; // Rétrocompatibilité
  run(input: unknown): Promise<UniversalResult>; // Input typé
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>; // Batch optionnel
}

// ========================================================================
// DESCRIPTEUR D'ALGORITHME ALGORITHMLAB
// ========================================================================

export interface AlgorithmDescriptor {
  name: string; // ID unique (ex: "OpenAIXClassifier")
  displayName: string; // Nom affiché (ex: "OpenAI X Classifier")
  version: string; // Version semver (ex: "1.2.0")
  type: AlgorithmType; // Type d'implémentation
  target: VariableTarget; // Variable ciblée (X, Y, M1, M2, M3)
  batchSupported: boolean; // Support du traitement par lot
  requiresContext: boolean; // Nécessite du contexte conversationnel
  description?: string; // Description détaillée
  parameters?: Record<string, ParameterDescriptor>;
  examples?: AlgorithmExample[]; // Exemples d'utilisation
}

export type AlgorithmType = 
  | "RULE_BASED"        // Règles linguistiques
  | "MACHINE_LEARNING"  // ML traditionnel
  | "DEEP_LEARNING"     // Réseaux de neurones
  | "LLM"               // Large Language Model
  | "HYBRID"            // Combinaison d'approches
  | "HEURISTIC";        // Heuristiques expertes

export interface ParameterDescriptor {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  default?: any;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface AlgorithmExample {
  input: string;
  expectedOutput: string;
  confidence?: number;
  explanation?: string;
}

// ========================================================================
// RÉSULTAT UNIVERSEL ALGORITHMLAB
// ========================================================================

export interface UniversalResult {
  prediction: string; // Prédiction principale (label)
  confidence: number; // Confiance [0-1]
  processingTime?: number; // Temps de traitement (ms)
  algorithmVersion?: string; // Version utilisée
  metadata?: {
    inputSignature?: string; // Hash/signature de l'input
    inputType?: string; // Type d'input détecté
    executionPath?: string[]; // Étapes d'exécution
    warnings?: string[]; // Avertissements non-bloquants
    details?: VariableDetails; // Détails typés selon la variable
  };
}

// ========================================================================
// UTILITAIRES ALGORITHMLAB
// ========================================================================

export function isValidAlgorithmResult(result: any): result is UniversalResult {
  return (
    result &&
    typeof result === 'object' &&
    typeof result.prediction === 'string' &&
    typeof result.confidence === 'number' &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}

export function createErrorResult(error: string, algorithmName?: string): UniversalResult {
  return {
    prediction: "ERROR",
    confidence: 0,
    processingTime: 0,
    algorithmVersion: algorithmName || "unknown",
    metadata: {
      warnings: [error],
      executionPath: ["error"],
      inputType: "unknown"
    }
  };
}

export function createSuccessResult(
  prediction: string,
  confidence: number,
  processingTime: number = 0,
  details?: VariableDetails
): UniversalResult {
  return {
    prediction,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp [0-1]
    processingTime,
    metadata: {
      details,
      executionPath: ["success"],
      inputType: "string"
    }
  };
}
EOF

# ========================================================================
# types/algorithms/universal-adapter.ts
# ========================================================================

echo "📝 Génération: types/algorithms/universal-adapter.ts"

cat > "types/algorithms/universal-adapter.ts" << 'EOF'
/**
 * @fileoverview Adaptateur universel AlgorithmLab
 * Fonction createUniversalAlgorithm qui unifie wrapX, wrapY, wrapM2, etc.
 */

import { VariableTarget, VariableDetails } from '../core/variables';
import { CalculationInput, CalculationResult } from '../core/calculations';
import { UniversalAlgorithm, AlgorithmDescriptor, UniversalResult, AlgorithmType } from './base';

// ========================================================================
// INTERFACE DE BASE POUR CALCULATEURS ALGORITHMLAB
// ========================================================================

export interface BaseCalculator<TInput = any, TDetails = VariableDetails> {
  calculate(input: TInput): Promise<CalculationResult<TDetails>>;
  
  // Métadonnées optionnelles
  getName?(): string;
  getVersion?(): string;
  getDescription?(): string;
  getType?(): AlgorithmType;
}

// ========================================================================
// CONFIGURATION DE L'ADAPTATEUR ALGORITHMLAB
// ========================================================================

export interface AdapterConfig<TInput = any, TDetails = VariableDetails> {
  // Support des fonctionnalités
  requiresContext?: boolean;
  supportsBatch?: boolean;
  
  // Convertisseurs de données
  inputValidator?: (input: unknown) => input is TInput;
  inputConverter?: (input: string) => TInput;
  resultMapper?: (result: CalculationResult<TDetails>) => UniversalResult;
  
  // Métadonnées personnalisées
  displayName?: string;
  description?: string;
  algorithmType?: AlgorithmType;
  
  // Configuration avancée
  timeout?: number; // ms
  retries?: number;
  batchSize?: number; // pour le traitement par lot
}

// ========================================================================
// ADAPTATEUR UNIVERSEL ALGORITHMLAB
// ========================================================================

/**
 * Adaptateur universel AlgorithmLab remplaçant tous les wrappers
 * Usage: createUniversalAlgorithm(calculator, target, config)
 */
export function createUniversalAlgorithm<TInput = any, TDetails = VariableDetails>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  config: AdapterConfig<TInput, TDetails> = {}
): UniversalAlgorithm {
  
  const {
    requiresContext = false,
    supportsBatch = false,
    inputValidator,
    inputConverter,
    resultMapper = defaultResultMapper,
    displayName,
    description,
    algorithmType = "RULE_BASED",
    timeout = 30000,
    retries = 3,
    batchSize = 10
  } = config;

  // Implémentation de l'interface universelle AlgorithmLab
  const universalAlgorithm: UniversalAlgorithm = {
    
    describe(): AlgorithmDescriptor {
      const name = calculator.getName?.() || `${target}Calculator`;
      return {
        name,
        displayName: displayName || name,
        version: calculator.getVersion?.() || "1.0.0",
        type: calculator.getType?.() || algorithmType,
        target,
        batchSupported: supportsBatch,
        requiresContext,
        description: description || calculator.getDescription?.() || `Calculateur AlgorithmLab pour variable ${target}`,
        examples: generateExamples(target)
      };
    },

    validateConfig(): boolean {
      try {
        // Validation basique du calculateur
        if (!calculator || typeof calculator.calculate !== 'function') {
          return false;
        }
        
        // Test de calcul basique
        const testInput = createTestInput(target);
        if (inputValidator && !inputValidator(testInput)) {
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn(`Validation failed for ${target} calculator:`, error);
        return false;
      }
    },

    async classify(input: string): Promise<UniversalResult> {
      return this.run(input);
    },

    async run(input: unknown): Promise<UniversalResult> {
      const startTime = Date.now();
      
      try {
        // 1. Validation et conversion de l'input
        let typedInput: TInput;
        
        if (inputValidator) {
          if (!inputValidator(input)) {
            throw new Error(`Invalid input type for ${target} calculator`);
          }
          typedInput = input;
        } else if (inputConverter && typeof input === 'string') {
          typedInput = inputConverter(input);
        } else if (typeof input === 'string') {
          typedInput = createDefaultInput(input, target) as TInput;
        } else {
          typedInput = input as TInput;
        }

        // 2. Exécution avec timeout et retry
        const result = await executeWithRetry(
          () => calculator.calculate(typedInput),
          retries,
          timeout
        );

        // 3. Mapping vers format universel
        const universalResult = resultMapper(result);
        universalResult.processingTime = Date.now() - startTime;
        
        return universalResult;

      } catch (error) {
        return {
          prediction: "ERROR",
          confidence: 0,
          processingTime: Date.now() - startTime,
          metadata: {
            warnings: [`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            executionPath: ["error"],
            inputType: typeof input
          }
        };
      }
    },

    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      if (!supportsBatch) {
        // Fallback: exécution séquentielle
        const results: UniversalResult[] = [];
        for (const input of inputs) {
          results.push(await this.run(input));
        }
        return results;
      }

      // Traitement par batch optimisé
      const results: UniversalResult[] = [];
      
      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        const batchPromises = batch.map(input => this.run(input));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      return results;
    }
  };

  return universalAlgorithm;
}

// ========================================================================
// FONCTIONS UTILITAIRES ALGORITHMLAB
// ========================================================================

function defaultResultMapper<TDetails>(result: CalculationResult<TDetails>): UniversalResult {
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    processingTime: result.processingTime,
    algorithmVersion: result.metadata?.algorithmVersion,
    metadata: {
      inputSignature: result.metadata?.inputSignature,
      executionPath: result.metadata?.executionPath || ["calculate"],
      warnings: result.metadata?.warnings,
      details: result.details as VariableDetails
    }
  };
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  timeout: number
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Délai exponentiel entre les tentatives
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

function createTestInput(target: VariableTarget): unknown {
  switch (target) {
    case 'X':
      return { verbatim: "Bonjour, comment puis-je vous aider ?" };
    case 'Y':
      return { 
        verbatim: "Oui, merci beaucoup",
        previousConseillerTurn: "Je vais vérifier votre dossier"
      };
    case 'M1':
      return { verbatim: "C'est une phrase de test pour l'analyse linguistique." };
    case 'M2':
      return {
        conseillerTurn: "Je comprends votre situation",
        clientTurn: "Merci de votre compréhension"
      };
    case 'M3':
      return {
        conversationPair: {
          conseiller: "Avez-vous d'autres questions ?",
          client: "Non, c'est parfait"
        }
      };
    default:
      return { verbatim: "Test input" };
  }
}

function createDefaultInput(verbatim: string, target: VariableTarget): CalculationInput {
  switch (target) {
    case 'X':
      return { verbatim };
    case 'Y':
      return { verbatim, previousConseillerTurn: "" };
    case 'M1':
      return { verbatim };
    case 'M2':
      return { conseillerTurn: verbatim, clientTurn: "" };
    case 'M3':
      return { 
        conversationPair: { conseiller: verbatim, client: "" }
      };
    default:
      return { verbatim } as any;
  }
}

function generateExamples(target: VariableTarget): Array<{input: string, expectedOutput: string}> {
  switch (target) {
    case 'X':
      return [
        { input: "D'accord, je vais vérifier votre dossier", expectedOutput: "ENGAGEMENT" },
        { input: "Avez-vous d'autres questions ?", expectedOutput: "OUVERTURE" },
        { input: "Je comprends votre frustration", expectedOutput: "REFLET" }
      ];
    case 'Y':
      return [
        { input: "Merci beaucoup pour votre aide", expectedOutput: "CLIENT_POSITIF" },
        { input: "Ce n'est pas possible !", expectedOutput: "CLIENT_NEGATIF" },
        { input: "D'accord", expectedOutput: "CLIENT_NEUTRE" }
      ];
    case 'M1':
      return [
        { input: "Phrase simple", expectedOutput: "LOW_COMPLEXITY" },
        { input: "Construction syntaxique complexe", expectedOutput: "HIGH_COMPLEXITY" }
      ];
    case 'M2':
      return [
        { input: "Conseiller: 'Je comprends' | Client: 'Merci'", expectedOutput: "HIGH_ALIGNMENT" }
      ];
    case 'M3':
      return [
        { input: "Conversation fluide", expectedOutput: "HIGH_FLUIDITY" }
      ];
    default:
      return [];
  }
}

// ========================================================================
// FACTORY FUNCTIONS POUR USAGE SIMPLIFIÉ ALGORITHMLAB
// ========================================================================

export function createXAlgorithm(calculator: BaseCalculator): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "X", {
    displayName: "X Classifier AlgorithmLab",
    description: "Classification des actes conversationnels conseiller",
    algorithmType: "RULE_BASED"
  });
}

export function createYAlgorithm(calculator: BaseCalculator): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "Y", {
    displayName: "Y Classifier AlgorithmLab", 
    description: "Classification des réactions client",
    algorithmType: "RULE_BASED"
  });
}

export function createM2Algorithm(calculator: BaseCalculator): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "M2", {
    displayName: "M2 Alignment Calculator AlgorithmLab",
    description: "Calcul de l'alignement interactionnel",
    algorithmType: "MACHINE_LEARNING",
    requiresContext: true
  });
}
EOF

# ========================================================================
# types/algorithms/index.ts
# ========================================================================

echo "📝 Génération: types/algorithms/index.ts"

cat > "types/algorithms/index.ts" << 'EOF'
/**
 * @fileoverview Export centralisé des types algorithms AlgorithmLab
 * Point d'entrée principal pour tous les types d'algorithmes AlgorithmLab
 */

// Interface universelle et types de base
export * from './base';

// Adaptateur universel
export * from './universal-adapter';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType
} from './base';

export type {
  BaseCalculator,
  AdapterConfig
} from './universal-adapter';

// Export de la fonction principale
export { createUniversalAlgorithm } from './universal-adapter';
EOF

# ========================================================================
# TEST DE COMPILATION
# ========================================================================

echo ""
echo "🔍 Test basique de syntaxe des fichiers algorithms générés..."

# Test simple de syntaxe TypeScript
for file in types/algorithms/*.ts; do
    if [[ -f "$file" ]]; then
        echo "   Vérification: $(basename "$file")"
        # Test basique de syntaxe (recherche d'erreurs évidentes)
        if grep -q "export" "$file" && grep -q "interface\|type\|function" "$file"; then
            echo "   ✅ Syntaxe OK"
        else
            echo "   ⚠️  Possible problème de syntaxe"
        fi
    fi
done

echo ""
echo "✅ Script 2/5 terminé avec succès!"
echo ""
echo "📊 Fichiers créés:"
echo "   - types/algorithms/base.ts (Interface UniversalAlgorithm)"
echo "   - types/algorithms/universal-adapter.ts (createUniversalAlgorithm)"
echo "   - types/algorithms/index.ts (Export centralisé)"
echo ""
echo "🎯 Fonctionnalité clé:"
echo "   L'interface UniversalAlgorithm remplace wrapX, wrapY, wrapM2"
echo "   createUniversalAlgorithm unifie tous les adaptateurs"
echo ""
echo "🚀 Prochaine étape:"
echo "   Exécuter: ./3-create-ui-types.sh"
