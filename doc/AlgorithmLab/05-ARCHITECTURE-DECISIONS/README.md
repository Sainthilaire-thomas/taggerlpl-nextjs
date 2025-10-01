
# Architecture Decision Records (ADRs)

## Liste des décisions

| ID                           | Titre                                         | Status | Date    | Résumé                                                                                                                 |
| ---------------------------- | --------------------------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| [001](001-type-system.md)       | Système de types centralisé                 | Active | 2025-01 | Centraliser toutes les définitions de types dans `types/` pour assurer cohérence et maintenabilité.                 |
| [002](002-universal-adapter.md) | Adaptateur universel                          | Active | 2025-01 | Fournir une interface unifiée (`UniversalAlgorithm`) pour orchestrer tous les algorithmes, quel que soit leur type.   |
| [003](003-metrics-dispatch.md)  | Dispatch métriques classification/numérique | Active | 2025-01 | Séparer les métriques de classification et numériques avec un routeur central pour éviter les confusions.            |
| [004](004-annotation-system.md) | Système d'annotations expertes               | Active | 2025-01 | Standardiser la gestion des annotations humaines, centraliser les métadonnées et calculer l’accord inter-annotateurs. |

## Format ADR

Chaque ADR suit le format :

- **Contexte** : Quelle situation a motivé la décision ?
- **Décision** : Quelle solution avons-nous choisie ?
- **Conséquences** : Quels impacts (positifs/négatifs) ?
- **Alternatives** : Quelles autres options ont été considérées ?
