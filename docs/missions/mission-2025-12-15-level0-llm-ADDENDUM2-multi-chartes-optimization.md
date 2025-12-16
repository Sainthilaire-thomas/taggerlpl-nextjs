# 🎯 ADDENDUM 2 : Approche Multi-Chartes pour Optimisation LLM

*Complément à mission-2025-12-15-level0-llm-contra-annotation.md*

---

## 🧪 Principe : Prompt Engineering Scientifique

Au lieu de tester **une seule formulation de charte**, on va tester **plusieurs variantes** pour identifier celle qui produit le **meilleur accord** (Kappa) avec les annotations manuelles.

### Objectif

Répondre à la question : **"Quelle formulation de consigne produit les annotations LLM les plus reproductibles ?"**

Ceci permet de :
1. **Valider scientifiquement** la meilleure rédaction de charte
2. **Comparer** différentes approches (minimaliste vs détaillée, binaire vs multi-classes)
3. **Documenter dans la thèse** le processus d'optimisation des instructions LLM
4. **Sélectionner la baseline** pour l'annotation automatique future

---

## 📊 Architecture Multi-Chartes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW MULTI-CHARTES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ DÉFINIR LES CHARTES À TESTER                                   │
│     • CharteY_A : Minimaliste (3 exemples par catégorie)          │
│     • CharteY_B : Enrichie (10+ patterns par catégorie)           │
│     • CharteY_C : Binaire (POSITIF vs NON-POSITIF)                │
│     • CharteX_A : Sans contexte (classification isolée)            │
│     • CharteX_B : Avec contexte (héritage tours courts)           │
│                                                                     │
│  2️⃣ GÉNÉRER LES PROMPTS                                            │
│     Chaque charte → Prompt spécifique avec :                       │
│     • Formulation des catégories                                    │
│     • Exemples (few-shot learning)                                  │
│     • Règles d'annotation                                          │
│                                                                     │
│  3️⃣ ANNOTER LES 901 PAIRES (par charte)                            │
│     Pour chaque charte :                                            │
│     • Exécution batch OpenAI                                        │
│     • Sauvegarde résultats                                         │
│     • Durée : ~3-4 min par charte (rate limiting)                  │
│                                                                     │
│  4️⃣ CALCULER LES MÉTRIQUES                                          │
│     Pour chaque charte :                                            │
│     • Cohen's Kappa                                                 │
│     • Accuracy, Precision, Recall, F1                               │
│     • Matrice de confusion                                          │
│     • Liste des désaccords                                         │
│                                                                     │
│  5️⃣ COMPARER ET SÉLECTIONNER                                        │
│     • Tableau comparatif des Kappa                                  │
│     • Analyse des désaccords par charte                            │
│     • Sélection de la meilleure charte                             │
│     • Marquage comme baseline                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Chartes à tester

### Variable Y (Réaction Client)

#### CharteY_A - Minimaliste

```json
{
  "charte_id": "CharteY_A_v1.0.0",
  "charte_name": "Charte A - Minimaliste",
  "charte_description": "Instructions minimales avec 3 exemples par catégorie",
  "categories": {
    "CLIENT_POSITIF": {
      "description": "Le client exprime un accord ou une satisfaction",
      "examples": ["oui", "d'accord", "merci"]
    },
    "CLIENT_NEGATIF": {
      "description": "Le client exprime un désaccord ou une insatisfaction",
      "examples": ["non", "mais", "pas normal"]
    },
    "CLIENT_NEUTRE": {
      "description": "Le client donne une réponse neutre ou ambiguë",
      "examples": ["hm", "mh", "mmh"]
    }
  },
  "rules": {
    "approach": "few_shot",
    "examples_per_category": 3,
    "context_included": false
  }
}
```

**Prompt généré** :
```
Tu es un annotateur expert. Classe cette réponse client en 3 catégories :

1. CLIENT_POSITIF : Accord, satisfaction (ex: oui, d'accord, merci)
2. CLIENT_NEGATIF : Désaccord, insatisfaction (ex: non, mais, pas normal)
3. CLIENT_NEUTRE : Réponse neutre (ex: hm, mh, mmh)

Client dit : "{client_verbatim}"

Réponds UNIQUEMENT en JSON : {"tag": "...", "confidence": 0.0-1.0, "reasoning": "..."}
```

