#!/usr/bin/env node
// scripts/gen-types-doc.mjs
// Génère un referencetypes.md à partir du contenu de AlgorithmLab/types
// Usage:
//   node scripts/gen-types-doc.mjs \
//     --root src/app/(protected)/analysis/components/AlgorithmLab/types \
//     --out  src/app/(protected)/analysis/components/AlgorithmLab/types/referencetypes.md
//
// Options:
//   --full           -> inclut le contenu complet des fichiers .ts dans la doc
//   --maxPreview=80  -> si non --full, longueur max de l'aperçu de signature
//
// Cross-OS (Windows/macOS/Linux) – Node >= 18 recommandé

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// Setup
// ---------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const [k, v] = a.split("=");
      args[k.replace(/^--/, "")] = v ?? true;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const ROOT =
  args.root || "src/app/(protected)/analysis/components/AlgorithmLab/types";
const OUT = args.out || path.join(ROOT, "referencetypes.md");
const FULL = !!args.full;
const MAX_PREVIEW = Number.isFinite(Number(args.maxPreview))
  ? Number(args.maxPreview)
  : 80;

// Dossiers à couvrir (ordre imposé)
const TARGET_DIRS = ["index.ts", "algorithms", "core", "legacy", "ui", "utils"];

// ---------------------------------------------------------
// FS helpers
// ---------------------------------------------------------
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(dir, filter = (f) => f.endsWith(".ts")) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const nested = await readDirRecursive(full, filter);
      files.push(...nested);
    } else if (e.isFile() && filter(e.name)) {
      files.push(full);
    }
  }
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function relToRoot(abs) {
  return abs
    .replaceAll("\\", "/")
    .replace(/^.*?AlgorithmLab\/types\//, "AlgorithmLab/types/");
}

function toTreeLines(root, allPaths) {
  // Affiche une arborescence stable : dossiers et fichiers .ts
  const rels = allPaths.map((p) =>
    p.replace(root + path.sep, "").replaceAll("\\", "/")
  );
  rels.sort();
  const seen = new Set();
  const lines = [];
  for (const r of rels) {
    const parts = r.split("/");
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const isFile = i === parts.length - 1 && parts[i].endsWith(".ts");
      acc = acc ? acc + "/" + parts[i] : parts[i];
      const indent = "  ".repeat(i);
      const line = isFile ? `${indent}- ${parts[i]}` : `${indent}${parts[i]}/`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    }
  }
  return lines;
}

// ---------------------------------------------------------
// Parsing exports & signatures
// ---------------------------------------------------------

/**
 * Extrait les exports d’un fichier source .ts sans dépendre d’un parser TS.
 * Couvre :
 *  - export type/interface/class/const/function/declare …
 *  - export default X
 *  - export { A, B as C } from '...'
 *  - export * from '...'
 */
function extractExports(src) {
  const exports = [];

  // Normalise les fins de ligne pour robustesse
  const s = src.replace(/\r\n?/g, "\n");

  // export (declare)? type|interface|class|const|function Name
  const declRe =
    /^export\s+(?:declare\s+)?(?:type|interface|class|const|function)\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while ((m = declRe.exec(s)) !== null) {
    exports.push({ kind: "decl", name: m[1] });
  }

  // export default Name
  const defaultRe = /^export\s+default\s+([A-Za-z0-9_$]+)/gm;
  while ((m = defaultRe.exec(s)) !== null) {
    exports.push({ kind: "default", name: m[1] });
  }

  // export { A, B as C } from '...';    &    export { A, B as C };
  const namedRe = /^export\s*\{([^}]+)\}\s*(?:from\s*["'][^"']+["'])?;?/gm;
  while ((m = namedRe.exec(s)) !== null) {
    const names = m[1]
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        // gère "A as B"
        const asMatch = x.match(/^([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$/i);
        if (asMatch) return asMatch[2];
        return x;
      });
    for (const n of names) {
      exports.push({ kind: "named", name: n });
    }
  }

  // export * from "…"
  const starRe = /^export\s*\*\s*from\s*["']([^"']+)["'];?/gm;
  while ((m = starRe.exec(s)) !== null) {
    exports.push({ kind: "star", from: m[1] });
  }

  return exports;
}

function summarizeExports(exports) {
  if (!exports.length) return "_(aucun export explicite détecté)_";
  const decl = exports.filter((e) => e.kind === "decl").map((e) => e.name);
  const named = exports.filter((e) => e.kind === "named").map((e) => e.name);
  const def = exports.filter((e) => e.kind === "default").map((e) => e.name);
  const star = exports.filter((e) => e.kind === "star").map((e) => e.from);

  const lines = [];
  if (decl.length) lines.push(`- **Déclarations**: ${decl.join(", ")}`);
  if (named.length) lines.push(`- **Nommés**: ${named.join(", ")}`);
  if (def.length) lines.push(`- **Default**: ${def.join(", ")}`);
  if (star.length)
    lines.push(`- **Re-exports \`*\`** depuis: ${star.join(", ")}`);
  return lines.join("\n");
}

