// src/components/calls/ui/pages/CallManagementPage.tsx - VERSION FINALE OPTIMISÉE

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
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
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Skeleton,
  Collapse,
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
  Upload,
  Download,
  CleaningServices,
  Delete,
  Visibility,
  Edit,
  Flag,
  Refresh,
  ExpandLess,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

// Hook unifié optimisé
import { useUnifiedCallManagement } from "../hooks/useUnifiedCallManagement";
import { DebugCallLoading } from "../components/DebugCallLoading";

// Services
import { useRelationsNextTurn } from "../hooks/useRelationsNextTurn";
import { CallRelationsService } from "../../domain/services/CallRelationsService";
import { SupabaseRelationsRepository } from "../../infrastructure/supabase/SupabaseRelationsRepository";

// Actions spécialisées
import { useCallTranscriptionActions } from "../hooks/actions/useCallTranscriptionActions";
import { useCallAudioActions } from "../hooks/actions/useCallAudioActions";
import { useCallPreparationActions } from "../hooks/actions/useCallPreparationActions";
import { useCallFlags } from "../hooks/actions/useCallFlags";
import { useCallCleanup } from "../hooks/actions/useCallCleanup";

// Nouvelles importations pour le cycle de vie
import { CallLifecycleColumn } from "../components/CallLifecycleColumn";
import { CallExtended } from "../../domain";

type ManagementTab =
  | "overview"
  | "transcription"
  | "audio"
  | "preparation"
  | "flags"
  | "cleanup";

/**
 * Interface pour l'état d'expansion des accordéons
 */
interface AccordionStates {
  [origin: string]: boolean;
}

/**
 * Interface pour les données chargées paresseusement
 */
interface LazyLoadedData {
  [origin: string]: {
    calls: CallExtended[];
    loaded: boolean;
    loading: boolean;
  };
}

/**
 * 🚀 COMPOSANT OPTIMISÉ - Table virtualisée pour grandes listes avec cycle de vie
 */
