#!/usr/bin/env node
// 3-transform-imports.mjs
// Réécrit les imports legacy vers l'entrée centralisée AlgorithmLab/types

import fs from "fs/promises";
import path from "path";

console.log("🔄 TRANSFORMATION DES IMPORTS ALGORITHMLAB");
console.log("==========================================");

const PROJECT_ROOT = process.cwd();
const ALGOLAB_SRC_DIR = path.join(
  PROJECT_ROOT,
  "src/app/(protected)/analysis/components/AlgorithmLab"
);

// Entrée centralisée cible
const TARGET_ENTRY_POINT =
  "@/app/(protected)/analysis/components/AlgorithmLab/types";

// Rapport de sortie
const TRANSFORMATION_OUTPUT = path.join(
  PROJECT_ROOT,
  "migration",
  "audit",
  "imports-transformation-completed.json"
);

// Options
const DRY_RUN = process.argv.includes("--dry");

// ------------------------ utils ------------------------

function norm(p) {
  return p.split(path.sep).join("/");
}

async function* walk(dir) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
function isTSFile(p) {
  const n = p.toLowerCase();
  return n.endsWith(".ts") || n.endsWith(".tsx");
}

// Match “from '…'” ou “from "…"
const FROM_RE = /(from\s+['"])([^'"]+)(['"])/g;

// legacy ciblés (fin de chemin)
const LEGACY_FILE_RE =
  /(Level0Types|Level1Types|ValidationTypes|SharedTypes|ThesisVariables(?:\.(?:x|y|m1|m2|m3))?)$/i;

// détecte si la source est déjà OK
function isCleanTarget(src) {
  const s = src.replace(/\\/g, "/");
  // ok si déjà l’entrée centralisée ou un sous-barrel officiel
  if (s === TARGET_ENTRY_POINT) return true;
  if (/\/AlgorithmLab\/types(?:\/(core|algorithms|ui|utils))?$/.test(s))
    return true;
  if (/\/types$/.test(s)) return true; // chemin relatif déjà vers barrel root
  return false;
}

// renvoie la nouvelle source si legacy, sinon null
function rewriteSource(rawSource) {
  const s = rawSource.replace(/\\/g, "/");

  // déjà clean → pas de changement
  if (isCleanTarget(s)) return null;

  // legacy sous alias absolu (…/AlgorithmLab/types/XYZ)
  if (/\/AlgorithmLab\/types\//.test(s) && LEGACY_FILE_RE.test(s)) {
    return TARGET_ENTRY_POINT;
  }

  // legacy sous chemin relatif (…/types/XYZ)
  if (/\/types\//.test(s) && LEGACY_FILE_RE.test(s)) {
    return TARGET_ENTRY_POINT;
  }

  // ne change rien sinon
  return null;
}

// ------------------------ transformation ------------------------

async function transformFile(absPath) {
  const before = await fs.readFile(absPath, "utf8");
  let changed = 0;

  const after = before.replace(FROM_RE, (m, p1, src, p3) => {
    const newSrc = rewriteSource(src);
    if (newSrc && newSrc !== src) {
      changed++;
      return `${p1}${newSrc}${p3}`;
    }
    return m;
  });

  if (changed > 0 && !DRY_RUN) {
    await fs.writeFile(absPath, after, "utf8");
  }

  return { changed, after };
}

async function transformAll() {
  const changedFiles = [];
  let touchedImports = 0;
  let totalFiles = 0;

  for await (const file of walk(ALGOLAB_SRC_DIR)) {
    if (!isTSFile(file)) continue;
    totalFiles++;
    const { changed } = await transformFile(file);
    if (changed > 0) {
      touchedImports += changed;
      changedFiles.push(norm(path.relative(PROJECT_ROOT, file)));
    }
  }

  return { totalFiles, changedFiles, touchedImports };
}

// ------------------------ validation ------------------------

async function runTypecheck() {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const { stdout, stderr } = await execAsync(
      "npx tsc --noEmit --skipLibCheck",
      { cwd: PROJECT_ROOT, timeout: 90000 }
    );
    return { success: true, output: stdout, errors: stderr || "" };
  } catch (error) {
    return {
      success: false,
      output: "",
      errors: [String(error.message || error)],
    };
  }
}

async function quickImportCheck() {
  // Échantillon léger : vérifie qu'il ne reste plus de chemins legacy évidents
  const issues = [];
  const LEGACY_CHECK =
    /(ThesisVariables(\.(x|y|m1|m2|m3))?|Level[01]Types|ValidationTypes|SharedTypes)/;

  let scanned = 0;
  for await (const file of walk(ALGOLAB_SRC_DIR)) {
    if (!isTSFile(file)) continue;
    const content = await fs.readFile(file, "utf8");
    scanned++;
    if (LEGACY_CHECK.test(content) && !content.includes(TARGET_ENTRY_POINT)) {
      // s'il reste un “nom legacy” sans passer par la cible, on le note
      issues.push(norm(path.relative(PROJECT_ROOT, file)));
    }
    if (scanned >= 50) break; // échantillon
  }
  return { success: issues.length === 0, issues, scanned };
}

// ------------------------ main ------------------------

async function main() {
  console.log(`🎯 Cible: ${TARGET_ENTRY_POINT}`);
  console.log(
    `🧪 Mode: ${DRY_RUN ? "dry-run (aucune écriture)" : "écriture activée"}`
  );

  const results = await transformAll();

  if (DRY_RUN) {
    console.log(
      `🧪 Dry-run: ${results.changedFiles.length} fichier(s) avec réécriture possible, ${results.touchedImports} import(s) touché(s).`
    );
  } else {
    console.log(
      `✅ Réécriture terminée: ${results.changedFiles.length} fichier(s) modifié(s), ${results.touchedImports} import(s) réécrit(s).`
    );
  }

  if (results.changedFiles.length) {
    console.log("\nFichiers affectés (aperçu) :");
    results.changedFiles.slice(0, 20).forEach((f) => console.log(" -", f));
    if (results.changedFiles.length > 20)
      console.log(` ... +${results.changedFiles.length - 20} autres`);
  } else {
    console.log("Aucun import legacy trouvé à réécrire.");
  }

  // validations
  const typecheck = await runTypecheck();
  const importCheck = await quickImportCheck();

  // rapport
  const report = {
    metadata: {
      finished_at: new Date().toISOString(),
      dry_run: DRY_RUN,
      target_entry_point: TARGET_ENTRY_POINT,
    },
    stats: {
      total_files_scanned: results.totalFiles,
      files_changed: results.changedFiles.length,
      imports_rewritten: results.touchedImports,
    },
    changed_files: results.changedFiles,
    validation: {
      typescript: { success: typecheck.success },
      quick_import_check: importCheck,
    },
  };

  await fs.mkdir(path.dirname(TRANSFORMATION_OUTPUT), { recursive: true });
  await fs.writeFile(
    TRANSFORMATION_OUTPUT,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log(`\n📝 Rapport: ${TRANSFORMATION_OUTPUT}`);
  console.log(`🔍 Typecheck: ${typecheck.success ? "OK" : "ERREUR"}`);
  if (!typecheck.success) console.log(typecheck.errors);
  console.log(
    `🔍 Import check: ${
      importCheck.success
        ? "OK"
        : `à revoir (${importCheck.issues.length} fichier(s))`
    }`
  );
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
