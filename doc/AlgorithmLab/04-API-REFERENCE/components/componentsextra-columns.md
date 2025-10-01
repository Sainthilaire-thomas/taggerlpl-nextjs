
# ExtraColumns

Composant d’extension de tableau (ResultsPanel / MetricsPanel) pour injecter des colonnes supplémentaires.

## Props

<pre class="overflow-visible!" data-start="1239" data-end="1512"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ExtraColumn</span><span><T = </span><span>any</span><span>> {
  </span><span>key</span><span>: </span><span>string</span><span>
  </span><span>header</span><span>: </span><span>string</span><span>
  </span><span>render</span><span>: </span><span>(row: T</span><span>) => </span><span>React</span><span>.</span><span>ReactNode</span><span>
  width?: </span><span>number</span><span> | </span><span>string</span><span>
  align?: </span><span>"left"</span><span> | </span><span>"center"</span><span> | </span><span>"right"</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ExtraColumnsProps</span><span><T = </span><span>any</span><span>> {
  </span><span>rows</span><span>: T[]
  </span><span>columns</span><span>: </span><span>ExtraColumn</span><span><T>[]
}
</span></span></code></div></div></pre>

## Fonctionnalités

* **Injection déclarative** de colonnes custom dans un tableau existant.
* **Support flexible** : largeur fixe, auto, ou proportionnelle.
* **Alignement** configurable par colonne.
* **Accès complet au row** via `render`.
* Peut être combiné avec `ResultsPanel` pour enrichir les résultats (ex. ajouter un bouton “Inspecter”).

## Exemple

<pre class="overflow-visible!" data-start="1884" data-end="2257" data-is-last-node=""><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>ResultsPanel</span><span>
  rows={results}
  filters={filters}
  metrics={metrics}
  byTag={byTag}
  onRowClick={open}
>
  </span><span><span class="language-xml"><ExtraColumns</span></span><span>
    </span><span>rows</span><span>=</span><span>{results}</span><span>
    </span><span>columns</span><span>=</span><span>{[</span><span>
      {
        </span><span>key:</span><span> "</span><span>inspect</span><span>",
        </span><span>header:</span><span> "</span><span>Inspecter</span><span>",
        </span><span>render:</span><span> (</span><span>row</span><span>) => </span><span><button</span><span></span><span>onClick</span><span>=</span><span>{()</span><span> => openInspector(row)}>🔍</span><span></button</span><span>>,
        align: "center",
      },
    ]}
  />
</</span><span>ResultsPanel</span><span>></span></span></code></div></div></pre>
