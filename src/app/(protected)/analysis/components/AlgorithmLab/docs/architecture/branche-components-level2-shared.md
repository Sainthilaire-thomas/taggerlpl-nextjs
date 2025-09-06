# Documentation Components Level2 & Shared - AlgorithmLab

## Vue d'ensemble

Le module **Level2** implémente la **validation scientifique de l'hypothèse H1** : "Les descriptions d'actions (ENGAGEMENT + OUVERTURE) génèrent plus de réactions positives que les explications." Il s'appuie sur des tests statistiques robustes et une configuration paramétrable pour valider empiriquement les théories de la thèse.

Le module **Shared** fournit l'infrastructure commune pour l'orchestration des trois niveaux de validation et la navigation entre eux.

---

## 🧪 Level2 - Validation Scientifique H1

### Architecture générale

```
components/Level2/
├── Level2Interface.tsx          # Interface principale orchestratrice
├── config/
│   └── hypotheses.ts           # Configuration seuils validation
├── shared/
│   ├── stats.ts               # Moteur calculs statistiques
│   └── types.ts               # Types pour analyses H1
├── validation/
│   ├── StatisticalSummary.tsx  # Rapport académique
│   └── StatisticalTestsPanel.tsx # Tests détaillés
└── hypothesis/                # Futurs H2, H3 (extensions)
    ├── H2AlignmentValidation.tsx
    └── H3ApplicationValidation.tsx
```

### 1. 🎛️ Level2Interface - Orchestrateur principal

**Localisation** : `components/Level2/Level2Interface.tsx`

#### Fonctionnalités clés

- **Validation multi-seuils** : Configuration STRICT / REALISTIC / EMPIRICAL
- **Critères H1 complets** : 6 critères positifs et négatifs
- **Tests statistiques** : χ², V de Cramér, Fisher, ANOVA
- **Interface adaptive** : Codes couleurs selon validation

```typescript
interface Level2InterfaceProps {
  selectedOrigin?: string | null;
  thresholds?: H1Thresholds;
}

export const Level2Interface: React.FC<Level2InterfaceProps> = ({
  selectedOrigin,
  thresholds: providedThresholds,
}) => {
  // Configuration des seuils adaptatifs
  const [thresholdMode, setThresholdMode] = useState<
    "STRICT" | "REALISTIC" | "EMPIRICAL"
  >("REALISTIC");

  const activeThresholds =
    providedThresholds || getContextualThresholds(thresholdMode);

  // Filtrage et analyse des données
  const validTurnTagged = useMemo(
    () => filterValidTurnTagged(allTurnTagged, tags, selectedOrigin),
    [allTurnTagged, tags, selectedOrigin]
  );

  const h1Analysis = useMemo(
    () => computeH1Analysis(validTurnTagged, tags),
    [validTurnTagged, tags]
  );

  const h1Summary = useMemo(
    () => summarizeH1(h1Analysis, activeThresholds),
    [h1Analysis, activeThresholds]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* Synthèse de validation H1 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">
          Synthèse de Validation H1 (Critères Complets)
        </Typography>

        {/* Score global avec barre de progression */}
        {detailedCriteria && (
          <LinearProgress
            value={
              (detailedCriteria.overallScore / detailedCriteria.maxScore) * 100
            }
            sx={{
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  detailedCriteria.overallScore >= 4
                    ? "success.main"
                    : "warning.main",
              },
            }}
          />
        )}

        {/* Grille de critères */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {detailedCriteria.criteriaDetails.map((criterion, idx) => (
            <Card
              key={idx}
              variant="outlined"
              sx={{
                backgroundColor: criterion.met
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
              }}
            >
              <CardContent>
                {criterion.met ? <CheckCircle /> : <Cancel />}
                <Typography variant="body2">{criterion.name}</Typography>
                <Typography variant="caption">
                  {criterion.value} (seuil: {criterion.threshold})
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Onglets de navigation */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
        <Tab label="Aperçu H1" />
        <Tab label="Données Détaillées" />
        <Tab label="Tests Statistiques" />
        <Tab label="Rapport Académique" />
      </Tabs>
    </Box>
  );
};
```

#### Organisation des onglets

| Onglet                 | Contenu                        | Description                     |
| ---------------------- | ------------------------------ | ------------------------------- |
| **Aperçu H1**          | Synthèse validation + critères | Vue d'ensemble de la validation |
| **Données Détaillées** | Tableau par stratégie          | Données brutes et metrics       |
| **Tests Statistiques** | χ², Fisher, ANOVA              | Détails techniques des tests    |
| **Rapport Académique** | StatisticalSummary             | Rapport formaté pour thèse      |

### 2. 📊 Configuration parametrable - hypotheses.ts

**Localisation** : `components/Level2/config/hypotheses.ts`

#### Types de configuration