#### CharteY_B - Enrichie (recommandée)

```json
{
  "charte_id": "CharteY_B_v1.0.0",
  "charte_name": "Charte B - Enrichie avec patterns détaillés",
  "charte_description": "d'accord/oui/voilà = POSITIF, seuls hm/mh = NEUTRE",
  "categories": {
    "CLIENT_POSITIF": {
      "description": "Le client exprime un accord clair ou une satisfaction",
      "patterns": [
        "d'accord", "oui", "ouais", "ok", "voilà",
        "merci", "parfait", "très bien", "super", "excellent",
        "ça marche", "entendu", "bien sûr", "tout à fait",
        "c'est bon", "impeccable", "génial", "top"
      ],
      "rules": [
        "Les marques d'accord explicites sont toujours POSITIF",
        "Les remerciements sont POSITIF même s'ils sont brefs",
        "Les évaluations positives (super, génial) sont POSITIF"
      ]
    },
    "CLIENT_NEGATIF": {
      "description": "Le client exprime un désaccord, une contestation ou une insatisfaction",
      "patterns": [
        "mais", "non", "pas d'accord", "impossible",
        "pas normal", "inadmissible", "scandaleux",
        "j'hallucine", "vous rigolez", "c'est une blague",
        "c'est pas possible", "ça va pas", "n'importe quoi"
      ],
      "rules": [
        "Le mot 'mais' en début de phrase est généralement NEGATIF",
        "Les contestations explicites sont toujours NEGATIF",
        "Les expressions d'indignation sont NEGATIF"
      ]
    },
    "CLIENT_NEUTRE": {
      "description": "Le client donne une réponse neutre, back-channel minimal, ou ambiguë",
      "patterns": ["hm", "mh", "mmh", "euh"],
      "rules": [
        "SEULEMENT les back-channels minimaux (hm, mh) sont NEUTRE",
        "Les acquiescements comme 'oui' ou 'd'accord' sont POSITIF, pas NEUTRE",
        "En cas de doute entre POSITIF et NEUTRE, privilégier POSITIF"
      ]
    }
  },
  "priority_rules": [
    "Si accord explicite (oui, d'accord, voilà) → POSITIF",
    "Si désaccord explicite (non, mais, pas normal) → NEGATIF",
    "Si back-channel minimal uniquement (hm, mh) → NEUTRE"
  ]
}
```

**Prompt généré** :
```
Tu es un expert en analyse conversationnelle. Classe cette réaction client en 3 catégories.

## CATEGORIES

1. CLIENT_POSITIF - Le client exprime un accord clair ou une satisfaction
   Patterns : d'accord, oui, ouais, ok, voilà, merci, parfait, très bien, super, excellent, ça marche, entendu, bien sûr, tout à fait
   Règles :
   • Les marques d'accord explicites sont toujours POSITIF
   • Les remerciements sont POSITIF même s'ils sont brefs
   • Les évaluations positives (super, génial) sont POSITIF

2. CLIENT_NEGATIF - Le client exprime un désaccord, une contestation ou une insatisfaction
   Patterns : mais, non, pas d'accord, impossible, pas normal, inadmissible, scandaleux
   Règles :
   • Le mot 'mais' en début de phrase est généralement NEGATIF
   • Les contestations explicites sont toujours NEGATIF

3. CLIENT_NEUTRE - Le client donne une réponse neutre, back-channel minimal
   Patterns : hm, mh, mmh, euh
   Règles :
   • SEULEMENT les back-channels minimaux (hm, mh) sont NEUTRE
   • Les acquiescements comme 'oui' ou 'd'accord' sont POSITIF, pas NEUTRE

## REGLES DE PRIORITE

1. Si accord explicite (oui, d'accord, voilà) → POSITIF
2. Si désaccord explicite (non, mais, pas normal) → NEGATIF
3. Si back-channel minimal uniquement (hm, mh) → NEUTRE

## TOUR A ANNOTER

Conseiller précédent : "{conseiller_verbatim}"
Client dit : "{client_verbatim}"
Conseiller suivant : "{next1_verbatim}"

Réponds UNIQUEMENT en JSON : {"tag": "CLIENT_POSITIF" | "CLIENT_NEGATIF" | "CLIENT_NEUTRE", "confidence": 0.0-1.0, "reasoning": "..."}
```

