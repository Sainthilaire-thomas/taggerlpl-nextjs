
---
## `04-API-REFERENCE/types/typesalgorithms.md`

```md
# Types Algorithms

Contrats des algorithmes AlgorithmLab et métadonnées associées.

## Métadonnées

```ts
export interface AlgorithmMetadata {
  name: string                         // identifiant technique (clé registry)
  displayName?: string                 // libellé UI
  type: "rule-based" | "ml" | "llm" | "composite"
  target: "X" | "Y" | "M1" | "M2" | "M3"
  version?: string
  description?: string
  batchSupported?: boolean
  apiRequirements?: string[]           // ex.: ["OPENAI_API_KEY"]
}
---

## Contrat d’algorithme

<pre class="overflow-visible!" data-start="4073" data-end="4304"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>BaseAlgorithm</span><span><</span><span>TInput</span><span> = </span><span>unknown</span><span>, </span><span>TOutput</span><span> = </span><span>unknown</span><span>> {
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>Promise</span><span><</span><span>TOutput</span><span>>
  runBatch?(</span><span>inputs</span><span>: </span><span>TInput</span><span>[]): </span><span>Promise</span><span><</span><span>TOutput</span><span>[]>
  </span><span>describe</span><span>(): </span><span>AlgorithmMetadata</span><span>
  validateConfig?(): </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

## Résultat de classification (universel)

<pre class="overflow-visible!" data-start="4349" data-end="4505"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ClassificationResult</span><span> {
  </span><span>prediction</span><span>: </span><span>string</span><span>
  </span><span>confidence</span><span>: </span><span>number</span><span>
  processingTime?: </span><span>number</span><span>
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
}
</span></span></code></div></div></pre>

> La plupart des implémentations **renvoient `ClassificationResult`** ou l’étendent pour inclure des champs d’audit (ex. `explain`, `features`).

## Registry & Initialisation

<pre class="overflow-visible!" data-start="4683" data-end="4953"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>RegisteredAlgorithm</span><span> {
  </span><span>key</span><span>: </span><span>string</span><span>
  </span><span>instance</span><span>: </span><span>BaseAlgorithm</span><span><</span><span>any</span><span>, </span><span>any</span><span>>
  </span><span>meta</span><span>: </span><span>AlgorithmMetadata</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmStatus</span><span> {
  </span><span>key</span><span>: </span><span>string</span><span>
  </span><span>available</span><span>: </span><span>boolean</span><span>
  </span><span>batchSupported</span><span>: </span><span>boolean</span><span>
  </span><span>configValid</span><span>: </span><span>boolean</span><span>
  messages?: </span><span>string</span><span>[]
}
</span></span></code></div></div></pre>

## Hooks de Validation (niveau 1)

<pre class="overflow-visible!" data-start="4990" data-end="5244"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ValidationRequest</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>
  sampleSize?: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ValidationResult</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>
  </span><span>metrics</span><span>: </span><span>SimpleMetrics</span><span>
  byTag?: </span><span>TagMetrics</span><span>[]
  errors?: </span><span>ErrorAnalysis</span><span>
  </span><span>processedAt</span><span>: </span><span>string</span><span>
}
</span></span></code></div></div></pre>

## Configuration déclarative (entrée attendue)

<pre class="overflow-visible!" data-start="5294" data-end="5898"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>InputFormat</span><span> = </span><span>"simple"</span><span> | </span><span>"pair"</span><span> | </span><span>"sequence"</span><span> | </span><span>"custom"</span><span>

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmInputSpec</span><span> {
  </span><span>format</span><span>: </span><span>InputFormat</span><span>
  </span><span>fields</span><span>: </span><span>string</span><span>[]                </span><span>// ex. ["verbatim"] ou ["verbatim","context"]</span><span>
  normalizerPreset?: </span><span>string</span><span></span><span>// preset de normalisation à appliquer</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmConfigEntry</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>
  </span><span>target</span><span>: </span><span>AlgorithmMetadata</span><span>[</span><span>"target"</span><span>]
  </span><span>input</span><span>: </span><span>AlgorithmInputSpec</span><span>
}

</span><span>export</span><span></span><span>type</span><span></span><span>AlgorithmConfigMap</span><span> = </span><span>Record</span><span><</span><span>string</span><span>, </span><span>AlgorithmConfigEntry</span><span>>
</span><span>// Exemple : ALGORITHM_CONFIGS["OpenAIConseiller"] → { target:"X", input:{ format:"simple", fields:["verbatim"] } }</span><span>
</span></span></code></div></div></pre>

<pre class="overflow-visible!" data-start="5899" data-end="6582"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---</span></span></code></div></div></pre>
