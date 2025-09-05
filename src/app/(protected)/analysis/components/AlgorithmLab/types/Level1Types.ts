// Types génériques pour les calculateurs, réutilisables avec tes "slots" ThesisVariables.*
export interface CalculationResult<TDetails> {
  score: number; // 0..1 normalisé (ou autre si besoin)
  details: TDetails; // fortement typé via module augmentation (M1Details, etc.)
  markers?: string[]; // pour affichages rapides si utile
  metadata?: Record<string, any>;
}

// Entrées standardisées par variable
export interface M1Input {
  verbatim: string;
  id?: string | number;
}
export interface M2Input {
  turnA: string;
  turnB: string;
  idA?: string | number;
  idB?: string | number;
}
export interface M3Input {
  clientTurn: string;
  id?: string | number;
}

export interface CalculatorMetadata {
  name: string;
  version?: string;
  description?: string;
  type: "rule-based" | "ml" | "llm" | "hybrid";
}
