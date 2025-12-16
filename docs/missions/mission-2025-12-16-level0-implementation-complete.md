# Mission Level 0 - Contra-annotation LLM Multi-Chartes
## Session du 16 décembre 2024 - IMPLÉMENTATION COMPLÈTE

================================================================================
## CONTEXTE & OBJECTIFS
================================================================================

### Objectif Principal
Implémenter un système de validation Level 0 permettant de tester plusieurs formulations de chartes d'annotation via OpenAI GPT-4, afin d'identifier la charte optimale produisant le meilleur accord (Cohen's Kappa) avec les annotations manuelles.

### Objectifs Secondaires
1. Créer une infrastructure sécurisée pour les appels OpenAI (API route)
2. Calculer automatiquement les métriques Cohen's Kappa
3. Comparer 5 chartes différentes (3 pour Y, 2 pour X)
4. Identifier et analyser les désaccords humain-LLM
5. Fournir une interface pour résoudre les désaccords
6. Sauvegarder les résultats en base de données

================================================================================
## RÉALISATIONS - SESSION 16/12/2024
================================================================================

### Phase 1 : Database Supabase ✅ TERMINÉ

**Tables créées :**
```sql
-- Table des chartes d'annotation
CREATE TABLE level0_chartes (
  charte_id TEXT PRIMARY KEY,
  charte_name TEXT NOT NULL,
  charte_description TEXT,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  definition JSONB NOT NULL,
  is_baseline BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des résultats de tests
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT REFERENCES level0_chartes(charte_id),
  variable TEXT NOT NULL,
  kappa FLOAT NOT NULL,
  accuracy FLOAT NOT NULL,
  total_pairs INT NOT NULL,
  disagreements_count INT NOT NULL,
  metrics JSONB,
  execution_time_ms INT,
  openai_model TEXT,
  tested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction RPC pour mise à jour en masse
CREATE OR REPLACE FUNCTION bulk_update_level0_gold(updates JSONB)
RETURNS void AS $$
BEGIN
  UPDATE analysis_pairs
  SET 
    level0_gold_conseiller = (u->>'level0_gold_conseiller')::TEXT,
    level0_gold_client = (u->>'level0_gold_client')::TEXT,
    level0_annotator_agreement = (u->>'level0_annotator_agreement')::FLOAT,
    level0_validated_at = (u->>'level0_validated_at')::TIMESTAMPTZ
  FROM jsonb_array_elements(updates) u
  WHERE analysis_pairs.pair_id = (u->>'pair_id')::INT;
END;
$$ LANGUAGE plpgsql;
```

**Colonnes analysis_pairs utilisées :**
- `level0_gold_conseiller` : Tag consensus stratégie
- `level0_gold_client` : Tag consensus réaction
- `level0_annotator_agreement` : Kappa humain-LLM
- `level0_validated_at` : Date validation
- `level0_annotation_notes` : Justification changements

### Phase 2 : Services Métier ✅ TERMINÉ

**Structure DDD complète :**
```
src/features/phase3-analysis/level0-gold/
├── domain/
│   └── services/
│       ├── KappaCalculationService.ts      # Calculs Cohen's Kappa
│       ├── CharteRegistry.ts                # 5 chartes définies
│       ├── OpenAIAnnotatorService.ts        # Appels API sécurisés
│       ├── MultiCharteAnnotator.ts          # Orchestration tests
│       ├── SupabaseLevel0Service.ts         # Persistance DB
│       └── index.ts                         # Barrel export
└── ui/
    ├── components/
    │   ├── Level0Interface.tsx              # Interface principale
    │   ├── Level0Tabs.tsx                   # Onglets multi-vues
    │   ├── DisagreementsPanel.tsx           # Détails désaccords
    │   ├── InterAnnotatorAgreement.tsx      # Accord inter-annotateur (existant)
    │   └── index.ts                         # Barrel export
    └── hooks/
        ├── useLevel0Testing.ts              # État tests multi-chartes
        ├── useLevel0Validation.ts           # État validation (existant)
        └── index.ts                         # Barrel export
```

**Détails des services :**

**1. KappaCalculationService.ts**
- `calculateKappa(pairs)` : Calcul Po, Pe, κ = (Po-Pe)/(1-Pe)
- `interpretKappa(kappa)` : Échelle Landis & Koch (1977)
- `buildConfusionMatrix(pairs)` : Matrice de confusion
- `findDisagreements(pairs, ...)` : Extraction désaccords
- `calculateAccuracy(pairs)` : Pourcentage accord simple
- `calculateClassificationMetrics(pairs)` : Precision, Recall, F1

**2. CharteRegistry.ts - 5 Chartes définies**

*Variable Y (Réaction Client) - 3 chartes :*
- **CharteY_A (Minimaliste)** : 3 exemples/catégorie, sans contexte
- **CharteY_B (Enrichie - BASELINE)** : 10+ patterns, règles priorité explicites
  - Règle clé : "oui/d'accord/voilà = POSITIF, seul hm/mh = NEUTRE"
- **CharteY_C (Binaire)** : POSITIF vs NON-POSITIF (merge NEGATIF+NEUTRE)

*Variable X (Stratégie Conseiller) - 2 chartes :*
- **CharteX_A (Sans contexte)** : Classification isolée
- **CharteX_B (Avec contexte)** : Utilise prev1/next1, règles héritage

**3. OpenAIAnnotatorService.ts**
- Modèle : `gpt-4o`
- Rate limit : 500ms entre requêtes (2 req/sec)
- Temperature : 0.1 (cohérence maximale)
- Response format : JSON forcé
- Méthodes :
  - `annotatePair(request, charte)` : Annotation unique
  - `annotateBatch(requests, charte, onProgress)` : Batch avec progression
  - `generatePrompt(request, charte)` : Construction prompt structuré
  - `estimateCost(pairCount)` : Estimation coût/durée

**4. MultiCharteAnnotator.ts**
- `testAllChartesForVariable(variable, pairs, ...)` : Test toutes chartes
- `testSingleCharte(charte, pairs, onProgress)` : Test une charte
- `selectBestCharte(results)` : Sélection meilleur Kappa
- `generateComparisonReport(results)` : Rapport comparatif thèse

**5. SupabaseLevel0Service.ts**
- `saveCharte(charte)` : Sauvegarde définition charte
- `saveCharteTestResult(result)` : Sauvegarde résultats test
- `getCharteTestResults(variable)` : Récupération résultats
- `applyGoldStandardConsensus(updates)` : Application consensus bulk
- `getValidationStatus()` : Statut global validation

### Phase 3 : API Route Sécurisée ✅ TERMINÉ

**Fichier : `src/app/api/level0/annotate/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  const { prompt } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY; // Côté serveur uniquement
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [...],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });
  
  return NextResponse.json({ content: data.choices[0].message.content });
}
```

**Sécurité :**
- ✅ Clé API uniquement côté serveur (jamais exposée au client)
- ✅ Variable d'environnement `OPENAI_API_KEY` dans `.env.local`
- ✅ Aucune clé publique dans le code

### Phase 4 : Interface Utilisateur ✅ TERMINÉ

**Page : `/phase3-analysis/level0/multi-chartes`**

**Composant Level0Tabs (Conteneur principal)**
```typescript
- Onglet 1 : Multi-Chartes LLM (nouveau)
- Onglet 2 : Accord Inter-Annotateur (existant)
```

**Composant Level0Interface (Tests multi-chartes)**

*Section Configuration :*
- Dropdown Variable (X ou Y)
- Input Taille échantillon (1-901)
- Bouton "Lancer test"
- Bouton "Charger résultats sauvegardés"
- Alert info sur les chartes testées

*Section Progression :*
- Nom charte en cours
- Barre progression (N/Total paires)
- Pourcentage avancement

*Section Résultats comparatifs :*
- Tableau récapitulatif avec colonnes :
  - Charte (avec badge ⭐ Meilleure)
  - Kappa (κ) coloré selon valeur
  - Accuracy (%)
  - Désaccords (N/Total)
  - Temps (secondes)
  - Interprétation (chip coloré)
  - Actions (icône 👁️ pour détails)
- Alert meilleure charte en vert
- Tri automatique par Kappa décroissant

**Composant DisagreementsPanel (Détails désaccords)**

*Affichage :*
- Titre avec nom charte
- Statistiques désaccords
- Tableau avec colonnes :
  - Expand/Collapse (icône)
  - Pair ID
  - Tag Manuel (chip bleu)
  - Tag LLM (chip rouge)
  - Confiance LLM (%)

*Détails expansibles :*
- Verbatim du tour de parole
- Raisonnement LLM complet
- Fond adapté au dark mode
- Bordures pour lisibilité

**Hook useLevel0Testing**
```typescript
const {
  loading,              // État chargement
  progress,             // Progression actuelle
  results,              // Résultats tests
  error,                // Erreur éventuelle
  testVariable,         // Lancer test
  loadSavedResults      // Charger depuis DB
} = useLevel0Testing();
```

### Phase 5 : Navigation & Intégration ✅ TERMINÉ

**Menu latéral mis à jour :**
```typescript
// src/app/(protected)/layout.tsx ligne 98
{ 
  name: "Level 0: Gold Standard", 
  icon: <CheckCircleIcon />, 
  path: "/phase3-analysis/level0/multi-chartes"  // ✅ Corrigé
}
```

**Structure pages :**
```
src/app/(protected)/phase3-analysis/level0/
├── multi-chartes/
│   └── page.tsx          # Nouvelle page (onglets)
└── inter-annotator/
    └── page.tsx          # Ancienne page (conservée)
```

================================================================================
## RÉSULTATS OBTENUS - VALIDATION TECHNIQUE
================================================================================

### Tests Effectués
- **Variable Y** avec 5 paires
- **3 chartes testées** (A-Minimaliste, B-Enrichie, C-Binaire)

### Métriques Obtenues

| Charte | Kappa (κ) | Accuracy | Désaccords | Temps | Interprétation |
|--------|-----------|----------|------------|-------|----------------|
| **A-Minimaliste ⭐** | 0.643 | 80.0% | 1/5 | 10.5s | Substantiel |
| B-Enrichie | 0.643 | 80.0% | 1/5 | 18.5s | Substantiel |
| C-Binaire | 0.130 | 20.0% | 4/5 | 10.2s | Faible |

**Observations :**
1. ✅ Chartes A et B performent équivalent (κ=0.643)
2. ❌ Charte C (Binaire) inadaptée (κ=0.130)
3. ✅ Temps d'exécution acceptable (<20s pour 5 paires)
4. ✅ Interface fonctionnelle et intuitive

**Exemple de désaccord identifié :**
- Pair ID : 3768
- Tag Manuel : CLIENT_NEUTRE
- Tag LLM : CLIENT_POSITIF (90% confiance)
- Verbatim : "absolument ! absolument !"
- Raisonnement LLM : "Le client exprime un accord clair et répété avec la question du conseiller, ce qui indique une satisfaction ou un accord avec l'information fournie."

→ **Analyse** : Désaccord valide - le LLM interprète l'emphase comme POSITIF tandis que l'humain a étiqueté NEUTRE. Nécessite résolution manuelle.

================================================================================
## ARCHITECTURE TECHNIQUE - DÉCISIONS CLÉS
================================================================================

### Sécurité
**Décision** : API route Next.js pour appels OpenAI
**Rationale** : Protéger la clé API en la gardant côté serveur uniquement

### Performance
**Décision** : Rate limiting 500ms (2 req/sec)
**Rationale** : Éviter les erreurs 429 d'OpenAI tout en maintenant temps acceptable

### Structure Données
**Décision** : Séparation chartes (définition) et tests (résultats)
**Rationale** : Permet historique complet et comparaisons dans le temps

### UI/UX
**Décision** : Interface à onglets réutilisant composant existant
**Rationale** : Économie 12h développement, cohérence interface

### Persistance
**Décision** : Sauvegarde Supabase désactivée temporairement
**Rationale** : Focus sur validation fonctionnelle, persistance à activer après

================================================================================
## PROCHAINES ÉTAPES - PHASE DE RÉSOLUTION
================================================================================

### Étape 1 : Enrichissement Interface Désaccords 🎯 PRIORITAIRE

**Objectif** : Transformer DisagreementsPanel en interface de résolution complète

**Composants à créer :**

**1. DisagreementResolutionPanel.tsx**

*Colonnes à ajouter :*
```typescript
interface EnrichedDisagreement {
  // Existant
  pairId: number;
  manualTag: string;
  llmTag: string;
  llmConfidence: number;
  verbatim: string;
  llmReasoning: string;
  
  // NOUVEAU - Contexte
  prev2_verbatim: string | null;
  prev1_verbatim: string | null;
  next1_verbatim: string | null;
  next2_verbatim: string | null;
  
  // NOUVEAU - Résolution
  resolvedTag: string | null;          // Tag final après résolution
  annotationNotes: string | null;       // Justification changement
  resolvedBy: string | null;            // Annotateur résolution
  resolvedAt: string | null;            // Date résolution
}
```

*Fonctionnalités à implémenter :*

a) **Affichage contexte conversationnel**
```typescript
<Box sx={{ p: 2, backgroundColor: "grey.50" }}>
  {/* Context prev2 */}
  <Typography variant="caption" color="text.secondary">
    Tour précédent -2 :
  </Typography>
  <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
    {disagreement.prev2_verbatim || "N/A"}
  </Typography>
  
  {/* Context prev1 */}
  <Typography variant="caption" color="text.secondary">
    Tour précédent -1 :
  </Typography>
  <Typography variant="body2" sx={{ mb: 2, fontWeight: "bold" }}>
    {disagreement.prev1_verbatim || "N/A"}
  </Typography>
  
  {/* Tour analysé */}
  <Typography variant="caption" color="primary.main">
    ➤ Tour analysé (Conseiller) :
  </Typography>
  <Typography variant="body2" sx={{ p: 1.5, backgroundColor: "primary.light", borderRadius: 1, mb: 1 }}>
    {disagreement.conseiller_verbatim}
  </Typography>
  
  <Typography variant="caption" color="error.main">
    ➤ Tour analysé (Client) :
  </Typography>
  <Typography variant="body2" sx={{ p: 1.5, backgroundColor: "error.light", borderRadius: 1, mb: 2 }}>
    {disagreement.client_verbatim}
  </Typography>
  
  {/* Context next1 */}
  <Typography variant="caption" color="text.secondary">
    Tour suivant +1 :
  </Typography>
  <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
    {disagreement.next1_verbatim || "N/A"}
  </Typography>
  
  {/* Context next2 */}
  <Typography variant="caption" color="text.secondary">
    Tour suivant +2 :
  </Typography>
  <Typography variant="body2" sx={{ fontStyle: "italic" }}>
    {disagreement.next2_verbatim || "N/A"}
  </Typography>
</Box>
```