#### CharteY_C - Binaire

```json
{
  "charte_id": "CharteY_C_v1.0.0",
  "charte_name": "Charte C - Classification binaire",
  "charte_description": "Simplifié : POSITIF vs NON-POSITIF",
  "categories": {
    "CLIENT_POSITIF": {
      "description": "Le client exprime un accord ou une satisfaction explicite",
      "examples": ["oui", "d'accord", "merci", "parfait", "ok"]
    },
    "CLIENT_NON_POSITIF": {
      "description": "Toute autre réaction (désaccord, neutre, ambiguë)",
      "examples": ["non", "mais", "hm", "mh", "pas normal"]
    }
  },
  "rules": {
    "threshold": "Si doute → NON_POSITIF"
  }
}
```

### Variable X (Stratégie Conseiller)

#### CharteX_A - Sans contexte

```json
{
  "charte_id": "CharteX_A_v1.0.0",
  "charte_name": "Charte A - Classification isolée",
  "charte_description": "Chaque tour classifié indépendamment, sans héritage contextuel",
  "categories": {
    "ENGAGEMENT": {
      "description": "Le conseiller mobilise le client avec un verbe d'action",
      "verbs": ["vérifier", "regarder", "consulter", "envoyer", "cliquer", "ouvrir", "aller sur"],
      "patterns": [
        "je vais {verbe}",
        "je {verbe}",
        "pouvez-vous {verbe}",
        "est-ce que vous pouvez {verbe}"
      ]
    },
    "OUVERTURE": {
      "description": "Le conseiller pose une question ouverte favorisant l'expression",
      "patterns": [
        "que se passe-t-il",
        "qu'est-ce qui",
        "comment",
        "pourquoi",
        "qu'en pensez-vous"
      ]
    },
    "EXPLICATION": {
      "description": "Le conseiller apporte une information factuelle ou explique une procédure",
      "indicators": [
        "car", "parce que", "en fait", "donc",
        "descriptions factuelles",
        "procédures"
      ]
    },
    "REFLET_ACQ": {
      "description": "Le conseiller reformule avec acquiescement",
      "patterns": ["d'accord", "je comprends", "je vois", "ok"],
      "max_words": 5
    },
    "REFLET_JE": {
      "description": "Le conseiller reformule en centrant sur son observation",
      "patterns": ["je constate que", "je vois que", "je remarque que"]
    },
    "REFLET_VOUS": {
      "description": "Le conseiller reformule en centrant sur le client",
      "patterns": ["vous me dites que", "vous ressentez", "vous indiquez"]
    }
  },
  "rules": {
    "priority_order": ["ENGAGEMENT", "OUVERTURE", "EXPLICATION", "REFLET_ACQ", "REFLET_JE", "REFLET_VOUS"],
    "context_inheritance": false,
    "min_words_for_explication": 8
  }
}
```

#### CharteX_B - Avec contexte

```json
{
  "charte_id": "CharteX_B_v1.0.0",
  "charte_name": "Charte B - Avec héritage contextuel",
  "charte_description": "Tours courts héritent du tag précédent si contexte EXPLICATION",
  "inherits_from": "CharteX_A",
  "additional_rules": {
    "context_inheritance": true,
    "inheritance_conditions": {
      "max_chars": 25,
      "inherit_from_tag": "EXPLICATION",
      "patterns_excluded": ["d'accord", "ok", "oui", "voilà"]
    },
    "inheritance_logic": "Si tour < 25 chars ET prev2_tag = EXPLICATION ET pas pattern acquiescement → hérite EXPLICATION"
  }
}
```

---

## 🛠️ Services étendus pour Multi-Chartes

### 1. CharteRegistry

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/CharteRegistry.ts`

```typescript
export interface CharteDefinition {
  charte_id: string;
  charte_name: string;
  charte_description: string;
  variable: 'X' | 'Y';
  categories: Record<string, CategoryDefinition>;
  rules?: Record<string, any>;
  priority_rules?: string[];
}

export interface CategoryDefinition {
  description: string;
  patterns?: string[];
  examples?: string[];
  rules?: string[];
}

