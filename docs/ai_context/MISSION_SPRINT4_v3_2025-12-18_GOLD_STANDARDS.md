# 📋 Mission Level 0 - Session 2025-12-18 (Sprint 4 v3 - Gold Standards Multiples)

## 🎯 Vue d'Ensemble

**Sprint 4 (Architecture Gold Standards)** : Gold standards multiples + Dérivation + Validation (8h)  
**Sprint 4+ (Extensions)** : Comparateur Kappa + Tests avancés (4h)

**Total estimé** : 12 heures (2-3 sessions)

---

## 🆕 Changement Architectural Majeur : Gold Standards Multiples

### Problème Identifié

**Architecture actuelle** (Sprint 3) :
```
analysis_pairs
├── level0_gold_conseiller: "ENGAGEMENT" ← UN SEUL gold standard
├── level0_gold_client: "CLIENT_POSITIF" ← UN SEUL gold standard
└── level0_validated_at, level0_notes, etc.
```

**Limitation** : Impossible de gérer plusieurs gold standards par paire (audio vs texte)

---

### Nouvelle Architecture

**Solution** : Table de jonction `pair_gold_standards`

```
gold_standards (métadonnées)
├── thomas_audio_x : "Thomas Audio (Stratégies X)", modality='audio'
├── thomas_audio_y : "Thomas Audio (Réactions Y)", modality='audio'
├── thomas_texte_y : "Thomas Texte (Réactions Y)", modality='text_only'
└── ...

level0_chartes (association charte → GS)
├── CharteY_A → gold_standard_id: 'thomas_audio_y'
├── CharteY_B → gold_standard_id: 'thomas_audio_y'
├── CharteY_C → gold_standard_id: 'thomas_texte_y'
└── ...

pair_gold_standards (valeurs réelles par paire)
├── Paire 3187 + thomas_audio_y → CLIENT_NEUTRE (v1)
├── Paire 3187 + thomas_audio_y → CLIENT_POSITIF (v2) ← Corrigé après test
├── Paire 3187 + thomas_texte_y → CLIENT_POSITIF (v1)
└── ...

annotations (historique tests LLM - inchangé)
├── pair_id: 3187, test_id: 'abc', annotator_id: 'CharteY_B_v1', reaction_tag: 'CLIENT_POSITIF'
└── ...
```

---

## 📊 Flux Complet : Test et Validation

### Étape 1 : AVANT le test - Préparation Gold Standard

```
Thomas crée Gold Standard Audio (actuel)
├── Écoute 901 appels avec audio
└── Annote dans pair_gold_standards
    ├── pair_id: 3187, gold_standard_id: 'thomas_audio_y', reaction_gold_tag: 'CLIENT_NEUTRE', version: 1
    └── ...
```

### Étape 2 : PENDANT le test - Exécution

```
Test CharteY_B lancé
├── Charte CharteY_B → gold_standard_id: 'thomas_audio_y'
│
Pour chaque paire :
├── 1. LLM annote → CLIENT_POSITIF (stocké dans annotations)
├── 2. Récupère gold standard : thomas_audio_y → CLIENT_NEUTRE
├── 3. Compare : POSITIF ≠ NEUTRE → Désaccord !
└── 4. Enregistre dans test results

Résultat Test :
├── Kappa brut : 0.87
├── Accords : 882
└── Désaccords : 19
```

### Étape 3 : APRÈS le test - Validation

```
Thomas examine désaccord pair_id 3187
├── Verbatim : "d'accord"
├── Gold Standard (audio) : CLIENT_NEUTRE
├── LLM : CLIENT_POSITIF
└── Réécoute audio

Décision : CAS A (LLM correct)
├── 1. Valide dans disagreement_validations
├── 2. CORRIGE le gold standard :
│   ├── Désactive : pair_id 3187, thomas_audio_y, version 1, is_current=false
│   └── Crée : pair_id 3187, thomas_audio_y, reaction_gold_tag='CLIENT_POSITIF', version 2, is_current=true
└── 3. Recalcule métriques test

Résultat après correction :
├── Kappa corrigé : 0.88 (désaccord → accord)
└── Historique : 2 versions du gold standard conservées
```

