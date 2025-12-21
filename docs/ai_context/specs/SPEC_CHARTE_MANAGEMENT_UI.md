# 📐 SPEC - Système de Gestion des Chartes (Édition + Tuning)

**Date** : 2025-12-20  
**Sprint** : Sprint 5 (révision)  
**Statut** : Spécification complète avant implémentation

---

## 🎯 PROBLÈME ERGONOMIQUE IDENTIFIÉ

### État Actuel (Session 3 - 2025-12-20)
- ✅ CharteTuningPanel créé et fonctionnel
- ❌ **Tuning sans contexte** : On ne sait pas quelle charte on tune
- ❌ **Hiérarchie incorrecte** : Tuning = même niveau que Tests/GoldStandards
- ❌ **Workflow cassé** : Pas de sélection de charte avant tuning
- ❌ **Édition absente** : Aucune interface pour modifier manuellement les chartes

### Solution Proposée
**Onglet "📝 Gestion Chartes"** devient un système complet :
```
Tab "Gestion Chartes" {
  Sidebar: Liste chartes (filtrable)
  Main Area: {
    Sous-onglets: [Édition, Tuning, Historique]
    Contenu selon sous-onglet sélectionné
  }
}
```

---

## 🏗️ ARCHITECTURE UI

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│  Level0Interface                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [TESTS] [⭐ GOLD] [VALIDATION] [COMPARATEUR] [🔍 AUDIT]     │   │
│  │                              [📝 GESTION CHARTES] ◄─── ICI  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  {currentTab === 'chartes' && <CharteManagementLayout />}          │
└─────────────────────────────────────────────────────────────────────┘
```

### Structure Détaillée

```
┌─────────────────────────────────────────────────────────────────────┐
│  CharteManagementLayout                                             │
├──────────────┬──────────────────────────────────────────────────────┤
│              │  Charte: CharteY_B_v1.0.0          [▼]               │
│  SIDEBAR     │  ┌───────────────────────────────────────────────┐   │
│  (280px)     │  │ [📝 Édition] [🔧 Tuning] [📜 Historique]     │   │
│              │  └───────────────────────────────────────────────┘   │
│  Filtres:    │                                                      │
│  ┌─────────┐ │  ┌────────────────────────────────────────────────┐ │
│  │Var: [Y▼]│ │  │                                                │ │
│  └─────────┘ │  │  [Contenu selon sous-onglet]                   │ │
│              │  │                                                │ │
│  Chartes Y:  │  │  • Édition → CharteDefinitionEditor           │ │
│  ┌─────────┐ │  │  • Tuning → CharteTuningPanel                 │ │
│  │CharteY_A│ │  │  • Historique → CharteVersionHistory          │ │
│  │CharteY_B│◄├─ │                                                │ │
│  │CharteY_C│ │  │                                                │ │
│  └─────────┘ │  └────────────────────────────────────────────────┘ │
│              │                                                      │
│  [+ Nouvelle]│  [Actions selon sous-onglet]                        │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## 📋 COMPOSANTS

### 1. CharteManagementLayout (Container Principal)

**Fichier** : `CharteManagementLayout.tsx`  
**Rôle** : Orchestrateur principal

```typescript
interface CharteManagementLayoutProps {
  initialCharteId?: string;
  initialTab?: 'edition' | 'tuning' | 'history';
}

export const CharteManagementLayout: React.FC = () => {
  const [selectedVariable, setSelectedVariable] = useState<'X' | 'Y'>('Y');
  const [selectedCharte, setSelectedCharte] = useState<CharteDefinition | null>(null);
  const [subTab, setSubTab] = useState<'edition' | 'tuning' | 'history'>('edition');
  const [chartes, setChartes] = useState<CharteDefinition[]>([]);
  
  // Charger chartes pour la variable
  useEffect(() => {
    CharteRegistry.getChartesForVariable(selectedVariable).then(setChartes);
  }, [selectedVariable]);
  
  return (
    <Box display="flex" height="calc(100vh - 200px)">
      {/* Sidebar */}
      <CharteSidebar
        variable={selectedVariable}
        onVariableChange={setSelectedVariable}
        chartes={chartes}
        selectedCharte={selectedCharte}
        onCharteSelect={setSelectedCharte}
      />
      
      {/* Main Area */}
      <Box flex={1} p={3}>
        {selectedCharte ? (
          <>
            {/* Header avec nom + sous-onglets */}
            <CharteHeader
              charte={selectedCharte}
              subTab={subTab}
              onSubTabChange={setSubTab}
            />
            
            {/* Contenu selon sous-onglet */}
            {subTab === 'edition' && (
              <CharteDefinitionEditor charte={selectedCharte} />
            )}
            {subTab === 'tuning' && (
              <CharteTuningPanel charteId={selectedCharte.charte_id} />
            )}
            {subTab === 'history' && (
              <CharteVersionHistory charteId={selectedCharte.charte_id} />
            )}
          </>
        ) : (
          <Alert severity="info">
            Sélectionnez une charte pour commencer
          </Alert>
        )}
      </Box>
    </Box>
  );
};
```