```typescript
export interface H1Thresholds {
  // Critères positifs (actions)
  actions: {
    minPositiveRate: number; // ENGAGEMENT + OUVERTURE doivent dépasser ce %
    maxNegativeRate: number; // ENGAGEMENT + OUVERTURE doivent rester sous ce %
  };

  // Critères négatifs (explications)
  explanations: {
    maxPositiveRate: number; // EXPLICATION doit rester sous ce %
    minNegativeRate: number; // EXPLICATION doit dépasser ce %
  };

  // Écart empirique
  empirical: {
    minDifference: number; // Différence minimale Actions-Explications
    substantialThreshold: number; // Seuil pour écart "substantiel"
  };

  // Taille échantillon
  sample: {
    minNPerGroup: number; // N minimal par stratégie
    minNTotal: number; // N minimal total
    warningNPerGroup: number; // Seuil d'avertissement
  };

  // Tests statistiques
  statistical: {
    alphaLevel: number; // Seuil significativité
    cramersVThreshold: number; // V minimal effet "fort"
    cramersVModerate: number; // V minimal effet "modéré"
  };

  // Score validation global
  validation: {
    minScoreForValidated: number; // Score min "VALIDATED"
    minScoreForPartial: number; // Score min "PARTIALLY_VALIDATED"
    maxCriteria: number; // Nombre total critères
  };
}
```

#### Configurations prédéfinies

```typescript
// Configuration académique stricte
export const DEFAULT_H1_THRESHOLDS: H1Thresholds = {
  actions: {
    minPositiveRate: 50.0, // Actions >50% positif
    maxNegativeRate: 25.0, // Actions <25% négatif
  },
  explanations: {
    maxPositiveRate: 5.0, // Explications <5% positif
    minNegativeRate: 75.0, // Explications >75% négatif
  },
  empirical: {
    minDifference: 15.0, // Écart ≥15 points
    substantialThreshold: 30.0,
  },
  // ... autres seuils
};

// Configuration réaliste (corpus réels)
export const REALISTIC_H1_THRESHOLDS: H1Thresholds = {
  actions: {
    minPositiveRate: 35.0, // Abaissé à 35%
    maxNegativeRate: 30.0, // Assoupli à 30%
  },
  explanations: {
    maxPositiveRate: 10.0, // Assoupli à 10%
    minNegativeRate: 60.0, // Abaissé à 60%
  },
  // ... adaptations réalistes
};

// Configuration empirique (basée sur données)
export const EMPIRICAL_H1_THRESHOLDS: H1Thresholds = {
  actions: {
    minPositiveRate: 40.0, // Basé sur ENGAGEMENT 41%
    maxNegativeRate: 35.0, // Marge pour variabilité
  },
  // ... calibrage sur corpus
};

// Fonction de sélection contextuelle
export function getContextualThresholds(
  context: "STRICT" | "REALISTIC" | "EMPIRICAL" = "REALISTIC"
): H1Thresholds {
  switch (context) {
    case "STRICT":
      return DEFAULT_H1_THRESHOLDS;
    case "EMPIRICAL":
      return EMPIRICAL_H1_THRESHOLDS;
    default:
      return REALISTIC_H1_THRESHOLDS;
  }
}
```

### 3. 🔬 Moteur statistique - stats.ts

**Localisation** : `components/Level2/shared/stats.ts`

#### Pipeline de traitement

