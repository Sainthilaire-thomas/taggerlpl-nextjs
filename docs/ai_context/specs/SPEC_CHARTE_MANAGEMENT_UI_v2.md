# 📐 SPEC v2 - Enrichissement CharteManager (Architecture Réaliste)

**Date** : 2025-12-20  
**Version** : 2.0 (Révision après analyse existant)  
**Statut** : Spécification prête pour Session 4

---

## 🔍 ANALYSE DE L'EXISTANT

### CharteManager.tsx (342 lignes) ✅

**Ce qui fonctionne déjà** :
```typescript
Props: { variable: 'X' | 'Y' }

Features:
- ✅ Tableau chartes (nom, philosophie, version, catégories, aliases count, gold standard)
- ✅ Dialog édition aliases (add/remove/save via CharteManagementService)
- ✅ Chargement chartes par variable
- ✅ Alert info sur utilité des aliases
- ✅ Suggestions aliases courantes affichées

Services utilisés:
- CharteManagementService.getChartesForVariable()
- CharteManagementService.updateCharte()
```

**Ce qui manque** :
- ❌ Sélection charte (clic ligne → détails)
- ❌ Édition catégories (descriptions, exemples, keywords)
- ❌ Édition règles (approach, context_included, etc.)
- ❌ Édition paramètres LLM (temperature, top_p, max_tokens)
- ❌ Édition template prompt
- ❌ Système tuning (suggestions, stats)
- ❌ Historique versions

### Integration Level0Interface.tsx ✅

```typescript
{currentTab === 'chartes' && (
  <CharteManager variable={variable} />
)}

{currentTab === 'tuning' && (
  <CharteTuningPanel charteId={selectedResult?.charte_id || ''} />
)}
```

**Problème** : Tab tuning standalone sans contexte clair

---

## 🎯 STRATÉGIE D'ENRICHISSEMENT

### Principe

**Enrichir progressivement CharteManager** au lieu de créer nouveau composant.

**Avantages** :
- ✅ Réutilise 342 lignes existantes
- ✅ Dialog aliases déjà fonctionnel
- ✅ Moins de refactoring
- ✅ Migration incrémentale

### Architecture Cible

```
┌────────────────────────────────────────────────────────────┐
│  CharteManager (enrichi)                                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Filtre: Variable [Y ▼]                      ← EXISTANT   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Tableau Chartes                         ← EXISTANT   │ │
│  │ [CharteY_A] [Binaire] [1.0.0] ...                    │ │
│  │ [CharteY_B] [Enrichie] [1.0.0] ...      ◄── Cliquée │ │
│  │ [CharteY_C] [Minimaliste] [1.0.0] ...                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌────────── DÉTAILS : CharteY_B v1.0.0 ─────────────┐   │
│  │                                        ← NOUVEAU   │   │
│  │ [Aliases] [Catégories] [Règles] [LLM] [Tuning]    │   │
│  │                                                    │   │
│  │ ┌────────────────────────────────────────────┐   │   │
│  │ │ Contenu selon tab sélectionné             │   │   │
│  │ │                                            │   │   │
│  │ │ - Aliases → Dialog existant réutilisé     │   │   │
│  │ │ - Catégories → Nouvel éditeur             │   │   │
│  │ │ - Tuning → CharteTuningPanel intégré      │   │   │
│  │ └────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 MODIFICATIONS DÉTAILLÉES

### Étape 1 : Ajout Sélection Charte (30 min)

**État à ajouter** :
```typescript
const [selectedCharteForDetails, setSelectedCharteForDetails] = 
  useState<CharteDefinition | null>(null);
const [detailsTab, setDetailsTab] = useState<'aliases' | 'categories' | 'rules' | 'llm' | 'tuning' | 'history'>('aliases');
```

**Modifier TableRow** :
```typescript
<TableRow 
  key={charte.charte_id}
  onClick={() => setSelectedCharteForDetails(charte)}  // ← NOUVEAU
  sx={{
    cursor: 'pointer',
    bgcolor: selectedCharteForDetails?.charte_id === charte.charte_id 
      ? 'action.selected' 
      : 'inherit',
    '&:hover': { bgcolor: 'action.hover' }
  }}
