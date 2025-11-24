# Spécification du Workflow de Contexte IA

## Objectif

Ce document définit une méthode de travail standardisée pour collaborer efficacement avec une IA sur un projet de développement. Le principe est de fournir à l'IA un contexte structuré en deux parties : un **contexte de base** stable du projet et un **contexte de mission** spécifique à chaque session de travail.

---

## Structure des fichiers de contexte

```
/docs/ai-context/
├── base-context.md           # Contexte stable du projet
├── mission-YYYY-MM-DD-xxx.md # Contexte de mission (1 par session)
└── specs/                    # Spécifications des missions
    └── mission-xxx-specs.md
```

---

## 1. Contexte de base du projet

### Description

Fichier `base-context.md` contenant les informations stables du projet, à régénérer uniquement quand l'architecture ou les types fondamentaux changent (environ 1 fois par semaine).

### Contenu attendu

```markdown
# [Nom du projet] - Contexte de base

*Généré le YYYY-MM-DD*

## Vue d'ensemble
- Description courte du projet
- Stack technique (langages, frameworks, BDD)
- Architecture globale

## Types et interfaces principaux
[Code des types fondamentaux du projet]

## Configuration
[tsconfig.json, package.json, config principales]

## Structure des dossiers
[Arborescence des dossiers clés]
```

### Génération

L'IA génère un script PowerShell adapté au projet qui :
- Extrait les types principaux
- Récupère les configurations
- Génère l'arborescence
- Produit un fichier markdown uploadable

---

## 2. Contexte de mission

### Description

Fichier `mission-YYYY-MM-DD-xxx.md` contenant le contexte spécifique à une session de travail. Généré en début de session, mis à jour en fin de session.

### Workflow d'une session

```
┌─────────────────────────────────────────────────────────────┐
│  DÉBUT DE SESSION                                           │
├─────────────────────────────────────────────────────────────┤
│  1. Upload base-context.md                                  │
│  2. Upload specs de la mission (ou description libre)       │
│  3. Demander à l'IA : "Génère le contexte mission"          │
│  4. L'IA produit mission-YYYY-MM-DD-xxx.md                  │
│  5. Sauvegarder ce fichier dans docs/ai-context/            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    SESSION DE TRAVAIL
                   (développement itératif)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FIN DE SESSION                                             │
├─────────────────────────────────────────────────────────────┤
│  1. Demander à l'IA : "Génère le bilan de session"          │
│  2. L'IA met à jour mission-YYYY-MM-DD-xxx.md avec :        │
│     - Travail accompli                                      │
│     - Fichiers modifiés                                     │
│     - Points restants                                       │
│     - Contexte pour la prochaine session                    │
│  3. Sauvegarder le fichier mis à jour                       │
└─────────────────────────────────────────────────────────────┘
```

### Structure du contexte mission (début de session)

```markdown
# 🎯 Mission: [Titre de la mission]

*Session du YYYY-MM-DD*

## Objectif
[Description claire de ce qu'on veut accomplir]

## Specs de référence
[Lien ou contenu des specs fournies]

## Fichiers concernés
[Liste des fichiers à modifier/créer]

## Code actuel
[Extraction du code pertinent pour cette mission]

## Actions planifiées
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

## Critères de succès
[Comment savoir que la mission est accomplie]
```

### Structure du contexte mission (fin de session)

```markdown
# 🎯 Mission: [Titre de la mission]

*Session du YYYY-MM-DD*

## Objectif
[Description claire de ce qu'on voulait accomplir]

## ✅ Travail accompli
- [Ce qui a été fait]
- [Fichiers créés/modifiés]

## 📁 Fichiers modifiés
| Fichier | Action | Description |
|---------|--------|-------------|
| src/... | Modifié | Description |
| src/... | Créé | Description |

## ⏳ Reste à faire
- [ ] Point 1
- [ ] Point 2

## 📝 Notes pour la prochaine session
[Contexte important à retenir]

## 🔗 Continuité
[Lien vers la prochaine mission si applicable]
```

---

## 3. Instructions pour l'IA

### Génération du contexte de base

Quand l'utilisateur demande de générer le contexte de base :

1. **Analyser le projet** : identifier le langage, framework, structure
2. **Proposer un script** PowerShell/Bash adapté qui extrait :
   - Les types/interfaces principaux (*.ts, *.d.ts, types/)
   - Les configurations (tsconfig, package.json, etc.)
   - L'arborescence des dossiers sources
3. **Format de sortie** : markdown avec blocs de code, prêt à upload

### Génération du contexte mission (début)

Quand l'utilisateur uploade les specs d'une mission :

1. **Comprendre l'objectif** à partir des specs fournies
2. **Identifier les fichiers** nécessaires (demander si besoin)
3. **Demander le code** des fichiers concernés si non fourni
4. **Générer le fichier** mission-YYYY-MM-DD-xxx.md avec :
   - Objectif clair
   - Code actuel extrait
   - Actions planifiées
   - Critères de succès

### Génération du bilan (fin de session)

Quand l'utilisateur demande le bilan de session :

1. **Résumer** le travail accompli
2. **Lister** les fichiers modifiés/créés
3. **Identifier** ce qui reste à faire
4. **Documenter** le contexte pour continuité
5. **Mettre à jour** le fichier mission avec ces informations

---

## 4. Commandes types

### Début de projet

```
"Voici mon projet [nom]. Génère-moi le script pour créer base-context.md"
```

### Début de session

```
"Voici base-context.md et mes specs pour [mission]. Génère le contexte mission."
```

### Fin de session

```
"Génère le bilan de cette session pour mettre à jour le fichier mission."
```

### Reprise de session

```
"Voici base-context.md et mission-YYYY-MM-DD-xxx.md. On continue."
```

---

## 5. Bonnes pratiques

### Pour l'utilisateur

- ✅ Mettre à jour base-context.md quand les types fondamentaux changent
- ✅ Nommer les missions de façon descriptive
- ✅ Conserver l'historique des missions pour traçabilité
- ✅ Fournir des specs claires avec objectif et critères de succès

### Pour l'IA

- ✅ Demander les fichiers manquants plutôt que deviner
- ✅ Proposer des scripts adaptés au système (PowerShell/Bash)
- ✅ Structurer les contextes de façon consistante
- ✅ Résumer le travail en fin de session sans qu'on le demande si la session est longue

---

## 6. Exemple concret

### Specs fournies par l'utilisateur

```markdown
# Mission: Correction erreurs TypeScript

## Objectif
Avoir un projet qui compile sans erreurs avec strict: true

## Priorités
1. Erreurs bloquantes
2. Types any à remplacer
3. Null checks manquants
```

### Contexte mission généré par l'IA

```markdown
# 🎯 Mission: Correction erreurs TypeScript

*Session du 2025-01-15*

## Objectif
Corriger toutes les erreurs TypeScript pour compilation propre avec strict: true

## Erreurs actuelles
[Sortie de tsc --noEmit]

## Fichiers les plus impactés
1. src/algorithms/parser.ts (12 erreurs)
2. src/utils/helpers.ts (8 erreurs)
3. src/types/legacy.ts (5 erreurs)

## Code actuel de parser.ts
[Code extrait]

## Actions planifiées
- [ ] Corriger les 12 erreurs de parser.ts
- [ ] Ajouter types stricts dans helpers.ts
- [ ] Migrer legacy.ts vers nouveaux types

## Critères de succès
- `npx tsc --noEmit` retourne 0 erreur
- Aucun type `any` explicite restant
```

---

*Cette spécification est conçue pour être chargée en début de projet afin de définir le workflow de collaboration avec l'IA.*
