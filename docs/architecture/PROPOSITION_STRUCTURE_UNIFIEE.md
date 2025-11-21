# Proposition : Structure Unifiée des Résultats d'Algorithmes

## 🎯 Objectif

Avoir une structure de résultat **identique** pour tous les algorithmes (X, Y, M1, M2, M3) qui :
1. Est **facile à documenter**
2. Est **simple à comprendre**
3. Est **uniforme** pour tous les algorithmes actuels et futurs
4. Permet de sauvegarder en DB **sans mapping complexe**

---

## 📦 Structure Proposée

```typescript
/**
 * Résultat universel retourné par TOUS les algorithmes
 * Cette structure est identique pour X, Y, M1, M2, M3 et tous les futurs algorithmes
 */
interface UniversalResult {
  // ========================================
  // 1. MÉTADONNÉES DE BASE (toujours présentes)
  // ========================================
  
  /** Prédiction principale (string pour classification, nombre formaté pour métriques) */
  prediction: string;
  
  /** Confiance [0-1] */
  confidence: number;
  
  /** Temps de traitement en ms */
  processingTime: number;
  
  /** Version de l'algorithme */
  algorithmVersion: string;
  
  // ========================================
  // 2. MÉTADONNÉES SYSTÈME (toujours présentes)
  // ========================================
  
  metadata: {
    /** Type de cible : conseiller, client, M1, M2, M3 */
    target: SpeakerType;
    
    /** Type d'input attendu */
    inputType: string;
    
    /** Chemin d'exécution pour debug */
    executionPath: string[];
    
    /** ID de la paire (pour le mapping DB) */
    pairId?: number;
    
    /** ID du tour */
    turnId?: number;
    
    /** ID de l'appel */
    callId?: number;
    
    // ========================================
    // 3. RÉSULTATS MÉTIER (structure unifiée)
    // ========================================
    
    /**
     * ✅ NOUVEAU : Tous les résultats métier ici
     * Les clés correspondent EXACTEMENT aux colonnes de la table analysis_pairs
     */
    dbColumns: {
      // Colonnes X (stratégie conseiller)
      x_predicted_tag?: string;
      x_confidence?: number;
      x_algorithm_key?: string;
      x_algorithm_version?: string;
      x_computed_at?: string;
      
      // Colonnes Y (réaction client)
      y_predicted_tag?: string;
      y_confidence?: number;
      y_algorithm_key?: string;
      y_algorithm_version?: string;
      y_computed_at?: string;
      
      // Colonnes M1 (verbes d'action)
      m1_verb_density?: number;
      m1_verb_count?: number;
      m1_total_words?: number;
      m1_action_verbs?: string[];
      
      // Colonnes M2 (alignement linguistique)
      m2_lexical_alignment?: number;
      m2_semantic_alignment?: number;
      m2_global_alignment?: number;
      m2_shared_terms?: string[];
      
      // Colonnes M3 (charge cognitive)
      m3_hesitation_count?: number;
      m3_cognitive_score?: number;
      m3_cognitive_load?: string;
      m3_patterns?: any;
      
      // Statut de calcul
      computation_status?: 'complete' | 'error' | 'pending';
    };
    
    // ========================================
    // 4. DONNÉES COMPLÉMENTAIRES (optionnel)
    // ========================================
    
    /**
     * Données supplémentaires pour l'UI (non sauvegardées en DB)
     * Ex: détails d'exécution, explications, visualisations
     */
    uiData?: {
      // Pour affichage détaillé
      explanation?: string;
      highlights?: string[];
      chartData?: any;
      
      // Pour debug
      intermediateSteps?: any[];
      warnings?: string[];
    };
  };
}
```

---

## 🔄 Workflow avec la nouvelle structure

### 1. L'algorithme retourne un résultat unifié

```typescript
// Exemple M2LexicalAlignment
async run(input: M2Input): Promise<UniversalResult> {
  const result = this.calculateAlignment(input);
  
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    processingTime: Date.now() - startTime,
    algorithmVersion: "1.0.0",
    metadata: {
      target: "M2",
      inputType: "M2Input",
      executionPath: ["tokenize", "jaccard", "classify"],
      pairId: input.pairId,
      
      // ✅ Colonnes DB directement mappées
      dbColumns: {
        m2_lexical_alignment: result.lexicalScore,
        m2_shared_terms: result.sharedTerms,
        computation_status: 'complete'
      },
      
      // Données UI optionnelles
      uiData: {
        explanation: `Shared terms: ${result.sharedTerms.join(', ')}`,
        chartData: { /* ... */ }
      }
    }
  };
}
```

### 2. La sauvegarde devient triviale

```typescript
const updateH2WithResults = async (results: UniversalResult[]) => {
  for (const result of results) {
    const pairId = result.metadata.pairId;
    
    // ✅ SAUVEGARDE DIRECTE - Pas de mapping complexe !
    const updateData = result.metadata.dbColumns;
    
    await supabase
      .from('analysis_pairs')
      .update(updateData)
      .eq('pair_id', pairId);
  }
};
```

---

## 📋 Migration des algorithmes existants

### M1ActionVerbCounter

**AVANT :**
```typescript
metadata: {
  density: 0.25,
  actionVerbCount: 2,
  totalTokens: 8,
  verbsFound: ['vérifier', 'traiter']
}
```