const VirtualizedCallTable: React.FC<{
  calls: CallExtended[];
  selectedCalls: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onLifecycleAction: (action: string, call: CallExtended) => void;
  renderRelationStatus: (callId: string) => React.ReactNode;
}> = ({
  calls,
  selectedCalls,
  onToggleSelection,
  onSelectAll,
  onLifecycleAction,
  renderRelationStatus,
}) => {
  const [displayedCalls, setDisplayedCalls] = useState(calls.slice(0, 20));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Pagination infinie optimisée
  const loadMoreCalls = useCallback(() => {
    if (isLoadingMore || displayedCalls.length >= calls.length) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCalls((prev) => [
        ...prev,
        ...calls.slice(prev.length, prev.length + 20),
      ]);
      setIsLoadingMore(false);
    }, 100); // Délai minimal pour UX
  }, [calls, displayedCalls.length, isLoadingMore]);

  // Détection du scroll pour chargement automatique
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMoreCalls();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadMoreCalls]);

  // Reset lors du changement de données
  useEffect(() => {
    setDisplayedCalls(calls.slice(0, 20));
  }, [calls]);

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      ref={tableContainerRef}
      sx={{ maxHeight: 400, overflow: "auto" }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  calls.some((call) => selectedCalls.has(call.id)) &&
                  !calls.every((call) => selectedCalls.has(call.id))
                }
                checked={
                  calls.length > 0 &&
                  calls.every((call) => selectedCalls.has(call.id))
                }
                onChange={onSelectAll}
              />
            </TableCell>
            <TableCell>Fichier</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Cycle de vie</TableCell>
            <TableCell>Relations</TableCell>
            <TableCell>Créé le</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedCalls.map((call) => (
            <TableRow key={call.id} selected={selectedCalls.has(call.id)} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCalls.has(call.id)}
                  onChange={() => onToggleSelection(call.id)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {call.filename || call.id}
                </Typography>
                {call.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {call.description.length > 50
                      ? `${call.description.substring(0, 50)}...`
                      : call.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={call.status || "draft"}
                  size="small"
                  color={
                    (call.status as string) === "conflictuel"
                      ? "error"
                      : (call.status as string) === "non_conflictuel"
                      ? "success"
                      : "default"
                  }
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <CallLifecycleColumn call={call} onAction={onLifecycleAction} />
              </TableCell>
              <TableCell>{renderRelationStatus(call.id)}</TableCell>
              <TableCell>
                <Typography variant="caption">
                  {call.createdAt instanceof Date
                    ? call.createdAt.toLocaleDateString()
                    : new Date(call.createdAt as any).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Voir détails">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Éditer">
                    <IconButton size="small" color="default">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}

          {/* Ligne de chargement */}
          {isLoadingMore && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box py={2}>
                  <LinearProgress />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Chargement de plus d'appels...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}

          {/* Indicateur de fin */}
          {displayedCalls.length >= calls.length && calls.length > 20 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ py: 1 }}
                >
                  Tous les appels sont affichés ({calls.length} total)
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * 🚀 COMPOSANT PRINCIPAL OPTIMISÉ avec cycle de vie
 */
export const CallManagementPage: React.FC = () => {
  // Router pour navigation
  const router = useRouter();

  // Hook unifié pour la gestion des appels
  const {
    calls,
    filteredCalls,
    callsByOrigin,
    selectedCallObjects,
    uniqueOrigins,
    stats,
    loading,
    error,
    filters,
    selectedCalls,
    loadCalls,
    clearError,
    toggleSelection,
    selectAll,
    clearSelection,
    selectByOrigin,
    hasSelection,
    updateFilters,
    resetFilters,
    services,
    lifecycleService, // Service de cycle de vie exposé par le hook
  } = useUnifiedCallManagement();

  // Test à ajouter temporairement dans CallManagementPage

  // État local pour les optimisations
  const [activeTab, setActiveTab] = useState<ManagementTab>("overview");
  const [accordionStates, setAccordionStates] = useState<AccordionStates>({});
  const [lazyData, setLazyData] = useState<LazyLoadedData>({});

  // Relations service
  const relationsService = useMemo(
    () => new CallRelationsService(new SupabaseRelationsRepository()),
    []
  );

  // Hook relations pour le statut des tags
  const { byId: nextTurnById, loading: relLoading } = useRelationsNextTurn(
    calls,
    { service: relationsService }
  );

  // Actions spécialisées par service
  const transcription = useCallTranscriptionActions({ reload: loadCalls });
  const audio = useCallAudioActions({ reload: loadCalls });
  const preparation = useCallPreparationActions({ reload: loadCalls });
  const flags = useCallFlags({ reload: loadCalls });
  const cleanup = useCallCleanup({ reload: loadCalls });

  /**
   * 🚀 NOUVEAU : Handler pour les actions de cycle de vie
   */
  const handleLifecycleAction = useCallback(
    async (action: string, call: CallExtended) => {
      try {
        switch (action) {
          case "prepare":
            await preparation.prepareForTagging([call]);
            break;
          case "select":
            await flags.setTagging([call], true);
            break;
          case "unselect":
            await flags.setTagging([call], false);
            break;
          case "tag":
            router.push(`/new-tagging?callId=${call.id}`);
            break;
          default:
            console.warn(`Action lifecycle inconnue: ${action}`);
        }
        await loadCalls(); // Recharger les données
      } catch (error) {
        console.error("Erreur action lifecycle:", error);
      }
    },
    [preparation, flags, router, loadCalls]
  );

  /**
   * 🚀 OPTIMISATION : Gestion intelligente des accordéons
   */
  const handleAccordionToggle = useCallback(
    (origin: string) => {
      setAccordionStates((prev) => ({
        ...prev,
        [origin]: !prev[origin],
      }));

      // Chargement paresseux des données de l'accordéon
      if (!lazyData[origin]?.loaded && !lazyData[origin]?.loading) {
        setLazyData((prev) => ({
          ...prev,
          [origin]: {
            calls: [] as CallExtended[],
            loaded: false,
            loading: true,
          },
        }));

        // 2) Lors du "chargement" paresseux, cast vers CallExtended[]
        setTimeout(() => {
          const originCallsExt =
            (callsByOrigin[origin] as unknown as CallExtended[]) ?? [];

          setLazyData((prev) => ({
            ...prev,
            [origin]: { calls: originCallsExt, loaded: true, loading: false },
          }));
        }, 100);
      }
    },
    [callsByOrigin, lazyData]
  );

  /**
   * Rendu des relations/tags avec mémorisation
   */
  const renderRelationStatus = useCallback(
    (callId: string) => {
      const relation = nextTurnById.get(String(callId));
      if (!relation) {
        return <Chip size="small" label={relLoading ? "..." : "—"} />;
      }

      const color =
        relation.status === "complete"
          ? "success"
          : relation.status === "partial"
          ? "warning"
          : "error";

      return (
        <Chip
          size="small"
          color={color as any}
          label={`${relation.percent}%`}
          title={`${relation.tagged}/${relation.total} tags`}
        />
      );
    },
    [nextTurnById, relLoading]
  );

  /**
   * Actions par onglet (mémorisées) avec nouveau bouton "Préparer pour tagging"
   */
  const renderTabActions = useCallback(() => {
    switch (activeTab) {
      case "overview":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label="Vue d'ensemble : Utilisez les autres onglets pour des actions spécialisées"
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadCalls}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Box>
        );

      case "transcription":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              disabled={!hasSelection}
              onClick={() => transcription.uploadJSONFor(selectedCallObjects)}
            >
              Importer JSON ({selectedCalls.size})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              disabled={!hasSelection}
              onClick={() => transcription.viewJSONFor(selectedCallObjects)}
            >
              Voir/Éditer JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              disabled={!hasSelection}
              onClick={() => transcription.autoTranscribe(selectedCallObjects)}
            >
              Transcrire Auto
            </Button>
          </Box>
        );

      case "audio":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              disabled={!hasSelection}
              onClick={() => audio.uploadFilesFor(selectedCallObjects)}
            >
              Uploader Audio ({selectedCalls.size})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              disabled={!hasSelection}
              onClick={() => audio.generateSignedLinks(selectedCallObjects)}
            >
              URLs Signées
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              disabled={!hasSelection}
              onClick={() => audio.validateAudio(selectedCallObjects)}
            >
              Valider Audio
            </Button>
          </Box>
        );

      case "preparation":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Build />}
              disabled={!hasSelection}
              onClick={() => preparation.prepareForTagging(selectedCallObjects)}
            >
              Préparer pour Tagging ({selectedCalls.size})
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => preparation.markPrepared(selectedCallObjects)}
            >
              Marquer Préparé
            </Button>
          </Box>
        );

      case "flags":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            {/* NOUVEAU BOUTON pour préparer pour tagging */}
            <Button
              variant="contained"
              startIcon={<Build />}
              disabled={!hasSelection}
              onClick={() => preparation.prepareForTagging(selectedCallObjects)}
            >
              Préparer pour Tagging ({selectedCalls.size})
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() =>
                flags.setConflictStatus(selectedCallObjects, "conflictuel")
              }
            >
              → Conflictuel ({selectedCalls.size})
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() =>
                flags.setConflictStatus(selectedCallObjects, "non_conflictuel")
              }
            >
              → Non-conflictuel
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => flags.setTagging(selectedCallObjects, true)}
            >
              Activer Tagging
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => flags.setTagging(selectedCallObjects, false)}
            >
              Désactiver Tagging
            </Button>
          </Box>
        );

      case "cleanup":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              color="warning"
              variant="outlined"
              startIcon={<CleaningServices />}
              disabled={!hasSelection}
              onClick={() => cleanup.purgeWord(selectedCallObjects)}
            >
              Purger WORD ({selectedCalls.size})
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<Delete />}
              disabled={!hasSelection}
              onClick={() => cleanup.purgeAudioIfTagged(selectedCallObjects)}
            >
              Supprimer Audio (si taggé)
            </Button>
          </Box>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    hasSelection,
    selectedCalls.size,
    selectedCallObjects,
    loading,
    loadCalls,
    transcription,
    audio,
    preparation,
    flags,
    cleanup,
  ]);

  /**
   * 🚀 RENDU OPTIMISÉ DES ACCORDÉONS avec chargement paresseux et cycle de vie
   */
  const renderOriginAccordions = useMemo(() => {
    return Object.entries(callsByOrigin).map(([origin, originCalls]) => {
      const isExpanded = accordionStates[origin] || false;
      const dataForOrigin = lazyData[origin];
      const shouldShowContent = isExpanded && dataForOrigin?.loaded;

      return (
        <Accordion
          key={origin}
          expanded={isExpanded}
          onChange={() => handleAccordionToggle(origin)}
          TransitionProps={{ timeout: 300 }}
        >
          {/* En-tête optimisé SANS boutons imbriqués */}
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderBottom: "1px solid rgba(0,0,0,0.12)",
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{origin}</Typography>
                <Chip
                  label={`${originCalls.length} appels`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${
                    originCalls.filter(
                      (c) => (c.status as string) === "conflictuel"
                    ).length
                  } conflictuels`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${
                    originCalls.filter((c) => c.hasValidAudio()).length
                  } avec audio`}
                  color="info"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${
                    originCalls.filter((c) => c.isReadyForTagging()).length
                  } prêts`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  selectByOrigin(origin);
                }}
                startIcon={<SelectAll />}
                variant="outlined"
              >
                Sélectionner tous
              </Button>
            </Box>

            <AccordionSummary
              expandIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            >
              <Typography variant="body2" color="text.secondary">
                {isExpanded ? "Masquer" : "Afficher"} les détails des appels
                {dataForOrigin?.loading && " (chargement...)"}
              </Typography>
            </AccordionSummary>
          </Box>

          <AccordionDetails>
            {/* Chargement paresseux avec skeleton */}
            {dataForOrigin?.loading ? (
              <Box>
                {[...Array(3)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={60}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            ) : shouldShowContent ? (
              <VirtualizedCallTable
                calls={dataForOrigin.calls}
                selectedCalls={selectedCalls}
                onToggleSelection={toggleSelection}
                onSelectAll={() => {
                  const allSelected = dataForOrigin.calls.every((call) =>
                    selectedCalls.has(call.id)
                  );
                  dataForOrigin.calls.forEach((call) => {
                    if (allSelected && selectedCalls.has(call.id)) {
                      toggleSelection(call.id);
                    } else if (!allSelected && !selectedCalls.has(call.id)) {
                      toggleSelection(call.id);
                    }
                  });
                }}
                onLifecycleAction={handleLifecycleAction}
                renderRelationStatus={renderRelationStatus}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Cliquez pour charger les données...
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      );
    });
  }, [
    callsByOrigin,
    accordionStates,
    lazyData,
    selectedCalls,
    toggleSelection,
    selectByOrigin,
    handleLifecycleAction,
    renderRelationStatus,
    handleAccordionToggle,
  ]);

  return (
    <Box sx={{ p: 2 }}>
      <DebugCallLoading />
      <Divider sx={{ my: 3 }} />

      {/* En-tête avec statistiques */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          🏢 Gestion Unifiée des Appels (Cycle de Vie Intégré)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Interface centralisée avec cycle de vie intelligent, chargement
          paresseux et virtualisation pour 682+ appels
        </Typography>

        {/* Statistiques avec performance */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <Badge badgeContent={stats.total} color="primary">
            <Chip label="Total appels" variant="outlined" />
          </Badge>
          <Badge badgeContent={stats.filteredCount} color="info">
            <Chip label="Filtrés" variant="outlined" />
          </Badge>
          <Badge badgeContent={stats.selectedCount} color="warning">
            <Chip label="Sélectionnés" variant="outlined" />
          </Badge>
          <Badge badgeContent={`${stats.completeness}%`} color="success">
            <Chip label="Complétude" variant="outlined" />
          </Badge>
          <Badge badgeContent={stats.readyForTagging} color="success">
            <Chip label="Prêts tagging" variant="outlined" />
          </Badge>
          <Badge badgeContent={stats.conflictuels} color="error">
            <Chip label="Conflictuels" variant="outlined" />
          </Badge>
        </Box>

        {/* Indicateur performance */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>🚀 Optimisations actives:</strong> Cycle de vie intelligent
            (CallExtended + CallLifecycleColumn), chargement paresseux,
            virtualisation des tables, cache intelligent, accordéons
            non-bloquants. {Object.keys(callsByOrigin).length} origines
            détectées.
          </Typography>
        </Alert>
      </Box>

      {/* Barre de progression */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Gestion d'erreur */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={clearError}
          action={
            <Button color="inherit" size="small" onClick={loadCalls}>
              Réessayer
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Erreur de chargement:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Filtres optimisés */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Filtres & Recherche
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: "1 1 250px", minWidth: 200 }}>
              <TextField
                fullWidth
                size="small"
                label="Recherche"
                value={filters.searchKeyword}
                onChange={(e) =>
                  updateFilters({ searchKeyword: e.target.value })
                }
                placeholder="Nom, description, ID..."
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Box>

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
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="conflictuel">🔴 Conflictuels</MenuItem>
                  <MenuItem value="non_conflictuel">
                    🟢 Non conflictuels
                  </MenuItem>
                  <MenuItem value="non_supervisé">⚪ Non supervisés</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: "1 1 150px", minWidth: 130 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Origine</InputLabel>
                <Select
                  value={filters.origin}
                  onChange={(e) => updateFilters({ origin: e.target.value })}
                  label="Origine"
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  {uniqueOrigins.map((origin) => (
                    <MenuItem key={origin} value={origin}>
                      {origin}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: "0 0 auto" }}>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  onClick={resetFilters}
                  startIcon={<ClearAll />}
                >
                  Reset
                </Button>
                <Button
                  size="small"
                  onClick={selectAll}
                  startIcon={<SelectAll />}
                >
                  Tout sélectionner
                </Button>
                <Button size="small" onClick={clearSelection}>
                  Désélectionner
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Onglets de services */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newTab) => setActiveTab(newTab)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              value="overview"
              label="Vue d'ensemble"
              icon={<Assessment />}
              iconPosition="start"
            />
            <Tab
              value="transcription"
              label="Transcription"
              icon={<Description />}
              iconPosition="start"
            />
            <Tab
              value="audio"
              label="Audio"
              icon={<AudioFile />}
              iconPosition="start"
            />
            <Tab
              value="preparation"
              label="Préparation"
              icon={<Build />}
              iconPosition="start"
            />
            <Tab
              value="flags"
              label="Flags & Statuts"
              icon={<Flag />}
              iconPosition="start"
            />
            <Tab
              value="cleanup"
              label="Nettoyage"
              icon={<CleaningServices />}
              iconPosition="start"
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Barre d'actions contextuelle */}
      <Card sx={{ mb: 2 }} variant="outlined">
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="h6">
              Actions - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              {hasSelection && (
                <Chip
                  label={`${selectedCalls.size} sélectionnés`}
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {renderTabActions()}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Affichage optimisé des accordéons */}
      {Object.keys(callsByOrigin).length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            📋 Appels par Origine ({filteredCalls.length} total) - Chargement
            paresseux activé
          </Typography>
          {renderOriginAccordions}
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            {loading
              ? "🔄 Chargement des appels en cours..."
              : error
              ? "⌘ Erreur lors du chargement des appels"
              : calls.length === 0
              ? "🔭 Aucun appel trouvé dans la base de données"
              : "🔍 Aucun appel ne correspond aux filtres sélectionnés"}
          </Typography>
        </Alert>
      )}

      {/* Documentation optimisations */}
      <Box mt={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🚀 Optimisations de Performance + Cycle de Vie
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 300px">
                <Typography variant="subtitle2" gutterBottom>
                  ✅ Correctifs appliqués
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Colonnes DB</strong> : Suppression
                    created_at/updated_at inexistants
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Boutons imbriqués</strong> : Structure accordéon
                    corrigée
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Chargement paresseux</strong> : Tables chargées à
                    l'ouverture
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Virtualisation</strong> : Pagination infinie pour
                    grandes listes
                  </Typography>
                </Box>
              </Box>

              <Box flex="1 1 300px">
                <Typography variant="subtitle2" gutterBottom>
                  ⚡ Optimisations performance
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Cache intelligent</strong> : 30s TTL avec
                    invalidation
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Mémorisation</strong> : useCallback sur handlers
                    critiques
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Pagination SQL</strong> : LIMIT/OFFSET côté serveur
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Skeleton UI</strong> : Feedback visuel pendant
                    chargement
                  </Typography>
                </Box>
              </Box>

              <Box flex="1 1 300px">
                <Typography variant="subtitle2" gutterBottom>
                  🔄 Nouvelles fonctionnalités cycle de vie
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>CallExtended</strong> : Entité enrichie avec
                    workflow
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>CallLifecycleColumn</strong> : Interface intuitive
                    par étape
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    <strong>Actions contextuelles</strong> : Boutons
                    intelligents selon l'état
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Navigation directe</strong> : Vers /new-tagging
                    depuis l'interface
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>✅ Performance optimisée pour 682+ appels</strong> :
                Chargement initial rapide, accordéons non-bloquants, tables
                virtualisées, cache intelligent avec invalidation automatique,
                et cycle de vie intégré pour un workflow fluide.
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>🔄 Cycle de vie intégré</strong> : La colonne "Cycle de
                vie" remplace l'ancienne colonne "Contenu" et offre une
                interface interactive pour gérer chaque appel selon son stade de
                workflow (brouillon → préparé → sélectionné → taggé).
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
