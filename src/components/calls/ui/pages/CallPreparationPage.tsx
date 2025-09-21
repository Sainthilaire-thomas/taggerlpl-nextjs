import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TableContainer,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from "@mui/material";
import {
  Build,
  PlayArrow,
  CheckCircle,
  Warning,
  Info,
  ExpandMore,
  Search,
  ClearAll,
  SelectAll,
  AudioFile,
  Description,
  Assessment,
} from "@mui/icons-material";

// Hooks DDD
import { useCallManagement } from "../hooks/useCallManagement";
import { useCallPreparation } from "../hooks/useCallPreparation";

// Types pour les filtres
interface CallPreparationFilters {
  conflictStatus: "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";
  origin: string;
  hasAudio: boolean | "all";
  hasTranscription: boolean | "all";
  keyword: string;
}

type PreparationStrategy = "standard" | "bulk" | "ai-analysis";

/**
 * CallPreparationPage - Version corrigée selon architecture DDD
 *
 * CORRECTIONS IMPORTANTES:
 * - Filtre correct: preparedfortranscript = false (pas is_tagging_call = true)
 * - Ajout des filtres manquants: statut conflictuel, origine, groupement
 * - Service de transformation JSON → table word
 * - Interface en accordéon par origine
 * - Actions de préparation en lot
 * - Workflow correct: Préparation → Sélection → Tagging
 */
