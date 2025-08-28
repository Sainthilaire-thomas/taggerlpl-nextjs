// supervision/hooks/useSupervisionData.ts

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  SupervisionTurnTagged,
  TagGroupStats,
  SupervisionMetrics,
  SupervisionDataHook,
} from "../types";
import {
  calculateStats,
  calculateTagStats,
  enrichTurntaggedData,
} from "../utils";

/**
 * Hook principal : charge turntagged + jointures call/transcript,
 * et garantit la présence de `row.metadata` (normalisée depuis `metadata_context`).
 */
export const useSupervisionData = (): SupervisionDataHook => {
  const [supervisionData, setSupervisionData] = useState<
    SupervisionTurnTagged[]
  >([]);
  const [tagStats, setTagStats] = useState<TagGroupStats[]>([]);
  const [stats, setStats] = useState<SupervisionMetrics>({
    total: 0,
    uniqueTags: 0,
    uniqueCallIds: 0,
    withAudio: 0,
    withTranscript: 0,
    modifiable: 0,
    needsProcessing: 0,
    avgTagsPerCall: 0,
    callsWithMultipleTags: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge toutes les lignes depuis la VUE `turntagged_with_context`
   * (qui expose `metadata_context`) avec pagination.
   * Normalise immédiatement en `row.metadata`.
   */
  const loadAllTurntagged = async () => {
    const pageSize = 1000;
    let allTurntagged: any[] = [];
    let page = 0;
    let hasMore = true;

    console.log("📊 Chargement de TOUS les turntagged (vue with_context)...");

    while (hasMore) {
      const { data, error, count } = await supabase
        .from("turntagged_with_context")
        .select(
          `
          id,
          call_id,
          tag,
          verbatim,
          next_turn_verbatim,
          next_turn_tag,
          speaker,
          start_time,
          end_time,
          metadata_context,
          lpltag(
            label,
            color,
            family
          )
        `,
          { count: "exact" }
        )
        .order("call_id", { ascending: true })
        .order("start_time", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        // 🔐 Normalise tout de suite : le front lit `row.metadata`
        const withMeta = data.map((r: any) => ({
          ...r,
          metadata: r.metadata ?? r.metadata_context ?? undefined,
        }));

        allTurntagged = [...allTurntagged, ...withMeta];

        console.log(
          `📄 Page ${page + 1}: ${data.length} éléments (Total: ${
            allTurntagged.length
          }/${count ?? "?"})`
        );

        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }

      // Sécurité : arrêt à 5 000 éléments max (éviter timeouts lourds)
      if (allTurntagged.length >= 5000) {
        console.warn(
          `⚠️ Arrêt à ${allTurntagged.length} éléments pour éviter les timeouts`
        );
        hasMore = false;
      }
    }

    // Log de contrôle
    if (allTurntagged.length) {
      console.log("🧪 [RAW 0] metadata =", allTurntagged[0]?.metadata);
    }

    return allTurntagged;
  };

  const loadSupervisionData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Chargement COMPLET des données de supervision...");

      // 1) Charger tous les turntagged (depuis la vue)
      const turntaggedData = await loadAllTurntagged();

      // 2) Liste d'appels uniques
      const callIds = [
        ...new Set(
          turntaggedData?.map((item: any) => String(item.call_id).trim()) || []
        ),
      ].filter((id) => id && id !== "" && id !== "null" && id !== "undefined");

      console.log(`🔍 ${callIds.length} appels uniques trouvés`);

      const callIdsAsNumbers = callIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      console.log(`🔄 Requêtes pour ${callIdsAsNumbers.length} appels...`);

      // 3) Jointures parallèles : call + transcript
      const [callsQueryResult, transcriptsQueryResult] = await Promise.all([
        supabase
          .from("call")
          .select("callid, filename, filepath, upload, duree, origine")
          .in("callid", callIdsAsNumbers),
        supabase
          .from("transcript")
          .select("callid")
          .in("callid", callIdsAsNumbers),
      ]);

      if (callsQueryResult.error) throw callsQueryResult.error;
      if (transcriptsQueryResult.error) throw transcriptsQueryResult.error;

      console.log(`📁 ${callsQueryResult.data?.length} appels trouvés`);
      console.log(
        `📋 ${transcriptsQueryResult.data?.length} transcriptions trouvées`
      );

      // 4) Maps utilitaires
      const callsMap = new Map(
        callsQueryResult.data?.map((call) => [String(call.callid), call]) || []
      );
      const transcriptsSet = new Set(
        transcriptsQueryResult.data?.map((t) => String(t.callid)) || []
      );

      // 5) Enrichissement (⚠️ on réinjecte metadata si utilitaire l'a perdu)
      const rawById = new Map(turntaggedData.map((r: any) => [r.id, r]));
      const enrichedBase = enrichTurntaggedData(
        turntaggedData,
        callsMap,
        transcriptsSet
      );

      const enrichedData: any[] = enrichedBase.map((r: any) => ({
        ...r,
        metadata:
          r.metadata ??
          rawById.get(r.id)?.metadata ??
          rawById.get(r.id)?.metadata_context ??
          undefined,
      }));

      console.log("🧪 [ENRICHED 0] metadata =", enrichedData[0]?.metadata);

      // 6) Métriques + états
      const calculatedStats = calculateStats(enrichedData);
      const calculatedTagStats = calculateTagStats(enrichedData);

      setSupervisionData(enrichedData as SupervisionTurnTagged[]);
      setStats(calculatedStats);
      setTagStats(calculatedTagStats);

      console.log(
        `✅ ${enrichedData.length} turntagged chargés, ${calculatedTagStats.length} tags uniques`
      );
    } catch (err) {
      console.error("❌ Erreur lors du chargement:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    supervisionData,
    tagStats,
    stats,
    loading,
    error,
    loadSupervisionData,
  };
};
