
# ADR-002 : Adaptateur universel

**Status**: Active
**Date**: Janvier 2025
**Décideurs**: Équipe AlgorithmLab

## Contexte

Plusieurs algorithmes cohabitent (regex, spaCy, LLM). Chacun expose ses propres signatures (`classify`, `predict`, etc.), rendant difficile :

- l’orchestration dans les hooks,
- la comparaison des résultats,
- l’intégration UI.

## Décision

Créer un **adaptateur universel** (`UniversalAlgorithm`) pour standardiser :

- `run(input) → { prediction, confidence, metadata }`
- `runBatch(inputs[])`
- `describe() → AlgorithmMetadata`
- `validateConfig()`

Un wrapper est prévu pour les implémentations legacy, mais l’interface universelle est la norme.

## Conséquences

### Positives

- Comparaison multi-algorithmes simplifiée.
- UI et métriques unifiées sur un même contrat.
- Ajout de nouveaux algos facilité.

### Négatives

- Légère surcouche de code (adapters).
- Perte potentielle de certaines spécificités (ex. formats custom).

## Alternatives considérées

- **Laisser chaque algo exposer sa propre API** : complexité élevée pour la maintenance.
- **Convertir tous les algorithmes directement au format universel** : migration lourde, pas progressive.

## Références

- [BaseAlgorithm](../04-API-REFERENCE/algorithms/base-algorithm.md)
- [AlgorithmRegistry](../04-API-REFERENCE/algorithms/algorithm-registry.md)
