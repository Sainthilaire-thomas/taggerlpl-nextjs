// src/components/calls/ui/transcription/TranscriptionProgress.tsx

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Collapse,
  Stack,
  Divider,
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Mic,
  People,
  Sync,
  Check,
} from "@mui/icons-material";
import { useState } from "react";
import {
  TranscriptionProgress,
  BatchProgress,
} from "../../hooks/actions/useCallTranscriptionActions";

interface TranscriptionProgressProps {
  progress?: TranscriptionProgress;
  batchProgress?: BatchProgress;
  onCancel?: () => void;
  compact?: boolean;
}

/**
 * Composant de progression pour la transcription automatique
 * Affiche le progrès en temps réel avec détails par étapes
 */
export const TranscriptionProgressComponent: React.FC<
  TranscriptionProgressProps
> = ({ progress, batchProgress, onCancel, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  // Pas de progression à afficher
  if (!progress && !batchProgress) {
    return null;
  }

  // Progression en lot
  if (batchProgress) {
    return (
      <Card elevation={3} sx={{ mb: 2 }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Sync color="primary" />
              <Typography variant="h6">Batch Transcription Progress</Typography>
              <Chip
                label={`${batchProgress.completedCalls}/${batchProgress.totalCalls}`}
                color="primary"
                size="small"
              />
            </Box>
            {batchProgress.isRunning && onCancel && (
              <IconButton onClick={onCancel} color="error" size="small">
                <Stop />
              </IconButton>
            )}
          </Box>

          {/* Progress général */}
          <LinearProgress
            variant="determinate"
            value={
              (batchProgress.completedCalls / batchProgress.totalCalls) * 100
            }
            sx={{ mb: 2, height: 8, borderRadius: 1 }}
          />

          {/* Métriques en temps réel */}
          <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Cost
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${batchProgress.totalCost.toFixed(4)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Avg. Time/Call
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.round(batchProgress.averageTimePerCall / 1000)}s
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Success Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {batchProgress.completedCalls > 0
                  ? Math.round(
                      (batchProgress.results.filter((r) => r.success).length /
                        batchProgress.completedCalls) *
                        100
                    )
                  : 0}
                %
              </Typography>
            </Box>
          </Stack>

          {/* Appel en cours */}
          {batchProgress.currentCall && (
            <Alert
              severity={
                batchProgress.currentCall.status === "error" ? "error" : "info"
              }
              icon={getStatusIcon(batchProgress.currentCall.status)}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2">
                <strong>Current:</strong> {batchProgress.currentCall.callId} -{" "}
                {batchProgress.currentCall.stage}
              </Typography>
              {batchProgress.currentCall.error && (
                <Typography variant="caption" color="error">
                  {batchProgress.currentCall.error}
                </Typography>
              )}
            </Alert>
          )}

          {/* Détails expandables */}
          <Box>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
              {expanded ? "Hide" : "Show"} Details
            </Typography>
          </Box>

          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {batchProgress.results.slice(-5).map((result, index) => (
                <Box
                  key={`${result.callId}-${index}`}
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: result.success ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="caption">
                    {result.callId}: {result.success ? "✅" : "❌"}
                    {result.success && (
                      <>
                        {" "}
                        - {result.metrics.wordCount} words, $
                        {result.metrics.totalCost.toFixed(4)}
                      </>
                    )}
                    {!result.success && <> - {result.error}</>}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  // Progression individuelle
  if (progress) {
    return (
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(progress.status)}
              <Typography variant={compact ? "body2" : "h6"}>
                {compact ? "Processing..." : "Transcription Progress"}
              </Typography>
              <Chip
                label={progress.status.toUpperCase()}
                color={getStatusColor(progress.status)}
                size="small"
              />
            </Box>
            {progress.status !== "completed" &&
              progress.status !== "error" &&
              onCancel && (
                <IconButton onClick={onCancel} color="error" size="small">
                  <Stop />
                </IconButton>
              )}
          </Box>

          {/* Barre de progression */}
          <LinearProgress
            variant="determinate"
            value={progress.progress}
            color={progress.status === "error" ? "error" : "primary"}
            sx={{ mb: 2, height: 6, borderRadius: 1 }}
          />

          {/* Étape actuelle */}
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {progress.stage}
          </Typography>

          {/* Temps estimé restant */}
          {progress.estimatedTimeRemaining &&
            progress.status !== "completed" && (
              <Typography variant="caption" color="textSecondary">
                Est. time remaining:{" "}
                {Math.round(progress.estimatedTimeRemaining / 1000)}s
              </Typography>
            )}

          {/* Erreur */}
          {progress.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              <Typography variant="body2">{progress.error}</Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

/**
 * Composant pour les boutons d'actions de transcription
 */
interface TranscriptionActionsProps {
  selectedCalls: string[];
  onTranscribeComplete: (callIds: string[]) => void;
  onTranscribeOnly: (callIds: string[]) => void;
  onDiarizeOnly: (callIds: string[]) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  showEstimates?: boolean;
  estimates?: {
    estimatedCost: number;
    estimatedTimeMinutes: number;
    totalAudioMinutes: number;
  };
}

export const TranscriptionActions: React.FC<TranscriptionActionsProps> = ({
  selectedCalls,
  onTranscribeComplete,
  onTranscribeOnly,
  onDiarizeOnly,
  isProcessing = false,
  disabled = false,
  showEstimates = false,
  estimates,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (selectedCalls.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Select calls to enable transcription actions
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Estimations de coût */}
      {showEstimates && estimates && (
        <Card sx={{ mb: 2, bgcolor: "background.paper" }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="subtitle2">
                Batch Estimate ({selectedCalls.length} calls)
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Audio Duration
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ~{estimates.totalAudioMinutes.toFixed(1)} min
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Estimated Cost
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  ${estimates.estimatedCost.toFixed(4)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Estimated Time
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ~{estimates.estimatedTimeMinutes} min
                </Typography>
              </Box>
            </Stack>

            <Collapse in={showDetails}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="textSecondary">
                <strong>Cost Breakdown:</strong>
                <br />• Whisper (ASR): ~$
                {(estimates.totalAudioMinutes * 0.006).toFixed(4)}
                <br />• AssemblyAI (Diarization): ~$
                {(estimates.totalAudioMinutes * 0.00065).toFixed(4)}
                <br />
                <strong>Time Estimate:</strong> ~40% of audio duration for
                processing
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'actions */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Box
          sx={{
            p: 2,
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            bgcolor: "primary.light",
            opacity: 0.1,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Box display="flex" alignItems="center">
              <Mic fontSize="small" />
              <People fontSize="small" sx={{ ml: 0.5 }} />
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Complete Pipeline
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mb: 2, display: "block" }}
          >
            Transcription + Speaker Separation + Alignment
          </Typography>
          <Box
            component="button"
            onClick={() => onTranscribeComplete(selectedCalls)}
            disabled={isProcessing || disabled}
            sx={{
              width: "100%",
              p: 1.5,
              bgcolor: "primary.main",
              color: "white",
              border: "none",
              borderRadius: 1,
              cursor: isProcessing || disabled ? "not-allowed" : "pointer",
              opacity: isProcessing || disabled ? 0.5 : 1,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {isProcessing ? (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                justifyContent="center"
              >
                <Sync sx={{ animation: "rotate 2s linear infinite" }} />
                Processing...
              </Box>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                justifyContent="center"
              >
                <PlayArrow />
                Transcribe Complete ({selectedCalls.length})
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Mic fontSize="small" />
            <Typography variant="subtitle2">ASR Only</Typography>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mb: 2, display: "block" }}
          >
            Transcription without speaker separation
          </Typography>
          <Box
            component="button"
            onClick={() => onTranscribeOnly(selectedCalls)}
            disabled={isProcessing || disabled}
            sx={{
              width: "100%",
              p: 1.5,
              bgcolor: "secondary.main",
              color: "white",
              border: "none",
              borderRadius: 1,
              cursor: isProcessing || disabled ? "not-allowed" : "pointer",
              opacity: isProcessing || disabled ? 0.5 : 1,
              "&:hover": {
                bgcolor: "secondary.dark",
              },
            }}
          >
            ASR Only ({selectedCalls.length})
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <People fontSize="small" />
            <Typography variant="subtitle2">Diarization Only</Typography>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mb: 2, display: "block" }}
          >
            Add speakers to existing transcription
          </Typography>
          <Box
            component="button"
            onClick={() => onDiarizeOnly(selectedCalls)}
            disabled={isProcessing || disabled}
            sx={{
              width: "100%",
              p: 1.5,
              bgcolor: "info.main",
              color: "white",
              border: "none",
              borderRadius: 1,
              cursor: isProcessing || disabled ? "not-allowed" : "pointer",
              opacity: isProcessing || disabled ? 0.5 : 1,
              "&:hover": {
                bgcolor: "info.dark",
              },
            }}
          >
            Diarize ({selectedCalls.length})
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Helpers pour les icônes et couleurs
 */
function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle color="success" />;
    case "error":
      return <Error color="error" />;
    case "transcribing":
      return <Mic color="primary" />;
    case "diarizing":
      return <People color="primary" />;
    case "aligning":
      return <Sync color="primary" />;
    default:
      return <PlayArrow color="primary" />;
  }
}

function getStatusColor(
  status: string
): "primary" | "secondary" | "error" | "warning" | "info" | "success" {
  switch (status) {
    case "completed":
      return "success";
    case "error":
      return "error";
    case "transcribing":
    case "diarizing":
    case "aligning":
      return "primary";
    default:
      return "info";
  }
}

/**
 * Composant de résultats de transcription
 */
interface TranscriptionResultsProps {
  results: any[]; // TranscriptionJobResult[]
  onViewDetails?: (result: any) => void;
  compact?: boolean;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  results,
  onViewDetails,
  compact = false,
}) => {
  if (results.length === 0) {
    return null;
  }

  const successCount = results.filter((r) => r.success).length;
  const totalCost = results.reduce(
    (sum, r) => sum + (r.metrics?.totalCost || 0),
    0
  );

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Transcription Results</Typography>
          <Chip
            label={`${successCount}/${results.length} successful`}
            color={successCount === results.length ? "success" : "warning"}
            size="small"
          />
        </Box>

        {/* Résumé global */}
        <Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Cost
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                ${totalCost.toFixed(4)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Words
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {results
                  .reduce((sum, r) => sum + (r.metrics?.wordCount || 0), 0)
                  .toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Avg. Processing Time
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {Math.round(
                  results.reduce(
                    (sum, r) => sum + (r.metrics?.processingTime || 0),
                    0
                  ) /
                    results.length /
                    1000
                )}
                s
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Liste des résultats */}
        {!compact && (
          <Stack spacing={1}>
            {results.slice(-10).map((result, index) => (
              <Box
                key={`${result.callId}-${index}`}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: result.success ? "success.main" : "error.main",
                  borderRadius: 1,
                  bgcolor: result.success ? "success.light" : "error.light",
                  opacity: 0.9,
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {result.callId} {result.success ? "✅" : "❌"}
                    </Typography>
                    {result.success ? (
                      <Typography variant="caption" color="textSecondary">
                        {result.metrics.wordCount} words,{" "}
                        {result.metrics.speakerCount} speakers, $
                        {result.metrics.totalCost.toFixed(4)},
                        {Math.round(result.metrics.processingTime / 1000)}s
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="error">
                        Error: {result.error}
                      </Typography>
                    )}
                  </Box>
                  {onViewDetails && (
                    <IconButton
                      onClick={() => onViewDetails(result)}
                      size="small"
                    >
                      <ExpandMore />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};
