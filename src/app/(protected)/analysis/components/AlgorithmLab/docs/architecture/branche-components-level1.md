# Documentation Components Level1 - AlgorithmLab

## Vue d'ensemble

Le module Level1 implémente le **système de validation technique** pour les algorithmes de tagging conversationnel. Il correspond au Niveau 1 de la thèse : **validation des performances algorithmiques** avant l'analyse qualitative et métacognitive.

### Architecture générale

```
components/Level1/
├── Level1Interface.tsx          # Interface principale avec onglets
├── TechnicalBenchmark.tsx       # Comparaison multi-algorithmes
├── algorithms/                  # Interfaces de test par variable
│   ├── BaseAlgorithmTesting.tsx # Composant générique de test
│   ├── XClassifiers/           # Tests X (Stratégies Conseiller)
│   ├── YClassifiers/           # Tests Y (Réactions Client)
│   ├── M1Calculators/          # Tests M1 (Densité verbes d'action)
│   ├── M2Calculators/          # Tests M2 (Alignement X→Y)
│   └── M3Calculators/          # Tests M3 (Charge cognitive)
├── shared/                     # Composants partagés
│   └── results/               # Système d'affichage des résultats
│       ├── base/              # Composants génériques
│       ├── m/                 # Vues spécialisées métriques
│       └── x/                 # Vues spécialisées X/Y
└── individual/                # Composants d'analyse individuelle
    ├── ConfusionMatrix.tsx    # Matrice de confusion
    ├── EnhancedErrorAnalysis.tsx # Analyse d'erreurs
    └── ParameterOptimization.tsx # Optimisation paramètres
```

## 1. 🎛️ Level1Interface - Interface principale

**Localisation** : `components/Level1/Level1Interface.tsx`

### Fonctionnalités

- **Sélection de variable** : X, Y, M1, M2, M3 via tabs horizontales
- **Navigation secondaire** : Validation, Matrice, Erreurs, Optimisation, Benchmark
- **Rendu adaptatif** : Interface spécialisée selon la variable sélectionnée

```typescript
type Variable = "X" | "Y" | "M1" | "M2" | "M3";

export const Level1Interface: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
  const [variable, setVariable] = useState<Variable>("X");

  const showXYOnly = variable === "X" || variable === "Y";

  return (
    <Box sx={{ width: "100%" }}>
      {/* Sélecteur de variable */}
      <Tabs value={variable} onChange={(_, v) => setVariable(v)}>
        <Tab label="X (Stratégies Conseiller)" value="X" />
        <Tab label="Y (Réactions Client)" value="Y" />
        <Tab label="M1 (Verbes d'action)" value="M1" />
        <Tab label="M2 (Alignement X→Y)" value="M2" />
        <Tab label="M3 (Charge Client)" value="M3" />
      </Tabs>

      {/* Rendu conditionnel par onglet */}
      <TabPanel value={mainTab} index={0}>
        {variable === "X" && <XValidationInterface />}
        {variable === "Y" && <YValidationInterface />}
        {variable === "M1" && <M1ValidationInterface />}
        {variable === "M2" && <M2ValidationInterface />}
        {variable === "M3" && <M3ValidationInterface />}
      </TabPanel>

      {/* Matrice confusion (X/Y uniquement) */}
      <TabPanel value={mainTab} index={1}>
        {showXYOnly ? (
          <ConfusionMatrix />
        ) : (
          <Typography color="text.secondary">
            La matrice de confusion n'est pas applicable aux calculateurs
            M1/M2/M3.
          </Typography>
        )}
      </TabPanel>
    </Box>
  );
};
```

### Organisation des onglets

| Onglet                   | Variables applicables | Description                      |
| ------------------------ | --------------------- | -------------------------------- |
| **Validation Technique** | X, Y, M1, M2, M3      | Tests individuels par algorithme |
| **Matrice Confusion**    | X, Y uniquement       | Analyse de classification        |
| **Analyse Erreurs**      | X, Y uniquement       | Patterns d'erreurs détaillés     |
| **Optimisation**         | X, Y uniquement       | Réglage hyperparamètres          |
| **Benchmark Global**     | Tous                  | Comparaison multi-algorithmes    |

## 2. 🧪 BaseAlgorithmTesting - Composant générique de test

**Localisation** : `components/Level1/algorithms/BaseAlgorithmTesting.tsx`

### Architecture unifiée

Ce composant fournit l'infrastructure commune pour tester tout type d'algorithme (X/Y/M1/M2/M3) :

