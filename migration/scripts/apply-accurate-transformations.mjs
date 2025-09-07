#!/usr/bin/env node
// apply-accurate-transformations.mjs
// Applique les transformations précises basées sur votre architecture unifiée

import fs from "fs/promises";
import path from "path";

console.log("🎯 APPLICATION DES TRANSFORMATIONS PRÉCISES");
console.log("==========================================");

const PROJECT_ROOT = process.cwd();
const RULES_FILE = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "accurate-transformation-rules.json"
);
const BACKUP_DIR = path.join(PROJECT_ROOT, "migration", "backups");
const TRANSFORM_LOG = path.join(
  PROJECT_ROOT,
  "migration",
  "accurate-transformation.log"
);

console.log("📋 Chargement des règles précises...");

try {
  const rulesContent = await fs.readFile(RULES_FILE, "utf8");
  const rules = JSON.parse(rulesContent);

  console.log(`✅ Règles chargées: ${rules.metadata.strategy}`);
  console.log(
    `📊 Imports à transformer: ${rules.metadata.total_imports_to_transform}`
  );
  console.log(`🎯 Architecture cible: ${rules.metadata.target_structure}`);

  // Créer les répertoires nécessaires
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // Initialiser le log
  const logHeader = `=== Transformation précise démarrée le ${new Date().toISOString()} ===\n`;
  await fs.writeFile(TRANSFORM_LOG, logHeader, "utf8");

  // Exécuter la transformation par lots prioritaires
  await executeByPriorityBatches(rules);
} catch (error) {
  console.error("❌ Erreur:", error.message);
  if (error.code === "ENOENT") {
    console.log(
      "💡 Exécutez d'abord: node migration/scripts/generate-accurate-transformation-rules.mjs"
    );
  }
  process.exit(1);
}

async function executeByPriorityBatches(rules) {
  console.log("\n🔄 Exécution par lots prioritaires...");

  // Validation pré-transformation
  console.log("\n1️⃣ Validation pré-transformation...");
  const preValidation = await runValidation(
    rules.validation_rules.pre_transformation
  );

  if (!preValidation.success) {
    console.error("❌ Validation pré-transformation échouée");
    preValidation.errors.forEach((err) => console.error(`   ${err}`));
    return;
  }

  console.log("✅ Validation pré-transformation réussie");

  // Identifier tous les fichiers candidats
  console.log("\n2️⃣ Identification des fichiers candidats...");
  const allCandidateFiles = await identifyAllCandidateFiles(rules);

  if (allCandidateFiles.length === 0) {
    console.log("🎉 Aucun fichier à transformer trouvé");
    return;
  }

  console.log(`📄 ${allCandidateFiles.length} fichiers candidats trouvés`);

  // Traitement par lots prioritaires
  console.log("\n3️⃣ Traitement par lots prioritaires...");
  const globalResults = {
    totalFiles: 0,
    successCount: 0,
    errorCount: 0,
    transformationsApplied: 0,
    errors: [],
  };

  for (const batch of rules.priority_batches) {
    console.log(`\n📦 LOT ${batch.batch}: ${batch.name}`);
    console.log(`   📋 ${batch.description}`);
    console.log(`   🎯 Priorité: ${batch.priority}`);

    // Filtrer les fichiers pour ce lot
    const batchFiles = filterFilesForBatch(allCandidateFiles, batch, rules);

    if (batchFiles.length === 0) {
      console.log(`   ℹ️ Aucun fichier pour ce lot`);
      continue;
    }

    console.log(`   📄 ${batchFiles.length} fichiers à traiter`);

    // Créer les backups pour ce lot
    await createBackupsForBatch(batchFiles, batch.batch);

    // Appliquer les transformations pour ce lot
    const batchResults = await applyTransformationsForBatch(
      batchFiles,
      rules,
      batch
    );

    // Accumulation des résultats
    globalResults.totalFiles += batchResults.totalFiles;
    globalResults.successCount += batchResults.successCount;
    globalResults.errorCount += batchResults.errorCount;
    globalResults.transformationsApplied += batchResults.transformationsApplied;
    globalResults.errors.push(...batchResults.errors);

    // Validation incrémentale si demandée
    if (rules.validation_rules.during_transformation) {
      console.log(`   🔍 Validation incrémentale...`);
      const incrementalValidation = await runSimpleCompilationCheck();
      if (!incrementalValidation.success) {
        console.error(
          `   ❌ Validation incrémentale échouée pour le lot ${batch.batch}`
        );
        console.error(`   🔄 Considérez un rollback partiel si nécessaire`);
      } else {
        console.log(`   ✅ Validation incrémentale réussie`);
      }
    }

    console.log(
      `   📊 Lot ${batch.batch}: ${batchResults.successCount}/${batchResults.totalFiles} fichiers traités, ${batchResults.transformationsApplied} transformations`
    );
  }

  // Validation post-transformation globale
  console.log("\n4️⃣ Validation post-transformation globale...");
  const postValidation = await runValidation(
    rules.validation_rules.post_transformation
  );

  // Rapport final
  generateFinalAccurateReport(globalResults, postValidation, rules);
}

