// Types mis à jour pour AlgorithmLogicExplanation.tsx
// À intégrer dans le fichier existant ou créer un nouveau fichier de types

// Extension du type AlgorithmLogicProps existant
export interface ExtendedAlgorithmLogicProps {
  algorithmName: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    example: string;
    technical: string;
    // 🆕 NOUVELLE PROPRIÉTÉ pour les lexiques
    lexicons?: {
      [sentiment: string]: {
        mots: string[];
        expressions: string[];
      };
    };
  }>;
  metrics: Array<{
    name: string;
    description: string;
    formula: string;
    interpretation: string;
  }>;
  theoreticalBackground: {
    theory: string;
    source: string;
    keyPrinciples: string[];
  };
  interpretation: {
    scoreRanges: Array<{
      range: string;
      label: string;
      color: "success" | "info" | "warning" | "error";
      meaning: string;
    }>;
    practicalAdvice: string[];
  };
  // 🆕 NOUVELLE SECTION pour les détails de lexiques
  lexiconDetails?: {
    title: string;
    description: string;
    categories: Array<{
      name: string;
      color: string;
      description: string;
      wordCount: string;
      expressionCount: string;
      examples: string[];
    }>;
    technicalNotes: string[];
  };
}

// Interface pour un lexique spécifique
export interface LexiconData {
  sentiment: string;
  color: string;
  mots: string[];
  expressions: string[];
  totalCount: number;
}

// Interface pour l'affichage des lexiques
export interface LexiconDisplayProps {
  lexicons: { [sentiment: string]: { mots: string[]; expressions: string[] } };
  onClose?: () => void;
}

// Props pour le composant de catégorie de lexique
export interface LexiconCategoryProps {
  category: {
    name: string;
    color: string;
    description: string;
    wordCount: string;
    expressionCount: string;
    examples: string[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}

// Props pour l'affichage détaillé d'un lexique
export interface DetailedLexiconProps {
  sentiment: string;
  data: {
    mots: string[];
    expressions: string[];
  };
  color: string;
}