---

## 🔄 Flux Innovation : Création Gold Standard par Dérivation

### Problème

❌ Thomas veut créer un gold standard "texte seul" mais ne veut pas ré-annoter 901 paires (10-15h)

### Solution : Dérivation depuis un test existant

**Concept** : Copier les accords, ré-annoter SEULEMENT les désaccords

```
Étape 1 : Partir du Test CharteY_B (882 accords / 19 désaccords)

Étape 2 : Copie automatique des accords
├── 882 paires où LLM = Gold Standard Audio
└── Copier dans nouveau gold standard "thomas_texte_y"
    └── pair_gold_standards.insert({
          pair_id: X,
          gold_standard_id: 'thomas_texte_y',
          reaction_gold_tag: (même valeur que thomas_audio_y),
          version: 1,
          validation_notes: "Copied from agreement Test CharteY_B"
        })

Étape 3 : Ré-annotation manuelle des 19 désaccords
├── Interface affiche paire par paire
├── Thomas lit SANS écouter audio (mode texte seul)
├── Annote chaque désaccord
└── Enregistre dans pair_gold_standards

Résultat :
├── Nouveau gold standard "thomas_texte_y" complet (901 paires)
├── Temps de création : 30 minutes (vs 15 heures)
└── Réutilisation : 98% des paires copiées automatiquement
```

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

### Découverte Critique Sprint 3 : Modalité Audio vs Texte

**Problème identifié** :
```
Pair 3187: "d'accord" [ton désabusé à l'écoute]

Gold Standard Thomas (audio+texte) : CLIENT_NEUTRE (prosodie détectée)
CharteY_B LLM (texte seul) : CLIENT_POSITIF (texte littéral)

Question : Qui a tort ?
→ AUCUN ! Modalités différentes, désaccord légitime.
```

**Conclusion** : Nécessité de gérer PLUSIEURS gold standards (audio, texte, etc.)

---

## 🎯 Sprint 4 v3 : Architecture Gold Standards Multiples (8h)

### Objectifs Principaux

1. **Gérer plusieurs gold standards par paire** (audio, texte, etc.)
2. **Associer chaque charte à SON gold standard**
3. **Créer de nouveaux gold standards par dérivation** (copie accords + re-taggage désaccords)
4. **Historiser les corrections** de gold standards (versioning)
5. **Valider les désaccords** avec workflow CAS A/B/C

---

### Phase 1 : Base de Données (3h)

#### 1.1 Migration : Tables Gold Standards

**Fichier** : `migrations/006_gold_standards_multiple.sql`

