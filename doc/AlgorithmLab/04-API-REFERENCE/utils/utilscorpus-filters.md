# 04-API-REFERENCE / utils / utilscorpus-filters.md

## Types

<pre class="overflow-visible!" data-start="8337" data-end="8654"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>interface</span><span></span><span>TVGoldStandardSample</span><span> {
  </span><span>verbatim</span><span>: </span><span>string</span><span>
  </span><span>expectedTag</span><span>: </span><span>string</span><span>
  metadata?: {
    target?: </span><span>"conseiller"</span><span> | </span><span>"client"</span><span>
    callId?: </span><span>string</span><span> | </span><span>number</span><span>
    speaker?: </span><span>string</span><span>
    start?: </span><span>number</span><span>
    end?: </span><span>number</span><span>
    turnId?: </span><span>string</span><span> | </span><span>number</span><span>
    nextOf?: </span><span>string</span><span> | </span><span>number</span><span>
    next_turn_verbatim?: </span><span>string</span><span>
  }
}
</span></span></code></div></div></pre>

## API

<pre class="overflow-visible!" data-start="8663" data-end="8989"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>allowedConseiller</span><span>: </span><span>string</span><span>[]  </span><span>// familles X autorisées</span><span>
</span><span>allowedClient</span><span>: </span><span>string</span><span>[]      </span><span>// familles Y autorisées</span><span>

</span><span>filterCorpusForAlgorithm</span><span>(
  </span><span>goldStandard</span><span>: </span><span>TVGoldStandardSample</span><span>[],
  </span><span>algorithmName</span><span>: </span><span>string</span><span>
): </span><span>TVGoldStandardSample</span><span>[]

</span><span>countSamplesPerAlgorithm</span><span>(
  </span><span>goldStandard</span><span>: </span><span>TVGoldStandardSample</span><span>[]
): </span><span>Record</span><span><</span><span>string</span><span>, </span><span>number</span><span>>
</span></span></code></div></div></pre>

### Comportement

* `filterCorpusForAlgorithm` applique la cible (`X`/`Y`/`M*`) attendue par chaque algo via `ALGORITHM_CONFIGS`.
* `countSamplesPerAlgorithm` itère sur tous les algos connus et renvoie la taille de corpus filtré pour chacun.
