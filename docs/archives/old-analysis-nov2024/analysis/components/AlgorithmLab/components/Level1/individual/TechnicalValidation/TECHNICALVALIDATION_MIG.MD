## TechnicalValidation Actuel - Détail de l'Implémentation

### Structure Actuelle du TechnicalValidation

```
TechnicalValidation/
├── TechnicalValidation.tsx          # Composant principal orchestrateur
├── RunPanel.tsx                     # Configuration et lancement des tests
├── MetricsPanel.tsx                 # Affichage des métriques de performance
├── ResultsSample/                   # Module de gestion des résultats
│   ├── ResultsPanel.tsx             # Interface principale résultats
│   ├── components/                  # Sous-composants spécialisés
│   │   ├── ResultsTableHeader.tsx   # En-tête avec métriques synthétiques
│   │   ├── ResultsFilters.tsx       # Filtres de recherche
│   │   ├── ResultsTableBody.tsx     # Corps du tableau avec pagination
│   │   └── FineTuningDialog.tsx     # Export pour fine-tuning
│   ├── hooks/                       # Logique métier
│   │   ├── useResultsFiltering.ts   # Filtrage des résultats
│   │   ├── useResultsPagination.ts  # Pagination intelligente
│   │   └── useFineTuningExtractor.ts # Extraction données fine-tuning
│   └── types.ts                     # Types spécifiques au module
└── index.ts                         # Exports centralisés
```

### Fonctionnalités Clés du TechnicalValidation Actuel

#### 1. **TechnicalValidation.tsx** - Orchestrateur Principal

typescript

```typescript
🎯 Responsabilités:
-Gestion de l'état global du test(selectedClassifier, testResults, isRunning)
-Coordination entre ClassifierSelector,RunPanel,MetricsPanel,ResultsPanel
-Interface avec useLevel1Testing pour validation algorithmes
-Gestion des erreurs et feedback utilisateur
- État complexe avec évitement des boucles infinies

🔧 Fonctionnalités techniques :
-Auto-ajustement sampleSize basé sur goldStandardData
-Callback stable runValidation avec dépendances explicites
-Guard clauses pour éviter render avant chargement données
-Support batch testing et configuration dynamique
```

#### 2. **RunPanel.tsx** - Interface de Lancement

typescript

```typescript
🎯 Responsabilités:
-Slider intelligent pour sélection taille échantillon
-Badges de statut(configuration valide, domaine, support batch)
-Validation en temps réel des paramètres
-Bouton de lancement avec feedback visuel

🔧 Caractéristiques:
-Calcul automatique min/max/step basé sur goldStandardCount
-Tooltips informatifs sur les limitations
-Indicateurs visuels de l'état du classificateur
```

#### 3. **MetricsPanel.tsx** - Métriques de Performance

typescript

```typescript
🎯 Métriques affichées :
-Accuracy globale avec progress bar
-Precision/Recall/F1 par catégorie(tableau détaillé)
-Temps de traitement moyen
-Score de confiance moyen
-Kappa de Cohen(accord algorithme-expert)

🔧 Présentation:
-Tuiles métriques synthétiques
-Tableau détaillé par tag
-Codes couleur selon performance(vert >80%, rouge <60%)
-Interprétation automatique des scores
```

#### 4. **ResultsPanel.tsx** - Gestion Avancée des Résultats

typescript

```typescript
🎯 Fonctionnalités principales :
-Switch"Afficher tous les résultats" vs pagination
-Filtrage multi-critères(tags prédits/réels, texte libre)
-Export fine-tuning pour amélioration algorithmes
-Tableau interactif avec tri et recherche

🔧 Optimisations:
-Modepagination(25/50/100 par page) vs affichage total
-Filtrage en temps réel sans re-render complet
-Warningperformance si >100 résultats affichés
-Hooks spécialisés pour filtrage et pagination
```

### Interface de Vérification Actuelle

#### Type de Données Vérifiées

typescript