```sql
-- ===================================
-- Table 1 : gold_standards (métadonnées)
-- ===================================
CREATE TABLE gold_standards (
  gold_standard_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  modality TEXT NOT NULL CHECK (modality IN ('audio', 'text_only', 'audio_text')),
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  
  annotator_name TEXT,
  methodology_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gold standards initiaux (migrés depuis analysis_pairs)
INSERT INTO gold_standards VALUES
('thomas_audio_x', 'Thomas Audio (Stratégies X)', 'Annotations manuelles avec écoute audio complète', 'audio', 'X', 'Thomas', 'Gold standard initial migré depuis analysis_pairs.strategy_tag', NOW()),
('thomas_audio_y', 'Thomas Audio (Réactions Y)', 'Annotations manuelles avec écoute audio complète', 'audio', 'Y', 'Thomas', 'Gold standard initial migré depuis analysis_pairs.reaction_tag', NOW());


-- ===================================
-- Table 2 : pair_gold_standards (valeurs par paire)
-- ===================================
CREATE TABLE pair_gold_standards (
  pair_gold_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id INTEGER NOT NULL REFERENCES analysis_pairs(pair_id),
  gold_standard_id TEXT NOT NULL REFERENCES gold_standards(gold_standard_id),
  
  -- Tags validés (un seul rempli selon variable)
  strategy_gold_tag TEXT,  -- Pour variable X
  reaction_gold_tag TEXT,  -- Pour variable Y
  
  -- Métadonnées validation
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  validated_by TEXT DEFAULT 'Thomas',
  validation_notes TEXT,
  confidence NUMERIC,
  
  -- Versioning (pour historiser corrections)
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  UNIQUE(pair_id, gold_standard_id, version)
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_pair_gs_current 
ON pair_gold_standards(pair_id, gold_standard_id, is_current)
WHERE is_current = true;


-- ===================================
-- Migration des données existantes
-- ===================================

-- Migrer strategy_tag (Variable X)
INSERT INTO pair_gold_standards (
  pair_id, 
  gold_standard_id, 
  strategy_gold_tag,
  validated_at,
  validated_by,
  validation_notes
)
SELECT 
  pair_id,
  'thomas_audio_x',
  level0_gold_conseiller,
  level0_validated_at,
  level0_validated_by,
  level0_notes
FROM analysis_pairs
WHERE level0_gold_conseiller IS NOT NULL;

-- Migrer reaction_tag (Variable Y)
INSERT INTO pair_gold_standards (
  pair_id, 
  gold_standard_id, 
  reaction_gold_tag,
  validated_at,
  validated_by,
  validation_notes
)
SELECT 
  pair_id,
  'thomas_audio_y',
  level0_gold_client,
  level0_validated_at,
  level0_validated_by,
  level0_notes
FROM analysis_pairs
WHERE level0_gold_client IS NOT NULL;


-- ===================================
-- Ajouter colonne dans level0_chartes
-- ===================================
ALTER TABLE level0_chartes
ADD COLUMN gold_standard_id TEXT REFERENCES gold_standards(gold_standard_id);

-- Associer chartes existantes au gold standard audio
UPDATE level0_chartes 
SET gold_standard_id = 'thomas_audio_x' 
WHERE variable = 'X';

UPDATE level0_chartes 
SET gold_standard_id = 'thomas_audio_y' 
WHERE variable = 'Y';
```

---

#### 1.2 Migration : Table disagreement_validations

**Fichier** : `migrations/007_disagreement_validations.sql`

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
  
  validation_decision TEXT NOT NULL CHECK (validation_decision IN (
    'CAS_A_LLM_CORRECT',
    'CAS_B_LLM_INCORRECT',
    'CAS_C_AMBIGUOUS'
  )),
  
  corrected_tag TEXT,
  validation_comment TEXT NOT NULL CHECK (LENGTH(validation_comment) >= 10),
  validated_by TEXT DEFAULT 'Thomas',
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  verbatim TEXT NOT NULL,
  context_before TEXT,
  context_after TEXT,
  
  UNIQUE (test_id, pair_id)
);

CREATE INDEX idx_disagreement_validations_test 
ON disagreement_validations(test_id);