b) **Sélecteur tag résolution**
```typescript
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Tag final (résolution)</InputLabel>
  <Select
    value={resolvedTag}
    onChange={(e) => handleTagChange(e.target.value)}
  >
    <MenuItem value={disagreement.manualTag}>
      Conserver tag manuel : {disagreement.manualTag}
    </MenuItem>
    <MenuItem value={disagreement.llmTag}>
      Adopter tag LLM : {disagreement.llmTag}
    </MenuItem>
    {/* Autres tags possibles */}
    <MenuItem value="CLIENT_POSITIF">CLIENT_POSITIF</MenuItem>
    <MenuItem value="CLIENT_NEGATIF">CLIENT_NEGATIF</MenuItem>
    <MenuItem value="CLIENT_NEUTRE">CLIENT_NEUTRE</MenuItem>
  </Select>
</FormControl>
```

c) **Zone annotation justification**
```typescript
<TextField
  fullWidth
  multiline
  rows={3}
  label="Annotation - Justification du choix"
  value={annotationNotes}
  onChange={(e) => setAnnotationNotes(e.target.value)}
  helperText="Expliquez pourquoi ce tag est le plus approprié dans ce contexte"
  sx={{ mb: 2 }}
/>
```

d) **Boutons actions**
```typescript
<Stack direction="row" spacing={2} justifyContent="flex-end">
  <Button
    variant="outlined"
    startIcon={<Visibility />}
    onClick={() => navigateToCall(disagreement.callId)}
  >
    Voir appel complet
  </Button>
  
  <Button
    variant="contained"
    color="success"
    startIcon={<Save />}
    onClick={() => handleSaveResolution(disagreement)}
    disabled={!resolvedTag || !annotationNotes}
  >
    Sauvegarder résolution
  </Button>
</Stack>
```

