import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TagIcon from "@mui/icons-material/LocalOffer";
import LinkIcon from "@mui/icons-material/Link";
import { TranscriptControlsProps } from "./types";
import { useTaggingData } from "@/context/TaggingDataContext";

// Interface mise à jour pour inclure callId
interface ExtendedTranscriptControlsProps extends TranscriptControlsProps {
  callId: string;
}

const TranscriptControls: React.FC<ExtendedTranscriptControlsProps> = ({
  fontSize,
  setFontSize,
  drawerOpen,
  handleToggleDrawer,
  callId,
}) => {
  const { calculateAllNextTurnTags } = useTaggingData();
  const [calculating, setCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleCalculateRelations = async () => {
    setCalculating(true);
    try {
      console.log("Calcul des relations pour l'appel:", callId);
      const updatedCount = await calculateAllNextTurnTags(callId);
      setLastResult(updatedCount);

      if (updatedCount > 0) {
        console.log(`✅ ${updatedCount} relations calculées`);
      } else {
        console.log("ℹ️ Toutes les relations étaient déjà à jour");
      }
    } catch (error) {
      console.error("Erreur lors du calcul des relations:", error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mt: 2,
        mb: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Contrôles de taille de police */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFontSize((prev) => Math.max(prev - 1, 12))}
        >
          <RemoveIcon />
        </Button>
        <Typography
          sx={{
            display: "inline-block",
            mx: 1,
            minWidth: "50px",
            textAlign: "center",
          }}
        >
          {fontSize}px
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFontSize((prev) => Math.min(prev + 1, 30))}
        >
          <AddIcon />
        </Button>
      </Box>

      {/* Bouton pour ouvrir/fermer le panneau de tags */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<TagIcon />}
        onClick={handleToggleDrawer}
      >
        {drawerOpen ? "Masquer les tags" : "Afficher les tags"}
      </Button>

      {/* ✅ NOUVEAU : Bouton pour calculer les relations */}
      <Button
        variant="outlined"
        color="secondary"
        size="medium"
        startIcon={
          calculating ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <LinkIcon />
          )
        }
        onClick={handleCalculateRelations}
        disabled={calculating}
        sx={{
          minWidth: "160px",
          opacity: calculating ? 0.7 : 1,
        }}
      >
        {calculating ? "Calcul..." : "Calculer Relations"}
      </Button>

      {/* Indicateur du résultat du dernier calcul */}
      {lastResult !== null && !calculating && (
        <Chip
          label={lastResult > 0 ? `${lastResult} mis à jour` : "Déjà à jour"}
          size="small"
          color={lastResult > 0 ? "success" : "default"}
          variant="outlined"
        />
      )}
    </Box>
  );
};

export default TranscriptControls;
