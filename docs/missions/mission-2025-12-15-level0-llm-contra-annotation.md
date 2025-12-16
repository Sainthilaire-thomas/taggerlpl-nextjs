# 🎯 Mission: Level 0 - Contre-Annotation par LLM (OpenAI)

*Session du 15 décembre 2025*

---

## 📋 Objectif

Implémenter un système de **contre-annotation automatique** utilisant OpenAI GPT-4 pour valider les annotations manuelles et remplir les colonnes `level0_gold_*` dans la table `analysis_pairs`.

**Principe** :
1. **Annotateur 1** : Annotations manuelles existantes (`strategy_tag` / `reaction_tag`)
2. **Annotateur 2** : Annotations automatiques par OpenAI GPT-4
3. **Calcul de l'accord** : Cohen's Kappa entre les deux annotateurs
4. **Consensus** : Résolution des désaccords → `level0_gold_conseiller` / `level0_gold_client`

---

## 🔄 Workflow de validation Level 0

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW LEVEL 0                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ SOURCE : analysis_pairs (901 paires)                           │
│     • strategy_tag (annotation manuelle - conseiller)              │
│     • reaction_tag (annotation manuelle - client)                  │
│                                                                     │
│  2️⃣ CONTRE-ANNOTATION : OpenAI GPT-4                               │
│     • Prompt pour X (stratégie conseiller)                         │
│     • Prompt pour Y (réaction client)                              │
│     • Batch processing (rate limiting)                             │
│                                                                     │
│  3️⃣ COMPARAISON                                                     │
│     • Calcul Cohen's Kappa                                         │
│     • Matrice de confusion                                         │
│     • Liste des désaccords                                         │
│                                                                     │
│  4️⃣ RÉSOLUTION                                                      │
│     • Accord automatique (concordance) → level0_gold_*            │
│     • Désaccords : validation manuelle ou règles                  │
│                                                                     │
│  5️⃣ SAUVEGARDE                                                      │
│     • UPDATE analysis_pairs SET level0_gold_conseiller = ...       │
│     • UPDATE analysis_pairs SET level0_annotator_agreement = kappa │
│     • UPDATE analysis_pairs SET level0_validated_at = now()        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Specs de référence

### Variables à annoter

#### Variable X (Stratégie Conseiller)

**Tags possibles** : `ENGAGEMENT` | `EXPLICATION` | `REFLET_ACQ` | `REFLET_JE` | `REFLET_VOUS` | `OUVERTURE`

