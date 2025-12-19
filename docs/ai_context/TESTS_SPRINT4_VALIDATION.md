# 🧪 Tests de Validation - Sprint 4 Gold Standards

**Date** : 2025-12-18
**Sprint** : Sprint 4 - Architecture Gold Standards
**Testeur** : Thomas
**Durée estimée** : 30-45 minutes

---

## 🎯 Objectifs de Validation

1. ✅ Vérifier que les désaccords s'affichent correctement
2. ✅ Valider le workflow de validation (CAS A/B/C)
3. ✅ Confirmer le versioning des gold standards
4. ✅ Vérifier que `analysis_pairs` reste intact (source de vérité)
5. ✅ Tester le composant `DisagreementDetailView` avec contexte complet

---

## 📋 CHECKLIST RAPIDE

### ✅ Tests Obligatoires (30 min)

- [X] Test 1 : Affichage des désaccords
- [ ] Test 2 : Validation CAS A (LLM correct)
- [ ] Test 3 : Validation CAS B (Manuel correct)
- [ ] Test 4 : Validation CAS C (Ambigu)
- [ ] Test 5 : Vérification versioning gold standards
- [ ] Test 6 : Vérification intégrité analysis_pairs

### 🔄 Tests Optionnels (15 min)

- [ ] Test 7 : Navigation entre désaccords
- [ ] Test 8 : Lien "Voir l'appel complet"
- [ ] Test 9 : Contexte conversationnel complet
- [ ] Test 10 : Onglet Gold Standards

---

## 🧪 TEST 1 : Affichage des Désaccords

### **Objectif**

Vérifier que les désaccords d'un test s'affichent correctement.

### **Étapes**

1. **Ouvrir l'application**

   ```
   http://localhost:3000/phase3-analysis/level0/multi-chartes
   ```
2. **Aller dans l'onglet "VALIDATION DÉSACCORDS"**
3. **Vérifier le tableau**

   - [X] Les tests avec désaccords s'affichent
   - [X] Colonnes : Charte, Variable, Kappa, Désaccords, Date, Action
   - [X] Bouton "VALIDER" présent pour chaque test

### **Requête SQL de Vérification**

```sql
-- Voir les tests avec désaccords
SELECT 
  test_id,
  charte_id,
  variable,
  kappa,
  disagreements_count,
  tested_at
FROM level0_charte_tests
WHERE disagreements_count > 0
ORDER BY tested_at DESC;
```

### **Résultat Attendu**

- ✅ Au moins 1-2 tests affichés avec 5-18 désaccords
- ✅ Bouton "VALIDER" cliquable

---

## 🧪 TEST 2 : Validation CAS A (LLM Correct)

### **Objectif**

Valider un désaccord en donnant raison au LLM et vérifier que le gold standard est corrigé.

### **Étapes**

1. **Cliquer sur "VALIDER"** pour un test (ex: CharteY_B)
2. **Vérifier l'affichage du DisagreementDetailView**

   - [ ] En-tête : "Paire #XXXX" + Lien "Voir l'appel complet" Intégrer lien vers modal TaggingModal depuis DisagreementDetailView"
   - [X] Section "💬 Contexte Conversationnel" avec prev/next
   - [X] Section "🏷️ Comparaison des Tags"
   - [X] Gold Standard (Manuel) ≠ LLM (Auto)
   - [X] Raisonnement LLM affiché
   - [X] Formulaire avec 3 options (CAS A/B/C)
3. **Sélectionner CAS A**

   - [X] Cliquer sur "CAS A : Le LLM a raison"
   - [X] Écrire justification : "Après vérification, le LLM a bien détecté le ton positif"
4. **Cliquer "Valider la Décision"**
5. **Vérifier le passage au suivant**

   - [X] Barre de progression mise à jour (ex: 2/5)
   - [ ] Désaccord suivant affiché automatiquement : NON on reste sur l'affichage du désaccord actuel et si je reclique on restetoujours sur la page actuel et la barre de progression s'incrémente

### **Vérifications Base de Données**

```sql
-- 1. Vérifier que la validation est enregistrée
SELECT 
  pair_id,
  manual_tag,
  llm_tag,
  validation_decision,
  corrected_tag,
  validation_comment,
  validated_at
FROM disagreement_validations
ORDER BY validated_at DESC
LIMIT 1;
```

