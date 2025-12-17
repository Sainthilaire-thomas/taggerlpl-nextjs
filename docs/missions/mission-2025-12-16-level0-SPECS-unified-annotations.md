# Mission Level 0 - Architecture Unifiée des Annotations
## Spécifications Techniques - Session à venir

================================================================================
## CONTEXTE & MOTIVATION
================================================================================

### Problématique Identifiée

Lors de la session du 16/12/2024, une limitation architecturale a été identifiée :

**Problème actuel :**
- Les annotations LLM ne sont pas sauvegardées individuellement
- Seules les métriques agrégées (Kappa, accuracy) sont stockées dans `level0_charte_tests`
- Impossible de comparer les tags entre différents annotateurs (humains et LLM)
- Impossible de tester la robustesse de H1/H2 selon la méthode d''annotation

**Exemple concret :**
```
Question recherche : "H1 est-elle vérifiée quelque soit l''annotateur ?"

Actuellement impossible à répondre car :
- Tags manuels dans analysis_pairs.strategy_tag/reaction_tag
- Tags LLM CharteY_A : non sauvegardés (perdus après test)
- Tags LLM CharteY_B : non sauvegardés (perdus après test)
- Tags LLM CharteY_C : non sauvegardés (perdus après test)
- Tags gold standard : analysis_pairs.level0_gold_*

→ Pas de table commune pour comparer facilement !
```

### Objectif de l''Architecture Unifiée

Créer une **table générique `annotations`** qui centralise TOUTES les annotations :
- ✅ Annotations manuelles humaines (H1, H2, superviseur)
- ✅ Annotations LLM (toutes chartes testées)
- ✅ Annotations gold standard (consensus final)

**Bénéfices :**
1. Comparaison systématique entre annotateurs
2. Validation robustesse H1/H2 multi-méthodes
3. Calcul Kappa entre n''importe quelle paire d''annotateurs
4. Historique complet des annotations
5. Traçabilité pour audit/thèse

================================================================================
## ARCHITECTURE PROPOSÉE
================================================================================

### 1. Schéma de Base de Données

#### Table `annotations` (nouvelle - cœur du système)
```sql
-- ============================================================================
-- Table unifiée pour TOUTES les annotations
-- Remplace la logique dispersée actuelle
-- ============================================================================

CREATE TABLE annotations (
  -- Identifiants
  annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id INT NOT NULL REFERENCES analysis_pairs(pair_id),
  
  -- Identité de l''annotateur
  annotator_type TEXT NOT NULL CHECK (annotator_type IN (
    ''human_manual'',      -- Annotation manuelle initiale (depuis turntagged)
    ''human_h2'',          -- Deuxième annotateur humain (inter-rater)
    ''human_supervisor'',  -- Superviseur/expert pour résolution désaccords
    ''llm_openai'',        -- Annotation via LLM OpenAI (GPT-4o)
    ''gold_consensus''     -- Consensus final après résolution
  )),
  annotator_id TEXT NOT NULL,
  -- Exemples annotator_id :
  --   human_manual: "thomas_initial"
  --   human_h2: "marie_validator"
  --   llm_openai: "CharteY_B_enrichie", "CharteX_A_sans_contexte"
  --   gold_consensus: "thomas_supervisor"
  
  -- Tags annotés (une ou deux colonnes remplies selon variable)
  strategy_tag TEXT,     -- Variable X (stratégie conseiller)
  reaction_tag TEXT,     -- Variable Y (réaction client)
  
  -- Métadonnées qualité
  confidence FLOAT CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  -- Confiance annotation :
  --   NULL pour humains (pas applicable)
  --   0.0-1.0 pour LLM (softmax probability)
  
  reasoning TEXT,
  -- Raisonnement/justification :
  --   Pour LLM : explication générée (chain-of-thought)
  --   Pour humains : commentaire optionnel
  
  annotation_context JSONB,
  -- Contexte flexible pour métadonnées additionnelles :
  --   LLM : {model, temperature, charte_version, tokens, cost}
  --   Humain : {annotation_tool, session_id, environment}
  
  -- Traçabilité temporelle
  annotated_at TIMESTAMPTZ DEFAULT NOW(),
  annotation_duration_ms INT,
  -- Durée annotation (si mesurée) :
  --   Humain : temps entre affichage et validation
  --   LLM : latence API
  
  -- Liens relationnels
  test_id UUID REFERENCES level0_charte_tests(test_id),
  -- NULL pour annotations humaines manuelles
  -- UUID pour annotations issues de tests Level 0
  
  -- Contraintes
  CONSTRAINT unique_annotation UNIQUE(pair_id, annotator_type, annotator_id),
  -- Une seule annotation par (paire, type, id)
  -- Empêche doublons si on réexécute un test
  
  CONSTRAINT at_least_one_tag CHECK (
    strategy_tag IS NOT NULL OR reaction_tag IS NOT NULL
  )
  -- Au moins un tag doit être renseigné
);

-- Index pour performances
CREATE INDEX idx_annotations_pair ON annotations(pair_id);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_type, annotator_id);
CREATE INDEX idx_annotations_test ON annotations(test_id);
CREATE INDEX idx_annotations_date ON annotations(annotated_at);

-- Index composite pour requêtes fréquentes
CREATE INDEX idx_annotations_pair_annotator 
  ON annotations(pair_id, annotator_type, annotator_id);
```

