# AlgorithmLab - Quick Start

**En 5 minutes, comprendre l'essentiel.**

---

## 🎯 C'est quoi AlgorithmLab ?

**Framework de validation scientifique** pour algorithmes de tagging conversationnel.

### En une phrase
> AlgorithmLab permet de **tester**, **comparer** et **améliorer** des algorithmes qui analysent automatiquement des conversations (stratégies conseiller, réactions client, métriques linguistiques).

---

## 🚀 Cas d'usage principaux

### 1. 🧪 Tester un algorithme (Level 1)
```typescript
// Interface de test automatique
import { BaseAlgorithmTesting } from "./components";

<BaseAlgorithmTesting
  variableLabel="M1 — Densité de verbes d'action"
  defaultClassifier="M1ActionVerbCounter"
  target="M1"
/>
→ Voir Level1Interface

2. 🔧 Créer un nouvel algorithme
typescript// Exemple : Calculateur M1 (verbes d'action)
export class MyM1Calculator extends BaseM1Calculator {
  async run(input: M1Input) {
    const tokens = input.text.split(/\s+/);
    const actionVerbs = tokens.filter(t => this.isActionVerb(t));
    const density = (actionVerbs.length / tokens.length) * 100;
    
    return {
      prediction: density.toFixed(2),
      confidence: 0.8,
      details: {
        value: density,
        actionVerbCount: actionVerbs.length,
        totalTokens: tokens.length,
        verbsFound: actionVerbs,
      },
    };
  }
}
→ Tutorial complet

3. 📊 Afficher des résultats
typescript// Composant de visualisation adaptatif
<ResultsPanel
  results={validationResults}
  targetKind="M1"  // X/Y/M1/M2/M3
  classifierLabel="M1 Counter v1.0"
  initialPageSize={50}
/>
→ API ResultsPanel

🏗️ Architecture en 1 image
mermaidgraph TB
    subgraph "🎯 Variables de la thèse"
        X[X: Stratégies<br/>conseiller]
        Y[Y: Réactions<br/>client]
        M1[M1: Densité<br/>verbes action]
        M2[M2: Alignement<br/>X→Y]
        M3[M3: Charge<br/>cognitive]
    end
    
    subgraph "🔧 Algorithmes"
        A1[Classificateurs<br/>X/Y/M2]
        A2[Calculateurs<br/>M1/M3]
    end
    
    subgraph "📊 Interface UI"
        UI1[ResultsPanel]
        UI2[MetricsPanel]
        UI3[AnnotationList]
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
    
    style X fill:#e3f2fd
    style Y fill:#e8f5e9
    style M1 fill:#fff3e0
    style M2 fill:#f3e5f5
    style M3 fill:#fce4ec
→ Architecture détaillée

📚 Les 5 variables expliquées
VariableTypeExempleUsageXClassificationENGAGEMENT, REFLET_VOUSStratégies du conseillerYClassificationPOSITIF, NEGATIFRéactions du clientM1Numérique22.5 (verbes/100 tokens)Densité verbes d'actionM2ClassificationFORT, FAIBLEAlignement conseiller↔clientM3Numérique750msCharge cognitive (pauses)
→ Détails complets

🎓 Workflow de validation scientifique
mermaidgraph LR
    L0[Level 0<br/>Accord<br/>inter-annotateur] --> L1[Level 1<br/>Performance<br/>algorithmes]
    L1 --> L2[Level 2<br/>Tests<br/>hypothèses]
    
    style L0 fill:#e1f5fe
    style L1 fill:#fff9c4
    style L2 fill:#f1f8e9
Level 0 : Gold Standard

Mesure accord entre experts (Kappa Cohen)
Résolution désaccords
→ En savoir plus

Level 1 : Performance (⭐ Focus actuel)

Tests algorithmes individuels
Comparaison multi-algorithmes
Métriques : Accuracy, F1, MAE, RMSE
→ En savoir plus

Level 2 : Hypothèses scientifiques

H1 : Efficacité communication
H2 : Charge cognitive
H3 : Apprentissage organisationnel
→ En savoir plus


🔍 Prochaines étapes recommandées
👨‍💻 Tu es développeur ?

Architecture → Vue d'ensemble (10 min)
Tutorial → Créer un algorithme M1 (30 min)
API Reference → Types et interfaces

🎓 Tu cherches à comprendre ?

Variables → X/Y/M1/M2/M3 expliquées
Métriques → Accuracy, MAE, Kappa, etc.
ADRs → Décisions d'architecture

🐛 Tu as un problème ?

Troubleshooting → FAQ & Solutions
Migration → Guides de migration


💡 Concepts clés à retenir
🎯 Variables = Cibles d'analyse
Chaque algorithme cible une variable spécifique (X, Y, M1, M2 ou M3).
🔧 Adaptateur universel
Tous les algorithmes passent par createUniversalAlgorithm() pour unifier les interfaces.
📊 Métriques adaptatives

Classification (X/Y/M2) → Accuracy, Precision, Recall, F1, Kappa
Numérique (M1/M3) → MAE, RMSE, R², corrélation

🏷️ Colonnes dynamiques
Le système extraColumns injecte automatiquement les bonnes colonnes selon la variable.

🎬 Exemple complet de bout en bout
typescript// 1. Créer un algorithme M1
class MyM1 extends BaseM1Calculator {
  async run(input: M1Input) { /* ... */ }
}

// 2. L'enregistrer
const universal = createUniversalAlgorithm(new MyM1(), "M1");
algorithmRegistry.register("MyM1", universal);

// 3. L'utiliser dans l'UI
<BaseAlgorithmTesting
  variableLabel="M1 — Mon calculateur"
  defaultClassifier="MyM1"
  target="M1"
/>

// 4. Afficher les résultats
<ResultsPanel
  results={testResults}
  targetKind="M1"
  classifierLabel="MyM1 v1.0"
/>
→ Code source complet

❓ Questions fréquentes
Q : Quelle est la différence entre X et Y ?
→ X = stratégies du conseiller, Y = réactions du client
Q : M1/M2/M3 c'est quoi ?
→ Médiateurs : M1 (verbes action), M2 (alignement), M3 (charge cognitive)
Q : Comment choisir entre classification et calcul ?
→ Classification = catégories discrètes (X/Y/M2), Calcul = valeurs continues (M1/M3)
Q : Où sont les algorithmes existants ?
→ src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/
Q : Comment tester mon algorithme ?
→ Utilise BaseAlgorithmTesting avec target="M1" (ou X/Y/M2/M3)
→ Plus de questions

📖 Ressources utiles

Documentation complète : Index
Architecture : Design patterns
Types : Système de types
API : Référence complète


⏱️ Temps de lecture : ~5 minutes
🎯 Prochaine étape recommandée : Architecture Overview
