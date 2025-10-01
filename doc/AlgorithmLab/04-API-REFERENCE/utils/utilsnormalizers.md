
# 04-API-REFERENCE / utils / utilsnormalizers.md

## Objet

Normalisation **labels et texte** pour unifier l’entrée/sortie (majuscules, underscores, familles X/Y, presets).

### Types

<pre class="overflow-visible!" data-start="6142" data-end="6674"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>type</span><span></span><span>NormalizationLevel</span><span> = </span><span>"BASIC"</span><span> | </span><span>"STANDARD"</span><span> | </span><span>"AGGRESSIVE"</span><span>

</span><span>interface</span><span></span><span>NormalizationConfig</span><span> {
  </span><span>level</span><span>: </span><span>NormalizationLevel</span><span>
  </span><span>preserveCase</span><span>: </span><span>boolean</span><span>
  trimWhitespace?: </span><span>boolean</span><span>
  collapseSpaces?: </span><span>boolean</span><span>
  removePunctuation?: </span><span>boolean</span><span>
  customRules?: </span><span>NormalizationRule</span><span>[]
}

</span><span>interface</span><span></span><span>NormalizationRule</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>
  </span><span>test</span><span>: </span><span>(s: string</span><span>) => </span><span>boolean</span><span>
  </span><span>apply</span><span>: </span><span>(s: string</span><span>) => </span><span>string</span><span>
  description?: </span><span>string</span><span>
}

</span><span>interface</span><span></span><span>NormalizationResult</span><span> {
  </span><span>original</span><span>: </span><span>string</span><span>
  </span><span>normalized</span><span>: </span><span>string</span><span>
  </span><span>appliedRules</span><span>: </span><span>string</span><span>[]
  </span><span>warnings</span><span>: </span><span>string</span><span>[]
}
</span></span></code></div></div></pre>

### API

<pre class="overflow-visible!" data-start="6684" data-end="7579"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>normalizeXLabel</span><span>(</span><span>label</span><span>: </span><span>string</span><span>, cfg?: </span><span>Partial</span><span><</span><span>NormalizationConfig</span><span>>): </span><span>XTag</span><span>
</span><span>normalizeYLabel</span><span>(</span><span>label</span><span>: </span><span>string</span><span>, cfg?: </span><span>Partial</span><span><</span><span>NormalizationConfig</span><span>>): </span><span>YTag</span><span>

</span><span>familyFromX</span><span>(</span><span>tag</span><span>: </span><span>XTag</span><span>): </span><span>string</span><span>
</span><span>familyFromY</span><span>(</span><span>tag</span><span>: </span><span>YTag</span><span>): </span><span>string</span><span>

</span><span>normalizeText</span><span>(</span><span>text</span><span>: </span><span>string</span><span>, cfg?: </span><span>Partial</span><span><</span><span>NormalizationConfig</span><span>>): </span><span>NormalizationResult</span><span>
</span><span>applyCustomRules</span><span>(</span><span>text</span><span>: </span><span>string</span><span>, </span><span>rules</span><span>: </span><span>NormalizationRule</span><span>[]): </span><span>string</span><span>

</span><span>X_LABEL_MAPPING</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>XTag</span><span>>
</span><span>Y_LABEL_MAPPING</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>YTag</span><span>>
</span><span>FAMILY_MAPPING</span><span>: { </span><span>X</span><span>: </span><span>Record</span><span><</span><span>XTag</span><span>, </span><span>string</span><span>>; </span><span>Y</span><span>: </span><span>Record</span><span><</span><span>YTag</span><span>, </span><span>string</span><span>> }

</span><span>NORMALIZATION_PRESETS</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>NormalizationConfig</span><span>>
</span><span>DEFAULT_NORMALIZATION_RULES</span><span>: </span><span>NormalizationRule</span><span>[]

</span><span>validateNormalizationConfig</span><span>(</span><span>cfg</span><span>: </span><span>Partial</span><span><</span><span>NormalizationConfig</span><span>>): </span><span>boolean</span><span>
</span><span>createNormalizationRule</span><span>(name, test, apply, description?): </span><span>NormalizationRule</span><span>

</span><span>isValidXTag</span><span>(</span><span>tag</span><span>: </span><span>string</span><span>): tag is </span><span>XTag</span><span>
</span><span>isValidYTag</span><span>(</span><span>tag</span><span>: </span><span>string</span><span>): tag is </span><span>YTag</span><span>
</span><span>getFamilyFromTag</span><span>(</span><span>tag</span><span>: </span><span>XTag</span><span> | </span><span>YTag</span><span>): </span><span>string</span><span>
</span></span></code></div></div></pre>

### Exemple

<pre class="overflow-visible!" data-start="7593" data-end="7787"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>const</span><span> tag = </span><span>normalizeXLabel</span><span>(</span><span>" ouverture  "</span><span>)
</span><span>const</span><span> fam = </span><span>familyFromX</span><span>(tag) </span><span>// "OUVERTURE"</span><span>

</span><span>const</span><span> text = </span><span>normalizeText</span><span>(</span><span>"  Bonjour,   comment puis-je vous aider ?  "</span><span>, { </span><span>level</span><span>:</span><span>"STANDARD"</span><span> })</span></span></code></div></div></pre>
