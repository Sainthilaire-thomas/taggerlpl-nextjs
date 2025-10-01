
# Types Core

Types transverses utilisés dans les hooks, l’initialisation et l’UI.

## Gold Standard & Corpus

```ts
export interface TVGoldStandardSample {
  verbatim: string
  expectedTag: string
  metadata?: {
    target?: "conseiller" | "client"
    callId?: string | number
    speaker?: string
    start?: number
    end?: number
    turnId?: string | number
    nextOf?: string | number
    next_turn_verbatim?: string
    next_turn_tag?: string
    hasAudio?: boolean
    hasTranscript?: boolean
  }
}
```


## Résultat universel

<pre class="overflow-visible!" data-start="1395" data-end="1715"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>UniversalResult</span><span> {
  </span><span>prediction</span><span>: </span><span>string</span><span>
  </span><span>confidence</span><span>: </span><span>number</span><span>
  processingTime?: </span><span>number</span><span>
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
  </span><span>// enrichissements optionnels pour l’analyse</span><span>
  filename?: </span><span>string</span><span>
  next_turn_verbatim?: </span><span>string</span><span>
  next_turn_tag?: </span><span>string</span><span>
  hasAudio?: </span><span>boolean</span><span>
  hasTranscript?: </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

## Métriques

<pre class="overflow-visible!" data-start="1731" data-end="2311"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>SimpleMetrics</span><span> {
  </span><span>accuracy</span><span>: </span><span>number</span><span></span><span>// proportion correcte [0..1]</span><span>
  </span><span>correct</span><span>: </span><span>number</span><span></span><span>// nb de classifications correctes</span><span>
  </span><span>total</span><span>: </span><span>number</span><span></span><span>// taille de l’échantillon</span><span>
  </span><span>avgProcessingTime</span><span>: </span><span>number</span><span></span><span>// ms moyen par item</span><span>
  </span><span>avgConfidence</span><span>: </span><span>number</span><span></span><span>// moyenne [0..1]</span><span>
  kappa?: </span><span>number</span><span></span><span>// accord Cohen vs gold standard</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>TagMetrics</span><span> {
  </span><span>tag</span><span>: </span><span>string</span><span>
  </span><span>precision</span><span>: </span><span>number</span><span>
  </span><span>recall</span><span>: </span><span>number</span><span>
  </span><span>f1</span><span>: </span><span>number</span><span>
  </span><span>support</span><span>: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>MetricsBundle</span><span> {
  </span><span>global</span><span>: </span><span>SimpleMetrics</span><span>
  byTag?: </span><span>TagMetrics</span><span>[]
}
</span></span></code></div></div></pre>

## Comparaison & Cross-Validation

<pre class="overflow-visible!" data-start="2348" data-end="2824"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ComparisonResult</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>
  </span><span>accuracy</span><span>: </span><span>number</span><span>
  </span><span>avgProcessingTime</span><span>: </span><span>number</span><span>
  </span><span>avgConfidence</span><span>: </span><span>number</span><span>
  </span><span>metadata</span><span>: { </span><span>type</span><span>: </span><span>string</span><span>; version?: </span><span>string</span><span>; name?: </span><span>string</span><span> }
  </span><span>rank</span><span>: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>FoldResult</span><span> {
  </span><span>foldIndex</span><span>: </span><span>number</span><span>
  </span><span>metrics</span><span>: </span><span>SimpleMetrics</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>CrossValidationResults</span><span> {
  </span><span>meanAccuracy</span><span>: </span><span>number</span><span>
  </span><span>stdAccuracy</span><span>: </span><span>number</span><span>
  </span><span>stability</span><span>: </span><span>"high"</span><span> | </span><span>"medium"</span><span> | </span><span>"low"</span><span>
  </span><span>confidence</span><span>: </span><span>number</span><span>
  </span><span>foldResults</span><span>: </span><span>FoldResult</span><span>[]
}
</span></span></code></div></div></pre>

## Erreurs & Analyse

<pre class="overflow-visible!" data-start="2848" data-end="3175"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ErrorSample</span><span> {
  </span><span>input</span><span>: </span><span>TVGoldStandardSample</span><span>
  </span><span>predicted</span><span>: </span><span>string</span><span>
  </span><span>expected</span><span>: </span><span>string</span><span>
  confidence?: </span><span>number</span><span>
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ErrorAnalysis</span><span> {
  </span><span>falsePositives</span><span>: </span><span>ErrorSample</span><span>[]
  </span><span>falseNegatives</span><span>: </span><span>ErrorSample</span><span>[]
  suggestions?: </span><span>string</span><span>[] </span><span>// règles/thresholds à explorer</span><span>
}
</span></span></code></div></div></pre>

## Export & Reporting

<pre class="overflow-visible!" data-start="3200" data-end="3474"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>ExportFormat</span><span> = </span><span>"json"</span><span> | </span><span>"csv"</span><span> | </span><span>"latex"</span><span> | </span><span>"word"</span><span>

</span><span>export</span><span></span><span>interface</span><span></span><span>ExportConfig</span><span> {
  </span><span>format</span><span>: </span><span>ExportFormat</span><span>
  </span><span>sections</span><span>: </span><span>Array</span><span><</span><span>"metrics"</span><span> | </span><span>"confusion"</span><span> | </span><span>"errors"</span><span> | </span><span>"recommendations"</span><span>>
  </span><span>includeGraphics</span><span>: </span><span>boolean</span><span>
  template?: </span><span>"thesis"</span><span> | </span><span>"article"</span><span> | </span><span>"report"</span><span>
}
</span></span></code></div></div></pre>

<pre class="overflow-visible!" data-start="3475" data-end="4046"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

## </span><span>`04-API-REFERENCE/types/typesalgorithms.md`</span><span>

</span><span>``</span><span>`md
# Types Algorithms

Contrats des algorithmes AlgorithmLab et métadonnées associées.

## Métadonnées

`</span><span>``</span><span>ts
export </span><span>interface</span><span> AlgorithmMetadata {
  name: </span><span>string</span><span></span><span>// identifiant technique (clé registry)</span><span>
  displayName?: </span><span>string</span><span></span><span>// libellé UI</span><span>
  </span><span>type</span><span>: </span><span>"rule-based"</span><span> | </span><span>"ml"</span><span> | </span><span>"llm"</span><span> | </span><span>"composite"</span><span>
  target: </span><span>"X"</span><span> | </span><span>"Y"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>
  version?: </span><span>string</span><span>
  description?: </span><span>string</span><span>
  batchSupported?: boolean
  apiRequirements?: </span><span>string</span><span>[]           </span><span>// ex.: ["OPENAI_API_KEY"]</span><span>
}
</span></span></code></div></div></pre>

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
</span><span>// Exemple : ALGORITHM_CONFIGS["OpenAIConseiller"] → { target:"X", input:{ format:"simple", fields:["v</span></span></code></div></div></pre>
