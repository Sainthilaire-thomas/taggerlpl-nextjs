# ADR-005 : Système de Tuning des Chartes d'Annotation

**Date** : 2025-12-20
**Statut** : ✅ Accepté (Infrastructure SQL implémentée)
**Décideurs** : Thomas + Claude
**Sprint** : Sprint 5

---

## 📋 Contexte

### Problème Identifié

Lors du Sprint 4, après validation de désaccords entre annotations manuelles et LLM :

**Observations** :

- ❌ Le LLM génère parfois des tags invalides (ex: `CLIENT_NON_POSITIF` au lieu de catégories valides)
- ❌ Patterns récurrents dans les désaccords (ex: confusion CLIENT_NEUTRE ↔ CLIENT_POSITIF)
- ❌ Pas de mécanisme pour capitaliser sur les validations effectuées
- ❌ Amélioration des chartes = processus manuel et non tracé
- ❌ Aucune mesure d'impact des modifications (Kappa avant/après)

**Exemple Concret (CharteY_B)** :

- 5 désaccords détectés
- 3 validations effectuées (2 CAS A, 1 CAS B)
- Pattern clair : confusion sur distinction NEUTRE vs POSITIF (0% accuracy)
- Mais aucun système pour transformer cette analyse en amélioration structurée

### Besoins Scientifiques

Pour la thèse, nécessité de :

1. **Traçabilité complète** : Historique de toutes les modifications
2. **Reproductibilité** : Pouvoir justifier chaque changement
3. **Mesure d'impact** : Quantifier l'amélioration (Kappa avant/après)
4. **Méthodologie généralisable** : Cycle d'amélioration continue documenté

---

## ✅ Décision

### Système de Tuning en 3 Composantes

#### 1. **Génération Automatique de Suggestions**

**Fonctionnement** :

- Après validation complète des désaccords d'un test
- Analyse automatique via fonction SQL `generate_improvement_suggestions()`
- Détection de patterns :
  - Tags invalides fréquents → Suggérer alias
  - Catégories confondues → Suggérer clarification
  - Accuracy faible → Suggérer contre-exemples

**Critères de suggestion** :

- Priorité 1 (Critique) : 2+ occurrences du même problème
- Priorité 2 (Important) : Impact modéré sur Kappa
- Priorité 3 (Nice-to-have) : Optimisations mineures

#### 2. **Workflow de Validation**

**États de suggestion** :

1. `pending` : Suggestion créée, en attente de décision
2. `applied_pending_validation` : Appliquée, en attente de re-test
3. `applied_validated` : Appliquée ET validée (amélioration confirmée)
4. `applied_rolled_back` : Appliquée puis annulée (régression détectée)
5. `rejected` : Rejetée sans application

**Processus** :

```
Suggestion créée
    ↓
Thomas décide : Appliquer / Rejeter
    ↓
Si Appliquée → Nouvelle version charte (1.0.0 → 1.1.0)
    ↓
Re-test charte v1.1.0
    ↓
Comparaison Kappa : avant vs après
    ↓
Validation / Rollback
```

#### 3. **Traçabilité Complète**

**3 tables SQL** :

- `charte_modifications` : Historique TOUTES modifications
- `charte_improvement_suggestions` : Suggestions + workflow
- `charte_category_stats` : Stats par catégorie pour analyse

**Données tracées** :

- Quoi : Modification exacte (old_value → new_value)
- Pourquoi : Raison + test source
- Quand : Timestamp de chaque action
- Impact : Kappa avant/après
- Qui : Toujours Thomas (validation humaine)

---

## 🎯 Conséquences

### Positives ✅

**1. Amélioration Continue Structurée**

- Cycle itératif formel : Test → Analyse → Suggestion → Application → Validation
- Capitalisation sur chaque validation effectuée
- Réduction progressive des désaccords

**2. Traçabilité Scientifique**

- Historique complet pour annexe thèse
- Justification de chaque modification
- Métriques reproductibles (Kappa avant/après)
- Contribution méthodologique originale

**3. Efficacité Opérationnelle**

- Suggestions automatiques vs. réflexion manuelle
- Détection patterns automatique
- Workflow structuré évite oublis

**4. Mesure d'Impact Quantifiable**

- Amélioration Kappa mesurée précisément
- Taux d'adoption suggestions
- Évolution qualité par version
- Graphiques pour publication

### Négatives / Risques ⚠️

**1. Complexité Système**

- 3 nouvelles tables à maintenir
- Workflow multi-étapes
- **Mitigation** : Tests end-to-end validés, documentation complète

**2. Temps Développement**

- 13h estimées pour implémentation complète
- **Mitigation** : Approche incrémentale (6 parties), validation progressive

**3. Risque Sur-Tuning**

- Modifications trop fréquentes → instabilité
- **Mitigation** : Validation humaine obligatoire, rollback possible

**4. Charge Cognitive**

