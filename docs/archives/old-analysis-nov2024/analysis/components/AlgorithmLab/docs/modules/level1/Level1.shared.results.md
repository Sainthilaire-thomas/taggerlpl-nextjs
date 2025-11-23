# ## title: "Level1/shared/results - Système de Validation et Analyse"

category: "Level1"
tags: ["validation", "results-analysis", "metrics", "fine-tuning", "ui-components", "data-visualization"]
dependencies: ["Material-UI", "React", "TypeScript", "TaggingDataContext"]
related_files: ["level1/m1-algorithms.md", "../shared/base-classes.md", "../../.ai-context/architectural-decisions.md"]
difficulty: "avancé"
last_updated: "2025-01-15"
module_type: "component"
status: "active"
responsible: "équipe-algorithmlab"
performance_metrics: ["rendering_speed", "data_processing", "user_interaction"]
input_format: "TVValidationResult[]"
output_format: "interactive_ui_components"
ui_framework: "Material-UI"
complexity: "O(n log n)"
test_coverage: "78%"

# Level1/shared/results - Système de Validation et Analyse

## Plateforme Complète de Visualisation et Analyse des Résultats Algorithmiques

## 🎯 Résumé Exécutif (pour IA)

**Fonction principale** : Système complet de visualisation, analyse et validation des résultats d'algorithmes Level 1

**Input** : Arrays de `TVValidationResult` avec métadonnées enrichies

**Output** : Interfaces interactives avec métriques, tableaux, annotations et fine-tuning

**Cas d'usage** : Validation performance algorithmes, analyse erreurs, amélioration continue

**Complexité** : O(n log n) pour tri et filtrage, O(n) pour affichage

### Architecture modulaire

> **Système hautement modulaire** avec composants base réutilisables, spécialisations par type de données (classification vs numérique), et pipeline complet de fine-tuning IA.

---

## 📍 Localisation et Architecture

```
components/Level1/shared/results/
├── base/                           # Composants base réutilisables
│   ├── MetricsPanel.tsx           # Orchestrateur métriques (classification/numérique)
│   ├── MetricsPanel.classification.tsx  # Métriques spécialisées classification
│   ├── MetricsPanel.numeric.tsx   # Métriques spécialisées numérique
│   ├── ResultsTableBase.tsx       # Squelette table générique
│   ├── RunPanel.tsx              # Interface de lancement tests
│   ├── extraColumns.tsx          # Colonnes dynamiques par type
│   └── ResultsSample/            # Système complet échantillons
│       ├── ResultsSample.tsx     # Composant principal legacy
│       ├── ResultsPanel.tsx      # Composant principal moderne
│       ├── types.ts              # Types TypeScript centralisés
│       ├── components/           # Sous-composants modulaires
│       │   ├── ResultsTableHeader.tsx    # En-tête avec métriques
│       │   ├── ResultsTableBody.tsx      # Corps tableau avec annotations
│       │   ├── ResultsFilters.tsx        # Filtres multicritères
│       │   ├── AnnotationList.tsx        # Système annotations expertes
│       │   └── FineTuningDialog/         # Pipeline fine-tuning IA
│       │       ├── FineTuningDialog.tsx
│       │       ├── FineTuningExtractor.tsx
│       │       ├── FineTuningFormatter.tsx
│       │       ├── FineTuningMetrics.tsx
│       │       └── hooks/useFineTuningExtractor.ts
│       ├── hooks/                # Hooks métier spécialisés
│       │   ├── useResultsFiltering.ts    # Logique filtrage avancé
│       │   └── useResultsPagination.ts   # Pagination optimisée
│       └── utils/                # Utilitaires d'analyse
│           └── errorAnalysis.tsx # Analyse patterns d'erreurs
├── m/                             # Spécialisations métriques numériques
│   └── ResultsTableM1.tsx        # Table spécialisée M1 (verbes d'action)
└── x/                             # Spécialisations classification
    └── ResultsTableX.tsx         # Table spécialisée X (stratégies conseiller)
```

### Intégration dans AlgorithmLab

- **Niveau** : Level 1 (Validation et comparaison algorithmes)
- **Position** : Module shared critique utilisé par tous les algorithmes
- **Patterns** : Strategy + Observer + Factory pour composants adaptatifs
- **Dépendances** : Material-UI, TaggingDataContext, types ValidationTypes

---

## 🏗️ Architecture et Composants

### Hiérarchie des composants principaux