CREATE INDEX idx_disagreement_validations_decision 
ON disagreement_validations(validation_decision);
```

---

#### 1.3 Fonction : calculate_corrected_kappa()

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
  pending_validations INTEGER,
  cas_a_count INTEGER,
  cas_b_count INTEGER,
  cas_c_count INTEGER
) AS $$
DECLARE
  v_test RECORD;
  v_agreements INTEGER;
  v_total INTEGER;
  v_cas_a INTEGER;
  v_cas_b INTEGER;
  v_cas_c INTEGER;
  v_pending INTEGER;
BEGIN
  -- Récupérer le test
  SELECT * INTO v_test FROM level0_charte_tests WHERE test_id = p_test_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found: %', p_test_id;
  END IF;
  
  v_total := v_test.total_pairs;
  v_agreements := v_total - v_test.disagreements_count;
  
  -- Compter les validations
  SELECT 
    COUNT(*) FILTER (WHERE validation_decision = 'CAS_A_LLM_CORRECT'),
    COUNT(*) FILTER (WHERE validation_decision = 'CAS_B_LLM_INCORRECT'),
    COUNT(*) FILTER (WHERE validation_decision = 'CAS_C_AMBIGUOUS')
  INTO v_cas_a, v_cas_b, v_cas_c
  FROM disagreement_validations
  WHERE test_id = p_test_id;
  
  v_pending := v_test.disagreements_count - (v_cas_a + v_cas_b + v_cas_c);
  
  -- Calculs
  -- CAS A : LLM correct → devient accord
  -- CAS B : LLM incorrect → reste désaccord justifié
  -- CAS C : Ambigu → exclu du calcul
  
  RETURN QUERY SELECT
    v_test.kappa AS kappa_brut,
    CASE 
      WHEN (v_total - v_cas_c) = 0 THEN NULL
      ELSE (v_agreements + v_cas_a)::FLOAT / (v_total - v_cas_c)
    END AS kappa_corrected,
    v_total AS total_pairs,
    v_agreements AS agreements,
    v_cas_b AS justified_disagreements,
    (v_pending + v_cas_b) AS unjustified_disagreements,
    v_cas_c AS ambiguous_cases,
    v_pending AS pending_validations,
    v_cas_a AS cas_a_count,
    v_cas_b AS cas_b_count,
    v_cas_c AS cas_c_count;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 2 : Services TypeScript (3h)

#### 2.1 Service : GoldStandardService

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/GoldStandardService.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface GoldStandard {
  gold_standard_id: string;
  name: string;
  description: string;
  modality: 'audio' | 'text_only' | 'audio_text';
  variable: 'X' | 'Y';
  annotator_name: string;
  methodology_notes?: string;
  created_at: string;
}

export interface PairGoldStandard {
  pair_gold_id: string;
  pair_id: number;
  gold_standard_id: string;
  strategy_gold_tag?: string;
  reaction_gold_tag?: string;
  validated_at: string;
  validated_by: string;
  validation_notes?: string;
  version: number;
  is_current: boolean;
}

export class GoldStandardService {
  
  /**
   * Récupérer tous les gold standards
   */
  static async getAllGoldStandards(): Promise<GoldStandard[]> {
    const { data, error } = await supabase
      .from('gold_standards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Récupérer un gold standard par ID
   */
  static async getGoldStandard(goldStandardId: string): Promise<GoldStandard | null> {
    const { data, error } = await supabase
      .from('gold_standards')
      .select('*')
      .eq('gold_standard_id', goldStandardId)
      .single();
    
    if (error) return null;
    return data;
  }
  
  /**
   * Récupérer le gold standard actuel pour une paire
   */
  static async getGoldStandardForPair(
    pairId: number,
    goldStandardId: string
  ): Promise<{
    strategy_gold_tag?: string;
    reaction_gold_tag?: string;
    validated_at: string;
    version: number;
  } | null> {
    
    const { data, error } = await supabase
      .from('pair_gold_standards')
      .select('*')
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('is_current', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  }
  
  /**
   * Récupérer TOUS les gold standards pour une paire
   */
  static async getAllGoldStandardsForPair(
    pairId: number,
    variable: 'X' | 'Y'
  ): Promise<Array<{
    gold_standard_id: string;
    gold_standard_name: string;
    tag: string;
    modality: string;
    version: number;
  }>> {
    
    const tagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
    
    const { data, error } = await supabase
      .from('pair_gold_standards')
      .select(`
        gold_standard_id,
        ${tagColumn},
        version,
        gold_standards!inner(name, modality)
      `)
      .eq('pair_id', pairId)
      .eq('is_current', true)
      .not(tagColumn, 'is', null);
    
    if (error) throw error;
    
    return (data || []).map(row => ({
      gold_standard_id: row.gold_standard_id,
      gold_standard_name: row.gold_standards.name,
      tag: row[tagColumn],
      modality: row.gold_standards.modality,
      version: row.version
    }));
  }
  
  /**
   * Corriger un gold standard (après validation CAS A)
   */
  static async correctGoldStandard(
    pairId: number,
    goldStandardId: string,
    variable: 'X' | 'Y',
    newTag: string,
    validationNotes: string
  ): Promise<void> {
    
    const tagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
    
    // 1. Récupérer version actuelle
    const { data: current, error: fetchError } = await supabase
      .from('pair_gold_standards')
      .select('*')
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('is_current', true)
      .single();
    
    if (fetchError || !current) {
      throw new Error('Gold standard not found for this pair');
    }
    
    // 2. Désactiver ancienne version
    const { error: updateError } = await supabase
      .from('pair_gold_standards')
      .update({ is_current: false })
      .eq('pair_gold_id', current.pair_gold_id);
    
    if (updateError) throw updateError;
    
    // 3. Créer nouvelle version
    const { error: insertError } = await supabase
      .from('pair_gold_standards')
      .insert({
        pair_id: pairId,
        gold_standard_id: goldStandardId,
        [tagColumn]: newTag,
        version: current.version + 1,
        is_current: true,
        validated_by: 'Thomas',
        validation_notes: validationNotes
      });
    
    if (insertError) throw insertError;
  }
  
  /**
   * Créer un nouveau gold standard par dérivation
   */
  static async createByDerivation(
    newGoldStandardId: string,
    newGoldStandardMetadata: {
      name: string;
      description: string;
      modality: string;
      variable: 'X' | 'Y';
    },
    sourceTestId: string
  ): Promise<{
    copiedCount: number;
    toReviewCount: number;
    pairsToReview: number[];
  }> {
    
    // 1. Créer le nouveau gold standard
    const { error: createError } = await supabase
      .from('gold_standards')
      .insert({
        gold_standard_id: newGoldStandardId,
        ...newGoldStandardMetadata,
        methodology_notes: `Créé par dérivation depuis test ${sourceTestId}`,
        annotator_name: 'Thomas'
      });
    
    if (createError) throw createError;
    
    // 2. Récupérer le test source
    const { data: test, error: testError } = await supabase
      .from('level0_charte_tests')
      .select('*, level0_chartes!inner(*)')
      .eq('test_id', sourceTestId)
      .single();
    
    if (testError) throw testError;
    
    const sourceGoldStandardId = test.level0_chartes.gold_standard_id;
    const variable = test.level0_chartes.variable;
    const tagColumn = variable === 'X' ? 'strategy_tag' : 'reaction_tag';
    const goldTagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
    
    // 3. Récupérer annotations du test
    const { data: annotations, error: annError } = await supabase
      .from('annotations')
      .select('*')
      .eq('test_id', sourceTestId);
    
    if (annError) throw annError;
    
    // 4. Récupérer gold standards source
    const { data: sourceGoldStandards, error: gsError } = await supabase
      .from('pair_gold_standards')
      .select('*')
      .eq('gold_standard_id', sourceGoldStandardId)
      .eq('is_current', true);
    
    if (gsError) throw gsError;
    
    // 5. Identifier accords et désaccords
    const agreements: any[] = [];
    const disagreements: number[] = [];
    
    for (const annotation of annotations || []) {
      const llmTag = annotation[tagColumn];
      
      const goldStandard = sourceGoldStandards?.find(
        gs => gs.pair_id === annotation.pair_id
      );
      const goldTag = goldStandard?.[goldTagColumn];
      
      if (llmTag === goldTag) {
        // Accord : copie automatique
        agreements.push({
          pair_id: annotation.pair_id,
          [goldTagColumn]: goldTag
        });
      } else {
        // Désaccord : à ré-annoter
        disagreements.push(annotation.pair_id);
      }
    }
    
    // 6. Copier les accords
    if (agreements.length > 0) {
      const { error: copyError } = await supabase
        .from('pair_gold_standards')
        .insert(
          agreements.map(ag => ({
            pair_id: ag.pair_id,
            gold_standard_id: newGoldStandardId,
            [goldTagColumn]: ag[goldTagColumn],
            validated_by: 'System (copied from agreement)',
            validation_notes: `Copied from test ${sourceTestId} (agreement)`,
            version: 1,
            is_current: true
          }))
        );
      
      if (copyError) throw copyError;
    }
    
    return {
      copiedCount: agreements.length,
      toReviewCount: disagreements.length,
      pairsToReview: disagreements
    };
  }
  
  /**
   * Vérifier complétude d'un gold standard
   */
  static async checkCompleteness(
    goldStandardId: string
  ): Promise<{
    isComplete: boolean;
    totalPairs: number;
    annotatedPairs: number;
    missingPairs: number[];
  }> {
    
    // Total de paires
    const { count: totalPairs } = await supabase
      .from('analysis_pairs')
      .select('pair_id', { count: 'exact', head: true });
    
    // Paires annotées
    const { data: annotated } = await supabase
      .from('pair_gold_standards')
      .select('pair_id')
      .eq('gold_standard_id', goldStandardId)
      .eq('is_current', true);
    
    const annotatedPairIds = new Set(annotated?.map(a => a.pair_id) || []);
    
    // Paires manquantes
    const { data: allPairs } = await supabase
      .from('analysis_pairs')
      .select('pair_id');
    
    const missingPairs = (allPairs || [])
      .filter(p => !annotatedPairIds.has(p.pair_id))
      .map(p => p.pair_id);
    
    return {
      isComplete: missingPairs.length === 0,
      totalPairs: totalPairs || 0,
      annotatedPairs: annotatedPairIds.size,
      missingPairs
    };
  }
}
```