/**
 * Extrait des "signatures" exportées (multi-lignes) en mode aperçu.
 * Heuristique : on récupère chaque bloc démarrant par `export` jusqu’au
 * premier `;` trouvé au même niveau de parenthèses/accolades OU jusqu’à
 * la première ligne vide après la première ligne.
 */
function extractSignatures(src, limit = 80) {
  const s = src.replace(/\r\n?/g, "\n");
  const lines = s.split("\n");

  const sigs = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*export\b/.test(line)) {
      let block = line;
      let depth = 0;
      let j = i + 1;

      if (line.trim().endsWith(";")) {
        // single-line export already terminated
      } else {
        while (j < lines.length) {
          const l = lines[j];
          block += "\n" + l;
          for (const ch of l) {
            if (ch === "{" || ch === "(" || ch === "[") depth++;
            if (ch === "}" || ch === ")" || ch === "]")
              depth = Math.max(0, depth - 1);
          }
          const trimmed = l.trim();
          const endedWithSemicolon = trimmed.endsWith(";") && depth === 0;
          const emptyAfterStart = trimmed === "" && j > i + 1 && depth === 0;

          if (endedWithSemicolon || emptyAfterStart) break;
          j++;
        }
        i = j;
      }

      const compact = block
        .split("\n")
        .map((x) => x.replace(/\s+$/g, ""))
        .join("\n");

      if (!compact.includes("\n")) {
        sigs.push(
          compact.length > limit ? compact.slice(0, limit) + " …" : compact
        );
      } else {
        const clipped = compact
          .split("\n")
          .map((x) => (x.length > limit ? x.slice(0, limit) + " …" : x))
          .join("\n");
        sigs.push(clipped);
      }
    }
    i++;
  }
  return sigs;
}

// ---------------------------------------------------------
// Section builders
// ---------------------------------------------------------

async function sectionForFolder(root, folderName) {
  const abs = path.join(root, folderName);
  const present = await exists(abs);

  if (!present) return `## ${folderName}\n_(dossier introuvable)_\n`;

  if (folderName.endsWith(".ts")) {
    // cas "index.ts" à la racine
    const src = await fs.readFile(abs, "utf8");
    const exports = extractExports(src);
    const sigs = extractSignatures(src, MAX_PREVIEW);

    return [
      `## ${folderName}`,
      "",
      "### Exports détectés",
      summarizeExports(exports),
      "",
      FULL ? "### Contenu" : "### Signatures export (aperçu)",
      "```ts",
      FULL ? src : sigs.join("\n\n"),
      "```",
      "",
    ].join("\n");
  }

  const allFiles = await readDirRecursive(abs, (f) => f.endsWith(".ts"));
  const tree = toTreeLines(abs, allFiles);
  const section = [
    `## ${folderName}`,
    "",
    "### Arborescence",
    "```text",
    `${folderName}/`,
    ...tree,
    "```",
    "",
  ];

  for (const file of allFiles) {
    const rel = relToRoot(file);
    const src = await fs.readFile(file, "utf8");
    const exports = extractExports(src);
    const sigs = extractSignatures(src, MAX_PREVIEW);

    section.push(
      `#### \`${rel}\``,
      "",
      "**Exports**",
      "",
      summarizeExports(exports),
      "",
      FULL ? "**Contenu**" : "**Signatures export (aperçu)**",
      "",
      "```ts",
      FULL ? src : sigs.join("\n\n"),
      "```",
      ""
    );
  }

  return section.join("\n");
}

// ---------------------------------------------------------
// Version helpers
// ---------------------------------------------------------
async function tryReadCodeVersion(rootAbs) {
  try {
    const idx = path.join(rootAbs, "index.ts");
    const src = await fs.readFile(idx, "utf8");
    const m = src.match(/ALGORITHM_LAB_VERSION\s*=\s*["'`](.*?)["'`]/m);
    return m?.[1] || "unknown";
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------
// Main
// ---------------------------------------------------------
async function main() {
  const rootAbs = path.resolve(process.cwd(), ROOT);
  const outAbs = path.resolve(process.cwd(), OUT);

  const codeVersion = await tryReadCodeVersion(rootAbs);
  const docVersion = `Doc-Version: ${new Date().toISOString()}-${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`;

  const header = [
    "# Reference — Types normalisés AlgorithmLab",
    "",
    `> Généré automatiquement le ${new Date().toISOString()} à partir de \`${
      relToRoot(rootAbs) || ROOT
    }\``,
    `> ${docVersion}`,
    `> Code-Version: ${codeVersion}`,
    "",
    "## Contenu",
    "- [index.ts](#indexts)",
    "- [algorithms/](#algorithms)",
    "- [core/](#core)",
    "- [legacy/](#legacy)",
    "- [ui/](#ui)",
    "- [utils/](#utils)",
    "",
  ].join("\n");

  const sections = [header];

  for (const entry of TARGET_DIRS) {
    sections.push(await sectionForFolder(rootAbs, entry));
  }

  const md = sections.join("\n");
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, md, "utf8");
  console.log(`✅ Documentation générée: ${outAbs}`);
}

main().catch((err) => {
  console.error("❌ Échec génération documentation:", err);
  process.exit(1);
});
