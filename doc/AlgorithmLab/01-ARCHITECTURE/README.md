# Architecture AlgorithmLab

**Vue d'ensemble du système de validation scientifique**

---

## 🎯 Vision globale
```mermaid
graph TB
    subgraph "📥 INPUT"
        DATA[Données conversationnelles<br/>Tours de parole]
    end
    
    subgraph "🧪 ALGORITHMES"
        direction LR
        X_ALGO[Classificateurs X<br/>Stratégies conseiller]
        Y_ALGO[Classificateurs Y<br/>Réactions client]
        M1_ALGO[Calculateurs M1<br/>Densité verbes]
        M2_ALGO[Classificateurs M2<br/>Alignement]
        M3_ALGO[Calculateurs M3<br/>Charge cognitive]
    end
    
    subgraph "🔄 ADAPTATEUR UNIVERSEL"
        ADAPTER[createUniversalAlgorithm<br/>Interface unifiée]
    end
    
    subgraph "📊 TYPES CORE"
        TYPES[ValidationTypes<br/>AlgorithmTypes<br/>UITypes]
    end
    
    subgraph "🖥️ INTERFACE UI"
        direction LR
        RESULTS[ResultsPanel<br/>Tableau résultats]
        METRICS[MetricsPanel<br/>Accuracy/MAE/Kappa]
        ANNOT[AnnotationList<br/>Annotations expertes]
        FINETUNE[FineTuningDialog<br/>Amélioration IA]
    end
    
    subgraph "📈 OUTPUT"
        VALID[Rapport de validation<br/>Métriques scientifiques]
    end
    
    DATA --> X_ALGO
    DATA --> Y_ALGO
    DATA --> M1_ALGO
    DATA --> M2_ALGO
    DATA --> M3_ALGO
    
    X_ALGO --> ADAPTER
    Y_ALGO --> ADAPTER
    M1_ALGO --> ADAPTER
    M2_ALGO --> ADAPTER
    M3_ALGO --> ADAPTER
    
    ADAPTER --> TYPES
    TYPES --> RESULTS
    TYPES --> METRICS
    RESULTS --> ANNOT
    RESULTS --> FINETUNE
    
    METRICS --> VALID
    ANNOT --> VALID
    
    style DATA fill:#e3f2fd
    style ADAPTER fill:#fff9c4
    style TYPES fill:#f3e5f5
    style VALID fill:#e8f5e9

🏗️ Composants principaux
1. Système de types (types/)
Rôle : Contrats unifiés entre algorithmes et UI
types/
├── algorithms/     # BaseAlgorithm, UniversalAlgorithm
├── core/          # Variables, Validation, Calculations
├── ui/            # ResultsPanel, MetricsPanel props
└── utils/         # Normalizers, Converters
→ Documentation détaillée
→ ADR-001 : Pourquoi ce choix ?

2. Algorithmes (algorithms/level1/)
Rôle : Implémentations des 5 variables (X/Y/M1/M2/M3)
algorithms/level1/
├── XClassifiers/       # Classification stratégies conseiller
├── YClassifiers/       # Classification réactions client
├── M1Calculators/      # Calcul densité verbes action
├── M2Calculators/      # Classification alignement
├── M3Calculators/      # Calcul charge cognitive
└── shared/
    ├── AlgorithmRegistry.ts
    └── UniversalAdapter.ts
Pattern : Strategy + Adapter
→ Design patterns
→ ADR-002 : Adaptateur universel

3. Interface utilisateur (components/Level1/)
Rôle : Visualisation résultats, annotations, métriques
components/Level1/
├── Level1Interface.tsx        # Navigation principale
├── TechnicalBenchmark.tsx     # Comparaison algorithmes
├── algorithms/                # Tests par variable
│   ├── BaseAlgorithmTesting.tsx
│   ├── XClassifiers/
│   ├── YClassifiers/
│   ├── M1Calculators/
│   ├── M2Calculators/
│   └── M3Calculators/
└── shared/results/
    ├── base/
    │   ├── ResultsPanel.tsx   # ⭐ Composant principal
    │   ├── MetricsPanel.tsx
    │   ├── RunPanel.tsx
    │   └── extraColumns.tsx   # Colonnes dynamiques
    └── ResultsSample/
        ├── components/
        │   ├── AnnotationList.tsx
        │   ├── ResultsTableBody.tsx
        │   └── FineTuningDialog/
        └── hooks/
Pattern : Factory (colonnes dynamiques)
→ ADR-003 : Dispatch métriques

🔄 Flux de données (bout en bout)
mermaidsequenceDiagram
    participant User as 👤 Utilisateur
    participant UI as 🖥️ BaseAlgorithmTesting
    participant Registry as 📚 AlgorithmRegistry
    participant Adapter as 🔄 Universal Adapter
    participant Algo as 🧪 M1Calculator
    participant Results as 📊 ResultsPanel
    
    User->>UI: Sélectionne "M1ActionVerbCounter"
    UI->>Registry: algorithmRegistry.get("M1ActionVerbCounter")
    Registry-->>UI: UniversalAlgorithm
    
    User->>UI: Clique "Lancer test" (n=100)
    UI->>Adapter: classify(verbatim)
    Adapter->>Algo: run({ text: "..." })
    Algo-->>Adapter: { prediction, confidence, details }
    Adapter-->>UI: UniversalResult[]
    
    UI->>Results: <ResultsPanel results={...} targetKind="M1" />
    Results->>Results: buildExtraColumnsForTarget("M1")
    Results->>Results: MetricsPanel (dispatch numérique)
    Results-->>User: Affichage tableau + métriques
→ Flux détaillé

🎨 Patterns de conception
Strategy Pattern (Algorithmes)
typescript// Interface commune
interface BaseAlgorithm<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
  describe(): AlgorithmDescriptor;
}

// Implémentations concrètes
class M1ActionVerbCounter implements BaseAlgorithm<M1Input, M1Details> { }
class RegexXClassifier implements BaseAlgorithm<XInput, XDetails> { }
Avantage : Ajouter un nouvel algorithme sans toucher au reste du code

Adapter Pattern (Unification)
typescript// Adaptateur universel
function createUniversalAlgorithm<TInput, TDetails>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  config?: { type, supportsBatch, ... }
): UniversalAlgorithm

// Avant (hétérogène)
m1.run({ text: "..." })        // → CalculationResult<M1Details>
x.classify("...")               // → ClassificationResult

// Après (unifié via adapter)
universal.run("...")            // → UniversalResult
universal.classify("...")       // → UniversalResult
Avantage : Interface unique pour l'UI, quelle que soit la variable
→ ADR-002 : Justification

Factory Pattern (Colonnes dynamiques)
typescript// Factory : génère automatiquement les bonnes colonnes
function buildExtraColumnsForTarget(kind: TargetKind): ExtraColumn[] {
  switch (kind) {
    case "X": return buildXColumns();      // Famille, Évidences
    case "Y": return buildYColumns();      // Famille, Évidences
    case "M1": return m1Columns;           // Densité, Verbes trouvés
    case "M2": return m2Columns;           // Valeur, Échelle
    case "M3": return m3Columns;           // Durée, Unité
  }
}

// Utilisation dans ResultsPanel
<ResultsTableBody extraColumns={buildExtraColumnsForTarget("M1")} />
Avantage : Colonnes adaptées automatiquement selon la variable
→ API extraColumns

Observer Pattern (Annotations)
typescript// Context partagé pour annotations temps réel
const { addAnnotation, updateAnnotation, deleteAnnotation } = useTaggingData();

// Composant observe les changements
<AnnotationList
  turnId={142}
  onAnnotationChange={handleUpdate} // Observer
/>
Avantage : Mises à jour en temps réel, collaboration multi-utilisateurs
→ ADR-004 : Système d'annotations

📊 Hiérarchie des types
mermaidgraph TB
    subgraph "CORE"
        VAR[Variables<br/>X/Y/M1/M2/M3]
        CALC[Calculations<br/>Input/Output]
        VALID[Validation<br/>Metrics/Results]
    end
    
    subgraph "ALGORITHMS"
        BASE[BaseAlgorithm<br/>Interface générique]
        UNIV[UniversalAlgorithm<br/>Interface unifiée]
        DESC[AlgorithmDescriptor<br/>Métadonnées]
    end
    
    subgraph "UI"
        PANEL[ResultsPanelProps]
        METRICS[MetricsPanelProps]
        DISPLAY[DisplayConfig]
    end
    
    subgraph "UTILS"
        NORM[Normalizers<br/>normalizeXLabel...]
        CONV[Converters<br/>toUniversalResult...]
    end
    
    VAR --> CALC
    CALC --> VALID
    
    VALID --> BASE
    BASE --> UNIV
    UNIV --> DESC
    
    VALID --> PANEL
    PANEL --> METRICS
    METRICS --> DISPLAY
    
    VALID --> CONV
    CONV --> NORM
    
    style CORE fill:#e3f2fd
    style ALGORITHMS fill:#fff9c4
    style UI fill:#f3e5f5
    style UTILS fill:#e8f5e9
→ Documentation types

🔐 Règles d'architecture (IMPORTANTES)
✅ À FAIRE

UI consomme CORE, jamais l'inverse
ALGORITHMS consomme CORE, pas UI
UTILS est transversal mais pur (pas de React/MUI)
Tous les algos passent par l'adaptateur universel
Types centralisés dans types/

❌ À ÉVITER

Importer UI dans ALGORITHMS ou CORE
Importer React/MUI dans UTILS
Créer des wrappers spécifiques (wrapX, wrapY, etc.)
Types dupliqués entre modules
Logique métier dans les composants UI

→ Checklist de validation

🎯 Points d'entrée par cas d'usage
👨‍💻 Je veux créer un algorithme M1
typescript// 1. Créer la classe
class MyM1 extends BaseM1Calculator { }

// 2. Enregistrer
const universal = createUniversalAlgorithm(new MyM1(), "M1");
algorithmRegistry.register("MyM1", universal);

// 3. Utiliser dans UI
<BaseAlgorithmTesting target="M1" defaultClassifier="MyM1" />
→ Tutorial complet

🖥️ Je veux afficher des résultats
typescript<ResultsPanel
  results={validationResults}
  targetKind="M1"  // Dispatch automatique métriques numériques
  classifierLabel="M1 Counter v1.0"
/>
→ API ResultsPanel

📊 Je veux comparer plusieurs algorithmes
typescript<TechnicalBenchmark
  benchmarkResults={[
    { algorithmName: "M1ActionVerbCounter", metrics: {...} },
    { algorithmName: "RegexM1Calculator", metrics: {...} },
  ]}
/>
→ API TechnicalBenchmark

🏷️ Je veux des colonnes personnalisées
typescriptconst customColumns: ExtraColumn[] = [
  {
    id: "custom-col",
    header: "Ma colonne",
    render: (row) => <Chip label={row.metadata?.myField} />
  }
];

<ResultsPanel extraColumns={customColumns} />
→ API ExtraColumns

📚 Ressources complémentaires
Documentation

Design Patterns détaillés
Flux de données complet
Système de types

Décisions d'architecture

ADR-001 : Types centralisés
ADR-002 : Adaptateur universel
ADR-003 : Dispatch métriques
ADR-004 : Annotations expertes

Guides

Ajouter un algorithme
Créer un composant UI
Troubleshooting


⏱️ Temps de lecture : ~15 minutes
🎯 Prochaine étape : Design Patterns détaillés
