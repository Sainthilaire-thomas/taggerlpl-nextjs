# 🚀 SESSION 4 - Contexte de Démarrage Rapide

**Date** : Session 4 (à venir)  
**Durée estimée** : 5h30 (MVP 4h + Polish 1h30)  
**Objectif** : Enrichir CharteManager avec système complet édition/tuning

---

## 📋 RAPPEL CONTEXTE

### Où on en est

**Sprint 5 : Système Gestion Chartes** - 48% complété (5h/10h30)

✅ **Session 1** (2h) : Infrastructure SQL complète
- 3 tables : modifications, suggestions, category_stats
- 2 fonctions : calculate_category_stats, generate_improvement_suggestions
- 1 trigger : update_level0_chartes_timestamp
- Test manuel workflow complet

✅ **Session 2** (1h30) : Services TypeScript
- 12 types (tuning.ts)
- 2 services (CharteTuningService, CharteEditionService)
- 16 méthodes total
- Compilation OK

✅ **Session 3** (1h30) : UI Components Base
- 4 composants tuning (SuggestionCard, List, Stats, Panel)
- Intégration Level0Interface
- **Problème identifié** : Tuning sans contexte

⏸️ **Session 4** (5h30) : **À FAIRE AUJOURD'HUI**
- Enrichir CharteManager existant
- Ajouter sélection + tabs
- Intégrer édition + tuning

---

## 🎯 OBJECTIF SESSION 4

### Ce qu'on va faire

**Enrichir CharteManager.tsx (342 lignes existantes)** avec :
1. ✅ Sélection charte (clic ligne tableau)
2. ✅ Zone détails avec tabs sous tableau
3. ✅ Tab Aliases (réutiliser dialog existant)
4. ✅ Tab Catégories (éditeur complet)
5. ✅ Tab Tuning (intégrer CharteTuningPanel)
6. ✅ Autres tabs (Règles, LLM, Historique)

### Ce qu'on NE fait PAS

❌ Créer nouveau composant CharteManagementLayout (trop complexe)
❌ Architecture sidebar (v1 rejetée, on fait v2)
❌ Modifier structure CharteManager radicalement
❌ Casser fonctionnalités existantes

---

## 📐 ARCHITECTURE CIBLE

### AVANT (Existant)
```
CharteManager
├─ Filtre variable [X/Y]
├─ Tableau chartes
│  └─ Bouton Edit (ouvre dialog aliases)
└─ Dialog aliases (modal)
```

### APRÈS (Session 4)
```
CharteManager
├─ Filtre variable [X/Y]
├─ Tableau chartes
│  ├─ Clic ligne → Sélection (highlight)
│  └─ Bouton Edit (garde dialog aliases pour édition rapide)
└─ Zone détails (si charte sélectionnée)
   ├─ Header : Nom charte v1.0.0 [X fermer]
   ├─ Tabs : [Aliases|Catégories|Règles|LLM|Tuning|Historique]
   └─ Content selon tab sélectionné
```

---

## 🗂️ FICHIERS CLÉS

### À modifier
```
src/features/phase3-analysis/level0-gold/presentation/components/
├─ CharteManager.tsx              ← ENRICHIR (+ ~200 lignes)
└─ Level0Interface.tsx            ← MODIFIER (supprimer tab tuning)
```

### À créer
```
src/features/phase3-analysis/level0-gold/presentation/components/
└─ chartes/                       ← NOUVEAU DOSSIER
   ├─ CharteAliasesEditor.tsx     ← Extraire logique dialog
   ├─ CharteCategoriesEditor.tsx  ← Accordion + exemples
   ├─ CharteRulesEditor.tsx       ← Sliders + switches
   ├─ CharteLLMParamsEditor.tsx   ← Sliders temperature/top_p
   ├─ CharteVersionHistory.tsx    ← Timeline versions
   └─ index.ts                    ← Exports
```

### Existants à réutiliser
```
src/features/phase3-analysis/level0-gold/presentation/components/
└─ tuning/
   ├─ CharteTuningPanel.tsx       ← Intégrer dans tab
   ├─ SuggestionCard.tsx          ← Utilisé par Panel
   ├─ SuggestionList.tsx          ← Utilisé par Panel
   └─ CategoryStatsPanel.tsx      ← Utilisé par Panel
```

---

## 📝 PLAN SESSION (5h30)

### MVP (4h) ✅ OBLIGATOIRE

#### 1. Structure + Sélection (1h)