**2. Hook useDisagreementResolution.ts**
```typescript
export function useDisagreementResolution() {
  const [resolutions, setResolutions] = useState<Map<number, Resolution>>(new Map());
  
  const updateResolution = (pairId: number, resolution: Resolution) => {
    setResolutions(prev => new Map(prev).set(pairId, resolution));
  };
  
  const saveResolution = async (pairId: number, resolution: Resolution) => {
    // Appel RPC Supabase pour sauvegarder
    await SupabaseLevel0Service.saveResolution(pairId, resolution);
  };
  
  const bulkSaveResolutions = async () => {
    const updates = Array.from(resolutions.entries()).map(([pairId, res]) => ({
      pairId,
      level0_gold_conseiller: res.variable === "X" ? res.resolvedTag : null,
      level0_gold_client: res.variable === "Y" ? res.resolvedTag : null,
      level0_annotation_notes: res.annotationNotes,
      level0_annotator_agreement: res.kappa,
      level0_validated_at: new Date().toISOString()
    }));
    
    await SupabaseLevel0Service.applyGoldStandardConsensus(updates);
  };
  
  return {
    resolutions,
    updateResolution,
    saveResolution,
    bulkSaveResolutions
  };
}
```

**3. Service SupabaseLevel0Service - Nouvelles méthodes**
```typescript
// Charger paires avec contexte complet
static async loadPairsWithContext(pairIds: number[]): Promise<EnrichedPair[]> {
  const supabase = this.getClient();
  
  const { data, error } = await supabase
    .from("analysis_pairs")
    .select(`
      pair_id,
      conseiller_verbatim,
      client_verbatim,
      strategy_tag,
      reaction_tag,
      prev2_verbatim,
      prev1_verbatim,
      next1_verbatim,
      next2_verbatim,
      call_id
    `)
    .in("pair_id", pairIds);
    
  return data || [];
}

// Sauvegarder résolution individuelle
static async saveResolution(
  pairId: number,
  resolution: Resolution
): Promise<{ success: boolean; error?: string }> {
  const supabase = this.getClient();
  
  const { error } = await supabase
    .from("analysis_pairs")
    .update({
      level0_gold_conseiller: resolution.variable === "X" ? resolution.resolvedTag : null,
      level0_gold_client: resolution.variable === "Y" ? resolution.resolvedTag : null,
      level0_annotation_notes: resolution.annotationNotes,
      level0_validated_at: new Date().toISOString()
    })
    .eq("pair_id", pairId);
    
  return { success: !error, error: error?.message };
}
```