**Définitions** :
- **ENGAGEMENT** : Verbes d'action mobilisant le client (vérifier, regarder, envoyer, etc.)
- **OUVERTURE** : Questions ouvertes favorisant l'expression (que se passe-t-il ?, etc.)
- **EXPLICATION** : Apport d'informations factuelles, procédures
- **REFLET_ACQ** : Reformulation avec acquiescement (d'accord, je comprends)
- **REFLET_JE** : Reformulation du conseiller centrée sur son émotion (je vois que)
- **REFLET_VOUS** : Reformulation centrée sur le client (vous me dites que)

#### Variable Y (Réaction Client)

**Tags possibles** : `CLIENT_POSITIF` | `CLIENT_NEGATIF` | `CLIENT_NEUTRE`

**Définitions** :
- **POSITIF** : Accord, satisfaction (d'accord, oui, voilà, merci, parfait)
- **NEGATIF** : Désaccord, insatisfaction (mais, non, pas normal, inadmissible)
- **NEUTRE** : Neutre, back-channel minimal (hm, mh, mmh), simple acquiescement

---

## 🛠️ Architecture technique

### 1. Service OpenAI Annotator

**Fichier à créer** : `src/features/phase3-analysis/level0-gold/domain/services/OpenAIAnnotatorService.ts`

```typescript
interface OpenAIAnnotationRequest {
  pairId: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  prev1_verbatim?: string;
  next1_verbatim?: string;
}

interface OpenAIAnnotationResult {
  pairId: number;
  x_predicted: XTag;
  x_confidence: number;
  x_reasoning: string;
  y_predicted: YTag;
  y_confidence: number;
  y_reasoning: string;
}

class OpenAIAnnotatorService {
  static async annotatePair(request: OpenAIAnnotationRequest): Promise<OpenAIAnnotationResult>
  static async annotateBatch(requests: OpenAIAnnotationRequest[]): Promise<OpenAIAnnotationResult[]>
}
```

### 2. Service Cohen's Kappa

**Fichier à créer** : `src/features/phase3-analysis/level0-gold/domain/services/KappaCalculationService.ts`

```typescript
interface KappaResult {
  po: number;      // Proportion d'accord observé
  pe: number;      // Proportion d'accord attendu par hasard
  kappa: number;   // (Po - Pe) / (1 - Pe)
  interpretation: string;  // 'Quasi-parfait' | 'Substantiel' | etc.
}

interface AnnotationPair {
  manual: string;
  llm: string;
}

class KappaCalculationService {
  static calculateKappa(pairs: AnnotationPair[]): KappaResult
  static buildConfusionMatrix(pairs: AnnotationPair[]): Record<string, Record<string, number>>
  static findDisagreements(pairs: AnnotationPair[]): DisagreementCase[]
}
```

### 3. Service Gold Standard

**Fichier à créer** : `src/features/phase3-analysis/level0-gold/domain/services/GoldStandardService.ts`

```typescript
interface GoldStandardUpdate {
  pairId: number;
  level0_gold_conseiller: string;
  level0_gold_client: string;
  level0_annotator_agreement: number;
  level0_validated_at: string;
}

class GoldStandardService {
  // Applique le consensus automatique quand accord
  static async applyConsensus(results: ComparisonResult[]): Promise<void>
  
  // Gère les désaccords (validation manuelle ou règles)
  static async resolveDisagreements(disagreements: DisagreementCase[]): Promise<void>
  
  // Met à jour analysis_pairs avec level0_gold_*
  static async updateGoldStandard(updates: GoldStandardUpdate[]): Promise<void>
}
```

---

## 🎨 Interface UI Level 0

### Composants à créer

```
src/features/phase3-analysis/level0-gold/ui/components/
├── Level0Interface.tsx              # Interface principale
├── AnnotationLauncher.tsx           # Lancement batch OpenAI
├── ComparisonResults.tsx            # Affichage Kappa + matrice
├── DisagreementResolver.tsx         # Résolution des désaccords
└── GoldStandardValidator.tsx        # Validation finale
```

### Level0Interface.tsx (layout principal)

```typescript
interface Level0InterfaceProps {}

const Level0Interface: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4">Level 0: Gold Standard</Typography>
      
      {/* Section 1: Lancement contre-annotation */}
      <AnnotationLauncher 
        onStart={handleStartAnnotation}
        progress={progress}
      />
      
      {/* Section 2: Résultats comparaison */}
      <ComparisonResults 
        kappaX={kappaX}
        kappaY={kappaY}
        confusionX={confusionX}
        confusionY={confusionY}
      />
      
      {/* Section 3: Résolution désaccords */}
      <DisagreementResolver 
        disagreements={disagreements}
        onResolve={handleResolve}
      />
      
      {/* Section 4: Validation finale */}
      <GoldStandardValidator 
        totalPairs={901}
        validatedPairs={validatedCount}
        onValidate={handleFinalValidation}
      />
    </Box>
  );
};
```

---

## 📝 Prompts OpenAI

### Prompt pour Variable X (Stratégie Conseiller)

```typescript
const X_ANNOTATION_PROMPT = `Tu es un expert en analyse conversationnelle. Ton rôle est d'annoter les tours de parole des conseillers téléphoniques selon 6 catégories.

## Catégories (UNE SEULE réponse possible)

1. ENGAGEMENT : Verbes d'action mobilisant le client (vérifier, regarder, envoyer, cliquer, consulter)
2. OUVERTURE : Questions ouvertes favorisant l'expression (que se passe-t-il ?, qu'en pensez-vous ?)
3. EXPLICATION : Apport d'informations factuelles, procédures, explications
4. REFLET_ACQ : Reformulation avec acquiescement (d'accord, je comprends, je vois)
5. REFLET_JE : Reformulation centrée sur l'émotion du conseiller (je ressens que, je constate que)
6. REFLET_VOUS : Reformulation centrée sur le client (vous me dites que, vous ressentez)

## Tour de parole à annoter

**Tour précédent** : {prev1_verbatim}

**Tour conseiller à analyser** : {conseiller_verbatim}

**Tour suivant** : {next1_verbatim}

## Instructions

1. Lis attentivement le tour de parole du conseiller
2. Identifie la stratégie conversationnelle dominante
3. Réponds UNIQUEMENT avec un JSON au format suivant :

{
  "tag": "ENGAGEMENT",
  "confidence": 0.95,
  "reasoning": "Le conseiller utilise le verbe 'vérifier' qui mobilise le client dans l'action"
}
`;
```

### Prompt pour Variable Y (Réaction Client)

```typescript
const Y_ANNOTATION_PROMPT = `Tu es un expert en analyse conversationnelle. Ton rôle est d'annoter les réactions des clients selon 3 catégories.

## Catégories (UNE SEULE réponse possible)

1. CLIENT_POSITIF : Accord, satisfaction, validation (oui, d'accord, voilà, merci, parfait, très bien)
2. CLIENT_NEGATIF : Désaccord, insatisfaction, contestation (mais, non, pas normal, inadmissible)
3. CLIENT_NEUTRE : Réponse neutre, back-channel minimal (hm, mh, mmh), acquiescement simple

## Tour de parole à annoter

**Tour conseiller précédent** : {conseiller_verbatim}

**Tour client à analyser** : {client_verbatim}

**Tour conseiller suivant** : {next1_verbatim}

## Instructions

1. Lis attentivement le tour de parole du client
2. Identifie la réaction émotionnelle/conversationnelle dominante
3. Réponds UNIQUEMENT avec un JSON au format suivant :

{
  "tag": "CLIENT_POSITIF",
  "confidence": 0.90,
  "reasoning": "Le client dit 'oui d'accord' ce qui exprime un accord clair"
}
`;
```

---

## 🔧 Implémentation par étapes

### Étape 1 : Service OpenAI (2-3h)

| Tâche | Fichier | Statut |
|-------|---------|--------|
| 1.1 Créer OpenAIAnnotatorService | `OpenAIAnnotatorService.ts` | 🔴 À faire |
| 1.2 Implémenter annotatePair() | `OpenAIAnnotatorService.ts` | 🔴 À faire |
| 1.3 Implémenter annotateBatch() avec rate limiting | `OpenAIAnnotatorService.ts` | 🔴 À faire |
| 1.4 Gestion des erreurs et retry | `OpenAIAnnotatorService.ts` | 🔴 À faire |

**Code de base** :

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export class OpenAIAnnotatorService {
  static async annotatePair(request: OpenAIAnnotationRequest): Promise<OpenAIAnnotationResult> {
    // 1. Annoter X (conseiller)
    const xPrompt = this.buildXPrompt(request);
    const xResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: xPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    
    const xResult = JSON.parse(xResponse.choices[0].message.content);
    
    // 2. Annoter Y (client)
    const yPrompt = this.buildYPrompt(request);
    const yResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: yPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    
    const yResult = JSON.parse(yResponse.choices[0].message.content);
    
    return {
      pairId: request.pairId,
      x_predicted: xResult.tag,
      x_confidence: xResult.confidence,
      x_reasoning: xResult.reasoning,
      y_predicted: yResult.tag,
      y_confidence: yResult.confidence,
      y_reasoning: yResult.reasoning,
    };
  }
  
  static async annotateBatch(requests: OpenAIAnnotationRequest[]): Promise<OpenAIAnnotationResult[]> {
    const results: OpenAIAnnotationResult[] = [];
    
    // Rate limiting : 1 requête toutes les 200ms (5 req/sec)
    for (const request of requests) {
      const result = await this.annotatePair(request);
      results.push(result);
      await this.sleep(200);
    }
    
    return results;
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Étape 2 : Service Kappa (1-2h)

| Tâche | Fichier | Statut |
|-------|---------|--------|
| 2.1 Créer KappaCalculationService | `KappaCalculationService.ts` | 🔴 À faire |
| 2.2 Implémenter calculateKappa() | `KappaCalculationService.ts` | 🔴 À faire |
| 2.3 Implémenter buildConfusionMatrix() | `KappaCalculationService.ts` | 🔴 À faire |
| 2.4 Implémenter findDisagreements() | `KappaCalculationService.ts` | 🔴 À faire |

**Code de base** :

```typescript
export class KappaCalculationService {
  static calculateKappa(pairs: AnnotationPair[]): KappaResult {
    const n = pairs.length;
    
    // 1. Calculer Po (accord observé)
    const agreements = pairs.filter(p => p.manual === p.llm).length;
    const po = agreements / n;
    
    // 2. Calculer Pe (accord attendu par hasard)
    const categories = [...new Set([...pairs.map(p => p.manual), ...pairs.map(p => p.llm)])];
    let pe = 0;
    
    for (const category of categories) {
      const p1 = pairs.filter(p => p.manual === category).length / n;
      const p2 = pairs.filter(p => p.llm === category).length / n;
      pe += p1 * p2;
    }
    
    // 3. Calculer Kappa
    const kappa = (po - pe) / (1 - pe);
    
    // 4. Interpréter selon Landis & Koch
    const interpretation = this.interpretKappa(kappa);
    
    return { po, pe, kappa, interpretation };
  }
  
  private static interpretKappa(kappa: number): string {
    if (kappa < 0) return 'Inférieur au hasard';
    if (kappa < 0.2) return 'Accord faible';
    if (kappa < 0.4) return 'Accord acceptable';
    if (kappa < 0.6) return 'Accord modéré';
    if (kappa < 0.8) return 'Accord substantiel';
    return 'Accord quasi-parfait';
  }
  
  static buildConfusionMatrix(pairs: AnnotationPair[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    for (const pair of pairs) {
      if (!matrix[pair.manual]) matrix[pair.manual] = {};
      if (!matrix[pair.manual][pair.llm]) matrix[pair.manual][pair.llm] = 0;
      matrix[pair.manual][pair.llm]++;
    }
    
    return matrix;
  }
  
  static findDisagreements(pairs: AnnotationPair[]): DisagreementCase[] {
    return pairs
      .map((pair, index) => ({ ...pair, index }))
      .filter(pair => pair.manual !== pair.llm);
  }
}
```

### Étape 3 : Interface UI (2-3h)

| Tâche | Fichier | Statut |
|-------|---------|--------|
| 3.1 Créer Level0Interface | `Level0Interface.tsx` | 🔴 À faire |
| 3.2 Créer AnnotationLauncher | `AnnotationLauncher.tsx` | 🔴 À faire |
| 3.3 Créer ComparisonResults | `ComparisonResults.tsx` | 🔴 À faire |
| 3.4 Créer DisagreementResolver | `DisagreementResolver.tsx` | 🔴 À faire |

### Étape 4 : Service Gold Standard (1-2h)

| Tâche | Fichier | Statut |
|-------|---------|--------|
| 4.1 Créer GoldStandardService | `GoldStandardService.ts` | 🔴 À faire |
| 4.2 Implémenter applyConsensus() | `GoldStandardService.ts` | 🔴 À faire |
| 4.3 Implémenter updateGoldStandard() | `GoldStandardService.ts` | 🔴 À faire |
| 4.4 API endpoint pour bulk update | `/api/level0/gold-standard` | 🔴 À faire |

---

## 📊 Résultats attendus

### Métriques de qualité

| Métrique | Cible | Interprétation |
|----------|-------|----------------|
| **Kappa X** | > 0.80 | Accord quasi-parfait avec annotations manuelles |
| **Kappa Y** | > 0.80 | Accord quasi-parfait avec annotations manuelles |
| **Taux désaccords X** | < 5% | Maximum 45 désaccords sur 901 paires |
| **Taux désaccords Y** | < 5% | Maximum 45 désaccords sur 901 paires |

### Livrable final

| Colonne | Source | Description |
|---------|--------|-------------|
| `level0_gold_conseiller` | Consensus manuel + LLM | Tag validé pour X |
| `level0_gold_client` | Consensus manuel + LLM | Tag validé pour Y |
| `level0_annotator_agreement` | Calcul Kappa | Score d'accord (0-1) |
| `level0_validated_at` | Timestamp | Date de validation |

---

## ⚙️ Configuration API OpenAI

### Variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxx
OPENAI_ORG_ID=org-xxx  # Optionnel
```

### Rate Limiting

| Paramètre | Valeur |
|-----------|--------|
| Modèle | gpt-4o |
| Requêtes/seconde | 5 (200ms entre requêtes) |
| Timeout | 30 secondes |
| Retry | 3 tentatives max |

### Coût estimé

```
901 paires × 2 annotations (X + Y) = 1802 appels
Coût moyen gpt-4o : ~$0.005 par appel
Total estimé : ~$9 pour l'ensemble du corpus
```

---

## 🎯 Critères de succès

| # | Critère | Validation |
|---|---------|------------|
| 1 | Service OpenAI annoté les 901 paires | ✅ Logs API |
| 2 | Kappa X > 0.80 | ✅ Calcul vérifié |
| 3 | Kappa Y > 0.80 | ✅ Calcul vérifié |
| 4 | Colonnes level0_gold_* remplies | ✅ SQL query |
| 5 | Interface UI fonctionnelle | ✅ Screenshot |
| 6 | Documentation thèse mise à jour | ✅ Section 4.3.4 |

---

## 📋 Actions planifiées

### Session 1 (3-4h)

- [ ] Créer OpenAIAnnotatorService
- [ ] Implémenter prompts X et Y
- [ ] Tester sur 10 paires échantillon
- [ ] Vérifier qualité des annotations

### Session 2 (2-3h)

- [ ] Créer KappaCalculationService
- [ ] Implémenter matrice de confusion
- [ ] Créer interface UI de base
- [ ] Afficher résultats comparaison

### Session 3 (2h)

- [ ] Annoter les 901 paires complètes
- [ ] Calculer Kappa final
- [ ] Identifier les désaccords
- [ ] Créer interface résolution

### Session 4 (1-2h)

- [ ] Résoudre les désaccords
- [ ] Remplir level0_gold_*
- [ ] Vérifier cohérence des données
- [ ] Documenter dans la thèse

---

## 🔗 Fichiers concernés

### À créer

```
src/features/phase3-analysis/level0-gold/
├── domain/
│   └── services/
│       ├── OpenAIAnnotatorService.ts        # 🆕 Service OpenAI
│       ├── KappaCalculationService.ts       # 🆕 Calcul Kappa
│       └── GoldStandardService.ts           # 🆕 Mise à jour Gold
│
└── ui/
    ├── components/
    │   ├── Level0Interface.tsx              # 🆕 Interface principale
    │   ├── AnnotationLauncher.tsx           # 🆕 Lancement batch
    │   ├── ComparisonResults.tsx            # 🆕 Résultats Kappa
    │   ├── DisagreementResolver.tsx         # 🆕 Résolution désaccords
    │   └── GoldStandardValidator.tsx        # 🆕 Validation finale
    │
    └── hooks/
        ├── useOpenAIAnnotation.ts           # 🆕 Hook annotation
        └── useGoldStandardValidation.ts     # 🆕 Hook validation
```

### À modifier

```
src/types/algorithm-lab/Level0Types.ts        # Types Level 0
```

---

## 📚 Références

### Cohen's Kappa

- Landis, J. R., & Koch, G. G. (1977). "The Measurement of Observer Agreement for Categorical Data"
- Formule : κ = (Po - Pe) / (1 - Pe)

### OpenAI API

- Documentation : https://platform.openai.com/docs/api-reference
- JSON mode : https://platform.openai.com/docs/guides/structured-outputs

---

## 🔗 Notes pour la prochaine session

### Points d'attention

1. **Rate limiting** : OpenAI limite à 5 req/sec sur gpt-4o → implémenter délai 200ms
2. **Coût** : ~$9 pour 901 paires → confirmer budget disponible
3. **Qualité** : Tester sur échantillon (10-20 paires) avant batch complet
4. **Désaccords** : Préparer stratégie de résolution (règles automatiques vs. manuel)

### Questions ouvertes

- Faut-il ajouter des exemples dans les prompts (few-shot) ?
- Comment gérer les désaccords où l'humain et le LLM ont tous deux raison ?
- Doit-on sauvegarder les "reasoning" du LLM pour analyse ?

---

*Prochaine étape : Étape 1 - Créer OpenAIAnnotatorService et tester sur 10 paires*
