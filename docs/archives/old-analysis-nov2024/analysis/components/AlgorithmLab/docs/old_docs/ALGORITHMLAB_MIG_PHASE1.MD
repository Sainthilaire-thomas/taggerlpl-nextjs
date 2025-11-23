# AlgorithmLab – Migration Level 1 (Phase 1)

Objectif : factoriser l’UI de validation **par variable** (X, Y, M1, M2, M3) autour de briques communes ( _ClassifierSelector_ , _RunPanel_ , _MetricsPanel_ , _ResultsPanel_ ), et brancher ces briques dans chaque interface.

---

## Arborescence de référence (condensée)

<pre class="overflow-visible!" data-start="637" data-end="3003"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-txt"><span><span>src/app/(protected)/analysis/components/AlgorithmLab/
│
├─ algorithms/
│  └─ level1/
│     ├─ XAlgorithms/ ... (X classifiers)
│     ├─ YAlgorithms/ ... (Y classifiers)
│     ├─ M1Algorithms/ ... (calculateurs M1)
│     ├─ M2Algorithms/ ... (calculateurs M2)
│     ├─ M3Algorithms/ ... (calculateurs M3)
│     └─ shared/
│        ├─ BaseClassifier.ts
│        ├─ ClassifierRegistry.ts
│        ├─ initializeClassifiers.ts
│        └─ PerformanceMetrics.ts
│
├─ components/
│  ├─ shared/
│  │  ├─ ClassifierSelector.tsx
│  │  └─ results/
│  │     ├─ base/
│  │     │  ├─ RunPanel.tsx             ← UI partagée (déplacée)
│  │     │  ├─ MetricsPanel.tsx         ← UI partagée (déplacée)
│  │     │  └─ ResultsSample/
│  │     │     ├─ index.ts
│  │     │     ├─ ResultsPanel.tsx      ← UI partagée (déplacée)
│  │     │     ├─ ResultsSample.tsx
│  │     │     ├─ components/… (table, filtres, FT dialog…)
│  │     │     └─ hooks/, utils/…
│  │     └─ x/
│  │        └─ ResultsTableX.tsx (spécifique X si besoin)
│  │
│  └─ Level1/
│     ├─ Level1Interface.tsx            ← Onglets (X/Y/M1/M2/M3)
│     ├─ algorithms/
│     │  ├─ BaseAlgorithmTesting.tsx    ← Base générique (nouveau)
│     │  ├─ XClassifiers/
│     │  │  ├─ XAlgorithmTesting.tsx    ← X branché sur la base
│     │  │  └─ XValidationInterface.tsx ← Rend la base en “Validation technique”
│     │  ├─ YClassifiers/
│     │  │  └─ YValidationInterface.tsx ← À brancher sur la base
│     │  ├─ M1Calculators/
│     │  │  ├─ M1AlgorithmTesting.tsx   ← À refactor (optionnel)
│     │  │  └─ M1ValidationInterface.tsx
│     │  ├─ M2Calculators/
│     │  │  └─ M2ValidationInterface.tsx
│     │  └─ M3Calculators/
│     │     └─ M3ValidationInterface.tsx
│     └─ individual/
│        └─ TechnicalValidation/         ← Ancien module (à épurer)
│           ├─ TechnicalValidation.tsx
│           ├─ TECHNICALVALIDATION_MIG.MD
│           └─ (doublons à supprimer : ResultsSample copy.tsx, etc.)
│
├─ hooks/
│  ├─ useLevel1Testing.ts               ← Hook générique (base)
│  ├─ useClassifierStatus.ts            ← Statut/config classifieurs
│  └─ level1/
│     ├─ useXAlgorithmTesting.ts        ← Ancien hook X (optionnel)
│     ├─ useM1AlgorithmTesting.ts
│     └─ useM3AlgorithmTesting.ts
│
└─ types/
   ├─ ThesisVariables.ts (+ .x.ts, .y.ts, .m1.ts…)
   ├─ ValidationTypes.ts
   └─ SharedTypes.ts