**État à ajouter** (dans CharteManager.tsx) :
```typescript
const [selectedCharteForDetails, setSelectedCharteForDetails] = 
  useState<CharteDefinition | null>(null);
const [detailsTab, setDetailsTab] = useState<
  'aliases' | 'categories' | 'rules' | 'llm' | 'tuning' | 'history'
>('aliases');
```

**Modifier TableRow** :
```typescript
<TableRow 
  onClick={() => setSelectedCharteForDetails(charte)}
  sx={{
    cursor: 'pointer',
    bgcolor: selectedCharteForDetails?.charte_id === charte.charte_id 
      ? 'action.selected' 
      : 'inherit',
    '&:hover': { bgcolor: 'action.hover' }
  }}
>
```

**Ajouter zone détails** (après tableau) :
```typescript
{selectedCharteForDetails && (
  <Card sx={{ mt: 3 }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h6">
          {selectedCharteForDetails.charte_name} v{selectedCharteForDetails.version}
        </Typography>
        <IconButton onClick={() => setSelectedCharteForDetails(null)}>
          <CancelIcon />
        </IconButton>
      </Stack>
      
      <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)}>
        <Tab label="Aliases" value="aliases" />
        <Tab label="Catégories" value="categories" />
        <Tab label="Règles" value="rules" />
        <Tab label="LLM" value="llm" />
        <Tab label="🔧 Tuning" value="tuning" />
        <Tab label="📜 Historique" value="history" />
      </Tabs>
      
      <Box mt={2}>
        {/* Content tabs ici */}
      </Box>
    </CardContent>
  </Card>
)}
```

**Validation** :
- [ ] Clic ligne sélectionne charte
- [ ] Highlight visuel ligne sélectionnée
- [ ] Zone détails apparaît
- [ ] Bouton X ferme zone détails
- [ ] Tabs switchent

**Temps** : ~1h

---

#### 2. Tab Aliases (30 min)

**Créer** `chartes/CharteAliasesEditor.tsx` :
- Copier TOUTE la logique du dialog existant
- Prop `inline={true}` pour affichage inline
- Bouton "Sauvegarder" intégré (pas dialog)

**Intégrer dans CharteManager** :
```typescript
{detailsTab === 'aliases' && (
  <CharteAliasesEditor 
    charte={selectedCharteForDetails}
    onSave={async (charte, aliases) => {
      // Logique sauvegarde (réutiliser handleSaveAliases)
    }}
    inline={true}
  />
)}
```

**Garder dialog** (bouton edit rapide) :
```typescript
<IconButton
  onClick={(e) => {
    e.stopPropagation();  // Empêcher sélection ligne
    handleEditAliases(charte);
  }}
>
  <EditIcon />
</IconButton>
```

**Validation** :
- [ ] Tab Aliases affiche éditeur inline
- [ ] Add/remove aliases fonctionne
- [ ] Sauvegarde met à jour BDD
- [ ] Bouton edit rapide garde dialog

**Temps** : ~30 min

---

#### 3. Tab Tuning (30 min)

**Intégrer CharteTuningPanel** :
```typescript
{detailsTab === 'tuning' && (
  <CharteTuningPanel 
    charteId={selectedCharteForDetails.charte_id}
    testId={undefined}  // Chargera dernier test auto
  />
)}
```

**Modifier Level0Interface.tsx** :
```typescript
// SUPPRIMER ce bloc
{currentTab === 'tuning' && (
  <CharteTuningPanel charteId={selectedResult?.charte_id || ''} />
)}

// SUPPRIMER dans type Tab
type Tab = 'tests' | ... | 'chartes';  // Enlever 'tuning'

// SUPPRIMER dans Tabs
<Tab label="🔧 Tuning" value="tuning" />  // Enlever cette ligne
```

**Validation** :
- [ ] Tab Tuning affiche CharteTuningPanel
- [ ] Contexte clair : charte sélectionnée
- [ ] Suggestions chargent correctement
- [ ] Tab tuning standalone supprimé

**Temps** : ~30 min

---

#### 4. Tab Catégories (1h)

**Créer** `chartes/CharteCategoriesEditor.tsx` :

