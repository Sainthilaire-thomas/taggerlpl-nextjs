// src/app/(protected)/analysis/components/TestMigration.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";

/**
 * Composant de test simplifié pour tester le framework sans erreur
 */
const TestMigration: React.FC = () => {
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [showDetails, setShowDetails] = useState(false);

  const handleBasicTest = () => {
    setTestStatus("testing");

    // Test basique - vérifier que les modules peuvent être importés
    setTimeout(() => {
      try {
        // Test d'import dynamique des modules
        import("./metrics-framework/core/types/base")
          .then(() => {
            setTestStatus("success");
            console.log("✅ Framework de base accessible");
          })
          .catch((error) => {
            setTestStatus("error");
            console.error("❌ Erreur import framework:", error);
          });
      } catch (error) {
        setTestStatus("error");
        console.error("❌ Erreur test basique:", error);
      }
    }, 1000);
  };

  const handleAdvancedTest = async () => {
    try {
      // Test d'import dynamique des composants avancés
      const { useAdaptedCognitiveMetrics } = await import(
        "./cognitive-metrics/migration/adaptUseCognitiveMetrics"
      );
      console.log("✅ Module de migration accessible");
      alert("✅ Test avancé réussi - Voir console pour détails");
    } catch (error) {
      console.error("❌ Erreur test avancé:", error);
      alert("❌ Test avancé échoué - Framework non encore initialisé");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🧪 Test Framework Unifié
        </Typography>
        <Typography variant="body2">
          Version simplifiée pour tester l'infrastructure du framework de
          métriques modulaires.
        </Typography>
      </Alert>

      {/* Contrôles de test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Tests Disponibles
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              onClick={handleBasicTest}
              disabled={testStatus === "testing"}
            >
              {testStatus === "testing" ? "Test en cours..." : "Test Basique"}
            </Button>

            <Button variant="outlined" onClick={handleAdvancedTest}>
              Test Avancé
            </Button>

            <Button variant="text" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Masquer" : "Afficher"} Détails
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2">Statut:</Typography>
            <Chip
              label={
                testStatus === "idle"
                  ? "Prêt"
                  : testStatus === "testing"
                  ? "Test en cours"
                  : testStatus === "success"
                  ? "Succès"
                  : "Erreur"
              }
              color={
                testStatus === "success"
                  ? "success"
                  : testStatus === "error"
                  ? "error"
                  : testStatus === "testing"
                  ? "warning"
                  : "default"
              }
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Statut détaillé */}
      {testStatus === "success" && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✅ <strong>Framework accessible</strong> - Les modules de base
            peuvent être importés sans erreur.
          </Typography>
        </Alert>
      )}

      {testStatus === "error" && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ❌ <strong>Erreur détectée</strong> - Vérifier la console pour plus
            de détails.
          </Typography>
        </Alert>
      )}

      {/* Informations détaillées */}
      {showDetails && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Informations Framework
            </Typography>

            <Typography variant="body2" gutterBottom>
              <strong>Architecture:</strong> Framework modulaire pour métriques
              conversationnelles
            </Typography>

            <Typography variant="body2" gutterBottom>
              <strong>Domaines supportés:</strong> Cognitif, Linguistique
              Interactionnelle, Analyse Conversationnelle
            </Typography>

            <Typography variant="body2" gutterBottom>
              <strong>Status migration:</strong> Phase de test et validation
            </Typography>

            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="caption" component="div">
                <strong>Structure framework:</strong>
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{ fontSize: "0.7rem" }}
              >
                {`metrics-framework/
├── core/
│   ├── types/base.ts
│   ├── BaseIndicator.ts
│   └── MetricsRegistry.ts
├── hooks/
│   └── useMetricsEngine.ts
└── cognitive-metrics/
    ├── indicators/
    └── migration/`}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Prochaines étapes:</strong> Une fois les tests basiques
              validés, l'interface complète de migration sera activée avec
              toutes les fonctionnalités avancées.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TestMigration;
