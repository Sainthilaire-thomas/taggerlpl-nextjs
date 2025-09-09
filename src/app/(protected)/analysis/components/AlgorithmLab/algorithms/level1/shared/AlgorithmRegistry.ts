// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry.ts
import type { BaseAlgorithm, AlgorithmMetadata } from "./BaseAlgorithm";
// 👉 Import des types universels pour accepter aussi les nouveaux algos
import type { UniversalAlgorithm } from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";

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
  metaOverride?: Omit<AlgorithmMetadata, "name">
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
    return "unknown";
  };

  const target = md.target ?? metaOverride?.target ?? inferTarget();

  // ⚠️ Fallback type :
  // - on évite "classifier" qui n'existe pas dans nos unions
  // - on autorise "metric" (cas M1) même si le legacy ne le connaissait pas
  const typeCandidate =
    md.type ??
    metaOverride?.type ??
    (target === "M1" ? "metric" : "rule-based");

  const displayName =
    md.displayName ?? md.name ?? metaOverride?.displayName ?? name;
  const version = md.version ?? metaOverride?.version ?? "1.0.0";
  const batchSupported = !!(
    md.batchSupported ??
    md.supportsBatch ??
    metaOverride?.batchSupported
  );
  const description = md.description ?? metaOverride?.description;

  // On cast "type" en any ici pour tolérer l'écart éventuel d'unions legacy/universel
  return {
    name,
    displayName,
    type: typeCandidate as any,
    target,
    version,
    batchSupported,
    description,
  } as AlgorithmMetadata;
}

export class AlgorithmRegistry {
  // 👉 Accepte désormais UniversalAlgorithm **ou** BaseAlgorithm
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
    meta?: Omit<AlgorithmMetadata, "name">
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
        (algorithm as any).describe = () => ({
          ...current,
          ...meta,
          name, // on impose toujours le name du registre
        });
      } catch {
        const synthesized = synthesizeMetadata(name, algorithm, meta);
        (algorithm as any).describe = () => synthesized;
        console.warn(
          `[Registry] describe() de "${name}" était défaillant, overrides appliqués via fallback.`
        );
      }
    }

    this.algorithms.set(name, algorithm);
    // console.log(`✅ Algorithme enregistré: ${name}`);
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
        // Fabriquer une meta synthétique pour rester tolérant
        const synthesized = synthesizeMetadata(key, algo);
        out.push({ key, meta: synthesized });
        console.warn(
          `[Registry] "${key}" sans describe() → métadonnées synthétisées.`
        );
        continue;
      }

      try {
        const meta = d() as AlgorithmMetadata;
        // Sanity checks — si meta est invalide, on synthétise
        if (!meta || typeof meta !== "object" || !meta.name) {
          const synthesized = synthesizeMetadata(key, algo);
          out.push({ key, meta: synthesized });
          console.warn(
            `[Registry] "${key}" describe() a renvoyé des métadonnées invalides → synthèse appliquée.`
          );
        } else {
          out.push({ key, meta });
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
    if (deleted) {
      // console.log(`🗑️ Algorithme désenregistré: ${name}`);
    }
    return deleted;
  }

  static clear(): void {
    this.algorithms.clear();
    // console.log("🧹 Registre des algorithmes vidé");
  }
}

export const algorithmRegistry = AlgorithmRegistry;
export default algorithmRegistry;
