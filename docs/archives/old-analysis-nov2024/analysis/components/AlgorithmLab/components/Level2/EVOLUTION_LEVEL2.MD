# Roadmap d'évolutions – AlgorithmLab Level2 (Validation scientifique H1) - MISE À JOUR

## État actuel (réalisé) ✅

### Architecture existante fonctionnelle

L'architecture de Level2 est maintenant stabilisée autour de composants factorisés :

- **`Level2Interface.tsx`** : composant orchestrateur principal avec onglets
- **`StatisticalSummary.tsx`** : synthèse académique complète (branché sur résultats réels)
- **`StatisticalTestsPanel.tsx`** : détails techniques des tests statistiques
- **`shared/stats.ts`** : moteur de calculs statistiques robuste

### Filtrage et normalisation robustes ✅

- Filtrage inspiré de `useLevel1Testing` avec validation stricte
- Normalisation cohérente des tags conseiller (familles) et client
- Extraction via fonctions dédiées (`extractConseillerStrategy`, `extractClientReaction`)
- Logs de débogage pour traçabilité

### Moteur statistique réel ✅

- Chi-carré d'indépendance avec p-values calculées (approximation Abramowitz-Stegun)
- Tests Fisher pairwise avec odds ratios
- ANOVA sur proportions (indicative)
- V de Cramér pour taille d'effet
- Suppression de toutes les valeurs "mockées"

### Interface utilisateur mature ✅

- Onglets structurés : Aperçu H1 → Données → Tests → Rapport
- Tableaux avec codes couleurs selon seuils
- Badges de validation dynamiques
- Composants factorisés et réutilisables

---

## Plan d'exécution restant (ordre recommandé)

### 1) Critères H1 complets - ajouter le volet "négatif" (critique)

**Status : PARTIELLEMENT FAIT**

- ✅ Seuils positifs implémentés (Actions > 50%, Explications < 5%)
- ❌ Seuils négatifs manquants (Actions < 25% négatif, Explications > 80% négatif)

**Actions restantes :**

- Compléter `summarizeH1()` avec critères négatifs
- Ajouter paramétrage via `config/hypotheses.ts`
- Mettre à jour le score de validation global

**Acceptation :**

- Le verdict H1 tient compte de ≥ 3 critères sur 5 (2 positifs + 2 négatifs + écart)

---

### 2) Gestion REFLET granulaire (amélioration UX)

**Status : NON COMMENCÉ**

**Actions :**

- Toggle UI "Détailler REFLET" dans `Level2Interface`
- Logique d'agrégation/désagrégation dans `computeH1Analysis`
- Exclure REFLET des critères décisifs H1 (exploration uniquement)

**Acceptation :**

- Mode OFF : REFLET agrégé (défaut pour H1)
- Mode ON : REFLET_VOUS/JE/ACQ séparés (exploration)

---

### 3) Garde-fous sur la taille d'échantillon (robustesse)

**Status : NON COMMENCÉ**

**Actions :**

- Seuils `minNPerGroup` (30) et `minNTotal` (150) configurables
- Messages d'avertissement si seuils non atteints
- Forcer statut `PARTIALLY_VALIDATED` sur petits échantillons

**Acceptation :**

- Bandeau d'alerte visible si N insuffisant
- Statut automatiquement dégradé

---

### 4) Run history & reproductibilité (traçabilité)

**Status : NON COMMENCÉ**

**Architecture à créer :**

```
components/RunHistory/
├── RunList.tsx           # Liste des runs précédents
├── RunComparison.tsx     # Comparaison entre runs
└── types.ts             # Types pour run history
```

**Actions :**

- Créer table Supabase `algorithmlab_runs`
- Composant `RunList` avec historique des validations
- Boutons "Relancer" et "Comparer"
- Signature de dataset pour détecter les changements

**Acceptation :**

- Reproductibilité exacte des résultats précédents
- Comparaisons visuelles entre runs

---

### 5) Export & auditabilité (facilitation)

**Status : NON COMMENCÉ**

**Actions :**

- Fonctions d'export CSV/JSON dans `shared/export.ts`
- Boutons d'export dans chaque onglet
- Métadonnées complètes (timestamp, version, signature)

**Acceptation :**

- Export des données brutes, agrégats et résultats stats
- Fichiers prêts pour annexes de thèse

---

### 6) Performance & robustesse (optimisation)

**Status : PARTIELLEMENT FAIT**

- ✅ Mémoïsation basique avec `useMemo`
- ❌ Web Workers pour gros volumes
- ❌ Guard clauses systématiques