export class CharteRegistry {
  private static chartes: Map<string, CharteDefinition> = new Map();
  
  static register(charte: CharteDefinition): void {
    this.chartes.set(charte.charte_id, charte);
  }
  
  static getCharte(charteId: string): CharteDefinition | undefined {
    return this.chartes.get(charteId);
  }
  
  static getChartesByVariable(variable: 'X' | 'Y'): CharteDefinition[] {
    return Array.from(this.chartes.values()).filter(c => c.variable === variable);
  }
  
  static getAllChartes(): CharteDefinition[] {
    return Array.from(this.chartes.values());
  }
}

// Enregistrement des chartes au démarrage
CharteRegistry.register(CHARTE_Y_A);
CharteRegistry.register(CHARTE_Y_B);
CharteRegistry.register(CHARTE_Y_C);
CharteRegistry.register(CHARTE_X_A);
CharteRegistry.register(CHARTE_X_B);
```

### 2. PromptGenerator (génération dynamique)

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/PromptGenerator.ts`

```typescript
export class PromptGenerator {
  /**
   * Génère un prompt spécifique selon la charte
   */
  static generatePrompt(
    charte: CharteDefinition,
    request: OpenAIAnnotationRequest
  ): string {
    const variable = charte.variable;
    
    if (variable === 'Y') {
      return this.generateYPrompt(charte, request);
    } else {
      return this.generateXPrompt(charte, request);
    }
  }
  
  private static generateYPrompt(
    charte: CharteDefinition,
    request: OpenAIAnnotationRequest
  ): string {
    let prompt = `Tu es un expert en analyse conversationnelle. `;
    prompt += `Classe cette réaction client selon la charte "${charte.charte_name}".\n\n`;
    
    // Description de la charte
    prompt += `## DESCRIPTION\n${charte.charte_description}\n\n`;
    
    // Catégories
    prompt += `## CATEGORIES\n\n`;
    Object.entries(charte.categories).forEach(([tag, def]) => {
      prompt += `**${tag}** - ${def.description}\n`;
      
      if (def.patterns && def.patterns.length > 0) {
        prompt += `  Patterns : ${def.patterns.join(', ')}\n`;
      }
      
      if (def.rules && def.rules.length > 0) {
        prompt += `  Règles :\n`;
        def.rules.forEach(rule => {
          prompt += `  • ${rule}\n`;
        });
      }
      
      prompt += '\n';
    });
    
    // Règles de priorité
    if (charte.priority_rules && charte.priority_rules.length > 0) {
      prompt += `## REGLES DE PRIORITE\n\n`;
      charte.priority_rules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
      prompt += '\n';
    }
    
    // Tour à annoter
    prompt += `## TOUR A ANNOTER\n\n`;
    if (request.prev1_verbatim) {
      prompt += `Conseiller précédent : "${request.prev1_verbatim}"\n`;
    }
    prompt += `Client dit : "${request.client_verbatim}"\n`;
    if (request.next1_verbatim) {
      prompt += `Conseiller suivant : "${request.next1_verbatim}"\n`;
    }
    
    // Format de réponse
    const tags = Object.keys(charte.categories).map(t => `"${t}"`).join(' | ');
    prompt += `\n## INSTRUCTIONS\n\n`;
    prompt += `Réponds UNIQUEMENT en JSON :\n`;
    prompt += `{"tag": ${tags}, "confidence": 0.0-1.0, "reasoning": "..."}`;
    
    return prompt;
  }
  
  private static generateXPrompt(
    charte: CharteDefinition,
    request: OpenAIAnnotationRequest
  ): string {
    // Logique similaire pour variable X
    // ...
  }
}
```

### 3. MultiCharteAnnotator (orchestrateur)

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/MultiCharteAnnotator.ts`