---

#### 2.2 Service : DisagreementValidationService

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/DisagreementValidationService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { GoldStandardService } from './GoldStandardService';

export interface DisagreementValidation {
  validation_id: string;
  test_id: string;
  pair_id: number;
  charte_id: string;
  manual_tag: string;
  llm_tag: string;
  llm_confidence?: number;
  llm_reasoning?: string;
  validation_decision: 'CAS_A_LLM_CORRECT' | 'CAS_B_LLM_INCORRECT' | 'CAS_C_AMBIGUOUS';
  corrected_tag?: string;
  validation_comment: string;
  validated_by: string;
  validated_at: string;
  verbatim: string;
  context_before?: string;
  context_after?: string;
}

export class DisagreementValidationService {
  
  /**
   * Valider un désaccord et optionnellement corriger le gold standard
   */
  static async validateDisagreement(
    testId: string,
    pairId: number,
    decision: 'CAS_A_LLM_CORRECT' | 'CAS_B_LLM_INCORRECT' | 'CAS_C_AMBIGUOUS',
    comment: string,
    correctedTag?: string
  ): Promise<void> {
    
    // 1. Récupérer le test et la charte
    const { data: test, error: testError } = await supabase
      .from('level0_charte_tests')
      .select('*, level0_chartes!inner(*)')
      .eq('test_id', testId)
      .single();
    
    if (testError) throw testError;
    
    const charte = test.level0_chartes;
    const goldStandardId = charte.gold_standard_id;
    const variable = charte.variable;
    
    // 2. Récupérer l'annotation LLM
    const { data: llmAnnotation, error: annError } = await supabase
      .from('annotations')
      .select('*')
      .eq('test_id', testId)
      .eq('pair_id', pairId)
      .single();
    
    if (annError) throw annError;
    
    const tagColumn = variable === 'X' ? 'strategy_tag' : 'reaction_tag';
    const llmTag = llmAnnotation[tagColumn];
    
    // 3. Récupérer le gold standard actuel
    const goldStandard = await GoldStandardService.getGoldStandardForPair(pairId, goldStandardId);
    const goldTagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
    const manualTag = goldStandard?.[goldTagColumn];
    
    // 4. Récupérer la paire pour verbatim
    const { data: pair, error: pairError } = await supabase
      .from('analysis_pairs')
      .select('*')
      .eq('pair_id', pairId)
      .single();
    
    if (pairError) throw pairError;
    
    // 5. Enregistrer la validation
    const { error: valError } = await supabase
      .from('disagreement_validations')
      .insert({
        test_id: testId,
        pair_id: pairId,
        charte_id: charte.charte_id,
        manual_tag: manualTag,
        llm_tag: llmTag,
        llm_confidence: llmAnnotation.confidence,
        llm_reasoning: llmAnnotation.reasoning,
        validation_decision: decision,
        corrected_tag: correctedTag || llmTag,
        validation_comment: comment,
        validated_by: 'Thomas',
        verbatim: variable === 'Y' ? pair.client_verbatim : pair.conseiller_verbatim,
        context_before: pair.prev1_verbatim,
        context_after: pair.next1_verbatim
      });
    
    if (valError) throw valError;
    
    // 6. Si CAS A, corriger le gold standard
    if (decision === 'CAS_A_LLM_CORRECT') {
      await GoldStandardService.correctGoldStandard(
        pairId,
        goldStandardId,
        variable,
        llmTag,
        `CAS A validé - Test ${testId} - ${comment}`
      );
    }
    
    // 7. Recalculer les métriques du test
    await this.recalculateTestMetrics(testId);
  }
  