**APRÈS :**
```typescript
metadata: {
  target: "M1",
  inputType: "string",
  executionPath: [...],
  pairId: 123,
  dbColumns: {
    m1_verb_density: 0.25,
    m1_verb_count: 2,
    m1_total_words: 8,
    m1_action_verbs: ['vérifier', 'traiter'],
    computation_status: 'complete'
  },
  uiData: {
    explanation: "2 verbes d'action trouvés sur 8 mots (25%)",
    highlights: ['vérifier', 'traiter']
  }
}
```

### M2LexicalAlignment

**AVANT :**
```typescript
metadata: {
  details: {
    lexicalAlignment: 0.67,
    sharedTerms: ['traiter', 'demande']
  }
}
```

**APRÈS :**
```typescript
metadata: {
  target: "M2",
  inputType: "M2Input",
  executionPath: [...],
  pairId: 123,
  dbColumns: {
    m2_lexical_alignment: 0.67,
    m2_shared_terms: ['traiter', 'demande'],
    computation_status: 'complete'
  },
  uiData: {
    explanation: "67% d'alignement lexical",
    highlights: ['traiter', 'demande']
  }
}
```

### M3PausesCalculator

**AVANT :**
```typescript
metadata: {
  details: {
    value: 0.75,
    pauseCount: 3,
    hesitationCount: 2
  }
}
```

**APRÈS :**
```typescript
metadata: {
  target: "M3",
  inputType: "M3Input",
  executionPath: [...],
  pairId: 123,
  dbColumns: {
    m3_cognitive_score: 0.75,
    m3_hesitation_count: 2,
    m3_cognitive_load: 'ELEVEE',
    m3_patterns: { pauses: 3, hesitations: 2 },
    computation_status: 'complete'
  },
  uiData: {
    explanation: "Charge cognitive élevée détectée",
    highlights: ['euh', 'hum']
  }
}
```

---

## ✅ Avantages de cette structure

1. **Zero mapping** : `dbColumns` correspond exactement aux colonnes SQL
2. **Type-safe** : TypeScript vérifie que les clés existent
3. **Documenté** : Les noms de colonnes sont explicites
4. **Extensible** : Ajouter un nouvel algorithme = ajouter ses colonnes
5. **Séparation claire** : DB vs UI data
6. **Simple** : Pas de `details.extra.maybe.here`

---

## 🚀 Plan de migration

### Étape 1 : Créer le nouveau type (5 min)
```bash
# Créer src/types/algorithm-lab/UniversalResult.ts
```

### Étape 2 : Migrer M1 (10 min)
- Modifier M1ActionVerbCounter.ts
- Tester sur 2 paires
- Valider sauvegarde DB

### Étape 3 : Migrer M2 (10 min)
- Modifier M2LexicalAlignmentCalculator.ts
- Tester sur 2 paires
- Valider sauvegarde DB

### Étape 4 : Migrer M3 (10 min)
- Modifier PausesM3Calculator.tsx
- Tester sur 2 paires
- Valider sauvegarde DB

### Étape 5 : Simplifier updateH2WithResults (5 min)
- Remplacer tout le mapping par `result.metadata.dbColumns`
- Supprimer les conditions if/else

**Total : ~40 minutes**

---

## 📝 Documentation du type

```typescript
/**
 * @fileoverview Structure universelle des résultats d'algorithmes
 * 
 * Tous les algorithmes (X, Y, M1, M2, M3) retournent cette structure.
 * 
 * Principes :
 * 1. `dbColumns` contient EXACTEMENT les colonnes de `analysis_pairs`
 * 2. Pas de mapping complexe - les clés correspondent aux noms SQL
 * 3. `uiData` contient les données supplémentaires pour l'affichage
 * 4. Toujours retourner `computation_status: 'complete'` en cas de succès
 * 
 * @example M1 (métrique numérique)
 * ```typescript
 * return {
 *   prediction: "0.250",
 *   confidence: 0.8,
 *   metadata: {
 *     dbColumns: {
 *       m1_verb_density: 0.25,
 *       m1_verb_count: 2,
 *       computation_status: 'complete'
 *     }
 *   }
 * }
 * ```
 * 
 * @example M2 (métrique d'alignement)
 * ```typescript
 * return {
 *   prediction: "0.670",
 *   confidence: 0.9,
 *   metadata: {
 *     dbColumns: {
 *       m2_lexical_alignment: 0.67,
 *       m2_shared_terms: ['mot1', 'mot2'],
 *       computation_status: 'complete'
 *     }
 *   }
 * }
 * ```
 */
export interface UniversalResult {
  // ... (définition complète ci-dessus)
}
```

---

## 🎯 Résultat final

**Avant (complexe) :**
```typescript
if (algorithmName.includes('M1')) {
  updateData.m1_verb_density = result.metadata?.density;
} else if (algorithmName.includes('M2')) {
  updateData.m2_lexical_alignment = result.metadata?.details?.lexicalAlignment;
} else if (algorithmName.includes('M3')) {
  updateData.m3_cognitive_score = result.metadata?.details?.value;
}
```

**Après (simple) :**
```typescript
const updateData = result.metadata.dbColumns;
await supabase.from('analysis_pairs').update(updateData).eq('pair_id', pairId);
```

---

Voulez-vous qu'on commence la migration maintenant ?
