# 🎯 Mission: Tuning M2/M3 - Refonte des Algorithmes Médiateurs

*Date de création : 12 décembre 2025*  
*Mise à jour : 14 décembre 2025 (v5 - PAUSED)*  
*Statut : ⏸️ EN PAUSE*  
*Dépendance : Suite de la mission Section C Cascade*
*Raison pause : Prérequis Level 0 (Accord Inter-Annotateurs) à compléter d'abord*

---

## ⏸️ STATUT : EN PAUSE

### Raison de la pause

Avant de poursuivre le tuning M2, nous avons identifié le besoin de :
1. **Valider la qualité des annotations X et Y** via un framework multi-chartes
2. **Documenter le Kappa inter-annotateurs** pour la thèse (section 4.3.4)
3. **Permettre de faire varier la référence Y** lors des tests M2

### Nouvelle mission prioritaire

➡️ Voir `mission-level0-inter-annotator-agreement.md`

---

## ✅ CE QUI A ÉTÉ FAIT (Sessions 12-14 décembre 2025)

### Phase 1 : Préparation et Unification

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 1A | Lien vers appel complet | ✅ Fait | Navigation vers TranscriptLPL |
| 1B | ToneLine unifié | ✅ Fait | Duplication supprimée |
| 1C | Migration BDD M2 → JSONB | ✅ Fait | Colonnes m2_scores, m2_details créées |
| 1D | Colonnes M2 dynamiques | ✅ Fait | 6 dimensions affichées |

### Phase 2 : Algorithme M2 Multi-Dimensions

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 2A | M2MultiDimensionCalculator.ts | ✅ Fait | 6 dimensions implémentées |
| 2B | Enregistrement en BDD | ✅ Fait | Bug corrigé (metadata.dbColumns) |
| 2C | Affichage contexte | ✅ Fait | Contexte prev2/prev1 visible |

### Validation Kappa X et Y (Session 14 décembre)

| Variable | Kappa Cohen | Accord % | Désaccords |
|----------|-------------|----------|------------|
| **Y** (réactions client) | **0.998** | 99.89% | 1/901 |
| **X** (stratégies conseiller) | **0.997** | 99.78% | 2/901 |

**Conclusion** : Annotations manuelles très cohérentes, reproductibles algorithmiquement.

---

## 🔄 CE QUI RESTE À FAIRE

### Après complétion de Level 0 (Accord Inter-Annotateurs)

| # | Tâche | Priorité | Dépendance |
|---|-------|----------|------------|
| 3A | Tuning patterns M2 dimensions | 🔴 Haute | Level 0 complété |
| 3B | Corrélations X→M2, M2→Y par dimension | 🔴 Haute | 3A |
| 3C | Baron-Kenny sur dimensions prometteuses | 🔴 Haute | 3B |
| 3D | Tooltips enrichis M2 | 🟡 Moyenne | 3A |
| 3E | Interface comparaison versions M2 | 🟡 Moyenne | 3A |

### Phase M3 (future)

| # | Tâche | Priorité |
|---|-------|----------|
| 4A | Migration JSONB M3 | 🟢 Basse |
| 4B | Algorithme M3 multi-dimensions | 🟢 Basse |
| 4C | Corrélations M3→Y | 🟢 Basse |

---

## 📊 État actuel des données

### Distribution X (stratégies conseiller)

| Tag | Nb | % |
|-----|-----|-----|
| EXPLICATION | 444 | 49.3% |
| OUVERTURE | 128 | 14.2% |
| ENGAGEMENT | 126 | 14.0% |
| REFLET_ACQ | 112 | 12.4% |
| REFLET_JE | 38 | 4.2% |
| REFLET_VOUS | 29 | 3.2% |
| REFLET | 18 | 2.0% |
| ENGAGEMENT_NEG | 6 | 0.7% |

### Distribution Y (réactions client)

| Tag | Nb | % |
|-----|-----|-----|
| CLIENT_NEGATIF | 662 | 62% |
| CLIENT_NEUTRE | 234 | 22% |
| CLIENT_POSITIF | 179 | 17% |

### Impact sous-types REFLET sur Y

| Sous-type | % POSITIF | % NÉGATIF |
|-----------|-----------|-----------|
| **REFLET_VOUS** | **41.4%** | 24.1% |
| REFLET_ACQ | 16.1% | 77.7% |
| REFLET_JE | 13.2% | 65.8% |

**Insight** : REFLET_VOUS (centré client) génère 3x plus de réactions positives.

---

## 🔗 Liens avec Level 0

### Pourquoi Level 0 est prérequis pour M2

1. **Référence Y variable** : Pour tester M2, on doit pouvoir choisir quelle définition de Y utiliser (Gold manuel, CharteY_B, etc.)

2. **Robustesse H2** : Si on change la définition de Y, les corrélations M2→Y changent-elles ?

3. **Documentation thèse** : Section 4.3.4 requiert Kappa validé avant analyses causales

### Ce que Level 0 va apporter

```
┌─────────────────────────────────────────────────────────────────────┐
│  Level 0 (Accord Inter-Annotateurs)                                 │
│  └── Chartes X et Y validées avec Kappa                            │
│      └── Baseline définie pour chaque variable                     │
│                                                                     │
│  Level 1 (Validation Algorithmes)                                   │
│  └── Tests M2 avec référence Y sélectionnable                      │
│      └── Corrélations M2→Y selon la charte Y choisie               │
│                                                                     │
│  Level 2 (Validation Hypothèses)                                    │
│  └── Baron-Kenny avec les bonnes références                        │
│      └── H2 validée de manière robuste                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers modifiés (sessions 12-14 décembre)

| Fichier | Modification |
|---------|--------------|
| `TurnWithContext.tsx` | Export ToneLine |
| `ResultsTableBody.tsx` | Import ToneLine unifié, lien vers appel |
| `extraColumns.tsx` | 6 dimensions M2 |
| `M2MultiDimensionCalculator.ts` | Nouvel algorithme créé |
| `analysis_pairs` (BDD) | Colonnes m2_scores, m2_details ajoutées |

---

## 📚 Documents de référence

| Document | Contenu | Statut |
|----------|---------|--------|
| `base-context.md` | Architecture globale | 🔴 Obligatoire |
| `base-context-versioning-complement.md` | Système versioning | 🔴 Obligatoire |
| `mission-level0-inter-annotator-agreement.md` | **Nouvelle mission prioritaire** | 🔴 Obligatoire |
| `mission-2025-12-12-level1-section-c-final.md` | Conclusions M1 | 🟡 Optionnel |

---

*Mission en pause depuis : 14 décembre 2025*  
*Reprise prévue : Après complétion de Level 0*
