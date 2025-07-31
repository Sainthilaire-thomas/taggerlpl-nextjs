// components/CallTableRow.tsx - VERSION CORRIGÉE
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";
import WarningIcon from "@mui/icons-material/Warning";
import DeleteIcon from "@mui/icons-material/Delete";
import { ComplementActionButtons } from "../../calls/ComplementActionButtons";
import OriginEditableCell from "./OriginEditableCell";
import { Call } from "../types";
import { getCallActions, getStatusColor, getContentLabel } from "../utils";
import { UseOriginEditReturn } from "../hooks/useOriginEdit";

interface CallTableRowProps {
  calls: Call[];
  originEdit: UseOriginEditReturn;
  onPrepareCall: (call: Call) => Promise<void>;
  onDeleteCall: (call: Call) => void;
  onAddAudio: (call: Call) => void;
  onAddTranscription: (call: Call) => void;
  onViewContent: (call: Call) => void;
  isDeleting: boolean;
  callToDelete: Call | null;
}

const CallTableRow: React.FC<CallTableRowProps> = ({
  calls,
  originEdit,
  onPrepareCall,
  onDeleteCall,
  onAddAudio,
  onAddTranscription,
  onViewContent,
  isDeleting,
  callToDelete,
}) => {
  const getContentIcon = (call: Call) => {
    const hasAudio = Boolean(call.upload && call.filepath);
    const hasTranscription = Boolean(
      call.transcription?.words && call.transcription.words.length > 0
    );

    if (hasAudio && hasTranscription) {
      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <AudioFileIcon color="primary" fontSize="small" />
          <DescriptionIcon color="secondary" fontSize="small" />
        </Box>
      );
    } else if (hasAudio) {
      return <AudioFileIcon color="primary" fontSize="small" />;
    } else if (hasTranscription) {
      return <DescriptionIcon color="secondary" fontSize="small" />;
    } else {
      return <WarningIcon color="warning" fontSize="small" />;
    }
  };

  // Wrappers de compatibilité
  const createExternalCallHandler = (handler: (call: Call) => void) => {
    return (externalCall: any) => {
      const internalCall: Call = {
        callid: externalCall.callid,
        origine: externalCall.origine,
        filename: externalCall.filename,
        description: externalCall.description,
        status: externalCall.status,
        duree: externalCall.duree,
        transcription: externalCall.transcription,
        audiourl: externalCall.audiourl,
        filepath: externalCall.filepath,
        upload: externalCall.upload,
        preparedfortranscript: externalCall.preparedfortranscript,
        is_tagging_call: externalCall.is_tagging_call,
      };
      handler(internalCall);
    };
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="Appels">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Origine</strong>
            </TableCell>
            <TableCell>
              <strong>ID</strong>
            </TableCell>
            <TableCell>
              <strong>Actions de Complément</strong>
            </TableCell>
            <TableCell>
              <strong>État</strong>
            </TableCell>
            <TableCell>
              <strong>Statut</strong>
            </TableCell>
            <TableCell>
              <strong>Fichier</strong>
            </TableCell>
            <TableCell>
              <strong>Description</strong>
            </TableCell>
            <TableCell>
              <strong>Durée (s)</strong>
            </TableCell>
            <TableCell>
              <strong>Préparation Technique</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {calls.map((call) => {
            const actions = getCallActions(call);
            return (
              <TableRow
                key={call.callid}
                sx={{ "&:hover": { backgroundColor: "action.hover" } }}
              >
                <TableCell>
                  <OriginEditableCell
                    call={call}
                    isSelected={originEdit.selectedCalls.has(call.callid)}
                    isEditing={originEdit.editingCallId === call.callid}
                    isProcessing={originEdit.isProcessing}
                    availableOrigins={originEdit.availableOrigins}
                    pendingOrigin={originEdit.pendingOrigin}
                    onSelect={originEdit.handleSelectCall}
                    onStartEdit={originEdit.handleStartEdit}
                    onSave={originEdit.handleSaveEdit}
                    onCancel={originEdit.handleCancelEdit}
                    onOriginChange={originEdit.setPendingOrigin}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "text.secondary",
                    }}
                  >
                    {call.callid}
                  </Typography>
                </TableCell>
                <TableCell>
                  <ComplementActionButtons
                    call={call as any}
                    onAddAudio={
                      actions.needsAudio
                        ? createExternalCallHandler(onAddAudio)
                        : undefined
                    }
                    onAddTranscription={
                      actions.needsTranscription
                        ? createExternalCallHandler(onAddTranscription)
                        : undefined
                    }
                    onViewContent={createExternalCallHandler(onViewContent)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getContentIcon(call)}
                    <Typography variant="caption">
                      {getContentLabel(call)}
                    </Typography>
                    {Boolean(call.preparedfortranscript) && (
                      <Chip size="small" label="Préparé" color="success" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <CircleIcon
                    style={{
                      color: getStatusColor(call.status),
                      fontSize: "1.5rem",
                    }}
                  />
                </TableCell>
                <TableCell>{call.filename || "Aucun"}</TableCell>
                <TableCell>
                  {call.description || "Pas de description"}
                </TableCell>
                <TableCell>
                  {call.duree ? `${call.duree} s` : "Inconnue"}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {actions.canPrepare ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => onPrepareCall(call)}
                      >
                        PRÉPARER
                      </Button>
                    ) : actions.isPrepared ? (
                      <Chip size="small" label="→ Liste" color="success" />
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Transcription requise
                      </Typography>
                    )}
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      onClick={() => onDeleteCall(call)}
                      disabled={
                        isDeleting && callToDelete?.callid === call.callid
                      }
                      sx={{
                        minWidth: "auto",
                        padding: "4px 8px",
                        "&:hover": {
                          backgroundColor: "error.light",
                          color: "error.contrastText",
                        },
                        "&:disabled": { opacity: 0.3 },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CallTableRow;