  /**
   * Recalculer les métriques d'un test après validations
   */
  static async recalculateTestMetrics(testId: string): Promise<void> {
    const { data, error } = await supabase
      .rpc('calculate_corrected_kappa', { p_test_id: testId })
      .single();
    
    if (error) throw error;
    
    // Mettre à jour le test
    await supabase
      .from('level0_charte_tests')
      .update({
        kappa_corrected: data.kappa_corrected,
        validated_disagreements: data.cas_a_count,
        unjustified_disagreements: data.cas_b_count
      })
      .eq('test_id', testId);
  }
  
  /**
   * Récupérer les désaccords en attente de validation
   */
  static async getPendingDisagreements(testId: string): Promise<any[]> {
    const { data: test, error: testError } = await supabase
      .from('level0_charte_tests')
      .select('disagreements')
      .eq('test_id', testId)
      .single();
    
    if (testError) throw testError;
    
    const disagreements = (test.disagreements as any[]) || [];
    
    // Filtrer ceux déjà validés
    const { data: validated } = await supabase
      .from('disagreement_validations')
      .select('pair_id')
      .eq('test_id', testId);
    
    const validatedIds = new Set(validated?.map(v => v.pair_id) || []);
    
    return disagreements.filter(d => !validatedIds.has(d.pair_id));
  }
}
```

---

### Phase 3 : Interface UI (2h)

#### 3.1 Composant : GoldStandardManager

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/GoldStandardManager.tsx`

