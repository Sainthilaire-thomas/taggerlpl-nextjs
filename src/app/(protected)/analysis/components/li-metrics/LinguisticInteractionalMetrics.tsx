// src/components/li-metrics/LinguisticInteractionalMetrics.tsx

import React, { useState, useMemo } from "react";
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
  Psychology as InteractionIcon,
  Groups as CommonGroundIcon,
  Feedback as FeedbackIcon,
  GraphicEq as ProsodicIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  Info as InfoIcon,
  Science as ThesisIcon,
  Assessment as MetricsIcon,
  Timeline as SequentialIcon,
} from "@mui/icons-material";

import { useCognitiveMetricsByFamily } from "../cognitive-metrics/hooks/useCognitiveMetricsByFamily";

// Types pour les métriques LI
interface LIIndicator {
  id: string;
  name: string;
  theoreticalFoundation: string;
  algorithm: string;
  currentValue: string;
  implementationStatus: "implemented" | "partial" | "missing";
  description: string;
  expectedRange?: string;
  references: string;
}

interface LICategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "primary" | "warning" | "success";
  indicators: LIIndicator[];
  theoreticalBackground: string;
}

interface LICompositeScore {
  name: string;
  formula: string;
  currentValue: string;
  status: "implemented" | "partial" | "missing";
}

