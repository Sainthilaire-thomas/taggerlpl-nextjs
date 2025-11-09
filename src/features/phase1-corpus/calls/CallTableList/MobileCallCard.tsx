import { memo, useCallback, FC } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Collapse,
  Checkbox,
  Divider,
  Button,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  AudioFile as AudioIcon,
  VolumeOff as NoAudioIcon,
  AccessTime as TimeIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import { MobileCallCardProps } from "./types";

// 🚀 OPTIMISATION: Composant mémoïsé pour les cartes mobiles
const MobileCallCard: FC<MobileCallCardProps> = memo(
  ({
    call,
    isExpanded,
    onToggleExpansion,
    onCallClick,
    onDeleteClick,
    isSelected = false,
    onSelectionChange,
    disabled = false,
  }) => {
    // 🚀 OPTIMISATION: Données formatées mémoïsées
    const displayData = {
      filename: call.filename || "Fichier sans nom",
      duree: call.duree || "0:00",
      status: call.status || "inconnu",
      origine: call.origine || "Non définie",
      description: call.description || "Aucune description",
      hasAudio: Boolean(call.upload && call.filepath),
    };

    // Handlers optimisés
    const handleToggleExpansion = useCallback(() => {
      if (!disabled) {
        onToggleExpansion(call.callid);
      }
    }, [call.callid, onToggleExpansion, disabled]);

    const handleSelectionChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onSelectionChange && !disabled) {
          event.stopPropagation();
          onSelectionChange(call.callid, event.target.checked);
        }
      },
      [call.callid, onSelectionChange, disabled]
    );

    const handlePlayClick = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!disabled) {
          onCallClick(call);
        }
      },
      [call, onCallClick, disabled]
    );

    const handleDeleteClick = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!disabled) {
          onDeleteClick(call);
        }
      },
      [call, onDeleteClick, disabled]
    );

    const handleCardClick = useCallback(() => {
      if (!disabled && displayData.hasAudio) {
        onCallClick(call);
      }
    }, [call, onCallClick, disabled, displayData.hasAudio]);

    // Couleur de statut
    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed":
          return "success";
        case "processing":
          return "warning";
        case "error":
          return "error";
        default:
          return "default";
      }
    };

    return (
      <Card
        sx={{
          backgroundColor: isSelected ? "action.selected" : "background.paper",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled
            ? "default"
            : displayData.hasAudio
            ? "pointer"
            : "default",
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? "primary.main" : "divider",
          "&:hover": {
            backgroundColor: disabled
              ? "inherit"
              : isSelected
              ? "action.selected"
              : "action.hover",
            boxShadow: disabled ? 1 : 2,
          },
          transition: "all 0.2s ease-in-out",
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* En-tête avec sélection et informations principales */}
          <Box
            sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}
          >
            {/* Checkbox de sélection */}
            <Checkbox
              checked={isSelected}
              onChange={handleSelectionChange}
              disabled={disabled}
              size="small"
              sx={{ p: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Icône audio */}
            <Box sx={{ mt: 0.5 }}>
              {displayData.hasAudio ? (
                <AudioIcon color="primary" fontSize="small" />
              ) : (
                <NoAudioIcon color="disabled" fontSize="small" />
              )}
            </Box>

            {/* Informations principales */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: "bold",
                  mb: 0.5,
                }}
              >
                {displayData.filename}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Chip
                  icon={<TimeIcon />}
                  label={displayData.duree}
                  size="small"
                  variant="outlined"
                  color={displayData.duree !== "0:00" ? "primary" : "default"}
                />

                <Chip
                  label={displayData.status}
                  size="small"
                  color={getStatusColor(displayData.status) as any}
                />
              </Box>
            </Box>

            {/* Bouton d'expansion */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpansion();
              }}
              disabled={disabled}
              sx={{ p: 0.5 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Origine - toujours visible */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LabelIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Origine: <strong>{displayData.origine}</strong>
            </Typography>
          </Box>

          {/* Contenu expansible */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />

            {/* Description */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body2" sx={{ pl: 1 }}>
                {displayData.description}
              </Typography>
            </Box>

            {/* Informations techniques */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Informations techniques:</strong>
              </Typography>
              <Box
                sx={{
                  pl: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography variant="caption">ID: {call.callid}</Typography>
                <Typography variant="caption">
                  Fichier:{" "}
                  {displayData.hasAudio ? "Disponible" : "Non disponible"}
                </Typography>
                {call.filepath && (
                  <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
                    Chemin: {call.filepath}
                  </Typography>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ pt: 0, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {displayData.hasAudio && (
              <Button
                size="small"
                startIcon={<PlayIcon />}
                onClick={handlePlayClick}
                disabled={disabled}
                variant="contained"
                color="primary"
              >
                Charger
              </Button>
            )}
          </Box>

          <IconButton
            size="small"
            color="error"
            onClick={handleDeleteClick}
            disabled={disabled}
            sx={{ ml: "auto" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    );
  }
);

MobileCallCard.displayName = "MobileCallCard";

export default MobileCallCard;
