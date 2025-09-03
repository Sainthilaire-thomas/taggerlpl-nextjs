## Plan de Migration vers la Nouvelle Structure

### Phase 1 : Préparation et Sauvegarde

- **Créer une branche git dédiée** `feature/thesis-structure-migration`
- **Sauvegarder la structure actuelle** en créant un dossier `legacy/` temporaire
- **Documenter l'état actuel** : inventaire complet des composants existants

### Phase 2 : Création de la Nouvelle Arborescence

#### A. Types et Interfaces

```
✅ CONSERVER : SharedTypes.ts, Level0Types.ts, Level1Types.ts, Level2Types.ts
🆕 CRÉER : ThesisVariables.ts, ValidationTypes.ts
📝 ADAPTER : Mettre à jour les types existants pour intégrer X, Y, M1, M2, M3
```

#### B. Restructuration des Algorithmes

```
🔄 RÉORGANISER algorithms/ :
- Déplacer algorithms/level1/conseillerclassifiers/ → algorithms/level1/XAlgorithms/
- Déplacer algorithms/level1/clientclassifiers/ → algorithms/level1/YAlgorithms/
- Créer les nouvelles sections M1Algorithms/, M2Algorithms/, M3Algorithms/
```

#### C. Refactoring des Composants

```
Level0/ :
✅ CONSERVER : InterAnnotatorAgreement.tsx
🆕 CRÉER : GoldStandardCreation/ (nouveau module)
📝 ADAPTER : Ajouter interfaces pour X et Y gold standard

Level1/ :
🔄 RÉORGANISER :
- individual/ → algorithms/XClassifiers/, YClassifiers/, etc.
- comparison/ → garder mais adapter aux nouvelles variables
📝 ADAPTER : Level1Interface.tsx pour navigation par variable

Level2/ :
🔄 RESTRUCTURER :
- Séparer Level2Interface.tsx en H1Testing/ et H2Testing/
- Adapter validation/ pour les nouvelles hypothèses
```

### Phase 3 : Migration Progressive par Niveau

#### Phase 3.1 : Level0 (Gold Standard)

**Objectif** : Transformer Level0 pour créer gold standard X et Y

**Actions** :

