// src/app/(protected)/analysis/components/TestMigration.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  Chat as LIIcon,
  Assessment as AnalysisIcon,
  Science as FrameworkIcon,
  CompareArrows as CompareIcon,
} from "@mui/icons-material";

// Import des composants du nouveau framework
import FluiditeCognitiveInterface from "./cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveInterface";
import { MetricsDashboard } from "./metrics-framework/components/MetricsDashBoard";

// Import des composants existants pour comparaison
import CognitiveMetrics from "./cognitive-metrics/CognitiveMetrics";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`framework-tabpanel-${index}`}
      aria-labelledby={`framework-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TestMigration: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* En-tête du framework unifié */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FrameworkIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              🚀 Framework de Métriques Unifié
            </Typography>
            <Typography variant="h6">
              Architecture modulaire pour l'analyse conversationnelle avancée
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label="🧠 Sciences Cognitives" color="secondary" />
          <Chip label="🗣️ Linguistique Interactionnelle" color="secondary" />
          <Chip label="📊 Analyse Conversationnelle" color="secondary" />
          <Chip label="🔧 Modularité" color="secondary" />
          <Chip label="⚡ Performance" color="secondary" />
        </Box>
      </Paper>

      {/* Options de développement */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
        <Typography variant="subtitle1" gutterBottom>
          🔧 Options de développement
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
            />
          }
          label="Afficher la comparaison avec l'ancien système"
        />
      </Paper>

      {/* Navigation des domaines */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
            },
          }}
        >
          <Tab
            icon={<CognitiveIcon />}
            label="Sciences Cognitives"
            id="framework-tab-0"
            aria-controls="framework-tabpanel-0"
          />
          <Tab
            icon={<LIIcon />}
            label="Linguistique Interactionnelle"
            id="framework-tab-1"
            aria-controls="framework-tabpanel-1"
          />
          <Tab
            icon={<AnalysisIcon />}
            label="Analyse Conversationnelle"
            id="framework-tab-2"
            aria-controls="framework-tabpanel-2"
          />
          <Tab
            icon={<CompareIcon />}
            label="Comparaison Multi-Domaines"
            id="framework-tab-3"
            aria-controls="framework-tabpanel-3"
          />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <TabPanel value={tabValue} index={0}>
        {/* Domaine Sciences Cognitives */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🧠 Domaine Sciences Cognitives - Framework Unifié
          </Typography>
          <Typography variant="body2">
            Interface refactorisée utilisant l'architecture BaseIndicator avec
            algorithmes modulaires. Basé sur la théorie des neurones miroirs de
            Gallese (2007).
          </Typography>
        </Alert>

        {/* Interface principale Fluidité Cognitive */}
        <FluiditeCognitiveInterface showComparison={showComparison} />

        {/* Comparaison avec l'ancien système si activée */}
        {showComparison && (
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "warning.light" }}>
              <Typography variant="h6" gutterBottom>
                📊 Comparaison avec l'ancien système
              </Typography>
              <Typography variant="body2">
                Interface héritée pour comparaison des résultats
              </Typography>
            </Paper>
            <CognitiveMetrics />
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Domaine Linguistique Interactionnelle */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🗣️ Domaine Linguistique Interactionnelle - En cours de développement
          </Typography>
          <Typography variant="body2">
            Interface LI refactorisée avec indicateurs Common Ground, Feedback
            Alignment, Backchannels, etc. Basé sur Clark (1996) et Pickering &
            Garrod (2004).
          </Typography>
        </Alert>

        {/* Dashboard LI (à implémenter) */}
        <MetricsDashboard
          domain="li"
          data={[]} // Données à connecter
          enableAdvancedFeatures={true}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Domaine Analyse Conversationnelle */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Domaine Analyse Conversationnelle - En cours de développement
          </Typography>
          <Typography variant="body2">
            Baseline empirique pour validation convergence avec métriques LI et
            cognitives. Analyse des adjacency pairs et patterns
            conversationnels.
          </Typography>
        </Alert>

        {/* Dashboard AC (à implémenter) */}
        <MetricsDashboard
          domain="conversational_analysis"
          data={[]} // Données à connecter
          enableAdvancedFeatures={true}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Comparaison Multi-Domaines */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🔬 Validation Convergence Multi-Niveaux
          </Typography>
          <Typography variant="body2">
            Analyse de convergence entre les trois niveaux d'analyse selon la
            méthodologie de validation croisée AC-LI-Cognitif.
          </Typography>
        </Alert>

        {/* CORRECTION: Grille de comparaison avec CSS Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
            mb: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🧠 Sciences Cognitives
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Fluidité cognitive, neurones miroirs, automatisme
                conversationnel
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setTabValue(0)}
              >
                Voir les résultats
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary">
                🗣️ Linguistique Interactionnelle
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Common Ground, alignement, coordination interactionnelle
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                En développement
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                📊 Analyse Conversationnelle
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Baseline empirique, efficacité des stratégies
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                En développement
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Placeholder pour les métriques de convergence */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Métriques de Convergence (À implémenter)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Coefficient de Kendall (τ) pour concordance des classements
            <br />
            • Corrélations de Pearson (r) entre niveaux d'analyse
            <br />
            • Tests de concordance directionnelle
            <br />• Validation des hypothèses H1, H2, H3
          </Typography>
        </Paper>
      </TabPanel>

      {/* CORRECTION: Informations de développement avec CSS Grid */}
      <Paper sx={{ p: 2, mt: 4, bgcolor: "grey.50" }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          🚧 Statut de développement
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip size="small" label="✅ Implémenté" color="success" />
            <Typography variant="caption">Sciences Cognitives</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip size="small" label="🔄 En cours" color="warning" />
            <Typography variant="caption">
              Linguistique Interactionnelle
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip size="small" label="📋 Planifié" color="default" />
            <Typography variant="caption">Analyse Conversationnelle</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip size="small" label="🔬 Recherche" color="info" />
            <Typography variant="caption">Validation Convergence</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TestMigration;
