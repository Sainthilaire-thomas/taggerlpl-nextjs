// components/CallTableRow.tsx - VERSION SANS ÉDITION INDIVIDUELLE
import React, { memo, useCallback, useMemo } from "react";
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

// ✅ SIMPLIFICATION: Interface réduite (plus d'édition individuelle)
interface OriginEditHook {
  selectedCalls: Set<string>;
  handleSelectCall: (callId: string, selected: boolean) => void;
  availableOrigins: string[];
  // ✅ SUPPRESSION: Props d'édition individuelle non utilisées
  // editingCallId?: string;
  // handleStartEdit?: (callId: string) => void;
  // handleSaveEdit?: (callId: string, origin: string) => Promise<void>;
  // handleCancelEdit?: () => void;
  // setPendingOrigin?: (origin: string) => void;
  // pendingOrigin?: string;
  // isProcessing?: boolean;
}

interface CallTableRowProps {
  calls: Call[];
  originEdit: OriginEditHook;
  onPrepareCall: (call: Call) => Promise<void>;
  onDeleteCall: (call: Call) => void;
  onAddAudio: (call: Call) => void;
  onAddTranscription: (call: Call) => void;
  onViewContent: (call: Call) => void;
  isDeleting: boolean;
  callToDelete: Call | null;
}

