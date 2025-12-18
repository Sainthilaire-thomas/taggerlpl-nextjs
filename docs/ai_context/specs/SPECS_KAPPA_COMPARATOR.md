# 📊 SPECS : Comparateur Kappa Flexible

## 🎯 Vue d'Ensemble

**Objectif** : Créer un système flexible permettant de comparer n'importe quelle paire d'annotateurs et calculer leur accord (Cohen's Kappa).

**Principe** : Au lieu d'une matrice fixe de comparaisons pré-définies, l'utilisateur sélectionne dynamiquement 2 annotateurs dans des dropdowns et lance le calcul.

**Bénéfices** :
- ✅ Scalable infiniment (ajouter annotateur = juste annoter avec nouveau ID)
- ✅ Interface simple et intuitive
- ✅ Comparaisons illimitées
- ✅ Filtrage par variable (X/Y)
- ✅ Export résultats

---

## 🏗️ Architecture

### Concept Annotateur

**Chaque annotateur identifié par** : `(annotator_type, annotator_id)`

**Types possibles** :
```typescript
'human_manual'        // Annotation humaine manuelle
'llm_openai'          // LLM texte (GPT-4o-mini, GPT-4o)
'llm_openai_audio'    // LLM audio (GPT-4o audio)
'llm_gemini'          // Autre LLM texte
'llm_gemini_audio'    // Autre LLM audio
```

**IDs possibles** :
```typescript
// Humains
'thomas_initial'              // Thomas écoute audio complet
'thomas_texte_only'           // Thomas lit texte uniquement
'annotateur_externe_1'        // Autre annotateur

// LLM texte
'CharteY_A_v1.0.0'           // Charte A Minimaliste v1.0
'CharteY_B_v1.0.0'           // Charte B Enrichie v1.0
'CharteY_B_v1.1.0'           // Charte B Enrichie v1.1 (optimisée)
'CharteY_C_v1.0.0'           // Charte C Binaire v1.0

// LLM audio
'GPT4o-audio_CharteY_A_v1.0.0'
'GPT4o-audio_CharteY_B_v1.0.0'
'Gemini-audio_CharteY_B_v1.0.0'
```

---

## 🗄️ Base de Données

### Table annotations (Existante) ✅

**Aucune modification nécessaire** :
```sql
CREATE TABLE annotations (
  annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id INTEGER REFERENCES analysis_pairs(pair_id),
  annotator_type TEXT NOT NULL,
  annotator_id TEXT NOT NULL,
  strategy_tag TEXT,
  reaction_tag TEXT,
  confidence FLOAT,
  reasoning TEXT,
  annotation_context JSONB,
  annotated_at TIMESTAMPTZ DEFAULT NOW(),
  annotation_duration_ms INTEGER,
  test_id UUID REFERENCES level0_charte_tests(test_id),
  
  UNIQUE (pair_id, annotator_type, annotator_id)
);
```

**Contrainte clé** : `(pair_id, annotator_type, annotator_id)` unique
→ Une seule annotation par annotateur par paire

---

### Fonction SQL : get_common_annotations

**Récupère paires avec annotations des 2 annotateurs** :

```sql
CREATE OR REPLACE FUNCTION get_common_annotations(
  p_annotator1_type TEXT,
  p_annotator1_id TEXT,
  p_annotator2_type TEXT,
  p_annotator2_id TEXT,
  p_variable TEXT DEFAULT NULL
)
RETURNS TABLE (
  pair_id INTEGER,
  tag1 TEXT,
  tag2 TEXT,
  confidence1 FLOAT,
  confidence2 FLOAT,
  verbatim TEXT,
  variable TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a1.pair_id,
    COALESCE(a1.reaction_tag, a1.strategy_tag) as tag1,
    COALESCE(a2.reaction_tag, a2.strategy_tag) as tag2,
    a1.confidence as confidence1,
    a2.confidence as confidence2,
    COALESCE(ap.client_verbatim, ap.conseiller_verbatim) as verbatim,
    CASE 
      WHEN ap.strategy_tag IS NOT NULL THEN 'X'
      ELSE 'Y'
    END as variable
  FROM annotations a1
  JOIN annotations a2 
    ON a1.pair_id = a2.pair_id
  JOIN analysis_pairs ap 
    ON ap.pair_id = a1.pair_id
  WHERE a1.annotator_type = p_annotator1_type
    AND a1.annotator_id = p_annotator1_id
    AND a2.annotator_type = p_annotator2_type
    AND a2.annotator_id = p_annotator2_id
    AND (p_variable IS NULL OR 
         (p_variable = 'X' AND ap.strategy_tag IS NOT NULL) OR
         (p_variable = 'Y' AND ap.reaction_tag IS NOT NULL))
  ORDER BY a1.pair_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_common_annotations IS 
  'Récupère paires avec annotations des 2 annotateurs spécifiés, optionnellement filtrées par variable';
```

**Paramètres** :
- `p_annotator1_type`, `p_annotator1_id` : Annotateur 1
- `p_annotator2_type`, `p_annotator2_id` : Annotateur 2
- `p_variable` : 'X' (stratégies), 'Y' (réactions), ou NULL (tous)

**Retour** :
- `pair_id` : ID paire
- `tag1`, `tag2` : Tags des 2 annotateurs
- `confidence1`, `confidence2` : Confiances (si LLM)
- `verbatim` : Verbatim pour contexte
- `variable` : 'X' ou 'Y'

---

### Fonction SQL : get_available_annotators

**Liste tous les annotateurs disponibles avec comptage** :

```sql
CREATE OR REPLACE FUNCTION get_available_annotators(
  p_variable TEXT DEFAULT NULL
)
RETURNS TABLE (
  annotator_type TEXT,
  annotator_id TEXT,
  annotation_count BIGINT,
  first_annotation TIMESTAMPTZ,
  last_annotation TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.annotator_type,
    a.annotator_id,
    COUNT(*) as annotation_count,
    MIN(a.annotated_at) as first_annotation,
    MAX(a.annotated_at) as last_annotation
  FROM annotations a
  LEFT JOIN analysis_pairs ap ON ap.pair_id = a.pair_id
  WHERE (p_variable IS NULL OR 
         (p_variable = 'X' AND ap.strategy_tag IS NOT NULL) OR
         (p_variable = 'Y' AND ap.reaction_tag IS NOT NULL))
  GROUP BY a.annotator_type, a.annotator_id
  ORDER BY a.annotator_type, a.annotator_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 💻 Service TypeScript

### KappaCalculationService.ts

```typescript
import { getSupabase } from "@/lib/supabaseClient";

export interface Annotator {
  type: string;
  id: string;
  label: string;
  modalityLabel: string;
  count: number;
  firstAnnotation: string;
  lastAnnotation: string;
}

export interface KappaComparisonResult {
  success: boolean;
  error?: string;
  annotator1?: { type: string; id: string };
  annotator2?: { type: string; id: string };
  kappa?: number;
  accuracy?: number;
  total_pairs: number;
  agreements?: number;
  disagreements_count?: number;
  disagreements?: DisagreementDetail[];
  confusion_matrix?: ConfusionMatrix;
}

export interface DisagreementDetail {
  pair_id: number;
  tag1: string;
  tag2: string;
  verbatim: string;
  confidence1?: number;
  confidence2?: number;
}

export interface ConfusionMatrix {
  categories: string[];
  matrix: number[][];
}

export class KappaCalculationService {
  private static supabase = getSupabase();

  /**
   * Récupérer liste de tous les annotateurs disponibles
   */
  static async getAvailableAnnotators(
    variable?: 'X' | 'Y'
  ): Promise<Annotator[]> {
    
    const { data, error } = await this.supabase
      .rpc('get_available_annotators', { p_variable: variable || null });

    if (error) {
      console.error('Error fetching annotators:', error);
      return [];
    }

    return (data || []).map(a => ({
      type: a.annotator_type,
      id: a.annotator_id,
      label: this.getAnnotatorLabel(a),
      modalityLabel: this.getModalityLabel(a),
      count: a.annotation_count,
      firstAnnotation: a.first_annotation,
      lastAnnotation: a.last_annotation
    }));
  }

  /**
   * Comparer 2 annotateurs quelconques et calculer Kappa
   */
  static async compareAnyAnnotators(
    annotator1: { type: string; id: string },
    annotator2: { type: string; id: string },
    variable?: 'X' | 'Y'
  ): Promise<KappaComparisonResult> {
    
    try {
      // Récupérer paires communes
      const { data: pairs, error } = await this.supabase.rpc(
        'get_common_annotations',
        {
          p_annotator1_type: annotator1.type,
          p_annotator1_id: annotator1.id,
          p_annotator2_type: annotator2.type,
          p_annotator2_id: annotator2.id,
          p_variable: variable || null
        }
      );

      if (error) {
        return {
          success: false,
          error: error.message,
          total_pairs: 0
        };
      }

      if (!pairs || pairs.length === 0) {
        return {
          success: false,
          error: 'Aucune annotation commune trouvée entre ces 2 annotateurs',
          total_pairs: 0
        };
      }

      // Calculer métriques
      const agreements = pairs.filter(p => p.tag1 === p.tag2).length;
      const disagreements = pairs.filter(p => p.tag1 !== p.tag2);
      const accuracy = agreements / pairs.length;
      
      // Cohen's Kappa
      const kappa = this.calculateCohenKappa(pairs);
      
      // Matrice de confusion
      const confusionMatrix = this.buildConfusionMatrix(pairs);

      return {
        success: true,
        annotator1,
        annotator2,
        kappa,
        accuracy,
        total_pairs: pairs.length,
        agreements,
        disagreements_count: disagreements.length,
        disagreements: disagreements.map(d => ({
          pair_id: d.pair_id,
          tag1: d.tag1,
          tag2: d.tag2,
          verbatim: d.verbatim,
          confidence1: d.confidence1,
          confidence2: d.confidence2
        })),
        confusion_matrix: confusionMatrix
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        total_pairs: 0
      };
    }
  }

  /**
   * Calculer Cohen's Kappa
   */
  private static calculateCohenKappa(
    pairs: Array<{ tag1: string; tag2: string }>
  ): number {
    
    const n = pairs.length;
    
    // Proportion d'accords observés
    const po = pairs.filter(p => p.tag1 === p.tag2).length / n;
    
    // Distributions marginales
    const tags = [...new Set([...pairs.map(p => p.tag1), ...pairs.map(p => p.tag2)])];
    
    let pe = 0;
    for (const tag of tags) {
      const p1 = pairs.filter(p => p.tag1 === tag).length / n;
      const p2 = pairs.filter(p => p.tag2 === tag).length / n;
      pe += p1 * p2;
    }
    
    // Kappa
    const kappa = (po - pe) / (1 - pe);
    
    return isNaN(kappa) ? 0 : kappa;
  }

  /**
   * Construire matrice de confusion
   */
  private static buildConfusionMatrix(
    pairs: Array<{ tag1: string; tag2: string }>
  ): ConfusionMatrix {
    
    const categories = [...new Set([
      ...pairs.map(p => p.tag1),
      ...pairs.map(p => p.tag2)
    ])].sort();
    
    const matrix: number[][] = [];
    
    for (let i = 0; i < categories.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < categories.length; j++) {
        const count = pairs.filter(
          p => p.tag1 === categories[i] && p.tag2 === categories[j]
        ).length;
        matrix[i][j] = count;
      }
    }
    
    return { categories, matrix };
  }

  /**
   * Obtenir label lisible pour annotateur
   */
  private static getAnnotatorLabel(annotator: any): string {
    const { annotator_type, annotator_id } = annotator;
    
    if (annotator_type === 'human_manual') {
      if (annotator_id === 'thomas_initial') {
        return 'Thomas (Texte + Audio)';
      } else if (annotator_id === 'thomas_texte_only') {
        return 'Thomas (Texte Seul)';
      } else {
        return annotator_id;
      }
    }
    
    if (annotator_type === 'llm_openai') {
      const charteName = annotator_id.replace(/_v\d+\.\d+\.\d+$/, '');
      const version = annotator_id.match(/v(\d+\.\d+\.\d+)$/)?.[1] || '';
      return `LLM Texte (${charteName} ${version})`;
    }
    
    if (annotator_type === 'llm_openai_audio') {
      const charteName = annotator_id
        .replace('GPT4o-audio_', '')
        .replace(/_v\d+\.\d+\.\d+$/, '');
      const version = annotator_id.match(/v(\d+\.\d+\.\d+)$/)?.[1] || '';
      return `LLM Audio (${charteName} ${version})`;
    }
    
    return annotator_id;
  }

  /**
   * Obtenir label modalité
   */
  private static getModalityLabel(annotator: any): string {
    const { annotator_type, annotator_id } = annotator;
    
    if (annotator_id === 'thomas_texte_only') return 'Texte';
    if (annotator_type === 'llm_openai') return 'Texte';
    if (annotator_type === 'llm_openai_audio') return 'Audio';
    if (annotator_id === 'thomas_initial') return 'Audio';
    
    return 'Unknown';
  }

  /**
   * Exporter résultats en CSV
   */
  static exportToCSV(result: KappaComparisonResult): string {
    const lines = [];
    
    // Header
    lines.push('# Comparaison Kappa');
    lines.push(`# Annotateur 1,${result.annotator1?.type},${result.annotator1?.id}`);
    lines.push(`# Annotateur 2,${result.annotator2?.type},${result.annotator2?.id}`);
    lines.push('');
    
    // Métriques
    lines.push('Métrique,Valeur');
    lines.push(`Kappa,${result.kappa?.toFixed(4)}`);
    lines.push(`Accuracy,${result.accuracy?.toFixed(4)}`);
    lines.push(`Total Paires,${result.total_pairs}`);
    lines.push(`Accords,${result.agreements}`);
    lines.push(`Désaccords,${result.disagreements_count}`);
    lines.push('');
    
    // Désaccords
    if (result.disagreements && result.disagreements.length > 0) {
      lines.push('Désaccords');
      lines.push('Pair ID,Tag 1,Tag 2,Verbatim,Confidence 1,Confidence 2');
      result.disagreements.forEach(d => {
        const verbatim = d.verbatim.replace(/,/g, ';').replace(/\n/g, ' ');
        lines.push(
          `${d.pair_id},${d.tag1},${d.tag2},"${verbatim}",${d.confidence1 || ''},${d.confidence2 || ''}`
        );
      });
    }
    
    return lines.join('\n');
  }
}
```

---

## 🎨 Interface UI

### KappaComparator.tsx

```typescript
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import { KappaCalculationService, Annotator, KappaComparisonResult } from '@/services/KappaCalculationService';