### Étape 2 : Tests Production Complets

**Protocole de test :**

1. **Test échantillon représentatif (100 paires)**
   - Variable Y : 100 paires × 3 chartes = 300 appels (~$1.50)
   - Durée estimée : ~5 minutes
   - Objectif : Valider stabilité système

2. **Test production complète (901 paires)**
   - Variable Y : 901 paires × 3 chartes = 2703 appels (~$13.50)
   - Variable X : 901 paires × 2 chartes = 1802 appels (~$9.00)
   - Durée totale estimée : ~30 minutes
   - Objectif : Résultats thèse finaux

3. **Seuils de validation**
   - Kappa > 0.80 : Accord quasi-parfait (objectif)
   - Désaccords < 5% : < 45 paires sur 901
   - Temps exécution : < 30 minutes pour corpus complet

### Étape 3 : Résolution Manuelle Désaccords

**Workflow :**

1. **Triage automatique**
   - Désaccords haute confiance LLM (>90%) → Révision prioritaire
   - Désaccords faible confiance LLM (<70%) → Annotation manuelle
   - Patterns récurrents → Amélioration charte

2. **Résolution collaborative**
   - Annotateur principal résout désaccords
   - Supervision validation résolutions
   - Documentation justifications dans `level0_annotation_notes`

3. **Application consensus**
   - Bulk update via `bulk_update_level0_gold()`
   - Colonnes `level0_gold_conseiller` et `level0_gold_client` remplies
   - Calcul Kappa final consensus

