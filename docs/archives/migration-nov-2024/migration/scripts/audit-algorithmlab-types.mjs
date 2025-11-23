#!/usr/bin/env node
// audit-algorithmlab-types.mjs
// Script Node.js pour auditer tous les types AlgorithmLab existants

import fs from "fs/promises";
import path from "path";

console.log("🔍 AUDIT GÉNÉRALISÉ DES TYPES ALGORITHMLAB");
console.log("===========================================");
console.log(
  "Recherche automatique de tous les répertoires et fichiers de types..."
);

const PROJECT_ROOT = process.cwd();
const AUDIT_DIR = path.join(PROJECT_ROOT, "migration", "audit");
const COMPREHENSIVE_AUDIT = path.join(
  AUDIT_DIR,
  "comprehensive-types-audit.json"
);
const IMPORT_PATTERNS_FILE = path.join(
  AUDIT_DIR,
  "detected-import-patterns.txt"
);
const TYPES_DISCOVERY_LOG = path.join(AUDIT_DIR, "types-discovery.log");

// Créer les répertoires d'audit
await fs.mkdir(AUDIT_DIR, { recursive: true });

const logMessage = `=== Audit généralisé démarré le ${new Date().toISOString()} ===\n`;
await fs.writeFile(TYPES_DISCOVERY_LOG, logMessage, "utf8");

console.log(`📁 Projet analysé: ${PROJECT_ROOT}`);

// =================================================================
// PHASE 1: DÉCOUVERTE AUTOMATIQUE DES RÉPERTOIRES DE TYPES
// =================================================================

console.log("\n🔎 PHASE 1: Découverte automatique des répertoires de types");
console.log("============================================================");

async function discoverTypesDirectories() {
  console.log(
    "🔍 Recherche des répertoires contenant des fichiers TypeScript..."
  );

  const srcPath = path.join(PROJECT_ROOT, "src");
  const typesDirs = new Set();

  try {
    // Fonction récursive pour parcourir les répertoires
    async function walkDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Ajouter si le nom contient "types" ou "algorithm"
          if (
            entry.name.toLowerCase().includes("types") ||
            entry.name.toLowerCase().includes("algorithm")
          ) {
            typesDirs.add(fullPath);
          }

          // Continuer la recherche récursive
          try {
            await walkDirectory(fullPath);
          } catch {
            // Ignorer les répertoires inaccessibles
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
        ) {
          // Vérifier si le fichier contient des définitions de types
          try {
            const content = await fs.readFile(fullPath, "utf8");
            if (
              content.match(
                /^export.*interface|^export.*type|^interface|^type /m
              )
            ) {
              typesDirs.add(dir);
            }
          } catch {
            // Ignorer les fichiers illisibles
          }
        }
      }
    }

    await walkDirectory(srcPath);
  } catch (err) {
    console.log(
      `⚠️ Erreur lors de la recherche dans ${srcPath}: ${err.message}`
    );
  }

  const allTypesDirs = Array.from(typesDirs).sort();

  console.log("📂 Répertoires de types découverts:");
  for (const dir of allTypesDirs) {
    console.log(`   ${dir}`);
    await fs.appendFile(TYPES_DISCOVERY_LOG, `   ${dir}\n`, "utf8");
  }

  return allTypesDirs;
}

// =================================================================
// PHASE 2: DÉTECTION AUTOMATIQUE DES PATTERNS D'IMPORT
// =================================================================

console.log("\n🔎 PHASE 2: Détection automatique des patterns d'import");
console.log("=======================================================");

