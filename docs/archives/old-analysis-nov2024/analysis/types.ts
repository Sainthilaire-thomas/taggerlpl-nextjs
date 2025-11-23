export interface StrategyStats {
  strategy: string; // "ENGAGEMENT", "REFLET", "EXPLICATION", "OUVERTURE"
  negative: number; // Pourcentage réactions négatives
  neutral: number; // Pourcentage réactions neutres
  positive: number; // Pourcentage réactions positives
  total: number; // Nombre total d'occurrences
  effectiveness: number; // Score d'efficacité (% positives - % négatives)
}

export interface InsightData {
  mostEffective: string;
  leastEffective: string;
  maxDifference: number;
  recommendation: string;
}
