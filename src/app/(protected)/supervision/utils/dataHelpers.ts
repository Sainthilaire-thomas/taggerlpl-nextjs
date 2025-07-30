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

  return {
    total: data.length,
    uniqueTags: new Set(data.map((item) => item.tag)).size,
    withAudio: withAudio.length,
    withTranscript: withTranscript.length,
    modifiable: modifiable.length,
    needsProcessing: data.length - modifiable.length,
  };
};

export const calculateTagStats = (
  data: SupervisionTurnTagged[]
): TagGroupStats[] => {
  const statsMap = new Map<string, TagGroupStats>();

  data.forEach((item) => {
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
  });

  return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
};

export const enrichTurntaggedData = (
  turntaggedData: any[],
  callsMap: Map<string, any>,
  transcriptsSet: Set<string>
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
        speaker: item.speaker || "Inconnu",
        start_time: item.start_time,
        end_time: item.end_time,
        color,
        family,
        filename: callData?.filename,
        hasTranscript,
        hasAudio,
        duration: callData?.duree,
        // Nouvelles propriétés
        missingResources,
        canBeProcessed: missingResources.length > 0,
        processingStatus: "idle",
      };
    }) || []
  );
};