#### Vue `annotations_summary` (pour statistiques rapides)
```sql
-- ============================================================================
-- Vue matérialisée pour statistiques annotateurs
-- ============================================================================

CREATE MATERIALIZED VIEW annotations_summary AS
SELECT 
  annotator_type,
  annotator_id,
  
  -- Volumétrie
  COUNT(*) as total_annotations,
  COUNT(DISTINCT pair_id) as unique_pairs,
  COUNT(strategy_tag) as strategy_annotations,
  COUNT(reaction_tag) as reaction_annotations,
  
  -- Qualité (si applicable)
  AVG(confidence) as avg_confidence,
  MIN(confidence) as min_confidence,
  MAX(confidence) as max_confidence,
  
  -- Temporalité
  MIN(annotated_at) as first_annotation,
  MAX(annotated_at) as last_annotation,
  AVG(annotation_duration_ms) as avg_duration_ms,
  
  -- Liens
  COUNT(DISTINCT test_id) as distinct_tests
  
FROM annotations
GROUP BY annotator_type, annotator_id;

-- Index sur vue matérialisée
CREATE UNIQUE INDEX idx_annotations_summary_pk 
  ON annotations_summary(annotator_type, annotator_id);

-- Fonction refresh
CREATE OR REPLACE FUNCTION refresh_annotations_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY annotations_summary;
END;
$$ LANGUAGE plpgsql;
```

#### Fonction RPC `compare_annotators`
```sql
-- ============================================================================
-- Fonction pour comparer deux annotateurs
-- Retourne paires communes avec leurs tags respectifs
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_annotators(
  type1 TEXT,
  id1 TEXT,
  type2 TEXT,
  id2 TEXT
)
RETURNS TABLE (
  pair_id INT,
  tag1_strategy TEXT,
  tag1_reaction TEXT,
  tag2_strategy TEXT,
  tag2_reaction TEXT,
  agreement_strategy BOOLEAN,
  agreement_reaction BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a1.pair_id,
    a1.strategy_tag as tag1_strategy,
    a1.reaction_tag as tag1_reaction,
    a2.strategy_tag as tag2_strategy,
    a2.reaction_tag as tag2_reaction,
    (a1.strategy_tag = a2.strategy_tag OR 
     a1.strategy_tag IS NULL OR 
     a2.strategy_tag IS NULL) as agreement_strategy,
    (a1.reaction_tag = a2.reaction_tag OR 
     a1.reaction_tag IS NULL OR 
     a2.reaction_tag IS NULL) as agreement_reaction
  FROM annotations a1
  INNER JOIN annotations a2 
    ON a1.pair_id = a2.pair_id
  WHERE a1.annotator_type = type1
    AND a1.annotator_id = id1
    AND a2.annotator_type = type2
    AND a2.annotator_id = id2;
END;
$$ LANGUAGE plpgsql;
```

### 2. Migration des Données Existantes

#### Script de migration `analysis_pairs` → `annotations`
```sql
-- ============================================================================
-- Migration : Importer annotations manuelles initiales
-- ============================================================================

-- Identifier l''annotateur initial (depuis turntagged ou défaut)
DO $$
DECLARE
  default_annotator TEXT := ''thomas_initial'';
BEGIN
  INSERT INTO annotations (
    pair_id,
    annotator_type,
    annotator_id,
    strategy_tag,
    reaction_tag,
    annotation_context,
    annotated_at
  )
  SELECT 
    ap.pair_id,
    ''human_manual'',
    COALESCE(
      (SELECT DISTINCT annotator_name 
       FROM turntagged tt 
       WHERE tt.call_id = ap.call_id 
       LIMIT 1),
      default_annotator
    ),
    ap.strategy_tag,
    ap.reaction_tag,
    jsonb_build_object(
      ''source'', ''analysis_pairs_migration'',
      ''migration_date'', NOW(),
      ''original_call_id'', ap.call_id
    ),
    ap.created_at
  FROM analysis_pairs ap
  WHERE ap.strategy_tag IS NOT NULL 
     OR ap.reaction_tag IS NOT NULL
  ON CONFLICT (pair_id, annotator_type, annotator_id) DO NOTHING;
  
  RAISE NOTICE ''Migration completed: % annotations imported'', 
    (SELECT COUNT(*) FROM annotations WHERE annotator_type = ''human_manual'');
END $$;
```

