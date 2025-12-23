# 🎨 SPEC - ÉDITEUR PROMPT INLINE AVEC ZONES ÉDITABLES

**Date** : 2025-12-21  
**Auteur** : Thomas  
**Innovation** : Édition inline + synergie tuning + extensibilité

---

## 💡 CONCEPT PRINCIPAL

### Approche : "WYSIWYG structuré"

**Une seule vue verticale** qui affiche le prompt tel qu'il sera envoyé au LLM, avec **zones éditables au clic**.

```
┌─────────────────────────────────────────────────────────┐
│  Tab "PROMPT"                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ PROMPT FINAL ────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [System Instructions]                        ║ │ │ ← Clic → Édition
│  │  ║ Vous êtes un expert en analyse              ║ │ │
│  │  ║ conversationnelle...                        ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Task Description]                           ║ │ │ ← Clic → Édition
│  │  ║ Classifiez la réaction du client selon      ║ │ │
│  │  ║ la charte suivante.                         ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Definitions]                                ║ │ │ ← AUTO-GÉNÉRÉ
│  │  ║ - CLIENT_POSITIF : Accord (ex: "oui")       ║ │ │   depuis categories
│  │  ║ - CLIENT_NEGATIF : Désaccord                ║ │ │
│  │  ║ - CLIENT_NEUTRE : Neutre                    ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │     ↳ [Éditer catégories] → Ouvre accordion       │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Context] (si rules.context_included=true)  ║ │ │ ← Clic → Édition
│  │  ║ Tour -1 (app): {{prev1_verbatim}}           ║ │ │   template
│  │  ║ Tour  0 (tc):  {{conseiller_verbatim}}      ║ │ │
│  │  ║ ...                                         ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Output Format]                             ║ │ │ ← Clic → Édition
│  │  ║ Répondez uniquement avec la catégorie.      ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Constraints] (optionnel)                   ║ │ │ ← Clic → Édition
│  │  ║ Ne retournez JAMAIS de justification.       ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  │  ╔══════════════════════════════════════════════╗ │ │
│  │  ║ [Fallback Instructions] (optionnel)         ║ │ │ ← Clic → Édition
│  │  ║ Si incertain, choisir CLIENT_NEUTRE.        ║ │ │
│  │  ╚══════════════════════════════════════════════╝ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│                                    [💾 Sauvegarder]     │
└─────────────────────────────────────────────────────────┘
```

**Avantages :**
- ✅ **Pas de scroll** : Sections collapsibles si trop long
- ✅ **WYSIWYG** : Voir exactement le prompt final
- ✅ **Édition intuitive** : Clic → édition inline
- ✅ **Labels discrets** : Nature de chaque section visible mais non intrusive
- ✅ **Extensible** : Facile d'ajouter nouvelles sections

---

## 🧩 SECTIONS DU PROMPT (EXHAUSTIF)

### Sections principales (toujours présentes)

| Section | Description | Éditable | Requis |
|---------|-------------|----------|--------|
| **Task Description** | Description de la tâche d'annotation | ✅ Oui | ✅ Oui |
| **Definitions** | Catégories avec descriptions + exemples | ✅ Oui (via accordion) | ✅ Oui |
| **Output Format** | Format de sortie attendu | ✅ Oui | ✅ Oui |

### Sections optionnelles