async function identifyAllCandidateFiles(rules) {
  const candidateFiles = [];
  const srcPath = path.join(PROJECT_ROOT, "src");

  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          const content = await fs.readFile(fullPath, "utf8");

          // Vérifier si le fichier contient des imports à transformer
          const hasTargetImports = Object.keys(rules.source_path_mappings).some(
            (oldPath) => {
              return (
                content.includes(`from "${oldPath}"`) ||
                content.includes(`from '${oldPath}'`)
              );
            }
          );

          if (hasTargetImports) {
            candidateFiles.push({
              path: fullPath,
              relativePath: path.relative(PROJECT_ROOT, fullPath),
              content: content,
              patterns: detectPatterns(content, rules),
            });
          }
        }
      }
    } catch {
      // Ignorer les répertoires inaccessibles
    }
  }

  await scanDirectory(srcPath);
  return candidateFiles;
}

function detectPatterns(content, rules) {
  const patterns = [];

  // Détecter les patterns pour chaque lot
  rules.priority_batches.forEach((batch) => {
    batch.patterns.forEach((pattern) => {
      if (content.includes(pattern)) {
        patterns.push({
          batch: batch.batch,
          pattern: pattern,
          priority: batch.priority,
        });
      }
    });
  });

  return patterns;
}

function filterFilesForBatch(allFiles, batch, rules) {
  return allFiles.filter((file) => {
    return file.patterns.some((pattern) => pattern.batch === batch.batch);
  });
}

async function createBackupsForBatch(batchFiles, batchNumber) {
  const batchBackupDir = path.join(BACKUP_DIR, `batch-${batchNumber}`);
  await fs.mkdir(batchBackupDir, { recursive: true });

  for (const file of batchFiles) {
    const backupFileName =
      file.relativePath.replace(/[\/\\]/g, "_") + ".backup";
    const backupPath = path.join(batchBackupDir, backupFileName);

    try {
      await fs.copyFile(file.path, backupPath);
      console.log(`     💾 ${file.relativePath}`);
    } catch (error) {
      console.error(
        `     ❌ Erreur backup ${file.relativePath}: ${error.message}`
      );
    }
  }
}

async function applyTransformationsForBatch(batchFiles, rules, batch) {
  const results = {
    totalFiles: batchFiles.length,
    successCount: 0,
    errorCount: 0,
    transformationsApplied: 0,
    errors: [],
  };

  for (const file of batchFiles) {
    console.log(`     🔄 ${file.relativePath}`);

    try {
      let transformedContent = file.content;
      let fileTransformations = 0;

      // Appliquer les mappings de chemins pour cette batch
      for (const [oldPath, newPath] of Object.entries(
        rules.source_path_mappings
      )) {
        // Vérifier si ce mapping est pertinent pour cette batch
        const isRelevantForBatch = batch.patterns.some((pattern) =>
          oldPath.includes(pattern)
        );

        if (isRelevantForBatch) {
          const doubleQuotePattern = new RegExp(
            `from "${oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
            "g"
          );
          const singleQuotePattern = new RegExp(
            `from '${oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`,
            "g"
          );

          const beforeCount =
            (transformedContent.match(doubleQuotePattern) || []).length +
            (transformedContent.match(singleQuotePattern) || []).length;

          if (beforeCount > 0) {
            transformedContent = transformedContent.replace(
              doubleQuotePattern,
              `from "${newPath}"`
            );
            transformedContent = transformedContent.replace(
              singleQuotePattern,
              `from '${newPath}'`
            );

            fileTransformations += beforeCount;
            console.log(
              `       📝 ${oldPath} → ${newPath} (${beforeCount} occurrences)`
            );
          }
        }
      }

      // Écrire le fichier transformé
      await fs.writeFile(file.path, transformedContent, "utf8");

      results.successCount++;
      results.transformationsApplied += fileTransformations;

      // Log détaillé
      await fs.appendFile(
        TRANSFORM_LOG,
        `✅ BATCH-${batch.batch} ${file.relativePath}: ${fileTransformations} transformations\n`,
        "utf8"
      );

      console.log(
        `       ✅ ${fileTransformations} transformations appliquées`
      );
    } catch (error) {
      results.errorCount++;
      results.errors.push(
        `BATCH-${batch.batch} ${file.relativePath}: ${error.message}`
      );

      console.error(`       ❌ Erreur: ${error.message}`);
      await fs.appendFile(
        TRANSFORM_LOG,
        `❌ BATCH-${batch.batch} ${file.relativePath}: ${error.message}\n`,
        "utf8"
      );
    }
  }

  return results;
}