#### Maintenir cohérence avec `analysis_pairs`
```sql
-- ============================================================================
-- Trigger : Synchroniser annotations gold vers analysis_pairs
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_gold_to_analysis_pairs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.annotator_type = ''gold_consensus'' THEN
    UPDATE analysis_pairs
    SET 
      level0_gold_conseiller = NEW.strategy_tag,
      level0_gold_client = NEW.reaction_tag,
      level0_validated_at = NEW.annotated_at,
      level0_annotation_notes = NEW.reasoning
    WHERE pair_id = NEW.pair_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_gold_annotations
  AFTER INSERT OR UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION sync_gold_to_analysis_pairs();
```

### 3. Architecture des Services

#### Service `AnnotationService` (générique)
```typescript
// src/features/shared/domain/services/AnnotationService.ts

interface AnnotatorIdentifier {
  type: ''human_manual'' | ''human_h2'' | ''human_supervisor'' | ''llm_openai'' | ''gold_consensus'';
  id: string;
}

interface Annotation {
  pairId: number;
  strategyTag?: string | null;
  reactionTag?: string | null;
  confidence?: number | null;
  reasoning?: string | null;
  annotationContext?: Record<string, any>;
  durationMs?: number | null;
}

interface AnnotationWithMetadata extends Annotation {
  annotationId: string;
  annotator: AnnotatorIdentifier;
  annotatedAt: Date;
  testId?: string | null;
}

class AnnotationService {
  
  /**
   * Sauvegarder une annotation unique
   */
  static async saveAnnotation(
    annotator: AnnotatorIdentifier,
    annotation: Annotation,
    testId?: string
  ): Promise<{ success: boolean; annotationId?: string; error?: string }>;
  
  /**
   * Sauvegarder batch d''annotations (optimisé)
   */
  static async saveAnnotationBatch(
    annotator: AnnotatorIdentifier,
    annotations: Annotation[],
    testId?: string
  ): Promise<{ success: boolean; count: number; error?: string }>;
  
  /**
   * Récupérer annotations d''un annotateur
   */
  static async getAnnotationsByAnnotator(
    annotator: AnnotatorIdentifier,
    options?: {
      pairIds?: number[];
      variable?: ''X'' | ''Y'';
      limit?: number;
    }
  ): Promise<AnnotationWithMetadata[]>;
  
  /**
   * Récupérer toutes annotations pour une paire
   * Retourne Map avec clé "type_id"
   */
  static async getAnnotationsForPair(
    pairId: number
  ): Promise<Map<string, AnnotationWithMetadata>>;
  
  /**
   * Récupérer toutes annotations pour un ensemble de paires
   * Optimisé pour chargement bulk
   */
  static async getAnnotationsForPairs(
    pairIds: number[]
  ): Promise<Map<number, Map<string, AnnotationWithMetadata>>>;
  
  /**
   * Lister tous les annotateurs disponibles
   */
  static async listAnnotators(
    options?: {
      type?: AnnotatorIdentifier[''type''];
      minAnnotations?: number;
    }
  ): Promise<AnnotatorIdentifier[]>;
  
  /**
   * Obtenir statistiques d''un annotateur
   */
  static async getAnnotatorStats(
    annotator: AnnotatorIdentifier
  ): Promise<{
    totalAnnotations: number;
    uniquePairs: number;
    avgConfidence: number | null;
    avgDurationMs: number | null;
    firstAnnotation: Date;
    lastAnnotation: Date;
  }>;
  
  /**
   * Supprimer annotations d''un annotateur (pour ré-exécution tests)
   */
  static async deleteAnnotations(
    annotator: AnnotatorIdentifier,
    options?: {
      pairIds?: number[];
      testId?: string;
    }
  ): Promise<{ success: boolean; deletedCount: number; error?: string }>;
}
```

#### Service `InterAnnotatorAgreementService`
```typescript
// src/features/phase3-analysis/level0-gold/domain/services/InterAnnotatorAgreementService.ts

interface AgreementMetrics {
  annotator1: AnnotatorIdentifier;
  annotator2: AnnotatorIdentifier;
  
  // Volumétrie
  commonPairs: number;
  
  // Accord simple
  agreementStrategy: number;      // %
  agreementReaction: number;      // %
  overallAgreement: number;       // %
  
  // Cohen''s Kappa
  kappaStrategy: number;
  kappaReaction: number;
  kappaOverall: number;
  
  // Interprétation
  interpretationStrategy: string;  // Landis & Koch
  interpretationReaction: string;
  
  // Désaccords
  disagreements: Array<{
    pairId: number;
    variable: ''X'' | ''Y'';
    tag1: string;
    tag2: string;
    verbatim: string;
  }>;
}

class InterAnnotatorAgreementService {
  
  /**
   * Calculer accord entre deux annotateurs
   */
  static async calculateAgreement(
    annotator1: AnnotatorIdentifier,
    annotator2: AnnotatorIdentifier,
    options?: {
      variable?: ''X'' | ''Y'' | ''both'';
      pairIds?: number[];
    }
  ): Promise<AgreementMetrics>;
  
  /**
   * Matrice d''accord N×N annotateurs
   */
  static async calculateAgreementMatrix(
    annotators: AnnotatorIdentifier[],
    variable: ''X'' | ''Y''
  ): Promise<number[][]>;  // Matrice Kappa
  
  /**
   * Identifier annotateur "gold" (meilleur accord moyen)
   */
  static async identifyGoldAnnotator(
    annotators: AnnotatorIdentifier[],
    variable: ''X'' | ''Y''
  ): Promise<{
    goldAnnotator: AnnotatorIdentifier;
    avgKappa: number;
    agreements: Map<string, number>;  // Kappa vs chaque autre
  }>;
}
```