```typescript
interface BaseAlgorithmTestingProps {
  variableLabel: string; // "X — Stratégies Conseiller"
  defaultClassifier?: string; // ID algorithme par défaut
  target?: TargetAll; // "X" | "Y" | "M1" | "M2" | "M3"
}

export const BaseAlgorithmTesting: React.FC<BaseAlgorithmTestingProps> = ({
  variableLabel,
  defaultClassifier,
  target = "X",
}) => {
  // États unifiés pour tous types d'algorithmes
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [testResults, setTestResults] = useState<TVValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleSize, setSampleSize] = useState<number>(100);

  // Hook projet pour la logique métier
  const level1Testing = useLevel1Testing();

  // Filtrage des algorithmes par target
  const entriesForTarget = useMemo(() => {
    const all = algorithmRegistry.list?.() ?? [];
    return all.filter((e) => e.meta?.target === target);
  }, [target]);

  // Interface de test unifiée
  return (
    <Box sx={{ p: 3 }}>
      <AlgorithmSelector
        algorithms={entriesForTarget}
        selectedAlgorithm={selectedModelId}
        onAlgorithmChange={setSelectedModelId}
      />

      <RunPanel
        isRunning={isRunning}
        goldStandardCount={goldCount}
        sampleSize={sampleSize}
        onRun={runValidation}
      />

      <ResultsPanel
        results={testResults}
        targetKind={target as TargetKind}
        classifierLabel={selectedDisplayName}
      />
    </Box>
  );
};
```

### Spécialisations par variable

Chaque variable hérite de BaseAlgorithmTesting avec ses paramètres spécifiques :

```typescript
// XValidationInterface.tsx
export default function XValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="X — Stratégies Conseiller"
      defaultClassifier="RegexConseillerClassifier"
      target="X"
    />
  );
}

// M1ValidationInterface.tsx
export default function M1ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M1 — Densité de verbes d'action"
      defaultClassifier="RegexM1Calculator"
      target="M1"
    />
  );
}
```

## 3. 📊 Système de résultats ResultsPanel

**Localisation** : `components/Level1/shared/results/base/ResultsSample/`

### Architecture modulaire

```
ResultsSample/
├── ResultsPanel.tsx           # Composant principal
├── components/
│   ├── ResultsTableHeader.tsx # En-tête avec métriques
│   ├── ResultsFilters.tsx     # Filtres de recherche
│   ├── ResultsTableBody.tsx   # Tableau principal
│   ├── AnnotationList.tsx     # Gestion annotations
│   └── FineTuningDialog/      # Export pour fine-tuning
├── hooks/
│   ├── useResultsFiltering.ts # Logique de filtrage
│   └── useResultsPagination.ts # Gestion pagination
└── types.ts                   # Types partagés
```

### Fonctionnalités clés

#### A. Affichage adaptatif par type de variable

```typescript
interface ResultsPanelProps {
  results: TVValidationResult[];
  targetKind: TargetKind; // "X" | "Y" | "M1" | "M2" | "M3"
  classifierLabel?: string;
  initialPageSize?: number;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  targetKind,
  classifierLabel,
}) => {
  // Colonnes dynamiques selon le type
  const dynamicExtraColumns = useMemo(
    () => buildExtraColumnsForTarget(targetKind),
    [targetKind]
  );

  return (
    <Card>
      <CardContent>
        {/* Métriques adaptatives */}
        <MetricsPanel
          results={filteredResults}
          targetKind={targetKind}
          classifierLabel={classifierLabel}
        />

        {/* Tableau avec colonnes spécialisées */}
        <ResultsTableBody
          pageItems={displayData.pageItems}
          extraColumns={dynamicExtraColumns}
        />
      </CardContent>
    </Card>
  );
};
```

#### B. Métriques différenciées

Le système affiche automatiquement les bonnes métriques selon le type :

```typescript
/**
 * Règle de dispatch :
 * - X / Y / M2 → métriques de classification (accuracy, P/R/F1, κ)
 * - M1 / M3    → métriques numériques (MAE, RMSE, R², r, biais)
 */
export default function MetricsPanel({ targetKind, results }) {
  if (targetKind === "M1" || targetKind === "M3") {
    return <MetricsPanelNumeric results={results} />;
  }
  return <MetricsPanelClassification results={results} />;
}
```

#### C. Colonnes extraColumns dynamiques

Le système injecte automatiquement des colonnes spécialisées :