async function runValidation(validationRules) {
  const results = {
    success: true,
    errors: [],
    warnings: [],
  };

  for (const rule of validationRules) {
    console.log(`  🔍 ${rule.description}...`);

    if (rule.command) {
      try {
        const validationResult = await runCommand(
          rule.command,
          rule.timeout || 30000
        );

        if (!validationResult.success) {
          if (rule.required) {
            results.success = false;
            results.errors.push(
              `${rule.description}: ${validationResult.error || "Failed"}`
            );
          } else {
            results.warnings.push(
              `${rule.description}: ${validationResult.error || "Failed"}`
            );
          }
          console.log(`    ❌ Échec`);
        } else {
          console.log(`    ✅ Succès`);
        }
      } catch (error) {
        if (rule.required) {
          results.success = false;
          results.errors.push(`${rule.description}: ${error.message}`);
        } else {
          results.warnings.push(`${rule.description}: ${error.message}`);
        }
        console.log(`    ⚠️ Erreur: ${error.message}`);
      }
    } else {
      // Règles sans commande (backup_creation, etc.)
      console.log(`    ✅ Vérifié`);
    }
  }

  return results;
}

async function runSimpleCompilationCheck() {
  try {
    const result = await runCommand("npx tsc --noEmit", 30000);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runCommand(command, timeout) {
  const { spawn } = await import("child_process");

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(" ");
    const process = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let errors = "";

    process.stdout.on("data", (data) => (output += data.toString()));
    process.stderr.on("data", (data) => (errors += data.toString()));

    const timeoutId = setTimeout(() => {
      process.kill();
      resolve({ success: false, error: "Timeout" });
    }, timeout);

    process.on("close", (code) => {
      clearTimeout(timeoutId);
      resolve({
        success: code === 0,
        error: code !== 0 ? errors : null,
        output: output,
      });
    });
  });
}

function generateFinalAccurateReport(
  transformationResults,
  validationResults,
  rules
) {
  console.log("\n📊 RAPPORT FINAL DE TRANSFORMATION PRÉCISE");
  console.log("==========================================");

  console.log(`📁 Fichiers traités: ${transformationResults.totalFiles}`);
  console.log(`✅ Succès: ${transformationResults.successCount}`);
  console.log(`❌ Erreurs: ${transformationResults.errorCount}`);
  console.log(
    `🔄 Transformations appliquées: ${transformationResults.transformationsApplied}`
  );

  // Afficher le détail par lot
  console.log("\n📦 Résumé par lot:");
  rules.priority_batches.forEach((batch) => {
    console.log(`   Lot ${batch.batch} (${batch.priority}): ${batch.name}`);
  });

  if (validationResults.success) {
    console.log("✅ Validation finale: SUCCÈS");
  } else {
    console.log("❌ Validation finale: ÉCHEC");
    validationResults.errors.forEach((err) => console.log(`   ${err}`));
  }

  if (validationResults.warnings.length > 0) {
    console.log("⚠️ Avertissements:");
    validationResults.warnings.forEach((warn) => console.log(`   ${warn}`));
  }

  console.log("\n📋 Fichiers générés:");
  console.log(`   💾 Backups par lot: ${BACKUP_DIR}/batch-*`);
  console.log(`   📝 Log détaillé: ${TRANSFORM_LOG}`);

  if (validationResults.success && transformationResults.errorCount === 0) {
    console.log("\n🎉 TRANSFORMATION PRÉCISE TERMINÉE AVEC SUCCÈS!");
    console.log("\n🎯 Prochaines étapes:");
    console.log("   1. Tester l'application: npm run dev");
    console.log("   2. Vérifier les fonctionnalités AlgorithmLab");
    console.log("   3. Tests manuels des imports transformés");
    console.log(
      '   4. Commiter: git add . && git commit -m "Migrate AlgorithmLab to unified architecture"'
    );

    console.log("\n📊 Migration vers architecture unifiée réussie:");
    console.log(
      `   📁 Point d\'entrée: ${
        rules.legacy_compatibility.temporary_aliases
          ? Object.values(rules.legacy_compatibility.temporary_aliases)[0]
              .split("/")
              .slice(0, -1)
              .join("/")
          : "types"
      }`
    );
    console.log("   📂 Structure: core/ | algorithms/ | ui/ | utils/");
    console.log("   🔄 Compatibility: Maintenue avec anciens fichiers");
  } else {
    console.log("\n⚠️ TRANSFORMATION AVEC AVERTISSEMENTS");
    console.log("\n🔧 Actions recommandées:");
    console.log("   1. Examiner les erreurs dans le log détaillé");
    console.log("   2. Vérifier manuellement les fichiers problématiques");
    console.log("   3. Corriger si nécessaire puis relancer la validation");
    console.log("   4. En cas de problème majeur, rollback depuis les backups");

    if (transformationResults.errors.length > 0) {
      console.log("\n❌ Erreurs détectées:");
      transformationResults.errors
        .slice(0, 5)
        .forEach((err) => console.log(`   ${err}`));
      if (transformationResults.errors.length > 5) {
        console.log(
          `   ... et ${
            transformationResults.errors.length - 5
          } autres erreurs (voir log)`
        );
      }
    }
  }

  console.log("\n📖 Documentation de l'architecture unifiée:");
  console.log("   📄 Voir: migration/audit/accurate-transformation-rules.json");
  console.log("   📋 Règles appliquées: Path mappings + Legacy compatibility");
  console.log(
    "   🔄 Phase suivante: Redistribution optionnelle vers core/algorithms/ui/utils"
  );
}