**Résultat attendu** :

```json
{
  "validation_decision": "CAS_A_LLM_CORRECT",
  "corrected_tag": "[tag du LLM]"
}
```

```sql
-- 2. Vérifier le versioning du gold standard
SELECT 
  pair_id,
  gold_standard_id,
  reaction_gold_tag,
  version,
  is_current,
  validation_notes
FROM pair_gold_standards
WHERE pair_id = [ID de la paire validée]
ORDER BY version DESC;
```

**Résultat attendu** :

```json
[
  {
    "version": 2,
    "reaction_gold_tag": "[tag corrigé]",
    "is_current": true,
    "validation_notes": "CAS A: Corrected from disagreement validation (v1 → v2)"
  },
  {
    "version": 1,
    "reaction_gold_tag": "[ancien tag]",
    "is_current": false
  }
]
```

```sql
-- 3. CRITIQUE : Vérifier que analysis_pairs N'A PAS été modifié
SELECT 
  ap.pair_id,
  ap.reaction_tag as current_tag,
  b.reaction_tag as backup_tag,
  CASE 
    WHEN ap.reaction_tag = b.reaction_tag THEN '✅ INTACT'
    ELSE '❌ MODIFIÉ (PROBLÈME)'
  END as status
FROM analysis_pairs ap
JOIN analysis_pairs_backup_20251218 b ON ap.pair_id = b.pair_id
WHERE ap.pair_id = [ID de la paire validée];
```

**Résultat attendu** :

```json
{
  "status": "✅ INTACT"
}
```

### **✅ Critères de Succès**

- [ ] Validation enregistrée avec CAS_A_LLM_CORRECT
- [ ] Version 2 créée dans pair_gold_standards avec tag corrigé
- [ ] Version 1 désactivée (is_current=false)
- [ ] **analysis_pairs reste INTACT** (même valeur que backup)

---

## 🧪 TEST 3 : Validation CAS B (Manuel Correct)

### **Objectif**

Valider un désaccord en confirmant l'annotation manuelle originale.

### **Étapes**

1. **Sélectionner CAS B**

   - [ ] Cliquer sur "CAS B : L'annotation manuelle était correcte"
   - [ ] Justification : "Le gold standard était correct, le LLM a mal interprété"
2. **Cliquer "Valider la Décision"**

### **Vérifications Base de Données**

```sql
-- Vérifier que PAS de version 2 créée
SELECT 
  pair_id,
  gold_standard_id,
  COUNT(*) as nb_versions,
  MAX(version) as max_version
FROM pair_gold_standards
WHERE pair_id = [ID de la paire]
GROUP BY pair_id, gold_standard_id;
```

**Résultat attendu** :

```json
{
  "nb_versions": 1,
  "max_version": 1
}
```

### **✅ Critères de Succès**

- [ ] Validation enregistrée avec CAS_B_LLM_INCORRECT
- [ ] corrected_tag = NULL
- [ ] Aucune nouvelle version créée (reste version 1)
- [ ] analysis_pairs intact

---

## 🧪 TEST 4 : Validation CAS C (Ambigu)

### **Objectif**

Marquer un désaccord comme ambigu (exclu du Kappa corrigé).

### **Étapes**

1. **Sélectionner CAS C**

   - [ ] Cliquer sur "CAS C : Ambigu / Difficile à trancher"
   - [ ] Justification : "Le contexte n'est pas assez clair pour trancher"
2. **Cliquer "Valider la Décision"**

### **Vérifications Base de Données**

```sql
-- Vérifier validation CAS C
SELECT 
  pair_id,
  validation_decision,
  corrected_tag
FROM disagreement_validations
WHERE validation_decision = 'CAS_C_AMBIGUOUS'
ORDER BY validated_at DESC
LIMIT 1;
```

**Résultat attendu** :

```json
{
  "validation_decision": "CAS_C_AMBIGUOUS",
  "corrected_tag": null
}
```

### **✅ Critères de Succès**

- [ ] Validation enregistrée avec CAS_C_AMBIGUOUS
- [ ] Aucune modification du gold standard

---

