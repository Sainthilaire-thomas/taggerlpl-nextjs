
## `BaseAlgorithm<TInput, TOutput>`

Contrat minimal pour tout algorithme AlgorithmLab.

<pre class="overflow-visible!" data-start="849" data-end="1369"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmMetadata</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>
  displayName?: </span><span>string</span><span>
  </span><span>type</span><span>: </span><span>"rule-based"</span><span> | </span><span>"ml"</span><span> | </span><span>"llm"</span><span> | </span><span>"composite"</span><span></span><span>// (inclut "metric" via types universels)</span><span>
  </span><span>target</span><span>: </span><span>"X"</span><span> | </span><span>"Y"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>
  version?: </span><span>string</span><span>
  description?: </span><span>string</span><span>
  batchSupported?: </span><span>boolean</span><span>
  apiRequirements?: </span><span>string</span><span>[]
}

</span><span>export</span><span></span><span>interface</span><span></span><span>BaseAlgorithm</span><span><</span><span>TInput</span><span>, </span><span>TOutput</span><span>> {
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>Promise</span><span><</span><span>TOutput</span><span>>
  runBatch?(</span><span>inputs</span><span>: </span><span>TInput</span><span>[]): </span><span>Promise</span><span><</span><span>TOutput</span><span>[]>
  </span><span>describe</span><span>(): </span><span>AlgorithmMetadata</span><span>
  validateConfig?(): </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

### Helpers

<pre class="overflow-visible!" data-start="1383" data-end="1477"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>supportsBatch</span><span>(algo): </span><span>boolean</span><span>
hasMethod<T>(</span><span>obj</span><span>: T | </span><span>undefined</span><span>, </span><span>key</span><span>: keyof T): </span><span>boolean</span><span>
</span></span></code></div></div></pre>

### Interop legacy (à utiliser uniquement si nécessaire)

<pre class="overflow-visible!" data-start="1536" data-end="1662"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>wrapLegacyClassifier</span><span>(legacy, target, displayName?)
→ </span><span>UniversalAlgorithm</span><span> (qui expose run / describe / validateConfig)
</span></span></code></div></div></pre>

> ℹ️ Même si le wrapper existe, **ne documente et n’expose pas** les anciens “classifiers/*” dans l’UI.
>
