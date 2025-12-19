# 📋 Documents Contexte - Prochaine Session Sprint 4

## 📅 Pour Session du 2025-12-20 (Finalisations - 1h)

---

## 📄 Documents Essentiels à Fournir

### 1. **Mission & État Actuel** ⭐ PRIORITAIRE

**`MISSION_SPRINT4_v4_2025-12-19.md`**
- Historique complet sessions 1 & 2 (18/12 + 19/12)
- État détaillé : 95% Sprint 4 complet
- Actions prioritaires : Tests finaux CharteY_C + Validations
- Commit préparé

### 2. **Architecture Base de Données** ⭐ PRIORITAIRE

**`ARCHITECTURE_TABLES_FLUX_LEVEL0.md`**
- Recensement 7 tables (analysis_pairs, gold_standards, pair_gold_standards, etc.)
- Flux de données complet (6 phases)
- Schéma relationnel
- Requêtes SQL d'audit

### 3. **Procédures de Tests**

**`TESTS_SPRINT4_VALIDATION.md`**
- Tests manuels pas à pas
- Cas d'usage à valider
- Checklist complète

---

## 🔧 Fichiers Code Modifiés (Session 19/12)

### À Remplacer dans le Projet

**`SupabaseLevel0Service_FIXED.ts`**
- Correction : Liaison automatique annotations au test_id
- Ligne ajoutée ~72-85

**`Level0AuditPage_FIXED.tsx`**
- Nouveau : Page d'audit complète (18+ vérifications)
- Emplacement : `src/app/(protected)/phase3-analysis/level0/audit/page.tsx`

**`DisagreementValidationPanel_NEW.tsx`**
- Correction : Utilise DisagreementDetailView au lieu du code dupliqué
- Emplacement : `src/features/phase3-analysis/level0-gold/presentation/components/DisagreementValidationPanel.tsx`

---

## 📊 État Base de Données (Requêtes à Exécuter)

### Vérifier Gold Standards

```sql
SELECT 
  gold_standard_id, 
  name, 
  modality, 
  variable 
FROM gold_standards;

-- Résultat attendu : 2 lignes
-- thomas_audio_x | Thomas Audio (Stratégies X) | audio | X
-- thomas_audio_y | Thomas Audio (Réactions Y)  | audio | Y
```

### Vérifier Complétude pair_gold_standards

```sql
SELECT 
  gold_standard_id,
  COUNT(DISTINCT pair_id) as nb_paires,
  COUNT(*) as nb_versions_total,
  COUNT(*) FILTER (WHERE is_current = true) as nb_versions_actives,
  COUNT(*) FILTER (WHERE version > 1) as nb_corrections
FROM pair_gold_standards
GROUP BY gold_standard_id;

-- Résultat attendu :
-- thomas_audio_x | 901 paires | 901 versions | 901 actives | 0 corrections
-- thomas_audio_y | 901 paires | 903 versions | 901 actives | 2 corrections (CAS A)
```

### Vérifier Annotations Orphelines

```sql
SELECT 
  annotator_id,
  COUNT(*) as nb_orphelines
FROM annotations
WHERE test_id IS NULL 
  AND annotator_type = 'llm_openai'
GROUP BY annotator_id;

-- Résultat actuel :
-- CharteY_C_v1.0.0 | 30 orphelines

-- Résultat attendu après nettoyage :
-- (aucune ligne - 0 orphelines)
```

### Vérifier Validations Désaccords

```sql
SELECT 
  lct.test_id,
  lct.charte_id,
  lct.disagreements_count,
  COUNT(dv.validation_id) as validations_effectuees,
  COUNT(dv.validation_id) FILTER (WHERE dv.validation_decision = 'CAS_A_LLM_CORRECT') as cas_a,
  COUNT(dv.validation_id) FILTER (WHERE dv.validation_decision = 'CAS_B_LLM_INCORRECT') as cas_b,
  lct.disagreements_count - COUNT(dv.validation_id) as restantes
FROM level0_charte_tests lct
LEFT JOIN disagreement_validations dv ON dv.test_id = lct.test_id
WHERE lct.disagreements_count > 0
GROUP BY lct.test_id, lct.charte_id, lct.disagreements_count;

-- État actuel :
-- CharteY_B | 5 désaccords | 3 validés (2 CAS A, 1 CAS B) | 2 restantes
```

