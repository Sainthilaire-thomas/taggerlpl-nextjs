// components/tags/DebugFunnel.tsx - Version corrigée pour Grid MUI
"use client";

import { useState, useEffect } from "react";
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
  LinearProgress,
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import { supabase } from "@/lib/supabaseClient";

interface TagUsageStats {
  label: string;
  family: string;
  originespeaker: string | null;
  color: string;
  icon: string | null;
  description: string | null;
  turntaggedCount: number;
  turntaggedExamples: string[];
  nextTurnTaggedCount: number;
  nextTurnTaggedExamples: string[];
  totalUsage: number;
  isInLpltag: boolean;
}

interface FamilyStats {
  family: string;
  totalTags: number;
  totalUsage: number;
  conseillerTags: number;
  clientTags: number;
  undefinedTags: number;
  tagsInLpltag: number;
  tagsNotInLpltag: number;
  tags: TagUsageStats[];
  color: string;
}

// ✅ Props du composant avec selectedOrigin optionnel
interface DebugFunnelProps {
  selectedOrigin?: string | null;
}

export default function DebugFunnel({ selectedOrigin }: DebugFunnelProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [familyStats, setFamilyStats] = useState<FamilyStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalTags: 0,
    totalUsage: 0,
    totalFamilies: 0,
    totalTurntagged: 0,
    tagsInLpltag: 0,
    tagsNotInLpltag: 0,
  });
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"usage" | "tags" | "name">("usage");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  useEffect(() => {
    loadTagFamilyStats();
  }, [selectedOrigin]); // ✅ Recharger quand selectedOrigin change

  const loadTagFamilyStats = async () => {
    setLoading(true);
    try {
      console.log("🔍 === ANALYSE COMPLÈTE DES TAGS TURNTAGGED ===");
      if (selectedOrigin) {
        console.log("📍 Filtrage par origine:", selectedOrigin);
      }

      // 1. Récupérer TOUS les tags de turntagged (avec filtre origine optionnel)
      let query = supabase
        .from("turntagged")
        .select("tag, verbatim, next_turn_tag, next_turn_verbatim", {
          count: "exact",
        })
        .limit(20000);

      // ✅ Appliquer le filtre origine si spécifié
      if (selectedOrigin && selectedOrigin !== "all") {
        // Supposons qu'il y a un champ 'origine' dans turntagged
        // Ajustez selon votre structure de données
        query = query.eq("origine", selectedOrigin);
      }

      const { data: allTurntaggedData, count: totalTurntaggedCount } =
        await query;

      console.log("📊 Total records turntagged:", totalTurntaggedCount);
      console.log("📊 Records récupérés:", allTurntaggedData?.length);

      if (!allTurntaggedData) {
        throw new Error("Aucune donnée turntagged trouvée");
      }

      // 2. Analyser tous les tags utilisés dans turntagged
      const allTagsUsage = new Map<
        string,
        {
          turntagged: number;
          nextTurn: number;
          turntaggedExamples: string[];
          nextTurnExamples: string[];
        }
      >();

      // Analyser turntagged.tag
      allTurntaggedData.forEach((item) => {
        if (item.tag?.trim()) {
          const tag = item.tag.trim();
          const existing = allTagsUsage.get(tag) || {
            turntagged: 0,
            nextTurn: 0,
            turntaggedExamples: [],
            nextTurnExamples: [],
          };
          existing.turntagged++;

          if (item.verbatim && existing.turntaggedExamples.length < 2) {
            const shortVerbatim = item.verbatim.substring(0, 80) + "...";
            if (!existing.turntaggedExamples.includes(shortVerbatim)) {
              existing.turntaggedExamples.push(shortVerbatim);
            }
          }

          allTagsUsage.set(tag, existing);
        }
      });

      // Analyser turntagged.next_turn_tag
      allTurntaggedData.forEach((item) => {
        if (item.next_turn_tag?.trim()) {
          const tag = item.next_turn_tag.trim();
          const existing = allTagsUsage.get(tag) || {
            turntagged: 0,
            nextTurn: 0,
            turntaggedExamples: [],
            nextTurnExamples: [],
          };
          existing.nextTurn++;

          if (item.next_turn_verbatim && existing.nextTurnExamples.length < 2) {
            const shortVerbatim =
              item.next_turn_verbatim.substring(0, 80) + "...";
            if (!existing.nextTurnExamples.includes(shortVerbatim)) {
              existing.nextTurnExamples.push(shortVerbatim);
            }
          }

          allTagsUsage.set(tag, existing);
        }
      });

      console.log(
        "🏷️ Tags uniques trouvés dans turntagged:",
        allTagsUsage.size
      );

      // 3. Récupérer les infos lpltag
      const { data: lplTags } = await supabase
        .from("lpltag")
        .select("label, family, originespeaker, color, icon, description")
        .order("family", { ascending: true });

      console.log("📋 Tags dans lpltag:", lplTags?.length);

      // Créer une map des tags lpltag
      const lplTagsMap = new Map(lplTags?.map((tag) => [tag.label, tag]) || []);

      // 4. Créer les statistiques pour TOUS les tags utilisés
      const allTagStats: TagUsageStats[] = Array.from(
        allTagsUsage.entries()
      ).map(([tagLabel, usage]) => {
        const lplTagInfo = lplTagsMap.get(tagLabel);
        const isInLpltag = !!lplTagInfo;

        return {
          label: tagLabel,
          family: lplTagInfo?.family || "NON_RÉFÉRENCÉ",
          originespeaker: lplTagInfo?.originespeaker || null,
          color: lplTagInfo?.color || "#999999",
          icon: lplTagInfo?.icon || null,
          description: lplTagInfo?.description || null,
          turntaggedCount: usage.turntagged,
          turntaggedExamples: usage.turntaggedExamples,
          nextTurnTaggedCount: usage.nextTurn,
          nextTurnTaggedExamples: usage.nextTurnExamples,
          totalUsage: usage.turntagged + usage.nextTurn,
          isInLpltag,
        };
      });

      // Trier par usage décroissant
      allTagStats.sort((a, b) => b.totalUsage - a.totalUsage);

      console.log("📊 Répartition des tags:");
      console.log(
        "- Dans lpltag:",
        allTagStats.filter((t) => t.isInLpltag).length
      );
      console.log(
        "- Hors lpltag:",
        allTagStats.filter((t) => !t.isInLpltag).length
      );

      // 5. Grouper par famille
      const familiesMap = new Map<string, TagUsageStats[]>();
      allTagStats.forEach((tag) => {
        const family = tag.family;
        if (!familiesMap.has(family)) {
          familiesMap.set(family, []);
        }
        familiesMap.get(family)!.push(tag);
      });

      // 6. Créer les statistiques par famille
      const familyStatsArray: FamilyStats[] = Array.from(
        familiesMap.entries()
      ).map(([family, tags]) => {
        const totalUsage = tags.reduce((sum, tag) => sum + tag.totalUsage, 0);
        const conseillerTags = tags.filter(
          (t) => t.originespeaker === "conseiller"
        ).length;
        const clientTags = tags.filter(
          (t) => t.originespeaker === "client"
        ).length;
        const undefinedTags = tags.filter((t) => !t.originespeaker).length;
        const tagsInLpltag = tags.filter((t) => t.isInLpltag).length;
        const tagsNotInLpltag = tags.filter((t) => !t.isInLpltag).length;

        // Couleur : prendre celle du tag le plus utilisé qui est dans lpltag
        const tagsWithColor = tags
          .filter((t) => t.isInLpltag)
          .sort((a, b) => b.totalUsage - a.totalUsage);
        const dominantColor =
          tagsWithColor[0]?.color ||
          (family === "NON_RÉFÉRENCÉ" ? "#ff6b6b" : "#6c757d");

        return {
          family,
          totalTags: tags.length,
          totalUsage,
          conseillerTags,
          clientTags,
          undefinedTags,
          tagsInLpltag,
          tagsNotInLpltag,
          tags: tags.sort((a, b) => b.totalUsage - a.totalUsage),
          color: dominantColor,
        };
      });

      // Trier les familles
      let sortedFamilies = [...familyStatsArray];
      switch (sortBy) {
        case "usage":
          sortedFamilies.sort((a, b) => b.totalUsage - a.totalUsage);
          break;
        case "tags":
          sortedFamilies.sort((a, b) => b.totalTags - a.totalTags);
          break;
        case "name":
          sortedFamilies.sort((a, b) => a.family.localeCompare(b.family));
          break;
      }

      setFamilyStats(sortedFamilies);

      // 7. Statistiques globales
      const totalUsageCount = allTagStats.reduce(
        (sum, tag) => sum + tag.totalUsage,
        0
      );
      const tagsInLpltagCount = allTagStats.filter((t) => t.isInLpltag).length;
      const tagsNotInLpltagCount = allTagStats.filter(
        (t) => !t.isInLpltag
      ).length;

      setTotalStats({
        totalTags: allTagStats.length,
        totalUsage: totalUsageCount,
        totalFamilies: familyStatsArray.length,
        totalTurntagged: totalTurntaggedCount || 0,
        tagsInLpltag: tagsInLpltagCount,
        tagsNotInLpltag: tagsNotInLpltagCount,
      });

      console.log("✅ Analyse terminée:");
      console.log("- Tags analysés:", allTagStats.length);
      console.log("- Usage total calculé:", totalUsageCount);
      console.log("- Familles:", familyStatsArray.length);
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrigineSpeakerIcon = (originespeaker: string | null) => {
    switch (originespeaker) {
      case "conseiller":
        return "👨‍💼";
      case "client":
        return "👤";
      default:
        return "❓";
    }
  };

  const getOrigineSpeakerColor = (originespeaker: string | null) => {
    switch (originespeaker) {
      case "conseiller":
        return "primary";
      case "client":
        return "info";
      default:
        return "default";
    }
  };

  let filteredFamilies =
    selectedFamily === "all"
      ? familyStats
      : familyStats.filter((f) => f.family === selectedFamily);

  if (showOnlyMissing) {
    filteredFamilies = filteredFamilies.filter((f) => f.tagsNotInLpltag > 0);
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Analyse complète des records turntagged...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      {/* En-tête */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">
          🏷️ Debug Funnel - Analyse Complète
          <Tooltip title="Analyse TOUS les tags trouvés dans turntagged et leur correspondance avec lpltag">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Famille</InputLabel>
            <Select
              value={selectedFamily}
              label="Famille"
              onChange={(e) => setSelectedFamily(e.target.value)}
            >
              <MenuItem value="all">Toutes les familles</MenuItem>
              {familyStats.map((family) => (
                <MenuItem key={family.family} value={family.family}>
                  {family.family} ({family.totalTags})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tri</InputLabel>
            <Select
              value={sortBy}
              label="Tri"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="usage">Usage</MenuItem>
              <MenuItem value="tags">Nb tags</MenuItem>
              <MenuItem value="name">Nom</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant={showOnlyMissing ? "contained" : "outlined"}
            color="warning"
            startIcon={<WarningIcon />}
            onClick={() => setShowOnlyMissing(!showOnlyMissing)}
          >
            Tags manquants
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTagFamilyStats}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Alerte si beaucoup de tags manquants */}
      {totalStats.tagsNotInLpltag > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningIcon />
            <Typography>
              {totalStats.tagsNotInLpltag} tags utilisés dans turntagged ne sont
              pas référencés dans lpltag !
            </Typography>
          </Box>
        </Alert>
      )}

      {/* ✅ Statistiques globales - VERSION SIMPLIFIÉE AVEC BOX */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="info.main">
                {totalStats.totalTurntagged.toLocaleString()}
              </Typography>
              <Typography variant="caption">Records turntagged</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="success.main">
                {totalStats.totalUsage.toLocaleString()}
              </Typography>
              <Typography variant="caption">Usages totaux</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="secondary">
                {totalStats.totalTags}
              </Typography>
              <Typography variant="caption">Tags uniques</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="primary">
                {totalStats.tagsInLpltag}
              </Typography>
              <Typography variant="caption">Dans lpltag</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="warning.main">
                {totalStats.tagsNotInLpltag}
              </Typography>
              <Typography variant="caption">Manquants</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" color="text.primary">
                {totalStats.totalFamilies}
              </Typography>
              <Typography variant="caption">Familles</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Accordéons par famille */}
      {filteredFamilies.map((family, index) => (
        <Accordion
          key={family.family}
          defaultExpanded={index < 2 || family.family === "NON_RÉFÉRENCÉ"}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor:
                family.family === "NON_RÉFÉRENCÉ"
                  ? theme.palette.error.light + "20"
                  : theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.grey[50],
              "&:hover": {
                backgroundColor:
                  family.family === "NON_RÉFÉRENCÉ"
                    ? theme.palette.error.light + "30"
                    : theme.palette.mode === "dark"
                    ? theme.palette.grey[700]
                    : theme.palette.grey[100],
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: family.color,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {family.family}
                {family.family === "NON_RÉFÉRENCÉ" && " ⚠️"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, ml: "auto", mr: 2 }}>
                <Chip
                  label={`${family.totalTags} tags`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`${family.totalUsage.toLocaleString()} usages`}
                  size="small"
                  color="secondary"
                />
                <Chip
                  label={`✅ ${family.tagsInLpltag}`}
                  size="small"
                  color="success"
                />
                {family.tagsNotInLpltag > 0 && (
                  <Chip
                    label={`❌ ${family.tagsNotInLpltag}`}
                    size="small"
                    color="error"
                  />
                )}
                <Chip
                  label={`👨‍💼 ${family.conseillerTags}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`👤 ${family.clientTags}`}
                  size="small"
                  color="info"
                />
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Tag</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Turntagged
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Next Turn
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Exemples</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {family.tags.map((tag, tagIndex) => (
                    <TableRow
                      key={tag.label}
                      sx={{
                        backgroundColor: !tag.isInLpltag
                          ? theme.palette.error.light + "10"
                          : tagIndex % 2 === 0
                          ? "transparent"
                          : theme.palette.action.hover,
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: tag.color,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "medium",
                              color: !tag.isInLpltag ? "error.main" : "inherit",
                            }}
                          >
                            {tag.label}
                          </Typography>
                          {tag.icon && (
                            <Typography variant="body2">{tag.icon}</Typography>
                          )}
                        </Box>
                        {tag.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {tag.description}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            tag.isInLpltag ? "✅ Dans lpltag" : "❌ Manquant"
                          }
                          size="small"
                          color={tag.isInLpltag ? "success" : "error"}
                          variant={tag.isInLpltag ? "outlined" : "filled"}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={getOrigineSpeakerIcon(tag.originespeaker)}
                          size="small"
                          color={
                            getOrigineSpeakerColor(tag.originespeaker) as any
                          }
                        />
                      </TableCell>

                      <TableCell align="right">
                        {tag.turntaggedCount > 0 ? (
                          <Chip
                            label={tag.turntaggedCount.toLocaleString()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            0
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {tag.nextTurnTaggedCount > 0 ? (
                          <Chip
                            label={tag.nextTurnTaggedCount.toLocaleString()}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            0
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          label={tag.totalUsage.toLocaleString()}
                          size="small"
                          color={tag.totalUsage > 0 ? "success" : "default"}
                          variant={tag.totalUsage > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 300 }}>
                        {tag.turntaggedExamples.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="primary">
                              Turntagged:
                            </Typography>
                            {tag.turntaggedExamples.map((example, i) => (
                              <Typography
                                key={i}
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                • {example}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {tag.nextTurnTaggedExamples.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="secondary">
                              Next Turn:
                            </Typography>
                            {tag.nextTurnTaggedExamples.map((example, i) => (
                              <Typography
                                key={i}
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                • {example}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {familyStats.length === 0 && (
        <Alert severity="warning">Aucune donnée trouvée dans turntagged.</Alert>
      )}
    </Paper>
  );
}
