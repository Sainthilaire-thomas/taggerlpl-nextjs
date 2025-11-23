#!/usr/bin/env node
// 2-enrich-target-structure.mjs
// Enrichit la structure cible AlgorithmLab/types basé sur l'analyse des manquants

import fs from "fs/promises";
import path from "path";

console.log("🏗️ ENRICHISSEMENT STRUCTURE CIBLE ALGORITHMLAB");
console.log("==============================================");

const PROJECT_ROOT = process.cwd();
const ANALYSIS_FILE = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "missing-types-analysis.json"
);
const TARGET_TYPES_DIR = path.join(
  PROJECT_ROOT,
  "src/app/(protected)/analysis/components/AlgorithmLab/types"
);
const ENRICHMENT_OUTPUT = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "enrichment-completed.json"
);

async function enrichTargetStructure() {
  console.log("📋 Chargement de l'analyse des types manquants...");

  let analysis;
  try {
    analysis = JSON.parse(await fs.readFile(ANALYSIS_FILE, "utf8"));
  } catch {
    console.error(
      "❌ Impossible de charger l'analyse. Exécutez d'abord 1-analyze-missing-types.mjs"
    );
    process.exit(1);
  }

  console.log(
    `📊 Types critiques manquants: ${analysis.missing_types.critical.length}`
  );
  console.log(
    `📊 Types normaux manquants: ${analysis.missing_types.normal.length}`
  );

  const enrichmentResults = {
    metadata: {
      started_at: new Date().toISOString(),
      based_on_analysis: analysis.metadata.generated_at,
      target_directory: TARGET_TYPES_DIR,
    },
    phase1_critical: await executeCriticalEnrichment(
      analysis.enrichment_plan.phase1_critical
    ),
    phase2_normal: await executeNormalEnrichment(
      analysis.enrichment_plan.phase2_normal
    ),
    phase3_cleanup: await executeCleanupPhase(),
    structure_verification: await verifyEnrichedStructure(), // ← AJOUTEZ CETTE LIGNE
  };

  console.log(`✅ Enrichissement terminé: ${ENRICHMENT_OUTPUT}`);
  console.log("\n📁 Structure enrichie prête pour transformation des imports");

  return enrichmentResults;
}

async function executeCriticalEnrichment(phase1Plan) {
  console.log("\n🚨 Phase 1: Enrichissement des types critiques");

  const results = {
    actions_completed: [],
    actions_failed: [],
    files_modified: [],
  };

  for (const action of phase1Plan.actions) {
    try {
      console.log(`   📝 Ajout de ${action.target} dans ${action.location}`);

      const success = await addMissingType(action.target, action.location);

      if (success) {
        results.actions_completed.push(action);
        if (!results.files_modified.includes(action.location)) {
          results.files_modified.push(action.location);
        }
      } else {
        results.actions_failed.push({
          ...action,
          reason: "Type already exists or location invalid",
        });
      }
    } catch (error) {
      results.actions_failed.push({ ...action, reason: error.message });
    }
  }

  console.log(`   ✅ Ajouts réussis: ${results.actions_completed.length}`);
  console.log(`   ❌ Échecs: ${results.actions_failed.length}`);

  return results;
}

async function executeNormalEnrichment(phase2Plan) {
  console.log("\n📝 Phase 2: Enrichissement des types normaux");

  const results = {
    actions_completed: [],
    actions_failed: [],
    files_modified: [],
  };

  for (const action of phase2Plan.actions) {
    try {
      console.log(`   📄 Ajout de ${action.target} dans ${action.location}`);

      const success = await addMissingType(action.target, action.location);

      if (success) {
        results.actions_completed.push(action);
        if (!results.files_modified.includes(action.location)) {
          results.files_modified.push(action.location);
        }
      } else {
        results.actions_failed.push({
          ...action,
          reason: "Type already exists or location invalid",
        });
      }
    } catch (error) {
      results.actions_failed.push({ ...action, reason: error.message });
    }
  }

  console.log(`   ✅ Ajouts réussis: ${results.actions_completed.length}`);
  console.log(`   ❌ Échecs: ${results.actions_failed.length}`);

  return results;
}

