
# 📄 `data-flow.md`

<pre class="overflow-visible!" data-start="247" data-end="1394"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Data Flow</span><span>

</span><span>## 🔄 Vue d’ensemble</span><span>

Le flux de données dans AlgorithmLab suit une séquence claire allant des </span><span>**données conversationnelles brutes**</span><span> jusqu’à la </span><span>**visualisation des résultats**</span><span> et leur exploitation scientifique.

```mermaid
sequenceDiagram
    participant User as 👤 Utilisateur
    participant UI as 🖥️ BaseAlgorithmTesting
    participant Registry as 📚 AlgorithmRegistry
    participant Adapter as 🔄 UniversalAdapter
    participant Algo as 🧪 BaseAlgorithm
    participant Results as 📊 ResultsPanel

    User->>UI: Sélectionne un algorithme (ex: "M1ActionVerbCounter")
    UI->>Registry: algorithmRegistry.get("M1ActionVerbCounter")
    Registry-->>UI: UniversalAlgorithm

    User->>UI: Lance la validation (sampleSize = 100)
    UI->>Adapter: classify/verbatim
    Adapter->>Algo: run({ text: "..." })
    Algo-->>Adapter: { prediction, confidence, details }
    Adapter-->>UI: UniversalResult[]
  
    UI->>Results: <ResultsPanel results={...} targetKind="M1" />
    Results->>Results: Génération colonnes dynamiques
    Results->>Results: Dispatch vers MetricsPanel
    Results-->>User: Tableau + métriques
</span></span></code></div></div></pre>

---

## 📥 Étapes détaillées

### 1. Input

* **Source** : données de conversations (`turntagged` depuis Supabase).
* **Préparation** : `inputPreparation.ts` (nettoyage, normalisation).
* **Normalisation** : `normalizers.ts` (uniformiser les labels X/Y/M1/M2/M3).

### 2. Sélection de l’algorithme

* L’utilisateur choisit dans l’UI (`ClassifierSelector`, `Level1Interface`).
* `AlgorithmRegistry` fournit une instance de `UniversalAlgorithm`.

### 3. Adaptation unifiée

* Tous les algorithmes (règles, ML, LLM) passent par `createUniversalAlgorithm` (`universal-adapter.ts`).
* Garantit une **interface homogène** : `run(input) → UniversalResult`.

### 4. Exécution de l’algorithme

* Implémentation concrète (`BaseAlgorithm`).
* Peut être :
  * **Rule-based** : Regex (rapide, déterministe).
  * **ML** : SpaCy.
  * **LLM** : OpenAI, Mistral.

### 5. Résultats intermédiaires

* Conversion via `converters.ts`.
* Ajout de **métadonnées** : temps de calcul, confiance, verbatims associés.

### 6. Visualisation

* `ResultsPanel` = composant central.
* Colonnes dynamiques générées via `extraColumns.ts`.
* `MetricsPanel` choisit automatiquement le bon set de métriques :
  * Classification (Accuracy, F1, Kappa).
  * Numérique (MAE, RMSE, R²).

### 7. Sortie scientifique

* Rapport validé (`ValidationTypes.ts`).
* Export possible en CSV, JSON, LaTeX (via ScientificReport).

---

## ✅ Points clés

* **Séparation stricte** : algorithmes → adaptateur → UI.
* **Unification via UniversalAdapter** : interface commune.
* **Résultats adaptatifs** : colonnes & métriques selon variable.

<pre class="overflow-visible!" data-start="2974" data-end="3426"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span># 📄 `design-patterns.md`</span><span>

</span><span>```markdown</span><span>
</span><span># Design Patterns</span><span>

</span><span>## 🎯 Objectif</span><span>
</span><span>AlgorithmLab</span><span></span><span>applique</span><span></span><span>plusieurs</span><span></span><span>**patterns</span><span></span><span>de</span><span></span><span>conception**</span><span></span><span>pour</span><span></span><span>assurer</span><span></span><span>modularité,</span><span></span><span>extensibilité</span><span></span><span>et</span><span></span><span>maintenabilité.</span><span>

---

</span><span>## 1. Strategy Pattern (Algorithmes)</span><span>

</span><span>Chaque</span><span></span><span>algorithme</span><span></span><span>implémente</span><span></span><span>une</span><span></span><span>interface</span><span></span><span>commune</span><span></span><span>(`BaseAlgorithm`).</span><span>

