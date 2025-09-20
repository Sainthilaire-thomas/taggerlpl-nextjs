// src/components/calls/ui/hooks/useRelationsNextTurn.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Call } from "../../domain/entities/Call";
import type {
  RelationsService,
  RelationsNextTurnView,
} from "../../domain/services/RelationsService";

export type NextTurnMap = Map<string, RelationsNextTurnView>;

export function useRelationsNextTurn(
  calls: Call[],
  opts?: { service?: RelationsService; cacheScopeKey?: string | number }
) {
  const callIds = useMemo(() => calls.map((c) => String(c.id)), [calls]);
  const depKey = useMemo(
    () => JSON.stringify({ ids: callIds, scope: opts?.cacheScopeKey ?? null }),
    [callIds, opts?.cacheScopeKey]
  );

  const [byId, setById] = useState<NextTurnMap>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const fetchKeyRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    const hasService = !!opts?.service;
    const k = `${depKey}|svc:${hasService ? 1 : 0}`;
    fetchKeyRef.current = k;

    async function run() {
      if (!hasService || callIds.length === 0) {
        setById(new Map()); // pas de service => colonne affichera "—"
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await opts!.service!.getNextTurnStats(callIds); // percent+status inside
        if (cancelled || fetchKeyRef.current !== k) return;
        const m = new Map<string, RelationsNextTurnView>();
        for (const r of rows) m.set(String(r.callId), r);
        setById(m);
      } catch {
        if (!cancelled && fetchKeyRef.current === k) {
          setById(new Map());
        }
      } finally {
        if (!cancelled && fetchKeyRef.current === k) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [depKey, callIds, opts?.service]);

  return { byId, loading };
}
