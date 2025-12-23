// ============================================================================
// PromptBuilder - Construction de prompts depuis prompt_structure
// ============================================================================

import { CharteDefinition, PromptStructure } from "@/types/algorithm-lab/Level0Types";

/**
 * Contexte conversationnel pour génération de prompt
 */
export interface PromptContext {
  prev3_verbatim?: string;
  prev2_verbatim?: string;
  prev1_verbatim?: string;
  conseiller_verbatim?: string;
  client_verbatim?: string;
  next1_verbatim?: string;
  next2_verbatim?: string;
  next3_verbatim?: string;
}

/**
 * Service de construction de prompts pour chartes Level 0
 */
export class PromptBuilder {
  /**
   * Construit le prompt complet depuis une charte
   * @param charte - Définition de la charte
   * @param context - Contexte conversationnel (optionnel pour preview)
   * @returns Prompt formaté prêt pour le LLM
   */
  static buildPrompt(charte: CharteDefinition, context?: PromptContext): string {
    const sections: string[] = [];
    const promptStructure = charte.definition.prompt_structure;

    if (!promptStructure) {
      throw new Error("prompt_structure manquant dans la charte");
    }

    // 1. Récupérer toutes les sections enabled, triées par order
    const enabledSections = Object.entries(promptStructure)
      .filter(([_, section]) => section.enabled)
      .sort(([_, a], [__, b]) => a.order - b.order);

    // 2. Construire chaque section
   let definitionsInserted = false;

for (const [key, section] of enabledSections) {
  // Insérer definitions AVANT la première section avec order >= 30
  if (!definitionsInserted && section.order >= 30) {
    const definitionsSection = this.buildDefinitionsSection(
      charte.definition.categories,
      charte.definition.rules?.approach || "few_shot",
      charte.definition.rules?.examples_per_category || 3
    );
    sections.push(definitionsSection);
    definitionsInserted = true;
  }

  let content = section.content;

  // Appliquer les templates si contexte fourni
  if (context) {
    content = this.applyTemplates(content, context);
  }

  sections.push(content);
}

// Si aucune section n'a order >= 30, ajouter definitions à la fin
if (!definitionsInserted) {
  const definitionsSection = this.buildDefinitionsSection(
    charte.definition.categories,
    charte.definition.rules?.approach || "few_shot",
    charte.definition.rules?.examples_per_category || 3
  );
  sections.push(definitionsSection);
}

    // Si aucune section n'a order >= 30, ajouter definitions à la fin
    const hasDefinitions = enabledSections.some(([_, s]) => s.order >= 30);
    if (!hasDefinitions) {
      const definitionsSection = this.buildDefinitionsSection(
        charte.definition.categories,
        charte.definition.rules?.approach || "few_shot",
        charte.definition.rules?.examples_per_category || 3
      );
      sections.push(definitionsSection);
    }

    // 3. Joindre avec double saut de ligne
    return sections.join("\n\n");
  }

  /**
   * Applique les templates {{variable}} dans le contenu
   */
  private static applyTemplates(content: string, context: PromptContext): string {
    let result = content;

 // Remplacer toutes les variables {{xxx}}
  result = result
    .replace(/\{\{prev3_verbatim\}\}/g, context.prev3_verbatim || "{{prev3_verbatim}}")
    .replace(/\{\{prev2_verbatim\}\}/g, context.prev2_verbatim || "{{prev2_verbatim}}")
    .replace(/\{\{prev1_verbatim\}\}/g, context.prev1_verbatim || "{{prev1_verbatim}}")
    .replace(/\{\{conseiller_verbatim\}\}/g, context.conseiller_verbatim || "{{conseiller_verbatim}}")
    .replace(/\{\{client_verbatim\}\}/g, context.client_verbatim || "{{client_verbatim}}")
    .replace(/\{\{next1_verbatim\}\}/g, context.next1_verbatim || "{{next1_verbatim}}")
    .replace(/\{\{next2_verbatim\}\}/g, context.next2_verbatim || "{{next2_verbatim}}")
    .replace(/\{\{next3_verbatim\}\}/g, context.next3_verbatim || "{{next3_verbatim}}");

  return result;
}

  /**
   * Construit la section Definitions depuis les catégories
   */
  private static buildDefinitionsSection(
    categories: any,
    approach: string,
    examplesPerCategory: number
  ): string {
    let content = "Définitions :\n";

    Object.entries(categories).forEach(([name, cat]: [string, any]) => {
      content += `- ${name} : ${cat.description}`;

      // Ajouter exemples si few-shot
      if (approach === "few_shot" && cat.examples && cat.examples.length > 0) {
        const examples = cat.examples.slice(0, examplesPerCategory);
        content += ` (ex: "${examples.join('", "')}")`;
      }

      content += "\n";
    });

    return content;
  }

  /**
   * Génère un preview du prompt avec données de test
   */
 static buildPreview(charte: CharteDefinition): string {
  const testContext: PromptContext = {
    prev3_verbatim: "[AP] d'accord",
    prev2_verbatim: "[TC] d'accord ?",
    prev1_verbatim: "[AP] OK",
    conseiller_verbatim: "[TC] au moins, c'est clair pour vous",
    client_verbatim: "[AP] OK, d'accord",
    next1_verbatim: "[TC] d'accord ?",
    next2_verbatim: "[AP] OK parfait",
  };

    return this.buildPrompt(charte, testContext);
  }
}