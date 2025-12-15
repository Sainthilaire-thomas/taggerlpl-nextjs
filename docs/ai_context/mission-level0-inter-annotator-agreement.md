# 🎯 Mission: Level 0 - Accord Inter-Annotateurs et Gestion des Chartes

*Date de création : 14 décembre 2025*  
*Statut : 🟢 EN COURS*  
*Priorité : HAUTE (prérequis pour tuning M2)*

---

## 📤 Documents à uploader pour les sessions

| Document | Obligatoire | Contenu |
|----------|-------------|---------|
| `base-context.md` | ✅ Oui | Architecture globale, types, flux de données |
| `base-context-versioning-complement.md` | ✅ Oui | Système versioning, tables, workflows |
| `mission-level0-inter-annotator-agreement.md` | ✅ Oui | Ce document |

---

## 📋 Contexte et objectif

### Pourquoi cette mission ?

La session du 14 décembre a révélé :

1. **Kappa très élevé** pour X (0.997) et Y (0.998) → annotations manuelles reproductibles
2. **Besoin de formaliser les chartes** d'annotation pour la thèse (section 4.3.4)
3. **Possibilité de faire varier Y** pour tester la robustesse de H1 et H2
4. **Framework multi-chartes** nécessaire avant tuning M2

### Objectif de la mission

Implémenter un système permettant :
- De définir plusieurs **chartes d'annotation** pour X et Y
- De calculer le **Kappa de Cohen** entre algorithmes et Gold standard
- De **sélectionner la référence Y** lors des tests Level 1 (M2)
- De **documenter l'impact** des variations de chartes sur H1

---

## 🎯 Architecture : Charte intégrée à l'Algorithme

### Principe de base

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE SIMPLIFIÉE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Principe : 1 Charte = 1 Famille d'algorithmes                      │
│             1 Version = 1 Tuning de la charte                       │
│                                                                     │
│  Stockage : algorithm_version_registry                              │
│  ├── x_key / y_key : Nom de la charte (ex: "CharteY_B")            │
│  ├── x_version / y_version : Version du tuning (ex: "1.0.0")       │
│  ├── x_config / y_config : Patterns et règles (JSONB)              │
│  ├── level1_metrics.kappa : Accord vs Gold                         │
│  └── is_baseline : true pour la référence de comparaison           │
│                                                                     │
│  Versioning sémantique :                                            │
│  • MAJOR (1.x.x → 2.x.x) : Changement conceptuel de charte         │
│  • MINOR (x.1.x → x.2.x) : Tuning patterns/seuils                  │
│  • PATCH (x.x.1 → x.x.2) : Bugfix                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Nomenclature des algorithmes

| algorithm_key | Type | Description |
|---------------|------|-------------|
| **GoldX** | Référence | Lecture directe de strategy_tag (annotation manuelle) |
| **GoldY** | Référence | Lecture directe de reaction_tag (annotation manuelle) |
| **CharteX_A** | Algo | Sans contexte (classification isolée par tour) |
| **CharteX_B** | Algo | Avec héritage contextuel (tours courts) |
| **CharteY_B** | Algo | d'accord/oui/voilà = POSITIF, hm/mh = NEUTRE |
| **CharteY_C** | Algo | Binaire (POSITIF vs NON-POSITIF) |

---

## 📊 Résultats de validation (14 décembre 2025)

### Kappa Cohen : Algorithmes vs Gold

| Variable | Algo testé | Po (accord) | Pe (hasard) | **Kappa** | Désaccords |
|----------|------------|-------------|-------------|-----------|------------|
| **Y** | CharteY_B v1.0.0 | 99.89% | 43.09% | **0.998** | 1/901 |
| **X** | CharteX_A v1.0.0 | 99.78% | 30.05% | **0.997** | 2/901 |

**Interprétation** (échelle Landis & Koch) : Accord quasi-parfait (>0.81)

### Cas de désaccord identifiés

**Y (1 désaccord)** :
- `"[AP] hm"` → Gold: POSITIF, Algo: NEUTRE (back-channel)

**X (2 désaccords)** :
- Tours courts type `"[TC] voilà"` tagués EXPLICATION (continuation) → Algo: REFLET_ACQ

### Impact sur H1

Testé avec CharteY_B :
- **Actions** génèrent **34% positif** vs **0.5%** pour explications (ratio 68x)
- H1 reste **robuste** quelle que soit la variation mineure de la charte Y

