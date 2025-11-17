import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { BarChart, Person, Phone, Tag, NextPlan } from "@mui/icons-material";

// ========================================
// INTERFACES
// ========================================

interface TagUsageExample {
  verbatim: string;
  next_turn_verbatim: string;
  call_id: string;
  speaker: string;
  context: "tag" | "next_turn_tag";
}

interface TagUsageStats {
  totalUsage: number;
  asTag: number;
  asNextTurnTag: number;
  examples: TagUsageExample[];
  speakers: string[];
  callsCount: number;
  avgDuration: number;
}

interface TagStatsDisplay {
  tagId: number;
  tagLabel: string;
  stats: TagUsageStats;
  isLoading: boolean;
  error: string | null;
}

interface TagUsageStatsProps {
  tagStatsDisplay: TagStatsDisplay;
  onClose?: () => void;
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

const TagUsageStats: React.FC<TagUsageStatsProps> = ({
  tagStatsDisplay,
  onClose,
}) => {
  const theme = useTheme();
  const { tagLabel, stats, isLoading, error } = tagStatsDisplay;

  // ========================================
  // STYLES ADAPTATIFS AU THÈME
  // ========================================

  const getAdaptiveStyles = () => ({
    mainContainer: {
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.grey[50], 0.9),
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      padding: 3,
      marginTop: 2,
      boxShadow: theme.shadows[2],
    },

    headerContainer: {
      display: "flex",
      alignItems: "center",
      gap: 1,
      marginBottom: 2,
    },

    headerIcon: {
      color:
        theme.palette.mode === "dark"
          ? theme.palette.primary.light
          : theme.palette.primary.main,
    },

    metricsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 1,
      marginBottom: 2,
    },

    speakersContainer: {
      marginBottom: 2,
    },

    speakersChipsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 0.5,
    },

    examplesContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
    },

    exampleCard: {
      padding: 2,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.default, 0.6)
          : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: theme.palette.primary.main,
        boxShadow: theme.shadows[3],
      },
    },

    exampleHeader: {
      display: "flex",
      alignItems: "center",
      gap: 1,
      marginBottom: 1,
      flexWrap: "wrap",
    },

    verbatimText: {
      marginBottom: 1,
      padding: 1,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.info.main, 0.1)
          : alpha(theme.palette.info.main, 0.05),
      borderRadius: 1,
      borderLeft: `3px solid ${theme.palette.info.main}`,
    },

    nextTurnText: {
      padding: 1,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.success.main, 0.05),
      borderRadius: 1,
      borderLeft: `3px solid ${theme.palette.success.main}`,
    },

    loadingContainer: {
      display: "flex",
      alignItems: "center",
      gap: 1,
      padding: 2,
    },
  });

  const styles = getAdaptiveStyles();

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const getContextChipProps = (context: "tag" | "next_turn_tag") => {
    if (context === "tag") {
      return {
        label: "Tag principal",
        color: "primary" as const,
        icon: <Tag fontSize="small" />,
      };
    } else {
      return {
        label: "Tag suivant",
        color: "secondary" as const,
        icon: <NextPlan fontSize="small" />,
      };
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // ========================================
  // RENDU DES SECTIONS
  // ========================================

  const renderLoadingState = () => (
    <Box sx={styles.loadingContainer}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">
        Chargement des statistiques...
      </Typography>
    </Box>
  );

  const renderErrorState = () => (
    <Alert severity="error" sx={{ marginTop: 1 }}>
      Erreur lors du chargement des statistiques : {error}
    </Alert>
  );

  const renderMetrics = () => (
    <Box sx={styles.metricsContainer}>
      <Chip
        icon={<BarChart fontSize="small" />}
        label={`${stats.totalUsage} utilisations totales`}
        color="primary"
        variant="outlined"
        sx={{ fontWeight: "bold" }}
      />
      <Chip
        icon={<Tag fontSize="small" />}
        label={`${stats.asTag} comme tag principal`}
        color="success"
        variant="outlined"
      />
      <Chip
        icon={<NextPlan fontSize="small" />}
        label={`${stats.asNextTurnTag} comme tag suivant`}
        color="info"
        variant="outlined"
      />
      <Chip
        icon={<Phone fontSize="small" />}
        label={`${stats.callsCount} appels différents`}
        color="warning"
        variant="outlined"
      />
    </Box>
  );

  const renderSpeakers = () => {
    if (stats.speakers.length === 0) return null;

    return (
      <Box sx={styles.speakersContainer}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Person fontSize="small" />
          Speakers qui utilisent ce tag :
        </Typography>
        <Box sx={styles.speakersChipsContainer}>
          {stats.speakers.map((speaker, index) => (
            <Chip
              key={index}
              label={speaker}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.text.primary, 0.1)
                    : alpha(theme.palette.text.primary, 0.05),
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderExamples = () => {
    if (stats.examples.length === 0) return null;

    return (
      <Box>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          💬 Exemples de verbatims :
        </Typography>
        <Box sx={styles.examplesContainer}>
          {stats.examples.map((example, index) => {
            const contextProps = getContextChipProps(example.context);

            return (
              <Paper key={index} sx={styles.exampleCard}>
                <Box sx={styles.exampleHeader}>
                  <Chip {...contextProps} size="small" />
                  <Chip
                    icon={<Person fontSize="small" />}
                    label={example.speaker}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    📞 {example.call_id}
                  </Typography>
                </Box>

                <Box sx={styles.verbatimText}>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    💬 Verbatim :
                  </Typography>
                  <Typography variant="body2">
                    {truncateText(example.verbatim)}
                  </Typography>
                </Box>

                {example.next_turn_verbatim && (
                  <Box sx={styles.nextTurnText}>
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      ↪️ Réponse suivante :
                    </Typography>
                    <Typography variant="body2">
                      {truncateText(example.next_turn_verbatim)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderEmptyState = () => (
    <Alert
      severity="info"
      sx={{
        marginTop: 1,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.info.main, 0.1)
            : alpha(theme.palette.info.main, 0.05),
      }}
    >
      Ce tag n'est utilisé dans aucun appel pour le moment.
    </Alert>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <Paper sx={styles.mainContainer}>
      {/* En-tête */}
      <Box sx={styles.headerContainer}>
        <BarChart sx={styles.headerIcon} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Statistiques d'utilisation - "{tagLabel}"
        </Typography>
        {onClose && (
          <Chip
            label="Fermer"
            size="small"
            variant="outlined"
            onClick={onClose}
            sx={{ cursor: "pointer" }}
          />
        )}
      </Box>

      {/* États de chargement */}
      {isLoading && renderLoadingState()}
      {error && renderErrorState()}

      {/* Contenu principal */}
      {!isLoading && !error && (
        <Box>
          {/* Métriques */}
          {renderMetrics()}

          {/* Speakers */}
          {renderSpeakers()}

          {/* Exemples */}
          {stats.examples.length > 0 ? renderExamples() : renderEmptyState()}
        </Box>
      )}
    </Paper>
  );
};

export default TagUsageStats;