```typescript
// Interface de gestion des gold standards
// - Liste des gold standards
// - Création nouveau gold standard
// - Création par dérivation
// - Statistiques complétude
```

#### 3.2 Composant : DerivationWizard

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/DerivationWizard.tsx`

```typescript
// Wizard de création par dérivation
// - Sélection test source
// - Configuration nouveau GS
// - Copie automatique accords
// - Interface re-taggage désaccords
// - Validation finale
```

#### 3.3 Composant : DisagreementValidationPanel

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/DisagreementValidationPanel.tsx`

```typescript
// Panel de validation des désaccords
// - Affichage désaccord (verbatim + contexte)
// - Comparaison manuel vs LLM
// - Décision CAS A/B/C
// - Justification obligatoire
// - Correction automatique gold standard si CAS A
```

---

## 📋 Checklist Détaillée Sprint 4 v3

### Phase 1 : Base de Données (3h) ⏱️

- [ ] **Migration 006** : Tables gold standards
  - [ ] Créer `gold_standards` (métadonnées)
  - [ ] Créer `pair_gold_standards` (valeurs par paire)
  - [ ] Migrer données depuis `analysis_pairs`
  - [ ] Ajouter colonne `gold_standard_id` dans `level0_chartes`
  - [ ] Tester migration sur 10 paires

- [ ] **Migration 007** : Table disagreement_validations
  - [ ] Créer table avec contraintes
  - [ ] Créer index
  - [ ] Tester insertion validation

- [ ] **Fonction SQL** : calculate_corrected_kappa()
  - [ ] Implémenter fonction
  - [ ] Tester sur test existant
  - [ ] Vérifier calculs (CAS A/B/C)

- [ ] **Commit** : "Migration 006-007: Gold Standards Architecture"

---

### Phase 2 : Services TypeScript (3h) ⏱️

