
# Developer Guides

## 🎯 Objectif

Cette section fournit des **tutoriels pratiques** pour étendre AlgorithmLab :

- Créer de nouveaux algorithmes
- Ajouter des composants UI spécifiques
- Étendre les métriques d’évaluation
- Intégrer des LLM (GPT, Claude)
- Mettre en place un pipeline de fine-tuning

---

## 📚 Tutoriels disponibles

1. **[Ajouter un nouvel algorithme](add-new-algorithm.md)**→ Implémenter une classe conforme à `UniversalAlgorithm`, l’enregistrer et la tester.
2. **[Créer un composant UI](create-ui-component.md)**→ Étendre `ResultsPanel`, ajouter des colonnes et métriques personnalisées, intégrer des visualisations.
3. **[Étendre les métriques](extend-metrics.md)**→ Ajouter Macro/Weighted F1, MAPE, intervalles de confiance, métriques métier.
4. **[Intégrer un LLM](integrate-llm.md)**→ Créer un classificateur LLM sécurisé, gérer prompts et coûts, utiliser API Next.js.
5. **[Pipeline de fine-tuning](fine-tuning-pipeline.md)**
   → Extraire les erreurs, générer JSONL, analyser patterns, lancer fine-tuning OpenAI/Anthropic.

---

## 🏗️ Workflow développeur

```mermaid
graph LR
    A[Nouvel algorithme] --> B[Enregistrement AlgorithmRegistry]
    B --> C[UI Component - ResultsPanel / MetricsPanel]
    C --> D[Nouvelles métriques]
    D --> E[Intégration LLM]
    E --> F[Fine-tuning pipeline]

    style A fill:#e3f2fd
    style B fill:#fff9c4
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#c5cae9
    style F fill:#a5d6a7
```


<style>#mermaid-1759316906623{font-family:sans-serif;font-size:16px;fill:#333;}#mermaid-1759316906623 .error-icon{fill:#552222;}#mermaid-1759316906623 .error-text{fill:#552222;stroke:#552222;}#mermaid-1759316906623 .edge-thickness-normal{stroke-width:2px;}#mermaid-1759316906623 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1759316906623 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1759316906623 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1759316906623 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1759316906623 .marker{fill:#333333;}#mermaid-1759316906623 .marker.cross{stroke:#333333;}#mermaid-1759316906623 svg{font-family:sans-serif;font-size:16px;}#mermaid-1759316906623 .label{font-family:sans-serif;color:#333;}#mermaid-1759316906623 .label text{fill:#333;}#mermaid-1759316906623 .node rect,#mermaid-1759316906623 .node circle,#mermaid-1759316906623 .node ellipse,#mermaid-1759316906623 .node polygon,#mermaid-1759316906623 .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-1759316906623 .node .label{text-align:center;}#mermaid-1759316906623 .node.clickable{cursor:pointer;}#mermaid-1759316906623 .arrowheadPath{fill:#333333;}#mermaid-1759316906623 .edgePath .path{stroke:#333333;stroke-width:1.5px;}#mermaid-1759316906623 .flowchart-link{stroke:#333333;fill:none;}#mermaid-1759316906623 .edgeLabel{background-color:#e8e8e8;text-align:center;}#mermaid-1759316906623 .edgeLabel rect{opacity:0.5;background-color:#e8e8e8;fill:#e8e8e8;}#mermaid-1759316906623 .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-1759316906623 .cluster text{fill:#333;}#mermaid-1759316906623 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:sans-serif;font-size:12px;background:hsl(80,100%,96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1759316906623:root{--mermaid-font-family:sans-serif;}#mermaid-1759316906623:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1759316906623 flowchart{fill:apa;}</style>
