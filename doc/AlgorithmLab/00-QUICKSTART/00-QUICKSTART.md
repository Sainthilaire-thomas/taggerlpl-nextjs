# AlgorithmLab - Quick Start

**En 5 minutes, comprendre l'essentiel.**

---

## 🎯 C'est quoi AlgorithmLab ?

**Framework de validation scientifique** pour algorithmes de tagging conversationnel.

### En une phrase

> AlgorithmLab permet de  **tester** , **comparer** et **améliorer** des algorithmes qui analysent automatiquement des conversations (stratégies conseiller, réactions client, métriques linguistiques).

---

## 🚀 Cas d'usage principaux

### 1. 🧪 Tester un algorithme (Level 1)

<pre class="overflow-visible!" data-start="924" data-end="1159"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Interface de test automatique</span><span>
</span><span>import</span><span> { </span><span>BaseAlgorithmTesting</span><span> } </span><span>from</span><span></span><span>"./components"</span><span>;

</span><span><span class="language-xml"><BaseAlgorithmTesting</span></span><span>
  </span><span>variableLabel</span><span>=</span><span>"M1 — Densité de verbes d'action"</span><span>
  </span><span>defaultClassifier</span><span>=</span><span>"M1ActionVerbCounter"</span><span>
  </span><span>target</span><span>=</span><span>"M1"</span><span>
/>
</span></span></code></div></div></pre>

→ Voir [Level1Interface](01-ARCHITECTURE/README.md)

### 2. 🔧 Créer un nouvel algorithme

