# 📋 Mission Level 0 - Session 2025-12-18 (Sprint 4 & Extensions)

## 🎯 Vue d'Ensemble

**Sprint 4 (Base)** : Validation désaccords + Kappa corrigé (6h)  
**Sprint 4+ (Extensions)** : Re-taggage texte-only + Modalité audio + Comparateur Kappa (6h)

**Total estimé** : 12 heures (2-3 sessions)

---

## ✅ Sprint 3 : État Actuel (Complété 2025-12-17)

### Livrables Sprint 3 ✅

**Architecture Base de Données** :
- ✅ Migration 003 : Enrichissement `level0_chartes` (philosophy, version, prompt_template, prompt_params, notes)
- ✅ Migration 004 : Import 5 chartes (CharteY A/B/C, CharteX A/B)
- ✅ Migration 005 : Enrichissement `level0_charte_tests` (philosophy, version, kappa_corrected, disagreements)
- ✅ Suppression contrainte unicité → Tests multiples par charte possibles

**Services TypeScript** (~800 lignes) :
- ✅ `CharteManagementService.ts` : CRUD chartes
- ✅ `CharteRegistry.ts` v2.0 : Wrapper async + cache 5min
- ✅ `SupabaseLevel0Service.ts` : Auto-sauvegarde philosophy/version

**Tests Réalisés** :
- ✅ 4 tests sur 10 paires chacun
- ✅ 3 philosophies testées (Minimaliste, Enrichie, Binaire)
- ✅ 19 désaccords identifiés et tracés

### Résultats Tests Sprint 3

| Charte | Philosophy | Kappa | Accuracy | Désaccords | Observation |
|--------|-----------|-------|----------|------------|-------------|
| CharteY_C | Binaire | 0.333 | 50% | 1/2 | Petit échantillon |
| CharteY_C | Binaire | 0.063 | 10% | 9/10 | Conflit philosophies |
| CharteY_A | Minimaliste | 0.254 | 50% | 5/10 | Tags manuels NEUTRE incorrects |
| CharteY_B | Enrichie | 0.254 | 50% | 5/10 | Tags manuels NEUTRE incorrects |

### Découvertes Scientifiques Sprint 3

**1. Tags Manuels NEUTRE Incorrects** (Problème Majeur) 🔬
```
Pair 3768: "absolument ! absolument !" 
  Thomas (audio) = CLIENT_NEUTRE
  LLM (texte)    = CLIENT_POSITIF ✅
  → LLM a raison ! "absolument" = accord explicite

Pair 3501: "oui"
  Thomas (audio) = CLIENT_NEUTRE
  LLM (texte)    = CLIENT_POSITIF ✅
  → LLM a raison ! "oui" = accord explicite
```

**Explication** : Thomas a écouté l'audio avec un **ton dépité** → Tagué NEUTRE car prosodie négative. Le LLM texte-only voit "oui/absolument" → Tague POSITIF car texte positif.

**Les 2 ont raison selon leur modalité !**

---

## 🎯 Sprint 4 : Validation Désaccords (Base - 6h)

### Objectif Principal

Créer un système de qualification des désaccords pour distinguer :
- **CAS A** : LLM correct, tag manuel incorrect → Corriger gold standard
- **CAS B** : Tag manuel correct, LLM incorrect → Améliorer prompt
- **CAS C** : Ambiguïté légitime → Clarifier philosophie

**Métrique Clé** : **Kappa Corrigé**
```
κ_corrigé = (accords + désaccords_justifiés) / (total - ambigus)
```

**Critère Optimisation** : Minimiser **CAS B** (erreurs LLM)

### Plan Détaillé Sprint 4 Base

**Phase 1 : Base de Données (2h)**
- Table `disagreement_validations`
- Fonction `calculate_corrected_kappa()`
- Enrichissement `level0_charte_tests`

**Phase 2 : Services TypeScript (2h)**
- `DisagreementValidationService.ts`
- Types interfaces
- Tests unitaires

**Phase 3 : Interface UI (2h)**
- `DisagreementValidationPanel.tsx`
- Intégration `Level0Interface.tsx`
- Workflow validation complet

**Voir détails complets** : Section "Sprint 4 - Plan Détaillé" ci-dessous

---