## 🧪 TEST 5 : Vérification Versioning Gold Standards

### **Objectif**

Vérifier que le système de versioning fonctionne correctement.

### **Requêtes SQL**

```sql
-- Voir toutes les paires avec plusieurs versions
SELECT 
  pair_id,
  gold_standard_id,
  COUNT(*) as nb_versions,
  STRING_AGG(CONCAT('v', version, ':', reaction_gold_tag, 
    CASE WHEN is_current THEN ' (ACTIVE)' ELSE '' END), ', ' 
    ORDER BY version) as versions_history
FROM pair_gold_standards
GROUP BY pair_id, gold_standard_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

**Résultat attendu** :

```json
[
  {
    "pair_id": 3768,
    "nb_versions": 2,
    "versions_history": "v1:CLIENT_NEUTRE, v2:CLIENT_POSITIF (ACTIVE)"
  }
]
```

```sql
-- Vérifier qu'il n'y a qu'UNE SEULE version active par paire
SELECT 
  pair_id,
  gold_standard_id,
  COUNT(*) as nb_versions_actives
FROM pair_gold_standards
WHERE is_current = true
GROUP BY pair_id, gold_standard_id
HAVING COUNT(*) > 1;
```

**Résultat attendu** : **0 lignes** (aucune paire avec plusieurs versions actives)

### **✅ Critères de Succès**

- [ ] Paires avec CAS A ont 2 versions
- [ ] Une seule version active (is_current=true) par paire
- [ ] Historique traçable

---

## 🧪 TEST 6 : Intégrité analysis_pairs (CRITIQUE)

### **Objectif**

Confirmer que `analysis_pairs` (source de vérité) n'a jamais été modifié.

### **Requête SQL Complète**

```sql
-- Comparer TOUTES les paires avec le backup
SELECT 
  COUNT(*) FILTER (WHERE ap.reaction_tag != b.reaction_tag) as nb_differences,
  COUNT(*) as total_pairs,
  CASE 
    WHEN COUNT(*) FILTER (WHERE ap.reaction_tag != b.reaction_tag) = 0 
    THEN '✅ PARFAIT - Aucune modification'
    ELSE '❌ PROBLÈME - ' || COUNT(*) FILTER (WHERE ap.reaction_tag != b.reaction_tag) || ' paires modifiées'
  END as status
FROM analysis_pairs ap
JOIN analysis_pairs_backup_20251218 b ON ap.pair_id = b.pair_id;
```

**Résultat attendu** :

```json
{
  "nb_differences": 0,
  "total_pairs": 901,
  "status": "✅ PARFAIT - Aucune modification"
}
```

### **Si nb_differences > 0 : RESTAURATION URGENTE**

```sql
-- Restaurer toutes les valeurs depuis le backup
UPDATE analysis_pairs ap
SET 
  reaction_tag = b.reaction_tag,
  strategy_tag = b.strategy_tag
FROM analysis_pairs_backup_20251218 b
WHERE ap.pair_id = b.pair_id;

