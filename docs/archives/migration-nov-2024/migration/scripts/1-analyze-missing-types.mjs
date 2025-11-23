#!/usr/bin/env node
// 1-analyze-missing-types.mjs
// Inventorie tous les imports du projet AlgorithmLab et mesure la couverture
// offerte par AlgorithmLab/types/{core,algorithms,ui,utils}. Tout le reste
// sous AlgorithmLab/types est considéré legacy (à ré-exporter / migrer).

import fs from "fs/promises";
import path from "path";

console.log("🔍 ANALYSE DES TYPES MANQUANTS ALGORITHMLAB");
console.log("===========================================");

const PROJECT_ROOT = process.cwd();

const ALGOLAB_SRC_DIR = path.join(
  PROJECT_ROOT,
  "src/app/(protected)/analysis/components/AlgorithmLab"
);

const TARGET_TYPES_DIR = path.join(
  PROJECT_ROOT,
  "src/app/(protected)/analysis/components/AlgorithmLab/types"
);

const ANALYSIS_OUTPUT = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "missing-types-analysis.json"
);

// Pour mémoire (entrée centralisée souhaitée)
const TARGET_ENTRY_POINT =
  "@/app/(protected)/analysis/components/AlgorithmLab/types";

// Catégories cibles (comptent pour la couverture)
const TARGET_CATEGORIES = new Set(["core", "algorithms", "ui", "utils"]);

// ---------- Utils chemin / walker ----------

async function* walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkDir(p);
    else yield p;
  }
}

async function* walkDirAbs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkDirAbs(p);
    else yield p;
  }
}

function normPath(p) {
  return p.split(path.sep).join("/");
}

// ---------- Scan exports dans types/ ----------

async function scanCurrentTypes() {
  console.log("🔍 Scan des types actuels dans AlgorithmLab/types...");

  const types = {
    byFile: {},
    byCategory: {
      core: [],
      algorithms: [],
      ui: [],
      utils: [],
      legacy: [],
      other: [],
    },
    totalExports: 0,
  };

  for await (const filePath of walkDir(TARGET_TYPES_DIR)) {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) continue;

    const rel = normPath(path.relative(TARGET_TYPES_DIR, filePath));
    const content = await fs.readFile(filePath, "utf8");
    const exports = extractExportsFromFile(content);
    const category = categorizeFile(rel);

    if (!types.byCategory[category]) types.byCategory[category] = [];
    types.byFile[rel] = { exports, category, path: filePath };
    types.byCategory[category].push(...exports);
    types.totalExports += exports.length;
  }

  return types;
}

function extractExportsFromFile(content) {
  const exports = [];

  // 1) export interface|type|class|function|const|let|var|enum Name
  const decl =
    /export\s+(?:interface|type|class|function|const|let|var|enum)\s+(\w+)/g;

  // 2) export type { A, B as C } from '...';  ET  export { A, B as C } from '...';
  const namedReexport =
    /export\s+(?:type\s+)?\{\s*([^}]+)\s*\}\s*(?:from\s+['"`][^'"`]+['"`])?/g;

  // 3) export * from '...'
  const star = /export\s+\*\s+from\s+['"`]([^'"`]+)['"`]/g;

  let m;

  while ((m = decl.exec(content)) !== null) {
    exports.push(m[1]);
  }

  while ((m = namedReexport.exec(content)) !== null) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const n of names) {
      const parts = n.split(/\s+as\s+/i);
      const name = (parts[1] || parts[0]).trim();
      if (name) exports.push(name);
    }
  }

  while ((m = star.exec(content)) !== null) {
    exports.push(`re-export from ${m[1]}`);
  }

  return exports;
}

function categorizeFile(filenameRelToTypes) {
  const f = filenameRelToTypes; // normalisé
  if (f.startsWith("core/")) return "core";
  if (f.startsWith("algorithms/")) return "algorithms";
  if (f.startsWith("ui/")) return "ui";
  if (f.startsWith("utils/")) return "utils";

  // Legacy : tout ce qui n'est pas dans core/algorithms/ui/utils,
  // y compris fichiers racine de types (Level*, Thesis*, Validation*, Shared*)
  const base = f.split("/").pop() || "";
  if (
    f.startsWith("legacy/") ||
    /^Level/i.test(base) ||
    /^ThesisVariables/i.test(base) ||
    /^ValidationTypes\.ts$/i.test(base) ||
    /^SharedTypes\.ts$/i.test(base) ||
    /^normalizers\.ts$/i.test(base)
  ) {
    return "legacy";
  }

  return "other";
}