---

## 📋 Chartes définies

### CharteY_B (recommandée - κ=0.998)

```json
{
  "charte_name": "Charte B - Accord client élargi",
  "charte_description": "d'accord/oui/voilà = POSITIF, seuls hm/mh = NEUTRE",
  "patterns": {
    "POSITIF": [
      "d'accord", "oui", "ouais", "ok", "voilà",
      "merci", "parfait", "très bien", "super", "excellent",
      "ça marche", "entendu", "bien sûr", "tout à fait"
    ],
    "NEUTRE": ["hm", "mh", "mmh"],
    "NEGATIF": [
      "mais", "non", "pas d'accord", "impossible",
      "pas normal", "inadmissible", "scandaleux",
      "j'hallucine", "vous rigolez", "c'est une blague"
    ]
  },
  "rules": {
    "priority": "first_match",
    "default": "NEUTRE",
    "min_confidence": 0.8
  }
}
```

### CharteX_A (sans contexte - κ=0.997)

```json
{
  "charte_name": "Charte A - Classification isolée",
  "charte_description": "Chaque tour classifié indépendamment, sans héritage",
  "patterns": {
    "REFLET_ACQ": {
      "pattern": "^\\s*(oui|ouais|hm|mh|d'accord|ok|voilà|ben oui|hein)\\s*\\??\\s*$",
      "max_length": 15
    },
    "ENGAGEMENT": {
      "patterns": ["je vais", "je m'en occupe", "je fais le nécessaire", "je vérifie"]
    }
  },
  "rules": {
    "priority_order": ["ENGAGEMENT", "OUVERTURE", "EXPLICATION", "REFLET"],
    "context_inheritance": false
  }
}
```

### CharteX_B (avec contexte)

```json
{
  "charte_name": "Charte B - Avec héritage contextuel",
  "charte_description": "Tours courts (<25 chars) héritent du tag précédent si EXPLICATION",
  "rules": {
    "context_inheritance": true,
    "inheritance_threshold": 25,
    "inherit_from": "prev2_tag",
    "inherit_if_prev": ["EXPLICATION"]
  }
}
```

---

## 🔄 Plan d'implémentation

### Phase 1 : Enregistrement des chartes (priorité haute)

| # | Tâche | Statut |
|---|-------|--------|
| 1A | Insérer GoldX, GoldY dans algorithm_version_registry | 🔴 À faire |
| 1B | Insérer CharteY_B v1.0.0 avec config JSONB | 🔴 À faire |
| 1C | Insérer CharteX_A v1.0.0 avec config JSONB | 🔴 À faire |
| 1D | Définir baseline pour Y (CharteY_B) et X (GoldX) | 🔴 À faire |

### Phase 2 : Algorithmes TypeScript

| # | Tâche | Statut |
|---|-------|--------|
| 2A | Créer `GoldYClassifier.ts` (lecture reaction_tag) | 🔴 À faire |
| 2B | Créer `CharteYBClassifier.ts` (patterns) | 🔴 À faire |
| 2C | Créer `GoldXClassifier.ts` (lecture strategy_tag) | 🔴 À faire |
| 2D | Créer `CharteXAClassifier.ts` (sans contexte) | 🔴 À faire |
| 2E | Enregistrer dans AlgorithmRegistry | 🔴 À faire |

### Phase 3 : UI Level 0 - Accord Inter-Annotateurs

| # | Tâche | Statut |
|---|-------|--------|
| 3A | Nouvel onglet "Accord" dans AlgorithmLab | 🔴 À faire |
| 3B | Sélecteur : Gold vs Charte à comparer | 🔴 À faire |
| 3C | Affichage Kappa, Po, Pe, matrice confusion | 🔴 À faire |
| 3D | Liste des désaccords avec verbatims | 🔴 À faire |
| 3E | Bouton "Valider comme baseline" | 🔴 À faire |

### Phase 4 : Intégration Level 1

| # | Tâche | Statut |
|---|-------|--------|
| 4A | Sélecteur "Référence Y" dans tests M2 | 🔴 À faire |
| 4B | Recalcul corrélations M2→Y selon référence choisie | 🔴 À faire |
| 4C | Comparaison résultats entre chartes | 🔴 À faire |

---

## 🗂️ Structure des fichiers à créer