**Structure basique** :
```typescript
export const CharteCategoriesEditor: React.FC<{
  charte: CharteDefinition;
  onSave: (updates: any) => Promise<void>;
}> = ({ charte, onSave }) => {
  const [categories, setCategories] = useState<any>(
    (charte.definition as any).categories || {}
  );

  const updateCategoryField = (catName: string, field: string, value: any) => {
    setCategories({
      ...categories,
      [catName]: { ...categories[catName], [field]: value }
    });
  };

  const updateExample = (catName: string, idx: number, value: string) => {
    const cat = categories[catName];
    const newExamples = [...cat.examples];
    newExamples[idx] = value;
    updateCategoryField(catName, 'examples', newExamples);
  };

  const addExample = (catName: string) => {
    const cat = categories[catName];
    updateCategoryField(catName, 'examples', [...(cat.examples || []), '']);
  };

  const removeExample = (catName: string, idx: number) => {
    const cat = categories[catName];
    const newExamples = cat.examples.filter((_, i) => i !== idx);
    updateCategoryField(catName, 'examples', newExamples);
  };

  const handleSave = async () => {
    await onSave({ definition: { ...charte.definition, categories } });
  };

  return (
    <Box>
      {Object.entries(categories).map(([name, cat]: [string, any]) => (
        <Accordion key={name}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Description */}
              <TextField
                label="Description"
                value={cat.description}
                onChange={(e) => updateCategoryField(name, 'description', e.target.value)}
                multiline
                rows={2}
                fullWidth
              />

              {/* Exemples */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Exemples ({cat.examples?.length || 0})
                </Typography>
                {cat.examples?.map((ex: string, idx: number) => (
                  <Stack direction="row" spacing={1} key={idx} mb={1}>
                    <TextField
                      value={ex}
                      size="small"
                      fullWidth
                      onChange={(e) => updateExample(name, idx, e.target.value)}
                    />
                    <IconButton onClick={() => removeExample(name, idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button startIcon={<AddIcon />} onClick={() => addExample(name)}>
                  Ajouter exemple
                </Button>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        sx={{ mt: 2 }}
      >
        Sauvegarder modifications
      </Button>
    </Box>
  );
};
```

**Validation** :
- [ ] Accordion par catégorie
- [ ] Édition description
- [ ] Add/edit/remove exemples
- [ ] Sauvegarde fonctionne

**Temps** : ~1h

---

#### 5. Autres Tabs + Tests (1h)

**CharteRulesEditor.tsx** (20 min) :
```typescript
<Select value={rules.approach}>
  <MenuItem value="few_shot">Few-shot</MenuItem>
  <MenuItem value="zero_shot">Zero-shot</MenuItem>
</Select>

<Switch checked={rules.context_included} />
<Slider value={rules.examples_per_category} min={0} max={10} />
```

**CharteLLMParamsEditor.tsx** (20 min) :
```typescript
<Slider value={params.temperature} min={0} max={2} step={0.1} />
<Slider value={params.top_p} min={0} max={1} step={0.05} />
<Slider value={params.max_tokens} min={100} max={4096} step={100} />
```

**Tests complets** (20 min) :
- [ ] Workflow édition aliases
- [ ] Workflow édition catégories
- [ ] Workflow tuning intégré
- [ ] Sauvegarde crée nouvelle version
- [ ] Compilation OK
- [ ] Pas de régression

**Temps** : ~1h

---

### POLISH (1h30) 🟢 SI TEMPS

#### 6. Catégories Avancé (45 min)
- Contre-exemples (similaire exemples)
- Keywords (TextField séparés par virgules)

#### 7. Historique (45 min)
- CharteVersionHistory.tsx
- Timeline avec TimelineItem MUI
- Affichage versions + dates

---

## 🛠️ COMMANDES UTILES

### Démarrage
```powershell
# Dev server
npm run dev

# Nouvelle fenêtre : compilation continue
npx tsc --noEmit --watch
```

### Vérification rapide
```powershell
# Compilation
npx tsc --noEmit

# Voir CharteManager actuel
Get-Content "src\features\phase3-analysis\level0-gold\presentation\components\CharteManager.tsx" | Measure-Object -Line
```

### Création fichiers
```powershell
# Créer dossier chartes
New-Item -Path "src\features\phase3-analysis\level0-gold\presentation\components\chartes" -ItemType Directory -Force

# Créer fichier
New-Item -Path "src\features\phase3-analysis\level0-gold\presentation\components\chartes\CharteAliasesEditor.tsx" -ItemType File -Force
```

---

## 📚 DOCUMENTS RÉFÉRENCES

### Specs principales
- **SPEC_CHARTE_MANAGEMENT_UI_v2.md** ⭐ **DOCUMENT PRINCIPAL**
  - Architecture complète v2
  - Code snippets détaillés
  - Étapes précises

