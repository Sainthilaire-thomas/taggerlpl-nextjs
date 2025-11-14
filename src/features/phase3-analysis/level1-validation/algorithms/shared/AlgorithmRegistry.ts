// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry.ts
import type { BaseAlgorithm } from "./BaseAlgorithm";
import type {
  UniversalAlgorithm,
  AlgorithmMetadata,
} from "@/types/algorithm-lab/algorithms/base";
// Import normal pour les fonctions (pas import type)
import {
  createAlgorithmMetadata,
  convertLegacyMetadata,
} from "@/types/algorithm-lab/algorithms/base";

function isFunc(v: unknown): v is (...args: any[]) => any {
  return typeof v === "function";
}

/**
 * Construit des métadonnées cohérentes quand:
 * - l'algo n'a pas describe()
 * - ou describe() jette / renvoie un objet incomplet
 */
function synthesizeMetadata(
  name: string,
  algorithm: UniversalAlgorithm | BaseAlgorithm<any, any>,
  metaOverride?: Partial<AlgorithmMetadata>
): AlgorithmMetadata {
  // On essaie d'utiliser getMetadata() si dispo (legacy-like)
  const md = isFunc((algorithm as any)?.getMetadata)
    ? (algorithm as any).getMetadata() ?? {}
    : {};

  // Heuristique pour la cible si absente
  const inferTarget = (): string => {
    const n = (md.target ?? metaOverride?.target ?? name)
      .toString()
      .toLowerCase();
    if (n.includes("m2")) return "M2";
    if (n.includes("m1")) return "M1";
    if (
      n.includes("regexx") ||
      n.includes("openai") ||
      n.includes("spacy") ||
      n.includes("x")
    )
      return "X";
    if (n.includes("regexy") || n.includes("y")) return "Y";
    return "X";
  };

  // Utilisation de createAlgorithmMetadata avec champs optionnels
  return createAlgorithmMetadata(
    {
      key: name,
      name: md.name ?? metaOverride?.name ?? name,
      displayName:
        md.displayName ?? md.label ?? metaOverride?.displayName ?? name,
      target: (md.target ?? metaOverride?.target ?? inferTarget()) as any,
      type: (md.type ?? metaOverride?.type ?? "rule-based") as any,
      version: md.version ?? metaOverride?.version ?? "1.0.0",
    },
    {
      batchSupported:
        md.batchSupported ??
        md.supportsBatch ??
        metaOverride?.batchSupported ??
        false,
      description: md.description ?? metaOverride?.description,
      // Préservation des champs legacy
      label: md.label,
      family: md.family,
      evidences: md.evidences,
      topProbs: md.topProbs,
      tags: md.tags,
      id: md.id,
      ...metaOverride,
    }
  );
}

export class AlgorithmRegistry {
  private static algorithms = new Map<
    string,
    UniversalAlgorithm | BaseAlgorithm<any, any>
  >();