```typescript
ResultsPanel (Composant orchestrateur principal)
├── MetricsPanel (Métriques adaptatives)
│   ├── MetricsPanelClassification (X, Y, M2)
│   └── MetricsPanelNumeric (M1, M3)
├── ResultsTableHeader (En-tête + contrôles)
├── ResultsFilters (Filtres multicritères)
├── ResultsTableBody (Tableau principal + annotations)
│   └── AnnotationList (Système annotations par tour)
└── FineTuningDialog (Pipeline amélioration IA)
    ├── FineTuningExtractor (Extraction données)
    ├── FineTuningFormatter (Format données)
    └── FineTuningMetrics (Calculs métriques)
```

### Composants base réutilisables

#### **ResultsTableBase`<T>`** (Pattern générique)

- **Objectif** : Squelette table réutilisable pour tous types de données
- **Generic** : Accepte n'importe quel type T avec fonction render custom
- **Features** : Pagination, slots header/footer, responsive design

#### **MetricsPanel** (Factory pattern)

- **Logique** : Route automatiquement vers classification ou numérique selon `TargetKind`
- **Classification** : Accuracy, Précision, Rappel, F1-Score, Kappa Cohen
- **Numérique** : MAE, RMSE, R², corrélation Pearson, biais

#### **RunPanel**

- **Interface** : Configuration et lancement tests performance
- **Features** : Slider échantillonnage, validation config, badges info

---

## 🔧 API et Interfaces Principales

### Interface ResultsPanel (Composant principal)

```typescript
interface ResultsPanelProps {
  results: TVValidationResult[]; // Données à analyser
  initialPageSize?: number; // Pagination (défaut: 25)
  extraColumns?: ExtraColumn[]; // Colonnes additionnelles
  targetKind: TargetKind; // "X"|"Y"|"M1"|"M2"|"M3"
  classifierLabel?: string; // Label pour métriques
}

interface TVValidationResult {
  verbatim: string; // Texte analysé
  goldStandard: string; // Vérité terrain
  predicted: string; // Prédiction algorithme
  confidence: number; // Score confiance [0-1]
  correct: boolean; // Résultat correct?
  processingTime?: number; // Temps traitement (ms)
  metadata?: TVMetadata; // Métadonnées enrichies
}
```

### Interface TVMetadata (Métadonnées enrichies)

```typescript
interface TVMetadata {
  // Identifiants et contexte
  turnId?: number | string;
  prev2_turn_verbatim?: string; // Contexte conversationnel
  prev1_turn_verbatim?: string;
  next_turn_verbatim?: string;

  // Information algorithme
  classifier?: string; // Nom de l'algorithme
  type?: string; // "rule-based"|"ml"|"llm"
  model?: string; // Modèle utilisé
  temperature?: number; // Config LLM

  // Métriques spécialisées par type
  m1?: {
    // Métriques M1 (verbes action)
    value: number; // Densité calculée
    actionVerbCount: number;
    totalTokens: number;
    verbsFound: string[];
  };

  x_details?: { family?: string }; // Classification X
  x_evidences?: string[]; // Évidences détection

  y_details?: { family?: string }; // Classification Y
  y_evidences?: string[];
}
```

### Méthodes principales ResultsPanel

#### `ResultsPanel` (Composant principal)

**Objectif** : Interface complète d'analyse des résultats avec métriques, filtres et annotations

**Props critiques** :

- `results` : Array de résultats de validation
- `targetKind` : Détermine le type de métriques et colonnes
- `extraColumns` : Colonnes personnalisées additionnelles

**Fonctionnalités** :

- Métriques automatiques (classification ou numérique)
- Filtrage multicritères avancé
- Pagination optimisée ou affichage complet
- Système d'annotations par tour
- Export fine-tuning pour amélioration IA

**Exemple d'utilisation** :

```typescript
const results: TVValidationResult[] = [
  {
    verbatim: "je vais vérifier votre dossier",
    goldStandard: "ENGAGEMENT",
    predicted: "ENGAGEMENT",
    confidence: 0.92,
    correct: true,
    processingTime: 1250,
    metadata: {
      turnId: 142,
      classifier: "M1ActionVerbCounter",
      m1: {
        value: 22.22,
        actionVerbCount: 2,
        totalTokens: 9,
        verbsFound: ["verifier"],
      },
    },
  },
];

<ResultsPanel
  results={results}
  targetKind="M1"
  classifierLabel="M1 Action Verb Counter v1.0"
  initialPageSize={50}
/>;
```