## 🚀 Sprint 4+ : Extensions (6h)

### Extension 1 : Re-Taggage Texte-Only (2h) ⭐ PRIORITÉ 1

**Problème Résolu** : Distinguer désaccords dus à modalité vs erreurs réelles

**Solution** : Créer 2ème gold standard manuel **TEXTE UNIQUEMENT**

**Workflow** :
1. Thomas re-tague paires en ignorant totalement la prosodie
2. Basé UNIQUEMENT sur texte verbatim
3. Sauvegardé comme `annotator_id='thomas_texte_only'`

**Résultat Attendu** :
```
κ(LLM_texte, Thomas_texte_only)  = 0.80-0.85 (excellent !)
κ(LLM_texte, Thomas_audio)       = 0.254 (actuel - faible)

Amélioration = +221% !
Impact prosodie mesuré = -0.55 points κ
```

**Hypothèse H4** : Les désaccords humain-LLM sont principalement dus à l'absence de modalité prosodique dans les LLM, pas à des erreurs de classification textuelle.

**Implémentation** :
- Interface `TextOnlyRetaggingInterface.tsx`
- Intégré dans `DisagreementValidationPanel`
- Quand validation CAS A → Proposer re-taggage texte-only immédiat

---

### Extension 2 : Comparateur Kappa Flexible (2h) ⭐ PRIORITÉ 1

**Problème Résolu** : Comparer n'importe quelle paire d'annotateurs dynamiquement

**Solution** : Interface avec 2 dropdowns pour sélectionner annotateurs

**Concept** :
```
Dropdown 1 : [Sélectionner Annotateur 1]
Dropdown 2 : [Sélectionner Annotateur 2]
Bouton     : [Calculer Kappa]
→ Résultats : κ, accuracy, matrice confusion, désaccords
```

**Annotateurs Disponibles** :
- Thomas (Texte + Audio) - 901 annotations
- Thomas (Texte Seul) - 0-50 annotations (à créer)
- LLM Texte (CharteY_A/B/C) - 10-50 annotations
- LLM Audio (GPT4o-audio) - 0-50 annotations (futur)

**Bénéfices** :
- ✅ Scalable infiniment (ajouter annotateur = juste annoter avec nouveau ID)
- ✅ Comparaisons illimitées
- ✅ Filtrage par variable (X/Y)
- ✅ Export CSV

**📖 Voir détails complets** : `SPECS_KAPPA_COMPARATOR.md`

---

### Extension 3 : Modalité Audio avec GPT-4o (2h) 🎙️ PRIORITÉ 2

**Problème Résolu** : Tester si LLM multimodal peut capturer la prosodie

**Solution** : Annoter avec GPT-4o Audio (texte + audio simultanément)

**Architecture** :
1. Extraction segments audio (ffmpeg + timestamps DB)
2. Envoi fichier WAV à GPT-4o Audio API
3. LLM analyse texte + ton + prosodie + émotion
4. Sauvegarde annotation `annotator_type='llm_openai_audio'`

**Coûts** :
- $0.06 / minute audio
- 901 paires × 22.5s moyenne = 338 minutes
- **Total : ~$21 pour tout le corpus** (très abordable)

**Hypothèse H5** : Un LLM multimodal atteint un accord similaire à un humain écoutant l'audio complet.

**Prédiction** :
```
κ(LLM_audio, Thomas_audio) = 0.70-0.80 (hypothèse)
κ(LLM_texte, Thomas_audio) = 0.254 (actuel)

Amélioration attendue = +178%
```

**📖 Voir détails complets** : `SPECS_MODALITE_AUDIO.md`

---

## 📊 Matrice Comparaisons Complète (Objectif Final)

| Comparaison | Kappa | Modalités | Interprétation |
|-------------|-------|-----------|----------------|
| LLM_texte vs Thomas_texte_only | **0.82** | Texte ↔ Texte | Excellent (même modalité) |
| LLM_audio vs Thomas_audio | **0.75** | Audio ↔ Audio | Bon (H5 validée) |
| LLM_texte vs Thomas_audio | 0.25 | Texte ↔ Audio | Faible (conflit modalité) |
| Thomas_texte vs Thomas_audio | 0.45 | Texte ↔ Audio | Modéré (impact prosodie) |

