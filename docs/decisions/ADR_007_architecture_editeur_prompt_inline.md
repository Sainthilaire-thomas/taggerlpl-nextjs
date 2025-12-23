# ADR 007 - Architecture Éditeur Prompt Inline avec Sections Extensibles

**Date** : 2025-12-21  
**Statut** : Accepté  
**Contexte** : Sprint 5 - Session 4 - Refonte UI édition chartes Level 0

---

## Contexte

Suite à la création des 4 éditeurs de chartes (Catégories, Aliases, Règles, LLM), une analyse approfondie a révélé plusieurs problèmes architecturaux majeurs :

### Problèmes identifiés

1. **Opacité structure prompt**
   - Le champ `prompt_template` est en dur (texte brut)
   - Pas d'UI pour éditer les instructions globales
   - Mélange instructions système + définitions + format sortie
   - Impossible de savoir ce que le LLM voit vraiment

2. **Tab "Catégories" mal nommé**
   - Le nom ne reflète pas l'usage réel
   - On édite le prompt, pas juste des catégories
   - Confusion conceptuelle pour l'utilisateur

3. **Pas de vue d'ensemble**
   - Édition fragmentée entre plusieurs tabs
   - Aucune preview du prompt final généré
   - Difficile de comprendre l'impact des modifications

4. **Non-extensibilité**
   - Structure figée (system, task, output)
   - Impossible d'ajouter nouvelles sections
   - Pas de gestion des cas spécifiques (preprocessing, constraints, etc.)

5. **Pas de synergie tuning**
   - Les suggestions du tab Tuning sont floues
   - On ne sait pas quelle partie du prompt améliorer
   - Pas de workflow clair suggestion → édition

---

## Décision

### Architecture retenue : Éditeur Prompt Inline WYSIWYG Structuré

**Principe** : Une seule vue linéaire qui affiche le prompt tel qu'envoyé au LLM, avec **zones éditables au clic**.

```
╔══════════════════════════════════════╗
║ [System Instructions]                ║  ← Clic → Édition inline
║ Vous êtes un expert...              ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Task Description]                   ║  ← Clic → Édition inline
║ Classifiez la réaction...           ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Preprocessing]                      ║  ← Clic → Édition inline
║ Ignorez [AP], [T], (???)            ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Definitions]                        ║  ← AUTO-GÉNÉRÉ
║ - CLIENT_POSITIF : ...              ║    [Éditer catégories]
╚══════════════════════════════════════╝
```

### Sections extensibles (13 sections identifiées)

#### Requises (toujours présentes)
1. **Task Description** - Description de la tâche
2. **Definitions** - Catégories (auto-généré)
3. **Output Format** - Format de sortie

#### Optionnelles (activables/désactivables)
4. **System Instructions** - Rôle, persona du LLM
5. **Preprocessing Instructions** - Nettoyage verbatim (artefacts transcription)
6. **Context Template** - Template du contexte conversationnel
7. **Examples** - Exemples few-shot complets
8. **Constraints** - Règles strictes
9. **Reasoning Instructions** - Guide le raisonnement
10. **Warnings** - Ce qu'il NE FAUT PAS faire
11. **Fallback Instructions** - Que faire si incertain
12. **Quality Criteria** - Critères de qualité
13. **Edge Cases** - Gestion cas limites