---

### 2. CharteSidebar (Sélection Charte)

**Fichier** : `CharteSidebar.tsx`  
**Rôle** : Liste + filtres

```typescript
interface CharteSidebarProps {
  variable: 'X' | 'Y';
  onVariableChange: (v: 'X' | 'Y') => void;
  chartes: CharteDefinition[];
  selectedCharte: CharteDefinition | null;
  onCharteSelect: (c: CharteDefinition) => void;
}

// UI
┌────────────────────┐
│ Variable: [Y ▼]    │
├────────────────────┤
│ 📋 CharteY_A       │
│ 📋 CharteY_B    ◄──│ (Selected)
│ 📋 CharteY_C       │
│                    │
│ [+ Nouvelle charte]│
└────────────────────┘
```

**Features** :
- Select variable (X/Y)
- Liste scrollable
- Highlight sélection
- Badge version
- Bouton création (future)

---

### 3. CharteHeader (Nom + Sous-onglets)

**Fichier** : `CharteHeader.tsx`  
**Rôle** : Affichage nom + navigation sous-onglets

```typescript
interface CharteHeaderProps {
  charte: CharteDefinition;
  subTab: 'edition' | 'tuning' | 'history';
  onSubTabChange: (tab: 'edition' | 'tuning' | 'history') => void;
}

// UI
┌──────────────────────────────────────────────────────┐
│  CharteY_B v1.0.0                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ [📝 Édition] [🔧 Tuning] [📜 Historique]    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Features** :
- Typography h5 pour nom + version
- Tabs MUI pour sous-onglets
- Badge statut (baseline, pending_validation)

---

### 4. CharteDefinitionEditor (Édition Complète)

**Fichier** : `CharteDefinitionEditor.tsx`  
**Rôle** : Éditer tous les aspects d'une charte

#### Structure Interne (6 Onglets)

```
┌─────────────────────────────────────────────────────────────┐
│  [Métadonnées] [Catégories] [Aliases] [Règles] [LLM] [Prompt] │
└─────────────────────────────────────────────────────────────┘
```

#### Onglet 1 : Métadonnées

```typescript
<Stack spacing={2}>
  <TextField
    label="Nom de la charte"
    value={charte.charte_name}
    disabled
  />
  <TextField
    label="Description"
    value={charte.charte_description}
    multiline
    rows={3}
  />
  <FormControl>
    <InputLabel>Philosophy</InputLabel>
    <Select value={charte.philosophy}>
      <MenuItem value="strict">Strict</MenuItem>
      <MenuItem value="permissive">Permissive</MenuItem>
    </Select>
  </FormControl>
  <TextField
    label="Version"
    value={charte.version}
    disabled
    helperText="Modifiable lors de la sauvegarde"
  />
