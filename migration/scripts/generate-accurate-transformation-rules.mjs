#!/usr/bin/env node
// generate-accurate-transformation-rules.mjs
// Génère les règles de transformation précises basées sur votre architecture unifiée

import fs from "fs/promises";
import path from "path";

console.log("🎯 GÉNÉRATEUR DE RÈGLES PRÉCISES ALGORITHMLAB");
console.log("============================================");

const PROJECT_ROOT = process.cwd();
const AUDIT_FILE = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "comprehensive-types-audit.json"
);
const RULES_OUTPUT = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "accurate-transformation-rules.json"
);

console.log("📊 Chargement de l'audit...");

try {
  const auditContent = await fs.readFile(AUDIT_FILE, "utf8");
  const auditData = JSON.parse(auditContent);

  console.log(
    `✅ Audit chargé: ${auditData.audit_metadata.total_typescript_files} fichiers`
  );

  // Définir votre architecture cible basée sur la documentation
  const TARGET_ARCHITECTURE = {
    BASE_PATH: "@/app/(protected)/analysis/components/AlgorithmLab/types",
    STRUCTURE: {
      // Point d'entrée principal (index.ts avec tous les re-exports)
      MAIN_INDEX: "@/app/(protected)/analysis/components/AlgorithmLab/types",

      // Structure organisée par domaine
      CORE: "@/app/(protected)/analysis/components/AlgorithmLab/types/core",
      ALGORITHMS:
        "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms",
      UI: "@/app/(protected)/analysis/components/AlgorithmLab/types/ui",
      UTILS: "@/app/(protected)/analysis/components/AlgorithmLab/types/utils",

      // Fichiers de l'ancienne structure (à garder temporairement)
      LEGACY_LEVEL1:
        "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types",
      LEGACY_LEVEL0:
        "@/app/(protected)/analysis/components/AlgorithmLab/types/Level0Types",
      LEGACY_VALIDATION:
        "@/app/(protected)/analysis/components/AlgorithmLab/types/ValidationTypes",
      LEGACY_SHARED:
        "@/app/(protected)/analysis/components/AlgorithmLab/types/SharedTypes",
    },
  };

  // Générer les règles de transformation précises
  const transformationRules = {
    metadata: {
      generated_at: new Date().toISOString(),
      based_on_audit: auditData.audit_metadata.generated_at,
      strategy: "accurate_unified_architecture",
      target_structure: "UNIFIED_ALGORITHMLAB_WITH_LEGACY_COMPATIBILITY",
      total_imports_to_transform:
        auditData.import_patterns_summary["IMPORTS THESISVARIABLES"] +
        auditData.import_patterns_summary["IMPORTS LEVELXTYPES"] +
        auditData.import_patterns_summary["IMPORTS DIRECTS DE types/"],
    },

    source_path_mappings: generateAccuratePathMappings(
      auditData,
      TARGET_ARCHITECTURE
    ),
    named_imports_redistribution: generateNamedImportsRedistribution(
      auditData,
      TARGET_ARCHITECTURE
    ),
    legacy_compatibility: generateLegacyCompatibility(TARGET_ARCHITECTURE),
    validation_rules: generateEnhancedValidationRules(),
    priority_batches: generatePriorityBatches(auditData),
  };

  // Sauvegarder les règles
  await fs.writeFile(
    RULES_OUTPUT,
    JSON.stringify(transformationRules, null, 2),
    "utf8"
  );

  console.log(`\n✅ Règles précises générées: ${RULES_OUTPUT}`);
  console.log("\n📊 Résumé des règles:");
  console.log(
    `   🔄 Mappings de chemins: ${
      Object.keys(transformationRules.source_path_mappings).length
    }`
  );
  console.log(
    `   🏷️ Redistributions d'imports: ${
      Object.keys(transformationRules.named_imports_redistribution).length
    }`
  );
  console.log(
    `   🎯 Imports à transformer: ${transformationRules.metadata.total_imports_to_transform}`
  );

  console.log(
    "\n🎯 Prochaine étape: node migration/scripts/apply-accurate-transformations.mjs"
  );
} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}