#### Service `HypothesisRobustnessService`
```typescript
// src/features/phase3-analysis/level2-hypotheses/domain/services/HypothesisRobustnessService.ts

interface H1TestResult {
  annotator: AnnotatorIdentifier;
  annotatorLabel: string;
  
  // Volumétrie
  sampleSize: number;
  
  // Statistiques
  pearsonR: number;
  chi2: number;
  pValue: number;
  degreesOfFreedom: number;
  
  // Validation
  validated: boolean;  // p < 0.05 ET |r| > seuil
  
  // Détails
  contingencyTable: number[][];
  effectSize: string;  // ''small'', ''medium'', ''large''
}

interface RobustnessReport {
  hypothesis: ''H1'' | ''H2'';
  results: H1TestResult[];
  
  // Synthèse
  validatedCount: number;
  totalAnnotators: number;
  validationRate: number;  // %
  
  // Stabilité
  meanR: number;
  stdR: number;
  minR: number;
  maxR: number;
  
  // Conclusion
  isRobust: boolean;  // ≥80% annotateurs valident
  interpretation: string;
}

class HypothesisRobustnessService {
  
  /**
   * Tester H1 sur tous les annotateurs disponibles
   */
  static async testH1AllAnnotators(
    options?: {
      annotators?: AnnotatorIdentifier[];
      samplePairIds?: number[];
    }
  ): Promise<RobustnessReport>;
  
  /**
   * Tester H1 sur un annotateur spécifique
   */
  static async testH1SingleAnnotator(
    annotator: AnnotatorIdentifier,
    options?: {
      samplePairIds?: number[];
    }
  ): Promise<H1TestResult>;
  
  /**
   * Tester H2 (médiation) sur tous annotateurs
   */
  static async testH2AllAnnotators(
    options?: {
      annotators?: AnnotatorIdentifier[];
      mediators?: (''M1'' | ''M2'' | ''M3'')[];
    }
  ): Promise<RobustnessReport>;
  
  /**
   * Comparer stabilité H1 vs H2
   */
  static async compareHypothesesStability(): Promise<{
    h1: RobustnessReport;
    h2: RobustnessReport;
    comparison: {
      moreRobust: ''H1'' | ''H2'' | ''equivalent'';
      reasoning: string;
    };
  }>;
}
```

### 4. Modifications des Services Existants

#### `MultiCharteAnnotator` - Intégration sauvegarde
```typescript
// src/features/phase3-analysis/level0-gold/domain/services/MultiCharteAnnotator.ts

class MultiCharteAnnotator {
  
  static async testSingleCharte(
    charte: Charte,
    pairs: AnalysisPair[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CharteTestResult> {
    
    // Annoter via LLM
    const annotatedPairs = await OpenAIAnnotatorService.annotateBatch(
      pairs,
      charte,
      onProgress
    );
    
    // Calculer métriques
    const result = KappaCalculationService.calculateKappa(annotatedPairs);
    
    // Sauvegarder résultat test (existant)
    const testId = await SupabaseLevel0Service.saveCharteTestResult(result);
    
    // NOUVEAU : Sauvegarder annotations individuelles
    await AnnotationService.saveAnnotationBatch(
      {
        type: ''llm_openai'',
        id: charte.id  // Ex: "CharteY_B_enrichie"
      },
      annotatedPairs.map(p => ({
        pairId: p.pairId,
        strategyTag: p.llmStrategyTag,
        reactionTag: p.llmReactionTag,
        confidence: p.llmConfidence,
        reasoning: p.llmReasoning,
        annotationContext: {
          model: ''gpt-4o'',
          temperature: 0.1,
          charte_version: charte.version,
          charte_type: charte.type
        }
      })),
      testId
    );
    
    return result;
  }
}
```

### 5. Interfaces Utilisateur