</span></span></code></div></div></pre>

> Règle d’or :
>
> - `algorithms/…/shared` = **logique** (pas d’UI).
> - `components/…/shared/results/base` = **UI réutilisable** (RunPanel, Metrics, ResultsSample).
> - `components/Level1/algorithms/*` = **interfaces par variable** qui composent ces briques.

---

## Fait ✅

- **Extraction UI partagée** dans `components/Level1/shared/results/base/` :
  - `RunPanel.tsx`, `MetricsPanel.tsx`, `ResultsSample/*` (table, filtres, FT dialog, hooks, utils).
- **Base générique** `BaseAlgorithmTesting.tsx` créée :
  - Agrège `ClassifierSelector` + `RunPanel` + `MetricsPanel` + `ResultsPanel`.
  - Utilise `useLevel1Testing` et `useClassifierStatus`.
- **X branché** :
  - `XValidationInterface.tsx` rend `BaseAlgorithmTesting` (onglet “Validation technique”).
  - `XAlgorithmTesting.tsx` minimal, paramétré (`defaultClassifier="RegexConseillerClassifier"`).
- **Level1Interface** :
  - Onglet **X → Validation technique** affiche bien sélecteur d’algo + RunPanel + résultats.
- **Imports** consolidés (chemins relatifs vers `components/Level1/shared/results/base`).

---

## Reste à faire ⏭️

### 1) Y (Réactions client)

- [ ] Créer `components/Level1/algorithms/YClassifiers/YAlgorithmTesting.tsx` (copie de X, `variableLabel="Y — Réactions Client"`, `defaultClassifier` adapté).
- [ ] Mettre `YValidationInterface.tsx` à l’identique de X (rend `BaseAlgorithmTesting`).
- [ ] Vérifier que `useLevel1Testing` sait charger le **gold standard Y** (ou compléter la logique si besoin).

### 2) M1 / M2 / M3 (calculateurs)

- [ ] Option 1 (rapide) : conserver leurs interfaces actuelles.
- [ ] Option 2 (cohérence UI) : créer `M1AlgorithmTesting.tsx`, `M2AlgorithmTesting.tsx`, `M3AlgorithmTesting.tsx` basés sur `BaseAlgorithmTesting` (métriques adaptées si sortie non “classe”).
- [ ] Aligner `MetricsPanel` si les KPI diffèrent (ex. ratios, temps, marqueurs).

### 3) Matrice de confusion & Analyse d’erreurs

- [ ] Raccorder **ConfusionMatrix** à la source des résultats produits par `BaseAlgorithmTesting` (X/Y).
- [ ] Raccorder **EnhancedErrorAnalysis** (utiliser les mêmes `results` + filtres).
- [ ] Ajouter un bouton “Envoyer au Fine-Tuning” (ouvre le FT dialog avec les faux positifs/négatifs filtrés).

### 4) Nettoyage “TechnicalValidation” (legacy)

- [ ] Supprimer les **doublons** encore présents dans `components/Level1/individual/TechnicalValidation/`

  (`ResultsSample copy.tsx`, anciennes versions si non utilisées).

- [ ] Conserver uniquement la **doc** utile (TECHNICALVALIDATION_MIG.MD) ou la déplacer dans `/docs`.

### 5) Registre & nomenclature des classifieurs

- [ ] S’assurer que les noms affichés par `ClassifierSelector` correspondent à ceux déclarés dans `ClassifierRegistry`.
- [ ] Ajouter un `displayName` + `version` (si dispo) pour chaque algo (affichés en chips).

### 6) UX / Ergonomie

- [ ] Ajouter un **badge** “n échantillons applicables” (vient de `getRelevantCountFor`) à côté du slider.
- [ ] Conserver la **sélection d’un run précédent** (historique simple) pour comparer les résultats.
- [ ] Option : mémoriser le dernier classifieur choisi (localStorage).