<pre class="overflow-visible!" data-start="1252" data-end="1828"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Exemple : Calculateur M1 (verbes d'action)</span><span>
</span><span>export</span><span></span><span>class</span><span></span><span>MyM1Calculator</span><span></span><span>extends</span><span></span><span>BaseM1Calculator</span><span> {
  </span><span>async</span><span></span><span>run</span><span>(</span><span>input: M1Input</span><span>) {
    </span><span>const</span><span> tokens = input.</span><span>text</span><span>.</span><span>split</span><span>(</span><span>/\s+/</span><span>);
    </span><span>const</span><span> actionVerbs = tokens.</span><span>filter</span><span>(</span><span>t</span><span> => </span><span>this</span><span>.</span><span>isActionVerb</span><span>(t));
    </span><span>const</span><span> density = (actionVerbs.</span><span>length</span><span> / tokens.</span><span>length</span><span>) * </span><span>100</span><span>;
  
    </span><span>return</span><span> {
      </span><span>prediction</span><span>: density.</span><span>toFixed</span><span>(</span><span>2</span><span>),
      </span><span>confidence</span><span>: </span><span>0.8</span><span>,
      </span><span>details</span><span>: {
        </span><span>value</span><span>: density,
        </span><span>actionVerbCount</span><span>: actionVerbs.</span><span>length</span><span>,
        </span><span>totalTokens</span><span>: tokens.</span><span>length</span><span>,
        </span><span>verbsFound</span><span>: actionVerbs,
      },
    };
  }
}
</span></span></code></div></div></pre>

→ [Tutoriel complet](03-DEVELOPER-GUIDES/add-new-algorithm.md)

### 3. 📊 Afficher des résultats

<pre class="overflow-visible!" data-start="1928" data-end="2125"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Composant de visualisation adaptatif</span><span>
<</span><span>ResultsPanel</span><span>
  results={validationResults}
  targetKind=</span><span>"M1"</span><span></span><span>// X/Y/M1/M2/M3</span><span>
  classifierLabel=</span><span>"M1 Counter v1.0"</span><span>
  initialPageSize={</span><span>50</span><span>}
/>
</span></span></code></div></div></pre>

→ [API ResultsPanel](04-API-REFERENCE/components/results-panel.md)

---

## → [Architecture détaillée](01-ARCHITECTURE/README.md)

## 🏗️ Architecture en 1 image

```mermaid
graph TB
  subgraph Variables
    X["X : Stratégies conseiller"]
    Y["Y : Réactions client"]
    M1["M1 : Densité verbes action"]
    M2["M2 : Alignement X->Y"]
    M3["M3 : Charge cognitive"]
  end

  subgraph Algorithmes
    A1["Classificateurs X/Y/M2"]
    A2["Calculateurs M1/M3"]
  end

  subgraph Interface_UI
    UI1["ResultsPanel"]
    UI2["MetricsPanel"]
    UI3["AnnotationList"]
  end

  X --> A1
  Y --> A1
  M2 --> A1
  M1 --> A2
  M3 --> A2

  A1 --> UI1
  A2 --> UI1
  UI1 --> UI2
  UI1 --> UI3

  style X fill:#e3f2fd,stroke:#90caf9,stroke-width:1px
  style Y fill:#e8f5e9,stroke:#a5d6a7,stroke-width:1px
  style M1 fill:#fff3e0,stroke:#ffcc80,stroke-width:1px
  style M2 fill:#f3e5f5,stroke:#ce93d8,stroke-width:1px
  style M3 fill:#fce4ec,stroke:#f48fb1,stroke-width:1px
```


---

## 📚 Les 5 variables expliquées

| Variable     | Type           | Exemple                  | Usage                         |
| ------------ | -------------- | ------------------------ | ----------------------------- |
| **X**  | Classification | ENGAGEMENT, REFLET_VOUS  | Stratégies du conseiller     |
| **Y**  | Classification | POSITIF, NEGATIF         | Réactions du client          |
| **M1** | Numérique     | 22.5 (verbes/100 tokens) | Densité verbes d'action      |
| **M2** | Classification | FORT, FAIBLE             | Alignement conseiller↔client |
| **M3** | Numérique     | 750ms                    | Charge cognitive (pauses)     |

→ [Détails complets](02-CORE-CONCEPTS/variables.md)

---

## 🎓 Workflow de validation scientifique


## 🎓 Workflow de validation scientifique

```mermaid
graph LR
  L0["Level 0 : Accord inter-annotateur"] --> L1["Level 1 : Performance algorithmes"]
  L1 --> L2["Level 2 : Tests d'hypothèses"]

  style L0 fill:#e1f5fe,stroke:#81d4fa,stroke-width:1px
  style L1 fill:#fff9c4,stroke:#fbc02d,stroke-width:1px
  style L2 fill:#f1f8e9,stroke:#aed581,stroke-width:1px
```


### Level 0 : Gold Standard

* Mesure accord entre experts (Kappa Cohen)
* Résolution désaccords

→ [En savoir plus](02-CORE-CONCEPTS/validation-levels.md#level0)

### Level 1 : Performance (⭐ Focus actuel)

* Tests algorithmes individuels
* Comparaison multi-algorithmes
* Métriques : Accuracy, F1, MAE, RMSE

→ [En savoir plus](02-CORE-CONCEPTS/validation-levels.md#level1)

### Level 2 : Hypothèses scientifiques

* H1 : Efficacité communication
* H2 : Charge cognitive
* H3 : Apprentissage organisationnel

→ [En savoir plus](02-CORE-CONCEPTS/validation-levels.md#level2)

---

## 🔍 Prochaines étapes recommandées

### 👨‍💻 Tu es développeur ?

* **Architecture** → [Vue d&#39;ensemble](01-ARCHITECTURE/README.md) (10 min)
* **Tutoriel** → [Créer un algorithme M1](03-DEVELOPER-GUIDES/add-new-algorithm.md) (30 min)
* **API Reference** → [Types et interfaces](04-API-REFERENCE/README.md)

### 🎓 Tu cherches à comprendre ?

* **Variables** → [X/Y/M1/M2/M3 expliquées](02-CORE-CONCEPTS/variables.md)
* **Métriques** → [Accuracy, MAE, Kappa, etc.](02-CORE-CONCEPTS/metrics.md)
* **ADRs** → [Décisions d&#39;architecture](05-ARCHITECTURE-DECISIONS/README.md)

### 🐛 Tu as un problème ?

* **Troubleshooting** → [FAQ &amp; Solutions](06-MAINTENANCE/troubleshooting.md)
* **Migration** → [Guides de migration](06-MAINTENANCE/migration-guides/)

---

## 💡 Concepts clés à retenir

### 🎯 Variables = Cibles d'analyse

Chaque algorithme cible une variable spécifique (X, Y, M1, M2 ou M3).

### 🔧 Adaptateur universel

Tous les algorithmes passent par `createUniversalAlgorithm()` pour unifier les interfaces.

### 📊 Métriques adaptatives

* **Classification** (X/Y/M2) → Accuracy, Precision, Recall, F1, Kappa
* **Numérique** (M1/M3) → MAE, RMSE, R², corrélation

### 🏷️ Colonnes dynamiques

Le système `extraColumns` injecte automatiquement les bonnes colonnes selon la variable.

---

## 🎬 Exemple complet de bout en bout

<pre class="overflow-visible!" data-start="5883" data-end="6399"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// 1. Créer un algorithme M1</span><span>
</span><span>class</span><span></span><span>MyM1</span><span></span><span>extends</span><span></span><span>BaseM1Calculator</span><span> {
  </span><span>async</span><span></span><span>run</span><span>(</span><span>input: M1Input</span><span>) {
    </span><span>/* ... */</span><span>
  }
}

</span><span>// 2. L'enregistrer</span><span>
</span><span>const</span><span> universal = </span><span>createUniversalAlgorithm</span><span>(</span><span>new</span><span></span><span>MyM1</span><span>(), </span><span>"M1"</span><span>);
algorithmRegistry.</span><span>register</span><span>(</span><span>"MyM1"</span><span>, universal);

</span><span>// 3. L'utiliser dans l'UI</span><span>
</span><span><span class="language-xml"><BaseAlgorithmTesting</span></span><span>
  </span><span>variableLabel</span><span>=</span><span>"M1 — Mon calculateur"</span><span>
  </span><span>defaultClassifier</span><span>=</span><span>"MyM1"</span><span>
  </span><span>target</span><span>=</span><span>"M1"</span><span>
/>

</span><span>// 4. Afficher les résultats</span><span>
</span><span><span class="language-xml"><ResultsPanel</span></span><span>
  </span><span>results</span><span>=</span><span>{testResults}</span><span>
  </span><span>targetKind</span><span>=</span><span>"M1"</span><span>
  </span><span>classifierLabel</span><span>=</span><span>"MyM1 v1.0"</span><span>
/>
</span></span></code></div></div></pre>

→ [Code source complet](03-DEVELOPER-GUIDES/add-new-algorithm.md)

---

## ❓ Questions fréquentes

**Q : Quelle est la différence entre X et Y ?**

→ X = stratégies du conseiller, Y = réactions du client

**Q : M1/M2/M3 c'est quoi ?**

→ Médiateurs : M1 (verbes action), M2 (alignement), M3 (charge cognitive)

**Q : Comment choisir entre classification et calcul ?**

→ Classification = catégories discrètes (X/Y/M2), Calcul = valeurs continues (M1/M3)

**Q : Où sont les algorithmes existants ?**

→ `src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/`

**Q : Comment tester mon algorithme ?**

→ Utilise `BaseAlgorithmTesting` avec `target="M1"` (ou X/Y/M2/M3)

→ [Plus de questions](06-MAINTENANCE/troubleshooting.md)

---

## 📖 Ressources utiles

* **Documentation complète** : [Index](README.md)
* **Architecture** : [Design patterns](01-ARCHITECTURE/design-patterns.md)
* **Types** : [Système de types](01-ARCHITECTURE/type-system.md)
* **API** : [Référence complète](04-API-REFERENCE/README.md)

---

⏱️ **Temps de lecture** : ~5 minutes

🎯 **Prochaine étape recommandée** : [Architecture Overview](01-ARCHITECTURE/README.md)

<style>#mermaid-1759215539682{font-family:sans-serif;font-size:16px;fill:#333;}#mermaid-1759215539682 .error-icon{fill:#552222;}#mermaid-1759215539682 .error-text{fill:#552222;stroke:#552222;}#mermaid-1759215539682 .edge-thickness-normal{stroke-width:2px;}#mermaid-1759215539682 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1759215539682 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1759215539682 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1759215539682 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1759215539682 .marker{fill:#333333;}#mermaid-1759215539682 .marker.cross{stroke:#333333;}#mermaid-1759215539682 svg{font-family:sans-serif;font-size:16px;}#mermaid-1759215539682 .label{font-family:sans-serif;color:#333;}#mermaid-1759215539682 .label text{fill:#333;}#mermaid-1759215539682 .node rect,#mermaid-1759215539682 .node circle,#mermaid-1759215539682 .node ellipse,#mermaid-1759215539682 .node polygon,#mermaid-1759215539682 .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-1759215539682 .node .label{text-align:center;}#mermaid-1759215539682 .node.clickable{cursor:pointer;}#mermaid-1759215539682 .arrowheadPath{fill:#333333;}#mermaid-1759215539682 .edgePath .path{stroke:#333333;stroke-width:1.5px;}#mermaid-1759215539682 .flowchart-link{stroke:#333333;fill:none;}#mermaid-1759215539682 .edgeLabel{background-color:#e8e8e8;text-align:center;}#mermaid-1759215539682 .edgeLabel rect{opacity:0.5;background-color:#e8e8e8;fill:#e8e8e8;}#mermaid-1759215539682 .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-1759215539682 .cluster text{fill:#333;}#mermaid-1759215539682 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:sans-serif;font-size:12px;background:hsl(80,100%,96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1759215539682:root{--mermaid-font-family:sans-serif;}#mermaid-1759215539682:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1759215539682 flowchart{fill:apa;}</style>