```typescript
// 1) Filtrage robuste (inspiré Level1)
export function filterValidTurnTagged(
  allTurnTagged: any[],
  tags: any[],
  selectedOrigin?: string | null
): any[] {
  const allowedConseillerLabels = useAllowedConseillerLabels(tags);

  return allTurnTagged.filter(t => {
    // Validation structure + origine
    const okOrigin = !selectedOrigin || t.origin === selectedOrigin;
    if (!okOrigin) return false;

    // Paires adjacentes complètes
    if (!t.verbatim?.trim() || !t.next_turn_verbatim?.trim()) return false;

    // Tags conseiller valides
    const hasValidConseillerTag = /* logique d'extraction */;

    // Tags client valides
    const hasValidClientTag = /* validation CLIENT_POSITIF/NEGATIF/NEUTRE */;

    return hasValidConseillerTag && hasValidClientTag;
  });
}

// 2) Analyse H1 par stratégie
export function computeH1Analysis(
  validTurnTagged: any[],
  tags: any[]
): H1StrategyData[] {
  const map: Record<string, {pos: number, neg: number, neu: number, total: number}> = {};

  for (const t of validTurnTagged) {
    const strategy = extractConseillerStrategy(t, allowedLabels);
    const clientReaction = extractClientReaction(t);

    // Comptage par stratégie et réaction
    map[strategy] = map[strategy] || {pos: 0, neg: 0, neu: 0, total: 0};
    map[strategy].total += 1;

    switch (clientReaction) {
      case "POSITIF": map[strategy].pos += 1; break;
      case "NEGATIF": map[strategy].neg += 1; break;
      default: map[strategy].neu += 1;
    }
  }

  // Transformation en pourcentages et efficacité
  return Object.entries(map).map(([strategy, v]) => ({
    strategy,
    totalSamples: v.total,
    positiveCount: v.pos,
    negativeCount: v.neg,
    neutralCount: v.neu,
    positiveRate: Math.round((v.pos / v.total) * 100),
    negativeRate: Math.round((v.neg / v.total) * 100),
    neutralRate: Math.round((v.neu / v.total) * 100),
    effectiveness: positiveRate - negativeRate
  }));
}

// 3) Tests statistiques
export function computeChiSquare(rows: H1StrategyData[]): ChiSquareResult {
  const contingency = rows.map(r => [r.positiveCount, r.neutralCount, r.negativeCount]);
  const grandTotal = contingency.flat().reduce((a, b) => a + b, 0);

  let chi = 0;
  // Calcul χ² standard avec valeurs attendues

  const df = (contingency.length - 1) * 2;
  const p = approxChiSquarePValue(chi, df);
  const v = Math.sqrt(chi / (grandTotal * Math.min(contingency.length - 1, 2)));

  return {
    statistic: chi,
    pValue: p,
    degreesOfFreedom: df,
    cramersV: v,
    significant: p < 0.05,
    interpretation: v < 0.1 ? "faible" : v < 0.3 ? "modéré" : "fort",
    contingency
  };
}

export function computeFisherPairwise(rows: H1StrategyData[]): FisherPairwise[] {
  // Tests 2x2 pour chaque paire de stratégies
  const pairs: FisherPairwise[] = [];

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const or = /* calcul odds ratio */;
      const p = /* approximation p-value Fisher */;

      pairs.push({
        comparison: `${rows[i].strategy} vs ${rows[j].strategy}`,
        oddsRatio: or,
        pValue: p,
        significant: p < 0.05
      });
    }
  }

  return pairs;
}

// 4) Résumé H1 avec validation complète
export function summarizeH1(
  rows: H1StrategyData[],
  thresholds: H1Thresholds
): H1Summary {
  // Calculs moyennes Actions vs Explications
  const actions = rows.filter(r => ["ENGAGEMENT", "OUVERTURE"].includes(r.strategy));
  const explanation = rows.find(r => r.strategy === "EXPLICATION");

  const actionsAverage = actions.reduce((s, r) => s + r.positiveRate, 0) / actions.length;
  const actionsNegativeAverage = actions.reduce((s, r) => s + r.negativeRate, 0) / actions.length;

  // Tests statistiques
  const chiSquare = computeChiSquare(rows);
  const fisher = computeFisherPairwise(rows);

  // Validation complète avec critères étendus
  const validation = evaluateH1Criteria(
    actionsAverage,
    actionsNegativeAverage,
    explanation?.positiveRate ?? 0,
    explanation?.negativeRate ?? 0,
    actionsAverage - (explanation?.positiveRate ?? 0),
    chiSquare.pValue,
    chiSquare.cramersV,
    {
      total: rows.reduce((s, r) => s + r.totalSamples, 0),
      perGroup: rows.map(r => r.totalSamples)
    },
    thresholds
  );

  return {
    // Métriques de base
    actionsAverage,
    actionsNegativeAverage,
    explanationPositive: explanation?.positiveRate ?? 0,
    explanationNegative: explanation?.negativeRate ?? 0,
    empiricalDifference: actionsAverage - (explanation?.positiveRate ?? 0),

    // Tests statistiques
    chiSquare,
    fisher,

    // Validation étendue
    overallValidation: validation.status === "VALIDATED" ? "VALIDATED" :
                      validation.status === "PARTIALLY_VALIDATED" ? "PARTIALLY_VALIDATED" :
                      "NOT_VALIDATED",

    validation, // Objet complet pour interface
    thresholds,
    sampleSizeAdequate: validation.criteria.sampleSizeAdequate,
    confidence: validation.confidence,

    // Conclusions académiques
    academicConclusion: generateAcademicConclusion(validation),
    practicalImplications: validation.recommendations.slice(0, 2),
    limitationsNoted: validation.criteria.warningsIssued
  };
}
```

### 4. 📋 Composants de validation

#### A. StatisticalSummary - Rapport académique

**Localisation** : `components/Level2/validation/StatisticalSummary.tsx`

