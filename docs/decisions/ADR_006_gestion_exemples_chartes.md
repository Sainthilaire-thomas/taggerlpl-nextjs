# ADR 006 - Gestion des Exemples dans les Chartes Level 0

**Date** : 2025-12-21  
**Statut** : Proposition  
**Contexte** : Sprint 5 - Session 4 - Création CharteCategoriesEditor

---

## Contexte

Lors de la création de l'éditeur de catégories, une question fondamentale a émergé concernant l'utilisation des exemples dans les chartes d'annotation LLM.

## Observation Critique

**Risque identifié** : Les exemples peuvent transformer le LLM en simple "regex sémantique"
- Le LLM matche des patterns au lieu de comprendre le concept
- Perte de l'avantage principal : compréhension contextuelle profonde
- Réduction de la généralisation à des situations non-vues

**Avantage réel du LLM** : Capacité à comprendre via description conceptuelle riche
- Compréhension sémantique vs matching syntaxique
- Adaptation au contexte conversationnel
- Généralisation au-delà des exemples littéraux

## Décision Proposée

### Option 1 : Mode "Zero-shot riche" (À implémenter)

Permettre de désactiver les exemples pour tester :
```typescript
interface CharteRules {
  approach: 'few_shot' | 'zero_shot' | 'zero_shot_rich';
  context_included: boolean;
  examples_per_category: number; // 0 si zero_shot
  focus_on_description: boolean; // Nouveau paramètre
}
```

### Option 2 : Toggle par catégorie

Certaines catégories bénéficient des exemples (tags concrets), d'autres non (concepts abstraits) :
```typescript
interface Category {
  description: string;
  examples: string[];
  use_examples_in_prompt: boolean; // ← Nouveau flag
  description_weight: 'high' | 'medium' | 'low';
}
```

## Implications pour la Recherche

### Hypothèse à tester (H0-extension)
```
H0-ext: Pour catégories conceptuelles/contextuelles,
        Description riche (zero-shot) > Exemples multiples (few-shot)
        
Mesure: Kappa, Accuracy, Confusion inter-catégories
```

### Comparaison prévue

| Approche | Description | Exemples | Use Case |
|----------|-------------|----------|----------|
| **Few-shot classique** | Courte | 3-5 exemples | Tags concrets (mots-clés) |
| **Zero-shot riche** | Très détaillée + contre-exemples | 0 | Nuances conceptuelles |
| **Hybride** | Équilibrée | 1-2 exemples typiques | Balance guidance/flexibilité |

## Actions Futures

### MVP (avant fin Sprint 5)
- [ ] Documenter cette réflexion ✅ (ce fichier)
- [ ] Ajouter commentaire dans CharteDefinition types

### Post-MVP (Sprint 6 ?)
- [ ] Ajouter toggle `use_examples` dans CharteRulesEditor
- [ ] Implémenter mode `zero_shot_rich` dans prompt template
- [ ] Tester empiriquement : CharteY_Zero_v1.0.0 vs CharteY_FewShot_v1.0.0
- [ ] Analyser résultats Kappa par approche

## Références

- **Source** : Discussion Session 4 - Implémentation CharteCategoriesEditor
- **Auteur** : Thomas (observation terrain)
- **Lien thèse** : Chapitre méthodologie - Optimisation chartes Level 0

---

**Note** : Cette décision reflète une compréhension profonde des limites du few-shot learning avec LLM pour tâches nécessitant compréhension conceptuelle vs matching de surface.
