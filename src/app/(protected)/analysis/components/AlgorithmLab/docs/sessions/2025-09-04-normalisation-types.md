# Documentation Session - Refactorisation Complète AlgorithmLab : Types et Interfaces Unifiées

## Contexte et objectifs

Cette session propose une refactorisation complète de l'architecture AlgorithmLab pour résoudre deux problèmes critiques identifiés :

1. **Fragmentation des types TypeScript** — architecture dispersée sur 15+ fichiers avec doublons et incohérences.
2. **Interfaces algorithmes disparates** — wrappers multiples (wrapX, wrapY, wrapM2...) créant des incompatibilités.

L'objectif est de créer une architecture unifiée, maintenable et extensible qui simplifiera drastiquement le développement et l'ajout de nouveaux algorithmes.

---

## Problématique actuelle

### 1. Fragmentation excessive des types

**Architecture dispersée sur 15+ fichiers** :

<pre class="overflow-visible!" data-start="1101" data-end="1949"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>types/
├── Level0Types.ts           </span><span># Inter-annotateur, Kappa</span><span>
├── Level1Types.ts           </span><span># Calculateurs génériques + M2 spécifique</span><span>
├── ValidationTypes.ts       </span><span># Interfaces UI (500+ lignes)</span><span>
├── SharedTypes.ts           </span><span># Types partagés basiques</span><span>
├── ThesisVariables.ts       </span><span># Variables principales + slots vides</span><span>
├── ThesisVariables.x.ts     </span><span># Extension X via module augmentation</span><span>
├── ThesisVariables.y.ts     </span><span># Extension Y via module augmentation</span><span>
├── ThesisVariables.m1.ts    </span><span># Extension M1 via module augmentation</span><span>
├── ThesisVariables.m2.ts    </span><span># Extension M2 via module augmentation</span><span>
├── ThesisVariables.m3.ts    </span><span># Extension M3 via module augmentation</span><span>
├── normalizers.ts           </span><span># Fonctions de normalisation</span><span>
├── Level2/shared/types.ts   </span><span># Types Level2 (H1, statistiques)</span><span>
└── components/*/types.ts    </span><span># Types éparpillés dans les composants</span><span>
</span></span></code></div></div></pre>

**Problèmes identifiés** :

- **Doublons critiques** : `M2Input` défini différemment dans 2 fichiers
- **Module augmentation fragile** : types invisibles sans imports spécifiques
- **Interfaces vides** : slots extensibles qui compliquent l'auto-complétion
- **Dépendances implicites** : ordre d'import crucial mais non documenté

### 2. Interfaces algorithmes incompatibles

**Système actuel fragmenté** :

<pre class="overflow-visible!" data-start="2358" data-end="2721"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Wrappers multiples avec signatures différentes</span><span>
</span><span>function</span><span></span><span>wrapX</span><span>(</span><span>calc: XCalculator</span><span>): </span><span>CompatibleAlgorithm</span><span>;
</span><span>function</span><span></span><span>wrapY</span><span>(</span><span>calc: YCalculator</span><span>): </span><span>CompatibleAlgorithm</span><span>;
</span><span>function</span><span></span><span>wrapM2</span><span>(</span><span>calc: M2Calculator</span><span>): </span><span>CompatibleAlgorithm</span><span>;

</span><span>// Chaque wrapper a sa propre logique</span><span>
</span><span>// Code dupliqué 3x</span><span>
</span><span>// Maintenance complexe</span><span>
</span><span>// Extension difficile pour nouveaux types</span><span>
</span></span></code></div></div></pre>

**Conséquences** :

- **Problèmes de registry** : chargement aléatoire selon l'ordre d'import
- **Code dupliqué** : même logique répétée dans chaque wrapper
- **Extension complexe** : nouveau type = nouveau wrapper à créer
- **Tests fragmentés** : suite de tests différente par wrapper

---

## Solution proposée : Architecture unifiée

### 1. Restructuration hiérarchique des types

<pre class="overflow-visible!" data-start="3107" data-end="4135"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>types/
├── core/                    </span><span># Types fondamentaux centralisés</span><span>
│   ├── index.ts            </span><span># Exports centralisés</span><span>
│   ├── variables.ts        </span><span># Variables X, Y, M1, M2, M3 (complètes)</span><span>
│   ├── calculations.ts     </span><span># Interfaces de calcul standardisées</span><span>
│   └── validation.ts       </span><span># Métriques de validation unifiées</span><span>
├── algorithms/             </span><span># Types spécifiques aux algorithmes</span><span>
│   ├── index.ts
│   ├── </span><span>base</span><span>.ts            </span><span># Interface universelle UniversalAlgorithm</span><span>
│   ├── level1.ts          </span><span># Calculateurs X, Y, M1, M2, M3</span><span>
│   └── level2.ts          </span><span># Types Level2 (H1, statistiques)</span><span>
├── ui/                    </span><span># Types d'interface utilisateur simplifiés</span><span>
│   ├── index.ts
│   ├── components.ts      </span><span># Props génériques des composants</span><span>
│   ├── validation.ts      </span><span># Interfaces de validation</span><span>
│   └── results.ts         </span><span># Affichage des résultats</span><span>
└── utils/                 </span><span># Utilitaires et conversions</span><span>
    ├── index.ts
    ├── normalizers.ts     </span><span># Fonctions de normalisation</span><span>
    └── converters.ts      </span><span># Conversions de types</span><span>
</span></span></code></div></div></pre>

### 2. Interface universelle pour tous les algorithmes

<pre class="overflow-visible!" data-start="4193" data-end="4936"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>/**
 * Interface que TOUS les algorithmes doivent implémenter
 * Remplace wrapX, wrapY, wrapM2, etc.
 */