export const KappaComparator: React.FC = () => {
  const [annotators, setAnnotators] = useState<Annotator[]>([]);
  const [annotator1, setAnnotator1] = useState<string>('');
  const [annotator2, setAnnotator2] = useState<string>('');
  const [variable, setVariable] = useState<'X' | 'Y' | 'ALL'>('Y');
  const [result, setResult] = useState<KappaComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnotators();
  }, [variable]);

  const loadAnnotators = async () => {
    const vars = variable === 'ALL' ? undefined : variable;
    const list = await KappaCalculationService.getAvailableAnnotators(vars);
    setAnnotators(list);
  };

  const parseAnnotatorString = (str: string): { type: string; id: string } => {
    const [type, id] = str.split('::');
    return { type, id };
  };

  const handleCompare = async () => {
    if (!annotator1 || !annotator2) {
      alert('Veuillez sélectionner 2 annotateurs');
      return;
    }

    if (annotator1 === annotator2) {
      alert('Veuillez sélectionner 2 annotateurs différents');
      return;
    }

    setLoading(true);

    const ann1 = parseAnnotatorString(annotator1);
    const ann2 = parseAnnotatorString(annotator2);
    const vars = variable === 'ALL' ? undefined : variable;

    const comparisonResult = await KappaCalculationService.compareAnyAnnotators(
      ann1,
      ann2,
      vars
    );

    setResult(comparisonResult);
    setLoading(false);
  };

  const handleExport = () => {
    if (!result) return;
    
    const csv = KappaCalculationService.exportToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kappa_comparison_${Date.now()}.csv`;
    a.click();
  };

  const getKappaColor = (kappa: number): string => {
    if (kappa >= 0.80) return 'success.light';
    if (kappa >= 0.60) return 'info.light';
    if (kappa >= 0.40) return 'warning.light';
    return 'error.light';
  };

  const getKappaInterpretation = (kappa: number): string => {
    if (kappa >= 0.80) return 'Excellent';
    if (kappa >= 0.60) return 'Bon';
    if (kappa >= 0.40) return 'Modéré';
    if (kappa >= 0.20) return 'Faible';
    return 'Très faible';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          🔬 Comparateur Kappa Flexible
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sélectionnez 2 annotateurs pour calculer leur accord inter-annotateurs (Cohen's Kappa)
        </Typography>

        {/* Sélection Variable */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <FormLabel>Variable à analyser</FormLabel>
          <RadioGroup 
            row 
            value={variable} 
            onChange={(e) => {
              setVariable(e.target.value as any);
              setAnnotator1('');
              setAnnotator2('');
              setResult(null);
            }}
          >
            <FormControlLabel value="Y" control={<Radio />} label="Y (Réactions Client)" />
            <FormControlLabel value="X" control={<Radio />} label="X (Stratégies Conseiller)" />
            <FormControlLabel value="ALL" control={<Radio />} label="Toutes Variables" />
          </RadioGroup>
        </FormControl>

        {/* Sélection Annotateur 1 */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Annotateur 1</FormLabel>
          <Select
            value={annotator1}
            onChange={(e) => setAnnotator1(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>Sélectionner le premier annotateur</em>
            </MenuItem>
            {annotators.map(a => (
              <MenuItem 
                key={`${a.type}::${a.id}`} 
                value={`${a.type}::${a.id}`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip 
                    label={a.modalityLabel} 
                    size="small" 
                    color={a.modalityLabel === 'Audio' ? 'primary' : 'default'}
                  />
                  <Typography sx={{ flexGrow: 1 }}>{a.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({a.count} annotations)
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sélection Annotateur 2 */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <FormLabel>Annotateur 2</FormLabel>
          <Select
            value={annotator2}
            onChange={(e) => setAnnotator2(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>Sélectionner le second annotateur</em>
            </MenuItem>
            {annotators.map(a => (
              <MenuItem 
                key={`${a.type}::${a.id}`} 
                value={`${a.type}::${a.id}`}
                disabled={`${a.type}::${a.id}` === annotator1}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip 
                    label={a.modalityLabel} 
                    size="small" 
                    color={a.modalityLabel === 'Audio' ? 'primary' : 'default'}
                  />
                  <Typography sx={{ flexGrow: 1 }}>{a.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({a.count} annotations)
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Bouton Calculer */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleCompare}
          disabled={!annotator1 || !annotator2 || annotator1 === annotator2 || loading}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Calcul en cours...
            </>
          ) : (
            'Calculer Cohen\'s Kappa (κ)'
          )}
        </Button>

        {/* Résultats */}
        {result && result.success && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              📊 Résultats de la Comparaison
            </Typography>

            {/* Métriques Principales */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getKappaColor(result.kappa!) }}>
                  <Typography variant="h3" fontWeight="bold">
                    {result.kappa!.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" display="block">Cohen's Kappa (κ)</Typography>
                  <Chip 
                    label={getKappaInterpretation(result.kappa!)} 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold">
                    {(result.accuracy! * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">Accuracy</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                  <Typography variant="h3" fontWeight="bold">
                    {result.agreements}
                  </Typography>
                  <Typography variant="caption">Accords</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                  <Typography variant="h3" fontWeight="bold">
                    {result.disagreements_count}
                  </Typography>
                  <Typography variant="caption">Désaccords</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Matrice de Confusion */}
            {result.confusion_matrix && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Matrice de Confusion
                </Typography>
                <Paper sx={{ p: 2, overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell></TableCell>
                        {result.confusion_matrix.categories.map(cat => (
                          <TableCell key={cat} align="center">
                            <strong>{cat}</strong>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.confusion_matrix.matrix.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <strong>{result.confusion_matrix!.categories[i]}</strong>
                          </TableCell>
                          {row.map((count, j) => (
                            <TableCell 
                              key={j} 
                              align="center"
                              sx={{ 
                                bgcolor: i === j ? 'success.light' : count > 0 ? 'error.light' : 'white',
                                fontWeight: count > 0 ? 'bold' : 'normal'
                              }}
                            >
                              {count}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}

            {/* Désaccords Détaillés */}
            {result.disagreements_count! > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Désaccords Détaillés ({result.disagreements_count})
                </Typography>
                {result.disagreements!.slice(0, 10).map((d, idx) => (
                  <Accordion key={d.pair_id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="body2">Pair #{d.pair_id}</Typography>
                        <Chip label={d.tag1} size="small" color="info" />
                        <Typography>vs</Typography>
                        <Chip label={d.tag2} size="small" color="warning" />
                        {d.confidence1 && (
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round(d.confidence1 * 100)}% / {Math.round((d.confidence2 || 0) * 100)}%)
                          </Typography>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{d.verbatim}"
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
                {result.disagreements_count! > 10 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    ... et {result.disagreements_count! - 10} autres désaccords
                  </Typography>
                )}
              </Box>
            )}

            {/* Bouton Export */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Exporter Résultats (CSV)
            </Button>
          </Box>
        )}

        {result && !result.success && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Erreur :</strong> {result.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 📊 Exemples d'Utilisation

### Exemple 1 : LLM Texte vs Humain Texte-Only

**Contexte** : Mesurer performance LLM sur texte pur

**Sélection** :
- Annotateur 1 : `LLM Texte (CharteY_B v1.0.0)`
- Annotateur 2 : `Thomas (Texte Seul)`
- Variable : Y (Réactions)

**Résultat attendu** :
```
κ = 0.820
Accuracy = 85%
Total = 100 paires
Accords = 85
Désaccords = 15

Interprétation : Excellent
→ LLM performant sur texte seul !
```

---

### Exemple 2 : LLM Audio vs Humain Audio

**Contexte** : Tester si LLM audio capture prosodie

**Sélection** :
- Annotateur 1 : `LLM Audio (GPT4o-audio_CharteY_B v1.0.0)`
- Annotateur 2 : `Thomas (Texte + Audio)`
- Variable : Y

**Résultat attendu** :
```
κ = 0.750
Accuracy = 80%

Interprétation : Bon
→ LLM audio capture partiellement la prosodie
```

---

### Exemple 3 : Comparer Versions Charte

**Contexte** : Mesurer amélioration v1.1 vs v1.0

**Sélection** :
- Annotateur 1 : `LLM Texte (CharteY_B v1.0.0)`
- Annotateur 2 : `LLM Texte (CharteY_B v1.1.0)`
- Variable : Y

**Résultat** :
```
κ = 0.920
Accuracy = 95%
Désaccords = 5 / 100

Analyse des 5 désaccords :
→ Tous résolus en faveur de v1.1.0
→ Optimisation prompt validée !
```

---

### Exemple 4 : Impact Prosodie (Humain)

**Contexte** : Mesurer impact modalité prosodique sur annotations humaines

**Sélection** :
- Annotateur 1 : `Thomas (Texte + Audio)`
- Annotateur 2 : `Thomas (Texte Seul)`
- Variable : Y

**Résultat attendu** :
```
κ = 0.450
Accuracy = 60%
Désaccords = 40 / 100

Analyse :
→ Impact prosodie significatif (-0.55 points κ)
→ Principalement sur tags NEUTRE (deviennent POSITIF/NEGATIF selon ton)
```

---

## 🔄 Workflow Utilisateur

### Étape 1 : Sélectionner Variable

```
[Radio Buttons]
○ Y (Réactions Client) - 901 paires
○ X (Stratégies Conseiller) - 901 paires
○ Toutes Variables - 1802 paires
```

→ Charge liste annotateurs filtrée

---

### Étape 2 : Sélectionner Annotateur 1

```
[Dropdown]
┌─────────────────────────────────────────────────┐
│ 🎙️ Audio  Thomas (Texte + Audio)      (901 ann)│
│ 📝 Texte  Thomas (Texte Seul)         (50 ann) │
│ 📝 Texte  LLM (CharteY_A v1.0.0)      (10 ann) │
│ 📝 Texte  LLM (CharteY_B v1.0.0)      (10 ann) │
│ 🎙️ Audio  LLM (GPT4o-audio_CharteY_B)(50 ann) │
└─────────────────────────────────────────────────┘
```

→ Désactive cet annotateur dans dropdown 2

---

### Étape 3 : Sélectionner Annotateur 2

```
[Dropdown - Annotateur 1 désactivé]
```

---

### Étape 4 : Calculer Kappa

```
[Bouton Calculer Cohen's Kappa (κ)]
```

→ Loading 2-5 secondes  
→ Affiche résultats

---

### Étape 5 : Analyser Résultats

**Visualisation** :
- Kappa + interprétation
- Accuracy
- Accords/Désaccords
- Matrice confusion
- Liste désaccords (top 10)

---

### Étape 6 : Exporter (Optionnel)

```
[Bouton Exporter Résultats (CSV)]
```

→ Télécharge CSV avec toutes métriques + désaccords

---

## 📈 Intégration Dashboard

### Panel Comparaisons Rapides

**Afficher comparaisons pré-calculées courantes** :

```typescript
<Grid container spacing={2}>
  <Grid item xs={12} md={4}>
    <QuickComparisonCard
      title="LLM Texte vs Humain Texte"
      kappa={0.82}
      onClick={() => loadComparison('llm_text', 'human_text')}
    />
  </Grid>
  <Grid item xs={12} md={4}>
    <QuickComparisonCard
      title="LLM Audio vs Humain Audio"
      kappa={0.75}
      onClick={() => loadComparison('llm_audio', 'human_audio')}
    />
  </Grid>
  <Grid item xs={12} md={4}>
    <QuickComparisonCard
      title="Impact Prosodie (Humain)"
      kappa={0.45}
      onClick={() => loadComparison('human_audio', 'human_text')}
    />
  </Grid>
</Grid>
```

---

## 🎯 Checklist Implémentation

### Phase 1 : Base de Données (30 min)

- [ ] Créer fonction `get_common_annotations()`
- [ ] Créer fonction `get_available_annotators()`
- [ ] Tester fonctions SQL avec requêtes manuelles
- [ ] Vérifier performances (EXPLAIN ANALYZE)

### Phase 2 : Service TypeScript (1h)

- [ ] Créer `KappaCalculationService.ts`
- [ ] Implémenter `getAvailableAnnotators()`
- [ ] Implémenter `compareAnyAnnotators()`
- [ ] Implémenter `calculateCohenKappa()`
- [ ] Implémenter `buildConfusionMatrix()`
- [ ] Implémenter `exportToCSV()`
- [ ] Ajouter types TypeScript
- [ ] Tester service avec données réelles

### Phase 3 : Interface UI (1.5h)

- [ ] Créer composant `KappaComparator.tsx`
- [ ] Implémenter sélection variable
- [ ] Implémenter dropdowns annotateurs
- [ ] Implémenter bouton calcul
- [ ] Implémenter affichage résultats
- [ ] Implémenter matrice confusion
- [ ] Implémenter liste désaccords
- [ ] Implémenter export CSV
- [ ] Styliser avec Material-UI
- [ ] Tester UX complète

### Phase 4 : Tests & Documentation (30 min)

- [ ] Tester toutes combinaisons annotateurs
- [ ] Vérifier calculs Kappa corrects
- [ ] Tester export CSV
- [ ] Documenter exemples d'utilisation
- [ ] Commit "Feature: Flexible Kappa Comparator"

---

## 🚀 Extensions Futures

### Extension 1 : Historique Comparaisons

**Sauvegarder comparaisons** :
```sql
CREATE TABLE kappa_comparisons (
  comparison_id UUID PRIMARY KEY,
  annotator1_type TEXT,
  annotator1_id TEXT,
  annotator2_type TEXT,
  annotator2_id TEXT,
  variable TEXT,
  kappa FLOAT,
  accuracy FLOAT,
  total_pairs INTEGER,
  compared_at TIMESTAMPTZ,
  compared_by TEXT
);
```

**Afficher historique** :
```
Dernières comparaisons :
- LLM CharteY_B v1.0 vs Thomas Texte : κ=0.82 (12/12/2025)
- LLM Audio vs Thomas Audio : κ=0.75 (15/12/2025)
```

---

### Extension 2 : Comparaisons Multiples

**Comparer 3+ annotateurs simultanément** :
```
Matrice N×N avec tous les Kappa
→ Identifier annotateur le plus proche du consensus
```

---

### Extension 3 : Analyse Temporelle

**Évolution Kappa dans le temps** :
```
Chart : Kappa LLM vs Thomas (mois par mois)
→ Voir amélioration prompts au fil du temps
```

---

## 📚 Références

**Cohen's Kappa** :
- Cohen, J. (1960). "A coefficient of agreement for nominal scales"
- Formule : κ = (Po - Pe) / (1 - Pe)
- Interprétation : <0.20 faible, 0.40-0.60 modéré, 0.60-0.80 bon, >0.80 excellent

**Matrice de Confusion** :
- Lignes = Annotateur 1
- Colonnes = Annotateur 2
- Diagonale = Accords
- Hors-diagonale = Désaccords

---

**Document créé** : 2025-12-17  
**Version** : 1.0  
**Auteur** : Claude & Thomas  
**Sprint** : Sprint 4+ Extension