// ---------- Scan des imports dans tout AlgorithmLab ----------
function isTypeLikeSource(src) {
  const s = src.replace(/\\/g, "/"); // normaliser
  // 1) tout ce qui vient du paquet central 'AlgorithmLab/types'
  if (s.includes("/AlgorithmLab/types")) return true;
  // 2) fichiers 'types.ts' (ou '*types.ts') dans l'app AlgorithmLab
  if (/\/types\.ts$/i.test(s) || /\/[A-Za-z0-9._-]*types\.ts$/i.test(s))
    return true;
  // 3) fichiers de schémas/validations/variables/calculations sous 'types' historiques
  if (/ThesisVariables|ValidationTypes|Level\d+Types|normalizers\.ts/i.test(s))
    return true;
  return false;
}

function isDefinitelyNotTypesSource(src) {
  const s = src.replace(/\\/g, "/");
  // Libs/UI/React/icônes : on les exclut
  if (s.startsWith("@mui/")) return true;
  if (s === "react" || s.startsWith("react/")) return true;
  if (s.startsWith("@/components/")) return true;
  if (s.startsWith("@/context/")) return true;
  if (s.startsWith("@/lib/")) return true;
  if (s.startsWith("@/app/(protected)/supervision/")) return true;
  return false;
}

async function extractAllProjectImports() {
  const byFile = {};
  const all = new Set();

  const reNamed =
    /import\s+(?:type\s+)?\{\s*([^}]+)\s*\}\s+from\s+['"`]([^'"`]+)['"`]/g;
  const reStarNs = /import\s+\*\s+as\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
  const reDefault = /import\s+([A-Za-z0-9_$]+)\s+from\s+['"`]([^'"`]+)['"`]/g;

  for await (const file of walkDirAbs(ALGOLAB_SRC_DIR)) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
    const content = await fs.readFile(file, "utf8");

    const imports = [];
    let m;

    // Imports nommés (possiblement 'import type')
    while ((m = reNamed.exec(content)) !== null) {
      const raw = m[1];
      const source = m[2];

      // On exclut explicitement ce qui n'est pas des types
      if (isDefinitelyNotTypesSource(source)) continue;

      const isTypeish =
        isTypeLikeSource(source) || /\bimport\s+type\b/.test(m[0]);
      if (!isTypeish) continue; // <- clé : on ne retient que les sources type-like OU 'import type'

      const specifiers = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
          const [imported, local] = part
            .split(/\s+as\s+/i)
            .map((x) => x.trim());
          return { imported, local: local || imported };
        });

      specifiers.forEach((s) => {
        all.add(s.local);
        all.add(s.imported);
      });
      imports.push({ source, specifiers });
    }

    // Namespaces: rarement des types (et non résolvables sans AST) → on stocke juste pour rapport si source type-like
    while ((m = reStarNs.exec(content)) !== null) {
      const ns = m[1];
      const source = m[2];
      if (isDefinitelyNotTypesSource(source)) continue;
      if (!isTypeLikeSource(source)) continue;
      imports.push({ source, namespace: ns, specifiers: [] });
    }

    // Imports par défaut: ignorés pour la couverture des types (souvent valeurs)
    while ((m = reDefault.exec(content)) !== null) {
      const local = m[1];
      const source = m[2];
      // on ne les ajoute pas à 'all', mais on peut les noter si source ‘type-like’ pour la migration
      if (isTypeLikeSource(source) && !isDefinitelyNotTypesSource(source)) {
        imports.push({ source, default: local, specifiers: [] });
      }
    }

    if (imports.length) byFile[normPath(file)] = imports;
  }

  return { byFile, all };
}

async function extractUsedExportsFromProject() {
  const inventory = await extractAllProjectImports();
  return { unique: inventory.all, total: inventory.all.size, inventory };
}

