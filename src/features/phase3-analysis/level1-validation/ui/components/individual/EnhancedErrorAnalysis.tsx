// components/Level1/EnhancedErrorAnalysis.tsx - Version corrigée
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
  CircularProgress,
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
import { BaseAlgorithmResult } from "@/types/algorithm-lab";
import { useTaggingData } from "@/context/TaggingDataContext";
import { supabase } from "@/lib/supabaseClient";
import { generateSignedUrl } from "@/components/utils/signedUrls";
import {
  TaggingModal,
  ProcessingModal,
} from "@/app/(protected)/supervision/components";
import type { SupervisionTurnTagged } from "@/app/(protected)/supervision/types";
import type {
  AlgorithmResult,
  EnhancedAlgorithmResult,
} from "@/types/algorithm-lab";
import { normalizeAlgorithmResult } from "@/types/algorithm-lab";
interface EnhancedErrorAnalysisProps {
  results: AlgorithmResult[];
  algorithmName: string;
  classifierType?: string; // AJOUTER
  classifierMetadata?: any; // AJOUTER
}

interface EnhancedErrorAnalysisProps {
  results: AlgorithmResult[];
  algorithmName: string;
  classifierType?: string;
  classifierMetadata?: any;
}

// Fonction utilitaire pour le formatage du temps
const formatTime = (seconds?: number): string => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "--:--.--";
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

