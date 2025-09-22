// src/components/calls/ui/components/CallLifecycleColumn.tsx

import React from "react";
import {
  Box,
  Chip,
  Button,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  AudioFile,
  Transcribe,
  PlayArrow,
  CheckCircle,
  RadioButtonUnchecked,
  Build,
  Tag,
  Warning,
  Error,
} from "@mui/icons-material";
import {
  CallExtended,
  TaggingWorkflowStage,
} from "../../domain/entities/CallExtended";

/**
 * Props du composant CallLifecycleColumn
 */
export interface CallLifecycleColumnProps {
  call: CallExtended;
  onAction: (action: string, call: CallExtended) => void;
  isLoading?: boolean;
}

/**
 * Configuration d'affichage pour chaque étape du cycle de vie
 */
const STAGE_CONFIG = {
  [TaggingWorkflowStage.EMPTY]: {
    label: "Vide",
    color: "default" as const,
    icon: <Error />,
    description: "Aucun contenu disponible",
  },
  [TaggingWorkflowStage.AUDIO_ONLY]: {
    label: "Audio seul",
    color: "warning" as const,
    icon: <AudioFile />,
    description: "Audio disponible, transcription manquante",
  },
  [TaggingWorkflowStage.TRANSCRIPTION_ONLY]: {
    label: "Transcription seule",
    color: "info" as const,
    icon: <Transcribe />,
    description: "Transcription disponible, audio manquant",
  },
  [TaggingWorkflowStage.COMPLETE]: {
    label: "Complet",
    color: "primary" as const,
    icon: <CheckCircle />,
    description: "Audio et transcription disponibles",
  },
  [TaggingWorkflowStage.NOT_PREPARED]: {
    label: "Non préparé",
    color: "secondary" as const,
    icon: <Warning />,
    description: "Prêt à être préparé pour le tagging",
  },
  [TaggingWorkflowStage.PREPARED]: {
    label: "Préparé",
    color: "success" as const,
    icon: <Build />,
    description: "Préparé, peut être sélectionné pour tagging",
  },
  [TaggingWorkflowStage.SELECTED]: {
    label: "Sélectionné",
    color: "primary" as const,
    icon: <RadioButtonUnchecked />,
    description: "Sélectionné pour tagging",
  },
  [TaggingWorkflowStage.TAGGED]: {
    label: "Taggé",
    color: "success" as const,
    icon: <Tag />,
    description: "Tagging terminé",
  },
};

/**
 * Composant pour afficher et gérer le cycle de vie d'un appel dans une colonne de table
 *
 * Affiche :
 * - L'état actuel sous forme de chip coloré
 * - Un bouton d'action contextuel selon l'état
 * - Des indicateurs visuels pour le contenu disponible
 * - Des tooltips explicatifs
 *
 * @param call - Instance CallExtended avec informations de workflow
 * @param onAction - Callback pour les actions utilisateur
 * @param isLoading - Indicateur de chargement en cours
 */