</Stack>
```

#### Onglet 2 : Catégories ⭐ **LE PLUS COMPLEXE**

```
┌─────────────────────────────────────────────────────┐
│  CLIENT_POSITIF                              [▼]    │
├─────────────────────────────────────────────────────┤
│  Description :                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Le client exprime un accord ou satisfaction │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Exemples positifs (3) :                           │
│  • oui              [✏️ Éditer] [❌ Supprimer]   │
│  • d'accord         [✏️ Éditer] [❌ Supprimer]   │
│  • merci            [✏️ Éditer] [❌ Supprimer]   │
│  [+ Ajouter exemple]                                │
│                                                     │
│  Contre-exemples (optionnel) :                     │
│  • oui mais         [❌ Supprimer]                 │
│  [+ Ajouter contre-exemple]                         │
│                                                     │
│  Keywords :                                         │
│  [oui, d'accord, bien, ok, entendu]                │
└─────────────────────────────────────────────────────┘
```

**Implémentation** :
```typescript
{Object.entries(definition.categories).map(([name, cat]) => (
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
          onChange={(e) => updateCategory(name, 'description', e.target.value)}
          multiline
          rows={2}
        />
        
        {/* Exemples */}
        <Box>
          <Typography variant="subtitle2">Exemples positifs</Typography>
          {cat.examples.map((ex, idx) => (
            <Stack direction="row" spacing={1} key={idx}>
              <TextField
                value={ex}
                size="small"
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
        
        {/* Contre-exemples (similaire) */}
        {/* Keywords */}
      </Stack>
    </AccordionDetails>
  </Accordion>
))}
```

#### Onglet 3 : Aliases

**Réutiliser CharteManager existant** avec modifications :
```typescript
<CharteAliasEditor
  aliases={definition.aliases}
  onAliasesChange={(newAliases) => updateDefinition({ aliases: newAliases })}
/>
```

#### Onglet 4 : Règles

```typescript
<Stack spacing={2}>
  <FormControl>
    <InputLabel>Approche</InputLabel>
    <Select value={definition.rules.approach}>
      <MenuItem value="few_shot">Few-shot (avec exemples)</MenuItem>
      <MenuItem value="zero_shot">Zero-shot (sans exemples)</MenuItem>
    </Select>
  </FormControl>
  
  <FormControlLabel
    control={<Switch checked={definition.rules.context_included} />}
    label="Inclure contexte (tours précédents/suivants)"
  />
  
  <Box>
    <Typography>Exemples par catégorie : {definition.rules.examples_per_category}</Typography>
    <Slider
      value={definition.rules.examples_per_category}
      min={0}
      max={10}
      marks
      valueLabelDisplay="auto"
    />
  </Box>
  
  <FormControlLabel
    control={<Switch checked={definition.rules.reasoning_required} />}
    label="Demander raisonnement explicite"
  />
</Stack>
```

#### Onglet 5 : Paramètres LLM

```typescript
<Stack spacing={2}>
  <Box>
    <Typography>Temperature : {prompt_params.temperature}</Typography>
    <Slider
      value={prompt_params.temperature}
      min={0}
      max={2}
      step={0.1}
      marks={[{value: 0, label: '0'}, {value: 1, label: '1'}, {value: 2, label: '2'}]}
    />
    <Typography variant="caption">
      0 = Déterministe, 2 = Créatif
    </Typography>
  </Box>
  
  <Box>
    <Typography>Top P : {prompt_params.top_p}</Typography>
    <Slider value={prompt_params.top_p} min={0} max={1} step={0.05} />
  </Box>
  
  <Box>
    <Typography>Max Tokens : {prompt_params.max_tokens}</Typography>
    <Slider value={prompt_params.max_tokens} min={100} max={4096} step={100} />
  </Box>
</Stack>
```

#### Onglet 6 : Template Prompt

```typescript
<Box>
  <Typography variant="subtitle2" gutterBottom>
    Template du prompt (Handlebars)
  </Typography>
  <TextField
    multiline
    rows={15}
    value={prompt_template}
    onChange={(e) => setPromptTemplate(e.target.value)}
    fullWidth
    sx={{
      fontFamily: 'monospace',
      fontSize: '0.9rem',
    }}
  />
  <Typography variant="caption" color="text.secondary">
    Variables disponibles : {'{'}categories{'}'}, {'{'}examples{'}'}, {'{'}verbatim{'}'}
  </Typography>
</Box>
```

#### Actions Sauvegarde

```typescript
<Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
  <Button variant="outlined" onClick={onCancel}>
    Annuler
  </Button>
  <Button
    variant="contained"
    startIcon={<SaveIcon />}
    onClick={handleSave}
  >
    Sauvegarder comme v{nextVersion}
  </Button>
</Stack>

// handleSave logic
const handleSave = async () => {
  // 1. Calculer nouvelle version (1.0.0 → 1.1.0)
  const newVersion = incrementVersion(charte.version);
  
  // 2. Appeler CharteEditionService.createNewVersion()
  const result = await charteEditionService.createNewVersion({
    base_charte_id: charte.charte_id,
    new_version: newVersion,
    changes: modifiedDefinition,
    reason: 'Modification manuelle',
  });
  
  // 3. Afficher succès / erreur
  // 4. Recharger liste chartes
};
```

---

### 5. CharteTuningPanel (Déjà créé ✅)

**Fichier** : `CharteTuningPanel.tsx` (existant)  
**Modifications nécessaires** :

```typescript
// AVANT (Session 3)
<CharteTuningPanel
  charteId={selectedResult?.charte_id || ''}  // ❌ Peut être vide
  testId={selectedTestId || undefined}
/>

// APRÈS (Architecture correcte)
<CharteTuningPanel
  charteId={selectedCharte.charte_id}  // ✅ Toujours défini
  testId={latestTestId}  // ✅ Dernier test de cette charte
/>
```

**Contexte clair** :
- Charte connue (sélectionnée dans sidebar)
- Test ID = dernier test de cette charte (ou null si jamais testée)

---

### 6. CharteVersionHistory (Historique)

**Fichier** : `CharteVersionHistory.tsx`  
**Rôle** : Afficher versions + modifications

```
┌──────────────────────────────────────────────────────────┐
│  Historique des Versions                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  v1.2.0 (Actuelle) ⭐                2025-12-20 18:00   │
│  ├─ Alias ajouté : CLIENT_NON_POSITIF → CLIENT_NEGATIF  │
│  ├─ Description CLIENT_NEUTRE clarifiée                 │
│  └─ Amélioration Kappa : +0.15 (0.65 → 0.80)           │
│                                                          │
│  v1.1.0                              2025-12-19 14:30   │
│  ├─ Exemple ajouté dans CLIENT_POSITIF : "merci"       │
│  └─ Amélioration Kappa : +0.05 (0.60 → 0.65)           │
│                                                          │
│  v1.0.0 (Baseline) 🏁                2025-12-15 10:00   │
│  └─ Version initiale                                    │
│                                                          │
│  [Comparer v1.0.0 vs v1.2.0]                            │
└──────────────────────────────────────────────────────────┘
```

**Implémentation** :
```typescript
const CharteVersionHistory: React.FC<{charteId: string}> = ({ charteId }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [modifications, setModifications] = useState<CharteModification[]>([]);
  
  useEffect(() => {
    // Charger versions
    charteEditionService.getVersions(charteBaseName).then(setVersions);
    // Charger modifications
    charteEditionService.getModificationHistory(charteId).then(setModifications);
  }, [charteId]);
  
  return (
    <Timeline>
      {versions.map(version => (
        <TimelineItem key={version.charte_id}>
          <TimelineSeparator>
            <TimelineDot color={version.is_baseline ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6">
              v{version.version}
              {version.is_baseline && ' 🏁'}
            </Typography>
            <Typography variant="caption">
              {new Date(version.created_at).toLocaleString('fr-FR')}
            </Typography>
            <Box mt={1}>
              {modifications
                .filter(m => m.version_to === version.version)
                .map(mod => (
                  <Chip
                    key={mod.modification_id}
                    label={`${mod.modification_type}: ${mod.field_modified}`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
```

---

## 🔄 WORKFLOWS

### Workflow 1 : Édition Manuelle Simple

```
User → Sidebar → Sélectionne CharteY_B
     → Sous-onglet "Édition"
     → Onglet "Catégories"
     → Modifie description CLIENT_NEUTRE
     → Clique "Sauvegarder v1.1.0"
     → Système crée nouvelle version
     → User peut tester v1.1.0
```

### Workflow 2 : Tuning Automatique + Validation

```
User → Run test CharteY_B v1.0.0
     → Valide 5 désaccords
     → Va dans "Gestion Chartes"
     → Sélectionne CharteY_B
     → Sous-onglet "Tuning"
     → Clique "Générer suggestions"
     → Système détecte : CLIENT_NON_POSITIF (3 fois)
     → User clique "Appliquer"
     → Système crée v1.1.0 avec alias
     → User re-teste v1.1.0
     → Kappa améliore (0.65 → 0.80)
     → User clique "Valider définitivement"
     → Suggestion → applied_validated
```

### Workflow 3 : Suggestion → Modification Manuelle

```
User → Tuning → Voit suggestion "Clarifier CLIENT_NEUTRE"
     → Clique "Modifier manuellement"
     → Système ouvre Édition
     → Pré-remplit modification suggérée
     → User ajuste + ajoute autres modifs
     → Sauvegarde v1.1.0
     → Re-teste
```

---

## 📊 INTÉGRATION DANS Level0Interface

### Modification du Type Tab

```typescript
// AVANT
type Tab = 'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'chartes' | 'tuning';

// APRÈS
type Tab = 'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'chartes';
```

**Explication** : On SUPPRIME 'tuning' car il devient sous-onglet de 'chartes'

### Modification des Tabs

```typescript
<Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
  <Tab label="Tests de Chartes" value="tests" />
  <Tab label="⭐ Gold Standards" value="goldstandards" />
  <Tab label="Validation Désaccords" value="validation" />
  <Tab label="Comparateur Kappa" value="comparator" />
  <Tab label="🔍 Audit & Debug" value="audit" />
  <Tab label="📝 Gestion Chartes" value="chartes" />  {/* ✅ Modifié */}
</Tabs>
```

### Modification du Contenu

```typescript
{/* ============ ONGLET GESTION CHARTES ============ */}
{currentTab === 'chartes' && (
  <CharteManagementLayout />  {/* ✅ Nouveau composant */}
)}

{/* ❌ SUPPRIMÉ : Onglet tuning standalone */}
```

---

## 📦 FICHIERS À CRÉER

### Session 4 (Prochaine)

```
src/features/phase3-analysis/level0-gold/presentation/components/
├── chartes/                                    ← NOUVEAU DOSSIER
│   ├── CharteManagementLayout.tsx             ← Container principal
│   ├── CharteSidebar.tsx                      ← Sélection charte
│   ├── CharteHeader.tsx                       ← Nom + sous-onglets
│   ├── CharteDefinitionEditor.tsx             ← Éditeur complet
│   ├── CharteVersionHistory.tsx               ← Historique
│   └── index.ts                               ← Exports
│
└── tuning/                                    ← EXISTANT
    ├── SuggestionCard.tsx                     ← ✅ Créé
    ├── SuggestionList.tsx                     ← ✅ Créé
    ├── CategoryStatsPanel.tsx                 ← ✅ Créé
    ├── CharteTuningPanel.tsx                  ← ✅ Créé
    └── index.ts                               ← ✅ Créé
```

---

## ⏱️ ESTIMATION TEMPS

| Composant | Temps | Priorité |
|-----------|-------|----------|
| CharteManagementLayout | 30 min | 🔴 Critique |
| CharteSidebar | 30 min | 🔴 Critique |
| CharteHeader | 15 min | 🔴 Critique |
| CharteDefinitionEditor (structure) | 30 min | 🔴 Critique |
| CharteDefinitionEditor (Catégories) | 1h30 | 🔴 Critique |
| CharteDefinitionEditor (autres onglets) | 1h | 🟡 Important |
| CharteVersionHistory | 45 min | 🟢 Nice-to-have |
| Intégration Level0Interface | 15 min | 🔴 Critique |
| Tests + Debug | 30 min | 🔴 Critique |
| **TOTAL** | **~5h30** | |

**Stratégie** : MVP d'abord (4h), puis polish (1h30)

---

## ✅ CRITÈRES DE VALIDATION

### Fonctionnels
- [ ] Sélection charte dans sidebar fonctionne
- [ ] Sous-onglets Édition/Tuning/Historique switchent
- [ ] Édition catégories : add/edit/remove exemples
- [ ] Sauvegarde crée nouvelle version correctement
- [ ] Tuning affiche suggestions de la charte sélectionnée
- [ ] Historique affiche toutes versions + modifications

### Ergonomiques
- [ ] Contexte clair : toujours visible quelle charte
- [ ] Navigation intuitive (sidebar → sous-onglets)
- [ ] Pas de perte de sélection lors navigation
- [ ] Feedback visuel sur actions (loading, success, error)

### Techniques
- [ ] Compilation TypeScript OK
- [ ] Pas de props drilling excessif
- [ ] Services réutilisés (CharteEditionService, CharteTuningService)
- [ ] Gestion erreurs robuste

---

## 🚀 PLAN SESSION 4

### MVP (4h) - Obligatoire

**1. Structure + Navigation (1h30)**
- CharteManagementLayout
- CharteSidebar
- CharteHeader
- Intégration Level0Interface

**2. Édition Basique (1h30)**
- CharteDefinitionEditor (structure 6 onglets)
- Onglet Métadonnées
- Onglet Aliases (réutiliser existant)
- Logique sauvegarde

**3. Intégration Tuning (1h)**
- Modification CharteTuningPanel (props charteId obligatoire)
- Test workflow complet
- Debug

### Polish (1h30) - Optionnel

**4. Édition Avancée**
- Onglet Catégories (add/edit/remove exemples)
- Onglet Règles
- Onglet LLM
- Onglet Prompt

**5. Historique**
- CharteVersionHistory
- Timeline versions
- Comparaison versions

---

## 📝 NOTES IMPORTANTES

### Workflow Suggéré Session 4

1. **Créer structure vide** (30 min)
   - 5 fichiers dans `chartes/`
   - Skeleton components
   - Compilation OK

2. **Navigation fonctionnelle** (1h)
   - Sidebar + Header
   - Switch sous-onglets
   - Intégration Level0Interface

3. **Édition MVP** (1h30)
   - Métadonnées + Aliases
   - Sauvegarde basique
   - Test création v1.1.0

4. **Tuning intégré** (1h)
   - Modifier CharteTuningPanel
   - Test suggestions
   - Workflow apply → validate

5. **Polish selon temps** (si reste)
   - Catégories avancé
   - Historique
   - UX improvements

---

**Document créé** : 2025-12-20  
**Version** : 1.0  
**Auteur** : Claude & Thomas  
**Statut** : Spécification complète - Prêt pour Session 4
