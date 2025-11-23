/**
 * @fileoverview Types et utilitaires pour la conversion de données AlgorithmLab
 * Conversion entre formats, adaptateurs et transformations AlgorithmLab
 */

import type { VariableTarget, VariableDetails } from "../core/variables";
import type { CalculationInput, CalculationResult } from "../core/calculations";
import type { UniversalResult } from "../algorithms/base";

// ========================================================================
// TYPES DE CONVERSION ALGORITHMLAB
// ========================================================================

export type ConversionDirection =
  | "TO_UNIVERSAL"
  | "FROM_UNIVERSAL"
  | "BETWEEN_FORMATS";

export interface ConversionConfig {
  direction: ConversionDirection;
  sourceFormat: string;
  targetFormat: string;
  preserveMetadata: boolean;
  strictMode: boolean; // Échoue si conversion incomplète
  defaultValues?: Record<string, unknown>;
  customMappings?: Record<string, string>;
}

export interface ConversionResult<T = unknown> {
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

export interface FormatAdapter<TSource = unknown, TTarget = unknown> {
  name: string;
  sourceFormat: string;
  targetFormat: string;

  // Méthodes de conversion
  convert(
    data: TSource,
    config?: Partial<ConversionConfig>
  ): ConversionResult<TTarget>;
  validate(data: TSource): boolean;
  getSchema?(): unknown;

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

  convertXResult(result: unknown): ConversionResult<UniversalResult>;
  convertYResult(result: unknown): ConversionResult<UniversalResult>;
  convertM2Result(result: unknown): ConversionResult<UniversalResult>;
}

/**
 * Adaptateur pour les exports AlgorithmLab
 */
export interface ExportAdapter extends FormatAdapter {
  targetFormat: "CSV" | "JSON" | "XML" | "PDF";

  exportResults(
    results: UniversalResult[],
    config?: unknown
  ): ConversionResult<string>;
  exportMetrics(metrics: unknown[], config?: unknown): ConversionResult<string>;
}

// ========================================================================
// TRANSFORMATIONS DE DONNÉES ALGORITHMLAB
// ========================================================================

export interface DataTransformation<TInput = unknown, TOutput = unknown> {
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
  valueMappings: Record<string, Record<string, unknown>>;

  // Transformations personnalisées
  customTransforms: Record<string, (value: unknown) => unknown>;

  // Champs obsolètes à ignorer
  deprecatedFields: string[];

  // Champs requis à ajouter avec valeurs par défaut (supporte "a.b.c")
  requiredDefaults: Record<string, unknown>;
}

// Mappings spécifiques pour la migration AlgorithmLab
export const ALGORITHM_LAB_LEGACY_MAPPINGS: Record<string, LegacyMapping> = {
  WRAPPER_TO_UNIVERSAL: {
    fieldMappings: {
      wrapXResult: "universalResult",
      wrapYResult: "universalResult",
      wrapM2Result: "universalResult",
    },
    valueMappings: {
      confidence: {
        HAUTE: 0.9,
        MOYENNE: 0.6,
        FAIBLE: 0.3,
      },
    },
    customTransforms: {
      processingTime: (value: unknown) => {
        if (typeof value === "string") {
          const n = parseInt(value.replace("ms", ""), 10);
          return Number.isFinite(n) ? n : 0;
        }
        if (typeof value === "number") return value;
        return 0;
      },
    },
    deprecatedFields: ["wrapperVersion", "legacyFormat"],
    requiredDefaults: {
      algorithmVersion: "2.0.0",
      "metadata.executionPath": ["universal_conversion"],
    },
  },
};

// ========================================================================
// HELPERS internes (sets/gets imbriqués, application mappings)
// ========================================================================

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cursor[p] !== "object" || cursor[p] === null) {
      cursor[p] = {};
    }
    cursor = cursor[p] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function applyValueMappings(
  record: Record<string, unknown>,
  valueMappings: LegacyMapping["valueMappings"]
) {
  for (const [field, mapping] of Object.entries(valueMappings)) {
    if (record[field] !== undefined) {
      const oldVal = record[field] as string;
      if (typeof oldVal === "string" && mapping[oldVal] !== undefined) {
        record[field] = mapping[oldVal];
      }
    }
  }
}