```typescript
interfaceTVValidationResult{
  verbatim:string;// Texte d'entrée
  goldStandard:string;// Tag gold standard
  predicted:string;// Tag prédit par algorithme
  confidence:number;// Score de confiance [0-1]
  correct:boolean;// Classification correcte ?
  processingTime?:number;// Temps traitement (ms)
  metadata?:Record<string,any>;// Données contextuelles
}
```

#### Interface de Vérification Visuelle

```
📋 Tableau des Résultats :
┌─────────────────┬─────────────────┬─────────────────┬─────────────┬─────────┐
│ Verbatim        │ Gold Standard   │ Prédit          │ Confiance   │ Statut  │
├─────────────────┼─────────────────┼─────────────────┼─────────────┼─────────┤
│ "je vérifie..." │ ENGAGEMENT      │ ENGAGEMENT      │ 0.89        │ ✅ OK   │
│ "notre policy"  │ EXPLICATION     │ ENGAGEMENT      │ 0.45        │ ❌ ERR  │
└─────────────────┴─────────────────┴─────────────────┴─────────────┴─────────┘

🔍 Filtres disponibles :
- Par tag gold standard (ENGAGEMENT, EXPLICATION, etc.)
- Par tag prédit
- Erreurs uniquement (disagreements)
- Recherche textuelle libre dans verbatim
```

---

## Adaptation Nécessaire pour la Nouvelle Structure

### Problème : Interface Générique Non Adaptée aux Variables

Le TechnicalValidation actuel traite **uniformément** tous les classificateurs avec la même interface :

- Verbatim → Tag prédit vs Gold Standard
- Métriques identiques pour tous (Accuracy, F1, etc.)
- Même format de résultats

**Mais selon la nouvelle structure, chaque variable nécessite une interface différente :**

### Variables X et Y (Classifications)

```
✅ COMPATIBLE avec TechnicalValidation actuel
- Interface : Verbatim → Tag vs Gold Standard
- Métriques : Accuracy, F1, Matrice confusion
- Vérification : Tableau verbatim + tags
```

### Variable M1 (Verbes d'Action)

```
❌ NÉCESSITE NOUVELLE INTERFACE
- Interface : Verbatim → Score M1 + visualisation verbes
- Métriques : Densité moyenne, distribution, corrélation avec gold
- Vérification : Verbatim avec surlignage verbes détectés

🆕 M1ValidationInterface.tsx nécessaire :
┌─────────────────────────────────────────┬─────────────┬─────────────────┐
│ Verbatim avec verbes surlignés          │ Score M1    │ Verbes détectés │
├─────────────────────────────────────────┼─────────────┼─────────────────┤
│ "je [vérifie] votre [dossier]"          │ 0.33 (2/6)  │ vérifie, ?      │
│ "notre politique [prévoit] que..."      │ 0.11 (1/9)  │ prévoit         │
└─────────────────────────────────────────┴─────────────┴─────────────────┘
```

### Variable M2 (Alignement)

```
❌ NÉCESSITE NOUVELLE INTERFACE
- Interface : Paire adjacente → Score alignement + détails
- Métriques : Alignement lexical, sémantique, prosodique
- Vérification : Deux verbatims + indicateurs alignement

🆕 M2ValidationInterface.tsx nécessaire :
┌─────────────────────────────────────────────────────────────────┬─────────────┐
│ Paire Conseiller → Client                                       │ Scores M2   │
├─────────────────────────────────────────────────────────────────┼─────────────┤
│ [C] "je vérifie votre dossier"                                  │ Lexical: 0.6│
│ [Client] "d'accord pour la vérification"                        │ Sémant.: 0.8│
│ 🔗 Mots partagés: vérifie/vérification                         │ Global: 0.7 │
└─────────────────────────────────────────────────────────────────┴─────────────┘
```

### Variable M3 (Charge Cognitive)