**Conclusion Scientifique Attendue** :
1. **H4 validée** : LLM texte excellent sur texte pur (κ=0.82)
2. **H5 validée** : LLM audio capture prosodie (κ=0.75)
3. **Impact prosodie mesuré** : -0.55 points Kappa
4. **LLM multimodal = solution** pour annotations audio futures

---

## 🗓️ Roadmap Session 2025-12-18

### Session Matin (3-4h)

**Sprint 4 Base - Phase 1 & 2** :
1. ✅ Créer table `disagreement_validations` (30min)
2. ✅ Créer fonction `calculate_corrected_kappa()` (30min)
3. ✅ Implémenter `DisagreementValidationService.ts` (1h)
4. ✅ Tester services (30min)
5. ✅ Commit "Sprint 4 Phase 1-2: DB & Services"

**Sprint 4+ Extension 1** :
6. ✅ Service `KappaCalculationService.compareAnyAnnotators()` (1h)
7. ✅ Fonction SQL `get_common_annotations()` (30min)
8. ✅ Tester comparaisons (30min)

---

### Session Après-midi (3-4h)

**Sprint 4 Base - Phase 3** :
1. ✅ Créer `DisagreementValidationPanel.tsx` (1.5h)
2. ✅ Intégrer `TextOnlyRetaggingInterface` (30min)
3. ✅ Tester workflow complet (30min)

**Sprint 4+ Extension 2** :
4. ✅ Créer `KappaComparator.tsx` (1h)
5. ✅ Tester toutes comparaisons (30min)
6. ✅ Valider 19 désaccords existants (30min)
7. ✅ Re-taguer 19 paires en mode texte-only (30min)
8. ✅ Calculer triple Kappa (30min)

**Résultat Fin Session** :
- Sprint 4 base complet ✅
- Re-taggage texte-only fait ✅
- Comparateur Kappa opérationnel ✅
- Triple comparaison documentée ✅

---

### Session Optionnelle Audio (2-3h)

**Sprint 4+ Extension 3** :
1. Extraire segments audio (1h)
2. Annoter 50 paires audio (1h)
3. Comparer κ(LLM_audio, Thomas_audio) (30min)
4. Documenter H5 (30min)

---

## 📋 Sprint 4 - Plan Détaillé (Base 6h)

### Phase 1 : Base de Données (2h)

#### 1.1 Table disagreement_validations

```sql
CREATE TABLE disagreement_validations (
  validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES level0_charte_tests(test_id),
  pair_id INTEGER REFERENCES analysis_pairs(pair_id),
  charte_id TEXT REFERENCES level0_chartes(charte_id),
  
  manual_tag TEXT NOT NULL,
  llm_tag TEXT NOT NULL,
  llm_confidence FLOAT,
  llm_reasoning TEXT,
  
  validation_decision TEXT CHECK (validation_decision IN (
    'llm_correct',      -- CAS A
    'manual_correct',   -- CAS B
    'ambiguous',        -- CAS C
    'pending'
  )) DEFAULT 'pending',
  
  validated_tag TEXT,
  validator_id TEXT NOT NULL,
  validation_comment TEXT NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  verbatim TEXT NOT NULL,
  context_before TEXT,
  context_after TEXT,
  
  UNIQUE (test_id, pair_id)
);
```

#### 1.2 Fonction calculate_corrected_kappa()

```sql
CREATE OR REPLACE FUNCTION calculate_corrected_kappa(p_test_id UUID)
RETURNS TABLE (
  kappa_brut FLOAT,
  kappa_corrected FLOAT,
  total_pairs INTEGER,
  agreements INTEGER,
  justified_disagreements INTEGER,
  unjustified_disagreements INTEGER,
  ambiguous_cases INTEGER,
  pending_validations INTEGER
) AS $$
-- Voir doc mission original pour implémentation complète
```

---

### Phase 2 : Services TypeScript (2h)

**Voir doc mission original** pour implémentation `DisagreementValidationService.ts`

**Méthodes principales** :
- `getPendingDisagreements(testId)`
- `validateDisagreement(id, decision, tag, comment)`
- `getCorrectedKappa(testId)`
- `getValidationStats(testId)`

---