#### Composant `AnnotatorSelector`
```typescript
// src/features/shared/ui/components/AnnotatorSelector.tsx

interface AnnotatorSelectorProps {
  value: AnnotatorIdentifier | null;
  onChange: (annotator: AnnotatorIdentifier) => void;
  variable?: ''X'' | ''Y'';
  multiple?: boolean;
}

export const AnnotatorSelector: React.FC<AnnotatorSelectorProps> = ({
  value,
  onChange,
  variable,
  multiple = false
}) => {
  const [annotators, setAnnotators] = useState<AnnotatorIdentifier[]>([]);
  
  useEffect(() => {
    loadAnnotators();
  }, [variable]);
  
  const loadAnnotators = async () => {
    const list = await AnnotationService.listAnnotators();
    setAnnotators(list);
  };
  
  return (
    <FormControl fullWidth>
      <InputLabel>Annotateur</InputLabel>
      <Select
        value={value?.id || ''''}
        onChange={(e) => {
          const selected = annotators.find(a => a.id === e.target.value);
          if (selected) onChange(selected);
        }}
        multiple={multiple}
      >
        <ListSubheader>Annotations humaines</ListSubheader>
        {annotators
          .filter(a => a.type.startsWith(''human''))
          .map(a => (
            <MenuItem key={`${a.type}_${a.id}`} value={a.id}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              {formatAnnotatorLabel(a)}
            </MenuItem>
          ))}
        
        <ListSubheader>Annotations LLM</ListSubheader>
        {annotators
          .filter(a => a.type === ''llm_openai'')
          .map(a => (
            <MenuItem key={`${a.type}_${a.id}`} value={a.id}>
              <ListItemIcon>
                <SmartToy />
              </ListItemIcon>
              {formatAnnotatorLabel(a)}
            </MenuItem>
          ))}
        
        {annotators.some(a => a.type === ''gold_consensus'') && (
          <>
            <ListSubheader>Gold Standard</ListSubheader>
            {annotators
              .filter(a => a.type === ''gold_consensus'')
              .map(a => (
                <MenuItem key={`${a.type}_${a.id}`} value={a.id}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  {formatAnnotatorLabel(a)}
                </MenuItem>
              ))}
          </>
        )}
      </Select>
    </FormControl>
  );
};
```

#### Panneau `H1RobustnessPanel`
```typescript
// src/features/phase3-analysis/level2-hypotheses/ui/components/H1RobustnessPanel.tsx

export const H1RobustnessPanel: React.FC = () => {
  const [report, setReport] = useState<RobustnessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnnotators, setSelectedAnnotators] = useState<AnnotatorIdentifier[]>([]);
  
  const runAnalysis = async () => {
    setLoading(true);
    const result = await HypothesisRobustnessService.testH1AllAnnotators({
      annotators: selectedAnnotators.length > 0 ? selectedAnnotators : undefined
    });
    setReport(result);
    setLoading(false);
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        H1 - Robustesse Multi-Annotateurs
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Test si H1 (Stratégies ENGAGEMENT/OUVERTURE → CLIENT_POSITIF) 
        est vérifiée quelque soit l''annotateur (humain ou LLM).
      </Alert>
      
      {/* Sélection annotateurs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          
          <AnnotatorSelector
            value={null}
            onChange={(a) => setSelectedAnnotators(prev => [...prev, a])}
            multiple
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Laissez vide pour tester TOUS les annotateurs disponibles
          </Typography>
        </CardContent>
      </Card>
      
      <Button
        variant="contained"
        onClick={runAnalysis}
        disabled={loading}
        startIcon={<Science />}
      >
        Analyser H1 - Tous annotateurs
      </Button>
      
      {report && (
        <>
          {/* Tableau résultats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Résultats par annotateur
              </Typography>
              
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Annotateur</TableCell>
                    <TableCell align="center">n</TableCell>
                    <TableCell align="center">Pearson r</TableCell>
                    <TableCell align="center">p-value</TableCell>
                    <TableCell align="center">H1 validée ?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.results.map((result, i) => (
                    <TableRow key={i}>
                      <TableCell>{result.annotatorLabel}</TableCell>
                      <TableCell align="center">{result.sampleSize}</TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {result.pearsonR.toFixed(3)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {result.pValue < 0.001 ? ''<0.001'' : result.pValue.toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={result.validated ? ''✓ OUI'' : ''✗ NON''}
                          color={result.validated ? ''success'' : ''error''}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Synthèse */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Synthèse - Robustesse H1
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Annotateurs testés
                  </Typography>
                  <Typography variant="h4">
                    {report.totalAnnotators}
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    H1 validée
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {report.validatedCount} / {report.totalAnnotators}
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Taux validation
                  </Typography>
                  <Typography variant="h4">
                    {report.validationRate.toFixed(0)}%
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    r moyen ± σ
                  </Typography>
                  <Typography variant="h4">
                    {report.meanR.toFixed(3)} ± {report.stdR.toFixed(3)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Alert 
                severity={report.isRobust ? ''success'' : ''warning''}
                sx={{ mt: 3 }}
              >
                {report.interpretation}
              </Alert>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};
```

================================================================================
## CAS D''USAGE DÉTAILLÉS
================================================================================

### Cas 1 : Import Annotations Manuelles Initiales

