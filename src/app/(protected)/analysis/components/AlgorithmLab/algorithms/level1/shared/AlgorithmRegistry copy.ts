import type { BaseAlgorithm, AlgorithmMetadata } from "./BaseAlgorithm";

export class AlgorithmRegistry {
  private static algorithms = new Map<string, BaseAlgorithm<any, any>>();

  static register(
    name: string,
    algorithm: BaseAlgorithm<any, any>,
    meta?: Omit<AlgorithmMetadata, "name"> // << ici
  ): void {
    if (meta && typeof (algorithm as any).setMetadata === "function") {
      (algorithm as any).setMetadata({ name, ...meta });
    }
    this.algorithms.set(name, algorithm);
    console.log(`✅ Algorithme enregistré: ${name}`);
  }

  static get<TInput, TOutput>(
    name: string
  ): BaseAlgorithm<TInput, TOutput> | undefined {
    const algo = this.algorithms.get(name) as
      | BaseAlgorithm<TInput, TOutput>
      | undefined;
    if (!algo)
      console.warn(`⚠️ Algorithme '${name}' non trouvé dans le registre`);
    return algo;
  }

  static list(): { key: string; meta: AlgorithmMetadata }[] {
    return Array.from(this.algorithms.entries()).map(([key, algo]) => ({
      key,
      meta: algo.describe(),
    }));
  }

  static getAll(): Map<string, BaseAlgorithm<any, any>> {
    return new Map(this.algorithms);
  }

  static unregister(name: string): boolean {
    const deleted = this.algorithms.delete(name);
    if (deleted) console.log(`🗑️ Algorithme désenregistré: ${name}`);
    return deleted;
  }

  static clear(): void {
    this.algorithms.clear();
    console.log("🧹 Registre des algorithmes vidé");
  }
}

export const algorithmRegistry = AlgorithmRegistry;
export default algorithmRegistry;