export const CallLifecycleColumn: React.FC<CallLifecycleColumnProps> = ({
  call,
  onAction,
  isLoading = false,
}) => {
  React.useEffect(() => {
    if (call.id === "741") {
      // Debug spécifique pour l'appel 741
      console.log("🔍 DEBUG Call 741 Lifecycle:", {
        callId: call.id,
        // Propriétés de base
        hasAudio: call.hasValidAudio(),
        hasTranscription: call.hasValidTranscription(),
        // Flags de workflow depuis la DB
        preparedForTranscript: call.preparedForTranscript,
        isTaggingCall: call.isTaggingCall,
        isTagged: call.isTagged,
        // JSON de transcription
        transcriptionJson: !!call.getTranscription(),
        // Statut calculé
        lifecycle: call.getLifecycleStatus(),
        // Méthodes de calcul
        canPrepare: call.canPrepare(),
        canSelect: call.canSelect(),
        canTag: call.canTag(),
        canUnselect: call.canUnselect(),
      });
    }
  }, [call]);
  // Obtenir le statut complet du cycle de vie
  const lifecycle = call.getLifecycleStatus();
  const stageConfig = STAGE_CONFIG[lifecycle.overallStage];

  /**
   * Détermine l'action principale à afficher selon l'état
   */
  const getPrimaryAction = () => {
    if (lifecycle.canPrepare) {
      return {
        key: "prepare",
        label: "Préparer",
        color: "primary" as const,
        variant: "outlined" as const,
        icon: <Build sx={{ fontSize: 16 }} />,
        tooltip: "Transformer le JSON en mots pour le tagging",
      };
    }

    if (lifecycle.canSelect) {
      return {
        key: "select",
        label: "Sélectionner",
        color: "success" as const,
        variant: "outlined" as const,
        icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
        tooltip: "Sélectionner pour le tagging",
      };
    }

    if (lifecycle.canTag) {
      return {
        key: "tag",
        label: "Taguer",
        color: "primary" as const,
        variant: "contained" as const,
        icon: <Tag sx={{ fontSize: 16 }} />,
        tooltip: "Ouvrir dans TranscriptLPL pour taguer",
      };
    }

    if (lifecycle.canUnselect) {
      return {
        key: "unselect",
        label: "Désélectionner",
        color: "secondary" as const,
        variant: "outlined" as const,
        icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
        tooltip: "Retirer de la sélection de tagging",
      };
    }

    if (lifecycle.overallStage === TaggingWorkflowStage.TAGGED) {
      return {
        key: "view",
        label: "Voir",
        color: "info" as const,
        variant: "outlined" as const,
        icon: <PlayArrow sx={{ fontSize: 16 }} />,
        tooltip: "Voir/éditer les tags existants",
      };
    }

    return null;
  };

  const primaryAction = getPrimaryAction();

  /**
   * Gère le clic sur un bouton d'action
   */
  const handleActionClick = (actionKey: string) => {
    if (isLoading) return;
    onAction(actionKey, call);
  };

  /**
   * Rendu des indicateurs de contenu (audio, transcription)
   */
  const renderContentIndicators = () => {
    const indicators = [];

    if (lifecycle.hasAudio) {
      indicators.push(
        <Tooltip key="audio" title="Audio disponible">
          <AudioFile
            sx={{
              fontSize: 14,
              color: "success.main",
              mr: 0.5,
            }}
          />
        </Tooltip>
      );
    }

    if (lifecycle.hasTranscription) {
      indicators.push(
        <Tooltip key="transcript" title="Transcription disponible">
          <Transcribe
            sx={{
              fontSize: 14,
              color: "info.main",
              mr: 0.5,
            }}
          />
        </Tooltip>
      );
    }

    return indicators.length > 0 ? (
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        {indicators}
      </Box>
    ) : null;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 140,
        position: "relative",
      }}
    >
      {/* Indicateur de chargement */}
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 1,
            borderRadius: 1,
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}

      {/* Indicateurs de contenu */}
      {renderContentIndicators()}

      {/* Chip d'état principal */}
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {stageConfig.description}
            </Typography>
            {lifecycle.nextAction && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Prochaine étape : {lifecycle.nextAction}
              </Typography>
            )}
            <Box sx={{ mt: 1, fontSize: "0.75rem", opacity: 0.7 }}>
              <div>• Audio : {lifecycle.hasAudio ? "✓" : "✗"}</div>
              <div>
                • Transcription : {lifecycle.hasTranscription ? "✓" : "✗"}
              </div>
              <div>
                • Préparé : {lifecycle.preparedForTranscript ? "✓" : "✗"}
              </div>
              <div>• Sélectionné : {lifecycle.isTaggingCall ? "✓" : "✗"}</div>
              <div>• Taggé : {lifecycle.isTagged ? "✓" : "✗"}</div>
            </Box>
          </Box>
        }
        placement="left"
        arrow
      >
        <Chip
          icon={stageConfig.icon}
          label={stageConfig.label}
          color={stageConfig.color}
          size="small"
          sx={{
            minWidth: 120,
            "& .MuiChip-icon": {
              fontSize: 16,
            },
          }}
        />
      </Tooltip>

      {/* Bouton d'action principal */}
      {primaryAction && (
        <Tooltip title={primaryAction.tooltip} placement="left" arrow>
          <Button
            size="small"
            variant={primaryAction.variant}
            color={primaryAction.color}
            startIcon={primaryAction.icon}
            onClick={() => handleActionClick(primaryAction.key)}
            disabled={isLoading}
            sx={{
              fontSize: "0.75rem",
              minWidth: 120,
              height: 28,
              textTransform: "none",
            }}
          >
            {primaryAction.label}
          </Button>
        </Tooltip>
      )}

      {/* Informations supplémentaires pour le debug/développement */}
      {process.env.NODE_ENV === "development" && (
        <Typography
          variant="caption"
          sx={{
            opacity: 0.5,
            fontSize: "0.65rem",
            textAlign: "center",
            mt: 0.5,
          }}
        >
          ID: {call.id.slice(-4)}
        </Typography>
      )}
    </Box>
  );
};

export default CallLifecycleColumn;