  /**
   * Enregistre un algorithme dans le registre.
   * - Si `setMetadata` est présent, injecte { name, ...meta }.
   * - Si `describe()` manque, fabrique un fallback pour éviter tout crash dans l'UI.
   * - Si `meta` est fourni et que `describe()` existe, fusionne les overrides.
   */
  static register(
    name: string,
    algorithm: UniversalAlgorithm | BaseAlgorithm<any, any>,
    meta?: Partial<AlgorithmMetadata>
  ): void {
    if (!algorithm || typeof algorithm !== "object") {
      console.warn(`[Registry] "${name}" invalide (non-objet):`, algorithm);
      return;
    }

    // Permettre aux algos d'ingérer des métadonnées si prévu
    if (meta && isFunc((algorithm as any).setMetadata)) {
      try {
        (algorithm as any).setMetadata({ name, ...meta });
      } catch (e) {
        console.warn(`[Registry] setMetadata a échoué pour "${name}":`, e);
      }
    }

    // Si l'algo n'expose pas describe(), on le fabrique pour éviter un crash UI
    if (!isFunc((algorithm as any).describe)) {
      const synthesized = synthesizeMetadata(name, algorithm, meta);
      (algorithm as any).describe = () => synthesized;
      console.warn(
        `[Registry] "${name}" n'exposait pas describe(), fallback synthétisé.`
      );
    } else if (meta) {
      // Fusionner des overrides fournis lors du register
      try {
        const current = (algorithm as any).describe() ?? {};
        const merged = {
          ...current,
          ...meta,
          name: name,
          key: name,
        };
        (algorithm as any).describe = () => merged;
      } catch {
        const synthesized = synthesizeMetadata(name, algorithm, meta);
        (algorithm as any).describe = () => synthesized;
        console.warn(
          `[Registry] describe() de "${name}" était défaillant, overrides appliqués via fallback.`
        );
      }
    } else {
      // S'assurer que les algos existants ont les champs requis
      try {
        const current = (algorithm as any).describe() ?? {};
        if (!current.key || !current.name) {
          const enhanced = createAlgorithmMetadata(
            {
              key: current.key || name,
              name: current.name || name,
              target: current.target || "X",
              displayName: current.displayName || current.label || name,
              type: current.type || "rule-based",
              version: current.version || "1.0.0",
            },
            {
              ...current,
            }
          );
          (algorithm as any).describe = () => enhanced;
        }
      } catch {
        const synthesized = synthesizeMetadata(name, algorithm);
        (algorithm as any).describe = () => synthesized;
        console.warn(
          `[Registry] describe() de "${name}" réparé avec métadonnées complètes.`
        );
      }
    }

    this.algorithms.set(name, algorithm);
  }

  static get<TInput, TOutput>(
    name: string
  ): (UniversalAlgorithm | BaseAlgorithm<TInput, TOutput>) | undefined {
    const algo = this.algorithms.get(name) as
      | (UniversalAlgorithm | BaseAlgorithm<TInput, TOutput>)
      | undefined;
    if (!algo) {
      console.warn(`⚠️ Algorithme '${name}' non trouvé dans le registre`);
    }
    return algo;
  }

  /**
   * Retourne la liste des algos avec leurs métadonnées.
   * Ne jette pas si un describe() est manquant ou jette.
   * Les entrées problématiques sont réparées (synthèse) ou ignorées avec log.
   */
  static list(): { key: string; meta: AlgorithmMetadata }[] {
    const out: { key: string; meta: AlgorithmMetadata }[] = [];

    for (const [key, algo] of this.algorithms.entries()) {
      const d = (algo as any)?.describe;

      if (!isFunc(d)) {
        const synthesized = synthesizeMetadata(key, algo);
        out.push({ key, meta: synthesized });
        console.warn(
          `[Registry] "${key}" sans describe() → métadonnées synthétisées.`
        );
        continue;
      }

      try {
        const rawMeta = d() as any;

        // Sanity checks — si meta est invalide, on synthétise
        if (!rawMeta || typeof rawMeta !== "object" || !rawMeta.key) {
          const synthesized = synthesizeMetadata(key, algo);
          out.push({ key, meta: synthesized });
          console.warn(
            `[Registry] "${key}" describe() a renvoyé des métadonnées invalides → synthèse appliquée.`
          );
        } else {
          // Conversion vers format étendu si nécessaire
          const extendedMeta: AlgorithmMetadata = rawMeta.key
            ? (rawMeta as AlgorithmMetadata) // Déjà un format acceptable
            : convertLegacyMetadata(rawMeta, key); // Conversion depuis legacy

          out.push({ key, meta: extendedMeta });
        }
      } catch (e) {
        const synthesized = synthesizeMetadata(key, algo);
        out.push({ key, meta: synthesized });
        console.warn(
          `[Registry] "${key}" describe() a levé une exception → métadonnées synthétisées.`,
          e
        );
      }
    }

    return out;
  }

  static getAll(): Map<string, UniversalAlgorithm | BaseAlgorithm<any, any>> {
    return new Map(this.algorithms);
  }

  static unregister(name: string): boolean {
    const deleted = this.algorithms.delete(name);
    return deleted;
  }

  static clear(): void {
    this.algorithms.clear();
  }
}

export const algorithmRegistry = AlgorithmRegistry;
export default algorithmRegistry;
