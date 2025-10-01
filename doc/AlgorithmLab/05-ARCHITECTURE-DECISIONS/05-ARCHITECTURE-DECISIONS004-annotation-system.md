
# ADR-004 : Système d’annotations expertes

**Status**: Active
**Date**: Janvier 2025
**Décideurs**: Équipe AlgorithmLab

## Contexte

L’évaluation scientifique exige des annotations humaines (gold standard, désambiguïsation).Problèmes rencontrés :

- gestion dispersée des annotations dans différents modules,
- absence de standardisation des métadonnées,
- difficulté à mesurer l’accord inter-annotateurs.

## Décision

Mettre en place un **système centralisé d’annotations** :

- Structure `Annotation` avec verbatim, tag, annotateur, timestamp, metadata.
- Composants UI : `AnnotationList`, `InterAnnotatorAgreement`.
- Support des métadonnées riches (callId, speaker, timestamps).
- Calcul automatique de l’accord inter-annotateurs (Kappa de Cohen).

## Conséquences

### Positives

- Cohérence des annotations dans tout le framework.
- Possibilité d’exporter un corpus gold standard robuste.
- Mesure automatique de la fiabilité des annotations.

### Négatives

- Besoin de formation pour les annotateurs (outil plus riche).
- Dépendance accrue aux conventions du système (formats imposés).

## Alternatives considérées

- **Annotations locales dans chaque module** : trop fragmenté.
- **Externaliser complètement l’annotation** dans un autre outil : perte d’intégration avec AlgorithmLab.

## Références

- [AnnotationList](../04-API-REFERENCE/components/annotation-list.md)
- [Level0/InterAnnotatorAgreement](../04-API-REFERENCE/components/inter-annotator-agreement.md)
