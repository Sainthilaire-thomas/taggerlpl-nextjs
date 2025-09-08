/**
 * @fileoverview Barrel des types "core" d'AlgorithmLab.
 * On évite les collisions et on respecte 'isolatedModules'
 * en distinguant les ré-exports de types vs de valeurs.
 */

// -------------------------
// Exports depuis ./variables
// -------------------------

// ✅ Tous ces symboles sont des TYPES -> `export type { ... }`
export type {
  // Types de variables
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  VariableX,
  XTag,
  YTag,
} from "./variables";

// ✅ Ces symboles sont des VALEURS (fonctions) -> `export { ... }`
export {
  isValidVariableTarget,
  getVariableColor,
  getVariableLabel,
} from "./variables";

// -------------------------
// Exports depuis ./validation
// -------------------------
// Ici on peut garder un export global. S'il y avait un conflit de nom,
// on le résoudrait explicitement comme ci-dessus.
export * from "./validation";

// Alias de compat pour l'UI qui attend ce nom précis
export type { TVValidationResult as TVValidationResultCore } from "./validation";