- **Étendre InterAnnotatorAgreement.tsx** pour gérer séparément accord sur X et accord sur Y
- **Créer GoldStandardCreation/** avec les nouveaux composants
- **Adapter les hooks** `useLevel0Validation.ts` pour les variables X/Y distinctes

#### Phase 3.2 : Level1 (Tests Algorithmes)

**Objectif** : Réorganiser par variable cible (X, Y, M1, M2, M3)

**Actions prioritaires** :

```
🔄 MIGRER les classificateurs existants :
- RegexConseillerClassifier → XAlgorithms/RegexXClassifier
- RegexClientClassifier → YAlgorithms/RegexYClassifier
- SpacyConseillerClassifier → XAlgorithms/SpacyXClassifier
- OpenAIConseillerClassifier → XAlgorithms/OpenAIXClassifier

🆕 CRÉER les nouveaux calculateurs :
- M1Algorithms/ (verbes d'action) - NOUVEAU
- M2Algorithms/ (alignement) - NOUVEAU
- M3Algorithms/ (charge cognitive) - NOUVEAU

📝 ADAPTER les interfaces de test :
- TechnicalValidation → XAlgorithmTesting, YAlgorithmTesting, etc.
- ConfusionMatrix → spécialisées par variable
- EnhancedErrorAnalysis → adaptée aux différents types d'erreurs
```

#### Phase 3.3 : Level2 (Tests Hypothèses)

**Objectif** : Séparer H1 et H2 avec médiation M1, M2, M3

**Actions** :

- **Séparer Level2Interface.tsx** en deux workflows distincts
- **Créer H1Testing/** pour tests effet direct X → Y
- **Créer H2Testing/** pour tests médiation X → M1,M2,M3 → Y
- **Adapter validation/** aux nouveaux modèles statistiques

### Phase 4 : Mise à Jour des Hooks et Utils

#### Hooks à Créer/Adapter

```
🔄 MIGRER :
- useLevel1Testing.ts → hooks spécialisés par variable
- useLevel0Validation.ts → useGoldStandardCreation.ts

🆕 CRÉER :
- useXAlgorithmTesting.ts, useYAlgorithmTesting.ts
- useM1AlgorithmTesting.ts, useM2AlgorithmTesting.ts, useM3AlgorithmTesting.ts
- useH1Testing.ts, useH2MediationTesting.ts
- useDataSourceManagement.ts (gold vs computed)
```

#### Utils à Réorganiser

```
📝 ADAPTER :
- statisticalTests.ts → pour H1 et médiation H2
- metricsCalculation.ts → métriques spécialisées par variable
- goldStandardManager.ts → gestion X/Y distinctes

🆕 CRÉER :
- algorithmValidation.ts
- mediationAnalysis.ts
- dataVisualization.ts
```

### Phase 5 : Nouvelles Fonctionnalités Clés

#### A. Interfaces de Vérification Spécialisées

```
🆕 XValidationInterface.tsx :
- Afficher verbatim conseiller
- Montrer tag prédit vs gold standard
- Interface similaire à l'actuel mais spécialisée X

🆕 M1ValidationInterface.tsx :
- Afficher verbatim avec surlignage verbes détectés
- Montrer score M1 calculé
- Visualisation concentration verbes d'action

🆕 M2ValidationInterface.tsx :
- Afficher paire adjacente conseiller-client
- Montrer score alignement + détails composants
- Visualisation alignement lexical/prosodique

🆕 M3ValidationInterface.tsx :
- Afficher tour client avec marqueurs charge
- Montrer pauses, hésitations détectées
- Score composite charge cognitive
```

#### B. Sélecteur de Source de Données

```
🆕 DataSourceSelector.tsx :
- Toggle Gold Standard / Computed Data
- Permet tester H1 avec les deux sources
- Gestion cohérence entre niveaux
```

### Phase 6 : Tests et Validation

#### Tests de Régression

- **Vérifier** que toutes les fonctionnalités actuelles marchent encore
- **Tester** la navigation entre les 3 niveaux
- **Valider** l'intégrité des données existantes

#### Tests des Nouvelles Fonctionnalités

- **Tester** les interfaces de vérification spécialisées
- **Valider** les nouveaux hooks par variable
- **Vérifier** la cohérence gold standard vs données calculées

### Phase 7 : Documentation et Formation

#### Documentation Technique

- **Mettre à jour** tous les README
- **Documenter** les nouvelles interfaces de vérification
- **Créer** guide migration pour futurs développeurs

#### Formation Utilisateurs

- **Guide utilisateur** pour la nouvelle navigation
- **Tutoriels** pour les interfaces de vérification spécialisées
- **Best practices** workflow Level0 → Level1 → Level2

---

## Défis Principaux Identifiés

1. **Compatibilité données** : S'assurer que les données actuelles restent utilisables
2. **Performance** : La nouvelle structure ne doit pas ralentir l'interface
3. **Cohérence UX** : Maintenir une expérience utilisateur fluide malgré la complexité accrue
4. **Tests** : Beaucoup de nouveaux composants à tester
5. **Migration progressive** : Permettre coexistence ancien/nouveau pendant transition

## Estimation Temporelle

- **Phase 1-2** : 2-3 jours (préparation)
- **Phase 3** : 1-2 semaines (migration composants)
- **Phase 4** : 3-4 jours (hooks et utils)
- **Phase 5** : 1 semaine (nouvelles fonctionnalités)
- **Phase 6-7** : 3-4 jours (tests et documentation)

**Total estimé : 3-4 semaines** pour migration complète avec tests et validation.
