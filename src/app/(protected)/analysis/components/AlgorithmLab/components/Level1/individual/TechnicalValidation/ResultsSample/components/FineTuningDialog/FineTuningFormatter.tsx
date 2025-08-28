import { FineTuningData, ExtractionStats } from "./types";
import { TVValidationResult } from "../../types";
import { generateErrorAnalysis } from "../../utils/errorAnalysis";

export const formatFineTuningPrompt = (
  annotatedResults: FineTuningData[],
  originalResults: TVValidationResult[]
): string => {
  const stats = calculateExtractionStats(annotatedResults, originalResults);

  return `# Données d'entraînement pour fine-tuning d'algorithme de tagging conversationnel

## Contexte
Ces données proviennent d'un système d'analyse conversationnelle où des experts ont annoté ${
    annotatedResults.length
  } tours de parole incorrectement classifiés par l'algorithme actuel.

## Statistiques
- **Total d'exemples annotés**: ${annotatedResults.length}
- **Sur total de résultats**: ${originalResults.length}
- **Taux d'annotation**: ${stats.annotationCoverage.toFixed(1)}%
- **Algorithme source**: ${getAlgorithmInfo(originalResults)}
- **Taux d'erreur global**: ${stats.errorRate.toFixed(1)}%

## Données d'entraînement (format JSONL)

\`\`\`jsonl
${annotatedResults.map((data) => JSON.stringify(data, null, 0)).join("\n")}
\`\`\`

## Analyse des erreurs communes

${generateErrorAnalysis(annotatedResults)}

## Exemples d'annotations d'experts

${generateExpertExamples(annotatedResults)}

## Recommandations pour le fine-tuning

${generateRecommendations(annotatedResults)}

## Instructions d'utilisation

${generateUsageInstructions(annotatedResults.length)}

## Métadonnées techniques

\`\`\`json
${JSON.stringify(generateMetadata(stats), null, 2)}
\`\`\`

Est-ce que tu peux m'aider à analyser ces **vraies données d'annotations** et proposer des améliorations spécifiques pour l'algorithme ?`;
};

const calculateExtractionStats = (
  annotatedResults: FineTuningData[],
  originalResults: TVValidationResult[]
): ExtractionStats => {
  const totalErrors = originalResults.filter((r) => !r.correct).length;
  const uniqueAlgorithms = new Set(
    annotatedResults.map((d) => d.metadata.algo.classifier)
  ).size;

  return {
    totalResults: originalResults.length,
    processedCount: annotatedResults.length,
    annotationsFound: annotatedResults.length,
    errorsCount: totalErrors,
    uniqueAlgorithms,
    annotationCoverage:
      (annotatedResults.length / originalResults.length) * 100,
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

const generateExpertExamples = (annotatedResults: FineTuningData[]): string => {
  return annotatedResults
    .slice(0, 3)
    .map(
      (data, idx) => `
### Exemple ${idx + 1}
- **Verbatim**: "${data.metadata.verbatim}"
- **Prédit**: ${data.metadata.predicted} | **Réel**: ${
        data.metadata.goldStandard
      }
- **Confiance**: ${(data.metadata.confidence * 100).toFixed(1)}%
- **Annotation**: ${data.metadata.annotations[0] || "Pas d'annotation"}
- **Contexte**: ${formatContext(data.metadata.context)}
`
    )
    .join("\n");
};

const formatContext = (context: any): string => {
  const parts = [];
  if (context.prev1) parts.push(`Précédent: "${context.prev1}"`);
  if (context.next1) parts.push(`Suivant: "${context.next1}"`);
  return parts.join(" | ") || "Aucun contexte";
};

const generateRecommendations = (
  annotatedResults: FineTuningData[]
): string => {
  const totalAnnotations = annotatedResults.reduce(
    (acc, d) => acc + d.metadata.annotations.length,
    0
  );

  return `1. **Contexte conversationnel** : L'algorithme doit mieux prendre en compte les tours précédents et suivants
2. **Annotations d'experts** : Utiliser les ${totalAnnotations} justifications pour améliorer la compréhension des nuances
3. **Cas d'erreur fréquents** : Focus sur les patterns identifiés dans l'analyse
4. **Validation croisée** : Tester sur un ensemble de validation distinct`;
};

const generateUsageInstructions = (exampleCount: number): string => {
  return `1. Utilise ces ${exampleCount} exemples pour créer un dataset d'entraînement
2. Implémente les recommandations ci-dessus
3. Teste le modèle fine-tuné sur un échantillon de validation
4. Compare les performances avant/après fine-tuning`;
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

export const formatJSONL = (data: FineTuningData[]): string => {
  return data.map((item) => JSON.stringify(item, null, 0)).join("\n");
};

export const formatMarkdown = (
  data: FineTuningData[],
  title: string = "Données de Fine-tuning"
): string => {
  return `# ${title}

## Résumé
- **Nombre d'exemples**: ${data.length}
- **Date d'extraction**: ${new Date().toLocaleString("fr-FR")}

## Données

${data
  .map(
    (item, idx) => `
### Exemple ${idx + 1}
**Verbatim**: ${item.metadata.verbatim}
**Tags**: ${item.metadata.predicted} → ${item.metadata.goldStandard}
**Annotation**: ${item.metadata.annotations[0] || "Aucune"}

\`\`\`json
${JSON.stringify(item, null, 2)}
\`\`\`
`
  )
  .join("\n")}
`;
};