**Actions restantes :**

- Web Worker `stats.worker.ts` si N > 1000
- Protection divisions par zéro dans tous les calculs
- Optimisation des re-renders

---

### 7) Configuration centralisée (maintenabilité)

**Status : NON COMMENCÉ**

**Structure à créer :**

```
config/
├── hypotheses.ts        # Seuils H1 paramétrables
├── validation.ts        # Critères de validation
└── display.ts          # Options d'affichage
```

**Actions :**

- Externaliser toutes les "magic numbers"
- Types TypeScript stricts (`H1Criteria`, `ValidationThresholds`)
- Interface d'admin pour ajuster les seuils

---

## Découpage en PRs actualisé

### PR restantes prioritaires

1. **PR1 – Critères H1 complets** (négatifs + config)
   - Seuils négatifs dans `summarizeH1`
   - Fichier `config/hypotheses.ts`
   - Score de validation étendu
2. **PR2 – Garde-fous N + REFLET toggle**
   - Messages d'avertissement taille échantillon
   - Mode exploration REFLET détaillé
   - UX améliorée
3. **PR3 – Run history (modèle + UI basique)**
   - Table Supabase `algorithmlab_runs`
   - Composant `RunList` minimal
   - Reproductibilité des résultats
4. **PR4 – Export + performance**
   - Fonctions d'export CSV/JSON
   - Web Worker pour gros volumes
   - Guard clauses robustes
5. **PR5 – Configuration + nettoyage final**
   - Config centralisée
   - Types TypeScript stricts
   - Documentation développeur

---

## Checklist mise à jour

### Réalisé ✅

- [x] Normalisation robuste des tags
- [x] Filtrage strict des paires adjacentes
- [x] Moteur χ² + V + Fisher (calculs réels)
- [x] `StatisticalSummary` branché sur résultats dynamiques
- [x] Architecture de composants factorisés
- [x] Interface onglets avec codes couleurs
- [x] Logging et traçabilité de base

### À réaliser ❌

- [ ] Seuils H1 complets (positif + négatif + écart)
- [ ] Toggle REFLET détaillé/agrégé
- [ ] Garde-fous N et messages UX
- [ ] Run history (table + enregistrement + liste)
- [ ] Export des données & résultats
- [ ] Web Worker pour performance
- [ ] Configuration centralisée
- [ ] Types TypeScript complets
- [ ] Documentation pipeline

---

## Notes d'implémentation spécifiques

### Architecture des composants validée

```typescript
Level2Interface (orchestrateur)
├── shared/stats.ts (moteur de calculs)
├── validation/StatisticalSummary.tsx (rapport académique)
├── validation/StatisticalTestsPanel.tsx (détails techniques)
└── [futurs] RunHistory/RunList.tsx (historique)
```

### Calculs statistiques opérationnels

- **Chi-carré** : implémentation Abramowitz-Stegun pour p-values
- **Fisher exact** : approximation Wald pour 2×2 pairwise
- **V de Cramér** : `sqrt(χ² / (N * min(r-1, c-1)))`
- **Intervalles de confiance** : Wilson recommandé (à implémenter)

### Données exploitées (confirmé)

- **Conseiller** : extraction via `t.tag` ou `t.agent_tags[0]` → famille
- **Client** : normalisation `t.next_turn_tag` ou `t.client_tags[0]` → POSITIF/NEGATIF/NEUTRE
- **Paires adjacentes** : `verbatim` + `next_turn_verbatim` obligatoires

---

## Impact de la refactorisation

### Bénéfices obtenus

- **Maintenabilité** : logique séparée en modules cohérents
- **Testabilité** : fonctions pures dans `shared/stats.ts`
- **Réutilisabilité** : composants `StatisticalSummary` et `StatisticalTestsPanel`
- **Évolutivité** : architecture prête pour extensions (run history, export)

### Points d'attention

- **Cohérence des résultats** : vérifier que les refactorisations n'ont pas introduit de régressions
- **Performance** : surveiller les recalculs avec gros corpus
- **UX** : maintenir la fluidité malgré la complexité croissante

---

## Priorités développement

1. **Court terme** (1-2 semaines) : critères H1 complets + garde-fous N
2. **Moyen terme** (3-4 semaines) : run history + export de base
3. **Long terme** (1-2 mois) : configuration avancée + optimisations

Cette roadmap actualisée reflète l'état mature du code existant tout en maintenant une trajectoire claire vers une solution complète et robuste pour la validation académique de l'hypothèse H1.