```typescript
interface Props {
  data: StrategyStats[];
  validationResults: H1Summary;
  activeThresholds?: H1Thresholds;
}

const StatisticalSummary: React.FC<Props> = ({
  data,
  validationResults,
  activeThresholds,
}) => {
  return (
    <Paper sx={styles.mainContainer}>
      {/* En-tête avec statut validation */}
      <Box sx={styles.headerBox}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Synthèse Académique - Validation H1
        </Typography>
      </Box>

      {/* Statut global avec icône */}
      <Box sx={styles.conclusionBox}>
        {validationResults.overallValidation === "VALIDATED" ? (
          <CheckCircle sx={{ fontSize: 32, color: "success.main" }} />
        ) : (
          <Cancel sx={{ fontSize: 32, color: "error.main" }} />
        )}

        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          HYPOTHÈSE H1 :{" "}
          {validationResults.overallValidation === "VALIDATED"
            ? "PLEINEMENT VALIDÉE"
            : "NON VALIDÉE"}
        </Typography>

        <Typography variant="body1" sx={{ fontStyle: "italic" }}>
          "{validationResults.academicConclusion}"
        </Typography>
      </Box>

      {/* Métriques clés en cartes */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <TrendingUp color="success" />
            <Typography variant="h5">
              +{validationResults.empiricalDifference.toFixed(1)}
            </Typography>
            <Typography variant="body2">
              Points d'écart (Actions – Explications)
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Timeline
              color={
                validationResults.chiSquare.significant ? "success" : "error"
              }
            />
            <Typography variant="h6">χ² Test</Typography>
            <Typography variant="body2">
              χ²({validationResults.chiSquare.degreesOfFreedom}) ={" "}
              {validationResults.chiSquare.statistic}
            </Typography>
            <Chip
              label={
                validationResults.chiSquare.significant
                  ? "SIGNIFICATIF"
                  : "NON SIG."
              }
              color={
                validationResults.chiSquare.significant ? "success" : "error"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Assessment color="info" />
            <Typography variant="h6">Taille d'Effet (V)</Typography>
            <Typography variant="body2">
              V = {validationResults.chiSquare.cramersV}({
                validationResults.chiSquare.interpretation
              })
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tableau des résultats par stratégie */}
      <Typography variant="h6" gutterBottom>
        Résultats Empiriques par Stratégie
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow
              sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <TableCell sx={{ fontWeight: "bold" }}>Stratégie</TableCell>
              <TableCell align="center" sx={{ color: "success.main" }}>
                Réactions Positives
              </TableCell>
              <TableCell align="center" sx={{ color: "error.main" }}>
                Réactions Négatives
              </TableCell>
              <TableCell align="center">Échantillon (n)</TableCell>
              <TableCell align="center">Efficacité</TableCell>
              <TableCell>Validation H1</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .sort((a, b) => b.effectiveness - a.effectiveness)
              .map((s) => {
                const isAction =
                  s.strategy === "ENGAGEMENT" || s.strategy === "OUVERTURE";
                const meetsH1 = isAction ? s.positive > 50 : s.positive < 20;

                return (
                  <TableRow key={s.strategy}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {s.strategy}
                      {isAction && (
                        <Chip label="ACTION" color="primary" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.positive > 40 ? "success.main" : "text.primary",
                        }}
                      >
                        {s.positive.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.negative > 50 ? "error.main" : "text.primary",
                        }}
                      >
                        {s.negative.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{s.total}</TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.effectiveness > 0 ? "success.main" : "error.main",
                        }}
                      >
                        {s.effectiveness > 0 ? "+" : ""}
                        {s.effectiveness.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={meetsH1 ? <CheckCircle /> : <Cancel />}
                        label={meetsH1 ? "CONFORME H1" : "NON CONFORME"}
                        color={meetsH1 ? "success" : "error"}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
```

#### B. StatisticalTestsPanel - Tests détaillés

**Localisation** : `components/Level2/validation/StatisticalTestsPanel.tsx`

Interface pour explorer en détail les tests statistiques :

```typescript
const StatisticalTestsPanel: React.FC<{ data: H1StrategyData[] }> = ({
  data,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const chi = useMemo(() => computeChiSquare(data), [data]);
  const fisher = useMemo(() => computeFisherPairwise(data), [data]);
  const anova = useMemo(() => computeAnova(data), [data]);

  return (
    <Box>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Test χ² d'Indépendance" icon={<Assessment />} />
        <Tab label="Tests Exacts Fisher" icon={<Timeline />} />
        <Tab label="ANOVA Proportions" icon={<TrendingUp />} />
        <Tab label="Synthèse" icon={<Science />} />
      </Tabs>

      {/* Onglet χ² */}
      {tabValue === 0 && (
        <Box>
          <Alert severity={chi.significant ? "success" : "warning"}>
            Test χ² d'Indépendance:{" "}
            {chi.significant ? "SIGNIFICATIF" : "NON SIGNIFICATIF"}
            <br />
            χ²({chi.degreesOfFreedom}) = {chi.statistic}, p{" "}
            {chi.pValue < 0.001 ? "< 0.001" : `= ${chi.pValue}`}• V = {
              chi.cramersV
            } ({chi.interpretation})
          </Alert>

          {/* Tableau de contingence */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align="center">Positif</TableCell>
                  <TableCell align="center">Neutre</TableCell>
                  <TableCell align="center">Négatif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((s, i) => (
                  <TableRow key={s.strategy}>
                    <TableCell>{s.strategy}</TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[0]}
                    </TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[1]}
                    </TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[2]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Autres onglets... */}
    </Box>
  );
};
```

### 5. 🚀 Évolutions futures

#### Roadmap Level2 (prochaines PRs)

- **PR1** : Critères H1 complets (seuils négatifs + configuration)
- **PR2** : Garde-fous taille échantillon + REFLET toggle
- **PR3** : Run history (table Supabase + reproductibilité)
- **PR4** : Export CSV/JSON/PDF + performance optimisée
- **PR5** : Configuration centralisée + types TypeScript stricts

