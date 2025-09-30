# Documentation AlgorithmLab

**Framework de validation scientifique pour algorithmes conversationnels**

## 🚀 Démarrage rapide

→ **[Quick Start (5 min)](00-QUICKSTART.md)** ← Commence ici !

## 📚 Documentation par catégorie

### Pour démarrer
- **[00-QUICKSTART](00-QUICKSTART.md)** - Démarrage en 5 minutes

### Architecture & Design
- **[01-ARCHITECTURE](01-ARCHITECTURE/)** - Vision d'ensemble, patterns, flux de données

### Concepts métier
- **[02-CORE-CONCEPTS](02-CORE-CONCEPTS/)** - Variables X/Y/M1/M2/M3, niveaux de validation

### Guides développeur
- **[03-DEVELOPER-GUIDES](03-DEVELOPER-GUIDES/)** - Tutorials pratiques (créer algo, composant UI, etc.)

### Référence API
- **[04-API-REFERENCE](04-API-REFERENCE/)** - Documentation technique détaillée

### Décisions d'architecture
- **[05-ARCHITECTURE-DECISIONS](05-ARCHITECTURE-DECISIONS/)** - ADRs (Architecture Decision Records)

### Maintenance
- **[06-MAINTENANCE](06-MAINTENANCE/)** - Tests, migrations, troubleshooting

### Documentation générée
- **[07-GENERATED](07-GENERATED/)** - API auto-générée (TypeDoc)

---

## 🔍 Navigation rapide

| Je veux... | Aller vers... |
|-----------|--------------|
| 🎓 Comprendre le projet | [Quick Start](00-QUICKSTART.md) |
| 🔧 Créer un algorithme M1 | [Tutorial](03-DEVELOPER-GUIDES/add-new-algorithm.md) |
| 📊 Utiliser ResultsPanel | [API Reference](04-API-REFERENCE/components/results-panel.md) |
| 🏗️ Comprendre les types | [Type System](01-ARCHITECTURE/type-system.md) |
| 🐛 Résoudre un problème | [Troubleshooting](06-MAINTENANCE/troubleshooting.md) |

---

## 📊 Architecture en bref
```mermaid
graph LR
    A[Algorithmes<br/>X/Y/M1/M2/M3] --> B[Types Core<br/>Unifiés]
    B --> C[Interface UI<br/>ResultsPanel]
    B --> D[Métriques<br/>Classification/Numérique]
    C --> E[Annotations<br/>Expertes]
    D --> F[Fine-tuning<br/>Pipeline]
→ Architecture détaillée

🎯 Prochaines étapes recommandées
Si tu es nouveau

Lire Quick Start (5 min)
Parcourir Architecture Overview (10 min)
Essayer Tutorial : Créer un algorithme M1 (30 min)

Si tu veux créer un algorithme
→ Guide complet
Si tu cherches une API spécifique
→ Index API

📝 Contribuer à la documentation
Ajouter du contenu

Identifier la bonne catégorie (00-07)
Créer/éditer le fichier Markdown
Ajouter les liens dans les README concernés

Standards

Format : Markdown avec support Mermaid
Liens : Relatifs (ex: ../01-ARCHITECTURE/README.md)
Images : Dans assets/ à la racine de chaque section


🔄 Dernière mise à jour
Version : 1.0
Date : Janvier 2025
Statut : ✅ Structure créée, contenu en cours de rédaction
