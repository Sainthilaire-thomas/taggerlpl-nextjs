"use client";
import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Stack,
} from "@mui/material";

type Target = "X" | "Y" | "M1" | "M2" | "M3" | "any";

type Props = {
  selectedClassifier: string;
  onSelectClassifier: (key: string) => void;
  target?: Target;
  showDescription?: boolean;
  showConfiguration?: boolean; // réservé si tu as un panneau d'options
};

type ServerAlgo = {
  key: string;
  meta?: {
    name?: string;
    displayName?: string;
    version?: string;
    type?: string;
    target?: string;
    description?: string;
  };
  isValid?: boolean;
  isActive?: boolean;
};

export default function ClassifierSelector({
  selectedClassifier,
  onSelectClassifier,
  target = "any",
  showDescription,
}: Props) {
  const [list, setList] = React.useState<ServerAlgo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Charge la liste côté serveur
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/algolab/classifiers", {
          cache: "no-store",
        });
        const j = await r.json();

        // tolérant à la forme renvoyée par getAlgorithmStatus()
        const items: any[] = Array.isArray(j?.algorithms)
          ? j.algorithms
          : Array.isArray(j)
          ? j
          : Array.isArray(j?.list)
          ? j.list
          : Array.isArray(j?.registry)
          ? j.registry
          : Object.values(j ?? {});

        const mapped: ServerAlgo[] = (items || [])
          .map((it: any) => ({
            key: it.key ?? it.id ?? it.name,
            meta: it.meta ?? it.describe ?? it,
            isValid: it.isValid ?? true,
            isActive: it.isActive ?? true,
          }))
          .filter((a: ServerAlgo) => !!a.key);

        if (!cancelled) setList(mapped);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtre par target (X/Y/M*)
  const entries = React.useMemo(() => {
    let arr = list;
    if (target !== "any") {
      arr = arr.filter((e) => {
        const t = String(e.meta?.target ?? "").toUpperCase();
        if (target === "X") return t === "X" || t === "CONSEILLER";
        if (target === "Y") return t === "Y" || t === "CLIENT";
        return t === target;
      });
    }
    return arr;
  }, [list, target]);

  // Auto-corrige la valeur si elle n’est pas dans la liste
  React.useEffect(() => {
    if (!entries.length) return;
    if (!entries.some((e) => e.key === selectedClassifier)) {
      onSelectClassifier(entries[0].key);
    }
  }, [entries, selectedClassifier, onSelectClassifier]);

  const selectedMeta = React.useMemo(
    () => entries.find((e) => e.key === selectedClassifier)?.meta,
    [entries, selectedClassifier]
  );

  return (
    <Box>
      <FormControl fullWidth disabled={loading}>
        <InputLabel id="classifier-label">Algorithme</InputLabel>
        <Select
          labelId="classifier-label"
          value={
            entries.some((e) => e.key === selectedClassifier)
              ? selectedClassifier
              : ""
          }
          label="Algorithme"
          onChange={(e) => onSelectClassifier(e.target.value as string)}
          displayEmpty
        >
          {entries.map(({ key, meta }) => (
            <MenuItem key={key} value={key}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>
                  {meta?.displayName ?? meta?.name ?? key}
                </Typography>
                {meta?.version && (
                  <Chip label={`v${meta.version}`} size="small" />
                )}
                {meta?.type && (
                  <Chip label={meta.type} size="small" variant="outlined" />
                )}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block" }}
        >
          {error}
        </Typography>
      )}

      {showDescription && (
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          {selectedMeta?.description ?? "—"}
        </Typography>
      )}
    </Box>
  );
}