// Générer les mappings de chemins précis selon votre architecture
function generateAccuratePathMappings(auditData, architecture) {
  const mappings = {};

  // === RÈGLE 1: Tous les ThesisVariables pointent vers le point d'entrée principal ===
  // Ceci permet d'utiliser l'index.ts qui re-exporte tout
  const thesisVariablesPaths = [
    "types/ThesisVariables",
    "../../../types/ThesisVariables",
    "../../../../types/ThesisVariables",
    "../types/ThesisVariables",
    "./ThesisVariables",
    "types/ThesisVariables.x",
    "types/ThesisVariables.y",
    "types/ThesisVariables.m1",
    "types/ThesisVariables.m2",
    "types/ThesisVariables.m3",
  ];

  thesisVariablesPaths.forEach((path) => {
    mappings[path] = architecture.STRUCTURE.MAIN_INDEX;
  });

  // === RÈGLE 2: Level1Types reste temporairement pour compatibilité ===
  const level1TypesPaths = [
    "types/Level1Types",
    "../../../types/Level1Types",
    "../../types/Level1Types",
  ];

  level1TypesPaths.forEach((path) => {
    mappings[path] = architecture.STRUCTURE.LEGACY_LEVEL1;
  });

  // === RÈGLE 3: Autres types legacy ===
  mappings["types/Level0Types"] = architecture.STRUCTURE.LEGACY_LEVEL0;
  mappings["../../types/Level0Types"] = architecture.STRUCTURE.LEGACY_LEVEL0;

  mappings["types/ValidationTypes"] = architecture.STRUCTURE.LEGACY_VALIDATION;
  mappings["../../../types/ValidationTypes"] =
    architecture.STRUCTURE.LEGACY_VALIDATION;

  mappings["types/SharedTypes"] = architecture.STRUCTURE.LEGACY_SHARED;
  mappings["../../types/SharedTypes"] = architecture.STRUCTURE.LEGACY_SHARED;

  // === RÈGLE 4: Imports directs types/ vers le nouveau point d'entrée ===
  mappings["types/"] = architecture.STRUCTURE.MAIN_INDEX;

  console.log(`📋 ${Object.keys(mappings).length} mappings de chemins générés`);
  return mappings;
}

// Générer la redistribution des imports nommés (pour migration future)
function generateNamedImportsRedistribution(auditData, architecture) {
  // Cette section prépare la redistribution future des imports nommés
  // selon votre nouvelle architecture core/algorithms/ui/utils

  const redistribution = {
    description:
      "Redistribution future des imports nommés vers la nouvelle architecture",
    note: "Ces règles seront appliquées dans une phase ultérieure de migration",

    // Variables principales -> core/variables via index
    core_variables: {
      target: architecture.STRUCTURE.CORE + "/variables",
      exports: [
        "VariableTarget",
        "XTag",
        "YTag",
        "XDetails",
        "YDetails",
        "M1Details",
        "M2Details",
        "M3Details",
        "VariableX",
        "VariableY",
        "VARIABLE_LABELS",
        "VARIABLE_COLORS",
      ],
    },

    // Calculs -> core/calculations via index
    core_calculations: {
      target: architecture.STRUCTURE.CORE + "/calculations",
      exports: [
        "XInput",
        "YInput",
        "M1Input",
        "M2Input",
        "M3Input",
        "CalculationResult",
        "CalculatorMetadata",
      ],
    },

    // Validation -> core/validation via index
    core_validation: {
      target: architecture.STRUCTURE.CORE + "/validation",
      exports: [
        "ValidationMetrics",
        "ValidationResult",
        "AlgorithmTestConfig",
        "TVMetadataCore",
        "TVValidationResultCore",
      ],
    },

    // Algorithmes -> algorithms/ via index
    algorithms: {
      target: architecture.STRUCTURE.ALGORITHMS,
      exports: [
        "UniversalAlgorithm",
        "AlgorithmDescriptor",
        "UniversalResult",
        "createUniversalAlgorithm",
        "BaseCalculator",
      ],
    },

    // UI -> ui/ via index
    ui_components: {
      target: architecture.STRUCTURE.UI,
      exports: [
        "BaseValidationProps",
        "XValidationProps",
        "YValidationProps",
        "M2ValidationProps",
        "DisplayConfig",
        "ResultsPanelProps",
      ],
    },

    // Utils -> utils/ via index
    utils: {
      target: architecture.STRUCTURE.UTILS,
      exports: [
        "normalizeXLabel",
        "normalizeYLabel",
        "familyFromX",
        "familyFromY",
        "NormalizationConfig",
        "NormalizationLevel",
      ],
    },
  };

  console.log(
    `🏷️ Redistribution préparée pour ${
      Object.keys(redistribution).length - 2
    } domaines`
  );
  return redistribution;
}