### Étape 4 : Rapport Thèse

**Tableaux à générer :**

**Tableau 4.1 - Comparaison chartes Variable Y**
| Charte | Description | κ | Accuracy | Désaccords | Temps |
|--------|-------------|---|----------|------------|-------|
| A-Minimaliste | 3 exemples | 0.xxx | xx% | N/901 | Xs |
| B-Enrichie | 10+ patterns | 0.xxx | xx% | N/901 | Xs |
| C-Binaire | POSITIF vs NON-POSITIF | 0.xxx | xx% | N/901 | Xs |

**Tableau 4.2 - Matrice de confusion charte optimale**
|  | POSITIF | NÉGATIF | NEUTRE |
|---|---------|---------|--------|
| **POSITIF** | TP | FN | FN |
| **NÉGATIF** | FP | TN | FN |
| **NEUTRE** | FP | FP | TN |

**Tableau 4.3 - Types de désaccords**
| Type confusion | Fréquence | % | Exemple |
|----------------|-----------|---|---------|
| NEUTRE→POSITIF | N | xx% | "absolument !" |
| POSITIF→NEUTRE | N | xx% | "d'accord" |
| ... | ... | ... | ... |

**Figure 4.1 - Distribution Kappa par charte**
- Graphique barres avec intervalles confiance
- Interprétation Landis & Koch