| Section | Description | Éditable | Défaut |
|---------|-------------|----------|--------|
| **System Instructions** | Rôle, persona, expertise du LLM | ✅ Oui | ❌ Vide |
| **Context Template** | Template du contexte conversationnel | ✅ Oui | ✅ Standard |
| **Examples** | Exemples few-shot complets (si besoin d'exemples au-delà des catégories) | ✅ Oui | ❌ Vide |
| **Constraints** | Règles strictes à respecter | ✅ Oui | ❌ Vide |
| **Reasoning Instructions** | Guide le raisonnement (chain-of-thought, etc.) | ✅ Oui | ❌ Vide |
| **Warnings** | Ce qu'il NE FAUT PAS faire | ✅ Oui | ❌ Vide |
| **Fallback Instructions** | Que faire en cas d'incertitude | ✅ Oui | ❌ Vide |
| **Quality Criteria** | Critères de qualité de l'annotation | ✅ Oui | ❌ Vide |
| **Edge Cases** | Gestion des cas limites | ✅ Oui | ❌ Vide |

---

## 🗄️ STRUCTURE DONNÉES (EXTENSIBLE)

### JSON `definition.prompt_structure`

```json
{
  "definition": {
    "prompt_structure": {
      // ===== SECTIONS PRINCIPALES =====
      "task_description": {
        "content": "Classifiez la réaction du client selon la charte suivante.",
        "enabled": true,
        "order": 10
      },
      
      "output_format": {
        "content": "Répondez uniquement avec la catégorie (CLIENT_POSITIF, CLIENT_NEGATIF, ou CLIENT_NEUTRE).",
        "enabled": true,
        "order": 90
      },
      
      // ===== SECTIONS OPTIONNELLES =====
      "system_instructions": {
        "content": "",
        "enabled": false,
        "order": 1
      },
      
      "context_template": {
        "content": "CONTEXTE:\nTour -1 ({{prev1_speaker}}): {{prev1_verbatim}}\nTour 0 (conseiller): {{conseiller_verbatim}}\nTour +1 (client): {{client_verbatim}} ← À CLASSIFIER\nTour +2 ({{next1_speaker}}): {{next1_verbatim}}",
        "enabled": true,  // Contrôlé par rules.context_included
        "order": 40
      },
      
      "constraints": {
        "content": "",
        "enabled": false,
        "order": 50
      },
      
      "reasoning_instructions": {
        "content": "",
        "enabled": false,
        "order": 60
      },
      
      "warnings": {
        "content": "",
        "enabled": false,
        "order": 70
      },
      
      "fallback_instructions": {
        "content": "",
        "enabled": false,
        "order": 80
      },
      
      "quality_criteria": {
        "content": "",
        "enabled": false,
        "order": 65
      },
      
      "edge_cases": {
        "content": "",
        "enabled": false,
        "order": 75
      },
      
      "examples": {
        "content": "",
        "enabled": false,
        "order": 35
      }
    },
    
    "categories": {
      // Généré automatiquement dans le prompt à l'order 30
      "CLIENT_NEUTRE": { ... },
      "CLIENT_POSITIF": { ... },
      "CLIENT_NEGATIF": { ... }
    },
    
    "rules": { ... },
    "llm_params": { ... },
    "aliases": { ... }
  }
}
```

**Propriétés de chaque section :**
- `content` : Texte de la section
- `enabled` : Visible dans le prompt final ?
- `order` : Ordre d'apparition (10, 20, 30...)

---

## 🎨 INTERFACE UTILISATEUR

### Composant principal : `ChartePromptEditor`

```typescript
interface PromptSection {
  key: string;                    // 'task_description', 'system_instructions', etc.
  label: string;                  // "Task Description", "System Instructions", etc.
  content: string;                // Texte de la section
  enabled: boolean;               // Affiché dans prompt final ?
  order: number;                  // Ordre d'apparition
  editable: boolean;              // Éditable ? (definitions = false, édité via accordion)
  placeholder?: string;           // Placeholder si vide
  helpText?: string;              // Aide contextuelle
}

const ChartePromptEditor = ({ charte, onSave }) => {
  const [sections, setSections] = useState<PromptSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // Initialiser sections depuis charte.definition.prompt_structure
  useEffect(() => {
    const sections = buildSectionsFromDefinition(charte.definition);
    setSections(sections.sort((a, b) => a.order - b.order));
  }, [charte]);
  
  return (
    <Box>
      {/* Liste des sections dans l'ordre */}
      {sections.map(section => (
        <PromptSectionCard
          key={section.key}
          section={section}
          isEditing={editingSection === section.key}
          onEdit={() => setEditingSection(section.key)}
          onSave={(newContent) => handleSectionSave(section.key, newContent)}
          onCancel={() => setEditingSection(null)}
        />
      ))}
      
      {/* Bouton ajouter section (optionnelles désactivées) */}
      <AddSectionMenu 
        availableSections={getDisabledSections()}
        onAdd={(sectionKey) => handleEnableSection(sectionKey)}
      />
      
      {/* Bouton sauvegarder global */}
      <Button onClick={handleSaveAll}>Sauvegarder</Button>
    </Box>
  );
};
```

---

### Composant : `PromptSectionCard`

```typescript
const PromptSectionCard = ({ section, isEditing, onEdit, onSave, onCancel }) => {
  const [tempContent, setTempContent] = useState(section.content);
  
  if (isEditing) {
    return (
      <Card sx={{ mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          {/* Label avec indicateur édition */}
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="primary">
              {section.label} (édition en cours)
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={() => onSave(tempContent)}>
                <SaveIcon />
              </IconButton>
              <IconButton size="small" onClick={onCancel}>
                <CancelIcon />
              </IconButton>
            </Stack>
          </Stack>
          
          {/* Zone d'édition */}
          <TextField
            value={tempContent}
            onChange={(e) => setTempContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
            autoFocus
            placeholder={section.placeholder}
            helperText={section.helpText}
          />
        </CardContent>
      </Card>
    );
  }
  
  // Mode lecture (défaut)
  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: section.editable ? 'pointer' : 'default',
        '&:hover': section.editable ? { bgcolor: 'action.hover' } : {}
      }}
      onClick={section.editable ? onEdit : undefined}
    >
      <CardContent>
        {/* Label discret */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="caption" color="text.secondary">
            [{section.label}]
          </Typography>
          {!section.enabled && (
            <Chip label="Désactivé" size="small" color="default" />
          )}
        </Stack>
        
        {/* Contenu */}
        {section.content ? (
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              bgcolor: 'grey.50',
              p: 1,
              borderRadius: 1
            }}
          >
            {section.content}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            {section.placeholder || "Vide - Cliquez pour ajouter"}
          </Typography>
        )}
        
        {/* Aide contextuelle */}
        {section.helpText && (
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="caption">{section.helpText}</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 🔗 SYNERGIE AVEC TUNING (INNOVATION MAJEURE)

### Tab "TUNING" enrichi

**Afficher suggestions À CÔTÉ des sections éditables**

```
┌─────────────────────────────────────────────────────────┐
│  Tab "TUNING"                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Section: TASK DESCRIPTION ──────────────────────┐  │
│  │                                                   │  │
│  │  ┌─ Contenu actuel ──────────┐  ┌─ Suggestion ─┐│  │
│  │  │ Classifiez la réaction    │  │ 💡 Clarifier │││  │
│  │  │ du client selon la        │  │ Ajouter :   │││  │
│  │  │ charte suivante.          │  │ "selon son  │││  │
│  │  └───────────────────────────┘  │ niveau de   │││  │
│  │                                  │ satisfaction│││  │
│  │                                  │ exprimé"    │││  │
│  │                                  │             │││  │
│  │                                  │ [Appliquer] │││  │
│  │                                  │ [Éditer]    │││  │
│  │                                  └─────────────┘│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Catégorie: CLIENT_NEUTRE ───────────────────────┐  │
│  │                                                   │  │
│  │  ┌─ Description actuelle ────┐  ┌─ Suggestion ─┐│  │
│  │  │ Le client donne une       │  │ 💡 Clarifier │││  │
│  │  │ réponse neutre ou         │  │ Ajouter :   │││  │
│  │  │ ambiguë                   │  │ "Distinguer │││  │
│  │  └───────────────────────────┘  │ CLIENT_NEUTRE│││  │
│  │                                  │ vs CLIENT_  │││  │
│  │                                  │ POSITIF sur │││  │
│  │                                  │ réponses    │││  │
│  │                                  │ affirmatives│││  │
│  │                                  │ courtes"    │││  │
│  │                                  │             │││  │
│  │                                  │ [Appliquer] │││  │
│  │                                  │ [Éditer]    │││  │
│  │                                  └─────────────┘│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Workflow :**
1. **Suggestions générées** (analyse désaccords)
2. **Affichage côte-à-côte** : Section actuelle | Suggestion
3. **Actions disponibles** :
   - **Appliquer** : Remplace automatiquement
   - **Éditer** : Ouvre éditeur inline avec suggestion pré-remplie
   - **Rejeter** : Marque suggestion comme non pertinente

---

## 🔧 SERVICE : PromptBuilder (mis à jour)

```typescript
class PromptBuilder {
  /**
   * Construit le prompt final à partir de la structure
   */
  static buildPrompt(
    charte: CharteDefinition, 
    context?: {
      client_verbatim: string;
      conseiller_verbatim: string;
      prev1_verbatim?: string;
      prev1_speaker?: string;
      next1_verbatim?: string;
      next1_speaker?: string;
    }
  ): string {
    const sections: Array<{ order: number, content: string }> = [];
    const def = charte.definition;
    
    // 1. Ajouter sections depuis prompt_structure (si enabled)
    Object.entries(def.prompt_structure || {}).forEach(([key, section]: [string, any]) => {
      if (section.enabled && section.content) {
        sections.push({
          order: section.order,
          content: this.processTemplate(section.content, context)
        });
      }
    });
    
    // 2. Générer section Definitions (toujours présente, order 30)
    const definitionsContent = this.buildDefinitionsSection(
      def.categories,
      def.rules.approach,
      def.rules.examples_per_category
    );
    sections.push({ order: 30, content: definitionsContent });
    
    // 3. Trier par order et assembler
    sections.sort((a, b) => a.order - b.order);
    return sections.map(s => s.content).join('\n\n');
  }
  
  /**
   * Remplace variables dans template
   */
  private static processTemplate(template: string, context?: any): string {
    if (!context) return template;
    
    return template
      .replace(/\{\{client_verbatim\}\}/g, context.client_verbatim || '{{client_verbatim}}')
      .replace(/\{\{conseiller_verbatim\}\}/g, context.conseiller_verbatim || '{{conseiller_verbatim}}')
      .replace(/\{\{prev1_verbatim\}\}/g, context.prev1_verbatim || '{{prev1_verbatim}}')
      .replace(/\{\{prev1_speaker\}\}/g, context.prev1_speaker || '{{prev1_speaker}}')
      .replace(/\{\{next1_verbatim\}\}/g, context.next1_verbatim || '{{next1_verbatim}}')
      .replace(/\{\{next1_speaker\}\}/g, context.next1_speaker || '{{next1_speaker}}');
  }
  
  /**
   * Construit section definitions depuis categories
   */
  private static buildDefinitionsSection(
    categories: any,
    approach: 'few_shot' | 'zero_shot',
    examplesPerCategory: number
  ): string {
    let content = "Définitions :\n";
    
    Object.entries(categories).forEach(([name, cat]: [string, any]) => {
      content += `- ${name} : ${cat.description}`;
      
      if (approach === 'few_shot' && cat.examples && cat.examples.length > 0) {
        const examples = cat.examples.slice(0, examplesPerCategory);
        content += ` (ex: "${examples.join('", "')}")`;
      }
      
      content += "\n";
    });
    
    return content;
  }
}
```

---

## 📝 MIGRATION DONNÉES

### SQL : Initialiser prompt_structure

```sql
-- Ajouter prompt_structure avec TOUTES les sections (enabled=false par défaut)
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
    "examples": {
      "content": "",
      "enabled": false,
      "order": 35
    },
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
    "reasoning_instructions": {
      "content": "",
      "enabled": false,
      "order": 60
    },
    "quality_criteria": {
      "content": "",
      "enabled": false,
      "order": 65
    },
    "warnings": {
      "content": "",
      "enabled": false,
      "order": 70
    },
    "edge_cases": {
      "content": "",
      "enabled": false,
      "order": 75
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
  }'::jsonb
)
WHERE definition->'prompt_structure' IS NULL;
```

---

## 🎯 AVANTAGES DE CETTE APPROCHE

### 1. Ergonomie
- ✅ **Pas de scroll** : Vue linéaire du prompt
- ✅ **WYSIWYG** : Voir exactement ce que le LLM verra
- ✅ **Édition intuitive** : Clic → édition, comme Google Docs
- ✅ **Labels discrets** : [Section] en caption, non intrusif

### 2. Extensibilité
- ✅ **Facile d'ajouter sections** : Nouveau champ dans JSON + UI auto-générée
- ✅ **Order flexible** : Réorganiser sections facilement
- ✅ **Enable/disable** : Activer/désactiver sections sans les supprimer

### 3. Synergie Tuning
- ✅ **Suggestions contextuelles** : Affichées en regard de chaque section
- ✅ **Workflow clair** : Voir suggestion → Appliquer OU Éditer manuellement
- ✅ **Traçabilité** : Savoir quelle suggestion a modifié quelle section

### 4. Maintenabilité
- ✅ **Structure JSON claire** : Chaque section = objet {content, enabled, order}
- ✅ **Service centralisé** : PromptBuilder construit prompt depuis structure
- ✅ **Validation simple** : Vérifier sections requises enabled

---

## 📊 PLAN D'IMPLÉMENTATION

### Phase 1 : Infrastructure (2h)
- [ ] Créer `PromptSectionCard` (composant édition inline)
- [ ] Créer `ChartePromptEditor` (composant parent)
- [ ] Migration SQL (ajouter prompt_structure avec toutes sections)
- [ ] Service `PromptBuilder.buildPrompt()` mis à jour

### Phase 2 : UI (1h30)
- [ ] Intégrer dans CharteManager (remplacer tab "Catégories")
- [ ] Bouton "Ajouter section" (menu sections optionnelles)
- [ ] Accordion catégories (édition descriptions + exemples)
- [ ] Tests UI (édition, sauvegarde, preview)

### Phase 3 : Tuning Synergie (1h)
- [ ] Modifier CharteTuningPanel (affichage côte-à-côté)
- [ ] Boutons Appliquer/Éditer suggestions
- [ ] Traçabilité (quelle suggestion → quelle section)

### Phase 4 : Tests (30min)
- [ ] Test création nouvelle version
- [ ] Test génération prompt avec sections
- [ ] Test workflow suggestion → application

---

## 🚀 EXEMPLE CONCRET

### Charte avec sections étendues

```json
{
  "prompt_structure": {
    "system_instructions": {
      "content": "Vous êtes un expert en analyse conversationnelle spécialisé dans les interactions client-conseiller.",
      "enabled": true,
      "order": 1
    },
    "task_description": {
      "content": "Classifiez la réaction du client selon la charte suivante, en tenant compte du contexte conversationnel.",
      "enabled": true,
      "order": 10
    },
    "constraints": {
      "content": "- Basez-vous UNIQUEMENT sur le verbatim du client\n- Ne faites PAS d'inférences sur les intentions non exprimées",
      "enabled": true,
      "order": 50
    },
    "fallback_instructions": {
      "content": "En cas de doute entre CLIENT_NEUTRE et CLIENT_POSITIF, privilégiez CLIENT_NEUTRE.",
      "enabled": true,
      "order": 80
    },
    "output_format": {
      "content": "Répondez UNIQUEMENT avec la catégorie, sans justification.",
      "enabled": true,
      "order": 90
    }
  }
}
```

**Prompt généré :**

```
Vous êtes un expert en analyse conversationnelle spécialisé dans les interactions client-conseiller.

Classifiez la réaction du client selon la charte suivante, en tenant compte du contexte conversationnel.

Définitions :
- CLIENT_POSITIF : Le client exprime un accord ou une satisfaction (ex: "oui", "d'accord", "merci")
- CLIENT_NEGATIF : Le client exprime un désaccord ou une insatisfaction (ex: "non", "mais", "pas normal")
- CLIENT_NEUTRE : Le client donne une réponse neutre ou ambiguë (ex: "hm", "mh", "mmh")

CONTEXTE:
Tour -1 (app): "parce que chez moi... enfin quand ça sera fait quoi"
Tour 0 (conseiller): "je vais prendre... d'accord je peux vous contacter..."
Tour +1 (client): "oui tout à fait ouais si c'est possible" ← À CLASSIFIER
Tour +2 (tc): "d'accord donc (téléphone)"

- Basez-vous UNIQUEMENT sur le verbatim du client
- Ne faites PAS d'inférences sur les intentions non exprimées

En cas de doute entre CLIENT_NEUTRE et CLIENT_POSITIF, privilégiez CLIENT_NEUTRE.

Répondez UNIQUEMENT avec la catégorie, sans justification.
```

---

## ✅ VALIDATION ARCHITECTURE

**Cette approche résout :**
- ✅ Pas de scroll (sections collapsibles si besoin)
- ✅ Vue d'ensemble immédiate
- ✅ Édition intuitive (clic = édition)
- ✅ Extensibilité (facile d'ajouter sections)
- ✅ Synergie tuning (suggestions côte-à-côte)
- ✅ Structure JSON propre et maintenable

**Prêt pour implémentation !** 🚀
