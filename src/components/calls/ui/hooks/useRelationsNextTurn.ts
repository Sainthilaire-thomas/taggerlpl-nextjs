// src/components/calls/ui/hooks/useRelationsNextTurn.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Call } from "../../domain/entities/Call";
import type {
  RelationsService,
  RelationsNextTurnView,
} from "../../domain/services/RelationsService";

export type NextTurnMap = Map<string, RelationsNextTurnView>;

interface OptimizedOptions {
  service?: RelationsService;
  cacheScopeKey?: string | number;
  maxBatchSize?: number; // Nouveau: limite le nombre d'appels par batch
  enablePagination?: boolean; // Nouveau: active la pagination
}

export function useRelationsNextTurn(
  calls: Call[],
  opts: OptimizedOptions = {}
) {
  const { maxBatchSize = 100, enablePagination = true } = opts;

  const callIds = useMemo(() => calls.map((c) => String(c.id)), [calls]);
  const depKey = useMemo(
    () =>
      JSON.stringify({
        ids: callIds.slice(0, maxBatchSize), // Limiter la clé de cache
        scope: opts?.cacheScopeKey ?? null,
      }),
    [callIds, opts?.cacheScopeKey, maxBatchSize]
  );

  const [byId, setById] = useState<NextTurnMap>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchKeyRef = useRef<string>("");
  const cacheRef = useRef<
    Map<string, { data: NextTurnMap; timestamp: number }>
  >(new Map());

  // Cache avec TTL
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let cancelled = false;
    const hasService = !!opts?.service;
    const k = `${depKey}|svc:${hasService ? 1 : 0}`;
    fetchKeyRef.current = k;

    async function run() {
      if (!hasService) {
        setById(new Map());
        setLoading(false);
        return;
      }

      // Vérifier le cache
      const cached = cacheRef.current.get(k);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setById(cached.data);
        setLoading(false);
        return;
      }

      if (callIds.length === 0) {
        setById(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let allResults: RelationsNextTurnView[] = [];

        if (enablePagination && callIds.length > maxBatchSize) {
          // Traitement par batches pour éviter les timeouts
          for (let i = 0; i < callIds.length; i += maxBatchSize) {
            if (cancelled || fetchKeyRef.current !== k) break;

            const batch = callIds.slice(i, i + maxBatchSize);
            console.log(
              `Chargement batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(
                callIds.length / maxBatchSize
              )}`
            );

            const batchResults = await opts!.service!.getNextTurnStats(batch);
            allResults.push(...batchResults);

            // Petite pause entre les batches pour éviter le rate limiting
            if (i + maxBatchSize < callIds.length) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
        } else {
          // Traitement direct si peu d'appels
          allResults = await opts!.service!.getNextTurnStats(callIds);
        }

        if (cancelled || fetchKeyRef.current !== k) return;

        const resultMap = new Map<string, RelationsNextTurnView>();
        for (const r of allResults) {
          resultMap.set(String(r.callId), r);
        }

        // Mettre en cache
        cacheRef.current.set(k, {
          data: resultMap,
          timestamp: Date.now(),
        });

        setById(resultMap);
      } catch (err) {
        if (!cancelled && fetchKeyRef.current === k) {
          const errorMsg =
            err instanceof Error ? err.message : "Erreur inconnue";
          console.error("Erreur relations:", errorMsg);
          setError(errorMsg);
          setById(new Map());
        }
      } finally {
        if (!cancelled && fetchKeyRef.current === k) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [depKey, callIds, opts?.service, maxBatchSize, enablePagination]);

  // Fonction pour vider le cache manuellement
  const clearCache = () => {
    cacheRef.current.clear();
  };

  // Stats pour debug
  const stats = useMemo(
    () => ({
      totalCalls: callIds.length,
      loadedRelations: byId.size,
      cacheSize: cacheRef.current.size,
      isComplete: byId.size === callIds.length,
    }),
    [callIds.length, byId.size]
  );

  return {
    byId,
    loading,
    error,
    stats,
    clearCache,
  };
}