### Phase 3 : Interface UI (2h)

**Voir doc mission original** pour implémentation `DisagreementValidationPanel.tsx`

**Workflow utilisateur** :
1. Voir désaccord (verbatim + contexte)
2. Comparer tag manuel vs LLM
3. Voir raisonnement LLM
4. Décider : CAS A / CAS B / CAS C
5. Justifier (obligatoire, min 10 caractères)
6. **🆕 Si CAS A** : Proposer re-taggage texte-only immédiat
7. Passer au suivant

---

## 📊 Métriques de Succès

### Sprint 4 Base

**Techniques** :
- ✅ Table `disagreement_validations` fonctionnelle
- ✅ Fonction `calculate_corrected_kappa()` opérationnelle
- ✅ Service `DisagreementValidationService` complet
- ✅ UI `DisagreementValidationPanel` fonctionnelle
- ✅ 19 désaccords qualifiés (CAS A/B/C)

**Scientifiques** :
- Kappa brut : 0.254
- Kappa corrigé attendu : >0.70
- Amélioration : >+175%

---

### Sprint 4+ Extensions

**Extension 1 : Re-Taggage Texte-Only** :
- ✅ 19 paires re-taguées en mode texte-only
- ✅ κ(LLM_texte, Thomas_texte_only) calculé
- ✅ Impact prosodie mesuré
- ✅ H4 validée

**Extension 2 : Comparateur Kappa** :
- ✅ Service `KappaCalculationService` complet
- ✅ UI `KappaComparator` opérationnelle
- ✅ 4+ comparaisons testées
- ✅ Export CSV fonctionnel

**Extension 3 : Audio** (optionnel) :
- ✅ 50 segments audio extraits
- ✅ 50 paires annotées audio
- ✅ κ(LLM_audio, Thomas_audio) calculé
- ✅ H5 testée

---

## 🎓 Contribution Scientifique

### Questions de Recherche

**Q1** : Quelle philosophie d'annotation maximise l'accord humain-LLM ?  
**Q2** : Quel est l'impact de la modalité prosodique sur l'accord inter-annotateurs ?  
**Q3** : Un LLM multimodal peut-il capturer la prosodie comme un humain ?

### Hypothèses Testées

**H4** (Sprint 4+) : Les désaccords humain-LLM sont principalement dus à l'absence de modalité prosodique dans les LLM.
- Test : κ(LLM_texte, Thomas_texte_only) >> κ(LLM_texte, Thomas_audio)
- Résultat attendu : 0.82 vs 0.25 → H4 validée ✅

**H5** (Sprint 4+) : Un LLM multimodal atteint un accord similaire à un humain écoutant l'audio.
- Test : κ(LLM_audio, Thomas_audio) ≈ κ(LLM_texte, Thomas_texte_only)
- Résultat attendu : 0.75 vs 0.82 → H5 partiellement validée ✅

### Publications Potentielles

**Article 1** : "Multi-Modal LLMs for Conversational Annotation: Comparing Text-Only vs Audio-Enabled Analysis"
- Contribution : Comparaison 4 modalités (Texte×2, Audio×2)
- Résultat : Impact prosodie quantifié (-0.55 points κ)
- Venue : ACL/EMNLP Workshop

**Chapitre Thèse** : "Niveau 0 : Validation Gold Standard Multi-Modalités"
- Méthodologie double/triple annotation
- Mesure impact prosodie
- Validation LLM multimodaux

---

## 📚 Documentation Technique

### Documents Références

**Specs Techniques Détaillées** :
1. **SPECS_KAPPA_COMPARATOR.md** (25 KB)
   - Service `KappaCalculationService` complet
   - UI `KappaComparator` complète
   - Exemples d'utilisation
   - Fonction SQL `get_common_annotations()`

2. **SPECS_MODALITE_AUDIO.md** (30 KB)
   - Architecture extraction audio (ffmpeg)
   - Service `OpenAIAudioAnnotationService`
   - Coûts détaillés ($0.024/paire)
   - Workflow complet

**Documents Sprint 3** :
- `mission-level0-SPECS-unified-annotations-v2.0.md` (98 KB)
- `FLUX_DONNEES_LEVEL0.md` (78 KB)

---

## ✅ Checklist Session 2025-12-18

