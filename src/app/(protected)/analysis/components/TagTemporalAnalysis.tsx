// components/analysis/TagTemporalAnalysis.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import { Info, Refresh, Download } from "@mui/icons-material";
import { useTemporalAnalysis } from "../hooks/useTemporalAnalysis";

const TagTemporalAnalysis: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
  const [showTooltips, setShowTooltips] = useState(false);

  // Utilisation du hook optimisé
  const {
    data,
    loading,
    error,
    origines,
    derivedStats,
    getFilteredData,
    getScatterPlotData,
    refetch,
  } = useTemporalAnalysis(selectedOrigin);

  // Couleurs par famille
  const familyColors: Record<string, string> = {
    ENGAGEMENT: "#FF6B6B",
    REFLET: "#4ECDC4",
    EXPLICATION: "#45B7D1",
    OUVERTURE: "#96CEB4",
    CLIENT: "#F39C12",
    REPONSE: "#9B59B6",
    AUTRE: "#95A5A6",
  };

  // Données filtrées par famille
  const filteredData = React.useMemo(() => {
    return getFilteredData(selectedFamily);
  }, [getFilteredData, selectedFamily]);

  // Génération du nuage de points optimisé
  const generateScatterPlot = () => {
    if (!data || filteredData.length === 0) return null;

    const families =
      selectedFamily === "all"
        ? Object.keys(data.familyStats)
        : [selectedFamily];

    const svgHeight = families.length * 120 + 80;
    const svgWidth = 900;
    const plotWidth = svgWidth - 120;
    const plotHeight = svgHeight - 80;

    return (
      <Box
        sx={{ width: "100%", height: `${svgHeight}px`, position: "relative" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          {/* Fond avec grille */}
          <defs>
            <pattern
              id="grid"
              width="90"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 90 0 L 0 0 0 40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "#e8f5e8", stopOpacity: 1 }}
              />
              <stop
                offset="33%"
                style={{ stopColor: "#fff3cd", stopOpacity: 1 }}
              />
              <stop
                offset="66%"
                style={{ stopColor: "#f8d7da", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#d1ecf1", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>

          {/* Fond dégradé */}
          <rect
            x="60"
            y="40"
            width={plotWidth}
            height={plotHeight}
            fill="url(#timeGradient)"
            opacity="0.3"
          />

          {/* Lignes de division temporelle */}
          <line
            x1={60 + plotWidth * 0.33}
            y1="40"
            x2={60 + plotWidth * 0.33}
            y2={plotHeight + 40}
            stroke="#bdbdbd"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <line
            x1={60 + plotWidth * 0.66}
            y1="40"
            x2={60 + plotWidth * 0.66}
            y2={plotHeight + 40}
            stroke="#bdbdbd"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Axes */}
          <line
            x1="60"
            y1="40"
            x2="60"
            y2={plotHeight + 40}
            stroke="#333"
            strokeWidth="2"
          />
          <line
            x1="60"
            y1={plotHeight + 40}
            x2={plotWidth + 60}
            y2={plotHeight + 40}
            stroke="#333"
            strokeWidth="2"
          />

          {/* Labels temporels */}
          <text
            x={60 + plotWidth * 0.165}
            y={svgHeight - 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            fontWeight="bold"
          >
            Début (0-33%)
          </text>
          <text
            x={60 + plotWidth * 0.5}
            y={svgHeight - 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            fontWeight="bold"
          >
            Milieu (33-66%)
          </text>
          <text
            x={60 + plotWidth * 0.835}
            y={svgHeight - 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            fontWeight="bold"
          >
            Fin (66-100%)
          </text>

          {/* Titre de l'axe X */}
          <text
            x={60 + plotWidth / 2}
            y={svgHeight - 5}
            textAnchor="middle"
            fontSize="14"
            fill="#333"
            fontWeight="bold"
          >
            Position dans l'appel (%)
          </text>

          {/* Points du nuage */}
          {families.map((family, familyIndex) => {
            const familyData = filteredData.filter(
              (item) => item.family === family
            );
            const familyColor = familyColors[family] || "#999";
            const yBase = 60 + familyIndex * 120;
            const yRange = 80; // Espace vertical pour chaque famille

            return (
              <g key={family}>
                {/* Label de la famille */}
                <text
                  x="30"
                  y={yBase + yRange / 2 + 5}
                  fontSize="14"
                  fontWeight="bold"
                  fill={familyColor}
                  textAnchor="middle"
                >
                  {family}
                </text>

                {/* Rectangle de fond pour la famille */}
                <rect
                  x="60"
                  y={yBase}
                  width={plotWidth}
                  height={yRange}
                  fill={familyColor}
                  fillOpacity="0.05"
                  stroke={familyColor}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />

                {/* Points avec dispersion intelligente */}
                {familyData.map((item, index) => {
                  const x = 60 + (item.relative_position / 100) * plotWidth;

                  // Dispersion verticale intelligente pour éviter les superpositions
                  const yOffset = (index % 10) * 8 - 32; // Répartition sur 10 niveaux
                  const y = yBase + yRange / 2 + yOffset;

                  const pointSize = 6;
                  const strokeWidth = item.speaker === "conseiller" ? 2 : 1;

                  return (
                    <g key={item.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={pointSize}
                        fill={familyColor}
                        fillOpacity="0.7"
                        stroke={
                          item.speaker === "conseiller" ? "#333" : familyColor
                        }
                        strokeWidth={strokeWidth}
                        style={{ cursor: "pointer" }}
                      />
                      {/* Tooltip au survol */}
                      <title>
                        {`${item.tag} (${item.relative_position}%)\n${
                          item.speaker
                        }\n"${item.verbatim.substring(0, 100)}..."`}
                      </title>
                    </g>
                  );
                })}

                {/* Ligne de position moyenne */}
                {data?.familyStats[family] && (
                  <line
                    x1={
                      60 +
                      (data.familyStats[family].avgPosition / 100) * plotWidth
                    }
                    y1={yBase}
                    x2={
                      60 +
                      (data.familyStats[family].avgPosition / 100) * plotWidth
                    }
                    y2={yBase + yRange}
                    stroke={familyColor}
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Analyse des données temporelles...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des données: {error}
        <Button onClick={refetch} sx={{ ml: 2 }}>
          Réessayer
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Aucune donnée disponible pour l'analyse temporelle.
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête avec statistiques globales */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            📍 Analyse Temporelle des Tags
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Distribution des {data.totalTags} tags dans {data.uniqueCalls}{" "}
            appels
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualiser les données">
            <IconButton onClick={refetch} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exporter les données">
            <IconButton onClick={() => console.log("Export temporel")}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Métriques dérivées */}
      {derivedStats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {derivedStats.mostActiveFamily}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Famille la plus active
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {derivedStats.averageTagsPerCall}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tags moyens par appel
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.avgCallDuration}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Durée moyenne des appels
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {derivedStats.totalFamilies}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Familles de tags actives
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Contrôles */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Origine</InputLabel>
          <Select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            label="Origine"
          >
            <MenuItem value="all">Toutes les origines</MenuItem>
            {origines.map((origine) => (
              <MenuItem key={origine} value={origine}>
                {origine}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Famille</InputLabel>
          <Select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            label="Famille"
          >
            <MenuItem value="all">Toutes les familles</MenuItem>
            {Object.keys(data.familyStats).map((family) => (
              <MenuItem key={family} value={family}>
                {family}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Statistiques par famille */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {Object.values(data.familyStats).map((stat) => (
          <Card key={stat.family} sx={{ minWidth: 240 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: stat.color,
                    mr: 1,
                  }}
                />
                <Typography variant="h6">{stat.family}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stat.count} occurrences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Position moyenne: {stat.avgPosition}%
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`Début: ${stat.distribution.early}%`}
                  size="small"
                  color={stat.distribution.early > 40 ? "primary" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={`Milieu: ${stat.distribution.middle}%`}
                  size="small"
                  color={stat.distribution.middle > 40 ? "primary" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={`Fin: ${stat.distribution.late}%`}
                  size="small"
                  color={stat.distribution.late > 40 ? "primary" : "default"}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Nuage de points */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Distribution Temporelle Interactive
          </Typography>
          <Tooltip title="Afficher/masquer les informations détaillées">
            <IconButton onClick={() => setShowTooltips(!showTooltips)}>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chaque point représente un tag positionné selon sa place dans l'appel.
          Les traits en pointillés montrent la position moyenne par famille. Les
          bordures épaisses indiquent les tags du conseiller.
        </Typography>

        {generateScatterPlot()}

        {/* Légende */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#999",
                border: "2px solid #333",
              }}
            />
            <Typography variant="caption">Conseiller</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#999",
                border: "1px solid #999",
              }}
            />
            <Typography variant="caption">Client</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 2,
                backgroundColor: "#999",
                borderRadius: 1,
              }}
            />
            <Typography variant="caption">Position moyenne</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Détails des données */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Échantillon de Données ({Math.min(filteredData.length, 50)} /{" "}
          {filteredData.length})
        </Typography>

        {filteredData.length > 0 ? (
          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredData.slice(0, 50).map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  p: 2,
                  borderBottom: "1px solid #eee",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Chip
                      label={item.tag}
                      size="small"
                      sx={{
                        backgroundColor: item.color,
                        color: "white",
                        mr: 1,
                        fontWeight: "bold",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.family}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    "{item.verbatim.substring(0, 150)}
                    {item.verbatim.length > 150 ? "..." : ""}"
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Appel {item.call_id} • {item.start_time.toFixed(1)}s -{" "}
                    {item.end_time.toFixed(1)}s
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", minWidth: 100 }}>
                  <Typography variant="h6" color="primary">
                    {item.relative_position}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.speaker}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Durée: {item.call_duration.toFixed(0)}s
                  </Typography>
                </Box>
              </Box>
            ))}

            {filteredData.length > 50 && (
              <Box sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  ... et {filteredData.length - 50} autres éléments
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucune donnée à afficher pour les filtres sélectionnés.
          </Typography>
        )}
      </Paper>

      {/* Distribution temporelle globale */}
      {derivedStats && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Distribution Temporelle Globale
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Répartition des {data.totalTags} tags dans la chronologie des
                appels
              </Typography>
            </Box>
          </Box>

          {/* Graphique en barres de la distribution */}
          <Box
            sx={{
              display: "flex",
              alignItems: "end",
              height: 100,
              gap: 1,
              mb: 2,
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: `${derivedStats.temporalDistribution.early}px`,
                  backgroundColor: "#4CAF50",
                  borderRadius: "4px 4px 0 0",
                  minHeight: 5,
                }}
              />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {derivedStats.temporalDistribution.early}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Début
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: `${derivedStats.temporalDistribution.middle}px`,
                  backgroundColor: "#FF9800",
                  borderRadius: "4px 4px 0 0",
                  minHeight: 5,
                }}
              />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {derivedStats.temporalDistribution.middle}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Milieu
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: `${derivedStats.temporalDistribution.late}px`,
                  backgroundColor: "#2196F3",
                  borderRadius: "4px 4px 0 0",
                  minHeight: 5,
                }}
              />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {derivedStats.temporalDistribution.late}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fin
              </Typography>
            </Box>
          </Box>

          {/* Insights automatiques */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "action.hover",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              🔍 Insights Automatiques
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              {derivedStats.temporalDistribution.early > 40 && (
                <Typography component="li" variant="body2">
                  Forte concentration des tags en début d'appel (
                  {derivedStats.temporalDistribution.early}%)
                </Typography>
              )}
              {derivedStats.temporalDistribution.late > 40 && (
                <Typography component="li" variant="body2">
                  Concentration importante des tags en fin d'appel (
                  {derivedStats.temporalDistribution.late}%)
                </Typography>
              )}
              {derivedStats.temporalDistribution.middle > 40 && (
                <Typography component="li" variant="body2">
                  Répartition équilibrée avec un pic au milieu des appels (
                  {derivedStats.temporalDistribution.middle}%)
                </Typography>
              )}
              {derivedStats.averageTagsPerCall > 10 && (
                <Typography component="li" variant="body2">
                  Appels très riches en interactions (
                  {derivedStats.averageTagsPerCall} tags/appel)
                </Typography>
              )}
              {data.avgCallDuration > 300 && (
                <Typography component="li" variant="body2">
                  Appels de longue durée (moyenne:{" "}
                  {Math.round(data.avgCallDuration / 60)}min)
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TagTemporalAnalysis;
