import { memo, useState, useCallback, FC } from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  TextField,
  Checkbox,
  Chip,
  Box,
  Button,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AudioFile as AudioIcon,
  VolumeOff as NoAudioIcon,
} from "@mui/icons-material";
import { CallTableRowProps } from "./types";

// 🚀 OPTIMISATION: Composant mémoïsé pour éviter les re-renders inutiles
const CallTableRow: FC<CallTableRowProps> = memo(
  ({
    call,
    index,
    editingOrigine,
    onStartEditOrigine,
    onSaveOrigine,
    onCancelEditOrigine,
    onCallClick,
    onDeleteClick,
    isSelected = false,
    onSelectionChange,
    disabled = false,
    // ✅ NOUVELLES PROPS DESTRUCTURÉES
    relationsStatusChip,
    relationsTooltip,
  }) => {
    const [tempOrigine, setTempOrigine] = useState(call.origine || "");
    const isEditing = editingOrigine === String(call.callid);

    // 🚀 OPTIMISATION: Handler mémoïsé pour la sélection
    const handleSelectionChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onSelectionChange && !disabled) {
          onSelectionChange(call.callid, event.target.checked);
        }
      },
      [call.callid, onSelectionChange, disabled]
    );

    // 🚀 OPTIMISATION: Handler mémoïsé pour le clic sur la ligne
    const handleRowClick = useCallback(
      (event: React.MouseEvent) => {
        // Éviter le clic si on clique sur des éléments interactifs
        const target = event.target as HTMLElement;
        if (
          target.closest("input") ||
          target.closest("button") ||
          target.closest(".MuiCheckbox-root") ||
          disabled
        ) {
          return;
        }
        onCallClick(call);
      },
      [call, onCallClick, disabled]
    );

    // Handlers pour l'édition d'origine
    const handleStartEdit = useCallback(() => {
      if (!disabled) {
        setTempOrigine(call.origine || "");
        onStartEditOrigine(call.callid);
      }
    }, [call.origine, call.callid, onStartEditOrigine, disabled]);

    const handleSaveEdit = useCallback(() => {
      if (!disabled) {
        onSaveOrigine(call.callid, tempOrigine);
      }
    }, [call.callid, tempOrigine, onSaveOrigine, disabled]);

    const handleCancelEdit = useCallback(() => {
      if (!disabled) {
        setTempOrigine(call.origine || "");
        onCancelEditOrigine();
      }
    }, [call.origine, onCancelEditOrigine, disabled]);

    const handleDelete = useCallback(() => {
      if (!disabled) {
        onDeleteClick(call);
      }
    }, [call, onDeleteClick, disabled]);

    // 🚀 OPTIMISATION: Formatage des données mémoïsé
    const displayData = {
      filename: call.filename || "N/A",
      duree: call.duree || "0:00",
      status: call.status || "inconnu",
      hasAudio: Boolean(call.upload && call.filepath),
      description: call.description || "Aucune description",
    };

    // Styles pour la ligne sélectionnée
    const rowStyles = {
      backgroundColor: isSelected ? "action.selected" : "inherit",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "default" : "pointer",
      "&:hover": {
        backgroundColor: disabled
          ? "inherit"
          : isSelected
          ? "action.selected"
          : "action.hover",
      },
    };

    return (
      <TableRow
        hover={!disabled}
        selected={isSelected}
        sx={rowStyles}
        onClick={handleRowClick}
      >
        {/* Checkbox de sélection */}
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={handleSelectionChange}
            disabled={disabled}
            inputProps={{
              "aria-label": `Sélectionner l'appel ${call.filename}`,
            }}
          />
        </TableCell>

        {/* Nom du fichier */}
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip
              title={displayData.hasAudio ? "Audio disponible" : "Pas d'audio"}
            >
              {displayData.hasAudio ? (
                <AudioIcon color="primary" fontSize="small" />
              ) : (
                <NoAudioIcon color="disabled" fontSize="small" />
              )}
            </Tooltip>
            <Box
              sx={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayData.filename}
            </Box>
          </Box>
        </TableCell>

        {/* Audio */}
        <TableCell align="center">
          {displayData.hasAudio && (
            <Tooltip title="Lire l'appel">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onCallClick(call);
                }}
                disabled={disabled}
              >
                <PlayIcon />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>

        {/* Durée */}
        <TableCell>
          <Chip
            label={displayData.duree}
            size="small"
            variant="outlined"
            color={displayData.duree !== "0:00" ? "primary" : "default"}
          />
        </TableCell>

        {/* Statut */}
        <TableCell>
          <Chip
            label={displayData.status}
            size="small"
            color={
              displayData.status === "completed"
                ? "success"
                : displayData.status === "processing"
                ? "warning"
                : displayData.status === "error"
                ? "error"
                : "default"
            }
          />
        </TableCell>

        {/* ✅ NOUVELLE CELLULE: Relations */}
        <TableCell align="center">
          {relationsTooltip ? (
            <Tooltip title={relationsTooltip} placement="top">
              <Box>{relationsStatusChip}</Box>
            </Tooltip>
          ) : (
            relationsStatusChip || (
              <Chip
                label="N/A"
                size="small"
                variant="outlined"
                color="default"
                sx={{ minWidth: 90 }}
              />
            )
          )}
        </TableCell>

        {/* Origine (avec édition inline) */}
        <TableCell>
          {isEditing ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 150,
              }}
            >
              <TextField
                size="small"
                value={tempOrigine}
                onChange={(e) => setTempOrigine(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                disabled={disabled}
                autoFocus
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                size="small"
                onClick={handleSaveEdit}
                disabled={disabled}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCancelEdit}
                disabled={disabled}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  flexGrow: 1,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {call.origine || "Non définie"}
              </Box>
              <Tooltip title="Modifier l'origine">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit();
                  }}
                  disabled={disabled}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </TableCell>

        {/* Description */}
        <TableCell>
          <Box
            sx={{
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayData.description}
          </Box>
        </TableCell>

        {/* Actions */}
        <TableCell align="center">
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {displayData.hasAudio && (
              <Tooltip title="Charger pour tagging">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onCallClick(call);
                  }}
                  disabled={disabled}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={disabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  }
);

CallTableRow.displayName = "CallTableRow";

export default CallTableRow;