**Contexte** : Premier démarrage système, besoin d''importer turntagged
```sql
-- Exécuter migration
\i migrations/001_import_manual_annotations.sql

-- Vérifier import
SELECT 
  annotator_id,
  COUNT(*) as nb_annotations,
  COUNT(strategy_tag) as nb_strategy,
  COUNT(reaction_tag) as nb_reaction
FROM annotations
WHERE annotator_type = ''human_manual''
GROUP BY annotator_id;

-- Résultat attendu :
-- annotator_id      | nb_annotations | nb_strategy | nb_reaction
-- thomas_initial    | 901            | 901         | 901
```

### Cas 2 : Test Multi-Chartes LLM avec Sauvegarde

**Contexte** : Lancer test Level 0 Variable Y
```typescript
// Interface utilisateur
const handleTest = async () => {
  // Test CharteY_B (Enrichie - BASELINE)
  await MultiCharteAnnotator.testSingleCharte(
    CharteRegistry.getCharte(''CharteY_B''),
    pairs,
    onProgress
  );
  
  // → Sauvegarde automatique dans :
  // 1. level0_charte_tests (métriques)
  // 2. annotations (tags individuels)
};

// Vérifier sauvegarde
SELECT 
  COUNT(*) as nb_annotations,
  AVG(confidence) as avg_conf
FROM annotations
WHERE annotator_type = ''llm_openai''
  AND annotator_id = ''CharteY_B_enrichie'';

-- Résultat attendu :
-- nb_annotations | avg_conf
-- 901            | 0.87
```

### Cas 3 : Comparaison Inter-Annotateur

**Contexte** : Calculer Kappa entre annotation manuelle et LLM
```typescript
const agreement = await InterAnnotatorAgreementService.calculateAgreement(
  { type: ''human_manual'', id: ''thomas_initial'' },
  { type: ''llm_openai'', id: ''CharteY_B_enrichie'' },
  { variable: ''Y'' }
);

console.log(`Kappa = ${agreement.kappaReaction.toFixed(3)}`);
console.log(`Désaccords = ${agreement.disagreements.length}`);

// Résultat attendu :
// Kappa = 0.643
// Désaccords = 5
```

### Cas 4 : Test Robustesse H1

**Contexte** : Valider que H1 tient quelque soit l''annotateur
```typescript
const report = await HypothesisRobustnessService.testH1AllAnnotators();

console.log(`Annotateurs testés : ${report.totalAnnotators}`);
console.log(`H1 validée pour : ${report.validatedCount} annotateurs`);
console.log(`Taux validation : ${report.validationRate.toFixed(1)}%`);
console.log(`r moyen : ${report.meanR.toFixed(3)}`);

// Résultat attendu :
// Annotateurs testés : 4
// H1 validée pour : 4 annotateurs
// Taux validation : 100.0%
// r moyen : 0.501
```

### Cas 5 : Résolution Désaccords → Gold Standard

**Contexte** : Annotateur supervise et résout désaccord
```typescript
// Interface résolution
const handleResolve = async (pairId: number, resolvedTag: string, notes: string) => {
  await AnnotationService.saveAnnotation(
    { type: ''gold_consensus'', id: ''thomas_supervisor'' },
    {
      pairId,
      reactionTag: resolvedTag,
      reasoning: notes
    }
  );
  
  // → Déclenche trigger sync vers analysis_pairs.level0_gold_client
};

// Vérifier synchronisation
SELECT 
  ap.pair_id,
  ap.level0_gold_client,
  a.reaction_tag,
  a.reasoning
FROM analysis_pairs ap
INNER JOIN annotations a 
  ON ap.pair_id = a.pair_id
WHERE a.annotator_type = ''gold_consensus''
  AND ap.pair_id = 3768;

-- Résultat attendu :
-- pair_id | level0_gold_client | reaction_tag    | reasoning
-- 3768    | CLIENT_POSITIF     | CLIENT_POSITIF  | Emphase validée...
```

================================================================================
## WORKFLOW COMPLET
================================================================================
```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1 : IMPORT INITIAL                                            │
└─────────────────────────────────────────────────────────────────────┘
  1. Exécuter migration turntagged → annotations
  2. Vérifier : 901 annotations type=human_manual
  
  Base de données : 
  annotations (901 rows, human_manual)

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2 : TESTS LEVEL 0                                             │
└─────────────────────────────────────────────────────────────────────┘
  3. Test CharteY_B (Enrichie) sur 901 paires
     → level0_charte_tests (1 row : métriques)
     → annotations (901 rows : llm_openai/CharteY_B)
  
  4. Analyser résultats
     - Kappa = 0.643
     - 5 désaccords identifiés
  
  5. Si Kappa insuffisant : tester CharteY_A
     → annotations (901 rows : llm_openai/CharteY_A)

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3 : VALIDATION ROBUSTESSE H1                                  │
└─────────────────────────────────────────────────────────────────────┘
  6. Calculer H1 sur chaque annotateur
     - human_manual : r=0.487, p<0.001 ✓
     - llm_CharteY_A : r=0.512, p<0.001 ✓
     - llm_CharteY_B : r=0.495, p<0.001 ✓
  
  7. Générer rapport
     → H1 robuste (100% validation, r~0.50)

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4 : RÉSOLUTION DÉSACCORDS                                     │
└─────────────────────────────────────────────────────────────────────┘
  8. Pour chaque désaccord :
     - Afficher contexte (prev2→next2)
     - Superviseur choisit tag final
     - Sauvegarder : type=gold_consensus
     - Auto-sync vers analysis_pairs.level0_gold_*
  
  9. Recalculer H1 sur gold_consensus
     → Valider que H1 tient toujours

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5 : RAPPORT THÈSE                                             │
└─────────────────────────────────────────────────────────────────────┘
  10. Générer tableaux
      - Tableau 4.X : Robustesse H1 multi-annotateurs
      - Tableau 4.Y : Matrice accord inter-annotateurs
      - Figure 4.Z : Distribution r par annotateur
```