```typescript
export interface CharteTestResult {
  charte_id: string;
  charte_name: string;
  variable: 'X' | 'Y';
  annotations: OpenAIAnnotationResult[];
  kappa: number;
  accuracy: number;
  metrics: ClassificationMetrics;
  disagreements: DisagreementCase[];
  execution_time_ms: number;
}

export class MultiCharteAnnotator {
  /**
   * Teste toutes les chartes d'une variable et retourne les résultats
   */
  static async testAllChartes(
    variable: 'X' | 'Y',
    analysisPairs: AnalysisPair[]
  ): Promise<CharteTestResult[]> {
    const chartes = CharteRegistry.getChartesByVariable(variable);
    const results: CharteTestResult[] = [];
    
    for (const charte of chartes) {
      console.log(`Testing ${charte.charte_name}...`);
      
      const startTime = Date.now();
      
      // Annoter avec cette charte
      const annotations = await this.annotateWithCharte(charte, analysisPairs);
      
      // Calculer les métriques
      const kappa = this.calculateKappa(annotations, analysisPairs, variable);
      const metrics = this.calculateMetrics(annotations, analysisPairs, variable);
      const disagreements = this.findDisagreements(annotations, analysisPairs, variable);
      
      const executionTime = Date.now() - startTime;
      
      results.push({
        charte_id: charte.charte_id,
        charte_name: charte.charte_name,
        variable,
        annotations,
        kappa,
        accuracy: metrics.accuracy,
        metrics,
        disagreements,
        execution_time_ms: executionTime,
      });
      
      console.log(`✓ ${charte.charte_name}: Kappa=${kappa.toFixed(3)}, Accuracy=${(metrics.accuracy * 100).toFixed(1)}%`);
    }
    
    return results;
  }
  
  private static async annotateWithCharte(
    charte: CharteDefinition,
    analysisPairs: AnalysisPair[]
  ): Promise<OpenAIAnnotationResult[]> {
    const requests: OpenAIAnnotationRequest[] = analysisPairs.map(pair => ({
      pairId: pair.pair_id,
      conseiller_verbatim: pair.conseiller_verbatim,
      client_verbatim: pair.client_verbatim,
      prev1_verbatim: pair.prev1_turn_verbatim,
      next1_verbatim: pair.next1_turn_verbatim,
    }));
    
    const results: OpenAIAnnotationResult[] = [];
    
    for (const request of requests) {
      // Générer le prompt selon la charte
      const prompt = PromptGenerator.generatePrompt(charte, request);
      
      // Appeler OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      
      results.push({
        pairId: request.pairId,
        x_predicted: charte.variable === 'X' ? result.tag : undefined,
        y_predicted: charte.variable === 'Y' ? result.tag : undefined,
        x_confidence: charte.variable === 'X' ? result.confidence : undefined,
        y_confidence: charte.variable === 'Y' ? result.confidence : undefined,
        x_reasoning: charte.variable === 'X' ? result.reasoning : undefined,
        y_reasoning: charte.variable === 'Y' ? result.reasoning : undefined,
      });
      
      // Rate limiting
      await this.sleep(200);
    }
    
    return results;
  }
  
  /**
   * Sélectionne la meilleure charte selon le Kappa
   */
  static selectBestCharte(results: CharteTestResult[]): CharteTestResult {
    return results.reduce((best, current) => 
      current.kappa > best.kappa ? current : best
    );
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🎨 Interface UI étendue

### CharteComparisonPanel.tsx

```typescript
interface CharteComparisonPanelProps {
  xResults: CharteTestResult[];
  yResults: CharteTestResult[];
}