// Générer les règles de compatibilité legacy
function generateLegacyCompatibility(architecture) {
  return {
    description:
      "Maintien de la compatibilité avec l'ancienne structure pendant la transition",
    temporary_aliases: {
      Level1Types: architecture.STRUCTURE.LEGACY_LEVEL1,
      Level0Types: architecture.STRUCTURE.LEGACY_LEVEL0,
      ValidationTypes: architecture.STRUCTURE.LEGACY_VALIDATION,
      SharedTypes: architecture.STRUCTURE.LEGACY_SHARED,
    },
    transition_plan: {
      phase1:
        "Rediriger tous les imports vers le nouveau point d'entrée principal",
      phase2: "Redistribuer progressivement vers core/algorithms/ui/utils",
      phase3: "Supprimer les fichiers legacy et finaliser la migration",
    },
  };
}

// Règles de validation améliorées
function generateEnhancedValidationRules() {
  return {
    pre_transformation: [
      {
        rule: "compilation_check",
        description: "Vérifier la compilation TypeScript",
        command: "npx tsc --noEmit",
        required: true,
        timeout: 60000,
      },
      {
        rule: "git_status_check",
        description: "Vérifier l'état git propre",
        required: false,
      },
      {
        rule: "backup_creation",
        description: "Créer les backups de sécurité",
        required: true,
      },
    ],
    during_transformation: [
      {
        rule: "incremental_validation",
        description: "Valider après chaque lot de transformations",
        frequency: "every_5_files",
      },
    ],
    post_transformation: [
      {
        rule: "compilation_check",
        description: "Vérifier la compilation après transformation",
        command: "npx tsc --noEmit",
        required: true,
        timeout: 60000,
      },
      {
        rule: "import_resolution_check",
        description: "Vérifier que tous les imports sont résolus",
        required: true,
      },
      {
        rule: "app_startup_test",
        description: "Test de démarrage de l'application",
        command: "timeout 30s npm run dev",
        required: false,
      },
    ],
  };
}

// Générer les lots de priorité basés sur l'audit
function generatePriorityBatches(auditData) {
  const importStats = auditData.import_patterns_summary;

  return [
    {
      batch: 1,
      name: "ThesisVariables - Priorité critique",
      description: `${importStats["IMPORTS THESISVARIABLES"]} imports ThesisVariables`,
      patterns: ["ThesisVariables"],
      estimated_files: Math.ceil(importStats["IMPORTS THESISVARIABLES"] / 2),
      priority: "CRITICAL",
    },
    {
      batch: 2,
      name: "Level1Types - Priorité haute",
      description: `${importStats["IMPORTS LEVELXTYPES"]} imports Level1Types`,
      patterns: ["Level1Types", "Level0Types"],
      estimated_files: Math.ceil(importStats["IMPORTS LEVELXTYPES"] / 2),
      priority: "HIGH",
    },
    {
      batch: 3,
      name: "Imports directs types/ - Priorité normale",
      description: `${importStats["IMPORTS DIRECTS DE types/"]} imports directs`,
      patterns: ["types/"],
      estimated_files: Math.ceil(importStats["IMPORTS DIRECTS DE types/"] / 4),
      priority: "NORMAL",
    },
    {
      batch: 4,
      name: "ValidationTypes et SharedTypes - Priorité faible",
      description: `${
        importStats["IMPORTS VALIDATIONTYPES"] +
        importStats["IMPORTS SHAREDTYPES"]
      } imports validation/shared`,
      patterns: ["ValidationTypes", "SharedTypes"],
      estimated_files: 3,
      priority: "LOW",
    },
  ];
}
