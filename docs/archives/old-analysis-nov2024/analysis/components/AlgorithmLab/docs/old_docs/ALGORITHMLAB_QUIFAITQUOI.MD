# AlgorithmLab — Migration Level 1 (Phase 1)

## Objectif

Factoriser l’UI de validation **par variable** (X, Y, M1, M2, M3) autour de briques communes ( _ClassifierSelector_ , _RunPanel_ , _MetricsPanel_ , _ResultsPanel_ ), tout en séparant strictement **logique d’algorithmes** (TS pur) et **interfaces** (React/MUI).

---

## Arborescence de référence (condensée) & responsabilités

<pre class="overflow-visible!" data-start="652" data-end="3354"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-txt"><span><span>src/app/(protected)/analysis/components/AlgorithmLab/
│
├─ algorithms/                  ← Logique pure, pas d’UI
│  └─ level1/
│     ├─ XAlgorithms/           ← Implémentations X (LLM, Regex, SpaCy…)
│     ├─ YAlgorithms/           ← Implémentations Y
│     ├─ M1Algorithms/          ← Calculateur M1 (+ shared/BaseM1Calculator.ts)
│     ├─ M2Algorithms/          ← Calculateur M2 (+ shared/BaseM2Calculator.ts)
│     ├─ M3Algorithms/          ← Calculateur M3 (+ shared/BaseM3Calculator.ts)
│     └─ shared/
│        ├─ BaseClassifier.ts   ← Contrat classifieurs (predict, meta…)
│        ├─ ClassifierRegistry.ts / initializeClassifiers.ts
│        ├─ BaseAlgorithm.ts / AlgorithmRegistry.ts
│        └─ PerformanceMetrics.ts / ClassifierComparator.ts
│
├─ components/                  ← Interfaces (React/MUI)
│  ├─ shared/
│  │  ├─ ClassifierSelector.tsx           ← Sélection/config d’algo (via Registry)
│  │  └─ results/
│  │     ├─ base/                          ← UI réutilisable normalisée
│  │     │  ├─ RunPanel.tsx                ← Taille d’échantillon + Lancer
│  │     │  ├─ MetricsPanel.tsx            ← KPI standard (accuracy, conf…)
│  │     │  └─ ResultsSample/              ← Table, filtres, annotations, FT
│  │     └─ x/ResultsTableX.tsx            ← Vue table spécifique X (optionnel)
│  │
│  └─ Level1/
│     ├─ Level1Interface.tsx               ← Tabs (Validation, Matrice, Erreurs…)
│     ├─ algorithms/
│     │  ├─ BaseAlgorithmTesting.tsx       ← Écran générique (Selector+Run+KPIs+Table)
│     │  ├─ XClassifiers/
│     │  │  ├─ XAlgorithmTesting.tsx       ← Paramétrage X (label, algo par défaut)
│     │  │  └─ XValidationInterface.tsx    ← Rend la base sur “Validation technique”
│     │  ├─ YClassifiers/
│     │  │  └─ YValidationInterface.tsx    ← À brancher sur la base
│     │  ├─ M1Calculators/…                ← Interfaces M1 (peuvent adopter la base)
│     │  ├─ M2Calculators/…                ← Interfaces M2
│     │  └─ M3Calculators/…                ← Interfaces M3
│     └─ individual/TechnicalValidation/   ← Legacy (source des briques refactorisées)
│
├─ hooks/                        ← Orchestration & état
│  ├─ useLevel1Testing.ts        ← Chef d’orchestre d’un run (chargement GS, predict)
│  ├─ useClassifierStatus.ts     ← Métadonnées d’algo (type, version, validité)
│  └─ level1/useXAlgorithmTesting.ts (legacy, transitoire)
│
├─ types/                        ← Contrats et tags partagés
│  ├─ ThesisVariables.*.ts       ← Tags, labels, couleurs par variable
│  ├─ ValidationTypes.ts         ← Résultats, métriques
│  └─ SharedTypes.ts / Level1Types.ts
│
└─ utils/
   └─ metricsCalculation.ts      ← Helpers de calcul côté UI (si besoin)
