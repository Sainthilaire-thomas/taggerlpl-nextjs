# Documentation - components/Level0

## Vue d'ensemble

Les composants Level0 implémentent le **niveau de validation méthodologique** de l'AlgorithmLab, correspondant au chapitre 4.3 de la thèse "Fiabilité et validation". Ces composants matérialisent les protocoles de validation scientifique nécessaires pour garantir la rigueur méthodologique de la recherche en linguistique appliquée.

## Architecture théorique

### Fondements méthodologiques

Les composants Level0 s'appuient sur les standards de validation en annotation linguistique établis par :

- **Artstein & Poesio (2008)** : Recommandations pour la fiabilité des annotations linguistiques
- **Carletta (1996)** : Méthodologie de calcul du Kappa de Cohen
- **Landis & Koch (1977)** : Grilles d'interprétation des indices d'accord inter-annotateur

### Objectifs de validation

1. **Validation humaine** : Mesurer la reproductibilité de l'annotation manuelle
2. **Validation automatique** : Tester la cohérence entre annotation humaine et algorithmes
3. **Certification scientifique** : Établir un "Gold Standard" validé pour la recherche

## Composants principaux

### 1. InterAnnotatorAgreement - Accord inter-annotateur

**Localisation** : `components/Level0/InterAnnotatorAgreement.tsx`

**Objectif théorique** : Implémenter le protocole de double annotation décrit dans la section 4.3.1 de la thèse pour mesurer la fiabilité de la grille d'annotation.

#### Interface utilisateur

```typescript
interface InterAnnotatorData {
  id: string;
  verbatim: string; // Tour de parole à annoter
  expert1: string; // Classification annotateur 1
  expert2: string; // Classification annotateur 2
  agreed: boolean; // Accord entre annotateurs
  callId: string;
  speaker: string; // conseiller | client
  turnIndex: number;
  context: string; // Contexte conversationnel
  annotationTimestamp: Date;
}
```

#### Configuration de l'échantillon

```typescript
// Paramètres d'échantillonnage (section 4.3.1.1 de la thèse)
const [sampleSize, setSampleSize] = useState(200); // Recommandé : 200 paires adjacentes
const [stratification, setStratification] = useState("tag-secteur");

// Options de stratification
- "tag-secteur"  : Couvre toutes les catégories et tous les secteurs
- "tag"          : Représentation équilibrée des catégories
- "secteur"      : Représentation équilibrée des secteurs
- "random"       : Échantillonnage aléatoire simple
```

#### Métriques Kappa de Cohen

```typescript
interface KappaMetrics {
  kappa: number; // Indice principal (κ)
  observed: number; // Accord observé (Po)
  expected: number; // Accord attendu par hasard (Pe)
  interpretation: string; // Interprétation Landis & Koch
  confidenceInterval: [number, number]; // Intervalle de confiance 95%
}

// Formule : κ = (Po - Pe) / (1 - Pe)
// Interprétation selon Landis & Koch (1977) :
// κ > 0.80 : "Accord quasi-parfait"
// κ > 0.60 : "Accord substantiel"
// κ > 0.40 : "Accord modéré"
// κ > 0.20 : "Accord faible"
// κ ≤ 0.20 : "Accord négligeable"
```

#### Fonctionnalités implémentées

**1. Configuration d'échantillon**

```typescript
<TextField
  label="Taille échantillon"
  type="number"
  value={sampleSize}
  inputProps={{ min: 50, max: 500 }}
  helperText="Recommandé : 200 paires adjacentes"
/>

<FormControl>
  <Select value={stratification}>
    <MenuItem value="tag-secteur">Par tag et secteur</MenuItem>
    <MenuItem value="tag">Par tag uniquement</MenuItem>
    <MenuItem value="secteur">Par secteur uniquement</MenuItem>
    <MenuItem value="random">Aléatoire</MenuItem>
  </Select>
</FormControl>
```

**2. Visualisation des métriques**

```typescript
// Indicateur visuel du niveau d'accord
<LinearProgress
  variant="determinate"
  value={kappaMetrics.kappa * 100}
  color={getKappaColor(kappaMetrics.kappa)}
  sx={{ height: 8, borderRadius: 4 }}
/>;

// Fonction de coloration selon seuils scientifiques
const getKappaColor = (kappa: number) => {
  if (kappa > 0.8) return "success"; // Quasi-parfait
  if (kappa > 0.6) return "primary"; // Substantiel
  if (kappa > 0.4) return "warning"; // Modéré
  return "error"; // Insuffisant
};
```

**3. Actions de validation**

