
# 📄 `type-system.md`

<pre class="overflow-visible!" data-start="159" data-end="535"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Type System</span><span>

</span><span>## 🎯 Objectif</span><span>
Le </span><span>**système de types**</span><span> est le socle contractuel d’AlgorithmLab.  
Il garantit une cohérence stricte entre les algorithmes, le core scientifique et l’interface utilisateur.

Tous les types sont </span><span>**centralisés**</span><span> dans le dossier </span><span>`types/`</span><span> pour éviter toute duplication et assurer la maintenabilité.

---

</span><span>## 📚 Organisation des types</span><span>

</span></span></code></div></div></pre>

types/

├── algorithms/   # Contrats génériques des algorithmes

│   ├── base.ts

│   ├── universal-adapter.ts

│   └── index.ts

├── core/         # Types scientifiques

│   ├── calculations.ts

│   ├── validation.ts

│   ├── variables.ts

│   └── level0.ts

├── ui/           # Props et contrats UI

│   ├── components.ts

│   └── validation.ts

└── utils/        # Types utilitaires

├── converters.ts

├── corpusFilters.ts

├── inputPreparation.ts

└── normalizers.ts

<pre class="overflow-visible!" data-start="1007" data-end="1546"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span>## 🧩 Core Types</span><span>

</span><span>### `variables.ts`</span><span>
</span><span>Définition</span><span></span><span>des</span><span></span><span>**cibles</span><span></span><span>scientifiques**</span><span></span><span>:</span><span>  
</span><span>-</span><span></span><span>**X**</span><span></span><span>:</span><span></span><span>stratégies</span><span></span><span>du</span><span></span><span>conseiller</span><span></span><span>(classification).</span><span>  
</span><span>-</span><span></span><span>**Y**</span><span></span><span>:</span><span></span><span>réactions</span><span></span><span>du</span><span></span><span>client</span><span></span><span>(classification).</span><span>  
</span><span>-</span><span></span><span>**M1**</span><span></span><span>:</span><span></span><span>densité</span><span></span><span>verbes</span><span></span><span>d’action</span><span></span><span>(numérique).</span><span>  
</span><span>-</span><span></span><span>**M2**</span><span></span><span>:</span><span></span><span>alignement</span><span></span><span>conseiller↔client</span><span></span><span>(classification).</span><span>  
</span><span>-</span><span></span><span>**M3**</span><span></span><span>:</span><span></span><span>charge</span><span></span><span>cognitive</span><span></span><span>(numérique).</span><span>  

</span><span>### `calculations.ts`</span><span>
</span><span>Contrats</span><span></span><span>d’entrée</span><span></span><span>et sortie pour les calculateurs :</span><span>  
</span><span>```typescript</span><span>
</span><span>interface</span><span></span><span>M1Input</span><span> { </span><span>text:</span><span></span><span>string</span><span> }
</span><span>interface</span><span></span><span>M1Output</span><span> { </span><span>density:</span><span></span><span>number;</span><span></span><span>verbsFound:</span><span></span><span>string</span><span>[] }
</span></span></code></div></div></pre>

### `validation.ts`

Types liés à la validation :

* Métriques classification (Accuracy, F1, Kappa).
* Métriques numériques (MAE, RMSE, R²).
* Résultats normalisés pour comparaisons multi-algos.

### `level0.ts`

Types pour validation inter-annotateurs :

* `InterAnnotatorAgreementResult`
* `KappaCohenMetrics`

---

## 🧪 Algorithms Types

### `base.ts`

Interface générique de tout algorithme :

<pre class="overflow-visible!" data-start="1955" data-end="2122"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>export</span><span></span><span>abstract</span><span></span><span>class</span><span></span><span>BaseAlgorithm</span><span><</span><span>TInput</span><span>, </span><span>TOutput</span><span>> {
  </span><span>abstract</span><span></span><span>run</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>Promise</span><span><</span><span>TOutput</span><span>>;
  </span><span>abstract</span><span></span><span>describe</span><span>(): </span><span>AlgorithmDescriptor</span><span>;
}
</span></span></code></div></div></pre>

### `universal-adapter.ts`

Adaptateur unifié :

* Normalise l’API (`.run` / `.classify` / `.calculate`).
* Retourne un **UniversalResult** compatible UI.

### `index.ts`

Exports centralisés pour simplifier l’import.

---

## 🖥️ UI Types

### `components.ts`

Props des composants principaux :

* `ResultsPanelProps`
* `MetricsPanelProps`
* `RunPanelProps`

### `validation.ts`

Contrats pour l’affichage des métriques :

<pre class="overflow-visible!" data-start="2553" data-end="2702"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>interface</span><span></span><span>ClassificationMetrics</span><span> { </span><span>accuracy</span><span>: </span><span>number</span><span>; </span><span>f1</span><span>: </span><span>number</span><span> }
</span><span>interface</span><span></span><span>NumericMetrics</span><span> { </span><span>mae</span><span>: </span><span>number</span><span>; </span><span>rmse</span><span>: </span><span>number</span><span>; </span><span>r2</span><span>: </span><span>number</span><span> }
</span></span></code></div></div></pre>

---

## 🔧 Utils Types

* **`converters.ts`** : mapping résultats algorithmes → `UniversalResult`.
* **`normalizers.ts`** : uniformisation des labels (ex: majuscules, underscores).
* **`inputPreparation.ts`** : nettoyage texte d’entrée.
* **`corpusFilters.ts`** : filtres sur datasets (par speaker, par tag, etc.).

---

## 📊 Vue d’ensemble

<pre class="overflow-visible!" data-start="3055" data-end="3829"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-mermaid"><span>graph TB
    subgraph "CORE"
        VAR[Variables]
        CALC[Calculations]
        VALID[Validation]
    end
  
    subgraph "ALGORITHMS"
        BASE[BaseAlgorithm]
        UNIV[UniversalAlgorithm]
        REG[AlgorithmRegistry]
    end
  
    subgraph "UI"
        PANEL[ResultsPanelProps]
        METRICS[MetricsPanelProps]
        EXTRA[ExtraColumns]
    end
  
    subgraph "UTILS"
        NORM[Normalizers]
        CONV[Converters]
        PREP[InputPreparation]
        FILT[CorpusFilters]
    end
  
    VAR --> CALC
    CALC --> VALID
  
    VALID --> BASE
    BASE --> UNIV
    UNIV --> REG
  
    VALID --> PANEL
    PANEL --> METRICS
    PANEL --> EXTRA
  
    VALID --> CONV
    CONV --> NORM
    CONV --> PREP
    CONV --> FILT
</span></code></div></div></pre>

---

## ✅ Points clés

* **Centralisation** : tous les types regroupés dans `types/`.
* **Séparation stricte** : Core ≠ Algorithms ≠ UI ≠ Utils.
* **UniversalResult** : contrat pivot entre algo et UI.
* **Extensibilité** : ajouter un nouvel algorithme n’impacte pas les types UI ou Core.

→ [Retour Architecture](README.md)
