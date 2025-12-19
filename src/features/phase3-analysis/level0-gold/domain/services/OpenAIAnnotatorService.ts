// ============================================================================
// OpenAIAnnotatorService - Annotation automatique via OpenAI GPT-4
// Version sécurisée : appelle l''API route Next.js
// ============================================================================

import { 
  OpenAIAnnotationRequest, 
  OpenAIAnnotationResult,
  CharteDefinition 
} from "@/types/algorithm-lab/Level0Types";

export class OpenAIAnnotatorService {
  private static readonly API_ROUTE = "/api/level0/annotate";
  private static readonly RATE_LIMIT_DELAY_MS = 200; // 5 req/sec max

  /**
   * Annote une seule paire avec une charte donnée
   */
  static async annotatePair(
    request: OpenAIAnnotationRequest,
    charte: CharteDefinition
  ): Promise<OpenAIAnnotationResult> {
    const prompt = this.generatePrompt(request, charte);
    
    try {
      const response = await this.callAnnotateAPI(prompt);
      return this.parseResponse(response, request.pairId, charte.variable, charte);
    } catch (error) {
      console.error(`Error annotating pair ${request.pairId}:`, error);
      throw error;
    }
  }

  /**
   * Annote un batch de paires (avec rate limiting)
   */
  static async annotateBatch(
    requests: OpenAIAnnotationRequest[],
    charte: CharteDefinition,
    onProgress?: (current: number, total: number) => void
  ): Promise<OpenAIAnnotationResult[]> {
    const results: OpenAIAnnotationResult[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      try {
        const result = await this.annotatePair(request, charte);
        results.push(result);
        
        // Callback de progression
        if (onProgress) {
          onProgress(i + 1, requests.length);
        }
        
        // Rate limiting : attendre 200ms entre chaque requête
        if (i < requests.length - 1) {
          await this.sleep(this.RATE_LIMIT_DELAY_MS);
        }
      } catch (error) {
        console.error(`Failed to annotate pair ${request.pairId}:`, error);
        // Continuer avec les autres même si une échoue
        results.push({
          pairId: request.pairId,
          x_predicted: undefined,
          y_predicted: undefined,
          x_confidence: 0,
          y_confidence: 0,
          x_reasoning: "Error during annotation",
          y_reasoning: "Error during annotation"
        });
      }
    }
    
    return results;
  }

  /**
   * Génère le prompt à partir d''une charte
   */
  private static generatePrompt(
    request: OpenAIAnnotationRequest,
    charte: CharteDefinition
  ): string {
    const { definition, variable } = charte;
    const { categories, priority_rules } = definition;

    let prompt = `Tu es un expert en analyse conversationnelle. Ton rôle est d''annoter les tours de parole selon les catégories définies ci-dessous.\n\n`;

    // Section : Catégories
    prompt += `## CATÉGORIES\n\n`;
    
    for (const [categoryName, categoryDef] of Object.entries(categories)) {
      prompt += `**${categoryName}** : ${categoryDef.description}\n`;
      
      if (categoryDef.patterns && categoryDef.patterns.length > 0) {
        prompt += `Patterns : ${categoryDef.patterns.join(", ")}\n`;
      }
      
      if (categoryDef.examples && categoryDef.examples.length > 0) {
        prompt += `Exemples : ${categoryDef.examples.join(", ")}\n`;
      }
      
      if (categoryDef.rules && categoryDef.rules.length > 0) {
        prompt += `Règles :\n`;
        categoryDef.rules.forEach(rule => {
          prompt += `  • ${rule}\n`;
        });
      }
      
      prompt += `\n`;
    }

    // Section : Règles de priorité
    if (priority_rules && priority_rules.length > 0) {
      prompt += `## RÈGLES DE PRIORITÉ\n\n`;
      priority_rules.forEach((rule, index) => {
        prompt += `${index + 1}. ${rule}\n`;
      });
      prompt += `\n`;
    }

    // Section : Tour à annoter
    prompt += `## TOUR À ANNOTER\n\n`;
    
    if (request.prev1_verbatim) {
      prompt += `Tour précédent : "${request.prev1_verbatim}"\n\n`;
    }
    
    if (variable === "X") {
      prompt += `**Conseiller dit :** "${request.conseiller_verbatim}"\n`;
    } else {
      prompt += `Conseiller : "${request.conseiller_verbatim}"\n\n`;
      prompt += `**Client dit :** "${request.client_verbatim}"\n`;
    }
    
    if (request.next1_verbatim) {
      prompt += `\nTour suivant : "${request.next1_verbatim}"\n`;
    }

    // Section : Format de réponse
    prompt += `\n## FORMAT DE RÉPONSE\n\n`;
    prompt += `Réponds UNIQUEMENT avec un objet JSON (sans markdown) au format suivant :\n`;
    prompt += `{"tag": "CATÉGORIE", "confidence": 0.0-1.0, "reasoning": "explication brève"}\n`;

    return prompt;
  }

  /**
   * Appelle l''API route Next.js (sécurisé)
   */
  private static async callAnnotateAPI(prompt: string): Promise<string> {
    const response = await fetch(this.API_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`);
    }

    const data = await response.json();
    return data.content;
  }  /**
   * Applique les aliases de la charte pour normaliser un tag LLM
   */
  private static applyAliases(tag: string, charte: CharteDefinition): string {
    const aliases = (charte.definition as any)?.aliases || {};
    return aliases[tag] || tag;  // Si alias existe, utiliser, sinon garder tag original
  }


  /**
   * Parse la réponse JSON d''OpenAI
   */
  private static parseResponse(jsonString: string, pairId: number, variable: "X" | "Y", charte: CharteDefinition): OpenAIAnnotationResult {
    try {
      const parsed = JSON.parse(jsonString);
      
      const result: OpenAIAnnotationResult = {
        pairId
      };

      if (variable === "X") {
        result.x_predicted = this.applyAliases(parsed.tag, charte) as any;
        result.x_confidence = parsed.confidence || 0;
        result.x_reasoning = parsed.reasoning || "";
      } else {
        result.y_predicted = this.applyAliases(parsed.tag, charte) as any;
        result.y_confidence = parsed.confidence || 0;
        result.y_reasoning = parsed.reasoning || "";
      }

      return result;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", jsonString);
      throw new Error(`Invalid JSON response: ${error}`);
    }
  }

  /**
   * Utilitaire : sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estime le coût d''un batch d''annotations
   */
  static estimateCost(pairCount: number): {
    estimatedCalls: number;
    estimatedCostUSD: number;
    estimatedDurationMinutes: number;
  } {
    const costPerCall = 0.005; // ~$0.005 par appel GPT-4o
    const callsPerSecond = 5; // Rate limit
    
    return {
      estimatedCalls: pairCount,
      estimatedCostUSD: pairCount * costPerCall,
      estimatedDurationMinutes: Math.ceil((pairCount / callsPerSecond) / 60)
    };
  }
}



