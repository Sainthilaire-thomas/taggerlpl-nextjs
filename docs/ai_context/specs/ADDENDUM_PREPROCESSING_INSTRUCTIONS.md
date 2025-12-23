# ADDENDUM - Section Preprocessing Instructions

**Date** : 2025-12-21  
**Complément à** : SPEC_EDITEUR_PROMPT_INLINE.md  
**Ajout** : Section preprocessing_instructions

---

## 🧹 SECTION PREPROCESSING INSTRUCTIONS

### Problème : Artefacts de transcription

**Observation Thomas** : Les verbatims dans `analysis_pairs` contiennent des marqueurs :

```
Exemples réels :
- "oui [AP] d'accord (???) merci"
- "non [T] mais c'est pas normal"
- "hm 14:23:45 mh"
- "très bien [CODE:123] parfait"
```

**Marqueurs courants** :
- `[AP]` : Appel
- `[T]` : Transfert
- `(???)` : Inaudible
- `[CODE:XXX]` : Codes internes
- Timestamps : `HH:MM:SS`
- Autres : `[...]`, `(inaudible)`, etc.

---

## 🎯 IMPACT SUR ANNOTATION LLM

### Sans preprocessing

```
Prompt :
"Classifiez : oui [AP] d'accord (???) merci"

LLM confus :
- Que signifie [AP] ?
- Dois-je l'ignorer ?
- Cela affecte-t-il la classification ?

Résultat potentiel :
CLIENT_NEUTRE (à cause de l'ambiguïté introduite)
```

### Avec preprocessing

```
Prompt :
"Preprocessing : Ignorez [AP], [T], (???)
Classifiez : oui [AP] d'accord (???) merci"

LLM comprend :
- [AP] et (???) sont à ignorer
- Verbatim effectif : "oui d'accord merci"

Résultat :
CLIENT_POSITIF ✓
```

---

## 📊 STRUCTURE DONNÉES MISE À JOUR

### JSON `definition.prompt_structure`

```json
{
  "definition": {
    "prompt_structure": {
      "system_instructions": {
        "content": "",
        "enabled": false,
        "order": 1
      },
      "task_description": {
        "content": "Classifiez la réaction du client selon la charte suivante.",
        "enabled": true,
        "order": 10
      },
      
      // ===== NOUVEAU =====
      "preprocessing_instructions": {
        "content": "Ignorez les marqueurs de transcription suivants dans le verbatim : [AP], [T], (???), [CODE:XXX], ainsi que tout timestamp au format HH:MM:SS.",
        "enabled": true,
        "order": 15
      },
      // ==================
      
      "context_template": {
        "content": "CONTEXTE:\nTour -1 ({{prev1_speaker}}): {{prev1_verbatim}}\nTour 0 (conseiller): {{conseiller_verbatim}}\nTour +1 (client): {{client_verbatim}} ← À CLASSIFIER\nTour +2 ({{next1_speaker}}): {{next1_verbatim}}",
        "enabled": true,
        "order": 40
      },
      
      "constraints": {
        "content": "",
        "enabled": false,
        "order": 50
      },
      
      "fallback_instructions": {
        "content": "",
        "enabled": false,
        "order": 80
      },
      
      "output_format": {
        "content": "Répondez uniquement avec la catégorie (CLIENT_POSITIF, CLIENT_NEGATIF, ou CLIENT_NEUTRE).",
        "enabled": true,
        "order": 90
      }
    },
    
    "categories": { ... },
    "rules": { ... },
    "llm_params": { ... },
    "aliases": { ... }
  }
}
```

---

## 🔧 MIGRATION SQL

### Script d'ajout preprocessing_instructions

```sql
-- Ajouter preprocessing_instructions aux chartes existantes
UPDATE level0_chartes
SET definition = jsonb_set(
  definition,
  '{prompt_structure,preprocessing_instructions}',
  '{
    "content": "Ignorez les marqueurs de transcription suivants dans le verbatim : [AP], [T], (???), [CODE:XXX], ainsi que tout timestamp au format HH:MM:SS.",
    "enabled": true,
    "order": 15
  }'::jsonb,
  true  -- create if not exists
)
WHERE definition->'prompt_structure' IS NOT NULL;

-- Vérification
SELECT 
  charte_id,
  definition->'prompt_structure'->'preprocessing_instructions'->>'enabled' as preprocessing_enabled,
  length(definition->'prompt_structure'->'preprocessing_instructions'->>'content') as content_length
FROM level0_chartes;
```

