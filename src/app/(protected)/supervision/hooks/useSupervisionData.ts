// supervision/hooks/useSupervisionData.ts

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  SupervisionTurnTagged,
  TagGroupStats,
  SupervisionMetrics, // ← Changé de SupervisionStats à SupervisionMetrics
  SupervisionDataHook,
} from "../types";
import {
  calculateStats,
  calculateTagStats,
  enrichTurntaggedData,
} from "../utils";

export const useSupervisionData = (): SupervisionDataHook => {
  const [supervisionData, setSupervisionData] = useState<
    SupervisionTurnTagged[]
  >([]);
  const [tagStats, setTagStats] = useState<TagGroupStats[]>([]);
  const [stats, setStats] = useState<SupervisionMetrics>({
    // ← Changé de SupervisionStats à SupervisionMetrics
    total: 0,
    uniqueTags: 0,
    withAudio: 0,
    withTranscript: 0,
    modifiable: 0,
    needsProcessing: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllTurntagged = async () => {
    const pageSize = 1000;
    let allTurntagged: any[] = [];
    let page = 0;
    let hasMore = true;

    console.log("📊 Chargement de TOUS les turntagged...");

    while (hasMore) {
      const { data, error, count } = await supabase
        .from("turntagged")
        .select(
          `
        id,
        call_id,
        tag,
        verbatim,
        next_turn_verbatim,
        speaker,
        start_time,
        end_time,
        lpltag(
          label,
          color,
          family
        )
      `,
          { count: "exact" }
        )
        .order("id", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allTurntagged = [...allTurntagged, ...data];
        console.log(
          `📄 Page ${page + 1}: ${data.length} éléments (Total: ${
            allTurntagged.length
          }/${count})`
        );

        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }

      // Sécurité : arrêt à 5 000 éléments max
      if (allTurntagged.length >= 5000) {
        console.warn(
          `⚠️ Arrêt à ${allTurntagged.length} éléments pour éviter les timeouts`
        );
        hasMore = false;
      }
    }

    return allTurntagged;
  };

  const loadSupervisionData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Chargement COMPLET des données de supervision...");

      // Charger TOUS les turntagged
      const turntaggedData = await loadAllTurntagged();

      // Récupérer les call_ids uniques
      const callIds = [
        ...new Set(
          turntaggedData?.map((item) => String(item.call_id).trim()) || []
        ),
      ].filter((id) => id && id !== "" && id !== "null" && id !== "undefined");

      console.log(`🔍 ${callIds.length} appels uniques trouvés`);

      // Conversion en nombres pour les requêtes
      const callIdsAsNumbers = callIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      console.log(`🔄 Requêtes pour ${callIdsAsNumbers.length} appels...`);

      // Requêtes parallèles pour call et transcript
      const [callsQueryResult, transcriptsQueryResult] = await Promise.all([
        supabase
          .from("call")
          .select("callid, filename, filepath, upload, duree")
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

      // Créer les maps de correspondance
      const callsMap = new Map(
        callsQueryResult.data?.map((call) => [String(call.callid), call]) || []
      );
      const transcriptsSet = new Set(
        transcriptsQueryResult.data?.map((t) => String(t.callid)) || []
      );

      // Construire les données enrichies
      const enrichedData = enrichTurntaggedData(
        turntaggedData,
        callsMap,
        transcriptsSet
      );

      // Calculer les statistiques
      const calculatedStats = calculateStats(enrichedData);
      const calculatedTagStats = calculateTagStats(enrichedData);

      setSupervisionData(enrichedData);
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
