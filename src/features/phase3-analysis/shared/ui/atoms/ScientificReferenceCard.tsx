// src/app/(protected)/analysis/components/shared/atoms/ScientificReferenceCard.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import {
  Science as ScienceIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AlgorithmIcon,
  ExpandMore as ExpandIcon,
  Link as LinkIcon,
  School as AcademicIcon,
} from "@mui/icons-material";

// Types pour les références scientifiques
interface ScientificSource {
  authors: string[];
  year: number;
  title: string;
  journal?: string;
  doi?: string;
  url?: string;
  type: "article" | "book" | "conference" | "thesis";
}

interface AlgorithmPrinciple {
  name: string;
  description: string;
  keyPoints: string[];
  complexity: "low" | "medium" | "high";
  domain: "cognitive" | "linguistic" | "temporal" | "hybrid";
}

interface ScientificReferenceCardProps {
  principle: AlgorithmPrinciple;
  sources: ScientificSource[];
  variant?: "compact" | "detailed" | "minimal";
  showExpandButton?: boolean;
}

const ScientificReferenceCard: React.FC<ScientificReferenceCardProps> = ({
  principle,
  sources,
  variant = "compact",
  showExpandButton = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Styles adaptatifs
  const getAdaptiveStyles = () => ({
    card: {
      p: variant === "minimal" ? 2 : 3,
      borderRadius: 2,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.grey[50], 0.9),
      border: `1px solid ${
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.main, 0.2)
      }`,
      transition: "all 0.3s ease-in-out",
      "&:hover": {
        borderColor: alpha(theme.palette.primary.main, 0.5),
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`
            : `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
    },
    principleIcon: {
      color: getDomainColor(principle.domain),
      mr: 1,
    },
    complexityChip: {
      fontSize: "0.7rem",
      height: 20,
      backgroundColor: getComplexityColor(principle.complexity),
      color: theme.palette.getContrastText(
        getComplexityColor(principle.complexity)
      ),
    },
    sourceItem: {
      p: 1.5,
      mb: 1,
      borderRadius: 1,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.default, 0.3)
          : alpha(theme.palette.grey[100], 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
    },
  });

  // Couleurs par domaine
  function getDomainColor(domain: string) {
    const colors = {
      cognitive: theme.palette.primary.main,
      linguistic: theme.palette.secondary.main,
      temporal: theme.palette.warning.main,
      hybrid: theme.palette.success.main,
    };
    return colors[domain as keyof typeof colors] || theme.palette.primary.main;
  }

  // Couleurs par complexité
  function getComplexityColor(complexity: string) {
    const colors = {
      low: theme.palette.success.main,
      medium: theme.palette.warning.main,
      high: theme.palette.error.main,
    };
    return colors[complexity as keyof typeof colors] || theme.palette.info.main;
  }

  // Icône par type de source
  function getSourceTypeIcon(type: string) {
    const icons = {
      article: <ScienceIcon fontSize="small" />,
      book: <AcademicIcon fontSize="small" />,
      conference: <PsychologyIcon fontSize="small" />,
      thesis: <AcademicIcon fontSize="small" />,
    };
    return (
      icons[type as keyof typeof icons] || <ScienceIcon fontSize="small" />
    );
  }

  // Formatage des auteurs
  function formatAuthors(authors: string[]) {
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} et al.`;
  }

  const styles = getAdaptiveStyles();

  // Vue minimale
  if (variant === "minimal") {
    return (
      <Paper sx={styles.card}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AlgorithmIcon sx={styles.principleIcon} />
          <Typography variant="body2" fontWeight="medium">
            {principle.name}
          </Typography>
          <Chip
            label={principle.complexity}
            size="small"
            sx={styles.complexityChip}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block" }}
        >
          {sources.length} source{sources.length > 1 ? "s" : ""} scientifique
          {sources.length > 1 ? "s" : ""}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={styles.card}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <AlgorithmIcon sx={styles.principleIcon} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {principle.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Domaine: {principle.domain} • Complexité: {principle.complexity}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${principle.complexity} complexity`}
            size="small"
            sx={styles.complexityChip}
          />
          {showExpandButton && (
            <Tooltip title={expanded ? "Réduire" : "Développer"}>
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <ExpandIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Description du principe */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {principle.description}
      </Typography>

      {/* Points clés (toujours visibles en mode détaillé) */}
      {variant === "detailed" && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🔑 Points clés:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {principle.keyPoints.map((point, index) => (
              <Typography
                key={index}
                component="li"
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                {point}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Section sources scientifiques */}
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <ScienceIcon color="primary" />
        <Typography variant="subtitle2" fontWeight="bold">
          Sources Scientifiques ({sources.length})
        </Typography>
      </Box>

      {/* Liste des sources - toujours visible en version compacte */}
      <Box>
        {sources
          .slice(0, expanded || variant === "detailed" ? sources.length : 2)
          .map((source, index) => (
            <Box key={index} sx={styles.sourceItem}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                {getSourceTypeIcon(source.type)}
                <Typography variant="body2" fontWeight="medium">
                  {formatAuthors(source.authors)} ({source.year})
                </Typography>
                {source.url && (
                  <Tooltip title="Ouvrir la source">
                    <IconButton
                      size="small"
                      onClick={() => window.open(source.url, "_blank")}
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Typography variant="body2" sx={{ fontStyle: "italic", mb: 0.5 }}>
                {source.title}
              </Typography>

              {source.journal && (
                <Typography variant="caption" color="text.secondary">
                  {source.journal}
                </Typography>
              )}

              {source.doi && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  DOI: {source.doi}
                </Typography>
              )}
            </Box>
          ))}

        {!expanded && sources.length > 2 && variant !== "detailed" && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setExpanded(true)}
          >
            Voir {sources.length - 2} source{sources.length - 2 > 1 ? "s" : ""}{" "}
            de plus...
          </Typography>
        )}
      </Box>

      {/* Contenu étendu */}
      <Collapse in={expanded}>
        {variant !== "detailed" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔑 Points clés de l'algorithme:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {principle.keyPoints.map((point, index) => (
                <Typography
                  key={index}
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {point}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default ScientificReferenceCard;