---

## 🎯 Actions Immédiates (Début Session 3)

### 1. Nettoyage CharteY_C (2 min)

```sql
-- Supprimer annotations orphelines CharteY_C
DELETE FROM annotations
WHERE annotator_id = 'CharteY_C_v1.0.0' 
  AND test_id IS NULL;
```

### 2. Nouveau Test CharteY_C (5 min)

- Interface Level 0
- Sélectionner CharteY_C
- Tester 10 paires
- **Vérifier** : 10 annotations automatiquement liées ✅

### 3. Audit Vérification (2 min)

- Ouvrir onglet "🔍 AUDIT & DEBUG"
- Cliquer "RELANCER AUDIT"
- **Vérifier** : 0 annotations orphelines ✅

### 4. Valider Désaccords Restants (15 min)

- Onglet "VALIDATION DÉSACCORDS"
- CharteY_B : Valider 2 désaccords restants
- **Vérifier** : Gold standards mis à jour (versioning)

### 5. Audit Final (5 min)

- Relancer audit
- **Objectif** : ✅ 18+ OK | ⚠️ 0-1 Warning | 🔴 0 Erreur

### 6. Documentation (15 min)

- Remplir `TESTS_SPRINT4_VALIDATION.md`
- Screenshots états finaux
- Métriques (Kappa brut/corrigé)

### 7. Commit Final (5 min)

```bash
git add .
git commit -m "Sprint4 Finalisations: Tests validés + Audit 0 erreur

✅ Complété:
- test: CharteY_C relanc é avec liaison auto (10 annotations)
- test: 5/5 désaccords CharteY_B validés (CAS A/B)
- data: 0 annotations orphelines
- audit: 18+ vérifications OK, 0 erreur critique

📊 Métriques finales:
- Gold standards: 2 (thomas_audio_x/y)
- Paires migrées: 1802 (901×2)
- Corrections versioning: 4 (CAS A)
- Kappa corrigé: [valeur à compléter]

🎯 Sprint 4 COMPLET - Prêt pour Sprint 5"
```

---

## 📊 Métriques à Capturer

### Avant Session 3
- Annotations orphelines : 30 (CharteY_C)
- Tests incomplets : 1 (CharteY_C 2 paires)
- Désaccords validés : 3/5 (60%)

### Après Session 3 (Objectif)
- Annotations orphelines : 0 ✅
- Tests incomplets : 0 ✅
- Désaccords validés : 5/5 (100%) ✅
- Corrections gold standards : 4+ (CAS A)
- Audit : 0 erreur critique ✅

---

## 🔄 Si Problèmes Rencontrés

### Annotations toujours orphelines après test CharteY_C

**Diagnostic** :
```sql
SELECT COUNT(*) FROM annotations 
WHERE annotator_id = 'CharteY_C_v1.0.0' 
  AND test_id IS NULL;
```

**Solution** : Vérifier que le code corrigé est bien déployé dans `SupabaseLevel0Service.ts`

### Audit détecte toujours erreurs

**Diagnostic** : Fonction SQL `count_multi_version_pairs()` manquante

**Solution** :
```sql
CREATE OR REPLACE FUNCTION count_multi_version_pairs()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT pair_id)::integer
  FROM (
    SELECT pair_id, gold_standard_id
    FROM pair_gold_standards
    GROUP BY pair_id, gold_standard_id
    HAVING COUNT(*) > 1
  ) sub;
$$;
```

---

**Document créé** : 2025-12-19  
**Pour session** : 2025-12-20 (Finalisations Sprint 4)  
**Durée estimée** : 1 heure  
**Objectif** : Sprint 4 100% validé ✅