```
❌ NÉCESSITE NOUVELLE INTERFACE
- Interface : Tour client → Indicateurs charge + score
- Métriques : Nb pauses, hésitations, instabilité prosodique
- Vérification : Verbatim client avec marqueurs détectés

🆕 M3ValidationInterface.tsx nécessaire :
┌─────────────────────────────────────────────────────────────────┬─────────────┐
│ Verbatim Client avec marqueurs                                  │ Score M3    │
├─────────────────────────────────────────────────────────────────┼─────────────┤
│ "euh... [PAUSE 800ms] je ne... [HÉS] comprends pas bien"        │ 0.75 (élevé)│
│ ⏸️ 1 pause >500ms  🤔 2 hésitations  📈 prosodie instable       │ Marqueurs: 3│
└─────────────────────────────────────────────────────────────────┴─────────────┘
```

---

## Plan de Migration Détaillé pour TechnicalValidation

### Phase 1 : Extraction et Généralisation

```
🔄 EXTRAIRE les composants réutilisables :
- RunPanel.tsx → peut être généralisé
- Hooks (useResultsFiltering, useResultsPagination) → réutilisables
- Types de base → adapter par variable

🆕 CRÉER BaseAlgorithmTesting.tsx :
- Interface commune (RunPanel + état global)
- Props génériques pour customisation
- Système de plugins pour métriques spécifiques
```

### Phase 2 : Spécialisation par Variable

```
🆕 XAlgorithmTesting.tsx (hérite de BaseAlgorithmTesting) :
- Interface : TechnicalValidation actuel adapté
- Métriques : Accuracy, F1, Matrice confusion
- ResultsPanel : tableau verbatim → tag

🆕 YAlgorithmTesting.tsx (hérite de BaseAlgorithmTesting) :
- Interface : similaire à X mais pour réactions client
- Métriques : idem X mais adapted next_turn_verbatim
- ResultsPanel : tableau next_turn → réaction

🆕 M1AlgorithmTesting.tsx (NOUVEAU) :
- Interface : spécialisée verbes d'action
- Métriques : densité, corrélation, distribution
- ResultsPanel : verbatim avec surlignage verbes

🆕 M2AlgorithmTesting.tsx (NOUVEAU) :
- Interface : spécialisée alignement
- Métriques : scores lexical/sémantique/prosodique
- ResultsPanel : paires avec indicateurs alignement

🆕 M3AlgorithmTesting.tsx (NOUVEAU) :
- Interface : spécialisée charge cognitive
- Métriques : pauses, hésitations, instabilité
- ResultsPanel : tours client avec marqueurs charge
```

### Phase 3 : Mise à Jour Level1Interface

```
📝 ADAPTER Level1Interface.tsx :
- Navigation par variable (X, Y, M1, M2, M3)
- Tabs spécialisés pour chaque interface
- Gestion état global par variable
- Cohérence UX entre interfaces
```

### Code d'Exemple - BaseAlgorithmTesting

typescript

```typescript
// Composant abstrait réutilisable
interfaceBaseAlgorithmTestingProps<T>{
  variableType:'X'|'Y'|'M1'|'M2'|'M3';
  algorithmsRegistry:AlgorithmRegistry<T>;
goldStandardExtractor:(data:any)=>T[];
metricsCalculator:(results:ValidationResult<T>[])=>Metrics;
  resultsRenderer:React.ComponentType<{results:ValidationResult<T>[]}>;
}

exportfunctionBaseAlgorithmTesting<T>({
  variableType,
  algorithmsRegistry,
  goldStandardExtractor,
  metricsCalculator,
  resultsRenderer:ResultsRenderer
}:BaseAlgorithmTestingProps<T>){
// Logique commune (état, hooks, validation)
// Rendu avec composants customisés

return(
<Box>
<RunPanel{...runPanelProps}/>
<MetricsPanel calculator={metricsCalculator}/>
<ResultsRenderer results={testResults}/>
</Box>
);
}
```

### Avantages de cette Approche

1. **Réutilisation maximale** : RunPanel, hooks, logique commune
2. **Spécialisation claire** : Interface adaptée à chaque variable
3. **Maintenance facilitée** : Un bug fixé dans Base profite à tous
4. **Extensibilité** : Facile d'ajouter nouvelles variables
5. **Cohérence UX** : Structure similaire mais contenu adapté

Cette migration préserve les acquis du TechnicalValidation actuel tout en l'adaptant aux besoins spécifiques de chaque variable de la thèse.
