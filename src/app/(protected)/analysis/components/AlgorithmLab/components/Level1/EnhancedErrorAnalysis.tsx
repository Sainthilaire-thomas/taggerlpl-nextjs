// components/Level1/EnhancedErrorAnalysis.tsx
import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Edit,
  TrendingUp,
  TrendingDown,
  Remove,
  AudioFile,
  Assignment,
  Warning,
} from "@mui/icons-material";
import { AlgorithmResult } from "../../types/Level1Types";
import { useTaggingData } from "@/context/TaggingDataContext";
import { supabase } from "@/lib/supabaseClient";
import { generateSignedUrl } from "@/components/utils/signedUrls";
import {
  TaggingModal,
  ProcessingModal,
} from "@/app/(protected)/supervision/components";
import type { SupervisionTurnTagged } from "@/app/(protected)/supervision/types";

interface EnhancedErrorAnalysisProps {
  results: AlgorithmResult[];
  algorithmName: string;
}

// Interface étendue pour inclure les données contextuelles
interface EnhancedAlgorithmResult extends AlgorithmResult {
  filename?: string;
  next_turn_verbatim?: string;
  next_turn_tag?: string;
  hasAudio?: boolean;
  hasTranscript?: boolean;
}

// Fonction utilitaire pour le formatage du temps
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

// Composant pour afficher les tags avec flèche
const TagChain: React.FC<{
  mainTag: string;
  mainColor?: string;
  nextTag?: string;
  nextColor?: string;
  predicted?: string;
  goldStandard?: string;
}> = ({
  mainTag,
  mainColor = "#1976d2",
  nextTag,
  nextColor = "#9e9e9e",
  predicted,
  goldStandard,
}) => {
  const isCorrect = predicted === goldStandard;

  return (
    <Stack spacing={0.5} direction="column" alignItems="flex-start">
      <Chip
        label={mainTag}
        size="small"
        sx={{
          backgroundColor: mainColor,
          color: "white",
          fontWeight: "bold",
          fontSize: "0.75rem",
          height: 24,
          border: predicted && !isCorrect ? "2px solid #f44336" : "none",
        }}
      />
      {nextTag && (
        <Chip
          label={`→ ${nextTag}`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: nextColor,
            color: nextColor,
            fontSize: "0.7rem",
            height: 20,
            backgroundColor: `${nextColor}08`,
          }}
        />
      )}
    </Stack>
  );
};

// Composant pour afficher les verbatims avec contexte
const VerbatimDisplay: React.FC<{
  verbatim: string;
  nextVerbatim?: string;
  speaker: string;
  isPredicted: boolean;
  confidence: number;
}> = ({ verbatim, nextVerbatim, speaker, isPredicted, confidence }) => {
  const theme = useTheme();
  const borderColor = isPredicted
    ? confidence > 0.7
      ? theme.palette.success.main
      : theme.palette.warning.main
    : theme.palette.error.main;

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          borderLeft: `4px solid ${borderColor}`,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.875rem",
            lineHeight: 1.3,
            fontWeight: isPredicted ? "bold" : "normal",
          }}
        >
          <strong>[{speaker}]</strong> {verbatim}
        </Typography>
      </Box>

      {nextVerbatim && (
        <Box
          sx={{
            p: 1,
            borderRadius: 1,
            backgroundColor: theme.palette.grey[50],
            borderLeft: `2px solid ${theme.palette.grey[300]}`,
            ml: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.8rem",
              lineHeight: 1.2,
              fontStyle: "italic",
              color: theme.palette.text.secondary,
            }}
          >
            <strong>[Tour suivant]</strong> {nextVerbatim}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

// Composant pour afficher le statut des ressources (inspiré de supervision)
const StatusDisplay: React.FC<{
  hasAudio: boolean;
  hasTranscript: boolean;
}> = ({ hasAudio, hasTranscript }) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {hasAudio && (
          <Tooltip title="Audio disponible">
            <AudioFile fontSize="small" color="success" />
          </Tooltip>
        )}
        {hasTranscript && (
          <Tooltip title="Transcription disponible">
            <Assignment fontSize="small" color="success" />
          </Tooltip>
        )}
      </Box>
      {(!hasAudio || !hasTranscript) && (
        <Tooltip
          title={`Manque: ${!hasAudio ? "audio" : ""} ${
            !hasAudio && !hasTranscript ? "et " : ""
          }${!hasTranscript ? "transcription" : ""}`}
        >
          <Warning fontSize="small" color="warning" />
        </Tooltip>
      )}
    </Box>
  );
};
const ConfidenceScore: React.FC<{
  confidence: number;
  isCorrect: boolean;
}> = ({ confidence, isCorrect }) => {
  const getIcon = () => {
    if (isCorrect && confidence > 0.8) return <TrendingUp color="success" />;
    if (!isCorrect && confidence > 0.8) return <TrendingDown color="error" />;
    return <Remove color="warning" />;
  };

  const getColor = () => {
    if (confidence > 0.8) return isCorrect ? "success" : "error";
    if (confidence > 0.5) return "warning";
    return "default";
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {getIcon()}
      <Typography
        variant="body2"
        sx={{
          fontWeight: "bold",
          color:
            getColor() !== "default" ? `${getColor()}.main` : "text.primary",
        }}
      >
        {(confidence * 100).toFixed(1)}%
      </Typography>
    </Box>
  );
};