>
  {/* Contenu existant */}
</TableRow>
```

**Modifier Actions column** :
```typescript
<IconButton
  size="small"
  color="primary"
  onClick={(e) => {
    e.stopPropagation();  // ← IMPORTANT : empêcher sélection ligne
    handleEditAliases(charte);
  }}
  title="Édition rapide aliases"
>
  <EditIcon fontSize="small" />
</IconButton>
```

---

### Étape 2 : Zone Détails avec Tabs (45 min)

**Après le tableau, ajouter** :
```typescript
{selectedCharteForDetails && (
  <Card sx={{ mt: 3 }}>
    <CardContent>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {selectedCharteForDetails.charte_name} v{selectedCharteForDetails.version}
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => setSelectedCharteForDetails(null)}
        >
          <CancelIcon />
        </IconButton>
      </Stack>

      {/* Tabs */}
      <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)} sx={{ mb: 2 }}>
        <Tab label="Aliases" value="aliases" />
        <Tab label="Catégories" value="categories" />
        <Tab label="Règles" value="rules" />
        <Tab label="Paramètres LLM" value="llm" />
        <Tab label="🔧 Tuning" value="tuning" />
        <Tab label="📜 Historique" value="history" />
      </Tabs>

      {/* Content */}
      <Box>
        {detailsTab === 'aliases' && (
          <CharteAliasesEditor 
            charte={selectedCharteForDetails}
            onSave={handleSaveAliases}
          />
        )}
        {detailsTab === 'categories' && (
          <CharteCategoriesEditor charte={selectedCharteForDetails} />
        )}
        {detailsTab === 'tuning' && (
          <CharteTuningPanel charteId={selectedCharteForDetails.charte_id} />
        )}
        {/* ... autres tabs */}
      </Box>
    </CardContent>
  </Card>
)}
```

---

### Étape 3 : Extraire Dialog Aliases → Composant Réutilisable (30 min)

**Créer** : `CharteAliasesEditor.tsx`

```typescript
// src/features/phase3-analysis/level0-gold/presentation/components/chartes/CharteAliasesEditor.tsx

interface CharteAliasesEditorProps {
  charte: CharteDefinition;
  onSave: (charte: CharteDefinition, aliases: Record<string, string>) => Promise<void>;
  inline?: boolean;  // true = affichage inline, false = affichage dialog
}

export const CharteAliasesEditor: React.FC<CharteAliasesEditorProps> = ({
  charte,
  onSave,
  inline = true
}) => {
  const [aliases, setAliases] = useState<Record<string, string>>(
    (charte.definition as any).aliases || {}
  );
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasValue, setNewAliasValue] = useState("");

  // Réutiliser TOUTE la logique existante du Dialog
  // (handleAddAlias, handleRemoveAlias, etc.)

  if (inline) {
    return (
      <Box>
        {/* Contenu actuel du Dialog, mais en inline */}
        {/* Liste aliases + Formulaire add + Bouton save */}
      </Box>
    );
  }

  // Fallback: affichage dialog (pour bouton edit rapide dans tableau)
  return null;
};
```

**Migration progressive** :
1. Créer composant avec logique existante
2. Utiliser en mode `inline` dans tab
3. Garder dialog original dans tableau (bouton edit rapide)

---

### Étape 4 : Créer CharteCategoriesEditor (1h30) ⭐ **LE PLUS COMPLEXE**

**Créer** : `CharteCategoriesEditor.tsx`

```typescript
interface CharteCategoriesEditorProps {
  charte: CharteDefinition;
  onSave: (updates: any) => Promise<void>;
}