---

## 📊 Système de Métriques Adaptatif

### Métriques Classification (X, Y, M2)

#### Calculs automatiques

- **Accuracy globale** : `(correct / total) * 100`
- **Métriques par classe** : Précision, Rappel, F1-Score calculés via matrice confusion
- **Kappa de Cohen** : Accord corrigé du hasard `(po - pe) / (1 - pe)`
- **Matrice de confusion** : Distribution prédictions vs vérité terrain

#### Interface utilisateur

```typescript
// Affichage métriques principales
<StatTile title="Accuracy" value="85.2%" />
<StatTile title="Classifications Correctes" value="341/400" />
<StatTile title="Kappa (Cohen)" value="0.758" color="success.main" />

// Table détaillée par tag
Tag | Précision | Rappel | F1-Score
ENGAGEMENT | 92.1% | 88.4% | 90.2%
REFLET_VOUS | 78.9% | 85.1% | 81.9%
```

### Métriques Numériques (M1, M3)

#### Calculs statistiques

- **MAE** (Mean Absolute Error) : `mean(|predicted - gold|)`
- **RMSE** (Root Mean Squared Error) : `sqrt(mean((predicted - gold)²))`
- **R²** (Coefficient détermination) : Qualité prédiction linéaire
- **Corrélation Pearson** : Force relation linéaire
- **Biais moyen** : Tendance systématique `mean(predicted - gold)`

#### Exemple pour M1 (densité verbes d'action)

```typescript
// Résultats typiques M1
{
  n: 250,                    // Paires analysées
  mae: 0.023,               // Erreur absolue moyenne
  rmse: 0.031,              // Erreur quadratique
  r2: 0.847,                // R² - très bonne prédiction
  r: 0.921,                 // Corrélation forte
  bias: -0.005              // Légère sous-estimation
}
```

---

## 🎨 Colonnes Dynamiques et Adaptatives

### Système extraColumns.tsx

Le système de colonnes s'adapte automatiquement selon le `TargetKind` :

#### Pour M1 (Algorithmes verbes d'action)

```typescript
const m1Columns = [
  {
    id: "m1-density",
    header: "M1 (densité)",
    render: (r) => <Chip label={r.metadata?.m1?.value.toFixed(3)} />,
  },
  {
    id: "m1-verbs",
    header: "# Verbes",
    render: (r) => r.metadata?.m1?.actionVerbCount,
  },
  {
    id: "m1-verbs-found",
    header: "Verbes trouvés",
    render: (r) => (
      <Stack direction="row" spacing={0.5}>
        {r.metadata?.m1?.verbsFound.map((verb) => (
          <Chip key={verb} size="small" label={verb} />
        ))}
      </Stack>
    ),
  },
];
```

#### Pour X (Classifications conseiller)

```typescript
const xColumns = [
  {
    id: "x-family",
    header: "Famille X",
    render: (r) => <Chip label={r.metadata?.x_details?.family} />,
  },
  {
    id: "x-evidences",
    header: "Évidences",
    render: (r) =>
      r.metadata?.x_evidences?.map((ev) => (
        <Chip key={ev} size="small" variant="outlined" label={ev} />
      )),
  },
];
```

### Factory pattern automatique

```typescript
export function buildExtraColumnsForTarget(kind: TargetKind): ExtraColumn[] {
  switch (kind) {
    case "X":
      return buildXColumns();
    case "Y":
      return buildYColumns();
    case "M1":
      return m1Columns;
    case "M2":
      return m2Columns;
    case "M3":
      return m3Columns;
    default:
      return [];
  }
}
```

---

## 📝 Système d'Annotations Expertes

### AnnotationList - Annotations par tour

#### Fonctionnalités avancées

- **Drawer contextuel** : Panel latéral 520px avec contexte complet
- **Annotations persistantes** : Sauvegarde base de données via API
- **Contexte enrichi** : Tours précédents/suivants + métadonnées algorithme
- **Collaboration** : Multi-utilisateurs avec timestamps et auteurs

#### Interface annotation

```typescript
interface TurnAnnotation {
  id: string;
  author: string;
  created_at: string;
  rationale: string; // Commentaire principal
  proposed_label?: string; // Tag suggéré
  gold_label?: string; // Tag de référence
  verbatim?: string; // Texte annoté
  context?: {
    // Contexte conversationnel
    prev2?: string;
    prev1?: string;
    next1?: string;
  };
  algo?: {
    // Métadonnées algorithme
    classifier: string;
    type?: "rule-based" | "ml" | "llm";
    model?: string;
    temperature?: number;
  };
}
```