---

## 🔗 Shared Components - Infrastructure commune

### Architecture générale

```
components/shared/
├── AlgorithmLabInterface.tsx    # Interface principale intégrée
├── NavigationTabs.tsx          # Navigation entre niveaux
├── ClassifierSelector.tsx      # Sélecteur d'algorithmes
└── PerformanceDashBoard.tsx    # Dashboard métriques (futur)
```

### 1. 🎯 AlgorithmLabInterface - Interface principale

**Localisation** : `components/shared/AlgorithmLabInterface.tsx`

#### Orchestration des 3 niveaux

```typescript
interface AlgorithmLabInterfaceProps {
  selectedOrigin?: string | null;
  availableDomains?: string[];
  availableIndicators?: string[];
}

export const AlgorithmLabInterface: React.FC<AlgorithmLabInterfaceProps> = ({
  selectedOrigin,
  availableDomains,
  availableIndicators,
}) => {
  const { currentLevel, setCurrentLevel, validationLevels, canAccessLevel } =
    useWorkflowManagement();

  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 0:
        return <InterAnnotatorAgreement />;
      case 1:
        return <Level1Interface />;
      case 2:
        return <Level2Interface selectedOrigin={selectedOrigin} />;
      default:
        return <InterAnnotatorAgreement />;
    }
  };

  return (
    <Box sx={styles.mainContainer}>
      {/* Header adapté pour intégration dans /analysis */}
      <Paper elevation={1} sx={styles.headerPaper}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TestTube sx={{ color: "white", fontSize: "24px" }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                Algorithm Lab
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Framework de validation scientifique à 3 niveaux
              </Typography>
              {selectedOrigin && (
                <Typography variant="body2" sx={{ color: "primary.main" }}>
                  Origine sélectionnée: <strong>{selectedOrigin}</strong>
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Navigation adaptative */}
      <NavigationTabs
        levels={validationLevels}
        currentLevel={currentLevel}
        onLevelChange={setCurrentLevel}
        canAccessLevel={canAccessLevel}
      />

      {/* Contenu niveau actuel */}
      <Box sx={{ px: 3 }}>{renderCurrentLevel()}</Box>

      {/* Footer informatif */}
      <Paper elevation={1} sx={styles.footerPaper}>
        <Typography variant="caption" sx={{ textAlign: "center" }}>
          <strong>Validation séquentielle :</strong>
          Gold Standard → Performance Technique → Hypothèses Scientifiques
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            mt: 2,
          }}
        >
          <Box sx={styles.gridItem}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              Niveau 0: Accord inter-annotateur
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Kappa de Cohen, résolution désaccords
            </Typography>
          </Box>
          <Box sx={styles.gridItem}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              Niveau 1: Performance algorithmes
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accuracy, F1-Score, matrices confusion
            </Typography>
          </Box>
          <Box sx={styles.gridItem}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              Niveau 2: Tests hypothèses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              H1 (Efficacité), H2 (Cognitif), H3 (Pratique)
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
```

#### Gestion du workflow

L'interface utilise le hook `useWorkflowManagement()` pour orchestrer la progression :

```typescript
const useWorkflowManagement = () => {
  const [currentLevel, setCurrentLevel] = useState(0);

  const validationLevels: ValidationLevel[] = [
    {
      id: 0,
      name: "Level 0 - Gold Standard",
      description: "Validation de l'accord inter-annotateur",
      status: "validated", // "pending" | "in-progress" | "validated" | "failed"
      progress: 100,
      prerequisites: [],
    },
    {
      id: 1,
      name: "Level 1 - Performance Technique",
      description: "Tests algorithmiques par variable (X/Y/M1/M2/M3)",
      status: "in-progress",
      progress: 75,
      prerequisites: [0],
    },
    {
      id: 2,
      name: "Level 2 - Validation Scientifique",
      description: "Tests d'hypothèses H1, H2, H3",
      status: "pending",
      progress: 25,
      prerequisites: [0, 1],
    },
  ];

  const canAccessLevel = (level: number): boolean => {
    const levelData = validationLevels.find((l) => l.id === level);
    if (!levelData) return false;

    // Vérifier que tous les prérequis sont validés
    return levelData.prerequisites.every((prereq) => {
      const prereqLevel = validationLevels.find((l) => l.id === prereq);
      return prereqLevel?.status === "validated";
    });
  };

  return {
    currentLevel,
    setCurrentLevel,
    validationLevels,
    canAccessLevel,
  };
};
```

### 2. 🧭 NavigationTabs - Navigation intelligente

**Localisation** : `components/shared/NavigationTabs.tsx`

#### Navigation adaptative avec contrôles d'accès