// Composant principal
export const EnhancedErrorAnalysis: React.FC<EnhancedErrorAnalysisProps> = ({
  results,
  algorithmName,
}) => {
  // États pour les modals supervision
  const [selectedError, setSelectedError] =
    useState<SupervisionTurnTagged | null>(null);
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [taggingAudioUrl, setTaggingAudioUrl] = useState<string>("");

  const [enhancedResults, setEnhancedResults] = useState<
    EnhancedAlgorithmResult[]
  >([]);

  // Context du tagging
  const { selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns } =
    useTaggingData();

  // Enrichir les résultats avec les données contextuelles ET le statut
  React.useEffect(() => {
    const loadContextualData = async () => {
      const errors = results.filter((r) => !r.correct).slice(0, 100);
      const enhanced: EnhancedAlgorithmResult[] = [];

      for (const error of errors) {
        try {
          // Récupérer les données contextuelles de l'appel avec statut des ressources
          const { data: callData } = await supabase
            .from("call")
            .select("filename, filepath, audiourl")
            .eq("callid", error.callId)
            .single();

          // Vérifier si transcription existe
          const { data: transcriptData } = await supabase
            .from("transcript")
            .select("transcriptid")
            .eq("callid", error.callId)
            .single();

          // Récupérer le contexte du tour si algorithme client
          let contextData = null;
          if (algorithmName === "client_classification") {
            const { data: turnData } = await supabase
              .from("turntagged")
              .select("next_turn_verbatim, next_turn_tag")
              .eq("call_id", error.callId)
              .eq("start_time", error.startTime)
              .single();
            contextData = turnData;
          }

          enhanced.push({
            ...error,
            filename: callData?.filename || undefined,
            next_turn_verbatim: contextData?.next_turn_verbatim || undefined,
            next_turn_tag: contextData?.next_turn_tag || undefined,
            // Ajout du statut des ressources
            hasAudio: !!(callData?.filepath || callData?.audiourl),
            hasTranscript: !!transcriptData?.transcriptid,
          });
        } catch (err) {
          enhanced.push({
            ...error,
            hasAudio: false,
            hasTranscript: false,
          } as EnhancedAlgorithmResult);
        }
      }

      setEnhancedResults(enhanced);
    };

    if (results.length > 0) {
      loadContextualData();
    }
  }, [results, algorithmName]);

  // Gestionnaire de clic - utilise les composants supervision
  const handleRowClick = useCallback(
    async (error: EnhancedAlgorithmResult) => {
      try {
        // Récupérer directement le turn depuis turntagged avec jointures
        const { data: turnData, error: turnError } = await supabase
          .from("turntagged")
          .select(
            `
          *,
          lpltag:tag (color),
          call:call_id (filename, filepath, audiourl)
        `
          )
          .eq("call_id", error.callId)
          .eq("id", error.turnId)
          .single();

        if (turnError || !turnData) {
          throw new Error("Turn non trouvé dans la base de données");
        }

        // Construire l'objet supervision
        const supervisionRow: SupervisionTurnTagged = {
          ...turnData,
          color: turnData.lpltag?.color || "#1976d2",
          filename: turnData.call?.filename || "",
          hasAudio: !!(turnData.call?.filepath || turnData.call?.audiourl),
          hasTranscript: true, // Si on a le turn, on a la transcription
        };

        console.log("Données récupérées pour supervision:", supervisionRow);

        // Vérifier les ressources et ouvrir le bon modal
        if (supervisionRow.hasAudio && supervisionRow.hasTranscript) {
          // Ouvrir l'éditeur de tagging
          setSelectedError(supervisionRow);
          setIsTaggingModalOpen(true);

          // Charger l'audio comme supervision
          if (turnData.call?.filepath) {
            const audioUrl = await generateSignedUrl(turnData.call.filepath);
            setTaggingAudioUrl(audioUrl);

            // Préparer l'appel pour le tagging
            selectTaggingCall({
              callid: error.callId,
              audiourl: audioUrl,
              filename: turnData.call?.filename || "",
              is_tagging_call: true,
              preparedfortranscript: true,
            });

            // Charger transcription et tags
            await Promise.all([
              fetchTaggingTranscription(error.callId),
              fetchTaggedTurns(error.callId),
            ]);

            console.log(`Appel ${error.callId} préparé pour le tagging`);
          } else if (turnData.call?.audiourl) {
            setTaggingAudioUrl(turnData.call.audiourl);
          }
        } else {
          // Ouvrir le modal de traitement
          setSelectedError(supervisionRow);
          setIsProcessingModalOpen(true);
        }
      } catch (error) {
        console.error("Erreur lors de la préparation:", error);
        alert(
          `Erreur: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      }
    },
    [selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns]
  );

  // Fermeture des modals
  const closeTaggingModal = useCallback(() => {
    setIsTaggingModalOpen(false);
    setSelectedError(null);
    setTaggingAudioUrl("");
  }, []);

  const closeProcessingModal = useCallback(() => {
    setIsProcessingModalOpen(false);
    setSelectedError(null);
  }, []);

  const handleProcessingComplete = useCallback(() => {
    console.log("Traitement terminé avec succès");
    // Optionnel: recharger les données d'erreurs
  }, []);

  if (enhancedResults.length === 0) {
    return (
      <Alert severity="success" sx={{ mt: 3 }}>
        Aucune erreur de classification détectée - Performance parfaite!
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Analyse des Erreurs de Classification ({enhancedResults.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cliquez sur une ligne pour analyser l'erreur dans son contexte
            complet
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Tags</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Call ID</TableCell>
                  <TableCell sx={{ minWidth: 350 }}>Tours de Parole</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Temps</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Statut</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Prédit</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Réel</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Confiance</TableCell>
                  <TableCell sx={{ minWidth: 60 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enhancedResults.map((error, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                    onClick={() => handleRowClick(error)}
                  >
                    {/* Colonne Tags */}
                    <TableCell>
                      <TagChain
                        mainTag={error.goldStandard}
                        nextTag={error.next_turn_tag}
                        predicted={error.predicted}
                        goldStandard={error.goldStandard}
                      />
                    </TableCell>

                    {/* Colonne Call ID */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {error.callId}
                      </Typography>
                      {error.filename && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {error.filename.length > 20
                            ? error.filename.substring(0, 20) + "..."
                            : error.filename}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Colonne Tours de Parole */}
                    <TableCell>
                      <VerbatimDisplay
                        verbatim={error.input}
                        nextVerbatim={error.next_turn_verbatim}
                        speaker={error.speaker}
                        isPredicted={true}
                        confidence={error.confidence}
                      />
                    </TableCell>

                    {/* Colonne Temps */}
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {formatTime(error.startTime)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {formatTime(error.endTime)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        display="block"
                      >
                        {Math.round(error.endTime - error.startTime)}s
                      </Typography>
                    </TableCell>

                    {/* Colonne Statut */}
                    <TableCell>
                      <StatusDisplay
                        hasAudio={error.hasAudio || false}
                        hasTranscript={error.hasTranscript || false}
                      />
                    </TableCell>

                    {/* Colonne Prédit */}
                    <TableCell>
                      <Chip
                        label={error.predicted}
                        size="small"
                        color="error"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    {/* Colonne Réel */}
                    <TableCell>
                      <Chip
                        label={error.goldStandard}
                        size="small"
                        color="success"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    {/* Colonne Confiance */}
                    <TableCell>
                      <ConfidenceScore
                        confidence={error.confidence}
                        isCorrect={false}
                      />
                    </TableCell>

                    {/* Colonne Action */}
                    <TableCell>
                      <Tooltip title="Analyser dans le contexte complet">
                        <IconButton size="small" color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modals supervision réutilisés */}
      <TaggingModal
        open={isTaggingModalOpen}
        onClose={closeTaggingModal}
        selectedRow={selectedError}
        audioUrl={taggingAudioUrl}
      />

      <ProcessingModal
        open={isProcessingModalOpen}
        onClose={closeProcessingModal}
        selectedRow={selectedError}
        onProcessingComplete={handleProcessingComplete}
      />
    </Box>
  );
};