// ✅ OPTIMISATION: CallRowItem simplifié sans édition individuelle
const CallRowItem = memo(
  ({
    call,
    originEdit,
    onPrepareCall,
    onDeleteCall,
    onAddAudio,
    onAddTranscription,
    onViewContent,
    isDeleting,
    isCallToDelete,
  }: {
    call: Call;
    originEdit: OriginEditHook;
    onPrepareCall: (call: Call) => Promise<void>;
    onDeleteCall: (call: Call) => void;
    onAddAudio: (call: Call) => void;
    onAddTranscription: (call: Call) => void;
    onViewContent: (call: Call) => void;
    isDeleting: boolean;
    isCallToDelete: boolean;
  }) => {
    // ✅ Callbacks mémoïsés
    const handlePrepare = useCallback(() => {
      console.time(`prepare-${call.callid}`);
      onPrepareCall(call).finally(() => {
        console.timeEnd(`prepare-${call.callid}`);
      });
    }, [call, onPrepareCall]);

    const handleDelete = useCallback(() => {
      console.time(`delete-${call.callid}`);
      onDeleteCall(call);
      console.timeEnd(`delete-${call.callid}`);
    }, [call, onDeleteCall]);

    const handleAddAudio = useCallback(() => {
      onAddAudio(call);
    }, [call, onAddAudio]);

    const handleAddTranscription = useCallback(() => {
      onAddTranscription(call);
    }, [call, onAddTranscription]);

    const handleViewContent = useCallback(() => {
      onViewContent(call);
    }, [call, onViewContent]);

    // ✅ Calculs mémoïsés
    const actions = useMemo(() => {
      console.time(`actions-${call.callid}`);
      const result = getCallActions(call);
      console.timeEnd(`actions-${call.callid}`);
      return result;
    }, [
      call.upload,
      call.filepath,
      call.transcription,
      call.preparedfortranscript,
    ]);

    const contentIcon = useMemo(() => {
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
    }, [call.upload, call.filepath, call.transcription]);

    const contentLabel = useMemo(() => {
      return getContentLabel(call);
    }, [call.upload, call.filepath, call.transcription]);

    const statusColor = useMemo(() => {
      return getStatusColor(call.status);
    }, [call.status]);

    // ✅ Wrapper de compatibilité mémoïsé
    const createExternalCallHandler = useCallback(
      (handler: (call: Call) => void) => {
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
      },
      []
    );

    // ✅ Handlers externes mémoïsés
    const addAudioHandler = useMemo(
      () =>
        actions.needsAudio
          ? createExternalCallHandler(handleAddAudio)
          : undefined,
      [actions.needsAudio, createExternalCallHandler, handleAddAudio]
    );

    const addTranscriptionHandler = useMemo(
      () =>
        actions.needsTranscription
          ? createExternalCallHandler(handleAddTranscription)
          : undefined,
      [
        actions.needsTranscription,
        createExternalCallHandler,
        handleAddTranscription,
      ]
    );

    const viewContentHandler = useMemo(
      () => createExternalCallHandler(handleViewContent),
      [createExternalCallHandler, handleViewContent]
    );

    console.log(
      `🔄 Render CallRowItem: ${
        call.callid
      } (selected: ${originEdit.selectedCalls.has(call.callid)})`
    );

    return (
      <TableRow sx={{ "&:hover": { backgroundColor: "action.hover" } }}>
        {/* ✅ CELLULE D'ORIGINE SIMPLIFIÉE */}
        <TableCell sx={{ width: 200 }}>
          {" "}
          {/* ✅ Largeur fixe réduite */}
          <OriginEditableCell
            call={call}
            isSelected={originEdit.selectedCalls.has(call.callid)}
            availableOrigins={originEdit.availableOrigins}
            onSelect={originEdit.handleSelectCall}
            // ✅ SUPPRESSION: Plus de props d'édition individuelle
          />
        </TableCell>

        {/* ID de l'appel - Plus compact */}
        <TableCell sx={{ width: 80 }}>
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

        {/* Actions de complément - Plus compact */}
        <TableCell sx={{ width: 120 }}>
          <ComplementActionButtons
            call={call as any}
            onAddAudio={addAudioHandler}
            onAddTranscription={addTranscriptionHandler}
            onViewContent={viewContentHandler}
          />
        </TableCell>

        {/* État du contenu */}
        <TableCell sx={{ width: 150 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {contentIcon}
            <Typography variant="caption">{contentLabel}</Typography>
            {Boolean(call.preparedfortranscript) && (
              <Chip size="small" label="Préparé" color="success" />
            )}
          </Box>
        </TableCell>

        {/* Statut */}
        <TableCell sx={{ width: 60 }}>
          <CircleIcon
            style={{
              color: statusColor,
              fontSize: "1.5rem",
            }}
          />
        </TableCell>

        {/* Fichier - Plus compact */}
        <TableCell sx={{ maxWidth: 150 }}>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={call.filename || "Aucun"}
          >
            {call.filename || "Aucun"}
          </Typography>
        </TableCell>

        {/* Description - Plus compact */}
        <TableCell sx={{ maxWidth: 200 }}>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={call.description || "Pas de description"}
          >
            {call.description || "Pas de description"}
          </Typography>
        </TableCell>

        {/* Durée */}
        <TableCell sx={{ width: 80 }}>
          {call.duree ? `${call.duree} s` : "Inconnue"}
        </TableCell>

        {/* Actions de préparation */}
        <TableCell sx={{ width: 200 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {actions.canPrepare ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={handlePrepare}
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
              onClick={handleDelete}
              disabled={isDeleting && isCallToDelete}
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
  },
  (prevProps, nextProps) => {
    // ✅ Comparaison simplifiée (moins de props à comparer)
    const isSelected = prevProps.originEdit.selectedCalls.has(
      prevProps.call.callid
    );
    const wasSelected = nextProps.originEdit.selectedCalls.has(
      nextProps.call.callid
    );

    const isEqual =
      prevProps.call.callid === nextProps.call.callid &&
      prevProps.call.origine === nextProps.call.origine &&
      prevProps.call.status === nextProps.call.status &&
      prevProps.call.preparedfortranscript ===
        nextProps.call.preparedfortranscript &&
      prevProps.call.filename === nextProps.call.filename &&
      prevProps.call.description === nextProps.call.description &&
      prevProps.call.duree === nextProps.call.duree &&
      isSelected === wasSelected &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.isCallToDelete === nextProps.isCallToDelete;

    if (!isEqual) {
      console.log(`🔄 CallRowItem ${prevProps.call.callid} needs re-render:`, {
        origineChanged: prevProps.call.origine !== nextProps.call.origine,
        statusChanged: prevProps.call.status !== nextProps.call.status,
        selectionChanged: isSelected !== wasSelected,
      });
    }

    return isEqual;
  }
);

CallRowItem.displayName = "CallRowItem";

// ✅ Composant principal avec en-têtes optimisés
const CallTableRow: React.FC<CallTableRowProps> = memo(
  ({
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
    const stableProps = useMemo(
      () => ({
        originEdit,
        onPrepareCall,
        onDeleteCall,
        onAddAudio,
        onAddTranscription,
        onViewContent,
        isDeleting,
      }),
      [
        originEdit,
        onPrepareCall,
        onDeleteCall,
        onAddAudio,
        onAddTranscription,
        onViewContent,
        isDeleting,
      ]
    );

    console.log(`🔄 Render CallTableRow - ${calls.length} appels`);

    return (
      <TableContainer component={Paper}>
        <Table size="small" aria-label="Appels" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 200 }}>
                <strong>Origine</strong>
              </TableCell>
              <TableCell sx={{ width: 80 }}>
                <strong>ID</strong>
              </TableCell>
              <TableCell sx={{ width: 120 }}>
                <strong>Actions</strong>
              </TableCell>
              <TableCell sx={{ width: 150 }}>
                <strong>État</strong>
              </TableCell>
              <TableCell sx={{ width: 60 }}>
                <strong>Statut</strong>
              </TableCell>
              <TableCell sx={{ maxWidth: 150 }}>
                <strong>Fichier</strong>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <strong>Description</strong>
              </TableCell>
              <TableCell sx={{ width: 80 }}>
                <strong>Durée</strong>
              </TableCell>
              <TableCell sx={{ width: 200 }}>
                <strong>Préparation</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {calls.map((call) => (
              <CallRowItem
                key={call.callid}
                call={call}
                {...stableProps}
                isCallToDelete={callToDelete?.callid === call.callid}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
  (prevProps, nextProps) => {
    const callsChanged =
      prevProps.calls.length !== nextProps.calls.length ||
      prevProps.calls.some(
        (call, index) => call.callid !== nextProps.calls[index]?.callid
      );

    const selectionChanged =
      prevProps.originEdit.selectedCalls.size !==
      nextProps.originEdit.selectedCalls.size;

    const deletingChanged =
      prevProps.isDeleting !== nextProps.isDeleting ||
      prevProps.callToDelete?.callid !== nextProps.callToDelete?.callid;

    const shouldRerender = callsChanged || selectionChanged || deletingChanged;

    if (shouldRerender) {
      console.log(`🔄 CallTableRow needs re-render:`, {
        callsChanged,
        selectionChanged,
        deletingChanged,
      });
    }

    return !shouldRerender;
  }
);

CallTableRow.displayName = "CallTableRow";

export default CallTableRow;