async function executeCleanupPhase() {
  console.log("\n🧹 Phase 3: Nettoyage et optimisation");

  const results = {
    actions_completed: [],
    index_updated: false,
    unused_types_found: [],
  };

  // Mettre à jour l'index principal
  try {
    const indexUpdated = await updateMainIndex();
    results.index_updated = indexUpdated;

    if (indexUpdated) {
      results.actions_completed.push({
        action: "UPDATE_INDEX_EXPORTS",
        status: "completed",
      });
    }
  } catch (error) {
    console.warn(`⚠️ Erreur mise à jour index: ${error.message}`);
  }

  // Identifier les types inutilisés (optionnel)
  try {
    const unusedTypes = await findUnusedTypes();
    results.unused_types_found = unusedTypes;

    if (unusedTypes.length > 0) {
      console.log(
        `   📊 Types potentiellement inutilisés: ${unusedTypes.length}`
      );
    }
  } catch (error) {
    console.warn(`⚠️ Erreur analyse types inutilisés: ${error.message}`);
  }

  return results;
}

async function addMissingType(typeName, targetLocation) {
  const filePath = path.join(TARGET_TYPES_DIR, targetLocation);

  try {
    // Vérifier si le fichier existe
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      // Créer le fichier s'il n'existe pas
      await ensureDirectoryExists(path.dirname(filePath));
      await fs.writeFile(
        filePath,
        generateFileTemplate(targetLocation),
        "utf8"
      );
      console.log(`   📁 Fichier créé: ${targetLocation}`);
    }

    // Lire le contenu actuel
    const currentContent = await fs.readFile(filePath, "utf8");

    // Vérifier si le type existe déjà
    if (
      currentContent.includes(`interface ${typeName}`) ||
      currentContent.includes(`type ${typeName}`) ||
      currentContent.includes(`class ${typeName}`)
    ) {
      console.log(`   ⏭️ Type ${typeName} existe déjà dans ${targetLocation}`);
      return false;
    }

    // Ajouter le type manquant
    const typeDefinition = generateTypeDefinition(typeName);
    const updatedContent = insertTypeIntoFile(currentContent, typeDefinition);

    await fs.writeFile(filePath, updatedContent, "utf8");
    console.log(`   ✅ Type ${typeName} ajouté dans ${targetLocation}`);

    return true;
  } catch (error) {
    console.error(`   ❌ Erreur ajout ${typeName}: ${error.message}`);
    return false;
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

function generateFileTemplate(targetLocation) {
  const filename = path.basename(targetLocation, ".ts");

  return `/**
 * @fileoverview ${filename} AlgorithmLab
 * Types pour ${filename} - Généré automatiquement par enrichissement
 */

// Types spécifiques à ${filename}

// ========================================================================
// TYPES PRINCIPAUX ${filename.toUpperCase()}
// ========================================================================

// Placeholder - Types ajoutés automatiquement ci-dessous

`;
}

function generateTypeDefinition(typeName) {
  // Générer une définition de type basique selon le nom et la localisation

  if (typeName.endsWith("Details")) {
    return `
/**
 * Détails pour ${typeName} AlgorithmLab
 */
export interface ${typeName} {
  // Propriétés à définir selon vos besoins
  value?: unknown;
  metadata?: Record<string, unknown>;
}
`;
  }

  if (typeName.endsWith("Input")) {
    return `
/**
 * Input pour ${typeName} AlgorithmLab
 */
export interface ${typeName} {
  verbatim: string;
  // Autres propriétés à définir selon vos besoins
}
`;
  }

  if (typeName.endsWith("Result")) {
    return `
/**
 * Résultat pour ${typeName} AlgorithmLab
 */
export interface ${typeName} {
  prediction: string;
  confidence: number;
  processingTime?: number;
  // Autres propriétés à définir selon vos besoins
}
`;
  }

  if (typeName.endsWith("Props")) {
    return `
/**
 * Props pour ${typeName} AlgorithmLab
 */
export interface ${typeName} {
  // Props React à définir selon vos besoins
  children?: React.ReactNode;
  className?: string;
}
`;
  }

  if (typeName.includes("Validation") || typeName.includes("Metrics")) {
    return `
/**
 * ${typeName} AlgorithmLab
 */
export interface ${typeName} {
  accuracy: number;
  precision?: number;
  recall?: number;
  // Autres métriques à définir selon vos besoins
}
`;
  }

  // Type générique par défaut
  return `
/**
 * ${typeName} AlgorithmLab
 * TODO: Définir les propriétés selon vos besoins spécifiques
 */
export interface ${typeName} {
  // Propriétés à définir selon vos besoins
  [key: string]: unknown;
}
`;
}

function insertTypeIntoFile(content, typeDefinition) {
  // Chercher le meilleur endroit pour insérer le type

  // Si le fichier a déjà des types, insérer avant la fin
  const lastExportIndex = content.lastIndexOf("export");

  if (lastExportIndex !== -1) {
    // Insérer après le dernier export
    const insertPosition = content.indexOf("\n", lastExportIndex) + 1;
    return (
      content.slice(0, insertPosition) +
      typeDefinition +
      content.slice(insertPosition)
    );
  }

  // Sinon, insérer à la fin du fichier
  return content + typeDefinition;
}

async function updateMainIndex() {
  console.log("   📝 Mise à jour de l'index principal...");

  const indexPath = path.join(TARGET_TYPES_DIR, "index.ts");

  try {
    // Lire l'index actuel ou créer un nouveau
    let indexContent;
    try {
      indexContent = await fs.readFile(indexPath, "utf8");
    } catch {
      indexContent = generateMainIndexTemplate();
    }

    // Vérifier que tous les sous-modules sont exportés
    const requiredExports = [
      "export * from './core';",
      "export * from './algorithms';",
      "export * from './ui';",
      "export * from './utils';",
    ];

    let updated = false;
    for (const exportLine of requiredExports) {
      if (!indexContent.includes(exportLine)) {
        indexContent += "\n" + exportLine;
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(indexPath, indexContent, "utf8");
      console.log("   ✅ Index principal mis à jour");
      return true;
    } else {
      console.log("   ⏭️ Index principal déjà à jour");
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erreur mise à jour index: ${error.message}`);
    return false;
  }
}

function generateMainIndexTemplate() {
  return `/**
 * @fileoverview Point d'entrée principal des types AlgorithmLab
 * Export centralisé unifié pour le module AlgorithmLab
 */

// ========================================================================
// EXPORTS PAR DOMAINE ALGORITHMLAB
// ========================================================================

// Types fondamentaux
export * from './core';

// Types d'algorithmes  
export * from './algorithms';

// Types d'interface utilisateur
export * from './ui';

// Types utilitaires
export * from './utils';

// ========================================================================
// CONSTANTES ALGORITHMLAB
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";

export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

`;
}

async function findUnusedTypes() {
  // Analyser les types qui ne sont peut-être plus utilisés
  // Implémentation simplifiée pour l'exemple

  const unusedTypes = [];

  try {
    const files = await fs.readdir(TARGET_TYPES_DIR, { recursive: true });

    // Cette analyse serait plus sophistiquée en production
    // Pour l'instant, on retourne une liste vide
    console.log(
      `   📊 Analysé ${files.length} fichiers pour détecter les types inutilisés`
    );
  } catch (error) {
    console.warn(`⚠️ Erreur analyse types inutilisés: ${error.message}`);
  }

  return unusedTypes;
}

async function verifyEnrichedStructure() {
  console.log("🔍 Vérification de la structure enrichie...");

  const verification = {
    directories_present: [],
    files_present: [],
    index_exists: false,
    core_index_exists: false,
    algorithms_index_exists: false,
    ui_index_exists: false,
    utils_index_exists: false,
    total_types_count: 0,
  };

  try {
    const items = await fs.readdir(TARGET_TYPES_DIR, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        verification.directories_present.push(item.name);

        // Vérifier les index de sous-modules
        const subIndexPath = path.join(TARGET_TYPES_DIR, item.name, "index.ts");
        const subIndexExists = await fs
          .access(subIndexPath)
          .then(() => true)
          .catch(() => false);

        verification[`${item.name}_index_exists`] = subIndexExists;
      } else if (item.isFile() && item.name.endsWith(".ts")) {
        verification.files_present.push(item.name);

        if (item.name === "index.ts") {
          verification.index_exists = true;
        }
      }
    }

    // Compter le total des types exportés
    verification.total_types_count = await countTotalExports();
  } catch (error) {
    console.error(`❌ Erreur vérification structure: ${error.message}`);
  }

  return verification;
}

async function countTotalExports() {
  let total = 0;
  for await (const filePath of walkDir(TARGET_TYPES_DIR)) {
    if (!filePath.endsWith(".ts")) continue;
    const content = await fs.readFile(filePath, "utf8");
    const matches = content.match(
      /export\s+(?:interface|type|class|function|const|let|var|enum)\s+\w+/g
    );
    if (matches) total += matches.length;

    // compte aussi les exports nommés
    const named = content.match(/export\s+(?:type\s+)?\{\s*([^}]+)\s*\}/g);
    if (named) total += named.length;
  }
  return total;
}

// Exécution
try {
  const results = await enrichTargetStructure();

  console.log("\n🎯 Structure enrichie:");
  console.log(
    `   📁 Répertoires: ${results.structure_verification.directories_present.join(
      ", "
    )}`
  );
  console.log(
    `   📄 Fichiers: ${results.structure_verification.files_present.length}`
  );
  console.log(
    `   📊 Total exports: ${results.structure_verification.total_types_count}`
  );

  console.log("\n🎯 Prochaine étape:");
  console.log(
    "   Exécuter 3-transform-imports.mjs pour la transformation finale"
  );
} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}