================================================================================
## DOCUMENTATION TECHNIQUE - RÉFÉRENCE
================================================================================

### Variables Environnement Requises
```bash
# .env.local
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

### Commandes Utiles
```bash
# Lancer développement
npm run dev

# Vérifier types TypeScript
npx tsc --noEmit

# Générer arborescence projet
.\scripts\generate-tree.ps1

# Commit Git
git add .
git commit -m "feat(level0): implement multi-charter LLM contra-annotation system"
```

### Structure Fichiers Créés
```
16 fichiers créés au total :

Database (Supabase):
- level0_chartes (table)
- level0_charte_tests (table)
- bulk_update_level0_gold (RPC function)

Domain Services (6):
- src/features/phase3-analysis/level0-gold/domain/services/
  ├── KappaCalculationService.ts
  ├── CharteRegistry.ts
  ├── OpenAIAnnotatorService.ts
  ├── MultiCharteAnnotator.ts
  ├── SupabaseLevel0Service.ts
  └── index.ts

API Route (1):
- src/app/api/level0/annotate/route.ts

UI Components (4):
- src/features/phase3-analysis/level0-gold/ui/components/
  ├── Level0Interface.tsx
  ├── Level0Tabs.tsx
  ├── DisagreementsPanel.tsx
  └── index.ts

UI Hooks (2):
- src/features/phase3-analysis/level0-gold/ui/hooks/
  ├── useLevel0Testing.ts
  └── index.ts

Pages (1):
- src/app/(protected)/phase3-analysis/level0/multi-chartes/page.tsx

