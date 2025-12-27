/**
 * CharteCreationService.ts
 * 
 * Service pour créer et dupliquer des chartes Level 0
 * 
 * Sprint 6 - Session 7
 */

import { supabase } from '@/lib/supabaseClient';
import type { CharteDefinition } from '@/types/algorithm-lab/Level0Types';

// Types locaux pour ce service
export interface NewCharteData {
  name: string;
  variable: 'X' | 'Y';
  philosophy: 'Minimaliste' | 'Enrichie' | 'Binaire';
  modality: 'text_only' | 'audio_full' | 'text_context';
  copyFromCharteId?: string;
}

export interface DuplicationOptions {
  copyPromptStructure: boolean;
  copyCategories: boolean;
  copyRules: boolean;
  copyLLMParams: boolean;
}

export class CharteCreationService {
  /**
   * Créer une nouvelle charte
   */
  static async createCharte(data: NewCharteData): Promise<CharteDefinition> {
    // 1. Générer charte_id
    const charteId = `Charte${data.variable}_${data.name}_v1.0.0`;

    // 2. Préparer definition de base
    let definition: any;

    if (data.copyFromCharteId) {
      // Copier depuis charte existante
      const sourceCharte = await this.getCharteById(data.copyFromCharteId);
      if (!sourceCharte) {
        throw new Error('Charte source introuvable');
      }
      // Deep copy de la definition
      definition = JSON.parse(JSON.stringify(sourceCharte.definition));
    } else {
      // Créer definition par défaut selon philosophie
      definition = this.getDefaultDefinition(data.philosophy, data.variable);
    }

    // 3. Insérer en BDD
    const newCharte = {
      charte_id: charteId,
      charte_name: data.name,
      variable: data.variable,
      philosophy: data.philosophy,
      version: '1.0.0',
      definition,
      created_at: new Date().toISOString(),
    };

    const { data: insertedCharte, error } = await supabase
      .from('level0_chartes')
      .insert(newCharte)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création charte: ${error.message}`);
    }

    return insertedCharte as CharteDefinition;
  }

  /**
   * Dupliquer une charte existante
   */
  static async duplicateCharte(
    sourceCharteId: string,
    newName: string,
    options: DuplicationOptions
  ): Promise<CharteDefinition> {
    // 1. Charger charte source
    const sourceCharte = await this.getCharteById(sourceCharteId);
    if (!sourceCharte) {
      throw new Error('Charte source introuvable');
    }

    // 2. Préparer nouvelle definition
    const newDefinition: any = {};

    if (options.copyPromptStructure && sourceCharte.definition.prompt_structure) {
      newDefinition.prompt_structure = JSON.parse(
        JSON.stringify(sourceCharte.definition.prompt_structure)
      );
    }

    if (options.copyCategories && sourceCharte.definition.categories) {
      newDefinition.categories = JSON.parse(
        JSON.stringify(sourceCharte.definition.categories)
      );
    }

    if (options.copyRules && sourceCharte.definition.rules) {
      newDefinition.rules = JSON.parse(
        JSON.stringify(sourceCharte.definition.rules)
      );
    }

    // LLM params peuvent être dans definition ou ailleurs selon structure
    if (options.copyLLMParams) {
      // Chercher dans la structure existante
      const llmParams = this.extractLLMParams(sourceCharte.definition);
      if (llmParams) {
        newDefinition.llm_params = llmParams;
      }
    }

    // 3. Générer charte_id
    const charteId = `Charte${sourceCharte.variable}_${newName}_v1.0.0`;

    // 4. Créer nouvelle charte
    const duplicatedCharte = {
      charte_id: charteId,
      charte_name: newName,
      variable: sourceCharte.variable,
      philosophy: sourceCharte.philosophy,
      version: '1.0.0',
      definition: newDefinition,
      created_at: new Date().toISOString(),
    };

    const { data: insertedCharte, error } = await supabase
      .from('level0_chartes')
      .insert(duplicatedCharte)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur duplication charte: ${error.message}`);
    }

    return insertedCharte as CharteDefinition;
  }

  /**
   * Extraire LLM params de la definition
   */
  private static extractLLMParams(definition: any): any {
    // Chercher dans prompt_structure ou à la racine
    if (definition.prompt_structure?.llm_params) {
      return JSON.parse(JSON.stringify(definition.prompt_structure.llm_params));
    }
    
    // Si pas trouvé, retourner params par défaut
    return {
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 100,
    };
  }

  /**
   * Récupérer charte par ID
   */
  private static async getCharteById(charteId: string): Promise<CharteDefinition | null> {
    const { data, error } = await supabase
      .from('level0_chartes')
      .select('*')
      .eq('charte_id', charteId)
      .single();

    if (error) {
      console.error('Erreur chargement charte:', error);
      return null;
    }

    return data as CharteDefinition;
  }

  /**
   * Générer definition par défaut selon philosophie
   */
  private static getDefaultDefinition(
    philosophy: 'Minimaliste' | 'Enrichie' | 'Binaire',
    variable: 'X' | 'Y'
  ): any {
    const basePromptStructure = this.getDefaultPromptStructure(philosophy);
    const baseCategories = this.getDefaultCategories(variable, philosophy);
    const baseRules = this.getDefaultRules(philosophy);

    return {
      prompt_structure: basePromptStructure,
      categories: baseCategories,
      rules: baseRules,
    };
  }

  /**
   * Prompt structure par défaut selon philosophie
   */
  private static getDefaultPromptStructure(philosophy: string): any {
    const common = {
      task_description: {
        content: 'Classifiez le tour de parole selon les catégories définies.',
        enabled: true,
        order: 10,
      },
      definitions: {
        content: '{{AUTO_GENERATED}}',
        enabled: true,
        order: 20,
      },
      output_format: {
        content: 'Répondez uniquement avec le nom de la catégorie (ex: CLIENT_POSITIF).',
        enabled: true,
        order: 90,
      },
    };

    if (philosophy === 'Minimaliste') {
      return common;
    }

    if (philosophy === 'Enrichie') {
      return {
        ...common,
        system_instructions: {
          content: 'Vous êtes un expert en analyse conversationnelle spécialisé dans la classification de dialogues client-conseiller.',
          enabled: true,
          order: 5,
        },
        preprocessing_instructions: {
          content: 'Ignorez les marqueurs de transcription suivants : [AP], [T], (???), ainsi que tout timestamp.',
          enabled: true,
          order: 15,
        },
        context_template: {
          content: 'CONTEXTE:\n\nTours précédents:\nprev3: {{prev3_verbatim}}\nprev2: {{prev2_verbatim}}\nprev1: {{prev1_verbatim}}\n\nTour à classifier: {{verbatim}}\n\nTours suivants:\nnext1: {{next1_verbatim}}\nnext2: {{next2_verbatim}}',
          enabled: true,
          order: 25,
        },
        constraints: {
          content: 'Contraintes:\n- Analysez le ton et le contexte\n- Tenez compte des tours voisins\n- En cas de doute, privilégiez la catégorie NEUTRE',
          enabled: true,
          order: 40,
        },
      };
    }

    // Binaire
    return {
      ...common,
      constraints: {
        content: 'Classification binaire: POSITIF ou NEGATIF uniquement.',
        enabled: true,
        order: 40,
      },
    };
  }

  /**
   * Catégories par défaut selon variable
   */
  private static getDefaultCategories(variable: 'X' | 'Y', philosophy: string): any {
    if (variable === 'Y') {
      const baseCategories = {
        CLIENT_POSITIF: {
          description: 'Réaction positive, satisfaction, accord enthousiaste',
          examples: philosophy === 'Minimaliste' 
            ? ['Oui, d\'accord !']
            : ['Oui, d\'accord !', 'Parfait, merci beaucoup', 'C\'est exactement ce que je voulais'],
        },
        CLIENT_NEUTRE: {
          description: 'Réaction neutre, accord sans enthousiasme, prise d\'information',
          examples: philosophy === 'Minimaliste'
            ? ['D\'accord']
            : ['D\'accord', 'OK', 'Je vois'],
        },
        CLIENT_NEGATIF: {
          description: 'Réaction négative, désaccord, frustration',
          examples: philosophy === 'Minimaliste'
            ? ['Non, ce n\'est pas ce que je voulais']
            : ['Non, ce n\'est pas ce que je voulais', 'Ce n\'est pas possible', 'Je ne suis pas satisfait'],
        },
      };

      if (philosophy === 'Binaire') {
        // Pour binaire, retourner seulement POSITIF et NEGATIF
        const { CLIENT_NEUTRE, ...binaryCategories } = baseCategories;
        return binaryCategories;
      }

      return baseCategories;
    }

    // Variable X
    return {
      ENGAGEMENT: {
        description: 'Le conseiller engage le client, propose une action',
        examples: philosophy === 'Minimaliste'
          ? ['Je peux vous proposer...']
          : ['Je peux vous proposer...', 'Qu\'en pensez-vous ?', 'Souhaitez-vous que je...'],
      },
      OUVERTURE: {
        description: 'Le conseiller ouvre une discussion, pose une question',
        examples: philosophy === 'Minimaliste'
          ? ['Comment puis-je vous aider ?']
          : ['Comment puis-je vous aider ?', 'Qu\'attendez-vous ?', 'Avez-vous des questions ?'],
      },
      REFLET: {
        description: 'Le conseiller reformule, valide la compréhension',
        examples: philosophy === 'Minimaliste'
          ? ['Si je comprends bien...']
          : ['Si je comprends bien...', 'Vous voulez dire que...', 'D\'accord, donc...'],
      },
      EXPLICATION: {
        description: 'Le conseiller explique, informe, clarifie',
        examples: philosophy === 'Minimaliste'
          ? ['Voici comment cela fonctionne...']
          : ['Voici comment cela fonctionne...', 'Il faut savoir que...', 'Concrètement...'],
      },
    };
  }

  /**
   * Rules par défaut selon philosophie
   */
  private static getDefaultRules(philosophy: string): any {
    return {
      approach: philosophy === 'Minimaliste' ? 'zero-shot' : 'few-shot',
      context_included: philosophy === 'Enrichie',
      examples_per_category: philosophy === 'Minimaliste' ? 1 : 3,
    };
  }
}

export default CharteCreationService;