```typescript
interface NavigationTabsProps {
  levels: ValidationLevel[];
  currentLevel: number;
  onLevelChange: (level: number) => void;
  canAccessLevel: (level: number) => boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  levels,
  currentLevel,
  onLevelChange,
  canAccessLevel,
}) => {
  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated":
        return <CheckCircle sx={{ fontSize: 20, color: "success.main" }} />;
      case "in-progress":
        return <AlertTriangle sx={{ fontSize: 20, color: "warning.main" }} />;
      case "failed":
        return <XCircle sx={{ fontSize: 20, color: "error.main" }} />;
      default:
        return <Info sx={{ fontSize: 20, color: "grey.400" }} />;
    }
  };

  return (
    <Box
      sx={{
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
        borderRadius: 2,
        border: 1,
        borderColor: theme.palette.grey[300],
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex" }}>
        {levels.map((level) => {
          const isAccessible = canAccessLevel(level.id);
          const isActive = currentLevel === level.id;

          return (
            <Button
              key={level.id}
              onClick={() => isAccessible && onLevelChange(level.id)}
              disabled={!isAccessible}
              sx={{
                flex: 1,
                p: 2,
                textAlign: "left",
                textTransform: "none",
                flexDirection: "column",
                alignItems: "flex-start",
                position: "relative",
                minHeight: 100,
                borderRadius: 0,
                borderBottom: isActive ? 2 : 0,
                borderBottomColor: isActive ? "primary.main" : "transparent",
                bgcolor: isActive
                  ? alpha(theme.palette.primary.main, 0.2)
                  : isAccessible
                  ? "transparent"
                  : theme.palette.grey[100],
                opacity: isAccessible ? 1 : 0.6,
                cursor: isAccessible ? "pointer" : "not-allowed",
                "&:hover": {
                  bgcolor: isActive
                    ? "primary.light"
                    : isAccessible
                    ? "grey.50"
                    : "grey.100",
                },
              }}
            >
              {!isAccessible && (
                <Lock
                  sx={{
                    fontSize: 16,
                    color: "grey.400",
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                />
              )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                {getStatusIcon(level.status)}
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color={isAccessible ? "text.primary" : "text.secondary"}
                >
                  {level.name}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color={isAccessible ? "text.secondary" : "text.disabled"}
                sx={{ textAlign: "left" }}
              >
                {level.description}
              </Typography>

              {level.progress > 0 && (
                <Box sx={{ width: "100%", mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={level.progress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "primary.main",
                      },
                    }}
                  />
                </Box>
              )}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
```

#### États des niveaux

| État            | Icône            | Description                 | Accès        |
| --------------- | ---------------- | --------------------------- | ------------ |
| **validated**   | ✅ CheckCircle   | Niveau complété avec succès | Libre        |
| **in-progress** | ⚠️ AlertTriangle | En cours de validation      | Conditionnel |
| **failed**      | ❌ XCircle       | Échec de validation         | Bloqué       |
| **pending**     | ℹ️ Info          | En attente des prérequis    | Bloqué       |

### 3. 🔧 ClassifierSelector - Sélecteur d'algorithmes

**Localisation** : `components/shared/ClassifierSelector.tsx`

#### Sélecteur intelligent avec métadonnées

```typescript
type Target = "X" | "Y" | "M1" | "M2" | "M3" | "any";

type Props = {
  selectedClassifier: string;
  onSelectClassifier: (key: string) => void;
  target?: Target;
  showDescription?: boolean;
  showConfiguration?: boolean;
};

export default function ClassifierSelector({
  selectedClassifier,
  onSelectClassifier,
  target = "any",
  showDescription,
}: Props) {
  const [list, setList] = useState<ServerAlgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement côté serveur
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/algolab/classifiers", {
          cache: "no-store",
        });
        const data = await response.json();

        // Tolérant aux différents formats de réponse
        const items = Array.isArray(data?.algorithms)
          ? data.algorithms
          : Array.isArray(data)
          ? data
          : Array.isArray(data?.list)
          ? data.list
          : Object.values(data ?? {});

        const mapped: ServerAlgo[] = items
          .map((it) => ({
            key: it.key ?? it.id ?? it.name,
            meta: it.meta ?? it.describe ?? it,
            isValid: it.isValid ?? true,
            isActive: it.isActive ?? true,
          }))
          .filter((a) => !!a.key);

        setList(mapped);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrage par target
  const entries = useMemo(() => {
    let arr = list;
    if (target !== "any") {
      arr = arr.filter((e) => {
        const t = String(e.meta?.target ?? "").toUpperCase();
        if (target === "X") return t === "X" || t === "CONSEILLER";
        if (target === "Y") return t === "Y" || t === "CLIENT";
        return t === target;
      });
    }
    return arr;
  }, [list, target]);

  // Auto-correction si valeur invalide
  useEffect(() => {
    if (!entries.length) return;
    if (!entries.some((e) => e.key === selectedClassifier)) {
      onSelectClassifier(entries[0].key);
    }
  }, [entries, selectedClassifier, onSelectClassifier]);

  const selectedMeta = useMemo(
    () => entries.find((e) => e.key === selectedClassifier)?.meta,
    [entries, selectedClassifier]
  );

  return (
    <Box>
      <FormControl fullWidth disabled={loading}>
        <InputLabel>Algorithme</InputLabel>
        <Select
          value={
            entries.some((e) => e.key === selectedClassifier)
              ? selectedClassifier
              : ""
          }
          label="Algorithme"
          onChange={(e) => onSelectClassifier(e.target.value)}
          displayEmpty
        >
          {entries.map(({ key, meta }) => (
            <MenuItem key={key} value={key}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>
                  {meta?.displayName ?? meta?.name ?? key}
                </Typography>
                {meta?.version && (
                  <Chip label={`v${meta.version}`} size="small" />
                )}
                {meta?.type && (
                  <Chip label={meta.type} size="small" variant="outlined" />
                )}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block" }}
        >
          {error}
        </Typography>
      )}

      {showDescription && (
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          {selectedMeta?.description ?? "—"}
        </Typography>
      )}
    </Box>
  );
}
```

