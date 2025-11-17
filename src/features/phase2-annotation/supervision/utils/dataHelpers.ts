import type {
  SupervisionTurnTagged,
  TagGroupStats,
  SupervisionMetrics,
} from "../types";

export const calculateStats = (
  data: SupervisionTurnTagged[]
): SupervisionMetrics => {
  const withAudio = data.filter((item) => item.hasAudio);
  const withTranscript = data.filter((item) => item.hasTranscript);
  const modifiable = data.filter((item) => item.hasAudio && item.hasTranscript);

  // ← NOUVEAUX CALCULS
  const uniqueCallIds = new Set(data.map((item) => item.call_id));

  // Calculer les statistiques d'appels
  const callTagCounts = new Map<string, number>();
  data.forEach((item) => {
    const count = callTagCounts.get(item.call_id) || 0;
    callTagCounts.set(item.call_id, count + 1);
  });

  const avgTagsPerCall =
    callTagCounts.size > 0
      ? Array.from(callTagCounts.values()).reduce((a, b) => a + b, 0) /
        callTagCounts.size
      : 0;

  const callsWithMultipleTags = Array.from(callTagCounts.values()).filter(
    (count) => count > 1
  ).length;

  return {
    total: data.length,
    uniqueTags: new Set(data.map((item) => item.tag)).size,
    uniqueCallIds: uniqueCallIds.size, // ← NOUVEAU
    withAudio: withAudio.length,
    withTranscript: withTranscript.length,
    modifiable: modifiable.length,
    needsProcessing: data.length - modifiable.length,
    avgTagsPerCall: Math.round(avgTagsPerCall * 10) / 10, // ← NOUVEAU
    callsWithMultipleTags, // ← NOUVEAU
  };
};

export const calculateTagStats = (
  data: SupervisionTurnTagged[]
): TagGroupStats[] => {
  const statsMap = new Map<string, TagGroupStats>();

  data.forEach((item) => {
    // Compter le tag principal
    const key = item.tag;
    if (statsMap.has(key)) {
      statsMap.get(key)!.count++;
    } else {
      statsMap.set(key, {
        label: item.tag,
        count: 1,
        color: item.color,
        family: item.family,
      });
    }

    // ← NOUVEAU : Compter le next_turn_tag s'il existe
    if (item.next_turn_tag && item.next_turn_tag !== item.tag) {
      const nextKey = item.next_turn_tag;
      if (statsMap.has(nextKey)) {
        statsMap.get(nextKey)!.count++;
      } else {
        statsMap.set(nextKey, {
          label: item.next_turn_tag,
          count: 1,
          color: item.next_turn_color || "#9e9e9e",
          family: "TRANSITION", // Famille spéciale pour les next_turn_tags
        });
      }
    }
  });

  return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
};

export const enrichTurntaggedData = (
  turntaggedData: any[],
  callsMap: Map<string, any>,
  transcriptsSet: Set<string>,
  lpltagMap?: Map<string, any>
): SupervisionTurnTagged[] => {
  return (
    turntaggedData?.map((item) => {
      const callData = callsMap.get(String(item.call_id));
      const hasTranscript = transcriptsSet.has(String(item.call_id));

      const hasAudio = Boolean(
        callData &&
          callData.upload === true &&
          callData.filepath &&
          callData.filepath.trim() !== "" &&
          callData.filepath.trim() !== "null" &&
          callData.filepath.trim() !== "undefined"
      );

      const tagData = Array.isArray(item.lpltag) ? item.lpltag[0] : item.lpltag;
      const color = tagData?.color || "#999";
      const family = tagData?.family || "AUTRE";

      // Gérer next_turn_tag
      const nextTurnTagInfo =
        item.next_turn_tag && lpltagMap
          ? lpltagMap.get(item.next_turn_tag)
          : null;

      // Déterminer les ressources manquantes
      const missingResources: ("audio" | "transcript")[] = [];
      if (!hasAudio) missingResources.push("audio");
      if (!hasTranscript) missingResources.push("transcript");

      return {
        id: item.id,
        call_id: String(item.call_id),
        tag: item.tag,
        verbatim: item.verbatim || "",
        next_turn_verbatim: item.next_turn_verbatim || "",
        next_turn_tag: item.next_turn_tag || undefined,
        speaker: item.speaker || "Inconnu",
        start_time: item.start_time,
        end_time: item.end_time,
        color,
        next_turn_color: nextTurnTagInfo?.color || "#9e9e9e",
        family,
        filename: callData?.filename,
        origine: callData?.origine, // ← NOUVEAU : Ajouter l'origine depuis les données d'appel
        hasTranscript,
        hasAudio,
        duration: callData?.duree,
        missingResources,
        canBeProcessed: missingResources.length > 0,
        processingStatus: "idle",
      };
    }) || []
  );
};