```typescript
// Pour X (Stratégies Conseiller)
const buildXColumns = (): ExtraColumn[] => [
  {
    id: "x-family",
    header: <strong>Famille X</strong>,
    render: (r) => <Chip label={r.metadata?.x_details?.family ?? "—"} />,
  },
  {
    id: "x-evidences",
    header: <strong>Évidences</strong>,
    render: (r) => {
      const evs = r.metadata?.x_evidences ?? [];
      return (
        <Stack direction="row" spacing={0.5}>
          {evs.map((e, i) => (
            <Chip key={i} label={e} variant="outlined" />
          ))}
        </Stack>
      );
    },
  },
];

// Pour M1 (Densité verbes)
const buildM1Columns = (): ExtraColumn[] => [
  {
    id: "m1-density",
    header: <strong>M1 (densité)</strong>,
    render: (r) => <Chip label={r.metadata?.m1?.value?.toFixed(3) ?? "—"} />,
  },
  {
    id: "m1-verbs-found",
    header: <strong>Verbes trouvés</strong>,
    render: (r) => {
      const verbs = r.metadata?.m1?.verbsFound ?? [];
      return verbs.map((v, i) => <Chip key={i} label={v} variant="outlined" />);
    },
  },
];
```

## 4. 🔧 TechnicalBenchmark - Comparaison multi-algorithmes

**Localisation** : `components/Level1/TechnicalBenchmark.tsx`

### Fonctionnalités

```typescript
interface BenchmarkData {
  algorithmName: string;
  type: "conseiller" | "client";
  metrics: ValidationMetrics;
  sampleSize: number;
  executionTime: number;
}

export const TechnicalBenchmark: React.FC<TechnicalBenchmarkProps> = ({
  benchmarkResults,
}) => {
  const getBestPerformer = (metric: "accuracy" | "kappa") => {
    return benchmarkResults.reduce((best, current) =>
      current.metrics[metric] > best.metrics[metric] ? current : best
    );
  };

  return (
    <Box>
      {/* Cartes de performance */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {sortedResults.map((data, index) => (
          <Card key={data.algorithmName}>
            {index === 0 && <Chip label="MEILLEUR" color="success" />}
            <CardContent>
              <Typography variant="h4" color="primary">
                {(data.metrics.accuracy * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2">Accuracy</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tableau comparatif */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Algorithme</TableCell>
              <TableCell>Accuracy</TableCell>
              <TableCell>Kappa</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {benchmarkResults.map((data) => (
              <TableRow key={data.algorithmName}>
                <TableCell>{data.algorithmName}</TableCell>
                <TableCell>
                  <Typography
                    color={
                      data.metrics.accuracy > 0.8
                        ? "success.main"
                        : data.metrics.accuracy > 0.6
                        ? "warning.main"
                        : "error.main"
                    }
                  >
                    {(data.metrics.accuracy * 100).toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell>{data.metrics.kappa.toFixed(3)}</TableCell>
                <TableCell>
                  <Chip
                    label={data.metrics.kappa > 0.7 ? "VALIDÉ" : "ÉCHEC"}
                    color={data.metrics.kappa > 0.7 ? "success" : "error"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
```

## 5. 🎯 Validation M3 - Cas spécialisé

**Localisation** : `components/Level1/algorithms/M3Calculators/M3ValidationInterface.tsx`

M3 (charge cognitive) nécessite une interface entièrement personnalisée :

```typescript
export default function M3ValidationInterface() {
  const { allTurnTagged } = useTaggingData();
  const { isRunning, run, results, avgScore } = useM3AlgorithmTesting();

  // Échantillon spécialisé : tours CLIENT uniquement
  const sample = useMemo(() => {
    return (allTurnTagged || [])
      .filter((t) => {
        const speaker = String(t?.speaker || "").toLowerCase();
        const isClient = speaker.includes("client") || speaker === "c";
        return isClient && t?.verbatim?.trim().length > 0;
      })
      .slice(0, 600)
      .map((t) => ({
        id: t.id ?? crypto.randomUUID(),
        clientTurn: t.verbatim,
      }));
  }, [allTurnTagged]);

  // Filtres spécialisés M3
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "pauses" | "hesitations">(
    "score"
  );

  return (
    <Stack gap={2}>
      {/* Interface de lancement */}
      <Card>
        <CardContent>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={() => run(sample)}
            disabled={isRunning || sample.length === 0}
          >
            Lancer le test M3 ({sample.length})
          </Button>
        </CardContent>
      </Card>

      {/* Filtres M3 spécialisés */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <Slider
            value={minScore}
            onChange={(_, v) => setMinScore(v as number)}
            step={0.05}
            min={0}
            max={1}
            valueLabelDisplay="auto"
          />

          <FormControl>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="score">Score (desc)</MenuItem>
              <MenuItem value="pauses">Pauses (desc)</MenuItem>
              <MenuItem value="hesitations">Hésitations (desc)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tableau M3 avec colonnes spécialisées */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tour Client</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Pauses</TableCell>
              <TableCell>Hésitations</TableCell>
              <TableCell>Débit (m/s)</TableCell>
              <TableCell>Marqueurs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResults.map((r, idx) => {
              const d = r.details || {};
              return (
                <TableRow key={idx}>
                  <TableCell>{r.metadata?.verbatim}</TableCell>
                  <TableCell>
                    <Chip
                      label={(r.score ?? 0).toFixed(3)}
                      color={
                        r.score >= 0.7
                          ? "error"
                          : r.score >= 0.4
                          ? "warning"
                          : "success"
                      }
                    />
                  </TableCell>
                  <TableCell>{d.pauseCount ?? 0}</TableCell>
                  <TableCell>{d.hesitationCount ?? 0}</TableCell>
                  <TableCell>{d.speechRate?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {(r.markers || []).map((m, i) => (
                        <Chip key={i} size="small" label={m} />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
```

