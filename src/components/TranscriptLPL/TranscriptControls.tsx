import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TagIcon from "@mui/icons-material/LocalOffer";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import { TranscriptControlsProps } from "./types";
import { useTaggingData, RelationsStatus } from "@/context/TaggingDataContext";

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
  const { calculateAllNextTurnTags, getRelationsStatus } = useTaggingData();
  const [calculating, setCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [relationsStatus, setRelationsStatus] =
    useState<RelationsStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Vérifier le statut des relations au chargement du composant
  useEffect(() => {
    if (callId) {
      checkCurrentStatus();
    }
  }, [callId]);

  const checkCurrentStatus = async () => {
    if (!callId) return;

    setStatusLoading(true);
    try {
      const status = await getRelationsStatus(callId);
      setRelationsStatus(status);
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCalculateRelations = async () => {
    setCalculating(true);
    try {
      console.log("Calcul des relations pour l'appel:", callId);
      const updatedCount = await calculateAllNextTurnTags(callId);
      setLastResult(updatedCount);

      // Mettre à jour le statut après calcul
      await checkCurrentStatus();

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

  // Fonction pour obtenir l'icône et la couleur selon le statut
  const getStatusDisplay = () => {
    if (statusLoading) {
      return {
        icon: <CircularProgress size={16} />,
        label: "Vérification...",
        color: "default" as const,
        severity: "info" as const,
      };
    }

    if (!relationsStatus) {
      return {
        icon: <ErrorIcon />,
        label: "Statut inconnu",
        color: "error" as const,
        severity: "error" as const,
      };
    }

    const { isCalculated, completenessPercent, missingRelations, totalTags } =
      relationsStatus;

    if (isCalculated) {
      return {
        icon: <CheckCircleIcon />,
        label: `Relations à jour (${completenessPercent.toFixed(1)}%)`,
        color: "success" as const,
        severity: "success" as const,
        details: `${totalTags} tags analysés`,
      };
    } else if (completenessPercent > 50) {
      return {
        icon: <WarningIcon />,
        label: `Partiellement calculé (${completenessPercent.toFixed(1)}%)`,
        color: "warning" as const,
        severity: "warning" as const,
        details: `${missingRelations} relations manquantes`,
      };
    } else {
      return {
        icon: <ErrorIcon />,
        label: `Relations non calculées (${completenessPercent.toFixed(1)}%)`,
        color: "error" as const,
        severity: "error" as const,
        details: `${missingRelations} relations manquantes sur ${totalTags}`,
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Box sx={{ mb: 2 }}>
      {/* Contrôles principaux */}
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

        {/* Bouton pour calculer les relations */}
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
          disabled={calculating || statusLoading}
          sx={{
            minWidth: "160px",
            opacity: calculating ? 0.7 : 1,
          }}
        >
          {calculating ? "Calcul..." : "Calculer Relations"}
        </Button>

        {/* Chip de statut des relations */}
        <Tooltip
          title={
            statusDisplay.details ||
            "Cliquez sur 'Calculer Relations' pour plus d'infos"
          }
          placement="top"
        >
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            size="medium"
            color={statusDisplay.color}
            variant="outlined"
            sx={{
              minWidth: "180px",
              cursor: "help",
            }}
          />
        </Tooltip>

        {/* Indicateur du résultat du dernier calcul */}
        {lastResult !== null && !calculating && (
          <Chip
            label={lastResult > 0 ? `${lastResult} mis à jour` : "Déjà à jour"}
            size="small"
            color={lastResult > 0 ? "info" : "default"}
            variant="filled"
          />
        )}
      </Box>

      {/* Alert informatif si relations incomplètes */}
      {relationsStatus && !relationsStatus.isCalculated && !calculating && (
        <Alert
          severity={statusDisplay.severity}
          sx={{ mt: 1 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleCalculateRelations}
              disabled={calculating}
            >
              Calculer maintenant
            </Button>
          }
        >
          {relationsStatus.missingRelations > 0 && (
            <>
              <strong>
                {relationsStatus.missingRelations} relations manquantes
              </strong>{" "}
              sur {relationsStatus.totalTags} tags. Les relations permettent
              d'analyser les enchaînements conversationnels.
            </>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default TranscriptControls;