export const CharteCategoriesEditor: React.FC<CharteCategoriesEditorProps> = ({
  charte,
  onSave
}) => {
  const [categories, setCategories] = useState<any>(
    (charte.definition as any).categories || {}
  );

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
                  Exemples positifs ({cat.examples?.length || 0})
                </Typography>
                {cat.examples?.map((ex: string, idx: number) => (
                  <Stack direction="row" spacing={1} key={idx} mb={1}>
                    <TextField
                      value={ex}
                      size="small"
                      fullWidth
                      onChange={(e) => updateExample(name, idx, e.target.value)}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => removeExample(name, idx)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={() => addExample(name)}
                  size="small"
                >
                  Ajouter exemple
                </Button>
              </Box>

              {/* Contre-exemples */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Contre-exemples ({cat.counter_examples?.length || 0})
                </Typography>
                {/* Similaire aux exemples */}
              </Box>

              {/* Keywords */}
              <TextField
                label="Keywords (séparés par virgules)"
                value={cat.keywords?.join(', ') || ''}
                onChange={(e) => updateKeywords(name, e.target.value)}
                fullWidth
                helperText="Mots-clés pour faciliter la recherche"
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={() => handleSaveCategories()}
        sx={{ mt: 2 }}
      >
        Sauvegarder modifications
      </Button>
    </Box>
  );
};
```

---

### Étape 5 : Autres Éditeurs (1h)

**CharteRulesEditor.tsx** (30 min) :
```typescript
<FormControl>
  <InputLabel>Approche</InputLabel>
  <Select value={rules.approach}>
    <MenuItem value="few_shot">Few-shot (avec exemples)</MenuItem>
    <MenuItem value="zero_shot">Zero-shot</MenuItem>
  </Select>
</FormControl>

<FormControlLabel
  control={<Switch checked={rules.context_included} />}
  label="Inclure contexte (tours précédents)"
/>

<Slider
  value={rules.examples_per_category}
  min={0}
  max={10}
  marks
  valueLabelDisplay="auto"
/>
```

**CharteLLMParamsEditor.tsx** (30 min) :
```typescript
<Slider
  value={prompt_params.temperature}
  min={0}
  max={2}
  step={0.1}
  marks={[{value: 0, label: '0'}, {value: 1, label: '1'}, {value: 2, label: '2'}]}
/>
<Typography variant="caption">0 = Déterministe, 2 = Créatif</Typography>

{/* Idem pour top_p, max_tokens */}
```

---

### Étape 6 : Intégration Tuning (30 min)

**Dans tab tuning** :
```typescript
{detailsTab === 'tuning' && (
  <CharteTuningPanel 
    charteId={selectedCharteForDetails.charte_id}
    testId={undefined}  // Chargera dernier test automatiquement
  />
)}
```

**Modifier Level0Interface** :
```typescript
// SUPPRIMER ce bloc
{currentTab === 'tuning' && (
  <CharteTuningPanel ... />
)}

// SUPPRIMER dans type Tab
type Tab = ... | 'tuning';  // ← ENLEVER 'tuning'

// SUPPRIMER dans Tabs
<Tab label="🔧 Tuning" value="tuning" />  // ← ENLEVER
```

---

### Étape 7 : Historique (45 min)

**CharteVersionHistory.tsx** :
```typescript
import { Timeline, TimelineItem, ... } from '@mui/lab';

export const CharteVersionHistory: React.FC<{charte: CharteDefinition}> = ({ charte }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  
  useEffect(() => {
    // Charger versions via CharteEditionService
    charteEditionService.getVersions(charteBaseName).then(setVersions);
  }, [charte]);
  
  return (
    <Timeline>
      {versions.map(v => (
        <TimelineItem key={v.charte_id}>
          <TimelineSeparator>
            <TimelineDot color={v.is_baseline ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6">v{v.version}</Typography>
            <Typography variant="caption">
              {new Date(v.created_at).toLocaleString('fr-FR')}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
```

---

## 📁 STRUCTURE FICHIERS

### Nouveaux fichiers à créer

```
src/features/phase3-analysis/level0-gold/presentation/components/
├── chartes/                                    ← NOUVEAU DOSSIER
│   ├── CharteAliasesEditor.tsx                ← Extrait de CharteManager
│   ├── CharteCategoriesEditor.tsx             ← NOUVEAU (complexe)
│   ├── CharteRulesEditor.tsx                  ← NOUVEAU
│   ├── CharteLLMParamsEditor.tsx              ← NOUVEAU
│   ├── CharteVersionHistory.tsx               ← NOUVEAU
│   └── index.ts                               ← Exports
│
├── CharteManager.tsx                          ← MODIFIÉ (enrichi)
└── tuning/                                    ← EXISTANT
    └── CharteTuningPanel.tsx                  ← Réutilisé dans tab
```

---

## ⏱️ ESTIMATION TEMPS (Session 4)

### MVP (4h) - Obligatoire

| Tâche | Temps | Priorité |
|-------|-------|----------|
| Sélection charte + tabs | 30 min | 🔴 Critique |
| Extraire CharteAliasesEditor | 30 min | 🔴 Critique |
| Intégrer CharteTuningPanel | 30 min | 🔴 Critique |
| CharteCategoriesEditor (basique) | 1h | 🔴 Critique |
| CharteRulesEditor | 30 min | 🟡 Important |
| CharteLLMParamsEditor | 30 min | 🟡 Important |
| Tests + Debug | 30 min | 🔴 Critique |
| **TOTAL MVP** | **4h** | |

### Polish (1h30) - Optionnel

| Tâche | Temps | Priorité |
|-------|-------|----------|
| CharteCategoriesEditor (avancé) | 45 min | 🟢 Nice-to-have |
| CharteVersionHistory | 45 min | 🟢 Nice-to-have |
| **TOTAL POLISH** | **1h30** | |

**TOTAL SESSION 4** : **5h30**

---

## 🔄 WORKFLOW CIBLE

### Workflow 1 : Édition Aliases (Existant amélioré)

```
User → Tab "Gestion Chartes"
     → Tableau chartes
     → Clic ligne CharteY_B  ← NOUVEAU
     → Zone détails apparaît
     → Tab "Aliases" (déjà sélectionné)
     → Voir aliases existants
     → Add nouveau alias
     → Clic "Sauvegarder"
     → Rechargement charte
```

**Alternative rapide** (garde existant) :
```
User → Clic icône Edit dans tableau
     → Dialog aliases s'ouvre (comportement actuel)
     → Édition rapide
```

### Workflow 2 : Édition Catégories (Nouveau)

```
User → Sélectionne CharteY_B
     → Tab "Catégories"
     → Accordion CLIENT_NEUTRE
     → Modifie description
     → Add exemple "peut-être"
     → Clic "Sauvegarder"
     → Nouvelle version créée (1.0.0 → 1.1.0)
```

### Workflow 3 : Tuning Intégré (Corrigé)

```
User → Sélectionne CharteY_B
     → Tab "Tuning"
     → CharteTuningPanel s'affiche
     → Contexte clair : CharteY_B sélectionnée
     → Génère suggestions
     → Apply suggestion
     → Re-test automatique
```

---

## ✅ CRITÈRES VALIDATION

### Fonctionnels
- [ ] Clic ligne tableau → sélectionne charte
- [ ] Tabs détails apparaissent sous tableau
- [ ] Tab Aliases réutilise logique existante
- [ ] Tab Catégories permet add/edit/remove exemples
- [ ] Tab Tuning affiche CharteTuningPanel avec contexte
- [ ] Sauvegarde crée nouvelle version correctement

### Ergonomiques
- [ ] Sélection visuelle claire (highlight ligne)
- [ ] Tabs intuitifs (icônes + labels)
- [ ] Bouton edit rapide garde comportement actuel
- [ ] Zone détails collapsable (bouton X)
- [ ] Feedback visuel sur actions

### Techniques
- [ ] Compilation TypeScript OK
- [ ] Réutilisation dialog aliases existant
- [ ] Services (CharteManagementService, CharteEditionService) utilisés
- [ ] Pas de duplication code
- [ ] Gestion erreurs robuste

---

## 🚀 PLAN EXÉCUTION SESSION 4

### Phase 1 : Structure (1h)
1. Créer dossier `chartes/`
2. Ajouter état sélection dans CharteManager
3. Modifier TableRow (onClick, styling)
4. Ajouter zone détails avec tabs

### Phase 2 : Aliases (30 min)
5. Extraire CharteAliasesEditor
6. Intégrer dans tab
7. Tester double accès (inline + dialog)

### Phase 3 : Tuning (30 min)
8. Intégrer CharteTuningPanel dans tab
9. Supprimer tab tuning standalone Level0Interface
10. Tester workflow

### Phase 4 : Catégories (1h)
11. Créer CharteCategoriesEditor (basique)
12. Accordion par catégorie
13. Édition description + exemples
14. Sauvegarde

### Phase 5 : Autres (1h)
15. CharteRulesEditor (sliders/switches)
16. CharteLLMParamsEditor (sliders)
17. Tests complets

### Phase 6 : Polish (si temps) (1h30)
18. CharteCategoriesEditor avancé (contre-exemples, keywords)
19. CharteVersionHistory (timeline)
20. UX improvements

---

## 📝 MIGRATION LEVEL0INTERFACE

### AVANT
```typescript
type Tab = 'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'chartes' | 'tuning';

<Tabs>
  <Tab label="Tests" value="tests" />
  ...
  <Tab label="📝 Gestion Chartes" value="chartes" />
  <Tab label="🔧 Tuning" value="tuning" />  ← SUPPRIMER
</Tabs>

{currentTab === 'chartes' && <CharteManager variable={variable} />}
{currentTab === 'tuning' && <CharteTuningPanel ... />}  ← SUPPRIMER
```

### APRÈS
```typescript
type Tab = 'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'chartes';

<Tabs>
  <Tab label="Tests" value="tests" />
  ...
  <Tab label="📝 Gestion Chartes" value="chartes" />
  {/* Tab tuning supprimé - intégré dans chartes */}
</Tabs>

{currentTab === 'chartes' && <CharteManager variable={variable} />}
{/* CharteTuningPanel appelé à l'intérieur de CharteManager */}
```

---

## 🎯 AVANTAGES APPROCHE v2

### vs Spec v1 (Architecture complète nouvelle)

**v2 Avantages** :
- ✅ Réutilise 342 lignes existantes (dialog aliases)
- ✅ Migration progressive (moins risqué)
- ✅ Garde comportement actuel (bouton edit rapide)
- ✅ Moins de refactoring
- ✅ Plus rapide (4h vs 5h30)

**v2 Trade-offs** :
- ⚠️ Pas de sidebar (tous dans même composant)
- ⚠️ Zone détails sous tableau (pas à côté)
- ⚠️ Moins de séparation visuelle

**Décision** : v2 est **optimal** pour Session 4 car :
- Livrable MVP en 4h garanti
- Fonctionnel immédiatement
- Peut évoluer vers v1 plus tard si besoin

---

## 📚 DOCUMENTS ASSOCIÉS

- **SPEC_CHARTE_MANAGEMENT_UI.md** : Spec v1 (architecture sidebar)
- **MISSION_SPRINT5_v1.md** : Mission complète Sprint 5
- **SPECS_CHARTE_TUNING_SYSTEM.md** : Specs backend tuning
- **CharteManager.tsx** : Composant existant (342 lignes)

---

**Document créé** : 2025-12-20  
**Version** : 2.0 (Révision après analyse existant)  
**Auteur** : Claude & Thomas  
**Statut** : Spécification réaliste - Prêt pour Session 4