// ---------- Analyse de couverture ----------

function analyzeCoverage(currentTypes, usedExports, importsInventory) {
  const targetExports = new Set();
  const legacyExports = new Set();

  Object.values(currentTypes.byFile).forEach((file) => {
    const bucket = TARGET_CATEGORIES.has(file.category)
      ? targetExports
      : legacyExports;
    file.exports.forEach((e) => {
      if (!e.startsWith("re-export")) bucket.add(e);
    });
  });

  const coverage = {
    covered: [],
    legacy_found: [],
    missing: [],
    extra: [],
    coverage_percentage: 0,
    imports_inventory: importsInventory?.byFile || {},
    legacy_imports_report: [],
  };

  // On ne regarde que les identifiants importés DANS le projet AlgorithmLab
  usedExports.unique.forEach((name) => {
    if (targetExports.has(name)) coverage.covered.push(name);
    else if (legacyExports.has(name)) coverage.legacy_found.push(name);
    else coverage.missing.push(name);
  });

  // Exports cibles non utilisés (info)
  targetExports.forEach((name) => {
    if (!usedExports.unique.has(name)) coverage.extra.push(name);
  });

  const denom =
    coverage.covered.length +
    coverage.legacy_found.length +
    coverage.missing.length;
  coverage.coverage_percentage = denom
    ? (coverage.covered.length / denom) * 100
    : 100;

  // Rapport des fichiers qui importent depuis des sources legacy du paquet types
  const legacyHints = [
    "/types/legacy/",
    "ThesisVariables",
    "Level",
    "ValidationTypes",
    "SharedTypes",
    "/types/normalizers.ts",
  ];

  const targetHints = [
    "/types/core/",
    "/types/algorithms/",
    "/types/ui/",
    "/types/utils/",
  ];

  for (const [absPath, imports] of Object.entries(coverage.imports_inventory)) {
    const legacyImports = imports.filter((imp) => {
      const src = normPath(imp.source);
      if (!src.includes("/AlgorithmLab/types")) return false; // ne reporter que ce qui touche types/
      const isTarget = targetHints.some((h) => src.includes(h));
      const isLegacy = legacyHints.some((h) => src.includes(h)) || !isTarget;
      return isLegacy;
    });
    if (legacyImports.length) {
      coverage.legacy_imports_report.push({
        file: absPath,
        imports: legacyImports,
      });
    }
  }

  return coverage;
}

// ---------- Plans ----------

function getRecommendedLocation(typeName) {
  if (/\b(Details?|Variable|X|Y|M[123])\b/i.test(typeName))
    return "core/variables.ts";
  if (/\b(Calculation|Input)\b/i.test(typeName)) return "core/calculations.ts";
  if (/\b(Validation|Metrics|ConfusionMatrix)\b/i.test(typeName))
    return "core/validation.ts";
  if (/\b(Algorithm|Result|Config|Parameters|Metadata)\b/i.test(typeName))
    return "algorithms/base.ts";
  if (/\b(Props|Tab|UI|Display|Header|Legend|Dialog)\b/i.test(typeName))
    return "ui/components.ts";
  if (/\b(Normalization|Converter|Format|Adapter)\b/i.test(typeName))
    return "utils/converters.ts";
  return "index.ts";
}

function generateEnrichmentPlan(coverage) {
  const plan = {
    phase1_critical: {
      description: "Ajouter les types critiques manquants",
      actions: [],
    },
    phase2_normal: {
      description: "Ajouter les types normaux manquants",
      actions: [],
    },
    phase3_cleanup: {
      description: "Nettoyer et optimiser",
      actions: [
        { action: "REVIEW_UNUSED_TYPES", priority: "LOW" },
        { action: "UPDATE_INDEX_EXPORTS", priority: "MEDIUM" },
      ],
    },
    transform_plan: [],
  };

  // Ici, pas de "critical" listé explicitement → tous en normal (tu pourras spécialiser si besoin)
  for (const t of coverage.missing) {
    plan.phase2_normal.actions.push({
      action: "ADD_TYPE",
      target: t,
      location: getRecommendedLocation(t),
      priority: "MEDIUM",
    });
  }

  // Legacy trouvés → proposer RE-EXPORT + règle de réécriture vers l'entrée centralisée
  for (const t of coverage.legacy_found) {
    plan.transform_plan.push({
      action: "REEXPORT_AND_REWRITE",
      target: t,
      reexport_in: "types/index.ts",
      rewrite_rule: {
        from_any_legacy_source_under_types: true,
        to: TARGET_ENTRY_POINT,
        note: "Ré-exporter le symbole dans l'index, puis réécrire les imports pour pointer vers l'entrée centralisée.",
      },
    });
  }

  return plan;
}