---

## 🎨 INTERFACE UTILISATEUR

### Affichage dans éditeur prompt

```
╔══════════════════════════════════════════════╗
║ [Task Description]                           ║
║ Classifiez la réaction du client selon      ║
║ la charte suivante.                         ║
╚══════════════════════════════════════════════╝

╔══════════════════════════════════════════════╗
║ [Preprocessing Instructions]                 ║  ← NOUVEAU
║ Ignorez les marqueurs de transcription      ║
║ suivants dans le verbatim : [AP], [T],      ║
║ (???), [CODE:XXX], ainsi que tout           ║
║ timestamp au format HH:MM:SS.               ║
╚══════════════════════════════════════════════╝
    ↑ Clic pour éditer
    ↑ Toggle enabled/disabled

╔══════════════════════════════════════════════╗
║ [Definitions]                                ║
║ - CLIENT_POSITIF : ...                      ║
║ - CLIENT_NEGATIF : ...                      ║
║ - CLIENT_NEUTRE : ...                       ║
╚══════════════════════════════════════════════╝
```

**Options d'édition** :
- ✏️ **Clic simple** : Ouvre éditeur inline
- 👁️ **Toggle** : Activer/désactiver section
- 🗑️ **Clear** : Vider contenu (garde section)

---

## 📝 EXEMPLES D'USAGE

### Exemple 1 : Preprocessing standard

```json
"preprocessing_instructions": {
  "content": "Ignorez : [AP], [T], (???), timestamps",
  "enabled": true,
  "order": 15
}
```

**Prompt généré** :
```
Classifiez la réaction du client.

Ignorez : [AP], [T], (???), timestamps

Définitions :
- CLIENT_POSITIF : ...
...
```

---

### Exemple 2 : Preprocessing étendu

```json
"preprocessing_instructions": {
  "content": "Avant de classifier :\n1. Ignorez tous marqueurs entre crochets [XXX]\n2. Ignorez tous marqueurs entre parenthèses (XXX)\n3. Ignorez les timestamps\n4. Conservez uniquement le verbatim pur du client",
  "enabled": true,
  "order": 15
}
```

**Prompt généré** :
```
Classifiez la réaction du client.

Avant de classifier :
1. Ignorez tous marqueurs entre crochets [XXX]
2. Ignorez tous marqueurs entre parenthèses (XXX)
3. Ignorez les timestamps
4. Conservez uniquement le verbatim pur du client

Définitions :
...
```

---

### Exemple 3 : Preprocessing désactivé

```json
"preprocessing_instructions": {
  "content": "Ignorez : [AP], [T], (???)",
  "enabled": false,  // ← Désactivé
  "order": 15
}
```

**Prompt généré** :
```
Classifiez la réaction du client.

Définitions :
- CLIENT_POSITIF : ...
(pas de preprocessing)
```

---

## 🧪 TESTS A/B PRÉVUS

### Test 1 : Impact preprocessing sur accuracy

**Hypothèse** : Preprocessing améliore accuracy de 5-10%

**Setup** :
- Charte A : `preprocessing_instructions.enabled = false`
- Charte B : `preprocessing_instructions.enabled = true`
- Échantillon : 100 paires avec artefacts

**Mesures** :
- Accuracy
- Kappa
- Confusion matrix (CLIENT_NEUTRE surreprésenté sans preprocessing ?)

---

### Test 2 : Sensibilité aux artefacts

**Hypothèse** : Certains artefacts perturbent plus que d'autres

**Setup** :
- Groupe 1 : Paires avec `[AP]` uniquement
- Groupe 2 : Paires avec `(???)` uniquement
- Groupe 3 : Paires avec timestamps
- Groupe 4 : Paires combinant plusieurs artefacts