```typescript
// Analyse des désaccords (seulement si κ < seuil)
<Button
  startIcon={<Visibility />}
  disabled={!kappaMetrics || disagreements.length === 0}
  color="warning"
>
  Analyser {disagreements.length} désaccords
</Button>

// Interface de résolution collaborative
<Button
  startIcon={<Edit />}
  color="success"
>
  Interface résolution collaborative
</Button>

// Certification Gold Standard (seulement si κ > 0.7)
<Button
  startIcon={<Download />}
  disabled={!kappaMetrics || kappaMetrics.kappa < 0.7}
  color="secondary"
>
  Certifier Gold Standard
</Button>
```

#### Tableau d'annotations

```typescript
// Affichage de l'échantillon annoté avec statut d'accord
<TableContainer>
  <Table>
    <TableBody>
      {annotations.map((annotation) => (
        <TableRow key={annotation.id}>
          <TableCell>{annotation.verbatim}</TableCell>
          <TableCell>
            <Chip label={annotation.expert1} color="primary" />
          </TableCell>
          <TableCell>
            <Chip label={annotation.expert2} color="secondary" />
          </TableCell>
          <TableCell>
            {annotation.agreed ? (
              <CheckCircle sx={{ color: "success.main" }} />
            ) : (
              <XCircle sx={{ color: "error.main" }} />
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### 2. Hook useLevel0Validation - Logique de validation

**Localisation** : `hooks/useLevel0Validation.ts`

**Objectif** : Centraliser la logique de calcul des métriques d'accord inter-annotateur selon les standards scientifiques.

```typescript
export const useLevel0Validation = () => {
  const [annotations, setAnnotations] = useState<InterAnnotatorData[]>([]);
  const [kappaMetrics, setKappaMetrics] = useState<KappaMetrics | null>(null);
  const [disagreements, setDisagreements] = useState<DisagreementAnalysis[]>(
    []
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcul du Kappa de Cohen selon Carletta (1996)
  const calculateKappa = async (data: InterAnnotatorData[]) => {
    setIsCalculating(true);

    try {
      // 1. Matrice de confusion
      const confusionMatrix = buildConfusionMatrix(data);

      // 2. Accord observé (Po)
      const observedAgreement = calculateObservedAgreement(data);

      // 3. Accord attendu par hasard (Pe)
      const expectedAgreement = calculateExpectedAgreement(confusionMatrix);

      // 4. Kappa = (Po - Pe) / (1 - Pe)
      const kappa =
        (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

      // 5. Intervalle de confiance (bootstrap ou formule asymptotique)
      const confidenceInterval = calculateConfidenceInterval(
        kappa,
        data.length
      );

      // 6. Interprétation selon Landis & Koch
      const interpretation = interpretKappa(kappa);

      setKappaMetrics({
        kappa,
        observed: observedAgreement,
        expected: expectedAgreement,
        interpretation,
        confidenceInterval,
      });
    } catch (error) {
      console.error("Erreur calcul Kappa:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Identification systématique des désaccords pour analyse qualitative
  const identifyDisagreements = (data: InterAnnotatorData[]) => {
    const disagreements = data
      .filter((item) => !item.agreed)
      .map((item) => ({
        id: item.id,
        verbatim: item.verbatim,
        expert1: item.expert1,
        expert2: item.expert2,
        disagreementType: classifyDisagreement(item.expert1, item.expert2),
        context: item.context,
        speaker: item.speaker,
      }));

    setDisagreements(disagreements);
  };

  return {
    annotations,
    setAnnotations,
    kappaMetrics,
    disagreements,
    isCalculating,
    calculateKappa,
    identifyDisagreements,
  };
};
```

#### Fonctions de calcul scientifique

```typescript
// Matrice de confusion pour calcul du Kappa
const buildConfusionMatrix = (data: InterAnnotatorData[]) => {
  const categories = [
    ...new Set([...data.map((d) => d.expert1), ...data.map((d) => d.expert2)]),
  ];

  const matrix: Record<string, Record<string, number>> = {};
  categories.forEach((cat1) => {
    matrix[cat1] = {};
    categories.forEach((cat2) => {
      matrix[cat1][cat2] = 0;
    });
  });

  data.forEach((item) => {
    matrix[item.expert1][item.expert2]++;
  });

  return matrix;
};

// Accord observé (Po)
const calculateObservedAgreement = (data: InterAnnotatorData[]): number => {
  const agreements = data.filter((item) => item.agreed).length;
  return agreements / data.length;
};

// Accord attendu par hasard (Pe)
const calculateExpectedAgreement = (
  matrix: Record<string, Record<string, number>>
): number => {
  const total = Object.values(matrix).reduce(
    (sum, row) =>
      sum + Object.values(row).reduce((rowSum, cell) => rowSum + cell, 0),
    0
  );

  let expectedAgreement = 0;
  for (const category of Object.keys(matrix)) {
    const marginalRow = Object.values(matrix[category]).reduce(
      (sum, cell) => sum + cell,
      0
    );
    const marginalCol = Object.values(matrix).reduce(
      (sum, row) => sum + (row[category] || 0),
      0
    );
    expectedAgreement += (marginalRow * marginalCol) / (total * total);
  }

  return expectedAgreement;
};

// Interprétation selon Landis & Koch (1977)
const interpretKappa = (kappa: number): string => {
  if (kappa > 0.8) return "Accord quasi-parfait";
  if (kappa > 0.6) return "Accord substantiel";
  if (kappa > 0.4) return "Accord modéré";
  if (kappa > 0.2) return "Accord faible";
  return "Accord négligeable";
};
```

### 3. Types Level0 - Définitions TypeScript

**Localisation** : `types/Level0Types.ts`

```typescript
// Données d'annotation inter-expert
export interface InterAnnotatorData {
  id: string;
  verbatim: string;
  expert1: string; // Classification annotateur expert 1
  expert2: string; // Classification annotateur expert 2
  agreed: boolean; // Accord automatiquement calculé
  callId: string;
  speaker: "conseiller" | "client";
  turnIndex: number; // Position dans la conversation
  context: string; // Contexte conversationnel
  annotationTimestamp: Date;
  sector?: string; // Secteur d'activité pour stratification
  complexity?: "simple" | "medium" | "complex"; // Complexité pour stratification
}

// Métriques Kappa de Cohen
export interface KappaMetrics {
  kappa: number; // Indice principal (κ)
  observed: number; // Accord observé (Po)
  expected: number; // Accord attendu (Pe)
  interpretation: string; // Interprétation qualitative
  confidenceInterval: [number, number]; // IC 95%
  sampleSize: number; // Taille échantillon
  categories: string[]; // Catégories analysées
}

// Analyse des désaccords
export interface DisagreementAnalysis {
  id: string;
  verbatim: string;
  expert1: string;
  expert2: string;
  disagreementType: DisagreementType;
  severity: "minor" | "major"; // Impact sur la fiabilité
  context: string;
  suggestedResolution?: string; // Suggestion de résolution
}

export type DisagreementType =
  | "boundary_case" // Cas limite entre catégories
  | "definition_ambiguity" // Ambiguïté définitionnelle
  | "context_dependency" // Dépendance au contexte
  | "annotator_bias" // Biais annotateur
  | "transcription_error"; // Erreur de transcription

// Configuration échantillonnage
export interface SamplingConfig {
  size: number; // Taille échantillon
  stratification: StratificationType; // Type de stratification
  includeAudioContext: boolean; // Inclusion contexte audio
  weightByDuration: boolean; // Pondération par durée
  balanceCategories: boolean; // Équilibrage catégories
}

export type StratificationType =
  | "tag-secteur" // Stratification par tag ET secteur
  | "tag" // Stratification par tag uniquement
  | "secteur" // Stratification par secteur uniquement
  | "random"; // Échantillonnage aléatoire

// Résultats de validation
export interface ValidationResults {
  kappaMetrics: KappaMetrics;
  disagreements: DisagreementAnalysis[];
  categoryBreakdown: Record<
    string,
    {
      kappa: number;
      precision: number;
      recall: number;
      f1Score: number;
    }
  >;
  recommendations: ValidationRecommendation[];
}

export interface ValidationRecommendation {
  type:
    | "improve_definition"
    | "add_examples"
    | "additional_training"
    | "protocol_adjustment";
  category?: string;
  description: string;
  priority: "low" | "medium" | "high";
}
```

## Workflow de validation scientifique

### 1. Phase de préparation

```typescript
// Configuration de l'échantillon selon protocole thèse (section 4.3.1)
const prepareSample = (corpus: AnnotatedCorpus, config: SamplingConfig) => {
  // Stratification pour représentativité
  const stratified = stratifyByTagAndSector(corpus, config);

  // Sélection aléatoire dans chaque strate
  const sample = randomSampleFromStrata(stratified, config.size);

  // Vérification équilibrage
  validateSampleBalance(sample);

  return sample;
};
```

### 2. Phase d'annotation double

```typescript
// Processus de double annotation aveugle
const conductDoubleAnnotation = async (sample: AnnotationSample[]) => {
  // Randomisation ordre pour éviter biais
  const shuffledSample = shuffleArray(sample);

  // Interfaces séparées pour chaque annotateur
  const expert1Annotations = await annotateByExpert(shuffledSample, "expert1");
  const expert2Annotations = await annotateByExpert(shuffledSample, "expert2");

  // Fusion et détection automatique des accords/désaccords
  const mergedAnnotations = mergeAnnotations(
    expert1Annotations,
    expert2Annotations
  );

  return mergedAnnotations;
};
```

### 3. Phase de calcul métrique

```typescript
// Calcul complet des métriques de fiabilité
const calculateReliabilityMetrics = (annotations: InterAnnotatorData[]) => {
  // Kappa global
  const globalKappa = calculateKappa(annotations);

  // Kappa par catégorie (détection catégories fragiles)
  const categoryKappas = calculateCategoryKappas(annotations);

  // Métriques complémentaires
  const precision = calculatePrecisionByCategory(annotations);
  const recall = calculateRecallByCategory(annotations);
  const f1Scores = calculateF1ScoresByCategory(annotations);

  return {
    global: globalKappa,
    byCategory: categoryKappas,
    precision,
    recall,
    f1Scores,
  };
};
```

### 4. Phase d'analyse qualitative

```typescript
// Analyse des patterns de désaccord
const analyzeDisagreementPatterns = (disagreements: DisagreementAnalysis[]) => {
  // Groupement par type de désaccord
  const byType = groupBy(disagreements, "disagreementType");

  // Identification des catégories problématiques
  const problematicCategories = identifyProblematicCategories(disagreements);

  // Suggestions d'amélioration protocole
  const recommendations = generateRecommendations(
    byType,
    problematicCategories
  );

  return {
    patterns: byType,
    problematicCategories,
    recommendations,
  };
};
```

## Intégration avec la thèse

### Correspondance sections théoriques

| Composant Level0          | Section thèse                             | Objectif                        |
| ------------------------- | ----------------------------------------- | ------------------------------- |
| `InterAnnotatorAgreement` | 4.3.1 "Protocole de contre-codage"        | Interface de double annotation  |
| `useLevel0Validation`     | 4.3.2 "Mesures d'accord inter-annotateur" | Calcul Kappa de Cohen           |
| `DisagreementAnalysis`    | 4.3.2 "Analyse par catégorie"             | Identification zones fragiles   |
| `ValidationResults`       | 4.3.2 "Amélioration du protocole"         | Recommandations méthodologiques |

### Standards scientifiques implémentés

**Kappa de Cohen (κ > 0.70)** : Seuil d'accord substantiel selon Landis & Koch (1977)

```typescript
// Validation automatique du seuil scientifique
const validateScientificThreshold = (kappa: number): ValidationStatus => {
  if (kappa > 0.8) return "quasi_perfect"; // Publication recommandée
  if (kappa > 0.7) return "substantial"; // Acceptable pour recherche
  if (kappa > 0.6) return "moderate_plus"; // Nécessite amélioration
  return "insufficient"; // Protocole à revoir
};
```

**Échantillonnage représentatif** : 200 paires adjacentes selon recommandations Artstein & Poesio (2008)

```typescript
// Calcul taille échantillon statistiquement significative
const calculateRequiredSampleSize = (
  totalCorpus: number,
  confidenceLevel: number = 0.95,
  marginOfError: number = 0.05
): number => {
  // Formule statistique pour échantillonnage
  const z = 1.96; // 95% confidence
  const p = 0.5; // Maximum variance

  return Math.ceil((z * z * p * (1 - p)) / (marginOfError * marginOfError));
};
```

### Actions de certification

```typescript
// Processus de certification Gold Standard
const certifyGoldStandard = async (validationResults: ValidationResults) => {
  // Vérification seuils scientifiques
  if (validationResults.kappaMetrics.kappa < 0.7) {
    throw new Error("Kappa insuffisant pour certification (κ < 0.70)");
  }

  // Génération certificat de fiabilité
  const certificate = {
    timestamp: new Date(),
    kappaScore: validationResults.kappaMetrics.kappa,
    sampleSize: validationResults.kappaMetrics.sampleSize,
    methodology: "Landis & Koch (1977) + Artstein & Poesio (2008)",
    validatedCategories: validationResults.categoryBreakdown,
    certificationLevel: determineCertificationLevel(
      validationResults.kappaMetrics.kappa
    ),
  };

  // Export pour inclusion dans thèse
  await exportCertificationReport(certificate);

  return certificate;
};
```

## Extensions futures

### 1. Validation multi-annotateurs

Extension du protocole binaire vers validation à N annotateurs avec calcul de Fleiss' Kappa.

### 2. Analyse prosodique

Intégration des marqueurs prosodiques dans l'évaluation de l'accord inter-annotateur.

### 3. Validation automatique

Interface de confrontation annotation manuelle vs algorithmes d'annotation automatique.

### 4. Certification continue

Système de re-validation périodique pour maintenir la fiabilité dans le temps.

---

Cette documentation technique matérialise les exigences méthodologiques de la recherche en linguistique appliquée, garantissant que les résultats de TaggerLPL respectent les standards scientifiques de validation en annotation linguistique.
