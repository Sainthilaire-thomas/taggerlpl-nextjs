# Algorithm Lab - Phase 1 MVP

## Vue d'ensemble

L'onglet Algorithm Lab est un environnement de test et d'optimisation pour les algorithmes d'analyse conversationnelle de TaggerLPL. Cette Phase 1 établit la structure de base et les fonctionnalités essentielles.

## Structure des fichiers

```
AlgorithmLabTab/
├── AlgorithmLabTab.tsx          # Composant principal
├── types.ts                     # Types TypeScript complets
├── hooks/
│   └── useAlgorithmTesting.ts   # Hook principal Phase 1
├── index.ts                     # Exports centralisés
└── README.md                    # Cette documentation
```

## Fonctionnalités Phase 1

### ✅ Implémenté (Sprint 1.1)

- **Interface navigable** : 3 zones (Configuration, Résultats, Tests)
- **Sélection d'algorithme** : Basic vs LI-CA
- **Navigation par onglets** : Intégration dans TabContainer
- **État de base** : Gestion de la configuration
- **Design adaptatif** : Support thème dark/light

### 🚧 Simulation Phase 1

- **Métriques simulées** : Accuracy, nombre de tests
- **Configuration basique** : Paramètres par défaut
- **Interface responsive** : Layout en grille adaptatif

## Utilisation

### Import et intégration

```typescript
// Import dans TabContainer.tsx
import AlgorithmLabTab from "../AlgorithmLabTab/AlgorithmLabTab";

// Utilisation
<AlgorithmLabTab
  selectedOrigin={selectedOrigin}
  showDetailedResults={showDetailedResults}
/>;
```

### Hook principal

```typescript
import { useAlgorithmTesting } from "./hooks/useAlgorithmTesting";

const {
  currentConfig,
  isRunningTest,
  lastValidationResult,
  updateConfig,
  runTest,
  resetConfig,
} = useAlgorithmTesting({
  selectedOrigin: "PARTICULIER",
});
```

## Configuration par défaut

```typescript
const DEFAULT_CONFIG = {
  name: "lica",
  parameters: {
    thresholds: {
      minimumVerbatimLength: 8,
      collaborationThreshold: 0.6,
      coherenceThreshold: 0.5,
      strategicEffectivenessThreshold: 0.7,
    },
    weights: {
      strategicEffectiveness: 0.7,
      turnCoherence: 0.3,
      sequentialAlignment: 0.0,
    },
  },
};
```

## Types principaux

```typescript
// Configuration d'algorithme
interface AlgorithmConfig {
  name: AlgorithmType;
  parameters: AlgorithmParameters;
  metadata: AlgorithmMetadata;
}

// Résultat de validation
interface ValidationResult {
  testId: string;
  algorithm: AlgorithmType;
  sampleSize: number;
  metrics: PerformanceMetrics;
  confusionMatrix: ConfusionMatrix;
  errorAnalysis: ErrorAnalysis;
}

// Cas de classification
interface ClassificationCase {
  id: string;
  conseillerVerbatim: string;
  clientVerbatim: string;
  manualTag: string;
  predictedTag: string;
  confidence: number;
  callId: string;
}
```

## Persistance (Phase 1)

### localStorage

- `algorithmLab_testHistory` : Historique des tests
- `algorithmLab_savedConfigs` : Configurations sauvegardées
- `algorithmLab_userPreferences` : Préférences utilisateur

### Cache mémoire

- Configuration courante
- Échantillon actuel
- Résultats de validation

## Prochaines étapes

### Sprint 1.2 - Configuration basique (4 jours)

- [ ] Composant `ParameterSliders`
- [ ] Contrôles de seuils avec sliders
- [ ] Sauvegarde/restauration localStorage
- [ ] Interface de réinitialisation
- [ ] Connexion avec algorithmes existants

### Sprint 1.3 - Test simple (3 jours)

- [ ] Échantillonnage aléatoire turntagged
- [ ] Comparaison auto vs manuel
- [ ] Calcul accuracy réelle
- [ ] Navigation dans échantillon
- [ ] Interface de validation

## Contraintes techniques

### Performance

- Maximum 1000 cas pour tests temps réel
- Cache intelligent avec TTL 30 minutes
- Debouncing 500ms sur changements paramètres

### Validation

- Taille échantillon : 10-1000 cas
- Longueur verbatim : 3-1000 caractères
- Sauvegarde automatique toutes les 5 minutes

### Erreurs gérées

- `INVALID_CONFIG` : Configuration invalide
- `TEST_FAILED` : Échec de test
- `SAMPLE_TOO_SMALL` : Échantillon insuffisant
- `STORAGE_ERROR` : Erreur de persistance

## Dépendances

### Externes

- Material-UI (composants, thème)
- React (hooks, état)
- TypeScript (typage fort)

### Internes

- `TaggingDataContext` : Accès aux données turntagged
- `ConversationalPatternAlgorithm` : Algorithme LI-CA
- `BasicAlignmentAlgorithm` : Algorithme basique

## Tests et validation

### Tests unitaires (Phase 5)

```bash
# À implémenter
npm test hooks/useAlgorithmTesting
npm test AlgorithmLabTab
```

### Tests d'intégration

- Connexion avec algorithmes existants
- Persistance localStorage
- Navigation entre onglets

## Métriques de succès Phase 1

- [ ] Interface navigable et responsive
- [ ] Sélection d'algorithme fonctionnelle
- [ ] Configuration persistante
- [ ] Intégration TabContainer réussie
- [ ] Pas de régressions existantes

## Notes de développement

### Choix d'architecture

**Hooks personnalisés** : Séparation logique métier / interface utilisateur
**Types centralisés** : Évolutivité et cohérence
**Cache local** : Performance et expérience utilisateur
**Simulation Phase 1** : Validation concept avant développement complet

### Points d'attention

- **Évolutivité** : Structure prête pour fonctionnalités avancées
- **Performance** : Gestion du cache et des calculs lourds
- **UX** : Interface progressive, pas d'overload cognitif
- **Maintien** : Compatibilité avec code existant

## Support et contribution

### Issues connues Phase 1

- Métriques simulées (résolution Sprint 1.3)
- Pas de connexion algorithmes réels (résolution Sprint 1.2)
- Interface basique (amélioration progressive)

### Roadmap

- **Phase 2** : Fonctionnalités principales (Semaine 3-4)
- **Phase 3** : Intelligence et optimisation (Semaine 5-6)
- **Phase 4** : Fonctionnalités avancées (Semaine 7-8)
- **Phase 5** : Production et maintenance (Semaine 9-10)

---

**Version** : 1.0.0 Phase 1 MVP

**Dernière mise à jour** : Août 2025

**Statut** : Sprint 1.1 Complété ✅