#### Workflow annotations

```typescript
// 1. Ouverture drawer annotation
<AnnotationList
  turnId={turnId}
  verbatim={result.verbatim}
  context={contextData}
  predicted={result.predicted}
  gold={result.goldStandard}
  algo={algorithmMetadata}
/>;

// 2. Sauvegarde annotation
const annotation = {
  comment: userInput,
  proposedLabel: predicted,
  goldLabel: gold,
  context: contextData,
  algo: algorithmMetadata,
};

await fetch(`/api/turntagged/${turnId}/annotations`, {
  method: "POST",
  body: JSON.stringify(annotation),
});
```

---

## 🤖 Pipeline Fine-Tuning IA

### FineTuningDialog - Amélioration Continue

#### Objectif et workflow

1. **Extraction automatique** : Sélection résultats non-conformes (prédiction ≠ gold)
2. **Enrichissement contexte** : Ajout annotations expertes + métadonnées algorithme
3. **Format JSONL** : Conversion format standard fine-tuning
4. **Analyse erreurs** : Patterns fréquents, matrice confusion, recommandations
5. **Export ready-to-use** : Données prêtes pour Claude/GPT fine-tuning

#### FineTuningExtractor - Logique d'extraction

```typescript
class FineTuningExtractor {
  async extract(): Promise<string> {
    // 1. Sélectionner résultats non conformes
    const misclassified = this.results.filter((r) => !r.correct);

    // 2. Convertir en format JSONL avec contexte expert
    const trainingData = misclassified.map((result) => ({
      messages: [
        {
          role: "system",
          content: this.buildSystemPrompt(result.annotations),
        },
        {
          role: "user",
          content: this.buildUserPrompt(result.context, result.verbatim),
        },
        {
          role: "assistant",
          content: this.buildAssistantResponse(
            result.goldStandard,
            result.annotations
          ),
        },
      ],
      metadata: {
        turnId: result.metadata.turnId,
        predicted: result.predicted,
        goldStandard: result.goldStandard,
        confidence: result.confidence,
        annotations: result.annotations,
        algo: result.metadata.algo,
      },
    }));

    // 3. Générer rapport complet avec métriques et recommandations
    return formatFineTuningPrompt(trainingData, this.results);
  }
}
```

#### Format de sortie optimisé IA

```markdown
# Données d'entraînement pour fine-tuning

## Statistiques globales

- Total: 450 | Corrects: 380 | Accuracy: 84.4%
- Résultats d'entraînement (non conformes): 70/450 (15.6%)
- Algorithme source: M1ActionVerbCounter v1.0

## Données JSONL

{"messages":[{"role":"system","content":"Tu es expert..."},...]}
{"messages":[{"role":"user","content":"Analyse ce tour..."},...]}

## Analyse des erreurs

### Erreurs les plus fréquentes :

- ENGAGEMENT → REFLET_VOUS: 12 occurrences
- REFLET_JE → ENGAGEMENT: 8 occurrences

## Recommandations

1. Cibler les confusions ENGAGEMENT/REFLET
2. Exploiter contexte conversationnel
3. Réviser charte là où ambiguïté forte
```

---

## 🎛️ Hooks Métier Spécialisés

### useResultsFiltering - Filtrage multicritères

#### Fonctionnalités

- **Filtres par tags** : Prédits et réels avec autocomplete
- **Mode désaccords uniquement** : Focus sur erreurs pour analyse
- **Filtrage temps réel** : Performance optimisée pour 1000+ résultats

```typescript
const {
  filteredResults, // Résultats après filtrage
  filters: {
    predFilter, // Tags prédits sélectionnés
    realFilter, // Tags réels sélectionnés
    onlyDisagreements, // Mode erreurs uniquement
    allPredTags, // Tous tags prédits disponibles
    allRealTags, // Tous tags réels disponibles
  },
  updateFilters: { setPredFilter, setRealFilter, setOnlyDisagreements },
  totalErrors, // Nombre total d'erreurs
} = useResultsFiltering(results);
```

### useResultsPagination - Pagination optimisée

#### Performance et UX

- **Reset automatique** : Page 0 quand filtres changent
- **Pagination adaptative** : Tailles 10/25/50/100 selon volume
- **Mémoire efficace** : Seuls éléments page courante en mémoire

