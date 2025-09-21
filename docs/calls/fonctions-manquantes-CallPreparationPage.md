# 📋 **Fonctionnalités Manquantes dans CallPreparationPage par rapport au Legacy CallListUnprepared**

## **Analyse Comparative : Legacy vs Architecture DDD**

### **🎯 Objectif de la Page (Confirmé)**

CallPreparationPage doit devenir l'équivalent moderne de CallListUnprepared pour :

- **Filtrer** les appels susceptibles d'être taggés (`is_tagging_call = true`)
- **Préparer** au tagging (transformation JSON → `word` table)
- **Visualiser** les appels prêts pour le tagging
- **Sélectionner** un appel pour l'annotateur

---

## **🚨 Fonctionnalités CRITIQUES Manquantes**

### **1. 🔍 Filtrage par Statut Conflictuel**

**Legacy CallListUnprepared :**

typescript

```typescript
filters: {
  status: "conflictuel" | "non_conflictuel" | "non_supervisé";
}
```

**❌ Manque dans CallPreparationPage :**

- Pas de filtre par statut conflictuel
- Pas de lecture du champ `status` depuis la table `call`
- Pas de détection automatique des appels conflictuels

**✅ À Ajouter :**

typescript

```typescript
// Dans l'interface de filtrage
<FormControl size="small" sx={{ minWidth: 180 }}>
  <InputLabel>Type d'Appel</InputLabel>
  <Select
    value={filters.conflictStatus}
    onChange={(e) =>
      setFilters((prev) => ({
        ...prev,
        conflictStatus: e.target.value,
      }))
    }
  >
    <MenuItem value="all">Tous les appels</MenuItem>
    <MenuItem value="conflictuel">🔴 Conflictuels</MenuItem>
    <MenuItem value="non_conflictuel">🟢 Non conflictuels</MenuItem>
    <MenuItem value="non_supervisé">⚪ Non supervisés</MenuItem>
  </Select>
</FormControl>
```

---

### **2. 📊 Tri et Filtrage par Origine**

**Legacy CallListUnprepared :**

typescript

```typescript
// Groupement par origine avec tri
const callsByOrigin = groupCallsByOrigin(calls);
// Filtres origine + statistiques par origine
```

**❌ Manque dans CallPreparationPage :**

- Pas de groupement par origine
- Pas de tri par origine
- Pas de visualisation des statistiques par origine

**✅ À Ajouter :**

typescript

```typescript
// Hook de filtrage avancé
constuseAdvancedCallFilters=(calls:Call[])=>{
// Filtrage par origine avec statistiques
const callsByOrigin =useMemo(()=>{
return calls.reduce((acc, call)=>{
const origin = call.origin||'Aucune origine';
if(!acc[origin]) acc[origin]=[];
      acc[origin].push(call);
return acc;
},{}asRecord<string,Call[]>);
},[calls]);

// Statistiques par origine
const originStats =useMemo(()=>{
returnObject.entries(callsByOrigin).map(([origin, calls])=>({
      origin,
      total: calls.length,
      conflictuels: calls.filter(c => c.status==='conflictuel').length,
      preparables: calls.filter(c => c.isReadyForTagging()).length
}));
},[callsByOrigin]);

return{ callsByOrigin, originStats };
};
```

---

### **3. 🔄 Transformation JSON Transcription → Table `word`**

**Legacy CallListUnprepared :**

- Transformation automatique lors de la préparation
- Parsing du JSON `transcription` vers la structure `word`

**❌ Manque dans CallPreparationPage :**

- Pas de logique de transformation JSON → `word`
- Pas de service de transformation de transcription
- Pas de validation de la structure JSON

**✅ À Ajouter :**

typescript

```typescript
// Service de transformation transcription
exportclassTranscriptionTransformationService{
asynctransformJsonToWords(callId:string, transcriptionJson:any):Promise<void>{
// 1. Valider la structure JSON
if(!transcriptionJson?.words ||!Array.isArray(transcriptionJson.words)){
thrownewValidationError(['Invalid transcription structure']);
}

// 2. Créer un transcript
const{ data: transcript }=await supabase
.from('transcript')
.insert({ callid: callId })
.select('transcriptid')
.single();

// 3. Transformer chaque mot
const wordsToInsert = transcriptionJson.words.map((word:any)=>({
      transcriptid: transcript.transcriptid,
      word: word.text|| word.word,
      startTime: word.startTime|| word.start_time,
      endTime: word.endTime|| word.end_time,
      speaker: word.speaker||'unknown',
      turn: word.turn||null
}));

// 4. Insérer dans la table word
await supabase.from('word').insert(wordsToInsert);

// 5. Marquer comme préparé
await supabase
.from('call')
.update({ preparedfortranscript:true})
.eq('callid', callId);
}
}
```

---

### **4. 🎯 Critère de Sélection `is_tagging_call = true`**

**Legacy CallListUnprepared :**

typescript

```typescript
.eq("is_tagging_call",true)// Filtre automatique
```

**❌ Manque dans CallPreparationPage :**

- Pas de filtre par `is_tagging_call`
- Affiche tous les appels au lieu des appels de tagging uniquement

**✅ À Ajouter :**

typescript

```typescript
// Dans SupabaseCallRepository.ts
asyncfindTaggingCalls():Promise<Call[]>{
const{ data, error }=awaitthis.sb
.from("call")
.select("*")
.eq("is_tagging_call",true)// ✅ Filtre crucial
.order("callid",{ ascending:false});

if(error)thrownewRepositoryError(`Find tagging calls failed: ${error.message}`);
return(data asDbCall[]).map(this.mapToCall);
}
```

