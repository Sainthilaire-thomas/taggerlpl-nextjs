"use client";
import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  TablePagination,
  Autocomplete,
  TextField,
  Divider,
  Tooltip,
  FormControlLabel,
  Switch,
  IconButton,
  Collapse,
  Button,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import ModeCommentOutlinedIcon from "@mui/icons-material/ModeCommentOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AnnotationList from "./ResultsSample/components/AnnotationList";

export interface TVValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

interface ResultsSampleProps {
  results: TVValidationResult[];
  limit?: number;
  initialPageSize?: number;
}

type Tone = "A" | "B" | "CURRENT";

// Interface pour les données d'entraînement
interface FineTuningData {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  metadata: {
    turnId: number;
    verbatim: string;
    context: any;
    predicted: string;
    goldStandard: string;
    confidence: number;
    annotations: string[];
    algo: any;
  };
}

/** Ligne clampée + ton (petite pastille couleur + fond) */
const ToneLine: React.FC<{
  text?: string | null;
  prefix?: string;
  lines?: number;
  tone?: "A" | "B" | "CURRENT";
  strong?: boolean;
  italic?: boolean;
  tooltip?: string;
}> = ({ text, prefix, lines = 1, tone = "A", strong, italic, tooltip }) => {
  const theme = useTheme();
  const content = text ?? "—";

  const base =
    tone === "CURRENT"
      ? theme.palette.primary.main
      : theme.palette.text.primary;

  const bg =
    tone === "CURRENT"
      ? alpha(base, theme.palette.mode === "dark" ? 0.26 : 0.16)
      : "transparent";

  const ring =
    tone === "CURRENT"
      ? `inset 0 0 0 1px ${alpha(
          base,
          theme.palette.mode === "dark" ? 0.45 : 0.22
        )}`
      : undefined;

  const color =
    tone === "CURRENT"
      ? theme.palette.text.primary
      : theme.palette.text.secondary;

  const fontVariant = strong || tone === "CURRENT" ? "body2" : "caption";

  const node = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "start",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          mt: 0.25,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor:
            tone === "CURRENT"
              ? alpha(base, 0.5)
              : alpha(theme.palette.text.secondary, 0.35),
        }}
      />
      <Box
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: bg,
          boxShadow: ring,
        }}
      >
        <Typography
          variant={fontVariant}
          sx={{
            color,
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
            lineHeight: 1.25,
            fontWeight: tone === "CURRENT" ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {prefix ? `${prefix} ` : ""}
          {content}
        </Typography>
      </Box>
    </Box>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      <Box>{node}</Box>
    </Tooltip>
  ) : (
    node
  );
};