```typescript
const {
  page, // Page courante
  rowsPerPage, // Taille page
  pageItems, // Éléments page courante seulement
  handlePageChange, // Navigation pages
  handleRowsPerPageChange, // Changement taille
  totalPages, // Nombre total pages
} = useResultsPagination(filteredResults, initialPageSize);
```

---

## 🧪 Tests et Validation

### Stratégie de test du module

#### Tests unitaires actuels (78% coverage)

```typescript
describe("ResultsPanel", () => {
  it("should render metrics for classification targetKind");
  it("should render metrics for numeric targetKind");
  it("should handle empty results gracefully");
  it("should apply filters correctly");
  it("should paginate large datasets");
});

describe("MetricsPanel", () => {
  it("should route to classification metrics for X/Y/M2");
  it("should route to numeric metrics for M1/M3");
  it("should calculate accuracy correctly");
  it("should compute Kappa with proper expected accuracy");
});

describe("FineTuningExtractor", () => {
  it("should extract only misclassified results");
  it("should format JSONL correctly");
  it("should include expert annotations when available");
  it("should generate meaningful error analysis");
});
```

#### Tests d'intégration critiques

- **Workflow complet** : Chargement données → Filtrage → Pagination → Annotations
- **Performance** : 1000+ résultats en <2s rendu initial
- **Fine-tuning pipeline** : Extraction → Format → Export sans erreurs

#### Cas de test performance

```typescript
// Test volume important
const largeDataset = generateMockResults(2000);
const startTime = performance.now();
render(<ResultsPanel results={largeDataset} targetKind="M1" />);
const renderTime = performance.now() - startTime;
expect(renderTime).toBeLessThan(2000); // <2s pour 2000 résultats
```

### Métriques de validation système

- **Précision métriques** : Calculs identiques à références scientifiques
- **Cohérence UI** : Design System Material-UI respecté
- **Accessibilité** : ARIA labels, navigation clavier, contrastes
- **Performance** : <2s chargement initial, <200ms interactions

---

## 🔄 Workflow d'utilisation

### Utilisation basique - Validation M1

```typescript
import { ResultsPanel } from "./components/Level1/shared/results";
import type { TVValidationResult } from "./types";

// 1. Préparation données validation M1
const m1Results: TVValidationResult[] = await runM1Validation(dataset);

// 2. Rendu interface complète
<ResultsPanel
  results={m1Results}
  targetKind="M1"
  classifierLabel="M1 Action Verb Counter v1.0"
  initialPageSize={25}
/>;
```

### Utilisation avancée - Classification X avec colonnes custom

```typescript
// Colonnes personnalisées pour analyse spécifique
const customColumns: ExtraColumn[] = [
  {
    id: "custom-complexity",
    header: "Complexité",
    render: (result) => {
      const wordCount = result.verbatim.split(" ").length;
      return (
        <Chip
          label={wordCount > 20 ? "Complexe" : "Simple"}
          color={wordCount > 20 ? "warning" : "success"}
        />
      );
    },
  },
];

<ResultsPanel
  results={xResults}
  targetKind="X"
  extraColumns={customColumns}
  classifierLabel="Ensemble X Classifiers v2.1"
/>;
```

### Workflow annotations expertes

```typescript
// 1. Utilisateur clique icône annotation sur ligne résultat
// 2. Drawer s'ouvre avec contexte complet (tours précédents/suivants)
// 3. Utilisateur saisit commentaire avec justification
// 4. Sauvegarde automatique via API avec métadonnées algorithme
// 5. Annotation disponible immédiatement pour fine-tuning

const annotationWorkflow = {
  trigger: "AnnotationList icon click",
  context: "Full conversational context + algo metadata",
  persistence: "Supabase API with versioning",
  availability: "Immediate for fine-tuning extraction",
};
```

### Pipeline fine-tuning complet

```typescript
// 1. Analyse résultats avec annotations
<ResultsPanel results={annotatedResults} targetKind="X" />;

// 2. Extraction données fine-tuning (bouton dans header)
const fineTuningData = await extractFineTuningData(filteredResults);

// 3. Format JSONL avec contexte expert
// 4. Analyse erreurs automatique avec patterns
// 5. Export ready-to-use pour Claude/GPT fine-tuning
```

---

## 🚨 Points d'Attention et Limitations

### Performance critique

1. **Rendu grandes données** : >1000 résultats peuvent ralentir le navigateur
   - **Solution** : Pagination forcée + virtualisation si >2000 éléments
   - **Optimisation** : Memo sur composants coûteux, debounce filtres
