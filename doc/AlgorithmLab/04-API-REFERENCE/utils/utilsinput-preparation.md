# 04-API-REFERENCE / utils / utilsinput-preparation.md

## Objet

Prépare des **inputs typés** pour chaque algorithme selon sa config d’entrée.

### API

<pre class="overflow-visible!" data-start="7946" data-end="8108"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>prepareInputsForAlgorithm</span><span>(</span><span>samples</span><span>: </span><span>TVGoldStandardSample</span><span>[], </span><span>algorithmName</span><span>: </span><span>string</span><span>): </span><span>any</span><span>[]
</span><span>debugPreparedInputs</span><span>(</span><span>inputs</span><span>: </span><span>any</span><span>[], </span><span>algorithmName</span><span>: </span><span>string</span><span>): </span><span>void</span><span>
</span></span></code></div></div></pre>

### Notes

* Se base sur `ALGORITHM_CONFIGS[algorithmName]` (format d’entrée attendu : `"simple"`, etc.).
* Lève une erreur si l’algo n’a pas de config connue.
