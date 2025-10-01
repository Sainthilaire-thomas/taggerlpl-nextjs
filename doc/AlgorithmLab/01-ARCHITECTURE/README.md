
# 📄 `README.md`

<pre class="overflow-visible!" data-start="216" data-end="3000"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Architecture AlgorithmLab</span><span>

</span><span>## 🎯 Objectif</span><span>
Cette section décrit l’</span><span>**architecture interne d’AlgorithmLab**</span><span>, le framework de validation scientifique.  
Elle explique comment sont organisés les algorithmes, les composants UI et le système de types, ainsi que les choix de conception (design patterns, flux de données).

---

</span><span>## 📚 Contenu</span><span>

</span><span>### Vision globale</span><span>
</span><span>-</span><span></span><span>**[Architecture Overview</span><span>](</span><span>../README.md</span><span>)** – Vue d’ensemble du projet
</span><span>-</span><span></span><span>**[Data Flow</span><span>](</span><span>data-flow.md</span><span>)** – Flux de données de bout en bout
</span><span>-</span><span></span><span>**[Design Patterns</span><span>](</span><span>design-patterns.md</span><span>)** – Patterns utilisés (Strategy, Adapter, Factory, Observer)
</span><span>-</span><span></span><span>**[Type System</span><span>](</span><span>type-system.md</span><span>)** – Hiérarchie des types (core, algorithms, UI, utils)

</span><span>### Branches d’implémentation</span><span>
</span><span>-</span><span></span><span>**[Branche Algorithmes</span><span>](</span><span>branche-algorithms.md</span><span>)** – Organisation des calculateurs/classificateurs X/Y/M1/M2/M3
</span><span>-</span><span></span><span>**[Branche Components Level 0</span><span>](</span><span>branche-components-level0.md</span><span>)** – Validation inter-annotateurs (Gold Standard)
</span><span>-</span><span></span><span>**[Branche Components Level 1</span><span>](</span><span>branche-components-level1.md</span><span>)** – Validation technique (tests et comparaisons d’algorithmes)
</span><span>-</span><span></span><span>**[Branche Components Level 2 Shared</span><span>](</span><span>branche-components-level2-shared.md</span><span>)** – Validation scientifique (tests d’hypothèses)

---

</span><span>## 🏗️ Vue d’ensemble de l’architecture</span><span>

```mermaid
graph TB
    subgraph "📥 INPUT"
        DATA[Données conversationnelles<br/>Tours de parole]
    end
  
    subgraph "🧪 ALGORITHMES"
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
</span></span></code></div></div></pre>

---

## ✅ Points clés

* **Séparation stricte** : Core / Algorithms / UI / Utils.
* **Adaptateur universel** : tous les algorithmes passent par `createUniversalAlgorithm`.
* **Résultats dynamiques** : colonnes & métriques adaptées à la variable (X/Y/M1/M2/M3).
* **Types centralisés** : source de vérité unique dans `types/`.
* **Extensibilité** : ajouter un nouvel algorithme n’impacte pas le reste du framework.

---

→ Prochaine étape : [02-CORE-CONCEPTS]()

<style>#mermaid-1759313139993{font-family:sans-serif;font-size:16px;fill:#333;}#mermaid-1759313139993 .error-icon{fill:#552222;}#mermaid-1759313139993 .error-text{fill:#552222;stroke:#552222;}#mermaid-1759313139993 .edge-thickness-normal{stroke-width:2px;}#mermaid-1759313139993 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1759313139993 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1759313139993 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1759313139993 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1759313139993 .marker{fill:#333333;}#mermaid-1759313139993 .marker.cross{stroke:#333333;}#mermaid-1759313139993 svg{font-family:sans-serif;font-size:16px;}#mermaid-1759313139993 .label{font-family:sans-serif;color:#333;}#mermaid-1759313139993 .label text{fill:#333;}#mermaid-1759313139993 .node rect,#mermaid-1759313139993 .node circle,#mermaid-1759313139993 .node ellipse,#mermaid-1759313139993 .node polygon,#mermaid-1759313139993 .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-1759313139993 .node .label{text-align:center;}#mermaid-1759313139993 .node.clickable{cursor:pointer;}#mermaid-1759313139993 .arrowheadPath{fill:#333333;}#mermaid-1759313139993 .edgePath .path{stroke:#333333;stroke-width:1.5px;}#mermaid-1759313139993 .flowchart-link{stroke:#333333;fill:none;}#mermaid-1759313139993 .edgeLabel{background-color:#e8e8e8;text-align:center;}#mermaid-1759313139993 .edgeLabel rect{opacity:0.5;background-color:#e8e8e8;fill:#e8e8e8;}#mermaid-1759313139993 .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-1759313139993 .cluster text{fill:#333;}#mermaid-1759313139993 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:sans-serif;font-size:12px;background:hsl(80,100%,96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1759313139993:root{--mermaid-font-family:sans-serif;}#mermaid-1759313139993:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1759313139993 flowchart{fill:apa;}</style>