async function extractImportPatterns() {
  console.log("🔍 Extraction des patterns d'import existants...");

  let patternsContent =
    "Patterns d'import détectés:\n============================\n\n";

  const srcPath = path.join(PROJECT_ROOT, "src");
  const typeScriptFiles = [];

  // Fonction pour collecter tous les fichiers TypeScript
  async function collectTsFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await collectTsFiles(fullPath);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          typeScriptFiles.push(fullPath);
        }
      }
    } catch {
      // Ignorer les répertoires inaccessibles
    }
  }

  await collectTsFiles(srcPath);
  console.log(`📄 Analyse de ${typeScriptFiles.length} fichiers TypeScript...`);

  const patterns = [
    {
      name: "IMPORTS DIRECTS DE types/",
      regex: /import.*from.*['"].*types.*['"]/,
    },
    { name: "IMPORTS THESISVARIABLES", regex: /import.*ThesisVariables/ },
    { name: "IMPORTS LEVELXTYPES", regex: /import.*Level[0-9]Types/ },
    { name: "IMPORTS VALIDATIONTYPES", regex: /import.*ValidationTypes/ },
    { name: "IMPORTS SHAREDTYPES", regex: /import.*SharedTypes/ },
    { name: "IMPORTS NORMALIZERS", regex: /import.*normalizers/ },
    {
      name: "AUTRES IMPORTS ALGORITHMIQUES",
      regex: /import.*(Algorithm|Calculator|Classifier)/,
    },
  ];

  const patternResults = {};

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const matches = [];

    patternsContent += `\n${i + 1}. ${pattern.name}\n`;
    patternsContent += "-".repeat(pattern.name.length) + "\n";

    for (const file of typeScriptFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, lineNum) => {
          if (pattern.regex.test(line)) {
            const fileName = path.basename(file);
            matches.push(`${fileName}:${lineNum + 1}: ${line.trim()}`);
          }
        });
      } catch {
        // Ignorer les fichiers illisibles
      }
    }

    patternResults[pattern.name] = matches.length;
    patternsContent += matches.slice(0, 20).join("\n") + "\n";

    if (matches.length > 20) {
      patternsContent += `... et ${matches.length - 20} autres\n`;
    }
  }

  await fs.writeFile(IMPORT_PATTERNS_FILE, patternsContent, "utf8");
  console.log(`✅ Patterns d'import extraits dans: ${IMPORT_PATTERNS_FILE}`);

  return {
    totalFiles: typeScriptFiles.length,
    patterns: patternResults,
  };
}

// =================================================================
// PHASE 3: ANALYSE EXHAUSTIVE DES FICHIERS DE TYPES
// =================================================================

console.log("\n🔎 PHASE 3: Analyse exhaustive des fichiers de types");
console.log("====================================================");

async function analyzeTypesFiles() {
  const srcPath = path.join(PROJECT_ROOT, "src");
  const typesFiles = [];

  // Collecter les fichiers de types
  async function collectTypesFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await collectTypesFiles(fullPath);
        } else if (
          entry.name.match(
            /.*types.*\.ts$|.*Types.*\.ts$|.*variables.*\.ts$|.*Variables.*\.ts$/i
          )
        ) {
          typesFiles.push(fullPath);
        }
      }
    } catch {
      // Ignorer les répertoires inaccessibles
    }
  }

  await collectTypesFiles(srcPath);
  console.log(`🔍 Analyse de ${typesFiles.length} fichiers de types...`);

  const filesAnalysis = {};

  for (const file of typesFiles) {
    try {
      const content = await fs.readFile(file, "utf8");
      const lines = content.split("\n");
      const stats = await fs.stat(file);

      const exports = lines.filter((line) => line.match(/^export/));
      const interfaces = lines.filter((line) =>
        line.match(/^export interface|^interface/)
      );
      const types = lines.filter((line) => line.match(/^export type|^type /));
      const functions = lines.filter((line) =>
        line.match(/^export function|^export const.*=/)
      );
      const imports = lines.filter((line) => line.match(/^import/));

      const relativePath = path
        .relative(PROJECT_ROOT, file)
        .replace(/\\/g, "/");

      filesAnalysis[relativePath] = {
        size_bytes: stats.size,
        lines_count: lines.length,
        exports_count: exports.length,
        interfaces_count: interfaces.length,
        types_count: types.length,
        functions_count: functions.length,
        imports_count: imports.length,
        exports: exports.slice(0, 10),
        interfaces: interfaces.slice(0, 10),
        types: types.slice(0, 10),
        imports: imports.slice(0, 10),
      };

      console.log(
        `  📄 Analysé: ${relativePath} (${exports.length} exports, ${interfaces.length} interfaces)`
      );
    } catch (err) {
      console.log(`⚠️ Erreur lors de l'analyse de ${file}: ${err.message}`);
    }
  }

  return filesAnalysis;
}