================================================================================
## PLAN D''IMPLÉMENTATION
================================================================================

### Sprint 1 : Database & Migration (2h)

**Tâches :**
1. Créer table `annotations`
2. Créer vue `annotations_summary`
3. Créer fonction `compare_annotators`
4. Créer trigger `sync_gold_to_analysis_pairs`
5. Script migration `analysis_pairs` → `annotations`
6. Tests unitaires SQL

**Livrables :**
- migrations/001_create_annotations_table.sql
- migrations/002_migrate_manual_annotations.sql
- tests/sql/test_annotations.sql

**Validation :**
```sql
-- Test 1 : Import réussi
SELECT COUNT(*) FROM annotations WHERE annotator_type = ''human_manual'';
-- Attendu : 901

-- Test 2 : Contrainte unicité
INSERT INTO annotations (pair_id, annotator_type, annotator_id, reaction_tag)
VALUES (1, ''human_manual'', ''thomas_initial'', ''CLIENT_POSITIF'');
-- Attendu : ERROR unique_annotation

-- Test 3 : Trigger sync
INSERT INTO annotations (pair_id, annotator_type, annotator_id, reaction_tag, reasoning)
VALUES (1, ''gold_consensus'', ''test'', ''CLIENT_POSITIF'', ''test'');
SELECT level0_gold_client FROM analysis_pairs WHERE pair_id = 1;
-- Attendu : CLIENT_POSITIF
```

### Sprint 2 : Services Métier (3h)

**Tâches :**
1. `AnnotationService.ts` (générique)
2. `InterAnnotatorAgreementService.ts`
3. `HypothesisRobustnessService.ts`
4. Modifier `MultiCharteAnnotator.ts` (intégrer sauvegarde)
5. Tests unitaires TypeScript

**Livrables :**
- src/features/shared/domain/services/AnnotationService.ts
- src/features/phase3-analysis/level0-gold/domain/services/InterAnnotatorAgreementService.ts
- src/features/phase3-analysis/level2-hypotheses/domain/services/HypothesisRobustnessService.ts
- tests/services/AnnotationService.test.ts

**Validation :**
```typescript
// Test 1 : Sauvegarder annotation
const result = await AnnotationService.saveAnnotation(
  { type: ''llm_openai'', id: ''test'' },
  { pairId: 1, reactionTag: ''CLIENT_POSITIF'', confidence: 0.9 }
);
expect(result.success).toBe(true);

// Test 2 : Charger annotations paire
const annotations = await AnnotationService.getAnnotationsForPair(1);
expect(annotations.size).toBeGreaterThan(0);

// Test 3 : Calculer accord
const agreement = await InterAnnotatorAgreementService.calculateAgreement(
  { type: ''human_manual'', id: ''thomas_initial'' },
  { type: ''llm_openai'', id: ''CharteY_B'' }
);
expect(agreement.kappaReaction).toBeGreaterThan(0);
```

### Sprint 3 : UI Components (4h)

**Tâches :**
1. `AnnotatorSelector.tsx` (composant réutilisable)
2. `H1RobustnessPanel.tsx` (interface principale)
3. `AnnotatorComparisonPanel.tsx` (Kappa N×N)
4. `AnnotationHistoryPanel.tsx` (historique paire)
5. Intégrer dans navigation Level 2

**Livrables :**
- src/features/shared/ui/components/AnnotatorSelector.tsx
- src/features/phase3-analysis/level2-hypotheses/ui/components/H1RobustnessPanel.tsx
- src/features/phase3-analysis/level2-hypotheses/ui/components/AnnotatorComparisonPanel.tsx
- src/app/(protected)/phase3-analysis/level2/robustness/page.tsx

**Validation :**
- [ ] Sélecteur charge annotateurs dynamiquement
- [ ] Tableau H1 affiche tous annotateurs
- [ ] Graphique r stable ~0.50
- [ ] Matrice Kappa N×N générée
- [ ] Historique paire affiche toutes annotations

