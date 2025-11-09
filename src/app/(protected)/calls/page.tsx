// src/app/(protected)/calls/page.tsx - VERSION DDD MIGRÉE

"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Alert,
  useTheme,
  alpha,
  Fade,
} from "@mui/material";
import { CloudUpload, Build, List, Analytics } from "@mui/icons-material";

// Nouveaux composants DDD
import { CallImportPage } from "@/features/phase1-corpus/calls/ui/pages/CallImportPage";

import { CallManagementPage } from "@/features/phase1-corpus/calls/ui/pages/CallManagementPage";

// Hook pour les statistiques globales
import { useCallStatistics } from "@/features/phase1-corpus/calls/ui/hooks/useCallStatistics";

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && (
      <Fade in={value === index} timeout={300}>
        <Box>{children}</Box>
      </Fade>
    )}
  </div>
);

/**
 * Page principale du module Calls avec architecture DDD
 * Orchestrie les 3 workflows principaux : Import, Préparation, Gestion
 */
export default function CallsPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Statistiques globales avec hook DDD
  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useCallStatistics();

  /**
   * Changement d'onglet avec analytics
   */
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);

      // Optionnel : Analytics
      const tabNames = ["import", "preparation", "management"];
      console.log(`Onglet activé: ${tabNames[newValue]}`);
    },
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(29, 35, 42, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(240, 242, 247, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
        p: { xs: 1, md: 2 },
      }}
    >
      <Box maxWidth="xl" mx="auto">
        {/* En-tête avec statistiques */}
        <Box mb={3}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: "center",
              mb: 1,
            }}
          >
            Gestion des Appels
          </Typography>

          {!statsLoading && stats && (
            <Box
              display="flex"
              gap={2}
              justifyContent="center"
              flexWrap="wrap"
              mb={2}
            >
              <Alert
                severity="info"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                }}
              >
                <Typography variant="body2">
                  <strong>{stats.total}</strong> appels •
                  <strong> {stats.readyForTagging}</strong> prêts pour tagging •
                  <strong> {stats.completeness}%</strong> de complétude
                </Typography>
              </Alert>
            </Box>
          )}

          {statsError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Impossible de charger les statistiques
            </Alert>
          )}
        </Box>

        {/* Navigation par onglets */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.9)
                : theme.palette.background.paper,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 64,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<CloudUpload />}
              label="Import d'Appels"
              iconPosition="start"
              sx={{
                gap: 1,
                "& .MuiSvgIcon-root": {
                  fontSize: "1.2rem",
                },
              }}
            />
            <Tab
              icon={<Build />}
              label="Préparation"
              iconPosition="start"
              sx={{
                gap: 1,
                "& .MuiSvgIcon-root": {
                  fontSize: "1.2rem",
                },
              }}
            />
            <Tab
              icon={<List />}
              label="Gestion Avancée"
              iconPosition="start"
              sx={{
                gap: 1,
                "& .MuiSvgIcon-root": {
                  fontSize: "1.2rem",
                },
              }}
            />
          </Tabs>

          {/* Contenu des onglets */}
          <Box>
            {/* Onglet 1: Import d'Appels */}
            <TabPanel value={activeTab} index={0}>
              <Box p={{ xs: 2, md: 3 }}>
                <CallImportPage />
              </Box>
            </TabPanel>

            {/* Onglet 3: Gestion Avancée */}
            <TabPanel value={activeTab} index={2}>
              <Box p={{ xs: 2, md: 3 }}>
                <CallManagementPage />
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        {/* Footer informatif */}
        <Box mt={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h6" gutterBottom>
              🚀 Architecture DDD - Nouvelles Fonctionnalités
            </Typography>

            <Box display="flex" gap={4} flexWrap="wrap">
              <Box flex="1" minWidth="250px">
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Import Intelligent
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Détection automatique de doublons
                  <br />
                  • Validation JSON stricte
                  <br />
                  • Support WorkDrive complet
                  <br />• URLs signées sécurisées
                </Typography>
              </Box>

              <Box flex="1" minWidth="250px">
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Préparation Avancée
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Préparation en lot optimisée
                  <br />
                  • Stratégies multiples
                  <br />
                  • Validation métier complète
                  <br />• Feedback temps réel
                </Typography>
              </Box>

              <Box flex="1" minWidth="250px">
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Gestion Professionnelle
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Cache intelligent (30s)
                  <br />
                  • Actions en lot
                  <br />
                  • Interface responsive
                  <br />• Métriques avancées
                </Typography>
              </Box>
            </Box>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Architecture DDD complète :</strong> Services métier,
                Workflows, Repositories et UI pure séparés pour une
                maintenabilité optimale.
              </Typography>
            </Alert>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