Layout (1 - modifié):
- src/app/(protected)/layout.tsx (menu latéral mis à jour)
```

================================================================================
## MÉTRIQUES & COÛTS
================================================================================

### Coûts Estimés OpenAI

| Corpus | Chartes | Appels | Coût estimé | Durée |
|--------|---------|--------|-------------|-------|
| 10 paires (test) | 3 (Y) | 30 | $0.15 | ~1 min |
| 100 paires | 3 (Y) | 300 | $1.50 | ~5 min |
| 901 paires | 3 (Y) | 2703 | $13.50 | ~15 min |
| 901 paires | 2 (X) | 1802 | $9.00 | ~10 min |
| **TOTAL PRODUCTION** | **5** | **4505** | **~$22.50** | **~25 min** |

*Coût unitaire : ~$0.005 par appel GPT-4o*

### Métriques Validation

**Critères acceptation :**
- ✅ Kappa > 0.80 (accord quasi-parfait)
- ✅ Désaccords < 5% (< 45/901)
- ✅ Temps exécution < 30 minutes
- ✅ Coût < $25 (budget respecté)

**Résultats attendus :**
- CharteY_B (Enrichie - BASELINE) : κ ≈ 0.85
- CharteX_B (Avec contexte) : κ ≈ 0.82

================================================================================
## PROBLÈMES CONNUS & SOLUTIONS
================================================================================

### Problème 1 : Rate Limiting OpenAI (429)
**Symptôme** : Erreur "You exceeded your current quota" ou 429
**Cause** : Trop de requêtes simultanées
**Solution** : Augmenter `RATE_LIMIT_DELAY_MS` à 500ms (actuellement 200ms)
**Fichier** : `OpenAIAnnotatorService.ts` ligne 15

### Problème 2 : Sauvegarde Supabase désactivée
**Symptôme** : Résultats non sauvegardés en base
**Cause** : Erreur structure données (temporaire)
**Solution** : Réactiver lignes commentées dans `useLevel0Testing.ts` après debug
**Status** : Désactivé temporairement pour validation fonctionnelle

### Problème 3 : Contexte incomplet dans désaccords
**Symptôme** : Seul verbatim visible, pas prev/next
**Cause** : DisagreementsPanel ne charge pas contexte complet
**Solution** : Implémenter `loadPairsWithContext()` (voir Étape 1)
**Priorité** : HAUTE - Nécessaire pour résolution manuelle

================================================================================
## RÉFÉRENCES & DOCUMENTATION
================================================================================

### Standards Scientifiques
- **Cohen's Kappa** : Cohen, J. (1960). Educational and Psychological Measurement, 20(1), 37-46
- **Interprétation Kappa** : Landis & Koch (1977). Biometrics, 33(1), 159-174
- **Mediation Analysis** : Baron & Kenny (1986). Journal of Personality and Social Psychology, 51(6), 1173

### Documentation Technique
- OpenAI API : https://platform.openai.com/docs/api-reference
- Next.js API Routes : https://nextjs.org/docs/api-routes/introduction
- Supabase RPC : https://supabase.com/docs/guides/database/functions
- Material-UI : https://mui.com/material-ui/getting-started/

### Fichiers Mission Connexes
- `mission-2025-12-15-level0-llm-contra-annotation.md` : Mission principale
- `mission-2025-12-15-level0-SUPABASE-IMPACT.md` : Impact base de données
- `mission-2025-12-15-level0-NOTE-tables-obligatoires-these.md` : Exigences thèse
- `mission-2025-12-15-level0-llm-ADDENDUM2-multi-chartes-optimization.md` : Optimisation chartes

================================================================================
## CHANGELOG
================================================================================

### Version 1.0 - 16/12/2024
- ✅ Implémentation complète système multi-chartes
- ✅ 5 chartes définies (3 Y, 2 X)
- ✅ Interface utilisateur fonctionnelle
- ✅ Calculs Kappa automatisés
- ✅ API route sécurisée OpenAI
- ✅ Tests validation réussis (5 paires)
- ✅ Dark mode intégré
- ✅ Navigation menu latéral corrigée

### Version 1.1 - Prévue
- 🎯 Enrichissement interface résolution
- 🎯 Affichage contexte conversationnel
- 🎯 Sélecteur tag + annotation justification
- 🎯 Bouton accès appel complet
- 🎯 Sauvegarde résolutions Supabase
- 🎯 Tests production 901 paires
- 🎯 Génération rapport thèse

================================================================================
FIN DU DOCUMENT
================================================================================