```
src/features/phase3-analysis/level1-validation/
├── algorithms/
│   └── classifiers/
│       ├── client/
│       │   ├── GoldYClassifier.ts          # 🆕 Lecture reaction_tag
│       │   ├── CharteYBClassifier.ts       # 🆕 Patterns CharteY_B
│       │   └── RegexClientClassifier.ts    # Existant
│       └── conseiller/
│           ├── GoldXClassifier.ts          # 🆕 Lecture strategy_tag
│           ├── CharteXAClassifier.ts       # 🆕 Sans contexte
│           └── RegexConseillerClassifier.ts # Existant
│
└── ui/
    └── components/
        └── AlgorithmLab/
            └── Level0Agreement/             # 🆕 Nouveau dossier
                ├── index.ts
                ├── Level0AgreementPanel.tsx # Interface principale
                ├── KappaDisplay.tsx         # Affichage métriques
                ├── ConfusionMatrix.tsx      # Matrice de confusion
                └── DisagreementList.tsx     # Liste des désaccords
```

---

## 📊 SQL : Insertion des chartes

### Insertion CharteY_B baseline

```sql
INSERT INTO algorithm_version_registry (
  version_id,
  version_name,
  status,
  is_baseline,
  y_key,
  y_version,
  y_config,
  description,
  validation_sample_size
) VALUES (
  'CharteY_B-v1.0.0-baseline',
  'Charte Y-B — Accord client élargi v1.0.0',
  'baseline',
  true,
  'CharteY_B',
  '1.0.0',
  '{
    "charte_name": "Charte B - Accord client élargi",
    "patterns": {
      "POSITIF": ["d''accord", "oui", "ouais", "ok", "voilà", "merci", "parfait"],
      "NEUTRE": ["hm", "mh", "mmh"],
      "NEGATIF": ["mais", "non", "pas d''accord", "pas normal"]
    },
    "rules": {"priority": "first_match", "default": "NEUTRE"}
  }'::jsonb,
  'Charte Y validée le 14/12/2025 avec Kappa=0.998 vs Gold',
  901
);
```

### Insertion GoldX référence

```sql
INSERT INTO algorithm_version_registry (
  version_id,
  version_name,
  status,
  is_baseline,
  x_key,
  x_version,
  x_config,
  description
) VALUES (
  'GoldX-v1.0.0-reference',
  'Gold X — Annotation manuelle (référence)',
  'validated',
  true,
  'GoldX',
  '1.0.0',
  '{"source": "strategy_tag", "type": "manual_annotation"}'::jsonb,
  'Référence Gold pour X = lecture directe de strategy_tag'
);
```

---

## 🎯 Critères de succès

| # | Critère | Validation |
|---|---------|------------|
| 1 | Chartes X et Y enregistrées dans BDD | SQL vérifié |
| 2 | Algorithmes TypeScript fonctionnels | Tests unitaires |
| 3 | UI Level 0 affiche Kappa et matrice | Screenshot |
| 4 | Baseline définie pour X et Y | is_baseline = true |
| 5 | Sélecteur référence Y dans Level 1 | Fonctionnel |
| 6 | Documentation thèse section 4.3.4 | Kappa documenté |

---

## 📚 Références

### Échelle d'interprétation Kappa (Landis & Koch, 1977)

| Kappa | Interprétation |
|-------|----------------|
| < 0.00 | Accord inférieur au hasard |
| 0.00 - 0.20 | Accord faible |
| 0.21 - 0.40 | Accord acceptable |
| 0.41 - 0.60 | Accord modéré |
| 0.61 - 0.80 | Accord substantiel |
| **0.81 - 1.00** | **Accord quasi-parfait** ✅ |

### Formule Kappa de Cohen

```
κ = (Po - Pe) / (1 - Pe)

où :
- Po = accord observé (proportion de cas où les annotateurs sont d'accord)
- Pe = accord attendu par hasard (basé sur les distributions marginales)
```

---

## 🔗 Lien avec autres missions

| Mission | Dépendance |
|---------|------------|
| `mission-next-M2-M3-tuning-v5-PAUSED.md` | **Attend** cette mission |
| `mission-2025-12-12-level1-section-c-final.md` | Conclusions M1 (référence) |

---

*Prochaine étape : Phase 1A - Insertion des chartes dans BDD*  
*Session : 14 décembre 2025*
