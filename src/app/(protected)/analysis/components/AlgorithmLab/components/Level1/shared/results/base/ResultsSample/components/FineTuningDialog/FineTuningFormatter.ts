// ===================================================================
// 5. CRÉATION: FineTuningFormatter.ts (pour corriger les exports manquants)
// ===================================================================

// src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsSample/components/FineTuningDialog/FineTuningFormatter.ts

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