export const ResultsSample: React.FC<ResultsSampleProps> = ({
  results,
  limit,
  initialPageSize,
}) => {
  const theme = useTheme();

  // États pour filtres et pagination
  const [predFilter, setPredFilter] = React.useState<string[]>([]);
  const [realFilter, setRealFilter] = React.useState<string[]>([]);
  const [onlyDisagreements, setOnlyDisagreements] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(
    initialPageSize ?? limit ?? 10
  );

  // États pour commentaires
  const [openCommentFor, setOpenCommentFor] = React.useState<
    string | number | null
  >(null);
  const [draftComment, setDraftComment] = React.useState("");

  // États pour le fine-tuning
  const [showFineTuningDialog, setShowFineTuningDialog] = React.useState(false);
  const [fineTuningData, setFineTuningData] = React.useState<string>("");
  const [isExtracting, setIsExtracting] = React.useState(false);

  // Calculs avec useMemo
  const allPredTags = React.useMemo(() => {
    if (!results.length) return [];
    return Array.from(new Set(results.map((r) => r.predicted))).sort();
  }, [results]);

  const allRealTags = React.useMemo(() => {
    if (!results.length) return [];
    return Array.from(new Set(results.map((r) => r.goldStandard))).sort();
  }, [results]);

  const filtered = React.useMemo(() => {
    if (!results.length) return [];

    return results.filter(
      (r) =>
        (predFilter.length === 0 || predFilter.includes(r.predicted)) &&
        (realFilter.length === 0 || realFilter.includes(r.goldStandard)) &&
        (!onlyDisagreements || !r.correct)
    );
  }, [results, predFilter, realFilter, onlyDisagreements]);

  const pageItems = React.useMemo(() => {
    if (!filtered.length) return [];
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const totalErrors = React.useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.filter((r) => !r.correct).length;
  }, [filtered]);

  // useEffect pour reset page
  React.useEffect(
    () => setPage(0),
    [predFilter, realFilter, rowsPerPage, onlyDisagreements]
  );

  // Guard APRÈS tous les hooks
  if (!results.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Aucun résultat à afficher
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Largeurs fixes
  const COL_WIDTHS = {
    context: { minWidth: 520, maxWidth: 980 },
    tag: 120,
    conf: 110,
    time: 90,
    annot: 64,
  };

  // Fonction pour extraire les annotations et préparer le fine-tuning
  const extractAnnotationsForFineTuning = async () => {
    setIsExtracting(true);

    try {
      const annotatedResults = [];
      let processedCount = 0;
      let annotationsFound = 0;

      console.log(`🔍 Début extraction pour ${filtered.length} résultats...`);

      // Pour chaque résultat, récupérer les annotations
      for (const result of filtered) {
        const m = result.metadata || {};
        const turnId = m.turnId ?? m.id;

        processedCount++;

        if (!turnId) {
          console.warn(`❌ Pas de turnId pour le résultat ${processedCount}`);
          continue;
        }

        // Récupérer les annotations via API
        try {
          console.log(`📡 Récupération annotations pour turnId: ${turnId}`);
          const response = await fetch(`/api/turntagged/${turnId}/annotations`);

          if (!response.ok) {
            console.warn(
              `⚠️ API annotations failed for ${turnId}: ${response.status}`
            );
            continue;
          }

          const annotations = await response.json();
          console.log(
            `📝 Trouvé ${
              annotations?.length || 0
            } annotations pour turnId ${turnId}`
          );

          if (annotations && annotations.length > 0) {
            annotationsFound++;

            // Construire le contexte conversationnel
            const context = {
              prev2: m.prev2_turn_verbatim || null,
              prev1: m.prev1_turn_verbatim || null,
              current: result.verbatim,
              next1: m.next_turn_verbatim || null,
            };

            // Extraire les rationales des annotations
            const expertComments = annotations
              .map((ann: any) => ann.rationale || ann.comment || ann.note)
              .filter(Boolean);

            // Créer les données d'entraînement au format ChatML
            const trainingData: FineTuningData = {
              messages: [
                {
                  role: "system",
                  content: `Tu es un expert en analyse conversationnelle. Analyse le tour de parole dans son contexte et attribue le bon tag parmi les options disponibles. 

Instructions :
- Considère le contexte conversationnel complet (tours précédents et suivants)
- Identifie la stratégie ou l'intention communicative du locuteur
- Choisis le tag le plus approprié selon la taxonomie définie
- Justifie brièvement ton choix

Annotations d'experts disponibles :
${expertComments.map((comment) => `- ${comment}`).join("\n")}`,
                },
                {
                  role: "user",
                  content: `Contexte conversationnel :
${context.prev2 ? `Tour -2: ${context.prev2}` : ""}
${context.prev1 ? `Tour -1: ${context.prev1}` : ""}
**Tour à analyser**: ${context.current}
${context.next1 ? `Tour +1: ${context.next1}` : ""}

Quel tag attribuerais-tu à ce tour de parole ?`,
                },
                {
                  role: "assistant",
                  content: `Le tag approprié est **${result.goldStandard}**.

Justification : ${
                    expertComments[0] ||
                    "Tag correct selon l'annotation experte."
                  }`,
                },
              ],
              metadata: {
                turnId: parseInt(turnId),
                verbatim: result.verbatim,
                context,
                predicted: result.predicted,
                goldStandard: result.goldStandard,
                confidence: result.confidence,
                annotations: expertComments,
                algo: {
                  classifier: m.classifier || "unknown",
                  model: m.model || null,
                  type: m.type || null,
                  provider: m.provider || null,
                  temperature: m.temperature || null,
                  max_tokens: m.maxTokens || null,
                },
                rawAnnotations: annotations, // Garder les annotations complètes
              },
            };

            annotatedResults.push(trainingData);
          }
        } catch (error) {
          console.error(`❌ Erreur annotations pour ${turnId}:`, error);
        }
      }

      console.log(
        `✅ Extraction terminée: ${annotationsFound} exemples avec annotations trouvés sur ${processedCount} résultats traités`
      );

      if (annotatedResults.length === 0) {
        alert(
          `Aucune annotation trouvée dans les ${filtered.length} résultats. Ajoutez des annotations avant d'extraire les données de fine-tuning.`
        );
        return;
      }

      // Générer le prompt pour Claude avec les vraies données
      const claudePrompt = `# Données d'entraînement pour fine-tuning d'algorithme de tagging conversationnel

## Contexte
Ces données proviennent d'un système d'analyse conversationnelle où des experts ont annoté ${
        annotatedResults.length
      } tours de parole incorrectement classifiés par l'algorithme actuel.

## Statistiques
- **Total d'exemples annotés**: ${annotatedResults.length}
- **Sur total de résultats**: ${filtered.length}
- **Taux d'annotation**: ${(
        (annotatedResults.length / filtered.length) *
        100
      ).toFixed(1)}%
- **Algorithme source**: ${results[0]?.metadata?.classifier || "Non spécifié"}
- **Modèle**: ${results[0]?.metadata?.model || "Non spécifié"}
- **Taux d'erreur global**: ${((totalErrors / filtered.length) * 100).toFixed(
        1
      )}%

## Données d'entraînement (format JSONL)

\`\`\`jsonl
${annotatedResults.map((data) => JSON.stringify(data, null, 0)).join("\n")}
\`\`\`

## Analyse des erreurs communes

${generateErrorAnalysis(annotatedResults)}

## Exemples d'annotations d'experts

${annotatedResults
  .slice(0, 3)
  .map(
    (data, idx) => `
### Exemple ${idx + 1}
- **Verbatim**: "${data.metadata.verbatim}"
- **Prédit**: ${data.metadata.predicted} | **Réel**: ${
      data.metadata.goldStandard
    }
- **Confiance**: ${(data.metadata.confidence * 100).toFixed(1)}%
- **Annotation**: ${data.metadata.annotations[0] || "Pas d'annotation"}
`
  )
  .join("\n")}

## Recommandations pour le fine-tuning

1. **Contexte conversationnel** : L'algorithme doit mieux prendre en compte les tours précédents et suivants
2. **Annotations d'experts** : Utiliser les ${annotatedResults.reduce(
        (acc, d) => acc + d.metadata.annotations.length,
        0
      )} justifications pour améliorer la compréhension des nuances
3. **Cas d'erreur fréquents** : Focus sur les patterns identifiés dans l'analyse
4. **Validation croisée** : Tester sur un ensemble de validation distinct

## Instructions d'utilisation

1. Utilise ces ${
        annotatedResults.length
      } exemples pour créer un dataset d'entraînement
2. Implémente les recommandations ci-dessus
3. Teste le modèle fine-tuné sur un échantillon de validation
4. Compare les performances avant/après fine-tuning

## Métadonnées techniques

\`\`\`json
{
  "extraction_date": "${new Date().toISOString()}",
  "total_examples": ${annotatedResults.length},
  "unique_algorithms": ${
    [...new Set(annotatedResults.map((d) => d.metadata.algo.classifier))].length
  },
  "annotation_coverage": "${(
    (annotatedResults.length / filtered.length) *
    100
  ).toFixed(1)}%"
}
\`\`\`

Est-ce que tu peux m'aider à analyser ces **vraies données d'annotations** et proposer des améliorations spécifiques pour l'algorithme ?`;

      setFineTuningData(claudePrompt);
      setShowFineTuningDialog(true);
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction:", error);
      alert(`Erreur lors de l'extraction des annotations: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Fonction pour analyser les erreurs communes
  const generateErrorAnalysis = (data: FineTuningData[]) => {
    const errorPatterns: { [key: string]: number } = {};
    const confusionMatrix: { [key: string]: { [key: string]: number } } = {};

    data.forEach((item) => {
      const predicted = item.metadata.predicted;
      const gold = item.metadata.goldStandard;

      if (predicted !== gold) {
        const pattern = `${predicted} → ${gold}`;
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;

        if (!confusionMatrix[predicted]) confusionMatrix[predicted] = {};
        confusionMatrix[predicted][gold] =
          (confusionMatrix[predicted][gold] || 0) + 1;
      }
    });

    const sortedErrors = Object.entries(errorPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return `### Erreurs les plus fréquentes :
${sortedErrors
  .map(([pattern, count]) => `- **${pattern}**: ${count} occurrences`)
  .join("\n")}

### Matrice de confusion (top erreurs) :
${Object.entries(confusionMatrix)
  .slice(0, 3)
  .map(
    ([pred, golds]) =>
      `- **Prédit ${pred}** : ${Object.entries(golds)
        .map(([gold, count]) => `${gold}(${count})`)
        .join(", ")}`
  )
  .join("\n")}`;
  };

  // Handlers pour commentaires
  const saveComment = async (row: TVValidationResult) => {
    const turnId = row.metadata?.turnId ?? row.metadata?.id;
    if (!turnId) return;

    const m = row.metadata || {};

    const payload = {
      note: draftComment,
      gold: row.goldStandard,
      predicted: row.predicted,
      confidence: row.confidence,
      context: {
        prev2: m.prev2_turn_verbatim || null,
        prev1: m.prev1_turn_verbatim || null,
        current: row.verbatim,
        next1: m.next_turn_verbatim || null,
      },
      classifier: m.classifier || "unknown",
      created_at: new Date().toISOString(),
      algo: {
        classifier: String(m.classifier ?? "unknown"),
        type: (m.type as any) || undefined,
        model: (m.model as string) || undefined,
        provider: /openai|gpt/i.test(`${m.model ?? ""}`) ? "openai" : undefined,
        temperature:
          typeof m.temperature === "number" ? m.temperature : undefined,
        max_tokens: typeof m.maxTokens === "number" ? m.maxTokens : undefined,
      },
    };

    try {
      const res = await fetch(`/api/turntagged/${turnId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setOpenCommentFor(null);
      setDraftComment("");
    } catch (e: any) {
      alert(`Échec sauvegarde note: ${e?.message || e}`);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fineTuningData);
      alert("Données copiées dans le presse-papiers !");
    } catch (error) {
      console.error("Erreur copie:", error);
    }
  };

  const downloadData = () => {
    const blob = new Blob([fineTuningData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fine-tuning-data-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2, flexWrap: "wrap", rowGap: 2 }}
          >
            <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
              Échantillon de Résultats
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: "wrap" }}
            >
              <Button
                variant="outlined"
                startIcon={<SmartToyIcon />}
                onClick={extractAnnotationsForFineTuning}
                disabled={isExtracting || totalErrors === 0}
                size="small"
                color="secondary"
              >
                {isExtracting ? "Extraction..." : "Fine-tuning"}
              </Button>

              <FormControlLabel
                control={
                  <Switch
                    checked={onlyDisagreements}
                    onChange={(_, v) => setOnlyDisagreements(v)}
                    size="small"
                  />
                }
                label="Désaccords uniquement"
                sx={{ m: 0 }}
              />
              <Chip label={`Total: ${filtered.length}`} size="small" />
              <Chip
                label={`Erreurs: ${totalErrors}`}
                size="small"
                color={totalErrors > 0 ? "warning" : "success"}
              />
            </Stack>
          </Stack>

          {/* Filtres */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Autocomplete
              multiple
              options={allPredTags}
              value={predFilter}
              onChange={(_, val) => setPredFilter(val)}
              renderInput={(params) => (
                <TextField {...params} label="Filtre Tag PRÉDIT" size="small" />
              )}
              sx={{ minWidth: 260, flex: 1 }}
            />

            <Autocomplete
              multiple
              options={allRealTags}
              value={realFilter}
              onChange={(_, val) => setRealFilter(val)}
              renderInput={(params) => (
                <TextField {...params} label="Filtre Tag RÉEL" size="small" />
              )}
              sx={{ minWidth: 260, flex: 1 }}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ overflowX: "auto" }}
          >
            <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      minWidth: { xs: 420, md: COL_WIDTHS.context.minWidth },
                      maxWidth: COL_WIDTHS.context.maxWidth,
                    }}
                  >
                    Contexte (−2 & 0 = ton A) / (−1 & +1 = ton B)
                  </TableCell>
                  <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                    Prédit
                  </TableCell>
                  <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                    Réel
                  </TableCell>
                  <TableCell align="center" sx={{ width: COL_WIDTHS.conf }}>
                    Confiance
                  </TableCell>
                  <TableCell align="center" sx={{ width: COL_WIDTHS.time }}>
                    Temps
                  </TableCell>
                  <TableCell align="center" sx={{ width: COL_WIDTHS.annot }}>
                    Annot.
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pageItems.map((r, idx) => {
                  const m = r.metadata || {};
                  const prev2 = m.prev2_turn_verbatim as string | undefined;
                  const prev1 = m.prev1_turn_verbatim as string | undefined;
                  const next1 = m.next_turn_verbatim as string | undefined;

                  const p2prefix = m.prev2_speaker
                    ? `[${m.prev2_speaker}]`
                    : "−2";
                  const p1prefix = m.prev1_speaker
                    ? `[${m.prev1_speaker}]`
                    : "−1";

                  const isOdd = idx % 2 === 1;
                  const base = isOdd
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main;
                  const BG_ALPHA = theme.palette.mode === "dark" ? 0.1 : 0.07;
                  const EDGE_ALPHA = theme.palette.mode === "dark" ? 0.55 : 0.4;

                  const groupBg = alpha(base, BG_ALPHA);
                  const groupEdge = alpha(base, EDGE_ALPHA);

                  const rowOpen = openCommentFor === (m.turnId ?? idx);

                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            sx={{ p: 0, border: 0, height: 8 }}
                          />
                        </TableRow>
                      )}

                      {/* LIGNE PRINCIPALE DU PASSAGE */}
                      <TableRow
                        hover
                        sx={{
                          "& > td": { backgroundColor: groupBg },
                          "& > td:first-of-type": {
                            borderLeft: `6px solid ${groupEdge}`,
                            borderTopLeftRadius: 10,
                            borderBottomLeftRadius: 10,
                          },
                          "& > td:last-of-type": {
                            borderTopRightRadius: 10,
                            borderBottomRightRadius: 10,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            py: 0.75,
                            maxWidth: COL_WIDTHS.context.maxWidth,
                          }}
                        >
                          <Box sx={{ display: "grid", gap: 0.5 }}>
                            <ToneLine
                              text={prev2}
                              prefix={p2prefix}
                              tone="A"
                              italic
                              tooltip={prev2 || ""}
                            />
                            <ToneLine
                              text={prev1}
                              prefix={p1prefix}
                              tone="B"
                              tooltip={prev1 || ""}
                            />
                            <ToneLine
                              text={r.verbatim}
                              prefix="0"
                              tone="CURRENT"
                              strong
                              lines={2}
                              tooltip={r.verbatim}
                            />
                            <ToneLine
                              text={next1}
                              prefix="+1"
                              tone="B"
                              italic
                              tooltip={next1 || ""}
                            />
                          </Box>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Tooltip
                            title={
                              r.metadata?.rawResponse
                                ? `LLM: ${r.metadata.rawResponse}`
                                : r.metadata?.error
                                ? `Erreur: ${r.metadata.error}`
                                : ""
                            }
                            arrow
                          >
                            <Chip
                              label={r.predicted}
                              size="small"
                              color={r.correct ? "default" : "error"}
                              sx={{
                                maxWidth: 110,
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Chip
                            label={r.goldStandard}
                            size="small"
                            color="success"
                            sx={{
                              maxWidth: 110,
                              "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "bold",
                              color: r.correct
                                ? "success.main"
                                : r.confidence > 0.7
                                ? "error.main"
                                : "warning.main",
                            }}
                          >
                            {(r.confidence * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Typography variant="caption">
                            {r.processingTime ?? 0} ms
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <AnnotationList
                            turnId={Number(m.turnId ?? m.id ?? idx)}
                            verbatim={r.verbatim}
                            context={{
                              prev2: m.prev2_turn_verbatim,
                              prev1: m.prev1_turn_verbatim,
                              next1: m.next_turn_verbatim,
                            }}
                            predicted={r.predicted}
                            gold={r.goldStandard}
                            author="analyst"
                            algo={{
                              classifier: String(m.classifier ?? "unknown"),
                              type: (m.type as any) || undefined,
                              model: (m.model as string) || undefined,
                              provider: /openai|gpt/i.test(`${m.model ?? ""}`)
                                ? "openai"
                                : undefined,
                              temperature:
                                typeof m.temperature === "number"
                                  ? m.temperature
                                  : undefined,
                              max_tokens:
                                typeof m.maxTokens === "number"
                                  ? m.maxTokens
                                  : undefined,
                            }}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Ligne commentaire */}
                      <TableRow
                        sx={{
                          "& > td": { backgroundColor: groupBg },
                          "& > td:first-of-type": {
                            borderLeft: `6px solid ${groupEdge}`,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 10,
                          },
                          "& > td:last-of-type": {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 10,
                          },
                        }}
                      >
                        <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                          <Collapse in={rowOpen} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                p: 1.5,
                                display: "grid",
                                gap: 1,
                                backgroundColor: alpha(base, BG_ALPHA + 0.03),
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Écrivez une courte interprétation du tour en
                                fonction du contexte (utile pour le fine-tuning
                                et le partage d'exemples).
                              </Typography>

                              <TextField
                                value={draftComment}
                                onChange={(e) =>
                                  setDraftComment(e.target.value)
                                }
                                placeholder="Ex. Ici le conseiller acquiesce puis oriente vers une action client…"
                                multiline
                                minRows={2}
                                maxRows={6}
                                fullWidth
                                size="small"
                              />

                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                              >
                                <Button
                                  variant="text"
                                  size="small"
                                  startIcon={<CloseOutlinedIcon />}
                                  onClick={() => {
                                    setOpenCommentFor(null);
                                    setDraftComment("");
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<SaveOutlinedIcon />}
                                  onClick={() => saveComment(r)}
                                  disabled={!draftComment.trim()}
                                >
                                  Enregistrer
                                </Button>
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}

                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucun résultat ne correspond aux filtres.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Taille de page"
          />
        </CardContent>
      </Card>

      {/* Dialog Fine-tuning */}
      <Dialog
        open={showFineTuningDialog}
        onClose={() => setShowFineTuningDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6">Données pour Fine-tuning</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="info">
              <Typography variant="body2">
                Ces données sont prêtes à être utilisées avec Claude pour
                analyser les erreurs et améliorer l'algorithme. Elles incluent
                le contexte, les annotations d'experts et les métriques de
                performance.
              </Typography>
            </Alert>

            <TextField
              multiline
              fullWidth
              rows={20}
              value={fineTuningData}
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  "& .MuiInputBase-input": {
                    lineHeight: 1.4,
                  },
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={copyToClipboard}
            variant="outlined"
          >
            Copier
          </Button>

          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadData}
            variant="outlined"
          >
            Télécharger
          </Button>

          <Button
            onClick={() => setShowFineTuningDialog(false)}
            variant="contained"
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
