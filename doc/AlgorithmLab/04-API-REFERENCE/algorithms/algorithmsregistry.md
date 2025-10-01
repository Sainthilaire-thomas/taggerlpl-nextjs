
## `AlgorithmRegistry`

Registre central d’algorithmes (clé → instance).

### Méthodes

<pre class="overflow-visible!" data-start="1917" data-end="2269"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>register</span><span>(
  </span><span>name</span><span>: </span><span>string</span><span>,
  </span><span>algorithm</span><span>: </span><span>UniversalAlgorithm</span><span> | </span><span>BaseAlgorithm</span><span><</span><span>any</span><span>, </span><span>any</span><span>>,
  meta?: </span><span>Partial</span><span><</span><span>AlgorithmMetadata</span><span>> </span><span>// fusionné dans describe() le cas échéant</span><span>
): </span><span>void</span><span>

</span><span>list</span><span>(): { </span><span>key</span><span>: </span><span>string</span><span>; </span><span>meta</span><span>: </span><span>AlgorithmMetadata</span><span> }[]

</span><span>getAll</span><span>(): </span><span>Map</span><span><</span><span>string</span><span>, </span><span>UniversalAlgorithm</span><span> | </span><span>BaseAlgorithm</span><span><</span><span>any</span><span>, </span><span>any</span><span>>>

</span><span>unregister</span><span>(</span><span>name</span><span>: </span><span>string</span><span>): </span><span>boolean</span><span>

</span><span>clear</span><span>(): </span><span>void</span><span>
</span></span></code></div></div></pre>

### Comportement

* Corrige/“synthétise” des métadonnées manquantes sans faire planter l’UI.
* Si `algorithm.describe` manque, une **métadonnée de secours** est générée.
* `meta` permet d’**overrider** proprement `describe()`.
