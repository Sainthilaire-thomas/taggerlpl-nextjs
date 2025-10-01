### 📄 Proposition : `branche-algorithmes.md`

<pre class="overflow-visible!" data-start="839" data-end="1163"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Branche Algorithmes</span><span>

</span><span>## 🎯 Rôle</span><span>
La branche </span><span>**algorithms/**</span><span> regroupe toutes les implémentations des calculateurs et classificateurs correspondant aux 5 variables du modèle scientifique (X, Y, M1, M2, M3).  
Elle constitue la base du </span><span>**niveau 1 (validation technique)**</span><span> d’AlgorithmLab.

---

</span><span>## 📂 Structure</span><span>

</span></span></code></div></div></pre>

algorithms/level1/

├── conseillerclassifiers/   # Classificateurs X (stratégies conseiller)

├── clientclassifiers/       # Classificateurs Y (réactions client)

├── M1Algorithms/            # Calculateurs M1 (densité verbes d’action)

├── M2Algorithms/            # Classificateurs M2 (alignement)

├── M3Algorithms/            # Calculateurs M3 (charge cognitive)

└── shared/                  # Infrastructure commune

<pre class="overflow-visible!" data-start="1580" data-end="1875"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span>## 🔧 Composants partagés</span><span>

</span><span>### `BaseAlgorithm.ts`</span><span>
</span><span>Interface</span><span></span><span>générique</span><span></span><span>que</span><span></span><span>tous</span><span></span><span>les</span><span></span><span>algorithmes</span><span></span><span>doivent</span><span></span><span>implémenter</span><span></span><span>:</span><span>

</span><span>```typescript</span><span>
</span><span>export</span><span></span><span>abstract</span><span></span><span>class</span><span></span><span>BaseAlgorithm<TInput,</span><span></span><span>TOutput></span><span> {
  </span><span>abstract</span><span></span><span>run(input:</span><span></span><span>TInput):</span><span></span><span>Promise<TOutput>;</span><span>
  </span><span>abstract</span><span></span><span>describe():</span><span></span><span>AlgorithmDescriptor;</span><span>
}
</span></span></code></div></div></pre>

### `AlgorithmRegistry.ts`

Système centralisé d’enregistrement et récupération :

<pre class="overflow-visible!" data-start="1959" data-end="2101"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>algorithmRegistry.</span><span>register</span><span>(</span><span>"M1ActionVerbCounter"</span><span>, universalAlgo);
</span><span>const</span><span> algo = algorithmRegistry.</span><span>get</span><span>(</span><span>"M1ActionVerbCounter"</span><span>);
</span></span></code></div></div></pre>

### `initializeAlgorithms.ts`

Auto-initialisation au démarrage, enregistre tous les algorithmes disponibles.

---

## 📊 Familles d’algorithmes

### 1. X (Stratégies conseiller)

* `RegexConseillerClassifier` : règles déterministes.
* `SpacyConseillerClassifier` : modèles ML.
* `OpenAIConseillerClassifier` : modèles LLM (gpt, mistral).

### 2. Y (Réactions client)

* `RegexClientClassifier` : positif / négatif / neutre.
* Support ML et LLM prévu en extension.

### 3. M1 (Verbes d’action)

* `M1ActionVerbCounter` : compteur basé sur tokens.
* `RegexM1Calculator` : variantes de règles.

### 4. M2 (Alignement X→Y)

* `M2LexicalAlignmentCalculator` : comparaison lexicale.
* `M2SemanticAlignmentCalculator` : alignement sémantique.
* `M2CompositeAlignmentCalculator` : combinaison pondérée.

### 5. M3 (Charge cognitive)

* `PausesM3Calculator` : durée des pauses.

---

## 🔄 Cycle de vie d’un algorithme

1. **Création** : implémenter une sous-classe de `BaseAlgorithm`.
2. **Universalisation** : envelopper via `createUniversalAlgorithm`.
3. **Enregistrement** : `algorithmRegistry.register("NomAlgo", universal)`.
4. **Utilisation UI** : sélection dans `BaseAlgorithmTesting` ou `TechnicalValidation`.

---

## ✅ Points clés

* **Modularité** : chaque variable a son répertoire.
* **Extensibilité** : ajouter un algorithme = nouvelle classe + enregistrement.
* **Interopérabilité** : tout passe par l’`UniversalAdapter`.
