# 🧠 Métriques Cognitives - État d'avancement

## 📋 Vue d'ensemble

Ce module implémente l'analyse des mécanismes cognitifs selon le chapitre 3.3.4 de la thèse, en se concentrant sur l'impact des descriptions d'actions vs explications métaphoriques dans les conversations conflictuelles en centres de contact.

## ✅ Ce qui a été fait

### 1. Architecture & Structure

- **Structure de fichiers simplifiée** mise en place
- **Séparation des responsabilités** : données, types, composants
- **Architecture modulaire** pour faciliter la maintenance

```
src/components/cognitive-metrics/
├── CognitiveMetrics.tsx           # Composant principal (refactorisé)
├── types.ts                       # Types TypeScript
├── indicatorData.ts               # Données centralisées
└── components/
    ├── index.ts                   # Exports
    ├── MetricBox.tsx              # Boîte de métrique réutilisable
    └── IndicatorCard.tsx          # Carte d'indicateur réutilisable
```

### 2. Composants réutilisables créés

#### **MetricBox** 🎯

- Composant atomique pour afficher une métrique individuelle
- Props : `title`, `value`, `subtitle`, `color`, `loading`, `onInfoClick`
- Animations hover et styles adaptatifs (dark/light mode)
- Gestion des états de chargement

#### **IndicatorCard** 📊

- Composant de niveau supérieur regroupant plusieurs MetricBox
- Trois catégories implémentées :
  - **Traitement Automatique** (primary) - neurones miroirs
  - **Charge Cognitive** (warning) - métaphores et effort
  - **Modulation Contextuelle** (success) - stress et contexte

### 3. Système de types robuste

- **TypeScript strict** avec interfaces complètes
- **IndicatorKey** : énumération des indicateurs disponibles
- **CategoryData** : structure des catégories de métriques
- **FilterState** : gestion des filtres d'analyse

### 4. Données scientifiques centralisées

- **9 indicateurs définis** avec descriptions complètes :
  - Formules de calcul
  - Critères d'interprétation
  - Exemples concrets
  - Références bibliographiques
- **Popup informatif** pour chaque indicateur

### 5. Interface utilisateur

- **Filtres dynamiques** : origine, conseiller, stratégie, réaction
- **Thème adaptatif** (dark/light mode)
- **Design cohérent** pour insertion dans la thèse
- **Validation d'hypothèses** avec alertes colorées

## 🔧 Corrections appliquées

1. **Erreur HTML nesting** (h6 dans h2) - ✅ Corrigée
2. **Conflit de props React** (`key`) - ✅ Corrigée
3. **Problème de casse** fichier indicatorData.ts - ⚠️ À vérifier
4. **Structure JSX cassée** - ✅ Corrigée

## 🚧 Ce qui reste à faire

### Phase 1 : Correction finale (Urgent)

- [ ] **Vérifier le nom de fichier** : `IndicatorData.ts` → `indicatorData.ts`
- [ ] **Tester le composant** dans l'environnement de développement
- [ ] **Valider les imports** entre les modules

### Phase 2 : Connexion données réelles

- [ ] **Hook personnalisé** `useCognitiveMetrics()` pour la logique métier
- [ ] **Connexion à la table `turntagged`** pour les données réelles
- [ ] **API endpoints** pour récupérer les métriques calculées
- [ ] **Mise à jour des valeurs** de `"--"` vers les vraies données

### Phase 3 : Calculs des métriques

- [ ] **Implémentation des formules** définies dans `indicatorData.ts`
- [ ] **Score de Fluidité Cognitive** : (0.4×Score_temporel) + (0.35×Score_linguistique) + (0.25×Score_prosodique)
- [ ] **Réactions Directes** : (Réactions_directes / Total_réactions) × 100
- [ ] **Charge Cognitive** : Analyse des métaphores et effort mental
- [ ] **Tests unitaires** pour les calculs

### Phase 4 : Fonctionnalités avancées

- [ ] **Export PDF/PNG** pour insertion dans la thèse
- [ ] **Graphiques dynamiques** (recharts ou d3)
- [ ] **Comparaisons temporelles** et filtres avancés
- [ ] **Mode "présentation"** avec styles adaptés pour la thèse

### Phase 5 : Optimisation

- [ ] **Lazy loading** des composants
- [ ] **Mémoire cache** pour les calculs coûteux
- [ ] **Performance monitoring** des rendus
- [ ] **Documentation technique** complète

## 🎯 Objectifs scientifiques

### Hypothèses à valider

1. **H1: Traitement automatique** - Les stratégies d'action (ENGAGEMENT, OUVERTURE) activent un traitement automatique mesurable
2. **H2: Surcharge cognitive** - Les explications génèrent une charge cognitive mesurable
3. **H3: Modulation contextuelle** - L'efficacité s'accroît en contexte de stress

### Métriques clés à implémenter

- **Fluidité cognitive** (neurones miroirs)
- **Réactions directes** (compréhension immédiate)
- **Reprises lexicales** (alignement linguistique)
- **Marqueurs d'effort** (hésitations, clarifications)
- **Patterns de résistance** (interruptions, objections)

## 🛠️ Notes techniques

### Réduction de code

- **Avant** : ~400 lignes avec duplication
- **Après** : ~80 lignes dans le composant principal + composants réutilisables
- **Gain** : 80% de réduction, maintenabilité accrue

### Bonnes pratiques appliquées

- **DRY** (Don't Repeat Yourself)
- **Single Responsibility Principle**
- **Props explicites** au lieu de spread operator
- **Types stricts** TypeScript
- **Consistent styling** avec Material-UI

### Dépendances

- React 18+
- Material-UI v5
- TypeScript 4.5+
- Recharts (futur)

## 📞 Pour la prochaine session

### Questions à clarifier

1. **Priorité** : Connexion données réelles ou export thèse ?
2. **Format d'export** préféré : PNG, PDF, ou composant React ?
3. **Source des données** : API existante ou calculs côté client ?
4. **Design final** : ajustements visuels pour la thèse ?

### Contexte à reprendre

- **Thèse** : Analyse linguistique des conversations conflictuelles
- **Terrain** : Centres de contact (Sonear)
- **Méthode** : Analyse conversationnelle + linguistique cognitive
- **Résultats** : Descriptions d'actions > Explications métaphoriques

_Dernière mise à jour : [Date actuelle]_
_Session suivante : Connexion données + calculs métriques_