</span><span>export</span><span></span><span>interface</span><span></span><span>UniversalAlgorithm</span><span> {
  </span><span>// Métadonnées standardisées</span><span>
  </span><span>describe</span><span>(): </span><span>AlgorithmDescriptor</span><span>;
  </span><span>validateConfig</span><span>(): </span><span>boolean</span><span>;

  </span><span>// Exécution unifiée</span><span>
  </span><span>classify</span><span>(</span><span>input</span><span>: </span><span>string</span><span>): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>>; </span><span>// Compat backward</span><span>
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>unknown</span><span>): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>>;     </span><span>// Input typé</span><span>
  batchRun?(</span><span>inputs</span><span>: </span><span>unknown</span><span>[]): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>[]>; </span><span>// Batch optionnel</span><span>
}

/**
 * Adaptateur universel remplaçant tous les wrappers
 */
</span><span>export</span><span></span><span>function</span><span> createUniversalAlgorithm<</span><span>TInput</span><span>, </span><span>TDetails</span><span>>(
  </span><span>calculator</span><span>: </span><span>BaseCalculator</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>>,
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>,
  config?: </span><span>AdapterConfig</span><span>
): </span><span>UniversalAlgorithm</span><span>;
</span></span></code></div></div></pre>

---

## Types centralisés et cohérents

### `types/core/variables.ts` — Variables fondamentales

<pre class="overflow-visible!" data-start="5035" data-end="6660"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Variables principales de la thèse</span><span>
</span><span>export</span><span></span><span>type</span><span></span><span>VariableX</span><span> =
  | </span><span>"ENGAGEMENT"</span><span>
  | </span><span>"EXPLICATION"</span><span>
  | </span><span>"REFLET_ACQ"</span><span>
  | </span><span>"REFLET_JE"</span><span>
  | </span><span>"REFLET_VOUS"</span><span>
  | </span><span>"OUVERTURE"</span><span>;

</span><span>export</span><span></span><span>type</span><span></span><span>VariableY</span><span> = </span><span>"CLIENT_POSITIF"</span><span> | </span><span>"CLIENT_NEUTRE"</span><span> | </span><span>"CLIENT_NEGATIF"</span><span>;

</span><span>export</span><span></span><span>type</span><span></span><span>VariableTarget</span><span> = </span><span>"X"</span><span> | </span><span>"Y"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>;

