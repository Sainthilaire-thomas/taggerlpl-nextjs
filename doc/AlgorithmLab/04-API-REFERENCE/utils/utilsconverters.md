
# 04-API-REFERENCE / utils / utilsconverters.md

## Objet

Utilitaires de **conversion** entre formats (dont  *legacy → universal* ), chaînage de transformations, et validation.

### Types clés

<pre class="overflow-visible!" data-start="3389" data-end="4840"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>type</span><span></span><span>ConversionDirection</span><span> = </span><span>"TO_UNIVERSAL"</span><span> | </span><span>"FROM_UNIVERSAL"</span><span>

</span><span>interface</span><span></span><span>ConversionConfig</span><span> {
  allowLossy?: </span><span>boolean</span><span>
  strictMode?: </span><span>boolean</span><span>
  defaultValues?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
  customMappings?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>string</span><span>>
}

</span><span>interface</span><span></span><span>ConversionResult</span><span><T = </span><span>unknown</span><span>> {
  </span><span>success</span><span>: </span><span>boolean</span><span>
  </span><span>data</span><span>: T
  </span><span>warnings</span><span>: </span><span>string</span><span>[]
  </span><span>errors</span><span>: </span><span>string</span><span>[]
  </span><span>metadata</span><span>: {
    </span><span>sourceFormat</span><span>: </span><span>string</span><span>
    </span><span>targetFormat</span><span>: </span><span>string</span><span>
    </span><span>conversionTime</span><span>: </span><span>number</span><span>
    </span><span>lossyConversion</span><span>: </span><span>boolean</span><span>
    </span><span>fieldsConverted</span><span>: </span><span>number</span><span>
    </span><span>fieldsSkipped</span><span>: </span><span>number</span><span>
  }
}

</span><span>interface</span><span></span><span>FormatAdapter</span><span><</span><span>TSource</span><span> = </span><span>unknown</span><span>, </span><span>TTarget</span><span> = </span><span>unknown</span><span>> {
  </span><span>name</span><span>: </span><span>string</span><span>
  </span><span>sourceFormat</span><span>: </span><span>string</span><span>
  </span><span>targetFormat</span><span>: </span><span>string</span><span>
  </span><span>convert</span><span>(</span><span>data</span><span>: </span><span>TSource</span><span>, config?: </span><span>Partial</span><span><</span><span>ConversionConfig</span><span>>): </span><span>ConversionResult</span><span><</span><span>TTarget</span><span>>
  </span><span>validate</span><span>(</span><span>data</span><span>: </span><span>TSource</span><span>): </span><span>boolean</span><span>
  getSchema?(): </span><span>unknown</span><span>
  description?: </span><span>string</span><span>
  version?: </span><span>string</span><span>
  supportsBatch?: </span><span>boolean</span><span>
}

</span><span>interface</span><span></span><span>DataTransformation</span><span><</span><span>TInput</span><span> = </span><span>unknown</span><span>, </span><span>TOutput</span><span> = </span><span>unknown</span><span>> {
  </span><span>name</span><span>: </span><span>string</span><span>
  </span><span>transform</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>TOutput</span><span>
  validate?(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>boolean</span><span>
  description?: </span><span>string</span><span>
}

</span><span>interface</span><span></span><span>ChainedTransformation</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>
  </span><span>steps</span><span>: </span><span>DataTransformation</span><span>[]
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>unknown</span><span>): </span><span>unknown</span><span>
  </span><span>validate</span><span>(</span><span>input</span><span>: </span><span>unknown</span><span>): </span><span>boolean</span><span>
}

</span><span>interface</span><span></span><span>LegacyMapping</span><span> {
  </span><span>fields</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>string</span><span>> </span><span>// src.path → dest.path</span><span>
  requiredDefaults?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
  valueMappings?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>>
  customTransforms?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>(value: unknown</span><span>) => </span><span>unknown</span><span>>
}
</span></span></code></div></div></pre>

### Constantes

<pre class="overflow-visible!" data-start="4857" data-end="4927"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>ALGORITHM_LAB_LEGACY_MAPPINGS</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>LegacyMapping</span><span>>
</span></span></code></div></div></pre>

### Fonctions

<pre class="overflow-visible!" data-start="4943" data-end="5573"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>createFormatAdapter<</span><span>TSource</span><span>, </span><span>TTarget</span><span>>(
  </span><span>name</span><span>: </span><span>string</span><span>,
  </span><span>sourceFormat</span><span>: </span><span>string</span><span>,
  </span><span>targetFormat</span><span>: </span><span>string</span><span>,
  </span><span>convert</span><span>: </span><span>(data: TSource, cfg?: Partial<ConversionConfig></span><span>) => </span><span>ConversionResult</span><span><</span><span>TTarget</span><span>>,
  </span><span>validate</span><span>: </span><span>(data: TSource</span><span>) => </span><span>boolean</span><span>,
  getSchema?: </span><span>() =></span><span></span><span>unknown</span><span>
): </span><span>FormatAdapter</span><span><</span><span>TSource</span><span>, </span><span>TTarget</span><span>>

</span><span>createChainedTransformation</span><span>(
  </span><span>name</span><span>: </span><span>string</span><span>,
  </span><span>steps</span><span>: </span><span>DataTransformation</span><span>[]
): </span><span>ChainedTransformation</span><span>

</span><span>convertLegacyToUniversal</span><span>(
  </span><span>legacyRecord</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>,
  </span><span>mappingName</span><span>: </span><span>string</span><span>,
  cfg?: </span><span>Partial</span><span><</span><span>ConversionConfig</span><span>>
): </span><span>ConversionResult</span><span><</span><span>UniversalResult</span><span>>

validateConversionResult<T>(</span><span>r</span><span>: </span><span>ConversionResult</span><span><T>): </span><span>boolean</span><span>
</span></span></code></div></div></pre>

### Exemple d’usage

<pre class="overflow-visible!" data-start="5595" data-end="5952"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>const</span><span> adapter = </span><span>createFormatAdapter</span><span>(
  </span><span>"CSV→Universal"</span><span>,
  </span><span>"csv-row"</span><span>,
  </span><span>"universal"</span><span>,
  </span><span>(row</span><span>) => ({ </span><span>success</span><span>:</span><span>true</span><span>, </span><span>data</span><span>: </span><span>toUniversal</span><span>(row), </span><span>warnings</span><span>:[], </span><span>errors</span><span>:[], </span><span>metadata</span><span>:{ ... } }),
  </span><span>(row</span><span>) => </span><span>typeof</span><span> row === </span><span>"object"</span><span>
)

</span><span>const</span><span> out = adapter.</span><span>convert</span><span>(csvRow, { </span><span>strictMode</span><span>: </span><span>false</span><span> })
</span><span>if</span><span> (!</span><span>validateConversionResult</span><span>(out)) </span><span>throw</span><span></span><span>new</span><span></span><span>Error</span><span>(</span><span>"Bad conversion"</span><span>)</span></span></code></div></div></pre>