### Contexte
- **CURRENT_STATE.md** : État complet après Session 3
- **MISSION_SPRINT5_v1.md** : Mission + historique sessions

### Technique
- **SPECS_CHARTE_TUNING_SYSTEM.md** : Backend tuning
- **CharteManager.tsx** : Composant existant à enrichir

---

## ✅ CHECKLIST MVP

### Structure (1h)
- [ ] État `selectedCharteForDetails` ajouté
- [ ] État `detailsTab` ajouté
- [ ] TableRow onClick sélectionne
- [ ] Styling sélection (highlight)
- [ ] Zone détails sous tableau
- [ ] Header avec nom + bouton X
- [ ] Tabs créés (6 tabs)
- [ ] Switch tabs fonctionne

### Aliases (30 min)
- [ ] CharteAliasesEditor.tsx créé
- [ ] Logique dialog extraite
- [ ] Tab Aliases affiche éditeur
- [ ] Sauvegarde fonctionne
- [ ] Dialog rapide garde comportement

### Tuning (30 min)
- [ ] CharteTuningPanel intégré tab
- [ ] Tab tuning Level0Interface supprimé
- [ ] Type Tab modifié (enlever 'tuning')
- [ ] Compilation OK

### Catégories (1h)
- [ ] CharteCategoriesEditor.tsx créé
- [ ] Accordion par catégorie
- [ ] Édition description
- [ ] Add/edit/remove exemples
- [ ] Sauvegarde fonctionne

### Autres (1h)
- [ ] CharteRulesEditor.tsx créé
- [ ] CharteLLMParamsEditor.tsx créé
- [ ] Tabs rules/llm intégrés
- [ ] Tests workflow complet
- [ ] Git commit

---

## 🎯 CRITÈRES VALIDATION

### Fonctionnels
- [ ] Clic ligne tableau → sélectionne charte ✅
- [ ] Tabs détails switchent correctement ✅
- [ ] Tab Aliases permet add/remove/save ✅
- [ ] Tab Catégories permet éditer description/exemples ✅
- [ ] Tab Tuning affiche CharteTuningPanel avec contexte ✅
- [ ] Sauvegarde crée nouvelle version ✅

### Ergonomiques
- [ ] Highlight visuel ligne sélectionnée ✅
- [ ] Zone détails collapsable (bouton X) ✅
- [ ] Feedback visuel actions (loading, success, error) ✅
- [ ] Workflow intuitif (clic → tabs → édition → save) ✅

### Techniques
- [ ] Compilation TypeScript 0 erreur ✅
- [ ] Réutilisation dialog aliases ✅
- [ ] Services utilisés correctement ✅
- [ ] Pas de duplication code ✅
- [ ] Gestion erreurs robuste ✅

---

## 🚨 PIÈGES À ÉVITER

### 1. Sélection ligne vs bouton edit
❌ **Problème** : Clic edit sélectionne aussi la ligne
✅ **Solution** : `e.stopPropagation()` dans onClick du bouton

### 2. Réactivité tabs
❌ **Problème** : Changement charte ne reset pas tab
✅ **Solution** : `useEffect` qui reset `detailsTab` quand `selectedCharte` change

### 3. Sauvegarde aliases
❌ **Problème** : Dupliquer logique sauvegarde
✅ **Solution** : Réutiliser fonction `handleSaveAliases` existante

### 4. Tab tuning
❌ **Problème** : Oublier supprimer tab tuning standalone
✅ **Solution** : Modifier Level0Interface.tsx EN MÊME TEMPS

---

## 🎬 DÉMARRAGE SESSION

### 1. Ouvrir documents
- [ ] SPEC_CHARTE_MANAGEMENT_UI_v2.md
- [ ] SESSION_4_CONTEXT.md (ce fichier)

### 2. Ouvrir fichiers
- [ ] CharteManager.tsx
- [ ] Level0Interface.tsx

### 3. Lancer dev
```powershell
npm run dev
npx tsc --noEmit --watch  # Nouvelle fenêtre
```

### 4. Créer dossier
```powershell
New-Item -Path "src\features\phase3-analysis\level0-gold\presentation\components\chartes" -ItemType Directory -Force
```

### 5. Commencer MVP Étape 1
→ Voir SPEC v2 page "Étape 1 : Ajout Sélection Charte"

---

**BON COURAGE ! 💪**

**Temps estimé** : 5h30  
**Livrable** : CharteManager enrichi fonctionnel ✅
