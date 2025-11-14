// hooks/normalizeUniversalToTV.ts
import type {
  TVValidationResult,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  UniversalResult,
} from "@/types/algorithm-lab";

type Target = "X" | "Y" | "M1" | "M2" | "M3";

export function normalizeUniversalToTV(
  uni: UniversalResult,
  sample: {
    verbatim: string;
    expectedTag: string;
    metadata?: Record<string, any>;
  },
  opts: { target: Target }
): TVValidationResult {
  const predicted = String(uni.prediction ?? "");
  const expected = String(sample.expectedTag ?? "");
  const ok = predicted === expected;

  // base metadata qu'on enrichit
  const baseMd: Record<string, any> = {
    ...(uni.metadata ?? {}),
    algorithmMetadata: uni.metadata ?? {}, // pour tes fallbacks UI
    // on met aussi "details" à la racine pour les fallbacks des extra-colonnes
    details: (uni.metadata as any)?.details ?? {},
    // contexte pratique
    turnId: sample.metadata?.turnId ?? undefined,
    callId: sample.metadata?.callId ?? undefined,
    prev1_turn_verbatim: sample.metadata?.prev1_turn_verbatim,
    prev2_turn_verbatim: sample.metadata?.prev2_turn_verbatim,
    next_turn_verbatim: sample.metadata?.next_turn_verbatim,
  };

  // détails bruts fournis par l’algo
  const details: any = (uni.metadata && (uni.metadata as any).details) || {};

  // Spécialisations par variable → ce que lisent tes extra-colonnes
  switch (opts.target) {
    case "X": {
      const d = details as XDetails;
      baseMd.x_details = {
        label: predicted,
        confidence: uni.confidence ?? 0,
        family: d?.family ?? undefined,
        matchedPatterns: d?.matchedPatterns ?? undefined,
        rationale: d?.rationale ?? undefined,
        probabilities: d?.probabilities ?? undefined,
        spans: d?.spans ?? undefined,
      } as XDetails;

      baseMd.x_evidences =
        d?.evidences ??
        (uni.metadata as any)?.evidences ??
        (uni.metadata as any)?.cues ??
        [];

      // assure aussi la présence des infos sous metadata.details (fallback UI)
      baseMd.details = {
        ...(baseMd.details ?? {}),
        family:
          (baseMd.details && baseMd.details.family) ??
          d?.family ??
          baseMd.algorithmMetadata?.details?.family ??
          undefined,
        evidences:
          (baseMd.details && baseMd.details.evidences) ??
          d?.evidences ??
          baseMd.algorithmMetadata?.details?.evidences ??
          undefined,
      };
      break;
    }

    case "Y": {
      const d = details as YDetails;
      baseMd.y_details = {
        label: predicted,
        confidence: uni.confidence ?? 0,
        family: d?.family ?? undefined,
        cues: d?.cues ?? undefined,
        sentimentProxy: d?.sentimentProxy ?? d?.sentiment ?? undefined,
        spans: d?.spans ?? undefined,
      } as YDetails;

      baseMd.y_evidences =
        d?.evidences ??
        (uni.metadata as any)?.evidences ??
        (uni.metadata as any)?.cues ??
        [];
      break;
    }

    case "M1": {
      // ✅ CORRECTION : Lire DIRECTEMENT dans uni.metadata (pas dans details)
      baseMd.m1 = {
        value:
          (uni.metadata as any)?.density ?? // ← PRIORITÉ : vos données M1
          (uni.metadata as any)?.value ??
          undefined,
        actionVerbCount:
          (uni.metadata as any)?.actionVerbCount ?? // ← PRIORITÉ : vos données M1
          undefined,
        totalTokens:
          (uni.metadata as any)?.totalTokens ?? // ← PRIORITÉ : vos données M1
          undefined,
        verbsFound:
          (uni.metadata as any)?.verbsFound ?? // ← PRIORITÉ : vos données M1
          [],
      } as M1Details;

      break;
    }

    case "M2": {
      const d = details as M2Details;
      baseMd.m2 = {
        value: d?.value ?? undefined,
        scale: d?.scale ?? undefined,
        lexicalAlignment: d?.lexicalAlignment ?? undefined,
        semanticAlignment: d?.semanticAlignment ?? undefined,
        syntacticAlignment: d?.syntacticAlignment ?? undefined,
        overall: d?.overall ?? undefined,
        sharedTerms: d?.sharedTerms ?? undefined,
      } as M2Details;
      break;
    }

    case "M3": {
      const d = details as M3Details;
      baseMd.m3 = {
        value: d?.value ?? undefined,
        unit: d?.unit ?? "ms",
        markers: d?.markers ?? undefined,
        speechRate: d?.speechRate ?? undefined,
        hesitationCount: d?.hesitationCount ?? undefined,
        pauseCount: d?.pauseCount ?? undefined,
      } as M3Details;
      break;
    }
  }

  return {
    verbatim: sample.verbatim,
    goldStandard: expected,
    predicted,
    correct: ok,
    confidence: uni.confidence ?? 0,
    processingTime: uni.processingTime ?? 0,
    metadata: baseMd,
  };
}
