// src/components/calls/ui/components/DebugCallLoading.tsx
// Composant de diagnostic pour identifier le problème de chargement

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { ExpandMore, BugReport, Refresh } from "@mui/icons-material";
import supabaseClient from "@/lib/supabaseClient";
import { createServices } from "../../infrastructure/ServiceFactory";

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export const DebugCallLoading: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Connexion Supabase directe
    try {
      const start = Date.now();
      console.log("🔍 Test 1: Connexion Supabase directe...");

      const { data, error, count } = await supabaseClient
        .from("call")
        .select("*", { count: "exact" })
        .limit(5);

      addResult({
        step: "1. Connexion Supabase directe",
        success: !error,
        data: {
          totalCount: count,
          sampleSize: data?.length || 0,
          sample: data?.slice(0, 2).map((d) => ({
            callid: d.callid,
            filename: d.filename,
            is_tagging_call: d.is_tagging_call,
          })),
        },
        error: error?.message,
        duration: Date.now() - start,
      });
    } catch (err) {
      addResult({
        step: "1. Connexion Supabase directe",
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }

    // Test 2: Service Factory
    try {
      const start = Date.now();
      console.log("🔍 Test 2: Création des services...");

      const services = createServices();

      addResult({
        step: "2. Création des services DDD",
        success: !!services,
        data: {
          hasCallService: !!services.callService,
          hasCallRepository: !!services.callRepository,
          hasFactory: !!services.factory,
        },
        duration: Date.now() - start,
      });
    } catch (err) {
      addResult({
        step: "2. Création des services DDD",
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }

    // Test 3: Repository direct
    try {
      const start = Date.now();
      console.log("🔍 Test 3: Repository findAll...");

      const services = createServices();
      const calls = await services.callRepository.findAll(0, 5);

      addResult({
        step: "3. Repository findAll()",
        success: true,
        data: {
          callsCount: calls.length,
          firstCall: calls[0]
            ? {
                id: calls[0].id,
                filename: calls[0].filename,
                hasAudio: calls[0].hasValidAudio(),
                hasTranscription: calls[0].hasValidTranscription(),
              }
            : null,
        },
        duration: Date.now() - start,
      });
    } catch (err) {
      addResult({
        step: "3. Repository findAll()",
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }

    // Test 4: Hook useUnifiedCallManagement
    try {
      const start = Date.now();
      console.log("🔍 Test 4: Hook de management...");

      // Simuler l'appel du hook (sans les effets React)
      const services = createServices();
      const calls = await services.callRepository.findAll();

      // Validation des entités
      const validCalls = calls.filter((call) => {
        return call && typeof call.id === "string" && call.id.length > 0;
      });

      addResult({
        step: "4. Logique du hook (simulée)",
        success: true,
        data: {
          rawCallsCount: calls.length,
          validCallsCount: validCalls.length,
          invalidCalls: calls.length - validCalls.length,
        },
        duration: Date.now() - start,
      });
    } catch (err) {
      addResult({
        step: "4. Logique du hook (simulée)",
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }

    // Test 5: Vérification des colonnes de la table
    try {
      const start = Date.now();
      console.log("🔍 Test 5: Structure de la table...");

      const { data, error } = await supabaseClient
        .from("call")
        .select(
          "callid, filename, origine, status, filepath, transcription, is_tagging_call, created_at"
        )
        .limit(3);

      addResult({
        step: "5. Structure de la table",
        success: !error,
        data: {
          columnsPresent: data?.[0] ? Object.keys(data[0]) : [],
          sampleData: data?.map((d) => ({
            callid: d.callid,
            filename: d.filename,
            hasTranscription: !!d.transcription,
            is_tagging_call: d.is_tagging_call,
          })),
        },
        error: error?.message,
        duration: Date.now() - start,
      });
    } catch (err) {
      addResult({
        step: "5. Structure de la table",
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }

    setIsRunning(false);
  };

  const renderResult = (result: DebugResult, index: number) => (
    <Accordion key={index} defaultExpanded={!result.success}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <Typography variant="h6">{result.step}</Typography>
          {result.success ? (
            <Alert severity="success" sx={{ py: 0 }}>
              Succès
            </Alert>
          ) : (
            <Alert severity="error" sx={{ py: 0 }}>
              Échec
            </Alert>
          )}
          {result.duration && (
            <Typography variant="caption">({result.duration}ms)</Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {result.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Erreur:</strong> {result.error}
          </Alert>
        )}

        {result.data && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Données retournées:
            </Typography>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
                overflow: "auto",
                maxHeight: "300px",
              }}
            >
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <BugReport color="primary" />
          <Typography variant="h5">
            Diagnostic du Chargement des Appels
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Ce composant de debug teste chaque étape du chargement pour
            identifier où se situe le problème. Cliquez sur "Lancer le
            diagnostic" pour commencer.
          </Typography>
        </Alert>

        <Box mb={3}>
          <Button
            variant="contained"
            onClick={runDiagnostic}
            disabled={isRunning}
            startIcon={isRunning ? <LinearProgress /> : <Refresh />}
            size="large"
          >
            {isRunning ? "Diagnostic en cours..." : "Lancer le diagnostic"}
          </Button>
        </Box>

        {isRunning && <LinearProgress sx={{ mb: 3 }} />}

        {results.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Résultats du diagnostic:
            </Typography>

            {results.map(renderResult)}

            {!isRunning && (
              <Box mt={3}>
                <Alert
                  severity={
                    results.every((r) => r.success) ? "success" : "warning"
                  }
                >
                  <Typography variant="body2">
                    {results.every((r) => r.success)
                      ? "✅ Tous les tests sont passés. Le problème pourrait être dans React ou le hook."
                      : `❌ ${
                          results.filter((r) => !r.success).length
                        } test(s) échoué(s). Vérifiez les détails ci-dessus.`}
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        )}

        <Box mt={4}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Comment utiliser ce diagnostic:</strong>
              <br />
              1. Ajoutez ce composant temporairement à CallManagementPage
              <br />
              2. Lancez le diagnostic
              <br />
              3. Identifiez l'étape qui échoue
              <br />
              4. Corrigez le problème spécifique
              <br />
              5. Supprimez ce composant de debug
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
};