---

## Prochaines étapes (plan de migration)

### Étape A — Généralisation complète X/Y

1. **Brancher Y** sur `BaseAlgorithmTesting`.
2. Harmoniser `useLevel1Testing` pour charger **X** ou **Y** selon l’interface courante (si pas déjà fait).
3. ConfusionMatrix & ErrorAnalysis alimentés directement par `results` de la base.

### Étape B — Cohérence M1/M2/M3

4. Décider si M1/M2/M3 se contentent de leur UI dédiée ou adoptent `BaseAlgorithmTesting`.
5. Si adoption : fournir un **MetricsPanel** secondaire (ex. “M1MetricsPanel”) si nécessaire.
6. Unifier les exports `index.ts` pour simplifier les imports.

### Étape C — Fine-Tuning & comparaisons

7. Intégrer un **workflow FT** : à partir de la table, sélection → “Envoyer au FT” → `FineTuningDialog`.
8. Ajouter un petit **historique de runs** (algo, date, échantillon, précision) pour recharger/Comparer.
9. Préparer un **Benchmark global** : tableau agrégé des meilleures perfs par variable.

### Étape D — Nettoyage & doc

10. Supprimer définitivement les **restes legacy** (fichiers non référencés).
11. Documenter les **chemins d’import “officiels”** (UI partagée vs logique).
12. Valider TS (types centralisés `/types`) et resserrer les options (`noImplicitAny`, etc.).

---

## Règles d’import (rappel)

- **Logique** (classifieurs, registres) → `algorithms/level1/*`.
- **UI réutilisable** → `components/Level1/shared/results/base/*`.
- **Interfaces par variable** → `components/Level1/algorithms/*`.
- **Hooks** transverses → `hooks/*`, spécifiques level1 → `hooks/level1/*`.
- **Types** → `types/*` (X, Y, M1, … centralisés).

---

## Snippets prêts à l’emploi

### YAlgorithmTesting (copier dans `components/Level1/algorithms/YClassifiers/YAlgorithmTesting.tsx`)

<pre class="overflow-visible!" data-start="7834" data-end="8167"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>"use client"</span><span>;
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span> { </span><span>BaseAlgorithmTesting</span><span> } </span><span>from</span><span></span><span>"../BaseAlgorithmTesting"</span><span>;

</span><span>const</span><span></span><span>YAlgorithmTesting</span><span>: </span><span>React</span><span>.</span><span>FC</span><span> = </span><span>() =></span><span> (
  </span><span><span class="language-xml"><BaseAlgorithmTesting</span></span><span>
    </span><span>variableLabel</span><span>=</span><span>"Y — Réactions Client"</span><span>
    </span><span>defaultClassifier</span><span>=</span><span>"RegexYClassifier"</span><span> // </span><span>adapte</span><span></span><span>si</span><span></span><span>nécessaire</span><span>
  />
);

</span><span>export</span><span></span><span>default</span><span></span><span>YAlgorithmTesting</span><span>;
</span></span></code></div></div></pre>

### YValidationInterface (remplacer le rendu par la base)

<pre class="overflow-visible!" data-start="8227" data-end="8415"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>"use client"</span><span>;
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span></span><span>YAlgorithmTesting</span><span></span><span>from</span><span></span><span>"./YAlgorithmTesting"</span><span>;

</span><span>export</span><span></span><span>default</span><span></span><span>function</span><span></span><span>YValidationInterface</span><span>(</span><span></span><span>) {
  </span><span>return</span><span></span><span><span class="language-xml"><YAlgorithmTesting</span></span><span> />;
}
</span></span></code></div></div></pre>

> Ensuite, ouvre l’onglet **Y → Validation technique** : tu retrouveras le même écran que X (sélecteur + Run + métriques + résultats).
