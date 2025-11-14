// hooks/usePostValidationVersioning.ts
import { supabase } from "@/lib/supabaseClient";
import { algorithmRegistry } from "../../algorithms/shared/AlgorithmRegistry";
import type {
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
  Level1ValidationMetrics,
  VariableConfig,
  AlgorithmMetadata,
} from "@/types/algorithm-lab";

export const usePostValidationVersioning = () => {
  const computeLevel1Metrics = (
    results: TVValidationResultCore[]
  ): Level1ValidationMetrics => {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const accuracy = total ? correct / total : 0;

    // Calcul des métriques par classe (si classification)
    const classes = Array.from(
      new Set([
        ...results.map((r) => r.goldStandard),
        ...results.map((r) => r.predicted),
      ])
    ).filter(Boolean);

    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1: Record<string, number> = {};

    classes.forEach((cls) => {
      const tp = results.filter(
        (r) => r.predicted === cls && r.goldStandard === cls
      ).length;
      const fp = results.filter(
        (r) => r.predicted === cls && r.goldStandard !== cls
      ).length;
      const fn = results.filter(
        (r) => r.predicted !== cls && r.goldStandard === cls
      ).length;

      precision[cls] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[cls] = tp + fn > 0 ? tp / (tp + fn) : 0;
      f1[cls] =
        precision[cls] + recall[cls] > 0
          ? (2 * precision[cls] * recall[cls]) / (precision[cls] + recall[cls])
          : 0;
    });

    // Calcul Kappa de Cohen
    const expectedAccuracy = classes.reduce((sum, cls) => {
      const actualCount = results.filter((r) => r.goldStandard === cls).length;
      const predictedCount = results.filter((r) => r.predicted === cls).length;
      return sum + (actualCount * predictedCount) / (total * total || 1);
    }, 0);

    const kappa =
      expectedAccuracy < 1
        ? (accuracy - expectedAccuracy) / (1 - expectedAccuracy)
        : 0;

    return {
      accuracy,
      precision,
      recall,
      f1,
      kappa,
      sample_size: total,
      test_date: new Date().toISOString(),
    };
  };

  const captureVersionAfterTest = async (
    testResults: TVValidationResultCore[],
    algorithmKey: string,
    targetKind: TargetKind
  ): Promise<AlgorithmVersionId> => {
    // Calculer métriques
    const metrics = computeLevel1Metrics(testResults);

    // 🔧 CORRECTION : Accès correct aux métadonnées via list()
    const registryEntries = algorithmRegistry.list?.() ?? [];
    const algoEntry = registryEntries.find((entry: any) => entry.key === algorithmKey);
    
    if (!algoEntry) {
      throw new Error(`Algorithme ${algorithmKey} non trouvé dans le registry`);
    }

    // ✅ Accès sûr aux métadonnées
    const algoMeta: AlgorithmMetadata = algoEntry.meta;

    if (!algoMeta) {
      throw new Error(`Métadonnées manquantes pour ${algorithmKey}`);
    }

    // Générer version_id unique
    const timestamp = Date.now();
    const shortHash = timestamp.toString(36).slice(-6);
    const versionId: AlgorithmVersionId = 
      `${algorithmKey}-v${algoMeta.version ?? '1.0.0'}-${shortHash}`;

    // Construire config variable
    const variableConfig: VariableConfig = {
      key: algorithmKey,
      version: algoMeta.version ?? '1.0.0',
      config: algoMeta.config ?? {},
    };

    // Payload pour BDD
    const payload: Record<string, any> = {
      version_id: versionId,
      version_name: `${algoMeta.displayName ?? algoMeta.label ?? algorithmKey} v${algoMeta.version ?? '1.0.0'}`,
      is_active: false,
      deprecated: false,
      description: algoMeta.description,
      level1_metrics: metrics,
    };

    // Mapper selon targetKind
    const targetKey = targetKind.toLowerCase();
    payload[`${targetKey}_key`] = variableConfig.key;
    payload[`${targetKey}_version`] = variableConfig.version;
    payload[`${targetKey}_config`] = variableConfig.config;

    console.log(`📦 Payload version:`, payload);

    // Insert dans BDD
    const { error } = await supabase
      .from('algorithm_version_registry')
      .insert(payload);

    if (error) {
      console.error("Erreur BDD:", error);
      throw new Error(`Erreur capture version: ${error.message}`);
    }

    console.log(`✅ Version capturée: ${versionId}`);
    return versionId;
  };

  return {
    captureVersionAfterTest,
    computeLevel1Metrics,
  };
};