function applyCustomTransforms(
  record: Record<string, unknown>,
  transforms: LegacyMapping["customTransforms"],
  warnings: string[]
) {
  for (const [field, transform] of Object.entries(transforms)) {
    if (record[field] !== undefined) {
      try {
        record[field] = transform(record[field]);
      } catch (e) {
        warnings.push(
          `Transformation failed for field ${field}: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    }
  }
}

// ========================================================================
// FACTORY FUNCTIONS ALGORITHMLAB
// ========================================================================

export function createFormatAdapter<TSource, TTarget>(
  name: string,
  sourceFormat: string,
  targetFormat: string,
  convertFn: (
    data: TSource,
    config?: Partial<ConversionConfig>
  ) => ConversionResult<TTarget>
): FormatAdapter<TSource, TTarget> {
  return {
    name,
    sourceFormat,
    targetFormat,
    convert: convertFn,
    validate: (data: TSource) => {
      try {
        const out = convertFn(data);
        return out && typeof out === "object" && Array.isArray(out.errors);
      } catch {
        return false;
      }
    },
  };
}

export function createChainedTransformation(
  transformations: DataTransformation[] = []
): ChainedTransformation {
  return {
    transformations: [...transformations],

    execute<T, U>(input: T): ConversionResult<U> {
      let current: unknown = input;
      const warnings: string[] = [];
      const errors: string[] = [];
      let fieldsConverted = 0;

      const startTime = Date.now();

      try {
        for (const transformation of this.transformations) {
          if (transformation.validate && !transformation.validate(current)) {
            warnings.push(
              `Validation failed for transformation: ${transformation.name}`
            );
          }
          current = transformation.transform(current as never);
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
            fieldsSkipped: 0,
          },
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
            fieldsSkipped: Math.max(
              0,
              this.transformations.length - fieldsConverted
            ),
          },
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
          fieldsSkipped: this.transformations.length,
        },
      };
    },

    addTransformation(transformation: DataTransformation) {
      this.transformations.push(transformation);
    },

    removeTransformation(name: string): boolean {
      const index = this.transformations.findIndex((t) => t.name === name);
      if (index >= 0) {
        this.transformations.splice(index, 1);
        return true;
      }
      return false;
    },
  };
}

// ========================================================================
// UTILITAIRES DE CONVERSION ALGORITHMLAB
// ========================================================================

export function convertLegacyToUniversal(
  legacyData: Record<string, unknown>,
  mappingKey: keyof typeof ALGORITHM_LAB_LEGACY_MAPPINGS
): ConversionResult<UniversalResult> {
  const mapping = ALGORITHM_LAB_LEGACY_MAPPINGS[mappingKey];
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // 1) Appliquer le mapping de champs (copie superficielle contrôlée)
    const converted: Record<string, unknown> = {};
    let fieldsConverted = 0;
    let fieldsSkipped = 0;

    for (const [oldField, newField] of Object.entries(mapping.fieldMappings)) {
      if (legacyData[oldField] !== undefined) {
        converted[newField] = legacyData[oldField];
        fieldsConverted++;
      }
    }

    // 2) Appliquer les mappings de valeurs (ex. confidence HAUTE -> 0.9)
    applyValueMappings(converted, mapping.valueMappings);

    // 3) Appliquer les transformations personnalisées
    applyCustomTransforms(converted, mapping.customTransforms, warnings);

    // 4) Supprimer les champs obsolètes s’ils existent dans le converted
    for (const field of mapping.deprecatedFields) {
      if (converted[field] !== undefined) {
        delete converted[field];
        fieldsSkipped++;
      }
    }

    // 5) Ajouter les valeurs par défaut requises (support a.b.c)
    for (const [field, defaultValue] of Object.entries(
      mapping.requiredDefaults
    )) {
      // si non défini (supporte un-niveau ou nested)
      const isTopLevel = !field.includes(".");
      if (isTopLevel) {
        if (converted[field] === undefined) {
          converted[field] = defaultValue;
          fieldsConverted++;
        }
      } else {
        // nested
        // (ne vérifie pas l'existence profonde—on force le set si manquant)
        setNested(converted, field, defaultValue);
        fieldsConverted++;
      }
    }

    // 6) Certains mappings placent le résultat sous "universalResult"
    const universal: UniversalResult =
      (converted["universalResult"] as UniversalResult) ??
      (converted as unknown as UniversalResult);

    return {
      success: true,
      data: { ...universal }, // immutabilité de sortie
      warnings,
      errors,
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal",
        conversionTime: Date.now() - startTime,
        lossyConversion: warnings.length > 0 || fieldsSkipped > 0,
        fieldsConverted,
        fieldsSkipped,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {} as UniversalResult,
      warnings,
      errors: [
        error instanceof Error ? error.message : "Unknown conversion error",
      ],
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal",
        conversionTime: Date.now() - startTime,
        lossyConversion: true,
        fieldsConverted: 0,
        fieldsSkipped: 0,
      },
    };
  }
}

export function validateConversionResult<T>(
  result: ConversionResult<T>
): boolean {
  return (
    result !== null &&
    typeof result === "object" &&
    result.success === true &&
    result.data !== null &&
    result.data !== undefined &&
    Array.isArray(result.errors) &&
    Array.isArray(result.warnings) &&
    !!result.metadata &&
    typeof result.metadata.conversionTime === "number"
  );
}
