/**
 * @fileoverview Types de composants UI AlgorithmLab
 * Interfaces spécifiques aux composants d'interface AlgorithmLab
 */

import type { ReactNode, CSSProperties } from "react";
import type {
  VariableTarget,
  ValidationMetrics,
  TVValidationResultCore,
} from "../core";

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
  style?: CSSProperties;
}

// ========================================================================
// CONFIGURATION D'AFFICHAGE ALGORITHMLAB
// ========================================================================

export interface DisplayConfig {
  // Thème et apparence
  theme?: "light" | "dark" | "auto";
  compact?: boolean;
  showAdvanced?: boolean;

  // Colonnes et sections
  visibleColumns?: string[];
  collapsedSections?: string[];

  // Métriques
  showConfidence?: boolean;
  showProcessingTime?: boolean;
  showMetadata?: boolean;

  // Graphiques et visualisations
  chartsEnabled?: boolean;
  animationsEnabled?: boolean;
  colorScheme?: "default" | "accessibility" | "colorblind";

  // Pagination et filtres
  pageSize?: number;
  defaultFilters?: Record<string, any>;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
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
      options?: Array<{ label: string; value: any }>;
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

  // Configuration d'affichage (optionnelle pour merge avec défauts)
  displayConfig?: DisplayConfig;

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

export interface ResultsPanelProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;
}

// Optionnel : variante stricte TV pour d’autres composants UI
export interface TVResultDisplayProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;
  onRowSelect?: (index: number) => void;
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

export function createDefaultDisplayConfig(): Required<DisplayConfig> {
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
    sortBy: "confidence",
  };
}

/** Merge sûr des overrides avec les valeurs par défaut (immutabilité) */
export function withDisplayDefaults(
  cfg?: DisplayConfig
): Required<DisplayConfig> {
  const d = createDefaultDisplayConfig();
  return { ...d, ...(cfg ?? {}) };
}

/** Validation simple d’un schema de config de formulaire */
export function validateConfigSchema(
  config: Record<string, any>,
  schema: ConfigFormProps["schema"]
): string[] {
  const errors: string[] = [];

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = config[key];

    // Champ requis
    if (
      fieldSchema.required &&
      (value === undefined || value === null || value === "")
    ) {
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
            if (
              fieldSchema.validation?.min !== undefined &&
              value < fieldSchema.validation.min
            ) {
              errors.push(
                `${fieldSchema.label} doit être au moins ${fieldSchema.validation.min}`
              );
            }
            if (
              fieldSchema.validation?.max !== undefined &&
              value > fieldSchema.validation.max
            ) {
              errors.push(
                `${fieldSchema.label} ne peut pas dépasser ${fieldSchema.validation.max}`
              );
            }
          }
          break;

        case "string":
          if (typeof value !== "string") {
            errors.push(
              `${fieldSchema.label} doit être une chaîne de caractères`
            );
          } else if (fieldSchema.validation?.pattern) {
            const regex = new RegExp(fieldSchema.validation.pattern);
            if (!regex.test(value)) {
              errors.push(
                `${fieldSchema.label} ne respecte pas le format requis`
              );
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
