
# ADR-003 : Dispatch métriques classification/numérique

**Status**: Active
**Date**: Janvier 2025
**Décideurs**: Équipe AlgorithmLab

## Contexte

Deux familles de métriques coexistent :

- **Classification** (accuracy, précision, rappel, F1, Kappa),
- **Numérique** (MAE, RMSE, MAPE).

Auparavant, un seul module métriques traitait tous les cas, ce qui générait :

- du code conditionnel lourd,
- des erreurs de calcul en cas de mauvais dispatch.

## Décision

Introduire un **système de dispatch explicite** :

- `metrics/classification` pour tout résultat catégoriel,
- `metrics/numeric` pour tout résultat quantitatif,
- `metrics/dispatch.ts` : routeur central selon `AlgorithmMetadata.type`.

## Conséquences

### Positives

- Séparation claire des responsabilités.
- Moins de code conditionnel.
- Évolutivité (ajout de nouvelles familles).

### Négatives

- Duplication de certaines fonctions utilitaires (ex. calcul de moyennes).
- Apprentissage nécessaire pour connaître les bons points d’entrée.

## Alternatives considérées

- **Un seul module métriques générique** : trop complexe à maintenir.
- **Spécialisation par algo** (chaque algo calcule ses propres métriques) : perte de cohérence globale.

## Références

- [04-API-REFERENCE/utils](../04-API-REFERENCE/utils/)
- [MetricsPanel](../04-API-REFERENCE/components/metrics-panel.md)