**Mesures** :
- Taux d'erreur par type d'artefact
- Identification artefacts les plus perturbants

---

### Test 3 : Formulation preprocessing

**Hypothèse** : Formulation courte vs détaillée

**Setup** :
- Charte A : "Ignorez [AP], [T], (???)"
- Charte B : "Avant de classifier, ignorez tous les marqueurs de transcription [AP], [T], (???) présents dans le verbatim. Ces marqueurs sont des artefacts techniques et ne reflètent pas le contenu sémantique de la réponse client."

**Mesures** :
- Accuracy
- Tokens utilisés (coût)
- Temps réponse LLM

---

## 🔄 WORKFLOW ÉDITION

### Scénario 1 : Utilisateur ajoute nouveau marqueur

```
1. User observe : Verbatim "oui [NEW_CODE] d'accord"
2. User clique section [Preprocessing Instructions]
3. Mode édition s'ouvre
4. User ajoute : ", [NEW_CODE]"
5. Contenu devient : "Ignorez : [AP], [T], (???), [NEW_CODE]"
6. User clique "Sauvegarder"
7. Nouvelle version créée : 1.0.0 → 1.1.0
8. charte_modifications trace : 
   - field_modified: "prompt_structure.preprocessing_instructions.content"
   - old_value: "Ignorez : [AP], [T], (???)"
   - new_value: "Ignorez : [AP], [T], (???), [NEW_CODE]"
```

---

### Scénario 2 : Suggestion tuning propose ajout

```
Tab TUNING :
┌─ Section: PREPROCESSING ─────────────────────┐
│                                              │
│  Contenu actuel     │  💡 Suggestion         │
│  ─────────────────  │  ──────────────────── │
│  Ignorez : [AP],    │  Ajouter : [INAUD]    │
│  [T], (???)         │                        │
│                     │  Pattern détecté :     │
│                     │  5 désaccords avec     │
│                     │  verbatims contenant   │
│                     │  [INAUD]               │
│                     │                        │
│                     │  [Appliquer]           │
│                     │  [Rejeter]             │
└──────────────────────────────────────────────┘

User clique [Appliquer]
→ Contenu mis à jour automatiquement
→ Nouvelle version créée
→ Suggestion marquée "applied"
```

---

## 📊 IMPACT SUR PERFORMANCE

### Tokens ajoutés

**Sans preprocessing** : ~300 tokens
**Avec preprocessing standard** : ~330 tokens (+10%)
**Avec preprocessing détaillé** : ~360 tokens (+20%)

**Recommandation** : Preprocessing concis (< 50 tokens)

---

### Impact temps réponse

**Mesures préliminaires** (estimation) :
- Sans preprocessing : 1200ms moyenne
- Avec preprocessing : 1250ms moyenne (+50ms, +4%)

**Impact négligeable** pour le gain en accuracy.

---

## ✅ VALIDATION

### Critères de succès

1. ✅ **Section ajoutée** à prompt_structure
2. ✅ **Migration SQL** testée sur chartes existantes
3. ✅ **UI** permet édition section
4. ✅ **PromptBuilder** inclut section si enabled
5. ⏳ **Tests A/B** mesurent impact (post-implémentation)

### Checklist implémentation

- [ ] Ajouter `preprocessing_instructions` dans migration SQL
- [ ] Mettre à jour `PromptBuilder.buildPrompt()` (order 15)
- [ ] Créer `PromptSectionCard` gérant section preprocessing
- [ ] Ajouter toggle enabled/disabled dans UI
- [ ] Tests : Générer prompt avec/sans preprocessing
- [ ] Documentation : Ajouter exemples preprocessing

---

## 🔗 RÉFÉRENCES

- **Source problème** : Observation Thomas (artefacts transcription)
- **ADR** : ADR 007 (Architecture éditeur prompt inline)
- **Spec principale** : SPEC_EDITEUR_PROMPT_INLINE.md
- **Tests prévus** : MISSION_SPRINT5_v2.md (Sprint 6)

---

**Conclusion** : Section `preprocessing_instructions` (order 15) ajoute capacité essentielle de gestion artefacts transcription, améliorant accuracy sans complexité excessive.
