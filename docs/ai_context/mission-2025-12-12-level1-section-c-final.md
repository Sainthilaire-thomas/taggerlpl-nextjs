# 🎯 Mission: Section C - Analyse de Médiation M1

*Session : 12 décembre 2025*  
*Statut : ✅ Terminée - Conclusions importantes pour la thèse*

---

## 📊 Résumé exécutif

**Question initiale :** M1 (densité de verbes d'action) est-il un médiateur de l'effet X (stratégie) → Y (réaction) ?

**Réponse :** Non. M1 n'est pas un médiateur indépendant, mais un **indicateur constitutif** de X.

---

## 🔬 Tests effectués et résultats

### 1. Corrélations bivariées ✅

| Relation | Pearson r | p-value | Statut |
|----------|-----------|---------|--------|
| X → M1 | 0.354 | < 0.001 | ✅ Significatif |
| M1 → Y | 0.146 | < 0.001 | ✅ Significatif |
| X → Y | 0.537 | < 0.001 | ✅ Significatif |

**Conclusion :** La chaîne X → M1 → Y existe au niveau des associations globales.

---

### 2. ANOVA (M1 par réaction) ✅

| Réaction | M1 moyen | N |
|----------|----------|---|
| POSITIF | **2.74** | 167 |
| NEUTRE | 2.00 | 235 |
| NEGATIF | **1.22** | 529 |

**F(2, 898) = 6.71, p = 0.016** ✅

**Conclusion :** Les réactions positives sont associées à plus de verbes d'action.

---

### 3. Baron-Kenny (M1 continu) ❌

| Coefficient | Valeur | Interprétation |
|-------------|--------|----------------|
| a (X → M1) | 3.20 | ✅ Fort |
| **b (M1 → Y \| X)** | **-0.00** | ❌ Nul |
| c (effet total) | 0.46 | |
| c' (effet direct) | 0.48 | ≈ c |

**Sobel Z = -0.03, p = 0.978** ❌

**Conclusion :** Quand on contrôle X, M1 n'ajoute rien à la prédiction de Y.

---

### 4. Analyse intra-stratégie ❌

| Stratégie | N | M1 moyen | CV | r(M1→Y) | p-value |
|-----------|---|----------|-----|---------|---------|
| ENGAGEMENT | 132 | 4.87 | 131% | -0.108 | 0.213 |
| OUVERTURE | 128 | 3.02 | 188% | -0.120 | 0.174 |
| REFLET | 197 | 0.51 | 411% | 0.084 | 0.238 |
| EXPLICATION | 444 | 0.87 | 281% | 0.064 | 0.177 |

**Conclusion :** À stratégie égale, la variation de M1 ne prédit pas Y (aucune corrélation significative).

---

### 5. Test de médiation binaire (présence/absence)

| Groupe | N | Y moyen |
|--------|---|---------|
| M1 > 0 (avec verbes) | 216 | **0.440** |
| M1 = 0 (sans verbes) | 685 | **0.255** |

**Test t : t = 6.20, p < 0.001, Cohen's d = 0.48** ✅

**Baron-Kenny binaire :**
- a = 0.360 ✅
- **b = -0.004** ❌
- Sobel p = 0.997 ❌

**Conclusion :** L'effet de présence est significatif (d = 0.48), mais la médiation échoue encore (b ≈ 0).

---

## 🎯 Conclusion finale

### Pourquoi Baron-Kenny échoue systématiquement (b = 0)

Le coefficient **b** teste : "À stratégie égale (X fixé), M1 prédit-il Y ?"

La réponse est **non** parce que :

```
STRATÉGIE D'ACTION (X=1)        STRATÉGIE D'EXPLICATION (X=0)
─────────────────────────       ────────────────────────────
ENGAGEMENT → M1 élevé (~5)      EXPLICATION → M1 bas (~1)
OUVERTURE  → M1 élevé (~3)      REFLET      → M1 bas (~0.5)
```

**M1 est une caractéristique définitoire de X**, pas un mécanisme intermédiaire séparé.

Quand on "fixe X", on fixe aussi implicitement le niveau de M1 → plus de variance à exploiter.

---

### Ce que cela signifie pour la thèse

| ❌ Ce que les données NE supportent PAS | ✅ Ce que les données SUPPORTENT |
|----------------------------------------|----------------------------------|
| M1 est un médiateur indépendant | M1 est un indicateur de X |
| Plus de verbes = meilleure réaction (linéaire) | Présence de verbes = meilleure réaction |
| Le mécanisme passe par M1 séparément de X | Le mécanisme passe par la stratégie (dont M1 est constitutif) |

### Reformulation de H2

**Avant (H2 originale) :**
> L'effet X → Y est médiatisé par M1 : X → M1 → Y

**Après (H2 révisée) :**
> Les stratégies d'action (X) sont caractérisées par la présence de verbes d'action (M1). 
> L'effet sur la réaction (Y) est porté par la stratégie elle-même, 
> dont les verbes d'action sont un marqueur linguistique, pas un mécanisme séparé.

---

## 📁 Fichiers modifiés

### Commits

| Hash | Message |
|------|---------|
| `339209b` | feat(level1): restructure Section C for H2 cascade model |
| `2c496d6` | feat(level1): add intra-strategy variance and binary mediation tests |

### Fichiers

| Fichier | Lignes ajoutées |
|---------|-----------------|
| `results.ts` | +70 (nouveaux types) |
| `useH2Mediation.ts` | +350 (nouvelles fonctions de calcul) |
| `H2ContributionSection.tsx` | +400 (nouveaux composants UI) |

**Total session : ~820 lignes, 2 commits**

---

## 🔮 Prochaines étapes suggérées

1. **Discuter avec le directeur de thèse** de cette découverte
2. **Reformuler H2** dans le document de thèse
3. **Considérer M2 et M3** : Ont-ils le même problème ou sont-ils des médiateurs indépendants ?
4. **Explorer d'autres mécanismes** : Structure syntaxique, implication du client (vous/je), etc.

---

## 💡 Insight méthodologique

Cette analyse illustre un cas classique en statistiques :

> **Colinéarité conceptuelle** : Quand le médiateur supposé (M1) est une caractéristique définitoire de la variable indépendante (X), la médiation statistique est impossible à démontrer, même si le mécanisme théorique est valide.

Le mécanisme neurolinguistique (verbes d'action → neurones miroirs → réaction positive) peut être vrai, mais il ne peut pas être démontré via Baron-Kenny si les verbes d'action **définissent** ce qu'est une stratégie d'action.

---

*Fin de session : 12 décembre 2025 - 19h45*
