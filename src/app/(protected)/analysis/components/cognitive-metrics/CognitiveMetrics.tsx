// src/components/cognitive-metrics/CognitiveMetrics.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  Speed as AutomaticIcon,
  Memory as LoadIcon,
  TrendingUp as ContextIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  Info as InfoIcon,
  Science as ThesisIcon,
  Assessment as MetricsIcon,
} from "@mui/icons-material";

import { useCognitiveMetricsByFamily } from "./hooks/useCognitiveMetricsByFamily";

// Structure exacte selon la thèse 3.3.4
interface ThesisIndicator {
  id: string;
  name: string;
  algorithm: string;
  currentValue: string;
  implementationStatus: "implemented" | "partial" | "missing";
  description: string;
  expectedRange?: string;
}

interface ThesisCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "primary" | "warning" | "success";
  indicators: ThesisIndicator[];
}

const CognitiveMetrics: React.FC = () => {
  const theme = useTheme();
  const { familyMetrics, globalMetrics, comparativeAnalysis, loading, error } =
    useCognitiveMetricsByFamily();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAlgorithmDetails, setShowAlgorithmDetails] = useState(false);

  // Fonction pour calculer les valeurs actuelles basées sur les données
  const calculateCurrentValue = (indicatorId: string): string => {
    switch (indicatorId) {
      case "turn_duration":
        return "Non calculé"; // À implémenter avec start_time/end_time
      case "prosodic_fluency":
        return "Non disponible"; // Nécessite analyse audio
      case "effort_markers":
        const avgEffort =
          familyMetrics.reduce((sum, f) => sum + f.cognitiveLoad, 0) /
          (familyMetrics.length || 1);
        return `${avgEffort.toFixed(1)}%`;
      case "direct_reactions":
        const avgAcceptance =
          familyMetrics.reduce((sum, f) => sum + f.acceptanceRate, 0) /
          (familyMetrics.length || 1);
        return `${avgAcceptance.toFixed(1)}%`;
      case "lexical_reprises":
        return "Partiellement calculé"; // Implémentation basique
      case "cognitive_load_score":
        const avgLoad =
          familyMetrics.reduce((sum, f) => sum + f.cognitiveLoad, 0) /
          (familyMetrics.length || 1);
        return `${avgLoad.toFixed(1)}%`;
      case "resistance_patterns":
        const avgResistance =
          familyMetrics.reduce((sum, f) => sum + f.resistanceRate, 0) /
          (familyMetrics.length || 1);
        return `${avgResistance.toFixed(1)}%`;
      case "contextual_vulnerability":
        return "Non calculé"; // À implémenter
      case "fluency_composite":
        return "Partiellement calculé"; // Manque composante prosodique
      case "load_composite":
        return "Partiellement calculé"; // Manque vulnérabilité contextuelle
      default:
        return "N/A";
    }
  };

  // Structure exacte selon la thèse
  const thesisCategories: ThesisCategory[] = [
    {
      id: "automatic_processing",
      title: "Indicateurs de Traitement Automatique",
      subtitle: "Descriptions d'actions",
      icon: <AutomaticIcon />,
      color: "primary",
      indicators: [
        {
          id: "turn_duration",
          name: "Durée des tours clients",
          algorithm: `duration = turn.end_time - turn.start_time
if duration <= 3.0: return 1.0      # Traitement fluide
elif duration <= 6.0: return 0.5    # Traitement modéré  
else: return 0.0                     # Traitement laborieux`,
          currentValue: calculateCurrentValue("turn_duration"),
          implementationStatus: "missing",
          description:
            "Indicateurs temporels (calcul automatique sur les données timing)",
          expectedRange: "≤ 3s = optimal, 3-6s = modéré, >6s = laborieux",
        },
        {
          id: "prosodic_fluency",
          name: "Fluidité prosodique",
          algorithm: `# Débit de parole (syllabes/seconde)
speech_rate = count_syllables(audio_segment) / audio_duration(audio_segment)
rate_score = 1.0 if 3.0 <= speech_rate <= 6.0 else 0.0

# Ratio pauses/parole
pause_ratio = total_pause_duration(audio_segment) / audio_duration(audio_segment)
pause_score = 1.0 if pause_ratio < 0.2 else 0.0

# Stabilité F0 (intonation)
f0_variation = calculate_f0_coefficient_variation(audio_segment)
f0_score = 1.0 if f0_variation < 0.3 else 0.0

return (rate_score + pause_score + f0_score) / 3`,
          currentValue: calculateCurrentValue("prosodic_fluency"),
          implementationStatus: "missing",
          description: "Fluidité prosodique (analyse audio automatique)",
          expectedRange: "Score composite 0-1",
        },
        {
          id: "effort_markers",
          name: "Absence de marqueurs d'effort",
          algorithm: `effort_markers = ["euh", "attendez", "alors", "ben", "donc", "en fait"]
hesitation_markers = ["comment", "pardon", "qu'est-ce que", "je ne comprends pas"]

effort_count = sum(1 for marker in effort_markers if marker in verbatim.lower())
hesitation_count = sum(1 for marker in hesitation_markers if marker in verbatim.lower())

total_words = len(verbatim.split())
marker_ratio = (effort_count + hesitation_count) / max(total_words, 1)

return 1.0 if marker_ratio < 0.1 else max(0.0, 1.0 - marker_ratio * 5)`,
          currentValue: calculateCurrentValue("effort_markers"),
          implementationStatus: "implemented",
          description: "Indicateurs linguistiques (analyse NLP automatique)",
          expectedRange: "0-1 (1 = aucun marqueur d'effort)",
        },
        {
          id: "direct_reactions",
          name: "Réactions directes",
          algorithm: `direct_positive = ["d'accord", "oui", "très bien", "merci", "parfait"]
clarification_requests = ["comment", "pourquoi", "qu'est-ce que", "pouvez-vous"]

if any(marker in verbatim.lower() for marker in direct_positive):
    return 1.0  # Réaction directe positive
elif any(marker in verbatim.lower() for marker in clarification_requests):
    return 0.0  # Demande de clarification (pas direct)
else:
    return 0.5  # Réaction neutre`,
          currentValue: calculateCurrentValue("direct_reactions"),
          implementationStatus: "implemented",
          description: "Réactions directes (classification automatique)",
          expectedRange: "% de réactions directes positives",
        },
        {
          id: "lexical_reprises",
          name: "Reprises lexicales",
          algorithm: `# Extraction des verbes d'action du conseiller
conseiller_actions = extract_action_verbs(conseiller_verbatim)
client_words = client_verbatim.lower().split()

# Compte des reprises d'actions
reprises = sum(1 for action in conseiller_actions if action.lower() in client_words)

return reprises / max(len(conseiller_actions), 1)`,
          currentValue: calculateCurrentValue("lexical_reprises"),
          implementationStatus: "partial",
          description: "Alignement linguistique automatique",
          expectedRange: "Ratio reprises/verbes_conseiller",
        },
      ],
    },
    {
      id: "cognitive_load",
      title: "Indicateurs de Charge Cognitive",
      subtitle: "Explications",
      icon: <LoadIcon />,
      color: "warning",
      indicators: [
        {
          id: "cognitive_load_score",
          name: "Durée prolongée et marqueurs d'effort",
          algorithm: `# Durée du tour (pénalité pour tours longs)
duration = tour_client.end_time - tour_client.start_time
duration_penalty = max(0.0, (duration - 6.0) / 10.0)  # Pénalité au-delà de 6s

# Marqueurs linguistiques d'effort
effort_score = 1.0 - detect_effort_markers(tour_client.verbatim)

# Complexité syntaxique
complexity_score = calculate_syntactic_complexity(tour_client.verbatim)

return min(1.0, duration_penalty + (1.0 - effort_score) + complexity_score)`,
          currentValue: calculateCurrentValue("cognitive_load_score"),
          implementationStatus: "partial",
          description: "Indicateurs d'effort cognitif (calcul automatique)",
          expectedRange: "0-1 (0 = fluide, 1 = surcharge)",
        },
        {
          id: "resistance_patterns",
          name: "Interruptions et changements de sujet",
          algorithm: `resistance_indicators = {
    'interruption': 0,
    'topic_change': 0,
    'explicit_objection': 0
}

for i, turn in enumerate(conversation_sequence):
    if turn.speaker == 'client':
        # Détection d'interruption (tour client avant fin tour conseiller)
        if i > 0 and turn.start_time < conversation_sequence[i-1].end_time:
            resistance_indicators['interruption'] += 1
        
        # Objections explicites
        objection_markers = ["mais", "non", "c'est inadmissible", "je ne suis pas d'accord"]
        if any(marker in turn.verbatim.lower() for marker in objection_markers):
            resistance_indicators['explicit_objection'] += 1
        
        # Changement de sujet (analyse sémantique)
        if i > 1 and semantic_distance(turn.verbatim, conversation_sequence[i-2].verbatim) > 0.7:
            resistance_indicators['topic_change'] += 1

return resistance_indicators`,
          currentValue: calculateCurrentValue("resistance_patterns"),
          implementationStatus: "partial",
          description:
            "Indicateurs de résistance/évitement (détection automatique)",
          expectedRange: "Comptage des patterns de résistance",
        },
      ],
    },
    {
      id: "contextual_indicators",
      title: "Indicateurs Contextuels",
      subtitle: "Mesure de dégradation",
      icon: <ContextIcon />,
      color: "success",
      indicators: [
        {
          id: "contextual_vulnerability",
          name: "Sensibilité au stress et dégradation progressive",
          algorithm: `# Mesure du stress émotionnel cumulé
stress_indicators = []
for pair in conversation_history:
    if pair.client_reaction == 'CLIENT_NEGATIF':
        stress_indicators.append(1)
    elif pair.client_reaction == 'CLIENT_POSITIF':
        stress_indicators.append(-1)
    else:
        stress_indicators.append(0)

# Stress cumulé avec décroissance temporelle
current_stress = sum(indicator * (0.8 ** i) for i, indicator in enumerate(reversed(stress_indicators[-5:])))

# Efficacité comparative selon le niveau de stress
if current_stress > 2:  # Contexte stressé
    stress_context = "HIGH"
elif current_stress < -1:  # Contexte apaisé  
    stress_context = "LOW"
else:
    stress_context = "MEDIUM"

return {
    'stress_level': current_stress,
    'stress_context': stress_context,
    'conversation_position': len(conversation_history)
}`,
          currentValue: calculateCurrentValue("contextual_vulnerability"),
          implementationStatus: "missing",
          description: "Sensibilité au stress et dégradation progressive",
          expectedRange: "Niveau de stress contextuel",
        },
      ],
    },
  ];

  // Scores composites selon la thèse
  const compositeScores = [
    {
      name: "Score de fluidité cognitive",
      formula:
        "0.4 × Score_temporel + 0.35 × Score_linguistique + 0.25 × Score_prosodique",
      currentValue: calculateCurrentValue("fluency_composite"),
      status: "partial",
    },
    {
      name: "Score de charge cognitive",
      formula:
        "0.4 × Complexité_stimulus + 0.35 × Effort_traitement + 0.25 × Vulnérabilité_contexte",
      currentValue: calculateCurrentValue("load_composite"),
      status: "partial",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            🧠 Analyse des Indicateurs selon la Thèse (Section 3.3.4)
          </Typography>
          <Typography variant="body2">
            Calcul des métriques cognitives selon l'opérationnalisation proposée
            dans la thèse
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            ❌ Erreur lors de l'analyse cognitive
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "success";
      case "partial":
        return "warning";
      case "missing":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "implemented":
        return "✅ Implémenté";
      case "partial":
        return "⚠️ Partiel";
      case "missing":
        return "❌ Manquant";
      default:
        return "❓ Inconnu";
    }
  };

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: "100%" }}>
      {/* En-tête avec référence exacte à la thèse */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              <ThesisIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold">
                🧠 Opérationnalisation des Mécanismes Cognitifs
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Indicateurs empiriques selon la thèse (Section 3.3.4)
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => setShowAlgorithmDetails(true)}
            sx={{ height: "fit-content" }}
          >
            Algorithmes Détaillés
          </Button>
        </Box>

        {/* Résumé de l'implémentation */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 État d'Implémentation des Indicateurs de la Thèse
          </Typography>
          <Typography variant="body2">
            <strong>
              Analyse de{" "}
              {familyMetrics.reduce((sum, f) => sum + f.totalUsage, 0)}{" "}
              interactions
            </strong>{" "}
            •<strong> Implémentés:</strong> 3/8 indicateurs •
            <strong> Partiels:</strong> 3/8 indicateurs •
            <strong> Manquants:</strong> 2/8 indicateurs
          </Typography>
        </Alert>
      </Box>

      {/* Catégories d'indicateurs selon la thèse */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {thesisCategories.map((category) => (
          <Card
            key={category.id}
            sx={{
              height: "100%",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <CardContent>
              {/* En-tête de catégorie */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: `${category.color}.light`,
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  {category.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {category.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.subtitle}
                  </Typography>
                </Box>
              </Box>

              {/* Liste des indicateurs avec tooltips et calculs par famille */}
              <Box sx={{ space: 1 }}>
                {category.indicators.map((indicator) => {
                  // Calculs par famille pour cet indicateur
                  const familyResults = familyMetrics.map((family) => {
                    let value = "N/A";
                    switch (indicator.id) {
                      case "effort_markers":
                        value = `${family.cognitiveLoad}%`;
                        break;
                      case "direct_reactions":
                        value = `${family.acceptanceRate}%`;
                        break;
                      case "cognitive_load_score":
                        value = `${family.cognitiveLoad}%`;
                        break;
                      case "resistance_patterns":
                        value = `${family.resistanceRate}%`;
                        break;
                      case "lexical_reprises":
                        value = "~Est.";
                        break;
                      default:
                        value = "N/C";
                    }
                    return { family: family.family, value };
                  });

                  return (
                    <Box
                      key={indicator.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 1,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "grey.800"
                            : "grey.50",
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      {/* En-tête indicateur avec tooltip */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            {indicator.name}
                            <Tooltip
                              title={
                                <Box sx={{ maxWidth: 500 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    📋 {indicator.name} - Algorithme de la Thèse
                                  </Typography>
                                  <Typography variant="body2" gutterBottom>
                                    <strong>Description:</strong>{" "}
                                    {indicator.description}
                                  </Typography>
                                  <Typography variant="body2" gutterBottom>
                                    <strong>Algorithme théorique:</strong>
                                  </Typography>
                                  <Paper
                                    sx={{
                                      p: 1,
                                      bgcolor: "grey.900",
                                      mt: 1,
                                      mb: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontFamily: "monospace",
                                        whiteSpace: "pre-line",
                                        color: "lightgreen",
                                        fontSize: "0.7rem",
                                      }}
                                    >
                                      {indicator.algorithm}
                                    </Typography>
                                  </Paper>
                                  <Typography variant="body2" gutterBottom>
                                    <strong>Plage attendue:</strong>{" "}
                                    {indicator.expectedRange}
                                  </Typography>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography
                                    variant="body2"
                                    color={
                                      indicator.implementationStatus ===
                                      "implemented"
                                        ? "success.main"
                                        : indicator.implementationStatus ===
                                          "partial"
                                        ? "warning.main"
                                        : "error.main"
                                    }
                                  >
                                    <strong>État actuel:</strong>{" "}
                                    {getStatusLabel(
                                      indicator.implementationStatus
                                    )}
                                  </Typography>
                                  {indicator.implementationStatus !==
                                    "implemented" && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <strong>Améliorations possibles:</strong>
                                      <br />
                                      {indicator.id === "turn_duration" &&
                                        "• Utiliser start_time/end_time de la DB\n• Calculer automatiquement les scores de fluidité"}
                                      {indicator.id === "prosodic_fluency" &&
                                        "• Intégrer pipeline d'analyse audio\n• Développer extraction syllabique\n• Mesurer F0 et pauses"}
                                      {indicator.id === "lexical_reprises" &&
                                        "• Extraction automatique verbes d'action\n• Modèle NLP pour classification\n• Alignement sémantique avancé"}
                                      {indicator.id ===
                                        "cognitive_load_score" &&
                                        "• Ajouter complexité syntaxique\n• Calculer vulnérabilité contextuelle\n• Pondération selon formule exacte"}
                                      {indicator.id === "resistance_patterns" &&
                                        "• Détection interruptions temporelles\n• Analyse sémantique changements sujet\n• Classification automatique objections"}
                                      {indicator.id ===
                                        "contextual_vulnerability" &&
                                        "• Tracking stress émotionnel cumulé\n• Décroissance temporelle\n• Position conversation"}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              placement="right"
                              arrow
                              PopperProps={{ style: { zIndex: 9999 } }}
                            >
                              <InfoIcon
                                sx={{
                                  fontSize: 16,
                                  ml: 1,
                                  opacity: 0.7,
                                  cursor: "help",
                                }}
                              />
                            </Tooltip>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {indicator.currentValue}
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusLabel(indicator.implementationStatus)}
                          color={
                            getStatusColor(
                              indicator.implementationStatus
                            ) as any
                          }
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>

                      {/* Calculs par famille */}
                      {indicator.implementationStatus === "implemented" &&
                        familyResults.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 0.5 }}
                            >
                              📊 Résultats par famille:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                alignItems: "center",
                              }}
                            >
                              {familyResults.map((result, index) => (
                                <Chip
                                  key={result.family}
                                  label={`${result.family}: ${result.value}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: "0.65rem",
                                    height: 20,
                                    color:
                                      result.family === "REFLET"
                                        ? "primary.main"
                                        : result.family === "OUVERTURE"
                                        ? "success.main"
                                        : result.family === "ENGAGEMENT"
                                        ? "warning.main"
                                        : "error.main",
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                      {/* Message pour indicateurs non implémentés */}
                      {indicator.implementationStatus !== "implemented" && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            {indicator.implementationStatus === "missing"
                              ? "💡 Données disponibles mais algorithme non implémenté"
                              : "⚠️ Implémentation basique, manque composantes de la formule théorique"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Scores composites selon la thèse */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <MetricsIcon sx={{ mr: 1 }} />
          Grille d'Analyse Cognitive Intégrée (Scores Composites)
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Score Composite</strong>
                </TableCell>
                <TableCell>
                  <strong>Formule (Thèse)</strong>
                </TableCell>
                <TableCell>
                  <strong>Valeur Actuelle</strong>
                </TableCell>
                <TableCell>
                  <strong>Statut</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {compositeScores.map((score) => (
                <TableRow key={score.name}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {score.name}
                      <Tooltip
                        title={
                          <Box sx={{ maxWidth: 600 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              🧮 {score.name} - Formule Composite
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Formule complète:</strong>
                            </Typography>
                            <Paper
                              sx={{ p: 1, bgcolor: "grey.900", mt: 1, mb: 2 }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: "monospace",
                                  color: "lightblue",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {score.name === "Score de fluidité cognitive"
                                  ? `def calculate_cognitive_fluency_score(conseiller_turn, client_turn, audio_data):
    # Composante temporelle (40%)
    temporal_score = calculate_turn_duration_score(client_turn)
    
    # Composante linguistique (35%)
    linguistic_score = (detect_effort_markers(client_turn.verbatim) + 
                       classify_direct_reaction(client_turn.verbatim)) / 2
    
    # Composante prosodique (25%)
    prosodic_score = calculate_prosodic_fluency(audio_data)
    
    return 0.4 * temporal_score + 0.35 * linguistic_score + 0.25 * prosodic_score`
                                  : `def calculate_cognitive_load_score(conseiller_turn, client_turn, context):
    # Complexité du stimulus (40%)
    stimulus_complexity = calculate_turn_complexity(conseiller_turn.verbatim)
    
    # Effort de traitement (35%)
    processing_effort = calculate_cognitive_load_score(client_turn)
    
    # Vulnérabilité contextuelle (25%)
    contextual_factor = context['stress_level'] / 5.0  # Normalisation
    
    return 0.4 * stimulus_complexity + 0.35 * processing_effort + 0.25 * contextual_factor`}
                              </Typography>
                            </Paper>
                            <Typography variant="body2" gutterBottom>
                              <strong>Composantes manquantes:</strong>
                            </Typography>
                            <Typography variant="body2" color="warning.main">
                              {score.name === "Score de fluidité cognitive"
                                ? "• Composante prosodique (25%) - nécessite analyse audio\n• Scores temporels automatiques\n• Pondération exacte selon la formule"
                                : "• Complexité syntaxique du stimulus\n• Vulnérabilité contextuelle\n• Stress level du contexte conversationnel"}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2">
                              <strong>Calcul actuel:</strong> Approximation
                              basée sur les indicateurs disponibles
                            </Typography>
                          </Box>
                        }
                        placement="right"
                        arrow
                        PopperProps={{ style: { zIndex: 9999 } }}
                      >
                        <InfoIcon
                          sx={{
                            fontSize: 16,
                            ml: 1,
                            opacity: 0.7,
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                  >
                    {score.formula}
                  </TableCell>
                  <TableCell>
                    <Box>
                      {score.currentValue}
                      {score.status === "partial" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          (Approximation)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(score.status)}
                      color={getStatusColor(score.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Validation automatique des hypothèses selon la thèse */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <ThesisIcon sx={{ mr: 1 }} />
          Pipeline de Validation Cognitive (selon la thèse)
        </Typography>

        <Box sx={{ space: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H1: Stratégies d'action → fluidité élevée
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Stratégies testées:</strong> ENGAGEMENT, OUVERTURE
              <br />
              <strong>Résultat attendu:</strong> fluency_score élevé +
              effectiveness = 1 si CLIENT_POSITIF
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics
                .filter((f) => ["ENGAGEMENT", "OUVERTURE"].includes(f.family))
                .map((family) => (
                  <Chip
                    key={family.family}
                    label={`${family.family}: ${family.acceptanceRate}% acceptation`}
                    color={family.acceptanceRate > 60 ? "success" : "warning"}
                    size="small"
                  />
                ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              💡 Moyenne:{" "}
              {(() => {
                const actionStrategies = familyMetrics.filter((f) =>
                  ["ENGAGEMENT", "OUVERTURE"].includes(f.family)
                );
                const avgAcceptance =
                  actionStrategies.reduce(
                    (sum, f) => sum + f.acceptanceRate,
                    0
                  ) / (actionStrategies.length || 1);
                return `${avgAcceptance.toFixed(
                  1
                )}% d'acceptation pour les stratégies d'action`;
              })()}
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H2: Explications → charge élevée
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Stratégie testée:</strong> EXPLICATION
              <br />
              <strong>Résultat attendu:</strong> load_score élevé + resistance =
              1 si CLIENT_NEGATIF
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics
                .filter((f) => f.family === "EXPLICATION")
                .map((family) => (
                  <React.Fragment key={family.family}>
                    <Chip
                      label={`Résistance: ${family.resistanceRate}%`}
                      color={family.resistanceRate > 25 ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label={`Charge cognitive: ${family.cognitiveLoad}%`}
                      color={family.cognitiveLoad > 30 ? "warning" : "success"}
                      size="small"
                    />
                  </React.Fragment>
                ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              💡{" "}
              {(() => {
                const explication = familyMetrics.find(
                  (f) => f.family === "EXPLICATION"
                );
                return explication
                  ? `Validation: ${explication.resistanceRate}% de résistance ${
                      explication.resistanceRate > 25
                        ? "✅ conforme à H2"
                        : "❌ plus faible qu'attendu"
                    }`
                  : "Données EXPLICATION non disponibles";
              })()}
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H3: Modulation contextuelle
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Mesure:</strong> effectiveness_difference = fluency_score
              - load_score
              <br />
              <strong>Résultat attendu:</strong> Variation selon stress_level du
              contexte
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics.map((family) => (
                <Chip
                  key={family.family}
                  label={`${family.family}: ${
                    family.acceptanceRate - family.resistanceRate > 0 ? "+" : ""
                  }${(family.acceptanceRate - family.resistanceRate).toFixed(
                    1
                  )}%`}
                  color={
                    family.acceptanceRate - family.resistanceRate > 30
                      ? "success"
                      : family.acceptanceRate - family.resistanceRate > 10
                      ? "warning"
                      : "error"
                  }
                  size="small"
                />
              ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              💡{" "}
              {(() => {
                const reflet = familyMetrics.find((f) => f.family === "REFLET");
                const explication = familyMetrics.find(
                  (f) => f.family === "EXPLICATION"
                );
                if (reflet && explication) {
                  const diff =
                    reflet.acceptanceRate - explication.acceptanceRate;
                  return `Différentiel REFLET vs EXPLICATION: ${diff.toFixed(
                    1
                  )}% ${
                    diff > 15
                      ? "✅ efficacité différentielle confirmée"
                      : "⚠️ différence modérée"
                  }`;
                }
                return "Calcul en cours...";
              })()}
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Dialog des algorithmes détaillés */}
      <Dialog
        open={showAlgorithmDetails}
        onClose={() => setShowAlgorithmDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">
            Algorithmes Détaillés de la Thèse
          </Typography>
          <IconButton onClick={() => setShowAlgorithmDetails(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {thesisCategories.map((category) => (
            <Accordion key={category.id}>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">{category.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {category.indicators.map((indicator) => (
                  <Box key={indicator.id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {indicator.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {indicator.description}
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}
                      >
                        {indicator.algorithm}
                      </Typography>
                    </Paper>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption">
                        <strong>Valeur actuelle:</strong>{" "}
                        {indicator.currentValue}
                      </Typography>
                      <Chip
                        label={getStatusLabel(indicator.implementationStatus)}
                        color={
                          getStatusColor(indicator.implementationStatus) as any
                        }
                        size="small"
                      />
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CognitiveMetrics;
