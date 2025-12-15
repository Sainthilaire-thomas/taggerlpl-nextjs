// src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/components/QuickTagEditDialog.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import { AnalysisPairContext } from "@/features/shared/ui/components";
import type { TVValidationResult } from "../types";

// Couleurs par famille de tags
const TAG_COLORS: Record<string, string> = {
  // X tags
  ENGAGEMENT: "#4caf50",
  EXPLICATION: "#2196f3",
  REFLET_ACQ: "#9c27b0",
  REFLET_JE: "#e91e63",
  REFLET_VOUS: "#ff9800",
  OUVERTURE: "#00bcd4",
  // Y tags
  CLIENT_POSITIF: "#4caf50",
  CLIENT_NEGATIF: "#f44336",
  CLIENT_NEUTRE: "#9e9e9e",
};

export interface QuickTagEditDialogProps {
  open: boolean;
  onClose: () => void;
  row: TVValidationResult | null;
  tagType: "X" | "Y" | null;
  availableTags: string[];
  currentTag: string;
  saving: boolean;
  error: string | null;
  onSave: (newTag: string) => Promise<boolean>;
}

export const QuickTagEditDialog: React.FC<QuickTagEditDialogProps> = ({
  open,
  onClose,
  row,
  tagType,
  availableTags,
  currentTag,
  saving,
  error,
  onSave,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>(currentTag);

  // Reset selection when dialog opens with new row
  useEffect(() => {
    if (open && currentTag) {
      setSelectedTag(currentTag);
    }
  }, [open, currentTag]);

  const handleSave = async () => {
    if (selectedTag && selectedTag !== currentTag) {
      await onSave(selectedTag);
    }
  };

  const metadata = (row?.metadata || {}) as Record<string, any>;
  const pairId = metadata.pairId as number | undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SpeedIcon color="primary" />
        <span>Édition Rapide — Tag {tagType}</span>
        {metadata.callId && (
          <Chip
            label={`Appel ${metadata.callId}`}
            size="small"
            variant="outlined"
            sx={{ ml: "auto" }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers>
        {/* Contexte de la paire */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            📋 Contexte de la conversation
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
            }}
          >
            {pairId ? (
              <AnalysisPairContext pairId={pairId} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Verbatim : {row?.verbatim || "—"}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tag actuel vs prédit */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            🏷️ Comparaison
          </Typography>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Gold Standard (actuel)
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentTag}
                  sx={{
                    bgcolor: TAG_COLORS[currentTag] || "#757575",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </Box>
            </Box>
            <Typography variant="h6" color="text.disabled">
              →
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Prédiction algorithme
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={row?.predicted || "—"}
                  variant="outlined"
                  sx={{
                    borderColor: row?.correct ? "success.main" : "error.main",
                    color: row?.correct ? "success.main" : "error.main",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Typography variant="caption" color="text.secondary">
                Confiance
              </Typography>
              <Typography
                variant="h6"
                color={row?.correct ? "success.main" : "error.main"}
              >
                {((row?.confidence ?? 0) * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Sélection du nouveau tag */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            ✏️ Nouveau tag {tagType}
          </Typography>
          <ToggleButtonGroup
            value={selectedTag}
            exclusive
            onChange={(_, value) => value && setSelectedTag(value)}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              "& .MuiToggleButton-root": {
                border: "1px solid",
                borderRadius: "16px !important",
                px: 2,
                py: 0.5,
                textTransform: "none",
                fontWeight: "medium",
              },
            }}
          >
            {availableTags.map((tag) => (
              <ToggleButton
                key={tag}
                value={tag}
                sx={{
                  borderColor: TAG_COLORS[tag] || "#757575",
                  color: TAG_COLORS[tag] || "#757575",
                  "&.Mui-selected": {
                    bgcolor: TAG_COLORS[tag] || "#757575",
                    color: "white",
                    "&:hover": {
                      bgcolor: TAG_COLORS[tag] || "#757575",
                      opacity: 0.9,
                    },
                  },
                }}
              >
                {tag}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Aperçu modification */}
        {selectedTag !== currentTag && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Modification :</strong> {currentTag} → {selectedTag}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cette modification sera appliquée dans <code>turntagged</code> et
              synchronisée dans <code>analysis_pairs</code>.
            </Typography>
          </Alert>
        )}

        {/* Erreur */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || selectedTag === currentTag}
          startIcon={saving ? <CircularProgress size={16} /> : <SpeedIcon />}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickTagEditDialog;