2. **Calculs métriques temps réel** : Recalculs à chaque changement filtre
   - **Solution** : useMemo avec dépendances précises
   - **Cache** : Résultats calculs lourds (matrices confusion)
3. **Fine-tuning extraction** : Peut être lent avec annotations nombreuses
   - **Optimisation** : Progress indicators + batch processing
   - **Limite** : Maximum 500 résultats par extraction

### Limitations fonctionnelles

1. **Types données supportés** : Optimisé pour TVValidationResult uniquement
   - **Impact** : Adaptation nécessaire pour nouveaux formats
   - **Solution** : Généricisation interfaces + adapteurs
2. **Annotations offline** : Nécessite connexion API pour persistance
   - **Limitation** : Pas de cache local annotations
   - **Workaround** : Mode dégradé avec stockage session temporaire
3. **Export formats** : Fine-tuning uniquement JSONL + Markdown
   - **Limitation** : Pas d'export CSV/Excel natif des métriques
   - **Future** : Ajout exports multiples formats

### Cas d'erreur fréquents

```typescript
// Données malformées
if (!result.metadata?.turnId) {
  console.warn('Missing turnId for annotation feature');
  // Annotations désactivées pour cette ligne
}

// API annotations indisponible
catch (error) {
  alert(`Échec sauvegarde annotation: ${error.message}`);
  // Mode dégradé : sauvegarde locale temporaire
}

// Volume données trop important
if (results.length > 2000) {
  console.warn('Large dataset detected, enabling pagination');
  showAllResults = false; // Force pagination
}
```

---

## 🔗 Intégrations et Dépendances

### Modules AlgorithmLab utilisés

- **`types/ValidationTypes.ts`** : Interfaces TVValidationResult, XValidationResult
- **`types/ThesisVariables.ts`** : Types M1Details, VARIABLE_COLORS, VARIABLE_LABELS
- **`context/TaggingDataContext`** : API annotations, gestion état global
- **`shared/BaseAlgorithm.ts`** : Métadonnées standard algorithmes

### Dépendances externes critiques

```typescript
// Material-UI - Interface utilisateur
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  Stack,
  Box,
  Drawer,
  Dialog,
} from "@mui/material";

// React Hooks - Gestion état et performance
import { useState, useMemo, useEffect, useCallback } from "react";

// APIs navigateur - Fonctionnalités avancées
navigator.clipboard.writeText(data); // Export fine-tuning
new Blob([data], { type: "text/plain" }); // Téléchargements
```

### Intégrations avec autres modules Level 1

```typescript
// Utilisé par tous les algorithmes Level 1
import { ResultsPanel } from '../shared/results';

// M1 Algorithms
<ResultsPanel results={m1Results} targetKind="M1" />

// X Classifiers
<ResultsPanel results={xResults} targetKind="X" />

// Comparaison multi-algorithmes
<ResultsPanel
  results={[...m1Results, ...xResults]}
  targetKind="comparison"
  extraColumns={comparisonColumns}
/>
```

---

## 📈 Évolution et Roadmap

### Historique des versions

- **v1.0** (2024-10) : ResultsSample basique avec métriques simples
- **v1.5** (2024-11) : Ajout système annotations + filtres avancés
- **v2.0** (2024-12) : Pipeline fine-tuning IA + métriques adaptatives
- **v2.1** (2025-01) : Colonnes dynamiques + optimisations performance

### Roadmap technique prioritaire

#### Sprint suivant (Priorité haute)

- [ ] **Virtualisation tableau** : Support 5000+ résultats sans ralentissement
- [ ] **Export métriques** : CSV/Excel des tableaux de performance
- [ ] **Tests coverage 90%** : Compléter tests hooks et edge cases
- [ ] **Optimisation mémoire** : Réduction footprint composants lourds

#### Q1 2025 (Priorité moyenne)

- [ ] **Annotations collaboratives** : Multi-utilisateurs temps réel
- [ ] **Templates fine-tuning** : Presets par type d'algorithme
- [ ] **Métriques avancées** : AUC-ROC, courbes de calibration
- [ ] **Cache intelligent** : Persistance calculs métriques côté client

#### Q2+ 2025 (Long terme)

- [ ] **Visualisations avancées** : Graphiques interactifs (D3.js)
- [ ] **Intelligence artificielle** : Suggestions automatiques d'amélioration
- [ ] **API REST** : Endpoints pour intégration externe
- [ ] **Mode hors-ligne** :