#### Intégration API

Le sélecteur s'appuie sur une API REST :

```typescript
// GET /api/algolab/classifiers
{
  "algorithms": [
    {
      "key": "RegexConseillerClassifier",
      "meta": {
        "displayName": "Classification Conseiller (Regex)",
        "target": "X",
        "type": "rule-based",
        "version": "1.0",
        "description": "Algorithme basé sur des patterns regex pour identifier les stratégies conseiller"
      },
      "isValid": true,
      "isActive": true
    },
    {
      "key": "M1ActionVerbCounter",
      "meta": {
        "displayName": "Compteur Verbes d'Action M1",
        "target": "M1",
        "type": "rule-based",
        "version": "2.1",
        "description": "Calcule la densité de verbes d'action par 100 tokens"
      },
      "isValid": true,
      "isActive": true
    }
  ]
}
```

---

## 🔄 Workflow de validation séquentielle

### Principe de validation progressive

```
Level 0 (Gold Standard)
    ↓ [Prérequis: Kappa > 0.7]
Level 1 (Performance Technique)
    ↓ [Prérequis: Accuracy > 0.8 pour variables clés]
Level 2 (Validation Scientifique)
    ↓ [Prérequis: H1 validée]
Level 3 (Applications Pratiques) [Futur]
```

### Mécanismes de contrôle d'accès

#### 1. Validation Level 0 → Level 1

```typescript
const canAccessLevel1 = () => {
  const kappaResult = getInterAnnotatorAgreement();
  return kappaResult.kappa > 0.7 && kappaResult.status === "validated";
};
```

#### 2. Validation Level 1 → Level 2

```typescript
const canAccessLevel2 = () => {
  const level1Results = getLevel1ValidationResults();

  // Critères minimaux pour accès Level 2
  const xValidated = level1Results.X?.accuracy > 0.8;
  const yValidated = level1Results.Y?.accuracy > 0.8;
  const m1Validated = level1Results.M1?.mae < 0.15; // Seuil numérique

  return xValidated && yValidated && m1Validated;
};
```

#### 3. Validation Level 2 → Level 3 (futur)

```typescript
const canAccessLevel3 = () => {
  const h1Results = getH1ValidationResults();
  return (
    h1Results.overallValidation === "VALIDATED" ||
    h1Results.overallValidation === "PARTIALLY_VALIDATED"
  );
};
```

### Persistance et reproductibilité

#### Enregistrement des runs de validation

```typescript
interface ValidationRun {
  id: string;
  timestamp: Date;
  level: 0 | 1 | 2;

  // Configuration utilisée
  selectedOrigin: string | null;
  thresholds?: H1Thresholds;
  algorithmIds?: string[];

  // Signature du dataset
  datasetSignature: string;
  totalSamples: number;

  // Résultats clés
  status: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED";
  metrics: Record<string, any>;

  // Métadonnées
  version: string;
  userId?: string;
  notes?: string;
}

// Sauvegarde automatique à chaque validation
const saveValidationRun = async (runData: ValidationRun) => {
  await fetch("/api/algolab/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runData),
  });
};

// Récupération historique
const getValidationHistory = async (level?: number) => {
  const response = await fetch(`/api/algolab/runs?level=${level}`);
  return await response.json();
};
```

---

## 🎨 Thématisation et styles

### Adaptation dark mode

```typescript
const getAdaptiveStyles = () => ({
  mainContainer: {
    minHeight: "100vh",
    backgroundColor: theme.palette.background.default,
  },

  headerPaper: {
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.95)
        : theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },

  levelContentBox: {
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.default, 0.5)
        : theme.palette.background.default,
  },

  prerequisitePaper: {
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.primary.dark, 0.2)
        : alpha(theme.palette.primary.light, 0.8),
    border: `1px solid ${
      theme.palette.mode === "dark"
        ? alpha(theme.palette.primary.main, 0.3)
        : alpha(theme.palette.primary.main, 0.2)
    }`,
  },
});
```

### Codes couleurs semantiques