export const CharteComparisonPanel: React.FC<CharteComparisonPanelProps> = ({
  xResults,
  yResults,
}) => {
  const [selectedX, setSelectedX] = useState<string | null>(null);
  const [selectedY, setSelectedY] = useState<string | null>(null);
  
  const bestX = MultiCharteAnnotator.selectBestCharte(xResults);
  const bestY = MultiCharteAnnotator.selectBestCharte(yResults);
  
  return (
    <Box>
      <Typography variant="h5" mb={3}>Comparaison des Chartes</Typography>
      
      {/* Tableau comparatif Variable X */}
      <Box mb={4}>
        <Typography variant="h6" color="primary" mb={2}>Variable X (Stratégie)</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Charte</TableCell>
                <TableCell>Kappa</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Désaccords</TableCell>
                <TableCell>Temps (s)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {xResults.map(result => (
                <TableRow
                  key={result.charte_id}
                  selected={result.charte_id === bestX.charte_id}
                  sx={{ bgcolor: result.charte_id === bestX.charte_id ? 'success.light' : undefined }}
                >
                  <TableCell>
                    <Typography fontWeight={result.charte_id === bestX.charte_id ? 'bold' : 'normal'}>
                      {result.charte_name}
                      {result.charte_id === bestX.charte_id && (
                        <Chip label="⭐ Meilleure" size="small" color="success" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color={result.kappa > 0.8 ? 'success.main' : result.kappa > 0.6 ? 'warning.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {result.kappa.toFixed(3)}
                    </Typography>
                  </TableCell>
                  <TableCell>{(result.accuracy * 100).toFixed(1)}%</TableCell>
                  <TableCell>{result.disagreements.length}</TableCell>
                  <TableCell>{(result.execution_time_ms / 1000).toFixed(1)}s</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => setSelectedX(result.charte_id)}
                    >
                      Voir détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Tableau comparatif Variable Y */}
      <Box>
        <Typography variant="h6" color="primary" mb={2}>Variable Y (Réaction)</Typography>
        {/* Structure similaire */}
      </Box>
      
      {/* Section recommandations */}
      <Box mt={4} p={3} bgcolor="info.light" borderRadius={2}>
        <Typography variant="h6" mb={2}>📊 Recommandations</Typography>
        <Typography>
          • <strong>Variable X :</strong> {bestX.charte_name} (Kappa = {bestX.kappa.toFixed(3)})
        </Typography>
        <Typography>
          • <strong>Variable Y :</strong> {bestY.charte_name} (Kappa = {bestY.kappa.toFixed(3)})
        </Typography>
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
          Sélectionner comme baselines
        </Button>
      </Box>
    </Box>
  );
};
```

---

## 📊 Workflow complet révisé

```
Session 1 (3-4h) : Définition et services
├── Créer CharteRegistry + définitions des 5 chartes
├── Créer PromptGenerator
├── Créer MultiCharteAnnotator
└── Tester sur 10 paires échantillon

Session 2 (2-3h) : Tests exhaustifs
├── Tester CharteY_A sur 901 paires → Kappa_A
├── Tester CharteY_B sur 901 paires → Kappa_B
├── Tester CharteY_C sur 901 paires → Kappa_C
└── Comparer les résultats (durée ~10-12 min total)

Session 3 (2h) : Analyse et sélection
├── Créer CharteComparisonPanel
├── Analyser les désaccords par charte
├── Sélectionner la meilleure charte
└── Marquer comme baseline

Session 4 (1-2h) : Validation finale
├── Résoudre désaccords avec meilleure charte
├── Appliquer consensus → level0_gold_*
└── Documenter pour la thèse
```

---

## 💡 Avantages de l'approche Multi-Chartes

| Avantage | Description |
|----------|-------------|
| **Scientifique** | Valide empiriquement la meilleure formulation de consigne |
| **Reproductible** | Processus documenté et répétable |
| **Optimisé** | Identifie le prompt le plus performant |
| **Documentable** | Section thèse : "Optimisation des instructions LLM" |
| **Flexible** | Facilite l'ajout de nouvelles chartes à tester |

---

## 🎯 Métriques de comparaison

Pour chaque charte, on mesure :

| Métrique | Formule | Interprétation |
|----------|---------|----------------|
| **Kappa** | (Po - Pe) / (1 - Pe) | Accord avec annotations manuelles |
| **Accuracy** | Correct / Total | Taux de prédictions correctes |
| **Disagreements** | Count(predicted ≠ gold) | Nombre de désaccords |
| **Execution Time** | Durée totale | Temps d'annotation (901 paires) |

**Critère de sélection** : Kappa maximal (puis Accuracy si égalité)

---

## 📝 Documentation thèse

Cette approche permet de rédiger une section méthodologique complète :

**Section 4.3.4 - Validation des chartes d'annotation par LLM**

1. Définition de N variantes de chartes
2. Génération de prompts spécifiques
3. Test sur corpus complet (901 paires)
4. Calcul du Kappa pour chaque variante
5. Sélection de la charte optimale
6. Analyse comparative des performances

**Résultats attendus** :
- Tableau comparatif des Kappa par charte
- Analyse qualitative des désaccords
- Discussion sur l'influence de la formulation

---

*Cette approche transforme Level 0 en une véritable étude scientifique d'optimisation de prompts* 🧪