### Préparation (15 min)

- [ ] Relire ce document
- [ ] Ouvrir `SPECS_KAPPA_COMPARATOR.md` (référence)
- [ ] Ouvrir `SPECS_MODALITE_AUDIO.md` (référence)
- [ ] Vérifier app fonctionne : `npm run dev`
- [ ] Vérifier 4 tests visibles
- [ ] Créer branche : `git checkout -b sprint4/validation-extensions`
- [ ] Ouvrir Supabase SQL Editor

---

### Sprint 4 Base (6h)

**Phase 1 : DB (2h)**
- [ ] Migration : Table `disagreement_validations`
- [ ] Migration : Fonction `calculate_corrected_kappa()`
- [ ] Migration : Enrichir `level0_charte_tests`
- [ ] Test SQL : Vérifier fonctions

**Phase 2 : Services (2h)**
- [ ] Service : `DisagreementValidationService.ts`
- [ ] Types : Interfaces validation
- [ ] Tests : Services unitaires

**Phase 3 : UI (2h)**
- [ ] UI : `DisagreementValidationPanel.tsx`
- [ ] Intégration : `Level0Interface.tsx`
- [ ] Test : Workflow complet
- [ ] Validation : Qualifier 5 désaccords test

---

### Sprint 4+ Extensions (6h)

**Extension 1 : Texte-Only (2h)**
- [ ] Service : `KappaCalculationService.compareAnyAnnotators()`
- [ ] SQL : Fonction `get_common_annotations()`
- [ ] UI : `TextOnlyRetaggingInterface` dans panel validation
- [ ] Test : Re-taguer 5 paires mode texte-only
- [ ] Calcul : κ(LLM_texte, Thomas_texte_only)

**Extension 2 : Comparateur (2h)**
- [ ] SQL : Fonction `get_available_annotators()`
- [ ] UI : `KappaComparator.tsx`
- [ ] Intégration : Nouvel onglet Level0Interface
- [ ] Test : 3+ comparaisons différentes
- [ ] Export : CSV résultats

**Extension 3 : Audio (2h - optionnel)**
- [ ] Service : `AudioExtractionService.ts`
- [ ] Service : `OpenAIAudioAnnotationService.ts`
- [ ] Extraction : 50 segments audio
- [ ] Annotation : 50 paires audio
- [ ] Calcul : κ(LLM_audio, Thomas_audio)

---

### Finalisation (1h)

- [ ] Documenter résultats dans README
- [ ] Commit : "Sprint 4 Complete: Validation + Extensions"
- [ ] Mettre à jour mission pour session suivante
- [ ] Célébrer ! 🎉

---

## 🗺️ Roadmap Sprints Suivants

### Sprint 5 : Corrections Techniques (2h)

**Objectifs** :
- Protection NaN dans calculs
- Normalisation tags LLM
- Unit tests complets
- Tests E2E

---

### Sprint 6 : Interface Comparaison (4h)

**Objectifs** :
- Tableau comparatif philosophies
- Charts évolution versions
- Dashboard synthèse Level 0
- Filtres dynamiques

---

### Sprint 7 : Documentation Thèse (3h)

**Objectifs** :
- Guide méthodologique complet
- Tables LaTeX résultats
- Figures & diagrammes
- Vidéo démo

---

## 🎊 Conclusion

**Sprint 4 + Extensions = Contribution Scientifique Majeure** 🌟

**Ce que nous allons accomplir** :
1. ✅ Système validation désaccords (Sprint 4 base)
2. ✅ Double annotation texte-only (Extension 1)
3. ✅ Comparateur Kappa flexible (Extension 2)
4. ✅ Test modalité audio LLM (Extension 3)

**Résultats Attendus** :
- 3 hypothèses testées (H4, H5, H6)
- 4+ articles potentiels
- Méthodologie reproductible
- Contribution thèse solide

**Prêt pour demain ?** 🚀

---

**Document créé** : 2025-12-17  
**Version** : 2.0  
**Pour session** : 2025-12-18  
**Sprints** : Sprint 4 Base + Extensions  
**Durée estimée** : 12 heures (2-3 sessions)  
**Objectif** : Validation désaccords + Multi-modalités + Comparateur Kappa opérationnels