---

### **5. 📋 Visualisation des Appels Prêts pour le Tagging**

**Legacy CallListUnprepared :**

- Interface en accordéon par origine
- Statut de préparation clair
- Actions de préparation directes

**❌ Manque dans CallPreparationPage :**

- Interface trop basique (simple tableau)
- Pas de groupement visuel par origine
- Pas d'indicateurs visuels de statut de préparation

**✅ À Ajouter :**

typescript

```typescript
// Composant AccordionByOrigin
constCallsByOriginAccordion = ({
  callsByOrigin,
  onPrepareCall,
  onSelectCall,
}) => {
  return (
    <Box>
      {Object.entries(callsByOrigin).map(([origin, calls]) => (
        <Accordion key={origin}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Typography variant="h6">{origin}</Typography>
              <Chip
                label={`${calls.length} appels`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${
                  calls.filter((c) => c.status === "conflictuel").length
                } conflictuels`}
                color="error"
                size="small"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <CallPreparationTable
              calls={calls}
              onPrepareCall={onPrepareCall}
              onSelectCall={onSelectCall}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
```

---

### **6. 🚀 Sélection d'Appel pour le Taggeur**

**Legacy CallListUnprepared :**

- Navigation directe vers TranscriptLPL
- Contexte de sélection conservé

**❌ Manque dans CallPreparationPage :**

- Pas d'action "Commencer le Tagging"
- Pas de navigation vers l'interface de tagging

**✅ À Ajouter :**

typescript

```typescript
// Action de sélection pour tagging
const handleSelectForTagging = useCallback(
  (call: Call) => {
    // 1. Vérifier que l'appel est prêt
    if (!call.isReadyForTagging()) {
      showMessage("❌ Appel non préparé pour le tagging");
      return;
    }

    // 2. Générer URL signée si nécessaire
    if (call.hasValidAudio()) {
      // Générer URL audio signée
      generateSignedUrl(call.getAudioFile()?.path);
    }

    // 3. Navigation vers TranscriptLPL
    router.push(`/new-tagging?callId=${call.id}`);
  },
  [router]
);

// Dans le tableau
<Button
  variant="contained"
  color="success"
  onClick={() => handleSelectForTagging(call)}
  disabled={!call.isReadyForTagging()}
  startIcon={<PlayArrow />}
>
  Commencer le Tagging
</Button>;
```

---

## **🏗️ Architecture DDD Requise**

### **Services à Créer/Étendre :**

typescript

```typescript
// 1. Service de filtrage avancé
exportclassCallFilteringService{
filterByConflictStatus(calls:Call[], status:ConflictStatus):Call[];
filterByOrigin(calls:Call[], origin:string):Call[];
filterByTaggingReadiness(calls:Call[]):Call[];
groupByOrigin(calls:Call[]):Record<string,Call[]>;
}

// 2. Service de transformation transcription
exportclassTranscriptionPreparationService{
asyncprepareCallForTagging(callId:string):Promise<void>;
asynctransformJsonToWords(callId:string):Promise<void>;
asyncvalidateTranscriptionStructure(json:any):Promise<ValidationResult>;
}

// 3. Service de navigation tagging
exportclassTaggingNavigationService{
asyncselectCallForTagging(call:Call):Promise<string>;// Retourne URL
asyncgenerateTaggingContext(callId:string):Promise<TaggingContext>;
}
```

---

## **📊 État Final Souhaité**

### **Interface Cible CallPreparationPage :**

```
┌─ Filtres Avancés ──────────────────────────────────────┐
│ [Recherche] [Statut: Conflictuel ▼] [Origine: Toutes ▼] │
│ [Audio: Tous ▼] [Transcription: Tous ▼]               │
└──────────────────────────────────────────────────────┘

┌─ Statistiques par Origine ──────────────────────────────┐
│ 📊 Workdrive: 45 appels (12 conflictuels, 8 prêts)     │
│ 📊 Upload: 23 appels (6 conflictuels, 15 prêts)        │
│ 📊 API: 12 appels (2 conflictuels, 10 prêts)           │
└──────────────────────────────────────────────────────┘

┌─ Appels par Origine (Accordéon) ────────────────────────┐
│ ▼ Workdrive (45 appels) [Préparer Tout] [Sélectionner] │
│   ├─ call_001.mp3    🔴 Conflictuel    [Préparer] [▶️]  │
│   ├─ call_002.mp3    🟢 Non conflictuel [Préparer] [▶️]  │
│   └─ call_003.mp3    ✅ Prêt           [🎯 Tagger]     │
│                                                          │
│ ▼ Upload (23 appels) [Préparer Tout] [Sélectionner]     │
│   ├─ meeting_01.wav  ⚪ Non supervisé   [Préparer] [▶️]  │
│   └─ ...                                                │
└──────────────────────────────────────────────────────┘
```

---

## **⚡ Priorités d'Implémentation**

### **Phase 1 (Critique) :**

1. ✅ Filtrage par `is_tagging_call = true`
2. ✅ Filtrage par statut conflictuel
3. ✅ Service de transformation JSON → `word`

### **Phase 2 (Important) :**

4. ✅ Groupement et tri par origine
5. ✅ Interface en accordéon par origine
6. ✅ Actions de préparation en lot

### **Phase 3 (Compléments) :**

7. ✅ Sélection pour tagging avec navigation
8. ✅ Statistiques avancées par origine
9. ✅ Intégration avec TranscriptLPL

Cette architecture permettra à CallPreparationPage de **remplacer complètement** le legacy CallListUnprepared tout en bénéficiant de l'architecture DDD moderne et des optimisations de performance.