- Validation suggestions = tâche supplémentaire
- **Mitigation** : Interface intuitive, suggestions priorisées

---

## 🚫 Alternatives Rejetées

### Alternative 1 : Amélioration Manuelle Ad-Hoc

**Description** : Modifier les chartes manuellement sans système structuré

**Rejet Raison** :

- ❌ Pas de traçabilité scientifique
- ❌ Modifications non documentées
- ❌ Pas de mesure d'impact
- ❌ Non reproductible pour thèse

### Alternative 2 : Système Externe (Excel/Notion)

**Description** : Tracker les modifications hors base de données

**Rejet Raison** :

- ❌ Rupture dans le système
- ❌ Synchronisation manuelle base ↔ tracker
- ❌ Risque d'incohérence
- ❌ Pas d'intégration avec interface

### Alternative 3 : Modification Automatique Sans Validation

**Description** : Appliquer suggestions automatiquement

**Rejet Raison** :

- ❌ Dangereux : modifications non contrôlées
- ❌ Pas de validation humaine experte
- ❌ Risque de régression non détectée
- ❌ Contraire à méthodologie scientifique rigoureuse

### Alternative 4 : Cycle Long (Attendre 50+ validations)

**Description** : N'améliorer qu'après beaucoup de données

**Rejet Raison** :

- ❌ Perte d'opportunités d'amélioration précoce
- ❌ Délai trop long pour itération
- ❌ Patterns détectables dès 2-3 occurrences
- ❌ Moins de cycles d'amélioration possibles

---

## 🧪 Validation

### Tests Manuels Effectués (2025-12-20)

**Workflow End-to-End** :

1. ✅ Création suggestion basée sur vraies validations (CharteY_B)
2. ✅ Traçabilité modification dans `charte_modifications`
3. ✅ Changement statut : pending → applied_pending_validation
4. ✅ Simulation re-test : Kappa 0.254 → 0.650 (+156%)
5. ✅ Validation finale : applied_validated
6. ✅ Historique complet consultable

**Résultat** : Workflow complet fonctionnel, traçabilité garantie ✅

### Métriques de Succès Définies

**Techniques** :

- [ ] Toutes tables créées avec indexes
- [ ] Fonctions SQL testées
- [ ] Services TypeScript implémentés
- [ ] UI components fonctionnels
- [ ] Performance < 2s pour génération suggestions

**Scientifiques** :

- [ ] Traçabilité complète modifications
- [ ] Métriques reproductibles
- [ ] Impact mesurable (Kappa avant/après)
- [ ] Minimum 3 cycles de tuning documentés

**Fonctionnels** :

- [ ] Suggestions générées automatiquement
- [ ] Workflow application → validation → rollback opérationnel
- [ ] Interface intuitive pour Thomas

---

## 📊 Impact Attendu

### Court Terme (Sprint 5 - 2 semaines)

- Système complet opérationnel
- Première vraie suggestion appliquée
- Amélioration mesurée sur CharteY_B

### Moyen Terme (3 mois)

- 5-10 cycles de tuning documentés
- Amélioration Kappa globale mesurée
- Méthodologie validée scientifiquement

### Long Terme (Thèse)

- Contribution méthodologique : "Cycle d'amélioration continue pour annotation LLM"
- Graphiques évolution Kappa pour publication
- Reproductibilité démontrée
- Méthodologie généralisable à autres projets

---

## 🔗 Références

### Documentation

- SPECS_CHARTE_TUNING_SYSTEM.md (specs complètes)
- CURRENT_STATE.md (état projet)
- MISSION_SPRINT4_v5_2025-12-19.md (contexte Sprint 4)

### Implémentation

- Migration SQL : 008, 009, 010 (2025-12-20)
- Fonctions SQL : generate_improvement_suggestions(), calculate_category_stats()
- Tables : charte_modifications, charte_improvement_suggestions, charte_category_stats

### Tests

- Test end-to-end manuel (2025-12-20) : ✅ Validé
- Pattern détecté : Confusion CLIENT_NEUTRE ↔ CLIENT_POSITIF
- Amélioration simulée : +156% Kappa

---

## 🔄 Évolutions Futures

### Phase 2 : Suggestions Avancées

- Détection catégories à fusionner (faible distance inter-catégorie)
- Suggestions d'ajustement règles (context_included, examples_per_category)
- Analyse confiance LLM pour optimiser temperature/top_p

### Phase 3 : Tests A/B Automatisés

- Comparaison automatique v1.0.0 vs v1.1.0 sur même échantillon
- Rapport d'impact avec visualisations
- Significativité statistique (test de Student)

### Phase 4 : Export Publication

- Documentation scientifique modifications
- Export CSV historique pour annexe thèse
- Graphiques évolution Kappa par version
- Timeline interactive modifications

---

**Document créé** : 2025-12-20
**Version** : 1.0
**Auteur** : Thomas + Claude
**Prochaine revue** : Après implémentation complète Sprint 5