</span></span></code></div></div></pre>

### Règles d’architecture (invariants)

- `algorithms/*` : **aucun import d’UI** .
- `components/*` : ne parlent **jamais** directement aux classes, seulement via **hooks + Registry** .
- `hooks/*` : peuvent importer `algorithms/*`, et sont consommés par l’UI.
- `types/*` : centralisent tous les contrats.

---

## Chaîne d’exécution d’un run (qui appelle qui)

1. **Utilisateur** choisit un algo et une taille d’échantillon (UI : `ClassifierSelector` + `RunPanel`).
2. **`useLevel1Testing`** récupère l’algo via le **`ClassifierRegistry`** , charge le gold standard de la variable, exécute `predict()` et calcule les métriques de base.
3. **UI** affiche les KPI (`MetricsPanel`) et la table (`ResultsPanel`), avec filtres et Fine-Tuning dialog.

---

## État d’avancement

### Fait ✅

- Extraction UI partagée : `components/Level1/shared/results/base/*`.
- `BaseAlgorithmTesting.tsx` (écran générique).
- X branché : `XValidationInterface` rend la base (sélecteur + Run + KPI + résultats).
- Imports unifiés vers `components/Level1/shared/results/base`.

### Reste à faire ⏭️

1. **Y (Réactions client)**
   - Créer `YAlgorithmTesting.tsx` (copie de X, label & algo par défaut adaptés).
   - `YValidationInterface.tsx` → rendre `BaseAlgorithmTesting`.
   - Vérifier/compléter le chargement du gold standard Y dans `useLevel1Testing`.
2. **M1/M2/M3 (calculateurs)**
   - Option rapide : conserver l’UI actuelle.
   - Option homogène : adopter `BaseAlgorithmTesting` + métriques spécifiques si nécessaire.
3. **Matrice & Erreurs (X/Y)**
   - Raccorder `ConfusionMatrix` et `EnhancedErrorAnalysis` aux `results` issus de la base.
   - Bouton “Envoyer au Fine-Tuning” depuis les faux positifs/négatifs filtrés.
4. **Nettoyage legacy**
   - Supprimer les doublons restants sous `individual/TechnicalValidation` (ex. `ResultsSample copy.tsx`).
   - Conserver la doc utile (`TECHNICALVALIDATION_MIG.MD`) ou déplacer dans `/docs`.
5. **Registry & affichage**
   - S’assurer que chaque classifieur a `displayName` et `version` (affichés en chips).
   - Vérifier la cohérence des noms dans `ClassifierRegistry` vs `ClassifierSelector`.
6. **UX**
   - Badge “n échantillons applicables” (exposé par `getRelevantCountFor`).
   - Mini historique des runs (algo, date, taille, précision) pour recharger/Comparer.
   - Mémoriser le dernier classifieur (localStorage).

---

## Conventions d’import (officielles)

- **UI partagée**

  `components/Level1/shared/results/base/*`

  → `RunPanel` (export **default** ), `MetricsPanel` (export **default** ),

  `ResultsPanel` (via `ResultsSample/index.ts`, export **nommé** ).

- **Sélecteur d’algo**

  `components/shared/ClassifierSelector.tsx`

- **Base générique**

  `components/Level1/algorithms/BaseAlgorithmTesting.tsx`

---

## Exemples d’utilisation

### X — Validation technique (déjà branché)

<pre class="overflow-visible!" data-start="6232" data-end="6618"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>// components/Level1/algorithms/XClassifiers/XValidationInterface.tsx</span><span>
</span><span>"use client"</span><span>;
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span> { </span><span>BaseAlgorithmTesting</span><span> } </span><span>from</span><span></span><span>"../BaseAlgorithmTesting"</span><span>;

