import type { XTag, YTag } from "./ThesisVariables";

export function normalizeXLabel(raw: string): XTag {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, XTag> = {
    ENGAGEMENT: "ENGAGEMENT",
    OUVERTURE: "OUVERTURE",
    REFLET_VOUS: "REFLET_VOUS",
    REFLET_JE: "REFLET_JE",
    REFLET_ACQ: "REFLET_ACQ",
    EXPLICATION: "EXPLICATION",
  };
  return map[v] ?? "EXPLICATION"; // fallback prudent
}

export function normalizeYLabel(raw: string): YTag {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, YTag> = {
    CLIENT_POSITIF: "CLIENT_POSITIF",
    CLIENT_NEGATIF: "CLIENT_NEGATIF",
    CLIENT_NEUTRE: "CLIENT_NEUTRE",
  };
  return map[v] ?? "CLIENT_NEUTRE";
}

export function familyFromX(
  label: XTag
): "ENGAGEMENT" | "OUVERTURE" | "REFLET" | "EXPLICATION" {
  if (label.startsWith("REFLET")) return "REFLET";
  if (label === "ENGAGEMENT") return "ENGAGEMENT";
  if (label === "OUVERTURE") return "OUVERTURE";
  return "EXPLICATION";
}
