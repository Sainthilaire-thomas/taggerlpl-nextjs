// components/tags/TagExplorer.tsx - Version améliorée avec hook et sauvegarde optimisée
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
  LinearProgress,
  TextField,
  InputAdornment,
  useTheme,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import InfoIcon from "@mui/icons-material/Info";
import RefreshIcon from "@mui/icons-material/Refresh";
import { supabase } from "@/lib/supabaseClient";

interface TagData {
  tag: string;
  count: number;
  percentage: number;
  examples?: string[];
  currentOriginespeaker?: "client" | "conseiller" | null;
  existsInLpltag?: boolean;
  lpltagId?: number; // ID du tag dans lpltag si il existe
}

interface LplTagData {
  id: number;
  label: string;
  originespeaker: "client" | "conseiller" | null;
  family: string;
  description: string;
  color: string;
}

interface TagExplorerProps {
  onTagsClassified?: () => void;
}

// Hook personnalisé pour gérer les données lpltag
function useLplTags() {
  const [lplTags, setLplTags] = useState<LplTagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLplTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("lpltag")
        .select("id, label, originespeaker, family, description, color")
        .order("label");

      if (fetchError) throw fetchError;

      setLplTags(data || []);
      console.log("📋 Chargement lpltag:", data?.length, "tags");
    } catch (err) {
      console.error("Erreur chargement lpltag:", err);
      setError("Erreur lors du chargement des tags");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLplTag = useCallback(
    async (id: number, updates: Partial<LplTagData>) => {
      try {
        const { error } = await supabase
          .from("lpltag")
          .update(updates)
          .eq("id", id);

        if (error) throw error;

        // Mettre à jour le state local
        setLplTags((prev) =>
          prev.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag))
        );

        return true;
      } catch (error) {
        console.error("Erreur mise à jour lpltag:", error);
        return false;
      }
    },
    []
  );

  const createLplTag = useCallback(async (tagData: Omit<LplTagData, "id">) => {
    try {
      const { data, error } = await supabase
        .from("lpltag")
        .insert(tagData)
        .select()
        .single();

      if (error) throw error;

      // Ajouter au state local
      setLplTags((prev) => [...prev, data]);

      return data;
    } catch (error) {
      console.error("Erreur création lpltag:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadLplTags();
  }, [loadLplTags]);

  return {
    lplTags,
    loading,
    error,
    loadLplTags,
    updateLplTag,
    createLplTag,
  };
}

export default function TagExplorer({ onTagsClassified }: TagExplorerProps) {
  const theme = useTheme();
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [allNextTurnTags, setAllNextTurnTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "unclassified" | "client" | "conseiller"
  >("unclassified");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [pendingClassifications, setPendingClassifications] = useState<
    Record<string, "client" | "conseiller">
  >({});

  // Utiliser le hook personnalisé
  const {
    lplTags,
    loading: lplLoading,
    error: lplError,
    loadLplTags,
    updateLplTag,
    createLplTag,
  } = useLplTags();

  // Charger les données au démarrage
  useEffect(() => {
    if (!lplLoading) {
      exploreAllTags();
    }
  }, [lplLoading]);

  const exploreAllTags = async () => {
    if (lplLoading) return; // Attendre que lpltag soit chargé

    setLoading(true);
    try {
      console.log("🔍 === EXPLORATION TAGS POUR CLASSIFICATION ===");

      // Créer une map des tags existants
      const existingTagsMap = new Map(
        lplTags.map((tag) => [
          tag.label,
          {
            originespeaker: tag.originespeaker,
            id: tag.id,
          },
        ])
      );

      console.log("📋 Tags existants dans lpltag:", lplTags.length);

      // Compter total turntagged
      const { count: total } = await supabase
        .from("turntagged")
        .select("*", { count: "exact", head: true });

      setTotalRecords(total || 0);

      // Analyser tous les tags de turntagged
      const { data: sampleData } = await supabase
        .from("turntagged")
        .select("tag, next_turn_tag, verbatim, next_turn_verbatim")
        .limit(10000); // Augmenter l'échantillon

      console.log("📊 Échantillon turntagged:", sampleData?.length);

      // Analyser les tags (champ tag)
      const tagAnalysis = new Map<
        string,
        { count: number; examples: string[] }
      >();

      sampleData?.forEach((item) => {
        if (item.tag?.trim()) {
          const tag = item.tag.trim();
          const existing = tagAnalysis.get(tag) || { count: 0, examples: [] };
          existing.count++;

          if (item.verbatim && existing.examples.length < 3) {
            const shortVerbatim = item.verbatim.substring(0, 120) + "...";
            if (!existing.examples.includes(shortVerbatim)) {
              existing.examples.push(shortVerbatim);
            }
          }

          tagAnalysis.set(tag, existing);
        }
      });

      // Analyser les next_turn_tags
      const nextTurnTagAnalysis = new Map<
        string,
        { count: number; examples: string[] }
      >();

      sampleData?.forEach((item) => {
        if (item.next_turn_tag?.trim()) {
          const nextTag = item.next_turn_tag.trim();
          const existing = nextTurnTagAnalysis.get(nextTag) || {
            count: 0,
            examples: [],
          };
          existing.count++;

          if (item.next_turn_verbatim && existing.examples.length < 3) {
            const shortVerbatim =
              item.next_turn_verbatim.substring(0, 120) + "...";
            if (!existing.examples.includes(shortVerbatim)) {
              existing.examples.push(shortVerbatim);
            }
          }

          nextTurnTagAnalysis.set(nextTag, existing);
        }
      });

      // Convertir en arrays avec info sur lpltag
      const totalTagsCount = Array.from(tagAnalysis.values()).reduce(
        (sum, item) => sum + item.count,
        0
      );
      const totalNextTurnTagsCount = Array.from(
        nextTurnTagAnalysis.values()
      ).reduce((sum, item) => sum + item.count, 0);

      const tagsData: TagData[] = Array.from(tagAnalysis.entries())
        .map(([tag, data]) => {
          const existingTag = existingTagsMap.get(tag);
          return {
            tag,
            count: data.count,
            percentage:
              Math.round((data.count / totalTagsCount) * 100 * 100) / 100,
            examples: data.examples,
            existsInLpltag: !!existingTag,
            currentOriginespeaker: existingTag?.originespeaker || null,
            lpltagId: existingTag?.id,
          };
        })
        .sort((a, b) => b.count - a.count);

      const nextTurnTagsData: TagData[] = Array.from(
        nextTurnTagAnalysis.entries()
      )
        .map(([tag, data]) => {
          const existingTag = existingTagsMap.get(tag);
          return {
            tag,
            count: data.count,
            percentage:
              Math.round((data.count / totalNextTurnTagsCount) * 100 * 100) /
              100,
            examples: data.examples,
            existsInLpltag: !!existingTag,
            currentOriginespeaker: existingTag?.originespeaker || null,
            lpltagId: existingTag?.id,
          };
        })
        .sort((a, b) => b.count - a.count);

      setAllTags(tagsData);
      setAllNextTurnTags(nextTurnTagsData);

      console.log("🏷️ Tags uniques:", tagsData.length);
      console.log("➡️ Next_turn_tags uniques:", nextTurnTagsData.length);
      console.log(
        "📊 Tags sans classification:",
        tagsData.filter((t) => !t.currentOriginespeaker).length
      );
    } catch (error) {
      console.error("Erreur exploration:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de l'exploration",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassification = (
    tag: string,
    classification: "client" | "conseiller"
  ) => {
    setPendingClassifications((prev) => ({
      ...prev,
      [tag]: classification,
    }));

    console.log(`🏷️ Classification en attente: "${tag}" → ${classification}`);
  };

  const saveClassifications = async () => {
    if (Object.keys(pendingClassifications).length === 0) {
      setSnackbar({
        open: true,
        message: "Aucune classification en attente",
        severity: "warning",
      });
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      console.log("💾 Sauvegarde des classifications:", pendingClassifications);

      // Traiter chaque classification
      for (const [tagLabel, originespeaker] of Object.entries(
        pendingClassifications
      )) {
        try {
          // Trouver le tag dans allTags pour avoir ses infos
          const tagData = allTags.find((t) => t.tag === tagLabel);

          if (tagData?.existsInLpltag && tagData.lpltagId) {
            // Mettre à jour le tag existant
            const success = await updateLplTag(tagData.lpltagId, {
              originespeaker,
            });

            if (success) {
              successCount++;
              console.log(`✅ Mise à jour réussie: ${tagLabel}`);
            } else {
              errorCount++;
              console.error(`❌ Échec mise à jour: ${tagLabel}`);
            }
          } else {
            // Créer un nouveau tag
            const newTag = await createLplTag({
              label: tagLabel,
              originespeaker,
              family: "CLASSIFICATION_AUTO",
              description: `Tag classifié automatiquement comme ${originespeaker}`,
              color: originespeaker === "conseiller" ? "#4CAF50" : "#2196F3",
            });

            if (newTag) {
              successCount++;
              console.log(`✅ Création réussie: ${tagLabel}`);
            } else {
              errorCount++;
              console.error(`❌ Échec création: ${tagLabel}`);
            }
          }
        } catch (error) {
          console.error(`Erreur pour ${tagLabel}:`, error);
          errorCount++;
        }
      }

      // Vider les classifications en attente
      setPendingClassifications({});

      // Rafraîchir les données
      await exploreAllTags();

      // Message de résultat
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: `${successCount} classifications sauvegardées avec succès`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `${successCount} réussies, ${errorCount} erreurs`,
          severity: "warning",
        });
      }

      // Notifier la page parente
      if (successCount > 0) {
        onTagsClassified?.();
      }
    } catch (error) {
      console.error("Erreur sauvegarde globale:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de la sauvegarde",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await loadLplTags(); // Recharger lpltag
    await exploreAllTags(); // Recharger l'exploration
  };

  // Filtrage des tags
  const getFilteredTags = (tags: TagData[]) => {
    let filtered = tags.filter((tag) =>
      tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (filterBy) {
      case "unclassified":
        filtered = filtered.filter(
          (tag) =>
            !tag.currentOriginespeaker && !pendingClassifications[tag.tag]
        );
        break;
      case "client":
        filtered = filtered.filter(
          (tag) =>
            tag.currentOriginespeaker === "client" ||
            pendingClassifications[tag.tag] === "client"
        );
        break;
      case "conseiller":
        filtered = filtered.filter(
          (tag) =>
            tag.currentOriginespeaker === "conseiller" ||
            pendingClassifications[tag.tag] === "conseiller"
        );
        break;
    }

    return filtered;
  };

  const filteredTags = getFilteredTags(allTags);
  const unclassifiedCount = allTags.filter(
    (tag) => !tag.currentOriginespeaker
  ).length;
  const pendingCount = Object.keys(pendingClassifications).length;

  if (loading || lplLoading) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Exploration des tags pour classification...
        </Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Chargement des données lpltag et analyse des tags...
        </Typography>
      </Paper>
    );
  }

  if (lplError) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Alert severity="error">
          {lplError}
          <Button onClick={handleRefresh} sx={{ ml: 2 }}>
            Réessayer
          </Button>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">
          🏷️ Classification des Tags
          <Tooltip title="Ce composant permet de classifier manuellement les tags comme 'client' ou 'conseiller' et de mettre à jour la base de données">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || lplLoading}
          >
            Actualiser
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={saveClassifications}
            disabled={saving || pendingCount === 0}
            color={pendingCount > 0 ? "primary" : "inherit"}
          >
            {saving ? "Sauvegarde..." : `Sauvegarder (${pendingCount})`}
          </Button>
        </Box>
      </Box>

      {/* Statistiques */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h5" color="primary">
              {allTags.length}
            </Typography>
            <Typography variant="caption">Tags uniques</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h5" color="warning.main">
              {unclassifiedCount}
            </Typography>
            <Typography variant="caption">Non classifiés</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h5" color="info.main">
              {pendingCount}
            </Typography>
            <Typography variant="caption">En attente</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h5" color="success.main">
              {allTags.filter((t) => t.existsInLpltag).length}
            </Typography>
            <Typography variant="caption">Dans lpltag</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filtres */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            value={filterBy}
            label="Filtrer par statut"
            onChange={(e) => setFilterBy(e.target.value as any)}
          >
            <MenuItem value="all">Tous les tags</MenuItem>
            <MenuItem value="unclassified">Non classifiés</MenuItem>
            <MenuItem value="conseiller">Conseiller</MenuItem>
            <MenuItem value="client">Client</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Alerte si beaucoup de non-classifiés */}
      {unclassifiedCount > 50 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Il y a {unclassifiedCount} tags non classifiés. Commencez par les plus
          fréquents (en haut de la liste).
        </Alert>
      )}

      {/* Table des tags */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Tag</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Occurrences
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                %
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Exemples</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Classification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTags.map((item, index) => {
              const pendingClassification = pendingClassifications[item.tag];
              const currentClassification =
                pendingClassification || item.currentOriginespeaker;

              return (
                <TableRow
                  key={item.tag}
                  sx={{
                    backgroundColor:
                      index % 2 === 0
                        ? "transparent"
                        : theme.palette.action.hover,
                    "&:hover": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: "medium" }}>
                    {item.tag}
                    {pendingClassification && (
                      <Chip
                        label="Modifié"
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {item.count.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{item.percentage}%</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {item.existsInLpltag && (
                        <Chip
                          label="Dans lpltag"
                          size="small"
                          color="success"
                        />
                      )}
                      {currentClassification && (
                        <Chip
                          label={
                            currentClassification === "conseiller" ? "👨‍💼" : "👤"
                          }
                          size="small"
                          color={
                            currentClassification === "conseiller"
                              ? "primary"
                              : "info"
                          }
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    {item.examples?.map((example, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        • {example}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant={
                          currentClassification === "conseiller"
                            ? "contained"
                            : "outlined"
                        }
                        color={
                          currentClassification === "conseiller"
                            ? "primary"
                            : "inherit"
                        }
                        onClick={() =>
                          handleClassification(item.tag, "conseiller")
                        }
                      >
                        👨‍💼 Conseiller
                      </Button>
                      <Button
                        size="small"
                        variant={
                          currentClassification === "client"
                            ? "contained"
                            : "outlined"
                        }
                        color={
                          currentClassification === "client"
                            ? "info"
                            : "inherit"
                        }
                        onClick={() => handleClassification(item.tag, "client")}
                      >
                        👤 Client
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredTags.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 4 }}
        >
          Aucun tag trouvé avec les filtres actuels
        </Typography>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
