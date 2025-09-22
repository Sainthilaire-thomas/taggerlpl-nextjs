// src/components/calls/ui/hooks/useAccordionsLazyData.ts
import { useCallback, useState } from "react";
import { CallExtended } from "../../domain";

export type LazyLoadedData = Record<
  string,
  { calls: CallExtended[]; loaded: boolean; loading: boolean }
>;

export function useAccordionsLazyData(
  callsByOrigin: Record<string, CallExtended[]>
) {
  const [accordion, setAccordion] = useState<Record<string, boolean>>({});
  const [lazy, setLazy] = useState<LazyLoadedData>({});

  const toggle = useCallback(
    (origin: string) => {
      setAccordion((p) => ({ ...p, [origin]: !p[origin] }));
      setLazy((prev) => {
        const current = prev[origin];
        if (current?.loaded || current?.loading) return prev;
        return {
          ...prev,
          [origin]: { calls: [], loaded: false, loading: true },
        };
      });

      // petit délai pour l’UX
      setTimeout(() => {
        const originCalls = (callsByOrigin[origin] ?? []) as CallExtended[];
        setLazy((p) => ({
          ...p,
          [origin]: { calls: originCalls, loaded: true, loading: false },
        }));
      }, 100);
    },
    [callsByOrigin]
  );

  return {
    accordion,
    lazy,
    toggle,
    isExpanded: (origin: string) => !!accordion[origin],
    isLoaded: (origin: string) => !!lazy[origin]?.loaded,
    isLoading: (origin: string) => !!lazy[origin]?.loading,
    dataFor: (origin: string) => lazy[origin],
  };
}