// =================================================================
// PHASE 4: GÉNÉRATION DU RAPPORT COMPLET
// =================================================================

console.log("\n🔎 PHASE 4: Génération du rapport complet");
console.log("=========================================");

async function generateComprehensiveAudit() {
  console.log("📊 Génération du rapport complet...");

  const startTime = Date.now();

  // Exécuter toutes les analyses
  const typesDirs = await discoverTypesDirectories();
  const importStats = await extractImportPatterns();
  const filesAnalysis = await analyzeTypesFiles();

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Construire le rapport final
  const auditData = {
    audit_metadata: {
      generated_at: new Date().toISOString(),
      project_root: PROJECT_ROOT,
      audit_version: "2.0.0-nodejs",
      total_typescript_files: importStats.totalFiles,
      total_types_files: Object.keys(filesAnalysis).length,
      scan_duration_seconds: Math.round(duration * 100) / 100,
    },
    discovered_directories: typesDirs,
    types_files_analysis: filesAnalysis,
    import_patterns_summary: importStats.patterns,
    recommendations: [
      "Examiner les patterns: cat " + IMPORT_PATTERNS_FILE,
      "Générer les nouveaux types avec les scripts suivants",
      "Exécuter la transformation des imports",
      "Valider la compilation: npx tsc --noEmit",
    ],
  };

  await fs.writeFile(
    COMPREHENSIVE_AUDIT,
    JSON.stringify(auditData, null, 2),
    "utf8"
  );
  console.log(`✅ Rapport complet généré: ${COMPREHENSIVE_AUDIT}`);

  return auditData;
}

// =================================================================
// EXÉCUTION PRINCIPALE
// =================================================================

console.log("\n🚀 EXÉCUTION DE L'AUDIT COMPLET");
console.log("=================================");

try {
  const report = await generateComprehensiveAudit();

  // Affichage du résumé final
  console.log("\n📊 RÉSUMÉ DE L'AUDIT COMPLET");
  console.log("=============================");

  console.log(
    `📁 Fichiers TypeScript totaux: ${report.audit_metadata.total_typescript_files}`
  );
  console.log(
    `🏷️ Fichiers de types: ${report.audit_metadata.total_types_files}`
  );
  console.log(
    `📂 Répertoires de types: ${report.discovered_directories.length}`
  );
  console.log(
    `⏱️ Durée du scan: ${report.audit_metadata.scan_duration_seconds}s`
  );

  console.log("\n📋 Fichiers générés:");
  console.log(`   📊 Audit complet: ${COMPREHENSIVE_AUDIT}`);
  console.log(`   📋 Patterns d'import: ${IMPORT_PATTERNS_FILE}`);
  console.log(`   📝 Log détaillé: ${TYPES_DISCOVERY_LOG}`);

  console.log("\n🎯 Prochaines étapes recommandées:");
  console.log("   1. Examiner les patterns trouvés");
  console.log("   2. Générer les nouveaux types");
  console.log("   3. Transformer les imports");
  console.log("   4. Valider la compilation");

  console.log("\n✅ AUDIT COMPLET TERMINÉ AVEC SUCCÈS!");
} catch (err) {
  console.error("❌ Erreur lors de l'audit:", err.message);
  process.exit(1);
}