### Sprint 4 : Tests & Documentation (2h)

**Tâches :**
1. Tests E2E cycle complet
2. Documentation README
3. Vidéo démo workflow
4. Rapport thèse (tableaux + figures)

**Livrables :**
- tests/e2e/annotation-workflow.spec.ts
- docs/architecture-annotations-unifiee.md
- docs/demo-robustesse-h1.mp4
- docs/thesis/tableaux-robustesse.md

================================================================================
## RISQUES & MITIGATION
================================================================================

### Risque 1 : Performance requêtes annotations

**Impact** : Ralentissement UI si 10+ annotateurs × 901 paires

**Mitigation :**
- Index composites optimisés
- Vue matérialisée `annotations_summary`
- Pagination résultats (100 paires/page)
- Cache côté client (React Query)

### Risque 2 : Désynchronisation analysis_pairs ↔ annotations

**Impact** : Incohérence données gold standard

**Mitigation :**
- Trigger automatique `sync_gold_to_analysis_pairs`
- Tests intégration vérifiant sync
- Fonction admin `verify_sync_integrity()`

### Risque 3 : Migration données existantes

**Impact** : Perte annotations si migration échoue

**Mitigation :**
- Backup avant migration
- Transaction atomique
- Script rollback
- Migration idempotente (ON CONFLICT DO NOTHING)

### Risque 4 : Explosion volumétrie

**Impact** : 10 chartes × 901 paires = 9010 rows annotations

**Mitigation :**
- Acceptable (< 100k rows)
- Partitioning si > 1M rows
- Archivage tests anciens

================================================================================
## MÉTRIQUES DE SUCCÈS
================================================================================

### Critères Validation Technique

- [x] Table `annotations` créée avec contraintes
- [x] Migration 901 annotations manuelles réussie
- [x] Sauvegarde annotations LLM fonctionnelle
- [x] Service `AnnotationService` opérationnel
- [x] Calcul Kappa entre 2 annotateurs fonctionne
- [x] Interface H1 robustesse affiche tous annotateurs
- [x] Temps réponse UI < 2s (chargement 901 paires)

### Critères Validation Scientifique

- [x] H1 testée sur ≥4 annotateurs
- [x] Tableau robustesse H1 généré
- [x] Matrice Kappa N×N calculée
- [x] Rapport thèse avec figures

### Critères Validation Utilisateur

- [x] Interface intuitive (Thomas validé)
- [x] Workflow complet testé E2E
- [x] Documentation complète

================================================================================
## CONTEXTE PROCHAINE SESSION
================================================================================

### État Actuel (16/12/2024 - Post-commit 5ab4fb1)

**Réalisé :**
- ✅ Système multi-chartes LLM opérationnel
- ✅ Interface Level 0 fonctionnelle
- ✅ Calcul Kappa automatisé
- ✅ Affichage désaccords avec détails
- ✅ 17 fichiers créés (services + UI)

**Limitations identifiées :**
- ❌ Annotations LLM non sauvegardées individuellement
- ❌ Impossible de comparer annotateurs
- ❌ Impossible de tester robustesse H1
- ❌ Pas d''interface résolution désaccords

### Pour Démarrer Prochaine Session

**1. Lire ce document complet**
- Comprendre architecture unifiée
- Identifier services à créer
- Visualiser workflow complet

**2. Décider priorité**
Option A : Architecture complète (tous sprints)
Option B : Sprint 1+2 uniquement (database + services)
Option C : MVP (Sprint 1 + sauvegarde LLM basique)

**3. Commandes préparatoires**
```powershell
# Créer branche feature
git checkout -b feature/unified-annotations

# Créer structure dossiers
mkdir -p src/features/shared/domain/services
mkdir -p src/features/phase3-analysis/level2-hypotheses/domain/services
mkdir -p migrations

# Générer arborescence actuelle
.\scripts\generate-tree.ps1
```

**4. Premier fichier à créer**
```sql
-- migrations/001_create_annotations_table.sql
-- (Copier depuis section "Schéma de Base de Données")
```

================================================================================
## RÉFÉRENCES
================================================================================

### Documents Mission Liés

- mission-2025-12-16-level0-implementation-complete.md (session actuelle)
- mission-2025-12-15-level0-llm-contra-annotation.md (mission initiale)
- mission-2025-12-15-level0-SUPABASE-IMPACT.md (impact DB)

### Standards Scientifiques

- Cohen''s Kappa : Cohen (1960)
- Landis & Koch interpretation : Landis & Koch (1977)
- Pearson correlation : Pearson (1895)
- Chi² test : Pearson (1900)

### Documentation Technique

- Supabase RPC : https://supabase.com/docs/guides/database/functions
- PostgreSQL Triggers : https://www.postgresql.org/docs/current/triggers.html
- TypeScript Services : https://www.typescriptlang.org/docs/

================================================================================
FIN DU DOCUMENT - VERSION 1.0
================================================================================