</span><span>```typescript</span><span>
</span><span>interface</span><span></span><span>BaseAlgorithm<TInput,</span><span></span><span>TOutput></span><span> {
  </span><span>run(input:</span><span></span><span>TInput):</span><span></span><span>Promise<TOutput>;</span><span>
  </span><span>describe():</span><span></span><span>AlgorithmDescriptor;</span><span>
}
</span></span></code></div></div></pre>

Exemples :

* `M1ActionVerbCounter` (numérique)
* `RegexXClassifier` (classification)
* `SpacyConseillerClassifier` (ML)

**Avantage** : ajouter un nouvel algorithme sans modifier l’existant.

---

## 2. Adapter Pattern (Universalisation)

Tous les algorithmes passent par un adaptateur unique (`createUniversalAlgorithm`).

<pre class="overflow-visible!" data-start="3752" data-end="3910"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>function</span><span> createUniversalAlgorithm<</span><span>TInput</span><span>, </span><span>TDetails</span><span>>(
  </span><span>algo</span><span>: </span><span>BaseAlgorithm</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>>,
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>
): </span><span>UniversalAlgorithm</span><span>
</span></span></code></div></div></pre>

**Avant** : API hétérogènes (`run`, `classify`, etc.).

**Après** : API homogène (`universal.run()`).

**Avantage** : simplifie l’intégration dans l’UI.

---

## 3. Factory Pattern (Colonnes dynamiques)

`ResultsPanel` génère les colonnes selon la variable ciblée (X, Y, M1, M2, M3).

<pre class="overflow-visible!" data-start="4198" data-end="4485"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>function</span><span></span><span>buildExtraColumnsForTarget</span><span>(</span><span>kind: TargetKind</span><span>): </span><span>ExtraColumn</span><span>[] {
  </span><span>switch</span><span> (kind) {
    </span><span>case</span><span></span><span>"X"</span><span>: </span><span>return</span><span></span><span>buildXColumns</span><span>();
    </span><span>case</span><span></span><span>"Y"</span><span>: </span><span>return</span><span></span><span>buildYColumns</span><span>();
    </span><span>case</span><span></span><span>"M1"</span><span>: </span><span>return</span><span> m1Columns;
    </span><span>case</span><span></span><span>"M2"</span><span>: </span><span>return</span><span> m2Columns;
    </span><span>case</span><span></span><span>"M3"</span><span>: </span><span>return</span><span> m3Columns;
  }
}
</span></span></code></div></div></pre>

**Avantage** : UI adaptative sans code dupliqué.

---

## 4. Observer Pattern (Annotations en temps réel)

Annotations liées aux verbatims observées via un contexte partagé.

<pre class="overflow-visible!" data-start="4662" data-end="4812"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>const</span><span> { addAnnotation, updateAnnotation } = </span><span>useTaggingData</span><span>();

</span><span><span class="language-xml"><AnnotationList</span></span><span>
  </span><span>turnId</span><span>=</span><span>{142}</span><span>
  </span><span>onAnnotationChange</span><span>=</span><span>{handleUpdate}</span><span>
/>
</span></span></code></div></div></pre>

**Avantage** : collaboration multi-utilisateurs, mise à jour en temps réel.

---

## ✅ Résumé

* **Strategy** : modularité algorithmes.
* **Adapter** : interface unifiée.
* **Factory** : UI dynamique.
* **Observer** : supervision en temps réel.

<pre class="overflow-visible!" data-start="5058" data-end="6124"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
</span><span>---</span><span>

# 📄 `</span><span>type</span><span>-</span><span>system</span><span>.md`

```markdown
# </span><span>Type</span><span></span><span>System</span><span>

## 🎯 Objectif
Centraliser tous les </span><span>types</span><span> pour garantir cohérence entre **algorithmes**, **core scientifique**, et **UI**.

</span><span>---</span><span>

## 📚 Hiérarchie des </span><span>types</span><span>

```mermaid
graph TB
    subgraph "CORE"
        VAR[Variables<br/>X/Y/M1/M2/M3]
        CALC[Calculations<br/>Inputs/Outputs]
        </span><span>VALID</span><span>[Validation<br/>Metrics/Results]
    </span><span>end</span><span>
  
    subgraph "ALGORITHMS"
        BASE[BaseAlgorithm<br/>Interface générique]
        UNIV[UniversalAlgorithm<br/>Adaptateur unifié]
        REG[AlgorithmRegistry<br/>Enregistrement]
    </span><span>end</span><span>
  
    subgraph "UI"
        PANEL[ResultsPanelProps]
        METRICS[MetricsPanelProps]
        EXTRA[ExtraColumns]
    </span><span>end</span><span>
  
    subgraph "UTILS"
        NORM[Normalizers]
        CONV[Converters]
        PREP[InputPreparation]
    </span><span>end</span><span>
  
    VAR </span><span>--> CALC</span><span>
    CALC </span><span>--> VALID</span><span>
  
    </span><span>VALID</span><span></span><span>--> BASE</span><span>
    BASE </span><span>--> UNIV</span><span>
    UNIV </span><span>--> REG</span><span>
  
    </span><span>VALID</span><span></span><span>--> PANEL</span><span>
    PANEL </span><span>--> METRICS</span><span>
    PANEL </span><span>--> EXTRA</span><span>
  
    </span><span>VALID</span><span></span><span>--> CONV</span><span>
    CONV </span><span>--> NORM</span><span>
    CONV </span><span>--> PREP</span><span>
</span></span></code></div></div></pre>

---

## 📥 Core Types (`types/core/`)

* **variables.ts** : définition X, Y, M1, M2, M3.
* **validation.ts** : métriques (Accuracy, F1, MAE, etc.).
* **calculations.ts** : entrées/sorties standardisées.
* **level0.ts** : validation inter-annotateurs.

---

## 🧪 Algorithms Types (`types/algorithms/`)

* **base.ts** : `BaseAlgorithm`, `AlgorithmDescriptor`.
* **universal-adapter.ts** : `UniversalAlgorithm`.
* **index.ts** : exports centralisés.

---

## 🖥️ UI Types (`types/ui/`)

* **components.ts** : props ResultsPanel, MetricsPanel.
* **validation.ts** : types pour affichage métriques.

---

## 🔧 Utils Types (`types/utils/`)

* **normalizers.ts** : uniformisation labels.
* **converters.ts** : conversion vers UniversalResult.
* **inputPreparation.ts** : préparation texte.
* **corpusFilters.ts** : filtres sur datasets.

---

## ✅ Points clés

* Tous les types sont **centralisés** dans `types/`.
* Séparation stricte CORE / ALGORITHMS / UI / UTILS.
* `UniversalAlgorithm` = contrat unique entre backend (algo) et frontend (UI).
