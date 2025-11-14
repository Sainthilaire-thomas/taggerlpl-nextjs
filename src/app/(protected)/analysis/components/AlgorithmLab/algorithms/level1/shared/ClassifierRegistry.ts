// algorithms/level1/shared/ClassifierRegistry.ts
import { BaseClassifier, ClassifierMetadata } from "./BaseClassifier";

export class ClassifierRegistry {
  private static classifiers = new Map<string, BaseClassifier>();

  static register(name: string, classifier: BaseClassifier): void {
    this.classifiers.set(name, classifier);
    console.log(`✅ Classificateur enregistré: ${name}`);
  }

  static getClassifier(name: string): BaseClassifier | undefined {
    const classifier = this.classifiers.get(name);
    if (!classifier) {
      console.warn(`⚠️ Classificateur '${name}' non trouvé dans le registre`);
    }
    return classifier;
  }

  static getAvailableClassifiers(): ClassifierMetadata[] {
    return Array.from(this.classifiers.values()).map((c) => c.getMetadata());
  }

  static getAllClassifiers(): Map<string, BaseClassifier> {
    return new Map(this.classifiers);
  }

  static unregister(name: string): boolean {
    const deleted = this.classifiers.delete(name);
    if (deleted) {
      console.log(`🗑️ Classificateur désenregistré: ${name}`);
    }
    return deleted;
  }

  static listRegistered(): string[] {
    return Array.from(this.classifiers.keys());
  }

  static clear(): void {
    this.classifiers.clear();
    console.log("🧹 Registre des classificateurs vidé");
  }
}
