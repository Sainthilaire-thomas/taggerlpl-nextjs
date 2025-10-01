
# 📄 `design-patterns.md`

<pre class="overflow-visible!" data-start="164" data-end="778"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Design Patterns</span><span>

</span><span>## 🎯 Objectif</span><span>
AlgorithmLab applique plusieurs </span><span>**patterns de conception**</span><span> afin d’assurer la modularité, la réutilisabilité et la maintenabilité du framework.  
Ces choix sont documentés dans les ADRs (Architecture Decision Records).

---

</span><span>## 1. Strategy Pattern (Algorithmes)</span><span>

Chaque algorithme implémente une interface commune </span><span>`BaseAlgorithm`</span><span>.  
Cela permet de définir un </span><span>**contrat générique**</span><span> que toutes les implémentations doivent respecter.

```typescript
interface BaseAlgorithm<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
  describe(): AlgorithmDescriptor;
}
</span></span></code></div></div></pre>

Exemples :

* `M1ActionVerbCounter` (densité verbes d’action).
* `RegexXClassifier` (stratégies conseiller).
* `SpacyConseillerClassifier` (modèles ML).
* `OpenAIConseillerClassifier` (LLM).

**Avantage** :

* Ajouter un nouvel algorithme ne casse pas l’existant.
* Découplage complet entre logique métier et UI.

→ ADR-001 : **Centralisation des types**

→ ADR-002 : **Interface commune pour algorithmes**

---

## 2. Adapter Pattern (Universalisation)

Tous les algorithmes passent par l’**adaptateur universel** (`createUniversalAlgorithm`) qui homogénéise leurs interfaces.

<pre class="overflow-visible!" data-start="1372" data-end="1530"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>function</span><span> createUniversalAlgorithm<</span><span>TInput</span><span>, </span><span>TDetails</span><span>>(
  </span><span>algo</span><span>: </span><span>BaseAlgorithm</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>>,
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>
): </span><span>UniversalAlgorithm</span><span>
</span></span></code></div></div></pre>

**Avant** :

* `.classify(verbatim)` pour X/Y.
* `.run(input)` pour M1/M3.
* API hétérogènes.

**Après** :

* `.runUniversal(input)` → toujours `UniversalResult`.

**Avantage** :

* Une seule interface côté UI (`ResultsPanel`, `TechnicalValidation`).
* Simplifie le benchmarking multi-algorithmes.

→ ADR-002 : **Adaptateur universel**

---

## 3. Factory Pattern (Colonnes dynamiques)

Le tableau de résultats (`ResultsPanel`) génère les colonnes en fonction de la variable analysée (X, Y, M1, M2, M3).

<pre class="overflow-visible!" data-start="2052" data-end="2339"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>function</span><span></span><span>buildExtraColumnsForTarget</span><span>(</span><span>kind: TargetKind</span><span>): </span><span>ExtraColumn</span><span>[] {
  </span><span>switch</span><span> (kind) {
    </span><span>case</span><span></span><span>"X"</span><span>: </span><span>return</span><span></span><span>buildXColumns</span><span>();
    </span><span>case</span><span></span><span>"Y"</span><span>: </span><span>return</span><span></span><span>buildYColumns</span><span>();
    </span><span>case</span><span></span><span>"M1"</span><span>: </span><span>return</span><span> m1Columns;
    </span><span>case</span><span></span><span>"M2"</span><span>: </span><span>return</span><span> m2Columns;
    </span><span>case</span><span></span><span>"M3"</span><span>: </span><span>return</span><span> m3Columns;
  }
}
</span></span></code></div></div></pre>

**Avantage** :

* Pas de duplication de code.
* Colonnes adaptées automatiquement au contexte scientifique.

→ ADR-003 : **Dispatch métriques**

---

## 4. Observer Pattern (Annotations temps réel)

Les annotations sont gérées via un **contexte partagé** et des hooks (`useTaggingData`).

Les composants comme `AnnotationList` observent les changements.

<pre class="overflow-visible!" data-start="2702" data-end="2852"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>const</span><span> { addAnnotation, updateAnnotation } = </span><span>useTaggingData</span><span>();

</span><span><span class="language-xml"><AnnotationList</span></span><span>
  </span><span>turnId</span><span>=</span><span>{142}</span><span>
  </span><span>onAnnotationChange</span><span>=</span><span>{handleUpdate}</span><span>
/>
</span></span></code></div></div></pre>

**Avantage** :

* Collaboration multi-utilisateurs.
* Mise à jour temps réel des annotations et feedback.

→ ADR-004 : **Annotations expertes**

---

## ✅ Résumé

* **Strategy** → modularité des algorithmes.
* **Adapter** → unification des interfaces.
* **Factory** → génération dynamique de colonnes UI.
* **Observer** → supervision temps réel et collaboration.

---

## 🔗 Ressources associées

* [Type System](type-system.md)
* [Data Flow](data-flow.md)
* [ADR-001 à ADR-004]()

→ [Retour Architecture](README.md)
