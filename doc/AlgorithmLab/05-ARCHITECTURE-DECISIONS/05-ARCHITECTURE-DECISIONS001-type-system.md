
# ADR-001 : Système de types centralisé

**Status**: Active
**Date**: Janvier 2025
**Décideurs**: Équipe AlgorithmLab

## Contexte

Initialement, les types étaient dispersés dans différents modules (composants, hooks, algorithmes).Cela engendrait :

- des duplications de définitions,
- des incohérences entre modules,
- une difficulté à documenter et maintenir les signatures.

## Décision

Mettre en place un **système de types centralisé** dans le répertoire `types/`, découpé par domaine fonctionnel :

- `types/core` → structures fondamentales (metrics, gold standard, erreurs),
- `types/algorithms` → contrats algorithmes (BaseAlgorithm, résultats, metadata),
- `types/ui` → props pour composants UI.

## Conséquences

### Positives

- Source unique de vérité pour les définitions.
- Cohérence garantie entre algorithmes, hooks et composants UI.
- Documentation TypeDoc facilitée.

### Négatives

- Migration initiale coûteuse (refactor des imports).
- Risque de dépendances circulaires si l’organisation est mal respectée.

## Alternatives considérées

- **Définir les types localement par module** : trop fragmenté et sujet à incohérences.
- **Génération automatique complète à partir du code** : peu lisible et pas aligné avec les concepts métier.

## Références

- [04-API-REFERENCE/types](../04-API-REFERENCE/types/)
- [01-ARCHITECTURE/type-system.md](../01-ARCHITECTURE/type-system.md)