// ---------- Analyse structure cible ----------

async function analyzeTargetStructure() {
  const structure = {
    directories_present: [],
    files_present: [],
    index_file_exists: false,
    recommendations: [],
  };

  try {
    const items = await fs.readdir(TARGET_TYPES_DIR, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) structure.directories_present.push(item.name);
      else if (
        item.isFile() &&
        (item.name.endsWith(".ts") || item.name.endsWith(".tsx"))
      ) {
        structure.files_present.push(item.name);
      }
    }

    structure.index_file_exists = structure.files_present.includes("index.ts");

    const expectedDirs = ["core", "algorithms", "ui", "utils"];
    const missingDirs = expectedDirs.filter(
      (d) => !structure.directories_present.includes(d)
    );
    if (missingDirs.length > 0) {
      structure.recommendations.push(
        `Créer les répertoires manquants: ${missingDirs.join(", ")}`
      );
    }
    if (!structure.index_file_exists) {
      structure.recommendations.push("Créer le fichier index.ts principal");
    }
  } catch (error) {
    structure.recommendations.push(`Erreur d'analyse: ${error.message}`);
  }

  return structure;
}

// ---------- Run ----------

async function analyzeCurrentTypesCoverage() {
  console.log("📊 Analyse de la couverture actuelle des types...");

  const currentTypes = await scanCurrentTypes();
  const { unique, total, inventory } = await extractUsedExportsFromProject();
  const usedExports = { unique, total };

  const coverage = analyzeCoverage(currentTypes, usedExports, inventory);
  const enrichmentPlan = generateEnrichmentPlan(coverage);

  const analysisResult = {
    metadata: {
      generated_at: new Date().toISOString(),
      target_entry_point: TARGET_ENTRY_POINT,
      current_types_scanned: currentTypes.totalExports,
      used_exports_found: usedExports.total,
    },
    current_coverage: coverage,
    missing_types: {
      critical: [], // spécialise si besoin
      normal: [...coverage.missing],
      suggestions: [
        ...(coverage.coverage_percentage < 80
          ? [
              "Couverture faible - envisager un enrichissement majeur de la structure cible",
            ]
          : []),
        ...(coverage.extra.length > coverage.covered.length
          ? [
              "Beaucoup de types cibles non utilisés - envisager un nettoyage / consolidation",
            ]
          : []),
      ],
    },
    enrichment_plan: enrichmentPlan,
    target_structure_status: await analyzeTargetStructure(),
  };

  await fs.mkdir(path.dirname(ANALYSIS_OUTPUT), { recursive: true });
  await fs.writeFile(
    ANALYSIS_OUTPUT,
    JSON.stringify(analysisResult, null, 2),
    "utf8"
  );

  console.log(`✅ Analyse terminée: ${ANALYSIS_OUTPUT}`);
  console.log(`📊 Types actuels: ${currentTypes.totalExports}`);
  console.log(`🎯 Identifiants importés (projet): ${usedExports.total}`);
  const missingCount = coverage.missing.length;
  console.log(`❌ Types manquants: ${missingCount}`);

  return analysisResult;
}

try {
  await analyzeCurrentTypesCoverage();

  console.log("\n🎯 Prochaines étapes recommandées:");
  console.log("   1. Examiner missing-types-analysis.json");
  console.log(
    "   2. Exécuter 2-enrich-target-structure.mjs (re-exports + stubs)"
  );
  console.log(
    "   3. Exécuter 3-transform-imports.mjs (réécriture des imports)"
  );
} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}