### Structure de données

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
        "content": "Classifiez...",
        "enabled": true,
        "order": 10
      },
      "preprocessing_instructions": {
        "content": "Ignorez les marqueurs de transcription [AP], [T], (???) présents dans le verbatim.",
        "enabled": true,
        "order": 15
      },
      "context_template": {
        "content": "CONTEXTE:\n...",
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
        "content": "Répondez uniquement...",
        "enabled": true,
        "order": 90
      }
      // ... autres sections
    },
    "categories": { ... },
    "rules": { ... },
    "llm_params": { ... }
  }
}
```

**Propriétés de chaque section :**
- `content` : Texte de la section
- `enabled` : Visible dans le prompt final ?
- `order` : Position d'apparition (1-100)

---

## Rationale

### Pourquoi WYSIWYG inline ?

#### Avantage 1 : Vue d'ensemble immédiate
**Problème actuel** : L'utilisateur ne voit jamais le prompt complet.
**Solution** : Affichage linéaire de toutes les sections dans l'ordre d'envoi au LLM.

#### Avantage 2 : Édition intuitive
**Problème actuel** : Navigation entre tabs, formulaires complexes.
**Solution** : Clic sur zone → édition inline (comme Google Docs).

#### Avantage 3 : Labels discrets
**Problème actuel** : Confusion entre structure UI et contenu réel.
**Solution** : Labels `[Section]` en caption grisée, non intrusif.

#### Avantage 4 : Pas de scroll excessif
**Solution** : Sections collapsibles si besoin, texte monospace compact.

### Pourquoi sections extensibles ?

#### Observation : Cas d'usage variés

**Recherche Thomas** : Teste few-shot vs zero-shot, différentes philosophies.
**Besoin** : Chaque approche nécessite des instructions spécifiques.

**Exemples concrets :**

**Charte Minimaliste (zero-shot strict) :**
```json
{
  "task_description": { enabled: true },
  "definitions": { auto },
  "output_format": { enabled: true }
  // TOUT LE RESTE disabled
}
```

**Charte Enrichie (few-shot + contraintes) :**
```json
{
  "system_instructions": { enabled: true },
  "task_description": { enabled: true },
  "preprocessing_instructions": { enabled: true },
  "definitions": { auto },
  "examples": { enabled: true },
  "constraints": { enabled: true },
  "fallback_instructions": { enabled: true },
  "output_format": { enabled: true }
}
```

**Charte Reasoning (chain-of-thought) :**
```json
{
  "task_description": { enabled: true },
  "definitions": { auto },
  "reasoning_instructions": { enabled: true, content: "Pensez étape par étape..." },
  "output_format": { enabled: true }
}
```

#### Facile d'ajouter nouvelles sections

**Processus** :
1. Ajouter champ dans JSON
2. UI se génère automatiquement
3. PromptBuilder l'inclut si enabled

**Exemple** : Ajouter section "Domain Knowledge" :
```json
"domain_knowledge": {
  "content": "Contexte métier : centre d'appels assurance habitation",
  "enabled": true,
  "order": 5
}
```

### Pourquoi section "Preprocessing Instructions" ?

#### Problème réel : Artefacts de transcription

**Observation Thomas** : Les verbatims contiennent des marqueurs :
- `[AP]` : Appel
- `[T]` : Transfert
- `(???)` : Inaudible
- Timestamps, codes internes, etc.

**Impact sur annotation** :

**Sans preprocessing :**
```
Tour client : "oui [AP] d'accord (???) merci"
LLM confus → Peut classifier CLIENT_NEUTRE à cause des artefacts
```

**Avec preprocessing :**
```
Preprocessing : "Ignorez [AP], [T], (???) dans le verbatim"
Tour client : "oui [AP] d'accord (???) merci"
LLM comprend → "oui d'accord merci" → CLIENT_POSITIF ✓
```

**Alternatives rejetées :**

1. **Nettoyer en amont** (avant stockage analysis_pairs)
   - ❌ Perte d'information
   - ❌ Irréversible
   - ❌ Peut masquer des patterns intéressants

2. **Hardcoder dans prompt_template**
   - ❌ Pas éditable
   - ❌ Pas extensible
   - ❌ Pas traçable

3. **Laisser le LLM gérer**
   - ❌ Inconsistant
   - ❌ Coût tokens inutile
   - ❌ Peut dégrader performance

**Solution retenue** : Section explicite dans prompt
- ✅ Éditable
- ✅ Traçable (versioning)
- ✅ Testable (A/B test avec/sans)

---

### Synergie avec Tuning (Innovation majeure)

#### Tab Tuning enrichi : Vue côte-à-côte

**Problème actuel** : Suggestions floues
```
💡 Suggestion : "Clarifier description CLIENT_NEUTRE"
→ Mais où ? Comment ?
```

**Solution** : Affichage contextuel
```
┌─ Section: TASK DESCRIPTION ──────────────┐
│                                          │
│  Contenu actuel     │  💡 Suggestion     │
│  ─────────────────  │  ────────────────  │
│  Classifiez...      │  Ajouter :         │
│                     │  "en tenant compte │
│                     │  du niveau de      │
│                     │  satisfaction"     │
│                     │                    │
│                     │  [Appliquer]       │
│                     │  [Éditer]          │
└──────────────────────────────────────────┘
```

**Workflow clair :**
1. **Suggestion détectée** : Analyse désaccords → Pattern identifié
2. **Affichage contextualisé** : Suggestion EN REGARD de la section concernée
3. **Actions claires** :
   - **Appliquer** : Remplace automatiquement `content`
   - **Éditer** : Ouvre éditeur inline avec suggestion pré-remplie
   - **Rejeter** : Marque suggestion non pertinente
4. **Traçabilité** : `charte_modifications` trace quelle suggestion a modifié quelle section

---

## Conséquences

### Positives

#### 1. Transparence totale
- ✅ L'utilisateur voit **exactement** le prompt envoyé au LLM
- ✅ Pas de "magie noire" dans la génération
- ✅ Debug facile (copier-coller prompt dans ChatGPT pour tester)

#### 2. Flexibilité scientifique
- ✅ Thomas peut tester différentes approches facilement
- ✅ A/B testing : Charte avec/sans section X
- ✅ Mesure impact de chaque section sur Kappa

#### 3. Maintenabilité
- ✅ Ajout nouvelles sections sans refonte UI
- ✅ Structure JSON claire et auto-documentée
- ✅ Service PromptBuilder centralisé

#### 4. Workflow tuning optimisé
- ✅ Suggestions actionnables
- ✅ Édition rapide (1 clic)
- ✅ Traçabilité complète

### Négatives (mitigées)

#### 1. Complexité structure JSON
**Impact** : JSON plus profond (`prompt_structure` avec 13 sous-objets)
**Mitigation** : 
- Migration SQL automatisée
- Valeurs par défaut sensées
- Validation au chargement

#### 2. Risque de surcharge UI
**Impact** : Beaucoup de sections = scroll potentiel
**Mitigation** :
- Sections collapsibles
- Seulement sections enabled affichées par défaut
- Bouton "Ajouter section" pour optionnelles

#### 3. Changement paradigme utilisateur
**Impact** : Habitués aux formulaires classiques
**Mitigation** :
- Labels clairs `[Section]`
- Hover states (indiquent cliquabilité)
- Tooltip "Cliquez pour éditer"

---

## Alternatives considérées

### Alternative A : Tabs séparés (REJETÉE)

**Proposition** : 
```
[SYSTEM] [TASK] [DEFINITIONS] [CONSTRAINTS] [OUTPUT] ...
```

**Avantages** :
- Pages courtes
- Séparation responsabilités claire

**Inconvénients décisifs** :
- ❌ Pas de vue d'ensemble
- ❌ Navigation excessive (8+ tabs)
- ❌ Impossible de voir le prompt complet
- ❌ Suggestions tuning moins contextuelles

**Verdict** : Rejeté

---

### Alternative B : Éditeur markdown brut (REJETÉE)

**Proposition** : Zone texte unique avec markdown

**Avantages** :
- Simple à implémenter
- Contrôle total

**Inconvénients décisifs** :
- ❌ Perte de structure
- ❌ Pas de génération auto (definitions)
- ❌ Pas de suggestions tuning contextuelles
- ❌ Difficile à valider

**Verdict** : Rejeté

---

### Alternative C : Form wizard (REJETÉE)

**Proposition** : Wizard étape par étape

**Avantages** :
- Guidé
- Progressif

**Inconvénients décisifs** :
- ❌ Pas de vue d'ensemble
- ❌ Navigation linéaire forcée
- ❌ Édition rapide impossible

**Verdict** : Rejeté

---

## Implémentation

### Migration SQL (ordre 15 pour preprocessing)

```sql
UPDATE level0_chartes
SET definition = jsonb_set(
  definition,
  '{prompt_structure}',
  '{
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
    "preprocessing_instructions": {
      "content": "Ignorez les marqueurs de transcription suivants dans le verbatim : [AP], [T], (???), ainsi que tout code ou timestamp.",
      "enabled": true,
      "order": 15
    },
    "context_template": {
      "content": "CONTEXTE:\nTour -1: {{prev1_verbatim}}\nTour 0: {{conseiller_verbatim}}\nTour +1: {{client_verbatim}}\nTour +2: {{next1_verbatim}}",
      "enabled": true,
      "order": 40
    },
    "output_format": {
      "content": "Répondez uniquement avec la catégorie.",
      "enabled": true,
      "order": 90
    }
  }'::jsonb
)
WHERE definition->'prompt_structure' IS NULL;
```

### Composants

```
ChartePromptEditor (parent)
├── PromptSectionCard (répété pour chaque section)
│   ├── Mode lecture (défaut)
│   └── Mode édition (au clic)
├── AddSectionMenu (pour sections optionnelles)
└── SaveButton (versioning auto)
```

### Service PromptBuilder

```typescript
class PromptBuilder {
  static buildPrompt(charte, context) {
    const sections = [];
    
    // Ajouter sections enabled triées par order
    Object.entries(charte.definition.prompt_structure)
      .filter(([_, s]) => s.enabled)
      .sort(([_, a], [__, b]) => a.order - b.order)
      .forEach(([key, section]) => {
        sections.push(processTemplate(section.content, context));
      });
    
    // Générer definitions (order 30, toujours présent)
    sections.splice(
      sections.findIndex(s => s.order > 30),
      0,
      buildDefinitions(charte.definition.categories)
    );
    
    return sections.join('\n\n');
  }
}
```

---

## Validation

### Critères de succès

1. ✅ **Utilisateur voit prompt complet** en une vue
2. ✅ **Édition rapide** (clic → edit → save < 10s)
3. ✅ **Extensibilité** : Ajouter section < 5min
4. ✅ **Synergie tuning** : Suggestions contextuelles actionnables
5. ✅ **Versioning auto** : Chaque sauvegarde crée nouvelle version

### Tests prévus

1. **Test A/B preprocessing** : Avec/sans preprocessing_instructions sur 100 paires
   - Mesure : Kappa, accuracy, confusion matrix
   
2. **Test extensibilité** : Ajouter section "Domain Knowledge"
   - Temps : < 5min
   - Impact : Mesurer changement Kappa

3. **Test workflow tuning** : 
   - Suggestion générée → Appliquée → Nouvelle version
   - Mesure : Amélioration Kappa

---

## Notes

### Lien avec thèse Thomas

**Hypothèse H0-extension** : Description riche (zero-shot) > Exemples (few-shot)

**Cette architecture permet de tester :**
- Charte A : Minimaliste (task + definitions + output)
- Charte B : Enrichie (+ constraints + fallback)
- Charte C : Reasoning (+ reasoning_instructions)

**Mesure impact** de chaque section sur reproductibilité LLM.

### Évolutions futures

1. **Templates pré-définis** : "Minimaliste", "Enrichie", "Reasoning"
2. **Export/import** : Partager chartes entre projets
3. **Variables personnalisées** : `{{custom_variable}}`
4. **Conditional sections** : "Si X alors afficher section Y"

---

## Références

- **Inspiration** : Google Docs (édition inline)
- **Source problème preprocessing** : Observation Thomas (artefacts transcription)
- **Lien** : ADR 006 (Gestion exemples chartes)
- **Code** : SPEC_EDITEUR_PROMPT_INLINE.md

---

**Décision finale** : Architecture éditeur prompt inline WYSIWYG structuré avec 13 sections extensibles, dont preprocessing_instructions pour gérer artefacts transcription.

**Implémentation** : Sprint 5 - Session 5 (estimé 4h)