-- Vérifier restauration
SELECT COUNT(*) as restored 
FROM analysis_pairs ap
JOIN analysis_pairs_backup_20251218 b ON ap.pair_id = b.pair_id
WHERE ap.reaction_tag = b.reaction_tag;
```

### **✅ Critères de Succès**

- [ ] **0 différence** entre analysis_pairs et backup
- [ ] Les 901 paires intactes

---

## 🧪 TEST 7 : Navigation entre Désaccords

### **Objectif**

Tester les boutons de navigation.

### **Étapes**

1. **Bouton "Passer"**

   - [ ] Cliquer sur "Passer" sans valider
   - [ ] Vérifier passage au suivant (2/5 → 3/5)
2. **Bouton "Précédent"**

   - [ ] Cliquer sur "← Précédent"
   - [ ] Vérifier retour au désaccord précédent (3/5 → 2/5)
3. **Barre de progression**

   - [ ] Vérifier que le pourcentage s'actualise
   - [ ] Vérifier le compteur "X désaccords validés"

### **✅ Critères de Succès**

- [ ] Navigation fluide avant/arrière
- [ ] Barre de progression cohérente
- [ ] État du formulaire réinitialisé à chaque changement

---

## 🧪 TEST 8 : Lien "Voir l'appel complet"

### **Objectif**

Vérifier que le lien vers l'appel complet fonctionne.

### **Étapes**

1. **Cliquer sur "Voir l'appel complet"**
   - [ ] Le lien ouvre un nouvel onglet
   - [ ] URL correcte : `/phase2-annotation/call-explorer/[call_id]`
   - [ ] La page de l'appel s'affiche

### **✅ Critères de Succès**

- [ ] Lien fonctionnel (nouvel onglet)
- [ ] Navigation vers la page d'appel

---

## 🧪 TEST 9 : Contexte Conversationnel Complet

### **Objectif**

Vérifier que le composant `AnalysisPairContext` affiche le contexte complet.

### **Étapes**

1. **Observer la section "💬 Contexte Conversationnel"**

   - [ ] Affichage de prev1 (au minimum)
   - [ ] Affichage du tour conseiller
   - [ ] Affichage du tour client (principal)
   - [ ] Affichage de next1 (au minimum)
2. **Cliquer sur le toggle d'expansion** (si présent)

   - [ ] Voir prev2, prev3
   - [ ] Voir next2, next3

### **✅ Critères de Succès**

- [ ] Contexte conversationnel complet visible
- [ ] Tours bien identifiés (conseiller/client)
- [ ] Composant réutilisable fonctionne

---

## 🧪 TEST 10 : Onglet Gold Standards

### **Objectif**

Vérifier l'affichage des gold standards existants.

### **Étapes**

1. **Aller dans l'onglet "⭐ GOLD STANDARDS"**
2. **Vérifier le tableau**

   - [ ] 2 gold standards affichés (thomas_audio_x, thomas_audio_y)
   - [ ] Complétude : 901/901 (100%)
   - [ ] Distribution tags affichée avec pourcentages
   - [ ] Modalité : 🎧 audio
3. **Boutons d'action**

   - [ ] Bouton "⚡ CRÉER PAR DÉRIVATION" présent
   - [ ] Bouton "📝 NOUVEAU GOLD STANDARD" présent

### **Requête SQL de Vérification**

```sql
-- Voir les gold standards avec complétude
SELECT 
  gs.gold_standard_id,
  gs.name,
  gs.modality,
  gs.variable,
  COUNT(pgs.pair_id) as pairs_count,
  ROUND(COUNT(pgs.pair_id)::numeric / 901 * 100, 1) as completion_percentage
FROM gold_standards gs
LEFT JOIN pair_gold_standards pgs 
  ON gs.gold_standard_id = pgs.gold_standard_id 
  AND pgs.is_current = true
GROUP BY gs.gold_standard_id, gs.name, gs.modality, gs.variable
ORDER BY gs.created_at;
```

### **✅ Critères de Succès**

- [ ] 2 gold standards affichés
- [ ] Complétude 100% (901 paires)
- [ ] Interface fonctionnelle

---

## 📊 RÉCAPITULATIF DES VÉRIFICATIONS SQL

### **1. État Général**

```sql
-- Vue d'ensemble du système
SELECT 
  'Gold Standards' as table_name,
  COUNT(*) as count
FROM gold_standards
UNION ALL
SELECT 
  'Pair Gold Standards (total)',
  COUNT(*)
FROM pair_gold_standards
UNION ALL
SELECT 
  'Pair Gold Standards (current)',
  COUNT(*)
FROM pair_gold_standards
WHERE is_current = true
UNION ALL
SELECT 
  'Disagreement Validations',
  COUNT(*)
FROM disagreement_validations
UNION ALL
SELECT 
  'Tests avec désaccords',
  COUNT(*)
FROM level0_charte_tests
WHERE disagreements_count > 0;
```

**Résultat attendu** :

```
Gold Standards: 2
Pair Gold Standards (total): 902-920 (selon corrections)
Pair Gold Standards (current): 901
Disagreement Validations: 1-5 (selon tests effectués)
Tests avec désaccords: 2-4
```

### **2. Intégrité Globale**

```sql
-- Vérifier qu'aucune paire n'a plusieurs versions actives
SELECT 
  pair_id,
  gold_standard_id,
  COUNT(*) as versions_actives