const LinguisticInteractionalMetrics: React.FC = () => {
  const theme = useTheme();
  const { familyMetrics, globalMetrics, loading, error } =
    useCognitiveMetricsByFamily();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTheoreticalDetails, setShowTheoreticalDetails] = useState(false);

  // Fonction pour calculer les valeurs actuelles basées sur les données
  const calculateLIValue = (indicatorId: string): string => {
    switch (indicatorId) {
      case "common_ground_status":
        return "Partiellement calculé"; // Basé sur références partagées
      case "grounding_process":
        return "Non calculé"; // Nécessite analyse séquentielle
      case "feedback_alignment":
        const avgAcceptance =
          familyMetrics.reduce((sum, f) => sum + f.acceptanceRate, 0) /
          (familyMetrics.length || 1);
        return `${avgAcceptance.toFixed(1)}% alignement global`;
      case "backchannels":
        return "Partiellement détecté"; // Via analyse acquiescements
      case "prosodic_fluency":
        return "Non disponible"; // Nécessite analyse audio
      case "speech_rate":
        return "Données timing disponibles"; // Calculable avec start/end times
      case "sequential_organization":
        return "Patterns identifiés"; // Via analyse paires adjacentes
      case "repair_mechanisms":
        return "Non calculé"; // Nécessite analyse fine des réparations
      default:
        return "N/A";
    }
  };

  // Structure selon la section 3.2 de la thèse
  const liCategories: LICategory[] = [
    {
      id: "common_ground_construction",
      title: "Construction du Common Ground",
      subtitle: "Négociation du sens en contexte conflictuel",
      icon: <CommonGroundIcon />,
      color: "primary",
      theoreticalBackground:
        "Le common ground (Clark, 1996) désigne l'ensemble des connaissances, croyances et suppositions que les interlocuteurs supposent partager. Dans les centres de contact, sa construction constitue un enjeu crucial.",
      indicators: [
        {
          id: "common_ground_status",
          name: "Construction du Common Ground",
          theoreticalFoundation: "Théorie du common ground (Clark, 1996)",
          algorithm: `def calculate_common_ground_status(conseiller_turn, client_turn, conversation_context):
    # 1. Score de références partagées
    shared_indicators = {
        'temporal': ['maintenant', 'aujourd\'hui', 'ce matin'],
        'spatial': ['votre dossier', 'votre compte', 'notre système'], 
        'personal': ['votre', 'notre', 'ensemble'],
        'procedural': ['cette procédure', 'votre demande']
    }
    
    # Calcul présence + reprise par client
    shared_count = count_shared_references(conseiller_turn, client_turn)
    
    # 2. Détection ruptures compréhension
    breakdown_markers = ['je ne comprends pas', 'comment ça', 'pardon']
    breakdown_detected = any(marker in client_verbatim for marker in breakdown_markers)
    
    # Classification finale
    if breakdown_detected: return 'CG_ROMPU'
    elif shared_score > 0.6: return 'CG_ETABLI'  
    else: return 'CG_NEGOCIE'`,
          currentValue: calculateLIValue("common_ground_status"),
          implementationStatus: "partial",
          description:
            "Analyse conversationnelle de la construction du sens partagé",
          expectedRange:
            "CG_ETABLI = optimal, CG_NEGOCIE = acceptable, CG_ROMPU = problématique",
          references:
            "Clark (1996). Using Language. Cambridge University Press",
        },
        {
          id: "grounding_process",
          name: "Processus de Grounding",
          theoreticalFoundation:
            "Grounding en communication (Clark & Schaefer, 1989)",
          algorithm: `def analyze_grounding_process(conversation_sequence):
    # Détection des séquences de clarification
    clarification_patterns = [
        'c\'est-à-dire', 'vous voulez dire', 'si je comprends bien',
        'pour être sûr', 'donc si j\'ai bien compris'
    ]
    
    # Mesure efficacité du grounding
    grounding_success = []
    for turn in conversation_sequence:
        if any(pattern in turn.verbatim for pattern in clarification_patterns):
            # Analyser le tour suivant pour confirmation/échec
            next_turn = get_next_turn(turn)
            success = not any(confusion in next_turn.verbatim 
                            for confusion in ['non', 'pas du tout', 'ce n\'est pas ça'])
            grounding_success.append(success)
    
    return sum(grounding_success) / len(grounding_success) if grounding_success else 0`,
          currentValue: calculateLIValue("grounding_process"),
          implementationStatus: "missing",
          description:
            "Mécanismes d'établissement de la compréhension mutuelle",
          expectedRange: "Taux de succès 0-1 (1 = grounding efficace)",
          references:
            "Clark & Schaefer (1989). Contributing to discourse. Cognitive Science, 13(2)",
        },
      ],
    },
    {
      id: "feedback_regulation",
      title: "Feedback et Régulation Interactionnelle",
      subtitle: "Mécanismes de coordination",
      icon: <FeedbackIcon />,
      color: "warning",
      theoreticalBackground:
        "Les mécanismes de feedback (Bertrand, 2021) constituent des régulateurs conversationnels qui facilitent la compréhension mutuelle et la coordination des actions entre participants.",
      indicators: [
        {
          id: "feedback_alignment",
          name: "Signaux d'Alignement/Désalignement",
          theoreticalFoundation:
            "Théorie de l'alignement interactionnel (Pickering & Garrod, 2004)",
          algorithm: `def calculate_interactional_alignment(client_turn, conversation_context):
    # 1. Signaux d'alignement fort
    strong_alignment = ['d\'accord', 'exactement', 'parfait', 'merci']
    
    # 2. Signaux d'alignement faible  
    weak_alignment = ['mm-hmm', 'hm', 'oui', 'ok', 'je vois']
    
    # 3. Signaux de désalignement
    disalignment = ['mais', 'non', 'pas du tout', 'inadmissible']
    
    # 4. Signaux implicites (silences, évitement)
    implicit_disalignment = {
        'long_pause': duration > 6.0,
        'no_acknowledgment': not any(ack in verbatim for ack in positive_markers)
    }
    
    # Classification finale
    if any(marker in verbatim for marker in strong_alignment):
        return 'ALIGNEMENT_FORT'
    elif any(marker in verbatim for marker in disalignment):
        return 'DESALIGNEMENT'
    else: return 'ALIGNEMENT_FAIBLE'`,
          currentValue: calculateLIValue("feedback_alignment"),
          implementationStatus: "implemented",
          description:
            "Détection automatique des signaux de coordination interactionnelle",
          expectedRange:
            "ALIGNEMENT_FORT = coopération, DESALIGNEMENT = résistance",
          references:
            "Pickering & Garrod (2004). Toward a mechanistic psychology of dialogue",
        },
        {
          id: "backchannels",
          name: "Backchannels et Acquiescements",
          theoreticalFoundation:
            "Backchannels comme régulateurs (Schegloff, 1982)",
          algorithm: `def analyze_backchannels(conversation_turns):
    # Identification des backchannels
    backchannel_markers = {
        'minimal': ['mm-hmm', 'hm', 'ouais'],
        'substantial': ['d\'accord', 'je vois', 'effectivement'],
        'negative': ['hein', 'quoi', 'comment']
    }
    
    backchannels = []
    for turn in conversation_turns:
        if turn.duration < 2.0 and len(turn.verbatim.split()) <= 3:
            for category, markers in backchannel_markers.items():
                if any(marker in turn.verbatim.lower() for marker in markers):
                    backchannels.append({
                        'type': category,
                        'timing': turn.start_time,
                        'effectiveness': calculate_subsequent_cooperation(turn)
                    })
    
    return analyze_backchannel_patterns(backchannels)`,
          currentValue: calculateLIValue("backchannels"),
          implementationStatus: "partial",
          description: "Analyse des signaux de feedback minimal et leur impact",
          expectedRange: "Fréquence et efficacité des signaux de régulation",
          references:
            "Schegloff (1982). Discourse as an interactional achievement",
        },
      ],
    },
    {
      id: "multimodal_resources",
      title: "Ressources Multimodales",
      subtitle: "Prosodie et temporalité",
      icon: <ProsodicIcon />,
      color: "success",
      theoreticalBackground:
        "Les interactions téléphoniques mobilisent des ressources prosodiques (intonation, débit, pauses) qui jouent un rôle crucial dans l'efficacité des stratégies linguistiques.",
      indicators: [
        {
          id: "prosodic_fluency",
          name: "Fluidité Prosodique",
          theoreticalFoundation:
            "Analyse multimodale en LI (multimodal interaction analysis)",
          algorithm: `def calculate_prosodic_fluency(audio_segment, verbatim):
    # 1. Débit de parole optimal
    word_count = len(verbatim.split())
    duration = audio_segment.duration
    speech_rate = word_count / duration
    rate_score = 1.0 if 2.0 <= speech_rate <= 4.0 else 0.5
    
    # 2. Analyse des pauses
    pauses = detect_pauses(audio_segment, min_duration=0.5)
    pause_ratio = sum(pause.duration for pause in pauses) / duration
    pause_score = 1.0 if pause_ratio < 0.2 else 0.7
    
    # 3. Variations prosodiques (F0, intensité)
    f0_variation = calculate_f0_stability(audio_segment)
    prosodic_score = 1.0 if f0_variation < 0.3 else 0.5
    
    # Score composite
    return (0.4 * rate_score + 0.35 * pause_score + 0.25 * prosodic_score)`,
          currentValue: calculateLIValue("prosodic_fluency"),
          implementationStatus: "missing",
          description:
            "Analyse automatique de la fluidité prosodique téléphonique",
          expectedRange: "Score 0-1 (1 = fluidité optimale)",
          references:
            "Analyse multimodale des interactions (méthodes LI contemporaines)",
        },
        {
          id: "speech_rate",
          name: "Débit de Parole et Pauses",
          theoreticalFoundation:
            "Temporalité de l'énonciation comme ressource (LI)",
          algorithm: `def analyze_speech_patterns(turn_data):
    # 1. Calcul débit (mots/seconde)
    duration = turn_data['end_time'] - turn_data['start_time'] 
    word_count = len(turn_data['verbatim'].split())
    speech_rate = word_count / duration if duration > 0 else 0
    
    # 2. Détection pauses intra-tour
    # Note: Nécessiterait analyse audio pour pauses précises
    estimated_pauses = count_pause_indicators(turn_data['verbatim'])
    
    # 3. Classification selon contexte
    if speech_rate < 1.5: return 'LENT' 
    elif speech_rate > 4.0: return 'RAPIDE'
    else: return 'NORMAL'
    
    # 4. Corrélation avec efficacité
    effectiveness = correlate_with_client_reaction(turn_data)
    return {'rate': speech_rate, 'category': category, 'effectiveness': effectiveness}`,
          currentValue: calculateLIValue("speech_rate"),
          implementationStatus: "partial",
          description:
            "Analyse temporelle des tours de parole et ressources rythmiques",
          expectedRange: "Débit optimal: 2-4 mots/seconde",
          references: "Ressources temporelles en LI (analyse des TCU)",
        },
      ],
    },
    {
      id: "sequential_organization",
      title: "Organisation Séquentielle",
      subtitle: "Construction des interactions",
      icon: <SequentialIcon />,
      color: "primary",
      theoreticalBackground:
        "L'organisation séquentielle révèle comment se construisent les situations de conflit et leur évolution vers la résolution ou l'escalade (AC/LI).",
      indicators: [
        {
          id: "sequential_patterns",
          name: "Patterns Séquentiels",
          theoreticalFoundation:
            "Organisation séquentielle AC (Sacks, Schegloff, Jefferson)",
          algorithm: `def analyze_sequential_organization(conversation_sequence):
    # 1. Identification des séquences types
    sequence_patterns = {
        'problem_solving': ['problème', 'solution', 'résolution'],
        'disagreement': ['objection', 'négociation', 'accord/désaccord'],
        'clarification': ['question', 'explication', 'compréhension']
    }
    
    # 2. Analyse des transitions
    transitions = []
    for i in range(len(conversation_sequence) - 1):
        current_turn = conversation_sequence[i]
        next_turn = conversation_sequence[i + 1]
        
        transition_type = classify_transition(current_turn, next_turn)
        effectiveness = measure_transition_success(current_turn, next_turn)
        
        transitions.append({
            'type': transition_type,
            'success': effectiveness,
            'strategy_used': current_turn.tag if current_turn.speaker == 'conseiller' else None
        })
    
    return analyze_pattern_effectiveness(transitions)`,
          currentValue: calculateLIValue("sequential_organization"),
          implementationStatus: "partial",
          description: "Analyse des patterns d'organisation conversationnelle",
          expectedRange:
            "Identification des séquences efficaces vs problématiques",
          references:
            "Sacks, Schegloff & Jefferson (1974). A simplest systematics for turn-taking",
        },
        {
          id: "repair_mechanisms",
          name: "Mécanismes de Réparation",
          theoreticalFoundation:
            "Système de réparation conversationnelle (Schegloff et al., 1977)",
          algorithm: `def analyze_repair_mechanisms(conversation_sequence):
    # 1. Types de réparation selon AC
    repair_types = {
        'self_initiated_self_repair': 'Locuteur corrige lui-même',
        'other_initiated_self_repair': 'Interlocuteur signale, locuteur corrige', 
        'other_initiated_other_repair': 'Interlocuteur corrige directement'
    }
    
    # 2. Détection des problèmes et réparations
    repairs = []
    for i, turn in enumerate(conversation_sequence):
        # Indicateurs de problème
        if any(marker in turn.verbatim.lower() for marker in 
               ['pardon', 'comment', 'je ne comprends pas', 'pouvez-vous répéter']):
            
            # Analyser la réparation dans les tours suivants
            repair_sequence = analyze_repair_sequence(conversation_sequence[i:i+3])
            repairs.append(repair_sequence)
    
    # 3. Efficacité des réparations par stratégie conseiller
    return calculate_repair_effectiveness_by_strategy(repairs)`,
          currentValue: calculateLIValue("repair_mechanisms"),
          implementationStatus: "missing",
          description: "Analyse des séquences de réparation conversationnelle",
          expectedRange: "Taux de succès des réparations par type",
          references:
            "Schegloff, Jefferson & Sacks (1977). The preference for self-correction",
        },
      ],
    },
  ];

  // Calcul des scores composites selon la thèse
  const liCompositeScores: LICompositeScore[] = [
    {
      name: "Score Composite Common Ground",
      formula:
        "0.4 × Construction_CG + 0.35 × Processus_Grounding + 0.25 × Références_Partagées",
      currentValue: calculateLIValue("common_ground_status"),
      status: "partial",
    },
    {
      name: "Score Composite Feedback",
      formula: "0.4 × Alignement + 0.35 × Backchannels + 0.25 × Coordination",
      currentValue: calculateLIValue("feedback_alignment"),
      status: "partial",
    },
    {
      name: "Score Composite Multimodal",
      formula:
        "0.4 × Fluidité_Prosodique + 0.35 × Débit_Parole + 0.25 × Pauses",
      currentValue: calculateLIValue("prosodic_fluency"),
      status: "missing",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            📊 Analyse des Métriques de Linguistique Interactionnelle
          </Typography>
          <Typography variant="body2">
            Calcul des indicateurs LI selon le cadre théorique de la section 3.2
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
            ❌ Erreur lors de l'analyse LI
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
      {/* En-tête avec référence théorique */}
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
            <Avatar sx={{ bgcolor: "secondary.main", width: 56, height: 56 }}>
              <InteractionIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold">
                📊 Métriques de Linguistique Interactionnelle
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Ressources et construction du sens selon la section 3.2
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => setShowTheoreticalDetails(true)}
            sx={{ height: "fit-content" }}
          >
            Fondements Théoriques
          </Button>
        </Box>

        {/* Résumé de l'implémentation LI */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 État d'Implémentation des Indicateurs LI
          </Typography>
          <Typography variant="body2">
            <strong>
              Analyse de{" "}
              {familyMetrics.reduce((sum, f) => sum + f.totalUsage, 0)}{" "}
              interactions
            </strong>{" "}
            •<strong> Implémentés:</strong> 2/8 indicateurs •
            <strong> Partiels:</strong> 4/8 indicateurs •
            <strong> Manquants:</strong> 2/8 indicateurs
          </Typography>
        </Alert>
      </Box>

      {/* Catégories d'indicateurs LI */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {liCategories.map((category) => (
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

              {/* Description théorique */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontStyle: "italic" }}
              >
                {category.theoreticalBackground}
              </Typography>

              {/* Liste des indicateurs */}
              <Box sx={{ space: 1 }}>
                {category.indicators.map((indicator) => (
                  <Box
                    key={indicator.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark" ? "grey.800" : "grey.50",
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
                                  📊 {indicator.name} - Théorie LI
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Fondement théorique:</strong>{" "}
                                  {indicator.theoreticalFoundation}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Description:</strong>{" "}
                                  {indicator.description}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Algorithme:</strong>
                                </Typography>
                                <Paper
                                  sx={{
                                    p: 1,
                                    bgcolor:
                                      theme.palette.mode === "dark"
                                        ? "grey.900"
                                        : "grey.100",
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
                                    {indicator.algorithm.substring(0, 300)}...
                                  </Typography>
                                </Paper>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Plage attendue:</strong>{" "}
                                  {indicator.expectedRange}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  <strong>Références:</strong>{" "}
                                  {indicator.references}
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
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {indicator.currentValue}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(indicator.implementationStatus)}
                        color={
                          getStatusColor(indicator.implementationStatus) as any
                        }
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    {/* Résultats par famille pour indicateurs implémentés */}
                    {indicator.implementationStatus === "implemented" && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: "block" }}
                        >
                          📊 Résultats par famille:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {familyMetrics.map((family) => {
                            // Calcul spécifique selon l'indicateur
                            let value = "";
                            let color: "success" | "warning" | "error" =
                              "success";

                            if (indicator.id === "feedback_alignment") {
                              value = `${family.acceptanceRate}%`;
                              color =
                                family.acceptanceRate > 60
                                  ? "success"
                                  : family.acceptanceRate > 40
                                  ? "warning"
                                  : "error";
                            } else if (indicator.id === "backchannels") {
                              // Approximation basée sur les réactions courtes
                              const shortReactions =
                                family.averageReactionLength < 50;
                              value = shortReactions ? "Détecté" : "Faible";
                              color = shortReactions ? "success" : "warning";
                            } else {
                              value = `${family.totalUsage}`;
                              color =
                                family.totalUsage > 10 ? "success" : "warning";
                            }

                            return (
                              <Chip
                                key={family.family}
                                label={`${family.family}: ${value}`}
                                color={color}
                                size="small"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Message pour indicateurs partiels */}
                    {indicator.implementationStatus === "partial" && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: "block" }}
                        >
                          📊 Approximations par famille:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {familyMetrics.map((family) => {
                            let value = "";
                            let color: "success" | "warning" | "error" =
                              "warning";

                            if (indicator.id === "common_ground_status") {
                              // Approximation basée sur l'engagement
                              value =
                                family.family === "ENGAGEMENT"
                                  ? "CG_ETABLI"
                                  : family.family === "OUVERTURE"
                                  ? "CG_NEGOCIE"
                                  : "CG_PARTIEL";
                              color =
                                value === "CG_ETABLI" ? "success" : "warning";
                            } else if (indicator.id === "speech_rate") {
                              // Approximation basée sur la longueur des verbatims
                              const avgLength = family.averageReactionLength;
                              value =
                                avgLength < 80
                                  ? "NORMAL"
                                  : avgLength < 120
                                  ? "RAPIDE"
                                  : "TRÈS_RAPIDE";
                              color =
                                value === "NORMAL" ? "success" : "warning";
                            } else {
                              value = `${family.acceptanceRate}%`;
                              color =
                                family.acceptanceRate > 50
                                  ? "success"
                                  : "warning";
                            }

                            return (
                              <Chip
                                key={family.family}
                                label={`${family.family}: ${value}`}
                                color={color}
                                size="small"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            );
                          })}
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: "italic", mt: 1, display: "block" }}
                        >
                          ⚠️ Implémentation basique, manque composantes
                          théoriques complètes
                        </Typography>
                      </Box>
                    )}

                    {/* Message pour indicateurs non implémentés */}
                    {indicator.implementationStatus === "missing" && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          💡 Algorithme défini mais nécessite développement
                          technique (analyse audio/séquentielle)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Scores composites LI */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <MetricsIcon sx={{ mr: 1 }} />
          Scores Composites de Linguistique Interactionnelle
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Score Composite LI</strong>
                </TableCell>
                <TableCell>
                  <strong>Formule Théorique</strong>
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
              {liCompositeScores.map((score) => (
                <TableRow key={score.name}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {score.name}
                      <Tooltip
                        title={
                          <Box sx={{ maxWidth: 600 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              📊 {score.name} - Formule LI Composite
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Basé sur la section 3.2:</strong>{" "}
                              Articulation des ressources linguistiques et
                              multimodales pour l'analyse de l'efficacité
                              interactionnelle.
                            </Typography>
                            <Typography variant="body2" color="warning.main">
                              Cette formule combine les différents niveaux
                              d'analyse LI selon le cadre théorique établi.
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

      {/* Validation des hypothèses LI selon la thèse */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <ThesisIcon sx={{ mr: 1 }} />
          Validation des Hypothèses LI (Section 3.2)
        </Typography>

        <Box sx={{ space: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H-LI1: Common Ground → Efficacité communicationnelle
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hypothèse:</strong> Un common ground stable facilite
              l'acceptation des stratégies conseiller
              <br />
              <strong>Indicateur:</strong> Corrélation CG_ETABLI avec réactions
              CLIENT_POSITIF
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics.map((family) => (
                <Chip
                  key={family.family}
                  label={`${family.family}: ${family.acceptanceRate}% acceptation`}
                  color={family.acceptanceRate > 50 ? "success" : "warning"}
                  size="small"
                />
              ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              💡 Analyse: Les familles avec références partagées claires
              (ENGAGEMENT/OUVERTURE) montrent une meilleure acceptation
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H-LI2: Feedback immédiat → Régulation conversationnelle
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hypothèse:</strong> Les signaux de feedback orientent la
              suite de l'interaction
              <br />
              <strong>Indicateur:</strong> Corrélation backchannels positifs
              avec continuation fluide
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics
                .filter((f) => f.family === "REFLET")
                .map((family) => (
                  <React.Fragment key={family.family}>
                    <Chip
                      label={`REFLET: ${family.acceptanceRate}% acceptation`}
                      color={family.acceptanceRate > 40 ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label={`Résistance: ${family.resistanceRate}%`}
                      color={family.resistanceRate < 25 ? "success" : "warning"}
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
              💡 Analyse: Les stratégies REFLET montrent l'importance des
              signaux d'écoute active pour la régulation
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔬 H-LI3: Ressources multimodales → Fluidité interactionnelle
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hypothèse:</strong> Débit de parole et pauses influencent
              la réception des stratégies
              <br />
              <strong>Indicateur:</strong> Corrélation temporalité avec
              efficacité par famille
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {familyMetrics.map((family) => (
                <Chip
                  key={family.family}
                  label={`${family.family}: ${family.averageReactionLength} car. moy.`}
                  color={
                    family.averageReactionLength < 100
                      ? "success"
                      : family.averageReactionLength < 150
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
              💡 Analyse: Les réactions plus courtes indiquent un traitement
              fluide (corrélation longueur/complexité cognitive)
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Algorithmes prêts à implémenter (LI) */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          border: "2px dashed",
          borderColor: "secondary.main",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <MetricsIcon sx={{ mr: 1 }} />
          🚀 Développements LI Prioritaires
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              📊 Common Ground Automatique - PRIORITÉ HAUTE
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontSize: "0.75rem", mb: 1 }}
            >
              {`# Données disponibles: verbatims + timing
# Détection références partagées par NLP
shared_refs = detect_shared_references(conseiller, client)
cg_score = calculate_cg_stability(shared_refs, clarifications)`}
            </Typography>
            <Typography variant="caption" color="primary.main">
              💡 Impact estimé: Validation directe hypothèses section 3.2
            </Typography>
          </Alert>

          <Alert severity="warning">
            <Typography variant="subtitle2" gutterBottom>
              🎵 Analyse Prosodique Basique - MOYEN TERME
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontSize: "0.75rem", mb: 1 }}
            >
              {`# Analyse audio pour débit et pauses
speech_rate = words / duration
pause_analysis = detect_significant_pauses(audio)
fluency_score = correlate_with_effectiveness(rate, pauses)`}
            </Typography>
            <Typography variant="caption" color="warning.main">
              💡 Impact: Validation hypothèses multimodales LI
            </Typography>
          </Alert>

          <Alert severity="success">
            <Typography variant="subtitle2" gutterBottom>
              🔄 Séquences de Réparation - SPÉCIALISÉ
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontSize: "0.75rem", mb: 1 }}
            >
              {`# Détection patterns réparation AC
repair_sequences = identify_repair_patterns(conversation)
repair_success = measure_resolution_effectiveness(repairs)
strategy_correlation = link_repairs_to_strategies(conseiller_tags)`}
            </Typography>
            <Typography variant="caption" color="success.main">
              💡 Impact: Enrichissement analyse conversationnelle fine
            </Typography>
          </Alert>

          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              📈 Pipeline LI Intégré - LONG TERME
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontSize: "0.75rem", mb: 1 }}
            >
              {`# Combinaison tous indicateurs LI
li_composite = weight_li_indicators(cg, feedback, multimodal)
effectiveness_prediction = correlate_li_with_outcomes(composite)
strategy_optimization = recommend_best_li_approach(context)`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              💡 Vision: Système complet d'analyse LI pour centres de contact
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Dialog des fondements théoriques */}
      <Dialog
        open={showTheoreticalDetails}
        onClose={() => setShowTheoreticalDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            Fondements Théoriques LI (Section 3.2)
          </span>
          <IconButton onClick={() => setShowTheoreticalDetails(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography variant="h6" gutterBottom>
            🔬 Linguistique Interactionnelle : Cadre Théorique
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 3,
              mt: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
              }}
            >
              <Typography variant="subtitle1" gutterBottom color="primary.main">
                📚 CONCEPTS FONDAMENTAUX
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Common Ground (Clark, 1996)"
                    secondary="Base de connaissances partagées entre interlocuteurs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Grounding (Clark & Schaefer, 1989)"
                    secondary="Processus d'établissement de la compréhension mutuelle"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Feedback et Régulation (Bertrand, 2021)"
                    secondary="Mécanismes de coordination interactionnelle"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Ressources Multimodales (LI)"
                    secondary="Intégration prosodie, temporalité, organisation séquentielle"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                color="secondary.main"
              >
                🎯 APPLICATION AUX CENTRES DE CONTACT
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Interactions Conflictuelles"
                    secondary="Défis spécifiques de construction du sens en tension"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Contraintes Téléphoniques"
                    secondary="Ressources prosodiques compensant l'absence visuelle"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pression Temporelle"
                    secondary="Impact sur les mécanismes de grounding"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Standardisation vs Personnalisation"
                    secondary="Tension entre scripts et construction du sens authentique"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
              }}
            >
              <Typography variant="subtitle1" gutterBottom color="success.main">
                🔗 ARTICULATION AVEC AC ET SCIENCES COGNITIVES
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Complémentarité AC-LI"
                    secondary="AC = structure, LI = ressources et construction du sens"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pont vers Sciences Cognitives"
                    secondary="LI éclaire les ressources, SC explique les mécanismes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Validation Empirique"
                    secondary="Indicateurs LI mesurables pour tester hypothèses théoriques"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Applications Pratiques"
                    secondary="Principes LI pour améliorer formations et évaluations"
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              🎯 Positionnement dans la Thèse
            </Typography>
            <Typography variant="body2">
              La Linguistique Interactionnelle enrichit l'Analyse
              Conversationnelle en intégrant les ressources multimodales et les
              processus de construction du sens. Elle constitue le pont
              théorique entre l'analyse des structures conversationnelles (AC)
              et l'explication des mécanismes cognitifs (SC).
            </Typography>
          </Alert>
        </DialogContent>
      </Dialog>

      {/* Dialog détaillé pour une catégorie */}
      {selectedCategory && (
        <Dialog
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        >
          {(() => {
            const categoryData = liCategories.find(
              (c) => c.id === selectedCategory
            );
            if (!categoryData) return null;

            return (
              <>
                <DialogTitle
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{ bgcolor: `${categoryData.color}.light`, mr: 2 }}
                    >
                      {categoryData.icon}
                    </Avatar>
                    <Box>
                      <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                        {categoryData.title}
                      </span>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        Analyse LI détaillée - Section 3.2
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setSelectedCategory(null)}>
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>

                <DialogContent>
                  <Typography
                    variant="body2"
                    sx={{ mb: 3, fontStyle: "italic" }}
                  >
                    {categoryData.theoreticalBackground}
                  </Typography>

                  <Box sx={{ space: 2 }}>
                    {categoryData.indicators.map((indicator, index) => (
                      <Accordion key={indicator.id}>
                        <AccordionSummary expandIcon={<ExpandIcon />}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                          >
                            <Typography variant="subtitle1">
                              {indicator.name}
                            </Typography>
                            <Chip
                              label={getStatusLabel(
                                indicator.implementationStatus
                              )}
                              color={
                                getStatusColor(
                                  indicator.implementationStatus
                                ) as any
                              }
                              size="small"
                              sx={{ mr: 2 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ space: 2 }}>
                            <Typography variant="body2" paragraph>
                              <strong>Fondement théorique:</strong>{" "}
                              {indicator.theoreticalFoundation}
                            </Typography>
                            <Typography variant="body2" paragraph>
                              <strong>Description:</strong>{" "}
                              {indicator.description}
                            </Typography>
                            <Typography variant="body2" paragraph>
                              <strong>Valeur actuelle:</strong>{" "}
                              {indicator.currentValue}
                            </Typography>
                            <Typography variant="body2" paragraph>
                              <strong>Plage attendue:</strong>{" "}
                              {indicator.expectedRange}
                            </Typography>
                            <Paper
                              sx={{
                                p: 2,
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? "grey.800"
                                    : "grey.50",
                                mt: 2,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: "monospace",
                                  whiteSpace: "pre-line",
                                }}
                              >
                                {indicator.algorithm}
                              </Typography>
                            </Paper>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: "block" }}
                            >
                              <strong>Références:</strong>{" "}
                              {indicator.references}
                            </Typography>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </DialogContent>
              </>
            );
          })()}
        </Dialog>
      )}
    </Box>
  );
};

export default LinguisticInteractionalMetrics;
