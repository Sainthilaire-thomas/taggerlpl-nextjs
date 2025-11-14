// components/Level1/shared/results/VersionSelector.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Chip,
  SelectChangeEvent,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

// ✅ Import des types centralisés
import type {
  TargetKind,
  AlgorithmVersionId,
  AlgorithmVersionMetadata,
} from "@/types/algorithm-lab";

export interface VersionSelectorProps {
  targetKind: TargetKind;
  selectedVersionId?: AlgorithmVersionId;
  onVersionSelect: (versionId: AlgorithmVersionId) => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  targetKind,
  selectedVersionId,
  onVersionSelect,
}) => {
  const [versions, setVersions] = useState<AlgorithmVersionMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("algorithm_version_registry")
          .select("*")
          .not(`${targetKind.toLowerCase()}_key`, "is", null)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erreur chargement versions:", error);
          return;
        }

        setVersions(data ?? []);
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [targetKind]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value) {
      onVersionSelect(value as AlgorithmVersionId);
    }
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="version-selector-label">Version Algorithme</InputLabel>
      <Select
        labelId="version-selector-label"
        id="version-selector"
        value={selectedVersionId ?? ""}
        label="Version Algorithme"
        onChange={handleChange}
        disabled={loading}
      >
        {versions.length === 0 && (
          <MenuItem value="" disabled>
            <Typography variant="body2" color="text.secondary">
              {loading ? "Chargement..." : "Aucune version disponible"}
            </Typography>
          </MenuItem>
        )}

        {versions.map((v) => (
          <MenuItem key={v.version_id} value={v.version_id}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ width: "100%" }}
            >
              <Typography sx={{ flex: 1 }}>
                {v.version_name || v.version_id}
              </Typography>

              {v.is_active && (
                <Chip label="Active" size="small" color="success" />
              )}

              {v.deprecated && (
                <Chip label="Déprécié" size="small" color="warning" />
              )}

              <Typography variant="caption" color="text.secondary">
                {new Date(v.created_at).toLocaleDateString("fr-FR")}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default VersionSelector;
