import { FineTuningData, ExtractionStats } from "./types";
import { TVValidationResult } from "../../types";
import { generateErrorAnalysis } from "../../utils/errorAnalysis";
import {
  computeMetrics,
  renderPerLabelTable,
  renderConfusion,
} from "./FineTuningMetrics";

export const formatFineTuningPrompt = (
  trainingExamples: FineTuningData[],
  originalResults: TVValidationResult[]
): string => {
  const stats = calculateExtractionStats(trainingExamples, originalResults);
  const m = computeMetrics(originalResults);

  const hasTraining = trainingExamples.length > 0;
  const errorAnalysisBlock = hasTraining
    ? generateErrorAnalysis(trainingExamples)
    : "_Aucun résultat non conforme dans l'échantillon. Rapport généré sans données d'entraînement (JSONL vide)._";

  return `# Données d'entraînement pour fine-tuning d'algorithme de tagging conversationnel

## Contexte
Ces données proviennent d'un système d'analyse conversationnelle. Le jeu d'entraînement ci-dessous correspond aux **résultats non conformes** (prédiction ≠ gold).

## Statistiques globales
- **Total**: ${m.total} | **Corrects**: ${m.correct} | **Accuracy**: ${(
    m.accuracy * 100
  ).toFixed(1)}%
- **Confiance moyenne**: ${(m.avgConfidence * 100).toFixed(1)}%
- **Temps moyen**: ${m.avgProcessingTime} ms
- **Kappa (Cohen)**: ${m.kappa}
- **Algorithme source**: ${getAlgorithmInfo(originalResults)}
- **Résultats d'entraînement (non conformes)**: ${trainingExamples.length}/${
    originalResults.length
  } (${stats.annotationCoverage.toFixed(1)}%)
- **Taux d'erreur global**: ${stats.errorRate.toFixed(1)}%

## Métriques (type MetricsPanel)
${renderPerLabelTable(m.perLabel)}

### Matrice de confusion (pred → gold)
${renderConfusion(m.confusion)}

## Données d'entraînement (format JSONL)
\`\`\`jsonl
${trainingExamples.map((d) => JSON.stringify(d)).join("\n")}
\`\`\`

## Analyse des erreurs (sur exemples annotés)
${errorAnalysisBlock}

## Exemples d'annotations d'experts
${generateExpertExamples(trainingExamples)}

## Recommandations pour le fine-tuning
${generateRecommendations(trainingExamples)}

## Instructions d'utilisation
${generateUsageInstructions(trainingExamples.length)}

## Métadonnées techniques
\`\`\`json
${JSON.stringify(generateMetadata(stats), null, 2)}
\`\`\`
`;
};

const calculateExtractionStats = (
  trainingExamples: FineTuningData[],
  originalResults: TVValidationResult[]
): ExtractionStats => {
  const totalErrors = originalResults.filter((r) => !r.correct).length;
  const uniqueAlgorithms = new Set(
    trainingExamples.map((d) => d.metadata.algo.classifier)
  ).size;

  return {
    totalResults: originalResults.length,
    processedCount: trainingExamples.length,
    annotationsFound: trainingExamples.length, // ici = nb d'exemples d'entraînement
    errorsCount: totalErrors,
    uniqueAlgorithms,
    annotationCoverage:
      (trainingExamples.length / originalResults.length) * 100,
    errorRate: (totalErrors / originalResults.length) * 100,
  };
};

const getAlgorithmInfo = (results: TVValidationResult[]): string => {
  const firstResult = results[0];
  if (!firstResult?.metadata) return "Non spécifié";
  const classifier = firstResult.metadata.classifier;
  const model = firstResult.metadata.model;
  return model ? `${classifier} (${model})` : classifier || "Non spécifié";
};

const generateExpertExamples = (examples: FineTuningData[]): string => {
  if (!examples.length) return "_Aucun exemple disponible._";
  return examples
    .slice(0, 3)
    .map(
      (data, idx) => `
### Exemple ${idx + 1}
- **Verbatim**: "${data.metadata.verbatim}"
- **Prédit**: ${data.metadata.predicted} | **Réel**: ${
        data.metadata.goldStandard
      }
- **Confiance**: ${(data.metadata.confidence * 100).toFixed(1)}%
- **Annotation**: ${data.metadata.annotations?.[0] || "—"}
- **Contexte**: ${formatContext(data.metadata.context)}
`
    )
    .join("\n");
};

const formatContext = (context: any): string => {
  const parts: string[] = [];
  if (context?.prev1) parts.push(`Précédent: "${context.prev1}"`);
  if (context?.next1) parts.push(`Suivant: "${context.next1}"`);
  return parts.join(" | ") || "Aucun contexte";
};

const generateRecommendations = (examples: FineTuningData[]): string => {
  const totalComments = examples.reduce(
    (acc, d) => acc + (d.metadata.annotations?.length || 0),
    0
  );
  return `1. **Cibler les confusions majeures** (voir matrice)
2. **Exploiter le contexte** (tours adjacents) dans les règles
3. **Réviser la charte** là où l'ambiguïté est forte (faibles F1)
4. **Valider via cross-validation** sur un jeu tenu à part
(Commentaires d'experts disponibles: ${totalComments})`;
};

const generateUsageInstructions = (n: number): string => {
  return `1. Utiliser ces ${n} exemples non conformes pour le fine-tuning
2. Incorporer les ajustements issus de l'analyse d'erreurs
3. Réévaluer sur un échantillon de validation
4. Comparer les performances avant/après`;
};

const generateMetadata = (stats: ExtractionStats) => {
  return {
    extraction_date: new Date().toISOString(),
    total_examples: stats.processedCount,
    unique_algorithms: stats.uniqueAlgorithms,
    annotation_coverage: `${stats.annotationCoverage.toFixed(1)}%`,
    error_rate: `${stats.errorRate.toFixed(1)}%`,
  };
};

export function formatJSONL(data: any[]): string {
  return data.map((item) => JSON.stringify(item)).join("\n");
}

export function formatMarkdown(data: any[]): string {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  let markdown = `| ${headers.join(" | ")} |\n`;
  markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;

  data.forEach((item) => {
    const row = headers.map((header) => String(item[header] || "")).join(" | ");
    markdown += `| ${row} |\n`;
  });

  return markdown;
}
