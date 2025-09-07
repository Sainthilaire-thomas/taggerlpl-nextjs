/**
 * @fileoverview Types pour les fonctions de normalisation AlgorithmLab
 * Fonctions de normalisation spécifiques au module AlgorithmLab
 */

import { XTag, YTag } from "../core/variables";

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
export declare function normalizeXLabel(
  label: string,
  config?: Partial<NormalizationConfig>
): XTag;

/**
 * Normalise un label Y selon les règles AlgorithmLab
 */
export declare function normalizeYLabel(
  label: string,
  config?: Partial<NormalizationConfig>
): YTag;

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
  engagement: "ENGAGEMENT",
  action: "ENGAGEMENT",
  je_vais: "ENGAGEMENT",
  verification: "ENGAGEMENT",

  // Variations d'OUVERTURE
  ouverture: "OUVERTURE",
  question: "OUVERTURE",
  avez_vous: "OUVERTURE",
  souhaitez: "OUVERTURE",

  // Variations de REFLET
  reflet: "REFLET",
  comprends: "REFLET",
  entends: "REFLET",
  ressenti: "REFLET",

  // Variations d'EXPLICATION
  explication: "EXPLICATION",
  parce_que: "EXPLICATION",
  raison: "EXPLICATION",
  procedure: "EXPLICATION",

  // Variations de CLOTURE
  cloture: "CLOTURE",
  aurevoir: "CLOTURE",
  bonne_journee: "CLOTURE",
  fin: "CLOTURE",
};

export const Y_LABEL_MAPPING: Record<string, YTag> = {
  // Variations CLIENT_POSITIF
  positif: "CLIENT_POSITIF",
  merci: "CLIENT_POSITIF",
  parfait: "CLIENT_POSITIF",
  accord: "CLIENT_POSITIF",

  // Variations CLIENT_NEUTRE
  neutre: "CLIENT_NEUTRE",
  ok: "CLIENT_NEUTRE",
  oui: "CLIENT_NEUTRE",
  bien: "CLIENT_NEUTRE",

  // Variations CLIENT_NEGATIF
  negatif: "CLIENT_NEGATIF",
  non: "CLIENT_NEGATIF",
  impossible: "CLIENT_NEGATIF",
  probleme: "CLIENT_NEGATIF",

  // Variations CLIENT_QUESTION
  question: "CLIENT_QUESTION",
  comment: "CLIENT_QUESTION",
  pourquoi: "CLIENT_QUESTION",
  quand: "CLIENT_QUESTION",

  // Variations CLIENT_SILENCE
  silence: "CLIENT_SILENCE",
  pause: "CLIENT_SILENCE",
  attente: "CLIENT_SILENCE",
};

export const FAMILY_MAPPING = {
  X: {
    ENGAGEMENT: "ACTION",
    OUVERTURE: "EXPLORATION",
    REFLET: "EMPATHIE",
    REFLET_ACQ: "EMPATHIE", // AJOUTER
    REFLET_JE: "EMPATHIE",
    REFLET_VOUS: "EMPATHIE",
    EXPLICATION: "INFORMATION",
    CLOTURE: "CONCLUSION",
    AUTRE_X: "AUTRE",
  },
  Y: {
    CLIENT_POSITIF: "ACCEPTANCE",
    CLIENT_NEUTRE: "NEUTRAL",
    CLIENT_NEGATIF: "RESISTANCE",
    CLIENT_QUESTION: "INQUIRY",
    CLIENT_SILENCE: "PAUSE",
    AUTRE_Y: "AUTRE",
  },
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
    stemming: false,
  },

  STANDARD: {
    level: "STANDARD",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: false,
  },

  AGGRESSIVE: {
    level: "AGGRESSIVE",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: true,
  },
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
    description: "Supprime les mots de remplissage communs",
  },
  {
    id: "normalize_contractions",
    name: "Normalisation des contractions",
    pattern: /(j'|l'|d'|n'|m'|t'|s')/gi,
    replacement: "",
    enabled: true,
    priority: 2,
    description: "Développe les contractions françaises courantes",
  },
  {
    id: "normalize_politeness",
    name: "Normalisation de politesse",
    pattern: /(monsieur|madame|mademoiselle)/gi,
    replacement: "",
    enabled: true,
    priority: 3,
    description:
      "Supprime les formules de politesse pour se concentrer sur le contenu",
  },
  {
    id: "normalize_numbers",
    name: "Normalisation des nombres",
    pattern: /\b\d+\b/g,
    replacement: "[NOMBRE]",
    enabled: false,
    priority: 4,
    description: "Remplace les nombres par un token générique",
  },
];

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateNormalizationConfig(
  config: NormalizationConfig
): string[] {
  const errors: string[] = [];

  if (!["BASIC", "STANDARD", "AGGRESSIVE"].includes(config.level)) {
    errors.push("Niveau de normalisation invalide");
  }

  if (config.customRules) {
    config.customRules.forEach((rule, index) => {
      if (
        !rule.id ||
        !rule.name ||
        !rule.pattern ||
        rule.replacement === undefined
      ) {
        errors.push(`Règle ${index + 1} incomplète`);
      }

      if (rule.priority < 1 || rule.priority > 10) {
        errors.push(
          `Priorité de la règle ${rule.name} doit être entre 1 et 10`
        );
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
    ...options,
  };
}

export function isValidXTag(tag: string): tag is XTag {
  return [
    "ENGAGEMENT",
    "OUVERTURE",
    "REFLET",
    "EXPLICATION",
    "CLOTURE",
    "AUTRE_X",
  ].includes(tag);
}

export function isValidYTag(tag: string): tag is YTag {
  return [
    "CLIENT_POSITIF",
    "CLIENT_NEUTRE",
    "CLIENT_NEGATIF",
    "CLIENT_QUESTION",
    "CLIENT_SILENCE",
    "AUTRE_Y",
  ].includes(tag);
}

export function getFamilyFromTag(tag: XTag | YTag): string {
  if (isValidXTag(tag)) {
    return FAMILY_MAPPING.X[tag];
  } else if (isValidYTag(tag)) {
    return FAMILY_MAPPING.Y[tag];
  }
  return "AUTRE";
}