</span><span>// Détails enrichis (plus de "slots" vides)</span><span>
</span><span>export</span><span></span><span>interface</span><span></span><span>XDetails</span><span> {
  </span><span>label</span><span>: </span><span>VariableX</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  </span><span>family</span><span>: </span><span>"ENGAGEMENT"</span><span> | </span><span>"OUVERTURE"</span><span> | </span><span>"REFLET"</span><span> | </span><span>"EXPLICATION"</span><span>;
  matchedPatterns?: </span><span>string</span><span>[];
  rationale?: </span><span>string</span><span>;
  probabilities?: </span><span>Partial</span><span><</span><span>Record</span><span><</span><span>VariableX</span><span>, </span><span>number</span><span>>>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>YDetails</span><span> {
  </span><span>label</span><span>: </span><span>VariableY</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  cues?: </span><span>string</span><span>[];
  sentimentProxy?: </span><span>number</span><span>; </span><span>// -1..1</span><span>
}

</span><span>export</span><span></span><span>interface</span><span> M1Details {
  </span><span>score</span><span>: </span><span>number</span><span>; </span><span>// [0-1] densité des verbes d'action</span><span>
  </span><span>verbCount</span><span>: </span><span>number</span><span>;
  </span><span>totalWords</span><span>: </span><span>number</span><span>;
  </span><span>density</span><span>: </span><span>number</span><span>;
  </span><span>detectedVerbs</span><span>: </span><span>Array</span><span><{
    </span><span>verb</span><span>: </span><span>string</span><span>;
    </span><span>position</span><span>: </span><span>number</span><span>;
    </span><span>confidence</span><span>: </span><span>number</span><span>;
    </span><span>lemma</span><span>: </span><span>string</span><span>;
  }>;
  verbCategories?: {
    </span><span>institutional</span><span>: </span><span>number</span><span>;
    </span><span>cognitive</span><span>: </span><span>number</span><span>;
    </span><span>communicative</span><span>: </span><span>number</span><span>;
  };
}

</span><span>export</span><span></span><span>interface</span><span> M2Details {
  </span><span>alignmentType</span><span>: </span><span>"aligné"</span><span> | </span><span>"partiellement_aligné"</span><span> | </span><span>"non_aligné"</span><span>;
  </span><span>lexicalScore</span><span>: </span><span>number</span><span>;      </span><span>// [0..1]</span><span>
  semanticScore?: </span><span>number</span><span>;    </span><span>// [0..1]</span><span>
  sharedTokens?: </span><span>string</span><span>[];
  patterns?: </span><span>string</span><span>[];
  </span><span>justification</span><span>: </span><span>string</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;        </span><span>// [0..1]</span><span>
  processingTime?: </span><span>number</span><span>;   </span><span>// ms</span><span>
}

</span><span>export</span><span></span><span>interface</span><span> M3Details {
  </span><span>score</span><span>: </span><span>number</span><span>; </span><span>// [0-1] charge cognitive</span><span>
  pauseCount?: </span><span>number</span><span>;
  hesitationCount?: </span><span>number</span><span>;
  longPauseMs?: </span><span>number</span><span>;
  speechRate?: </span><span>number</span><span>;
  markers?: </span><span>string</span><span>[];
}
</span></span></code></div></div></pre>

### `types/core/calculations.ts` — Interfaces de calcul

<pre class="overflow-visible!" data-start="6719" data-end="7400"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>export</span><span></span><span>interface</span><span></span><span>BaseCalculator</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>> {
  </span><span>describe</span><span>(): </span><span>AlgorithmDescriptor</span><span>;
  </span><span>validateConfig</span><span>(): </span><span>boolean</span><span>;
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>Promise</span><span><</span><span>CalculationResult</span><span><</span><span>TDetails</span><span>>>;
  batchRun?(</span><span>inputs</span><span>: </span><span>TInput</span><span>[]): </span><span>Promise</span><span><</span><span>CalculationResult</span><span><</span><span>TDetails</span><span>>[]>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmDescriptor</span><span> {
  </span><span>id</span><span>: </span><span>string</span><span>;
  </span><span>displayName</span><span>: </span><span>string</span><span>;
  </span><span>version</span><span>: </span><span>string</span><span>;
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>;
  supportsBatch?: </span><span>boolean</span><span>;
  description?: </span><span>string</span><span>;
  authors?: </span><span>string</span><span>[];
}

</span><span>export</span><span></span><span>interface</span><span></span><span>CalculationResult</span><span><</span><span>TDetails</span><span>> {
  </span><span>id</span><span>: </span><span>string</span><span> | </span><span>number</span><span>;
  </span><span>verbatim</span><span>: </span><span>string</span><span>;
  </span><span>predicted</span><span>: </span><span>string</span><span>;
  </span><span>details</span><span>: </span><span>TDetails</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  processingTime?: </span><span>number</span><span>;
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>any</span><span>>;
}
</span></span></code></div></div></pre>

### `types/core/validation.ts` — Métriques de validation

<pre class="overflow-visible!" data-start="7460" data-end="7849"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>export</span><span></span><span>interface</span><span></span><span>ValidationMetrics</span><span> {
  </span><span>accuracy</span><span>: </span><span>number</span><span>;
  precision?: </span><span>number</span><span>;
  recall?: </span><span>number</span><span>;
  f1?: </span><span>number</span><span>;
  kappa?: </span><span>number</span><span>;
  support?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>number</span><span>>;
  latencyMsAvg?: </span><span>number</span><span>;
  latencyMsP95?: </span><span>number</span><span>;
  stability?: </span><span>"high"</span><span> | </span><span>"medium"</span><span> | </span><span>"low"</span><span>; </span><span>// écart-type interprété</span><span>
  foldResults?: </span><span>Array</span><span><{
    </span><span>fold</span><span>: </span><span>number</span><span>;
    </span><span>accuracy</span><span>: </span><span>number</span><span>;
    f1?: </span><span>number</span><span>;
  }>;
}
</span></span></code></div></div></pre>

---

## Bénéfices attendus

### 1. Cohérence globale

- **API unique** pour tous les algorithmes
- **Types centralisés** et vérifiables
- **Wrappers supprimés** (un seul adaptateur universel)

### 2. Developer Experience

- **Auto-complétion fiable** : plus de types invisibles
- **Documentation claire** : structure intuitive
- **Debugging simplifié** : dépendances explicites

### 3. Extensibilité

- **Ajout facile** de nouveaux calculateurs
- **Pattern cohérent** pour les nouvelles variables
- **Interface UI modulaire**

### 4. Performance

- **Imports optimisés** : tree-shaking efficace
- **Compilation plus rapide** : moins de dépendances circulaires
- **Bundle plus petit** : élimination des doublons

---

## Plan de mise en œuvre

### Phase 1 : Restructuration des types (2h)

#### 1.1 Création de la nouvelle architecture

<pre class="overflow-visible!" data-start="8687" data-end="9049"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span># Créer la structure de dossiers</span><span>
</span><span>mkdir</span><span> -p src/types/{core,algorithms,ui,utils}

</span><span># Créer les fichiers principaux</span><span>
</span><span>touch</span><span> src/types/core/{index,variables,calculations,validation}.ts
</span><span>touch</span><span> src/types/algorithms/{index,base,level1,level2}.ts
</span><span>touch</span><span> src/types/ui/{index,components,validation,results}.ts
</span><span>touch</span><span> src/types/utils/{index,normalizers,converters}.ts
</span></span></code></div></div></pre>

#### 1.2 Migration des types fondamentaux vers `types/core/`

- `variables.ts` — Variables complètes (plus de slots vides)
- `calculations.ts` — Interfaces calculateur/résultat
- `validation.ts` — Métriques unifiées
- `index.ts` — Exports centralisés

### Phase 2 : Interface universelle (2h)

- Créer `UniversalAlgorithm` et `createUniversalAlgorithm`
- Ajouter un **shim de compat** pour `classify(string)`
- Migrer 1 algorithme pilote (ex. `RegexXClassifier`) et valider

### Phase 3 : Migration des algorithmes (1h30)

- Migrer X, Y, M1, M2, M3 en s'appuyant sur l'adaptateur
- Supprimer les anciens wrappers (`wrapX`, `wrapY`, `wrapM2`)

### Phase 4 : Migration des imports (1h)

- Remplacer les imports vers les nouveaux modules `types/core/*`
- Mettre à jour les composants UI (props génériques `results`, `metrics`)

### Phase 5 : Tests et validation (1h)

- Suite de tests unique pour l'adaptateur universel
- Vérifier compilation et exécution dans `Level1Interface`
- Benchmarks rapides (latence moyenne, précision)

**Buffer** : 30 minutes pour ajustements finaux

---

## Risques et mitigation

### Risques identifiés

1. **Régression fonctionnelle** : perte de fonctionnalités pendant la migration
2. **Incompatibilité types** : conflits avec le code existant
3. **Performance** : impact sur les temps d'exécution

### Stratégies de mitigation

1. **Migration progressive** : phase par phase avec validation à chaque étape
2. **Tests continus** : suite de tests exécutée à chaque modification
3. **Rollback plan** : possibilité de revenir à l'ancien système
4. **Documentation** : changements documentés pour l'équipe

---

## Actions immédiates

### Validation préalable (30 min)

0� [ ] Valider l'architecture proposée
0� [ ] Confirmer les types `UniversalAlgorithm` et `AlgorithmDescriptor`
0� [ ] Approuver la stratégie de migration

### Implémentation Phase 1 (2h)

0� [ ] Créer la structure `types/{core,algorithms,ui,utils}/`
0� [ ] Migrer les types vers `types/core/variables.ts`, `calculations.ts`, `validation.ts`
0� [ ] Créer les exports centralisés
0� [ ] Tester la compilation

### Implémentation Phase 2 (2h)

0� [ ] Créer `UniversalAlgorithm` et `createUniversalAlgorithm`
0� [ ] Implémenter un premier adaptateur
0� [ ] Migrer 1 algorithme test (pilot)
0� [ ] Valider le fonctionnement de bout en bout

---

## 🔧 Bonnes pratiques proposées

### 1. Conventions de nommage

<pre class="overflow-visible!" data-start="11453" data-end="11911"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// Variables : UpperCamelCase</span><span>
</span><span>type</span><span></span><span>VariableX</span><span> = </span><span>"ENGAGEMENT"</span><span> | </span><span>"OUVERTURE"</span><span>;

</span><span>// Interfaces : PascalCase avec suffixe métier</span><span>
</span><span>interface</span><span></span><span>XDetails</span><span> { </span><span>/* ... */</span><span> }           </span><span>// Détails de variable</span><span>
</span><span>interface</span><span></span><span>XCalculator</span><span> { </span><span>/* ... */</span><span> }        </span><span>// Calculateur</span><span>
</span><span>interface</span><span></span><span>XValidationResult</span><span> { </span><span>/* ... */</span><span> }  </span><span>// Résultat UI</span><span>

</span><span>// Types génériques : PascalCase avec préfixe</span><span>
</span><span>interface</span><span></span><span>BaseCalculator</span><span><T, U> { </span><span>/* ... */</span><span> }
</span><span>interface</span><span></span><span>ValidationResult</span><span><T> { </span><span>/* ... */</span><span> }
</span></span></code></div></div></pre>

### 2. Exports structurés

<pre class="overflow-visible!" data-start="11940" data-end="12319"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>// types/core/index.ts</span><span>
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./variables"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./calculations"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./validation"</span><span>;

</span><span>// types/algorithms/index.ts</span><span>
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./base"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./level1"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./level2"</span><span>;

</span><span>// Import simplifié</span><span>
</span><span>import</span><span> { </span><span>XDetails</span><span>, M2Calculator, </span><span>ValidationMetrics</span><span> } </span><span>from</span><span></span><span>"@/types/core"</span><span>;
</span><span>import</span><span> { </span><span>XValidationProps</span><span> } </span><span>from</span><span></span><span>"@/types/ui"</span><span>;
</span></span></code></div></div></pre>

### 3. Documentation des interfaces

<pre class="overflow-visible!" data-start="12358" data-end="12724"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>/**
 * Configuration de test pour un algorithme
 *
 * </span><span>@example</span><span>
 * ```typescript
 * const config: AlgorithmTestConfig = {
 *   algorithmId: "OpenAIXClassifier",
 *   variable: "X",
 *   sampleSize: 100,
 *   useGoldStandard: true
 * };
 * ```
 */
</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmTestConfig</span><span> {
  </span><span>algorithmId</span><span>: </span><span>string</span><span>;
  </span><span>variable</span><span>: </span><span>VariableTarget</span><span>;
  </span><span>// ...</span><span>
}
</span></span></code></div></div></pre>

---

## ✅ Checklist de validation

### Avant migration

- [ ] Inventaire complet des types existants
- [ ] Identification des doublons et incohérences
- [ ] Définition de l'architecture cible
- [ ] Préparation du script de migration

### Pendant migration

- [ ] Création de la nouvelle structure
- [ ] Migration progressive par domaine
- [ ] Tests de compilation à chaque étape
- [ ] Validation des exports centralisés

### Après migration

- [ ] Compilation TypeScript sans erreur
- [ ] Tests unitaires fonctionnels
- [ ] Vérification des fonctionnalités UI
- [ ] Documentation mise à jour
- [ ] Suppression des anciens fichiers

---

## 📝 Notes pour la session suivante

### Priorités immédiates

1. **Valider l'architecture proposée** avec l'équipe
2. **Implémenter la Phase 1** (structure de base)
3. **Tester la migration** sur un composant pilote
4. **Créer les exports centralisés**

### Points d'attention

- **Préserver la compatibilité** avec le code existant
- **Tester minutieusement** les interfaces `ResultsPanel`
- **Documenter les changements** pour l'équipe
- **Planifier la migration progressive**