FROM pair_gold_standards
WHERE is_current = true
GROUP BY pair_id, gold_standard_id
HAVING COUNT(*) > 1;
```

**Résultat attendu** : **0 lignes**

---

## 🚀 PRÉPARATION PROCHAINE ÉTAPE

### **Sprint 5 : Optimisations & Audit UX**

**Objectifs identifiés lors de cette session** :

1. **Unification de l'Affichage des Désaccords** (priorité haute)

   - Créer un composant unique `DisagreementDetailView`
   - Remplacer `DisagreementsPanel` (lecture seule) par le nouveau composant
   - Utiliser le composant dans les 3 contextes :
     - Onglet "Tests" (lecture seule)
     - Onglet "Validation" (avec formulaire CAS A/B/C)
     - Onglet "Comparateur" (lecture seule)
2. **Audio Player Integration**

   - Ajouter un player audio dans `DisagreementDetailView`
   - Permettre l'écoute du tour de parole client
   - Afficher les timestamps
3. **Interface de Ré-annotation** (pour dérivation)

   - Créer l'interface pour annoter les 19 paires issues de dérivation
   - Formulaire simple avec sélection de tag
   - Navigation paire par paire
4. **Tests Automatisés**

   - Tests unitaires pour `GoldStandardService`
   - Tests unitaires pour `DisagreementValidationService`
   - Tests d'intégration pour le workflow complet

### **Tâches Préparatoires (à faire avant Sprint 5)**

```bash
# 1. Commit actuel
git add .
git commit -m "test(level0): Tests Sprint 4 - Gold Standards validation

Testé:
- Workflow validation CAS A/B/C
- Versioning gold standards
- Intégrité analysis_pairs
- Navigation désaccords
- Contexte conversationnel

Prochaine étape: Audit UX + Unification composants"

# 2. Documentation des bugs trouvés (si applicable)
# Créer un fichier BUGS_SPRINT4.md avec:
# - Description du bug
# - Étapes de reproduction
# - Impact
# - Priorité

# 3. Backup final
# Créer un backup Supabase complet avant Sprint 5
```

---

## 📋 CHECKLIST FINALE

### **Avant de Clôturer Sprint 4**

- [ ] Tous les tests obligatoires (1-6) passés avec succès
- [ ] analysis_pairs intact (0 modification)
- [ ] Versioning gold standards fonctionnel
- [ ] Validations CAS A/B/C enregistrées correctement
- [ ] Documentation à jour
- [ ] Code committé avec message descriptif
- [ ] Backup base de données créé

### **État Attendu Après Tests**

```
✅ 2 gold standards (thomas_audio_x, thomas_audio_y) : 901 paires chacun
✅ 1-5 validations de désaccords effectuées
✅ 1-3 paires avec versioning (v1 + v2)
✅ analysis_pairs : 100% intact (901/901)
✅ Interface validation opérationnelle
✅ Contexte conversationnel complet fonctionnel
```

---

## 📝 RAPPORT DE TESTS (À Remplir)

```markdown
# Rapport de Tests Sprint 4
**Date** : [YYYY-MM-DD]
**Testeur** : Thomas

## Résultats

### Tests Obligatoires
- [ ] Test 1 : ✅ / ❌
- [ ] Test 2 : ✅ / ❌
- [ ] Test 3 : ✅ / ❌
- [ ] Test 4 : ✅ / ❌
- [ ] Test 5 : ✅ / ❌
- [ ] Test 6 : ✅ / ❌ (CRITIQUE)

### Tests Optionnels
- [ ] Test 7 : ✅ / ❌
- [ ] Test 8 : ✅ / ❌
- [ ] Test 9 : ✅ / ❌
- [ ] Test 10 : ✅ / ❌

## Bugs Identifiés
1. [Description]
   - Priorité : Haute / Moyenne / Basse
   - Impact : [Description]

## Recommandations
- [Liste des améliorations suggérées]

## Conclusion
Sprint 4 : ✅ Validé / ❌ À reprendre
Prêt pour Sprint 5 : Oui / Non
```

---

**Document créé** : 2025-12-18
**Version** : 1.0
**Sprint** : Sprint 4 - Gold Standards
**Auteur** : Claude (Anthropic) & Thomas