## 6. ⚙️ Hooks et logique métier

### useLevel1Testing - Hook principal

```typescript
interface Level1TestingHook {
  goldStandardData: any[];
  validateAlgorithm: (
    modelId: string,
    sampleSize: number
  ) => Promise<TVValidationResult[]>;
  calculateMetrics: (results: TVValidationResult[]) => ValidationMetrics;
  analyzeErrors: (results: TVValidationResult[]) => ErrorAnalysis;
  getRelevantCountFor: (modelId: string) => number;
}

export const useLevel1Testing = (): Level1TestingHook => {
  // Logique centrale pour tous les tests Level1
  const validateAlgorithm = async (modelId: string, sampleSize: number) => {
    // 1. Récupération gold standard
    // 2. Échantillonnage
    // 3. Exécution algorithme
    // 4. Comparaison résultats
    // 5. Calcul métriques
  };

  return {
    goldStandardData,
    validateAlgorithm,
    calculateMetrics,
    analyzeErrors,
    getRelevantCountFor,
  };
};
```

## Types essentiels

### TVValidationResult - Format unifié

```typescript
export interface TVValidationResult {
  verbatim: string;
  goldStandard: string; // Stringifié pour tous types
  predicted: string; // Stringifié pour tous types
  confidence: number; // 0..1
  correct: boolean;
  processingTime?: number; // ms
  metadata?: TVMetadata; // Contexte enrichi
}

interface TVMetadata {
  // Identifiants
  turnId?: number | string;

  // Contexte conversationnel
  prev2_turn_verbatim?: string;
  prev1_turn_verbatim?: string;
  next_turn_verbatim?: string;

  // Variables spécialisées
  x_details?: { family?: string };
  y_details?: { family?: string };
  x_evidences?: string[];
  y_evidences?: string[];

  m1?: {
    value?: number;
    actionVerbCount?: number;
    totalTokens?: number;
    verbsFound?: string[];
  };

  m2?: {
    value?: string | number;
    scale?: string;
  };

  m3?: {
    value?: number;
    unit?: "ms" | "s";
  };
}
```

## Flux de validation technique

```
1. Sélection variable (X/Y/M1/M2/M3) dans Level1Interface
2. Chargement interface spécialisée (BaseAlgorithmTesting)
3. Sélection algorithme dans AlgorithmSelector
4. Configuration échantillon via RunPanel
5. Exécution test via useLevel1Testing.validateAlgorithm()
6. Affichage résultats dans ResultsPanel avec:
   - Métriques adaptatives (classification vs numérique)
   - Colonnes spécialisées par variable
   - Filtres et pagination
7. Export fine-tuning via FineTuningDialog
8. Comparaison multi-algorithmes via TechnicalBenchmark
```

## Intégration avec AlgorithmRegistry

Tous les algorithmes sont enregistrés avec métadonnées :

```typescript
interface AlgorithmMetadata {
  displayName?: string;
  description?: string;
  target?: "X" | "Y" | "M1" | "M2" | "M3";
  type?: "rule-based" | "ml";
  version?: string;
  supportsBatch?: boolean;
}

// Exemple d'enregistrement
algorithmRegistry.register("RegexConseillerClassifier", {
  displayName: "Classification Conseiller (Regex)",
  target: "X",
  type: "rule-based",
  version: "1.0",
  supportsBatch: true,
});
```

## Bonnes pratiques et optimisations

### 1. Gestion des états

- **Hook centralisé** : useLevel1Testing pour la logique métier
- **États locaux** : pour l'UI (pagination, filtres)
- **Memoization** : pour les calculs coûteux

### 2. Performance

- **Pagination intelligente** : 25 résultats par défaut
- **Filtrage côté client** : pour la réactivité
- **Lazy loading** : des composants d'analyse

### 3. Extensibilité

- **BaseAlgorithmTesting** : pour ajouter de nouvelles variables
- **ExtraColumns** : système modulaire de colonnes
- **MetricsPanel** : dispatch automatique par type

Cette architecture Level1 fournit un **framework robuste et extensible** pour la validation technique de tout algorithme de tagging conversationnel, avec une **interface unifiée** mais des **visualisations spécialisées** selon le type de variable analysée.