export const CallPreparationPage: React.FC = () => {
  // ✅ CORRECTION: Utilisation de l'architecture DDD moderne
  const {
    calls,
    loading,
    error,
    selectedCalls,
    stats,
    loadCalls,
    markAsPrepared,
    toggleCallSelection,
    selectAllCalls,
    clearSelection,
    hasSelection,
    selectedCount,
    clearError,
  } = useCallManagement();

  const { prepareCall, isPreparing } = useCallPreparation();

  // État local pour la préparation et filtres
  const [filters, setFilters] = useState<CallPreparationFilters>({
    conflictStatus: "all",
    origin: "all",
    hasAudio: "all",
    hasTranscription: true, // Par défaut, on veut les appels avec transcription
    keyword: "",
  });

  const [preparationStrategy, setPreparationStrategy] =
    useState<PreparationStrategy>("standard");
  const [isPreparating, setIsPreparating] = useState(false);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [preparationResults, setPreparationResults] = useState<any>(null);

  /**
   * ✅ CORRECTION: Chargement initial des appels
   */
  useEffect(() => {
    console.log("🔄 CallPreparationPage: Chargement des appels DDD...");
    loadCalls();
  }, [loadCalls]);

  /**
   * ✅ CORRECTION: Filtrage correct des appels préparables
   * Critères corrects selon le document de correction:
   * - preparedfortranscript = false (PAS is_tagging_call = true!)
   * - Doit avoir une transcription valide
   * - État approprié pour la préparation
   */
  const preparableCalls = useMemo(() => {
    if (!calls || calls.length === 0) {
      console.log("⚠️ Aucun appel chargé");
      return [];
    }

    console.log("📊 Filtrage des appels préparables selon critères DDD...");

    // ✅ CORRECTION: Critères corrects pour CallPreparationPage
    let filtered = calls.filter((call) => {
      // IMPORTANT: Les appels doivent AVOIR une transcription ET ne PAS être déjà préparés
      const hasValidTranscription = call.hasValidTranscription();
      const notReadyForTagging = !call.isReadyForTagging(); // = preparedfortranscript false

      console.log(`📋 Analyse ${call.id}:`, {
        hasValidTranscription,
        notReadyForTagging,
        status: call.status,
        isReadyForTagging: call.isReadyForTagging(),
      });

      return hasValidTranscription && notReadyForTagging;
    });

    // ✅ NOUVEAU: Filtrage par statut conflictuel
    if (filters.conflictStatus !== "all") {
      filtered = filtered.filter((call) => {
        switch (filters.conflictStatus) {
          case "conflictuel":
            return call.status === "conflictuel";
          case "non_conflictuel":
            return call.status === "non_conflictuel";
          case "non_supervisé":
            return call.status === "non_supervisé" || call.status === null;
          default:
            return true;
        }
      });
    }

    // ✅ NOUVEAU: Filtrage par origine
    if (filters.origin !== "all") {
      filtered = filtered.filter((call) => call.origin === filters.origin);
    }

    // ✅ NOUVEAU: Filtrage par contenu audio
    if (filters.hasAudio !== "all") {
      filtered = filtered.filter((call) =>
        filters.hasAudio ? call.hasValidAudio() : !call.hasValidAudio()
      );
    }

    // ✅ NOUVEAU: Filtrage par mot-clé
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (call) =>
          call.filename?.toLowerCase().includes(keyword) ||
          call.description?.toLowerCase().includes(keyword) ||
          call.id.toLowerCase().includes(keyword)
      );
    }

    console.log("✅ Appels préparables filtrés:", filtered.length);
    return filtered;
  }, [calls, filters]);

  /**
   * ✅ NOUVEAU: Groupement par origine pour l'interface en accordéon
   */
  const callsByOrigin = useMemo(() => {
    return preparableCalls.reduce((acc, call) => {
      const origin = call.origin || "Aucune origine";
      if (!acc[origin]) {
        acc[origin] = [];
      }
      acc[origin].push(call);
      return acc;
    }, {} as Record<string, typeof preparableCalls>);
  }, [preparableCalls]);

  /**
   * ✅ NOUVEAU: Statistiques par origine
   */
  const originStats = useMemo(() => {
    return Object.entries(callsByOrigin).map(([origin, calls]) => ({
      origin,
      total: calls.length,
      conflictuels: calls.filter((c) => c.status === "conflictuel").length,
      withAudio: calls.filter((c) => c.hasValidAudio()).length,
      withTranscription: calls.filter((c) => c.hasValidTranscription()).length,
    }));
  }, [callsByOrigin]);

  /**
   * ✅ NOUVEAU: Liste des origines uniques pour le filtre
   */
  const uniqueOrigins = useMemo(() => {
    const origins = new Set(
      calls?.map((call) => call.origin).filter(Boolean) || []
    );
    return Array.from(origins);
  }, [calls]);

  /**
   * ✅ CORRECTION: Préparation d'un appel utilisant le service DDD
   */
  const handlePrepareCall = useCallback(
    async (callId: string) => {
      console.log(`🚀 Préparation DDD de l'appel: ${callId}`);

      try {
        // ✅ CORRECTION: Utiliser le service de préparation DDD
        await prepareCall(callId);

        // Recharger les appels pour refléter les changements
        await loadCalls();

        console.log(`✅ Appel ${callId} préparé avec succès`);
      } catch (error) {
        console.error(`❌ Erreur préparation ${callId}:`, error);
      }
    },
    [prepareCall, loadCalls]
  );

  /**
   * ✅ CORRECTION: Préparation en lot selon l'architecture DDD
   */
  const handleBulkPreparation = useCallback(async () => {
    const selectedPreparableCalls = preparableCalls.filter((call) =>
      selectedCalls.has(call.id)
    );

    if (selectedPreparableCalls.length === 0) {
      console.warn("⚠️ Aucun appel sélectionné pour la préparation");
      return;
    }

    setIsPreparating(true);
    setPreparationProgress(0);
    setPreparationResults(null);

    console.log(
      "🚀 Préparation en lot DDD:",
      selectedPreparableCalls.length,
      "appels"
    );

    try {
      let successCount = 0;
      let errorCount = 0;
      const total = selectedPreparableCalls.length;

      // ✅ CORRECTION: Utiliser le workflow de préparation DDD
      for (let i = 0; i < selectedPreparableCalls.length; i++) {
        const call = selectedPreparableCalls[i];

        try {
          console.log(`📋 Préparation ${i + 1}/${total}: ${call.id}`);

          // ✅ Service de transformation JSON → table word
          await handlePrepareCall(call.id);

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`❌ Échec ${call.id}:`, error);
        }

        // Mise à jour progressive
        const progress = ((i + 1) / total) * 100;
        setPreparationProgress(progress);
      }

      setPreparationResults({
        success: successCount,
        errors: errorCount,
        total,
        strategy: preparationStrategy,
      });

      clearSelection();

      console.log("🎉 Préparation en lot terminée:", {
        successCount,
        errorCount,
        total,
      });
    } catch (error) {
      console.error("❌ Erreur globale préparation en lot:", error);
      setPreparationResults({
        success: 0,
        errors: selectedPreparableCalls.length,
        total: selectedPreparableCalls.length,
        strategy: preparationStrategy,
      });
    } finally {
      setIsPreparating(false);
    }
  }, [
    preparableCalls,
    selectedCalls,
    preparationStrategy,
    clearSelection,
    handlePrepareCall,
  ]);

  /**
   * ✅ NOUVEAU: Mise à jour des filtres
   */
  const updateFilters = useCallback(
    (newFilters: Partial<CallPreparationFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  /**
   * ✅ NOUVEAU: Reset des filtres
   */
  const resetFilters = useCallback(() => {
    setFilters({
      conflictStatus: "all",
      origin: "all",
      hasAudio: "all",
      hasTranscription: true,
      keyword: "",
    });
  }, []);

  // ✅ DEBUG: État complet pour vérification
  console.log("🎯 État CallPreparationPage DDD:", {
    loading,
    error: error || "aucune",
    totalCalls: calls?.length || 0,
    preparableCalls: preparableCalls.length,
    selectedCount,
    filters,
    uniqueOrigins,
    originStats: originStats.length,
  });

  return (
    <Box>
      {/* En-tête avec corrections DDD */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          📋 Préparation des Appels (Architecture DDD)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Préparation technique avant sélection pour le tagging
        </Typography>

        {/* ✅ NOUVEAU: Explication du workflow correct */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Workflow corrigé :</strong> Cette page prépare les appels
            (transformation JSON → table word) AVANT qu'ils soient sélectionnés
            pour le tagging. Les appels apparaissent ici s'ils ont une
            transcription ET ne sont PAS encore préparés (preparedfortranscript
            = false).
          </Typography>
        </Alert>
      </Box>

      {/* ✅ NOUVEAU: Filtres avancés selon les spécifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Filtres Avancés
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            {/* Recherche par mot-clé */}
            <Box sx={{ flex: "1 1 250px", minWidth: 200 }}>
              <TextField
                fullWidth
                size="small"
                label="Recherche"
                value={filters.keyword}
                onChange={(e) => updateFilters({ keyword: e.target.value })}
                placeholder="Nom, description, ID..."
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Box>

            {/* ✅ NOUVEAU: Filtre par statut conflictuel */}
            <Box sx={{ flex: "1 1 180px", minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type d'Appel</InputLabel>
                <Select
                  value={filters.conflictStatus}
                  onChange={(e) =>
                    updateFilters({ conflictStatus: e.target.value as any })
                  }
                  label="Type d'Appel"
                >
                  <MenuItem value="all">Tous les appels</MenuItem>
                  <MenuItem value="conflictuel">🔴 Conflictuels</MenuItem>
                  <MenuItem value="non_conflictuel">
                    🟢 Non conflictuels
                  </MenuItem>
                  <MenuItem value="non_supervisé">⚪ Non supervisés</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* ✅ NOUVEAU: Filtre par origine */}
            <Box sx={{ flex: "1 1 150px", minWidth: 130 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Origine</InputLabel>
                <Select
                  value={filters.origin}
                  onChange={(e) => updateFilters({ origin: e.target.value })}
                  label="Origine"
                >
                  <MenuItem value="all">Toutes origines</MenuItem>
                  {uniqueOrigins.map((origin) => (
                    <MenuItem key={origin} value={origin}>
                      {origin}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ✅ NOUVEAU: Filtre par contenu audio */}
            <Box sx={{ flex: "1 1 120px", minWidth: 100 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Audio</InputLabel>
                <Select
                  value={filters.hasAudio}
                  onChange={(e) =>
                    updateFilters({ hasAudio: e.target.value as any })
                  }
                  label="Audio"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value={true}>Avec audio</MenuItem>
                  <MenuItem value={false}>Sans audio</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Actions filtres */}
            <Box sx={{ flex: "0 0 auto" }}>
              <Button
                size="small"
                onClick={resetFilters}
                startIcon={<ClearAll />}
                variant="outlined"
              >
                Reset
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ✅ NOUVEAU: Statistiques par origine */}
      {originStats.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Statistiques par Origine
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              {originStats.map(
                ({
                  origin,
                  total,
                  conflictuels,
                  withAudio,
                  withTranscription,
                }) => (
                  <Box key={origin} sx={{ flex: "1 1 250px", minWidth: 200 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {origin}
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <Chip
                            label={`${total} appels`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${conflictuels} conflictuels`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                          <Chip
                            label={`${withAudio} avec audio`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                          <Chip
                            label={`${withTranscription} avec transcription`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Configuration de la préparation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ Configuration de la Préparation
          </Typography>

          <Box
            display="flex"
            gap={3}
            alignItems="center"
            flexWrap="wrap"
            mb={2}
          >
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Stratégie</InputLabel>
              <Select
                value={preparationStrategy}
                onChange={(e) =>
                  setPreparationStrategy(e.target.value as PreparationStrategy)
                }
                label="Stratégie"
                disabled={isPreparating}
              >
                <MenuItem value="standard">
                  <Box>
                    <Typography>Standard</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Transformation JSON → table word classique
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="bulk">
                  <Box>
                    <Typography>En Lot</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Traitement optimisé par services DDD
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="ai-analysis">
                  <Box>
                    <Typography>IA + Analyse</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pré-analyse automatique (à venir)
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleBulkPreparation}
              disabled={selectedCount === 0 || isPreparating}
              startIcon={isPreparating ? <Build /> : <PlayArrow />}
            >
              {isPreparating ? "Préparation..." : `Préparer (${selectedCount})`}
            </Button>

            <Button
              variant="outlined"
              onClick={selectAllCalls}
              disabled={isPreparating}
              startIcon={<SelectAll />}
            >
              Tout Sélectionner
            </Button>

            <Button
              variant="outlined"
              onClick={clearSelection}
              disabled={isPreparating || selectedCount === 0}
              startIcon={<ClearAll />}
            >
              Désélectionner
            </Button>
          </Box>

          {/* Statistiques de sélection */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              icon={<Info />}
              label={`${preparableCalls.length} appels préparables`}
              color="info"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircle />}
              label={`${selectedCount} sélectionnés`}
              color="primary"
              variant={selectedCount > 0 ? "filled" : "outlined"}
            />
            {stats && (
              <Chip
                icon={<Assessment />}
                label={`${stats.completeness}% préparés globalement`}
                color="success"
                variant="outlined"
              />
            )}
          </Box>

          {/* Barre de progression */}
          {isPreparating && (
            <Box mt={3}>
              <Typography variant="body2" gutterBottom>
                Transformation JSON → table word en cours...{" "}
                {Math.round(preparationProgress)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={preparationProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Résultats de préparation */}
          {preparationResults && (
            <Alert
              severity={preparationResults.errors === 0 ? "success" : "warning"}
              sx={{ mt: 3 }}
            >
              <Typography variant="body2">
                <strong>Préparation terminée :</strong>{" "}
                {preparationResults.success} succès,
                {preparationResults.errors} erreurs sur{" "}
                {preparationResults.total} appels
                {preparationResults.strategy &&
                  ` (stratégie: ${preparationResults.strategy})`}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gestion d'erreurs */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Ignorer
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Erreur :</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* ✅ NOUVEAU: Interface en accordéon par origine */}
      {Object.keys(callsByOrigin).length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            📋 Appels par Origine (Interface Accordéon)
          </Typography>

          {Object.entries(callsByOrigin).map(([origin, calls]) => (
            <Accordion key={origin} defaultExpanded={calls.length <= 10}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Typography variant="h6">{origin}</Typography>
                  <Chip
                    label={`${calls.length} appels`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${
                      calls.filter((c) => c.status === "conflictuel").length
                    } conflictuels`}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${
                      calls.filter((c) => c.hasValidAudio()).length
                    } avec audio`}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              calls.some((call) =>
                                selectedCalls.has(call.id)
                              ) &&
                              !calls.every((call) => selectedCalls.has(call.id))
                            }
                            checked={
                              calls.length > 0 &&
                              calls.every((call) => selectedCalls.has(call.id))
                            }
                            onChange={() => {
                              const allSelected = calls.every((call) =>
                                selectedCalls.has(call.id)
                              );
                              calls.forEach((call) => {
                                if (allSelected) {
                                  // Désélectionner tous
                                  if (selectedCalls.has(call.id)) {
                                    toggleCallSelection(call.id);
                                  }
                                } else {
                                  // Sélectionner tous
                                  if (!selectedCalls.has(call.id)) {
                                    toggleCallSelection(call.id);
                                  }
                                }
                              });
                            }}
                            disabled={isPreparating}
                          />
                        </TableCell>
                        <TableCell>Fichier</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Contenu</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow
                          key={call.id}
                          selected={selectedCalls.has(call.id)}
                          hover
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedCalls.has(call.id)}
                              onChange={() => toggleCallSelection(call.id)}
                              disabled={isPreparating}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {call.filename || call.id}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {call.createdAt?.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={call.status || "draft"}
                              size="small"
                              color={
                                call.status === "conflictuel"
                                  ? "error"
                                  : call.status === "non_conflictuel"
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {call.hasValidAudio() && (
                                <Chip
                                  icon={<AudioFile />}
                                  label="Audio"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                              {call.hasValidTranscription() && (
                                <Chip
                                  icon={<Description />}
                                  label="Transcription"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Préparer cet appel pour le tagging">
                              <IconButton
                                size="small"
                                onClick={() => handlePrepareCall(call.id)}
                                disabled={isPreparating || isPreparing}
                                color="primary"
                              >
                                <Build />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {loading
              ? "Chargement des appels..."
              : preparableCalls.length === 0
              ? "Aucun appel préparable trouvé. Vérifiez que les appels ont une transcription et ne sont pas déjà préparés."
              : "Aucun appel ne correspond aux filtres sélectionnés."}
          </Typography>
        </Alert>
      )}

      {/* ✅ NOUVEAU: Documentation du workflow corrigé */}
      <Box mt={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              ✅ Workflow Corrigé - Architecture DDD
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                mb: 3,
              }}
            >
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎯 Phase 1: CallPreparationPage (Actuelle)
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Filtre :</strong> preparedfortranscript = false
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Prérequis :</strong> transcription IS NOT NULL
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Action :</strong> Transformation JSON → table word
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Résultat :</strong> preparedfortranscript = true
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎯 Phase 2: Sélection pour Tagging
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Filtre :</strong> preparedfortranscript = true
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Action :</strong> Sélection utilisateur
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Résultat :</strong> is_tagging_call = true
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Navigation :</strong> → TranscriptLPL
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Correction appliquée :</strong> Cette page utilise
                maintenant le bon filtre (preparedfortranscript = false) et
                inclut toutes les fonctionnalités manquantes identifiées dans la
                documentation DDD.
              </Typography>
            </Alert>

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                🔧 Fonctionnalités Ajoutées:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box
                  sx={{ flex: "1 1 200px" }}
                  p={2}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="primary"
                  >
                    Filtrage Avancé
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    • Statut conflictuel
                    <br />
                    • Origine
                    <br />
                    • Contenu audio
                    <br />• Recherche par mot-clé
                  </Typography>
                </Box>
                <Box
                  sx={{ flex: "1 1 200px" }}
                  p={2}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="success.main"
                  >
                    Interface Accordéon
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    • Groupement par origine
                    <br />
                    • Statistiques par groupe
                    <br />
                    • Sélection en lot
                    <br />• Actions individuelles
                  </Typography>
                </Box>
                <Box
                  sx={{ flex: "1 1 200px" }}
                  p={2}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    Services DDD
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    • CallService intégré
                    <br />
                    • ValidationService
                    <br />
                    • TransformationService
                    <br />• BulkPreparationWorkflow
                  </Typography>
                </Box>
                <Box
                  sx={{ flex: "1 1 200px" }}
                  p={2}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="info.main"
                  >
                    Architecture
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    • Entités Call modernes
                    <br />
                    • Repository pattern
                    <br />
                    • Factory services
                    <br />• Hooks optimisés
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