- [ ] **GoldStandardService** (1.5h)
  - [ ] getAllGoldStandards()
  - [ ] getGoldStandardForPair()
  - [ ] getAllGoldStandardsForPair()
  - [ ] correctGoldStandard()
  - [ ] createByDerivation()
  - [ ] checkCompleteness()
  - [ ] Tests unitaires

- [ ] **DisagreementValidationService** (1.5h)
  - [ ] validateDisagreement()
  - [ ] recalculateTestMetrics()
  - [ ] getPendingDisagreements()
  - [ ] Tests unitaires

- [ ] **Commit** : "Services: GoldStandard + DisagreementValidation"

---

### Phase 3 : Interface UI (2h) ⏱️

- [ ] **GoldStandardManager** (1h)
  - [ ] Liste gold standards
  - [ ] Statistiques complétude
  - [ ] Bouton création nouveau GS

- [ ] **DerivationWizard** (30min)
  - [ ] Sélection test source
  - [ ] Configuration nouveau GS
  - [ ] Lancement dérivation

- [ ] **DisagreementValidationPanel** (30min)
  - [ ] Affichage désaccord
  - [ ] Boutons CAS A/B/C
  - [ ] Justification obligatoire

- [ ] **Commit** : "UI: Gold Standards Management Complete"

---

## 🎯 Statut d'Avancement

### ✅ Complété (Sprint 3)

- Architecture base chartes ✅
- Tests sur 10 paires ✅
- Identification 19 désaccords ✅
- Découverte problème modalités ✅

### 🚧 En Cours (Sprint 4 v3)

**Phase 1 - Base de Données** :
- [ ] Migration gold standards (0/3)
- [ ] Migration disagreement_validations (0/1)
- [ ] Fonction calculate_corrected_kappa (0/1)

**Phase 2 - Services** :
- [ ] GoldStandardService (0/1)
- [ ] DisagreementValidationService (0/1)

**Phase 3 - UI** :
- [ ] GoldStandardManager (0/1)
- [ ] DerivationWizard (0/1)
- [ ] DisagreementValidationPanel (0/1)

### 📅 Planifié (Sprint 4+)

- Comparateur Kappa flexible
- Tests avancés multi-modalités
- Documentation thèse

---

## 🎓 Contribution Scientifique

### Hypothèses Testées

**H4** : Les désaccords humain-LLM sont dus aux modalités différentes
- Test : Créer GS texte seul → κ(LLM_texte, Thomas_texte) >> κ(LLM_texte, Thomas_audio)
- Méthode : Dérivation depuis Test CharteY_B
- Résultat attendu : 0.82 vs 0.25 → +227%

**H5** : Multiple gold standards améliorent la validation
- Test : Chaque charte liée à son GS approprié
- Méthode : Architecture gold standards multiples
- Résultat : Validation scientifiquement rigoureuse

---

## 📊 Métriques de Succès

### Techniques

- [ ] 2+ gold standards créés (audio, texte)
- [ ] 19 désaccords validés (CAS A/B/C)
- [ ] Kappa corrigé calculé (>0.70)
- [ ] 1 gold standard créé par dérivation (30 min vs 15h)
- [ ] Architecture scalable (N gold standards)

### Scientifiques

- [ ] H4 validée (impact modalité quantifié)
- [ ] Méthodologie reproductible documentée
- [ ] Contribution thèse solide

---

## 🗓️ Planning Session 2025-12-18

### Matin (4h)

1. Migration 006 : Gold Standards (1.5h)
2. Migration 007 : Disagreement Validations (30min)
3. GoldStandardService (1.5h)
4. Tests services (30min)

### Après-midi (4h)

1. DisagreementValidationService (1.5h)
2. GoldStandardManager UI (1h)
3. DerivationWizard UI (1h)
4. DisagreementValidationPanel UI (30min)

---

**Document créé** : 2025-12-18  
**Version** : 3.0  
**Changement majeur** : Architecture gold standards multiples + Création par dérivation  
**Durée estimée** : 8 heures (Sprint 4 v3)  
**Objectif** : Gold standards multiples opérationnels + Validation désaccords fonctionnelle
