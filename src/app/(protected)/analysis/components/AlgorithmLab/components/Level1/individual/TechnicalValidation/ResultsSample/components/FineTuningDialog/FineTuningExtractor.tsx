import { TVValidationResult, FineTuningData } from "../../types";
import { generateErrorAnalysis } from "../../utils/errorAnalysis";
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
    const annotatedResults: FineTuningData[] = [];
    let processedCount = 0;
    let annotationsFound = 0;

    console.log(`🔍 Début extraction pour ${this.results.length} résultats...`);

    for (const result of this.results) {
      const m = result.metadata || {};
      const turnId = m.turnId ?? m.id;

      processedCount++;
      this.onProgress?.(processedCount, this.results.length);

      if (!turnId) {
        console.warn(`❌ Pas de turnId pour le résultat ${processedCount}`);
        continue;
      }

      // ✅ CORRECTION : Utiliser les annotations des métadonnées directement
      let annotations = [];

      // Vérifier si les annotations sont dans metadata.annotations
      if (
        m.annotations &&
        Array.isArray(m.annotations) &&
        m.annotations.length > 0
      ) {
        annotations = m.annotations;
        console.log(
          `📝 Trouvé ${annotations.length} annotations dans metadata pour turnId ${turnId}`
        );
      } else {
        console.warn(
          `⚠️ Aucune annotation trouvée dans metadata pour turnId ${turnId}`
        );
      }

      if (annotations.length > 0) {
        annotationsFound++;
        const fineTuningData = this.createFineTuningData(result, annotations);
        annotatedResults.push(fineTuningData);
      } else {
        console.warn(`⚠️ Aucune annotation trouvée pour turnId ${turnId}`);
      }
    }

    console.log(
      `✅ Extraction terminée: ${annotationsFound} exemples avec annotations trouvés sur ${processedCount} résultats traités`
    );

    if (annotatedResults.length === 0) {
      throw new Error(
        `Aucune annotation trouvée dans les ${this.results.length} résultats. 
        Ajoutez des annotations avant d'extraire les données de fine-tuning.`
      );
    }

    return formatFineTuningPrompt(annotatedResults, this.results);
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

    // Extraire les commentaires des annotations avec différents champs possibles
    const expertComments = annotations
      .map((ann: any) => ann.rationale || ann.comment || ann.note || ann.reason)
      .filter(Boolean);

    return {
      messages: [
        {
          role: "system",
          content: this.generateSystemPrompt(expertComments),
        },
        {
          role: "user",
          content: this.generateUserPrompt(context),
        },
        {
          role: "assistant",
          content: this.generateAssistantResponse(
            result,
            expertComments,
            annotations
          ),
        },
      ],
      metadata: {
        turnId: parseInt(String(m.turnId || m.id)),
        verbatim: result.verbatim,
        context,
        predicted: result.predicted,
        goldStandard: result.goldStandard,
        confidence: result.confidence,
        annotations: expertComments,
        algo: {
          classifier:
            m.classifier || annotations[0]?.algo?.classifier || "unknown",
          model: m.model || null,
          type: m.type || null,
          provider: m.provider || null,
          temperature: m.temperature || null,
          max_tokens: m.maxTokens || null,
        },
        rawAnnotations: annotations, // Garder les annotations complètes
      },
    };
  }

  private generateSystemPrompt(expertComments: string[]): string {
    return `Tu es un expert en analyse conversationnelle. Analyse le tour de parole dans son contexte et attribue le bon tag parmi les options disponibles. 

Instructions :
- Considère le contexte conversationnel complet (tours précédents et suivants)
- Identifie la stratégie ou l'intention communicative du locuteur
- Choisis le tag le plus approprié selon la taxonomie définie
- Justifie brièvement ton choix

Annotations d'experts disponibles :
${expertComments.map((comment) => `- ${comment}`).join("\n")}`;
  }

  private generateUserPrompt(context: any): string {
    return `Contexte conversationnel :
${context.prev2 ? `Tour -2: ${context.prev2}` : ""}
${context.prev1 ? `Tour -1: ${context.prev1}` : ""}
**Tour à analyser**: ${context.current}
${context.next1 ? `Tour +1: ${context.next1}` : ""}

Quel tag attribuerais-tu à ce tour de parole ?`;
  }

  private generateAssistantResponse(
    result: TVValidationResult,
    expertComments: string[],
    annotations: any[]
  ): string {
    // Utiliser le gold_label de l'annotation si disponible, sinon goldStandard
    const correctTag = annotations[0]?.gold_label || result.goldStandard;

    return `Le tag approprié est **${correctTag}**.

Justification : ${
      expertComments[0] || "Tag correct selon l'annotation experte."
    }`;
  }
}
