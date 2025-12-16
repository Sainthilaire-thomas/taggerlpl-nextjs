// ============================================================================
// Tags spécifiques pour variables de recherche X et Y
// ============================================================================

// Variable X : Stratégies conseiller
export type XTag = 
  | "ENGAGEMENT"
  | "EXPLICATION"
  | "REFLET_ACQ"
  | "REFLET_JE"
  | "REFLET_VOUS"
  | "OUVERTURE";

// Variable Y : Réactions client
export type YTag = 
  | "CLIENT_POSITIF"
  | "CLIENT_NEGATIF"
  | "CLIENT_NEUTRE";

// Union de tous les tags
export type AnnotationTag = XTag | YTag;

// Type guards
export function isXTag(tag: string): tag is XTag {
  return [
    "ENGAGEMENT",
    "EXPLICATION",
    "REFLET_ACQ",
    "REFLET_JE",
    "REFLET_VOUS",
    "OUVERTURE"
  ].includes(tag);
}

export function isYTag(tag: string): tag is YTag {
  return [
    "CLIENT_POSITIF",
    "CLIENT_NEGATIF",
    "CLIENT_NEUTRE"
  ].includes(tag);
}
