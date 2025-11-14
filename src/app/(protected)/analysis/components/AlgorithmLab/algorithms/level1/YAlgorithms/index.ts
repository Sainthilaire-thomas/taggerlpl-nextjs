// algorithms/level1/YAlgorithms/index.ts

// 1) Classe concrète + son type de résultat
export { RegexYClassifier } from "./RegexYClassifier";
export type { YClassification } from "./RegexYClassifier";

// 2) Types "base" SANS ré-exporter YClassification
export type { YClassifier } from "./shared/BaseYClassifier";