</span><span>export</span><span></span><span>default</span><span></span><span>function</span><span></span><span>XValidationInterface</span><span>(</span><span></span><span>) {
  </span><span>return</span><span> (
    </span><span><span class="language-xml"><BaseAlgorithmTesting</span></span><span>
      </span><span>variableLabel</span><span>=</span><span>"X — Stratégies Conseiller"</span><span>
      </span><span>defaultClassifier</span><span>=</span><span>"RegexConseillerClassifier"</span><span>
    />
  );
}
</span></span></code></div></div></pre>

### Y — Validation technique (à créer)

<pre class="overflow-visible!" data-start="6659" data-end="7302"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>// components/Level1/algorithms/YClassifiers/YAlgorithmTesting.tsx</span><span>
</span><span>"use client"</span><span>;
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span> { </span><span>BaseAlgorithmTesting</span><span> } </span><span>from</span><span></span><span>"../BaseAlgorithmTesting"</span><span>;

</span><span>const</span><span></span><span>YAlgorithmTesting</span><span>: </span><span>React</span><span>.</span><span>FC</span><span> = </span><span>() =></span><span> (
  </span><span><span class="language-xml"><BaseAlgorithmTesting</span></span><span>
    </span><span>variableLabel</span><span>=</span><span>"Y — Réactions Client"</span><span>
    </span><span>defaultClassifier</span><span>=</span><span>"RegexYClassifier"</span><span> // </span><span>adapte</span><span></span><span>si</span><span></span><span>besoin</span><span>
  />
);
</span><span>export</span><span></span><span>default</span><span></span><span>YAlgorithmTesting</span><span>;

</span><span>// components/Level1/algorithms/YClassifiers/YValidationInterface.tsx</span><span>
</span><span>"use client"</span><span>;
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span></span><span>YAlgorithmTesting</span><span></span><span>from</span><span></span><span>"./YAlgorithmTesting"</span><span>;
</span><span>export</span><span></span><span>default</span><span></span><span>function</span><span></span><span>YValidationInterface</span><span>(</span><span></span><span>) {
  </span><span>return</span><span></span><span><span class="language-xml"><YAlgorithmTesting</span></span><span> />;
}
</span></span></code></div></div></pre>

---

## Cheat-sheet — Ajouter un classifieur en **5 étapes**

1. **Implémenter** la classe sous `algorithms/level1/XAlgorithms` (ou Y/M\*)
   - Étendre `BaseClassifier` (ou `BaseXClassifier` si spécifique).
   - Implémenter `predict(input: string): Promise<Prediction>` (+ batch si supporté).
2. **Enregistrer** le classifieur dans `initializeClassifiers.ts`
   - Lui donner un **identifiant** , un **displayName** , une **version** , et indiquer s’il supporte **batch** .
3. **(Optionnel) Exposer la configuration** dans `ClassifierSelector`
   - Si l’algo a des paramètres, ajouter les contrôles UI et le passage de props nécessaires.
4. **Tester via l’UI générique**
   - Ouvrir l’onglet variable (X/Y), vérifier qu’il apparaît dans le **sélecteur** .
   - Lancer un run : _RunPanel_ → _MetricsPanel_ → _ResultsPanel_ .
5. **Mesures & comparaison**
   - Les KPI standards s’affichent automatiquement.
   - Pour des métriques custom, étendre `PerformanceMetrics.ts` et ajuster `MetricsPanel` si besoin.

---

## Bonnes pratiques

- **Types d’abord** : centraliser tout nouveau contrat dans `types/`.
- **Imports courts** : préférer les imports via `index.ts` locaux (ex. `ResultsSample/index.ts`).
- **Pureté** : pas de logique d’algorithmes dans les composants (uniquement dans `algorithms/*`).
- **Hooks fins** : `useLevel1Testing` orchestre le run, les composants restent “bêtes”.
