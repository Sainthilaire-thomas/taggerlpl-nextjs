
---
## `04-API-REFERENCE/types/typesui.md`

```md
# Types UI

Types utilisés par les composants d’interface AlgorithmLab (TechnicalValidation, Comparison, etc.).

## Sélecteurs & Filtres

```ts
export interface AlgorithmListItem {
  key: string
  label: string
  type: "rule-based" | "ml" | "llm" | "composite"
  target: "X" | "Y" | "M1" | "M2" | "M3"
  batchSupported?: boolean
  configValid?: boolean
  badges?: string[]                 // ex. ["local","needs-api","fast"]
  tooltip?: string
}

export interface ResultFilters {
  predictedTags?: string[]
  expectedTags?: string[]
  search?: string
  onlyErrors?: boolean
  page?: number
  pageSize?: 10 | 25 | 50 | 100
}
---

## Panneaux de résultats

<pre class="overflow-visible!" data-start="6610" data-end="7042"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ResultRow</span><span> {
  </span><span>verbatim</span><span>: </span><span>string</span><span>
  </span><span>predicted</span><span>: </span><span>string</span><span>
  expected?: </span><span>string</span><span>
  confidence?: </span><span>number</span><span>
  processingTime?: </span><span>number</span><span>
  next_turn_verbatim?: </span><span>string</span><span>
  next_turn_tag?: </span><span>string</span><span>
  hasAudio?: </span><span>boolean</span><span>
  hasTranscript?: </span><span>boolean</span><span>
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ResultsTableProps</span><span> {
  </span><span>rows</span><span>: </span><span>ResultRow</span><span>[]
  filters?: </span><span>ResultFilters</span><span>
  onRowClick?: </span><span>(row: ResultRow</span><span>) => </span><span>void</span><span>
  loading?: </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

## Métriques UI

<pre class="overflow-visible!" data-start="7061" data-end="7318"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>MetricTile</span><span> {
  </span><span>label</span><span>: </span><span>string</span><span>
  </span><span>value</span><span>: </span><span>number</span><span> | </span><span>string</span><span>
  help?: </span><span>string</span><span>
  emphasis?: </span><span>"good"</span><span> | </span><span>"warn"</span><span> | </span><span>"bad"</span><span> | </span><span>"neutral"</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>MetricsPanelProps</span><span> {
  </span><span>global</span><span>: </span><span>SimpleMetrics</span><span>
  byTag?: </span><span>TagMetrics</span><span>[]
  tiles?: </span><span>MetricTile</span><span>[]
}
</span></span></code></div></div></pre>

## États & Progress

<pre class="overflow-visible!" data-start="7341" data-end="7736"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>RunState</span><span> {
  </span><span>running</span><span>: </span><span>boolean</span><span>
  progress?: </span><span>number</span><span></span><span>// 0..100</span><span>
  message?: </span><span>string</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>BenchmarkRow</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>
  </span><span>accuracy</span><span>: </span><span>number</span><span>
  </span><span>avgProcessingTime</span><span>: </span><span>number</span><span>
  </span><span>avgConfidence</span><span>: </span><span>number</span><span>
  rank?: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>BenchmarkTableProps</span><span> {
  </span><span>rows</span><span>: </span><span>BenchmarkRow</span><span>[]
  onSelect?: </span><span>(classifierName: string</span><span>) => </span><span>void</span><span>
  loading?: </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

## Intégration Supervision

<pre class="overflow-visible!" data-start="7766" data-end="8004"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>EnhancedAlgorithmResult</span><span></span><span>extends</span><span></span><span>ResultRow</span><span> {
  callId?: </span><span>string</span><span> | </span><span>number</span><span>
  turnId?: </span><span>string</span><span> | </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>SupervisionOpenRequest</span><span> {
  </span><span>result</span><span>: </span><span>EnhancedAlgorithmResult</span><span>
  </span><span>mode</span><span>: </span><span>"tagging"</span><span> | </span><span>"processing"</span><span>
}
</span></span></code></div></div></pre>

<pre class="overflow-visible!" data-start="8005" data-end="8198" data-is-last-node=""><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"></div></div></pre>