| État/Valeur              | Couleur Light  | Couleur Dark    | Usage                                   |
| ------------------------ | -------------- | --------------- | --------------------------------------- |
| **Validé**               | `success.main` | `success.light` | Critères respectés, tests significatifs |
| **Partiellement validé** | `warning.main` | `warning.light` | Critères partiels, tendances            |
| **Non validé**           | `error.main`   | `error.light`   | Échec critères, non significatif        |
| **En cours**             | `info.main`    | `info.light`    | Calculs en cours, chargement            |
| **Inaccessible**         | `grey.400`     | `grey.600`      | Prérequis non remplis                   |

---

## 🧪 Types et interfaces essentiels

### Types de validation Level2

```typescript
export interface H1StrategyData {
  strategy: string;
  totalSamples: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveRate: number; // Pourcentage
  negativeRate: number; // Pourcentage
  neutralRate: number; // Pourcentage
  effectiveness: number; // positiveRate - negativeRate
}

export interface H1Summary {
  // Métriques empiriques
  actionsAverage: number; // Moyenne % positif actions
  actionsNegativeAverage: number; // Moyenne % négatif actions
  explanationPositive: number; // % positif explications
  explanationNegative: number; // % négatif explications
  empiricalDifference: number; // Écart actions-explications

  // Tests statistiques
  chiSquare: ChiSquareResult;
  fisher: FisherPairwise[];
  anova?: AnovaOnProps;

  // Validation globale
  overallValidation: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED";
  validation?: H1ValidationStatus; // Validation détaillée
  thresholds?: H1Thresholds; // Configuration utilisée
  sampleSizeAdequate?: boolean;
  confidence?: "HIGH" | "MEDIUM" | "LOW";

  // Métadonnées académiques
  academicConclusion: string;
  practicalImplications: string[];
  limitationsNoted: string[];
}

export interface ChiSquareResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  cramersV: number;
  significant: boolean;
  interpretation: "faible" | "modéré" | "fort";
  contingency: number[][];
}
```

### Types partagés

```typescript
export interface ValidationLevel {
  id: number;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "validated" | "failed";
  progress: number; // 0-100
  prerequisites: number[]; // IDs des niveaux prérequis
}

export interface AlgorithmLabInterfaceProps {
  selectedOrigin?: string | null;
  availableDomains?: string[];
  availableIndicators?: string[];
}

export interface ServerAlgo {
  key: string;
  meta?: {
    name?: string;
    displayName?: string;
    version?: string;
    type?: string;
    target?: string;
    description?: string;
  };
  isValid?: boolean;
  isActive?: boolean;
}
```

---

## 🚀 Intégration dans /analysis

### Point d'entrée principal

```typescript
// Dans app/(protected)/analysis/page.tsx
import { AlgorithmLabInterface } from "@/components/AlgorithmLab/components/shared/AlgorithmLabInterface";

export default function AnalysisPage() {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  return (
    <Box>
      {/* Autres composants d'analyse */}

      {/* Onglet Algorithm Lab */}
      <TabPanel value={tabValue} index={3}>
        <AlgorithmLabInterface
          selectedOrigin={selectedOrigin}
          availableDomains={["amendes", "courrier", "assurance"]}
          availableIndicators={["efficacité", "satisfaction", "durée"]}
        />
      </TabPanel>
    </Box>
  );
}
```

### Flux de données intégré

```
TaggingDataContext → AlgorithmLabInterface → Level2Interface → filterValidTurnTagged() → computeH1Analysis() → StatisticalSummary
```

### API endpoints requis

```typescript
// Algorithmes disponibles
GET /api/algolab/classifiers
→ { algorithms: ServerAlgo[] }

// Historique des validations
GET /api/algolab/runs?level=2
POST /api/algolab/runs
→ { runs: ValidationRun[] }

// Export des résultats
GET /api/algolab/export?format=CSV&runId=xxx
→ File download
```

---

## 📝 Bonnes pratiques et optimisations

### 1. Performance

- **Memoization** systématique avec `useMemo` pour calculs coûteux
- **Pagination** intelligente pour gros volumes de données
- **Lazy loading** des composants secondaires
- **Web Workers** pour calculs statistiques > 1000 échantillons

### 2. Robustesse

- **Guard clauses** pour données manquantes ou corrompues
- **Fallbacks** gracieux en cas d'erreur API
- **Validation** stricte des types TypeScript
- **Tests unitaires** pour fonctions critiques

### 3. Extensibilité

- **Configuration externalisée** dans `config/hypotheses.ts`
- **Types génériques** pour nouveaux tests statistiques
- **Système de plugins** pour nouvelles variables (M4, M5...)
- **API versionnée** pour compatibilité ascendante

### 4. Maintenabilité

- **Séparation claire** logique métier / présentation
- **Documentation JSDoc** pour fonctions complexes
- **Convention de nommage** cohérente
- **Architecture modulaire** avec responsabilités définies

Cette architecture **Level2 + Shared** fournit un **framework complet et extensible** pour la validation scientifique des hypothèses de recherche, tout en s'intégrant naturellement dans l'écosystème existant du centre d'analyse conversationnelle.