// Composant pour afficher le statut des ressources
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
  const [isLoading, setIsLoading] = useState(false);

  const [enhancedResults, setEnhancedResults] = useState<
    EnhancedAlgorithmResult[]
  >([]);

  // Context du tagging
  const { selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns } =
    useTaggingData();

  // ✅ CORRECTION PRINCIPALE : Requêtes Supabase optimisées et sécurisées
  React.useEffect(() => {
    const loadContextualData = async () => {
      if (results.length === 0) return;

      setIsLoading(true);
      const errors = results.filter((r) => !r.correct).slice(0, 20);
      const enhanced: EnhancedAlgorithmResult[] = [];

      // Regrouper les requêtes par call_id pour éviter les doublons
      const uniqueCallIds = [...new Set(errors.map((e) => e.callId))];

      try {
        // ✅ Requête groupée pour les données d'appels
        const { data: callsData, error: callsError } = await supabase
          .from("call")
          .select("callid, filename, filepath, audiourl")
          .in("callid", uniqueCallIds);

        if (callsError) {
          console.error(
            "Erreur lors de la récupération des appels:",
            callsError
          );
        }

        // ✅ Requête groupée pour les transcriptions
        const { data: transcriptsData, error: transcriptsError } =
          await supabase
            .from("transcript")
            .select("callid, transcriptid")
            .in("callid", uniqueCallIds);

        if (transcriptsError) {
          console.error(
            "Erreur lors de la récupération des transcriptions:",
            transcriptsError
          );
        }

        // ✅ Requête groupée pour les tours taggés (contexte client)
        let turnsData = null;
        if (algorithmName === "client_classification") {
          const turnsQuery = errors.map((e) => ({
            call_id: e.callId,
            start_time: e.startTime,
          }));

          // Construction d'une requête OR pour tous les tours
          const orConditions = turnsQuery
            .map(
              (t) =>
                `(call_id.eq.${t.call_id}.and.start_time.eq.${t.start_time})`
            )
            .join(",");

          const { data: turns, error: turnsError } = await supabase
            .from("turntagged")
            .select("call_id, start_time, next_turn_verbatim, next_turn_tag")
            .or(orConditions);

          if (turnsError) {
            console.error(
              "Erreur lors de la récupération des tours:",
              turnsError
            );
          } else {
            turnsData = turns;
          }
        }

        // Créer des maps pour un accès rapide
        const callsMap = new Map((callsData || []).map((c) => [c.callid, c]));
        const transcriptsMap = new Set(
          (transcriptsData || []).map((t) => t.callid)
        );
        const turnsMap = new Map(
          (turnsData || []).map((t) => [`${t.call_id}_${t.start_time}`, t])
        );

        // ✅ Construire les résultats enrichis
        for (const error of errors) {
          const callData = callsMap.get(error.callId);
          const hasTranscript = transcriptsMap.has(error.callId);
          const turnKey = `${error.callId}_${error.startTime}`;
          const turnContext = turnsMap.get(turnKey);

          enhanced.push({
            ...error,
            filename: callData?.filename || undefined,
            next_turn_verbatim: turnContext?.next_turn_verbatim || undefined,
            next_turn_tag: turnContext?.next_turn_tag || undefined,
            hasAudio: !!(callData?.filepath || callData?.audiourl),
            hasTranscript: hasTranscript,
          });
        }

        setEnhancedResults(enhanced);
        console.log(`✅ ${enhanced.length} erreurs enrichies avec succès`);
      } catch (err) {
        console.error("Erreur lors de l'enrichissement des données:", err);
        // En cas d'erreur, utiliser les données de base
        setEnhancedResults(
          errors.map((e) => ({
            ...e,
            hasAudio: false,
            hasTranscript: false,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadContextualData();
  }, [results, algorithmName]);

  // ✅ CORRECTION : Gestionnaire de clic optimisé avec gestion d'erreurs
  const handleRowClick = useCallback(
    async (error: EnhancedAlgorithmResult): Promise<void> => {
      setIsLoading(true);
      try {
        // Garde-fous stricts pour satisfaire TS et éviter les surprises runtime
        if (error.callId === undefined || error.startTime === undefined) {
          alert("Données incomplètes (callId ou startTime manquant).");
          return;
        }

        const start = Number(error.startTime);
        if (Number.isNaN(start)) {
          alert("Timestamp startTime invalide.");
          return;
        }

        // ✅ Requête sécurisée avec vérification d'existence
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
          .gte("start_time", start - 0.1) // Tolérance pour les timestamps
          .lte("start_time", start + 0.1)
          .limit(1)
          .single();

        if (turnError) {
          console.error("Erreur lors de la récupération du turn:", turnError);

          // ✅ Fallback : essayer avec une requête moins stricte
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("turntagged")
            .select(
              `
            *,
            lpltag:tag (color)
          `
            )
            .eq("call_id", error.callId)
            .gte("start_time", start - 1)
            .lte("start_time", start + 1)
            .limit(1)
            .maybeSingle();

          if (fallbackError || !fallbackData) {
            throw new Error(
              `Turn non trouvé pour call_id: ${String(
                error.callId
              )}, start_time: ${String(error.startTime)}`
            );
          }

          // Utiliser les données de fallback
          const { data: callFallback } = await supabase
            .from("call")
            .select("filename, filepath, audiourl")
            .eq("callid", error.callId)
            .single();

          const supervisionRow: SupervisionTurnTagged = {
            ...fallbackData,
            color: fallbackData.lpltag?.color || "#1976d2",
            filename: callFallback?.filename || `call_${String(error.callId)}`,
            hasAudio: !!(callFallback?.filepath || callFallback?.audiourl),
            hasTranscript: true,
          };

          setSelectedError(supervisionRow);
          setIsProcessingModalOpen(true);
          return;
        }

        // Construction de l'objet supervision
        const supervisionRow: SupervisionTurnTagged = {
          ...turnData,
          color: turnData.lpltag?.color || "#1976d2",
          filename: turnData.call?.filename || `call_${String(error.callId)}`,
          hasAudio: !!(turnData.call?.filepath || turnData.call?.audiourl),
          hasTranscript: true,
        };

        console.log("✅ Données récupérées pour supervision:", supervisionRow);

        // Ouvrir le bon modal selon les ressources disponibles
        if (supervisionRow.hasAudio && supervisionRow.hasTranscript) {
          setSelectedError(supervisionRow);
          setIsTaggingModalOpen(true);

          // Charger l'audio
          if (turnData.call?.filepath) {
            try {
              const audioUrl = await generateSignedUrl(turnData.call.filepath);
              setTaggingAudioUrl(audioUrl);
            } catch (audioError) {
              console.error("Erreur génération URL audio:", audioError);
              setTaggingAudioUrl(turnData.call?.audiourl || "");
            }
          } else {
            setTaggingAudioUrl(turnData.call?.audiourl || "");
          }

          // Préparer pour le tagging (APIs qui attendent des strings)
          try {
            selectTaggingCall({
              callid: String(error.callId),
              audiourl: turnData.call?.audiourl || "",
              filename: turnData.call?.filename || "",
              is_tagging_call: true,
              preparedfortranscript: true,
            });

            await Promise.all([
              fetchTaggingTranscription(String(error.callId)),
              fetchTaggedTurns(String(error.callId)),
            ]);
          } catch (taggingError) {
            console.error("Erreur préparation tagging:", taggingError);
          }
        } else {
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
      } finally {
        setIsLoading(false);
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
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ mt: 3, textAlign: "center", p: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Chargement de l'analyse des erreurs...
        </Typography>
      </Box>
    );
  }

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
                    key={`${error.callId}_${error.startTime}_${idx}`}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                    onClick={() => handleRowClick(error)}
                  >
                    <TableCell>
                      <TagChain
                        mainTag={error.goldStandard ?? ""} // 👈 repli string
                        nextTag={error.next_turn_tag ?? undefined}
                        predicted={error.predicted ?? undefined}
                        goldStandard={error.goldStandard ?? undefined}
                      />
                    </TableCell>

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

                    <TableCell>
                      <VerbatimDisplay
                        verbatim={error.input ?? error.verbatim ?? ""} // 👈 repli string
                        nextVerbatim={error.next_turn_verbatim ?? undefined}
                        speaker={error.speaker ?? ""} // 👈 repli string
                        isPredicted={true}
                        confidence={error.confidence ?? 0} // 👈 repli number
                      />
                    </TableCell>

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
                        {typeof error.endTime === "number" &&
                        typeof error.startTime === "number"
                          ? `${Math.round(error.endTime - error.startTime)}s`
                          : "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StatusDisplay
                        hasAudio={error.hasAudio || false}
                        hasTranscript={error.hasTranscript || false}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={error.predicted}
                        size="small"
                        color="error"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={error.goldStandard}
                        size="small"
                        color="success"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    <TableCell>
                      <ConfidenceScore
                        confidence={error.confidence ?? 0}
                        isCorrect={false}
                      />
                    </TableCell>

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
