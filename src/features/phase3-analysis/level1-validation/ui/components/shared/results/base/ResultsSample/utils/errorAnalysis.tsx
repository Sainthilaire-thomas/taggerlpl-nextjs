import {
  FineTuningData,
  ErrorAnalysis,
} from "../components/FineTuningDialog/types";

export const generateErrorAnalysis = (data: FineTuningData[]): string => {
  const errorPatterns: { [key: string]: number } = {};
  const confusionMatrix: { [key: string]: { [key: string]: number } } = {};

  // Analyser les patterns d'erreur
  data.forEach((item) => {
    const predicted = item.metadata.predicted;
    const gold = item.metadata.goldStandard;

    if (predicted !== gold) {
      const pattern = `${predicted} → ${gold}`;
      errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;

      // Construire la matrice de confusion
      if (!confusionMatrix[predicted]) confusionMatrix[predicted] = {};
      confusionMatrix[predicted][gold] =
        (confusionMatrix[predicted][gold] || 0) + 1;
    }
  });

  const sortedErrors = Object.entries(errorPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return `### Erreurs les plus fréquentes :
${sortedErrors
  .map(([pattern, count]) => `- **${pattern}**: ${count} occurrences`)
  .join("\n")}

### Matrice de confusion (top erreurs) :
${Object.entries(confusionMatrix)
  .slice(0, 3)
  .map(
    ([pred, golds]) =>
      `- **Prédit ${pred}** : ${Object.entries(golds)
        .map(([gold, count]) => `${gold}(${count})`)
        .join(", ")}`
  )
  .join("\n")}`;
};

export const calculateErrorAnalysis = (
  data: FineTuningData[]
): ErrorAnalysis => {
  const errorPatterns: { [key: string]: number } = {};
  const confusionMatrix: { [predicted: string]: { [gold: string]: number } } =
    {};

  data.forEach((item) => {
    const predicted = item.metadata.predicted;
    const gold = item.metadata.goldStandard;

    if (predicted !== gold) {
      const pattern = `${predicted} → ${gold}`;
      errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;

      if (!confusionMatrix[predicted]) confusionMatrix[predicted] = {};
      confusionMatrix[predicted][gold] =
        (confusionMatrix[predicted][gold] || 0) + 1;
    }
  });

  const topErrors = Object.entries(errorPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));

  const frequentMistakes = topErrors.slice(0, 5).map((error) => error.pattern);

  return {
    errorPatterns,
    confusionMatrix,
    topErrors,
    frequentMistakes,
  };
};

export const generateErrorInsights = (analysis: ErrorAnalysis): string[] => {
  const insights: string[] = [];

  if (analysis.topErrors.length > 0) {
    const mostCommon = analysis.topErrors[0];
    insights.push(
      `L'erreur la plus fréquente est "${mostCommon.pattern}" avec ${mostCommon.count} occurrences`
    );
  }

  const totalErrors = Object.values(analysis.errorPatterns).reduce(
    (sum, count) => sum + count,
    0
  );
  if (totalErrors > 0) {
    insights.push(`${totalErrors} erreurs analysées au total`);
  }

  const uniqueErrorTypes = Object.keys(analysis.errorPatterns).length;
  insights.push(`${uniqueErrorTypes} types d'erreurs différents identifiés`);

  return insights;
};
