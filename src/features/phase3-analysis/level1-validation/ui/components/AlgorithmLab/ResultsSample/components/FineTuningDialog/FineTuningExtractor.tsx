import { TVValidationResult, FineTuningData } from "../../types";
import { formatFineTuningPrompt } from "./FineTuningFormatter";

export class FineTuningExtractor {
  private results: TVValidationResult[];
  private onProgress?: (current: number, total: number) => void;

  constructor(
    results: TVValidationResult[],
    onProgress?: (current: number, total: number) => void
  ) {
    this.results = results;
    this.onProgress = onProgress;
  }

  async extract(): Promise<string> {
    console.log(`🔍 EXTRACTION pour ${this.results.length} résultats`);

    // 1) Sélection = **non conformes** (jeu d'entraînement)
    const misclassified = this.results.filter((r) => r && !r.correct);
    console.log(
      `📊 Non conformes: ${misclassified.length}/${this.results.length}`
    );

    // 2) Convertit chaque non conforme en exemple JSONL (annotations = optionnel)
    const trainingData: FineTuningData[] = [];
    let processed = 0;

    for (const result of misclassified) {
      processed++;
      this.onProgress?.(processed, misclassified.length);

      const annotations = Array.isArray(result.metadata?.annotations)
        ? (result.metadata!.annotations as any[])
        : [];

      const item = this.createFineTuningData(result, annotations);
      trainingData.push(item);
    }

    console.log(`🎯 Générés: ${trainingData.length} exemples d'entraînement`);

    // 3) Toujours générer le rapport (même si 0 non conformes → JSONL vide)
    return formatFineTuningPrompt(trainingData, this.results);
  }

  private createFineTuningData(
    result: TVValidationResult,
    annotations: any[]
  ): FineTuningData {
    const m = result.metadata || {};

    const context = {
      prev2: m.prev2_turn_verbatim || null,
      prev1: m.prev1_turn_verbatim || null,
      current: result.verbatim,
      next1: m.next_turn_verbatim || null,
    };

    // commentaires experts si présents (facultatif)
    const expertComments =
      (annotations || [])
        .map(
          (ann: any) =>
            ann?.rationale || ann?.comment || ann?.note || ann?.reason
        )
        .filter(Boolean) || [];

    const systemHeader =
      expertComments.length > 0
        ? `Tu es un expert en analyse conversationnelle. Analyse le tour de parole dans son contexte et attribue le bon tag selon les annotations d'experts.

Annotations disponibles :
${expertComments.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}`
        : `Tu es un expert en analyse conversationnelle. Analyse le tour de parole dans son contexte et attribue le bon tag en respectant la charte de taggage (ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION).`;

    return {
      messages: [
        { role: "system", content: systemHeader },
        {
          role: "user",
          content: `Contexte conversationnel :
${context.prev2 ? `Tour -2: "${context.prev2}"` : ""}
${context.prev1 ? `Tour -1: "${context.prev1}"` : ""}
**Tour à analyser**: "${context.current}"
${context.next1 ? `Tour +1: "${context.next1}"` : ""}

Algorithme actuel prédit: ${result.predicted} (confiance: ${(
            (result.confidence || 0) * 100
          ).toFixed(1)}%)
Quel devrait être le bon tag selon vous ?`,
        },
        {
          role: "assistant",
          content: `Le tag correct est **${result.goldStandard}**.

${
  expertComments.length > 0
    ? `Justification selon l'expert : ${expertComments[0]}`
    : `Justification : application stricte de la charte (priorité à l'action).`
}

L'algorithme a ${
            result.predicted === result.goldStandard
              ? "correctement"
              : "incorrectement"
          } prédit "${result.predicted}" au lieu de "${result.goldStandard}".`,
        },
      ],
      metadata: {
        turnId: parseInt(String(m.turnId || m.id || 0), 10),
        verbatim: result.verbatim,
        context,
        predicted: result.predicted,
        goldStandard: result.goldStandard,
        confidence: result.confidence ?? 0,
        annotations: expertComments,
        algo: {
          classifier: m.classifier || "unknown",
          model: m.model || null,
          type: m.type || null,
          provider: m.provider || null,
          temperature: m.temperature || null,
          max_tokens: m.maxTokens || null,
        },
      },
    };
  }
}
