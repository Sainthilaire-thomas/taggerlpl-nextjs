
# ResultsPanel

Composant central d’affichage des résultats de classification.

## Props

<pre class="overflow-visible!" data-start="90" data-end="1022"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>ResultRow</span><span> {
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

</span><span>export</span><span></span><span>interface</span><span></span><span>ResultFilters</span><span> {
  predictedTags?: </span><span>string</span><span>[]
  expectedTags?: </span><span>string</span><span>[]
  search?: </span><span>string</span><span>
  onlyErrors?: </span><span>boolean</span><span>
  page?: </span><span>number</span><span>
  pageSize?: </span><span>10</span><span> | </span><span>25</span><span> | </span><span>50</span><span> | </span><span>100</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>SimpleMetrics</span><span> {
  </span><span>accuracy</span><span>: </span><span>number</span><span>
  </span><span>correct</span><span>: </span><span>number</span><span>
  </span><span>total</span><span>: </span><span>number</span><span>
  </span><span>avgProcessingTime</span><span>: </span><span>number</span><span>
  </span><span>avgConfidence</span><span>: </span><span>number</span><span>
  kappa?: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>TagMetrics</span><span> {
  </span><span>tag</span><span>: </span><span>string</span><span>
  </span><span>precision</span><span>: </span><span>number</span><span>
  </span><span>recall</span><span>: </span><span>number</span><span>
  </span><span>f1</span><span>: </span><span>number</span><span>
  </span><span>support</span><span>: </span><span>number</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ResultsPanelProps</span><span> {
  </span><span>rows</span><span>: </span><span>ResultRow</span><span>[]
  filters?: </span><span>ResultFilters</span><span>
  metrics?: </span><span>SimpleMetrics</span><span>
  byTag?: </span><span>TagMetrics</span><span>[]
  loading?: </span><span>boolean</span><span>
  onRowClick?: </span><span>(row: ResultRow</span><span>) => </span><span>void</span><span>
}
</span></span></code></div></div></pre>

## Fonctionnalités

* **Tableau paginé** (10/25/50/100 par page).
* **Filtres** : tags prédits/réels, texte libre,  *errors only* .
* **Indicators** : ✓ correct / ✗ erreur (comparaison expected vs predicted).
* **Colonnes optionnelles** : `next_turn_verbatim`, `next_turn_tag`, `processingTime`, `confidence`.
* **Tooltips** pour verbatims longs, troncature configurable.
* **Row click** : remonte l’item via `onRowClick` (intégration supervision).
* **État de chargement** : squelette/loader lorsque `loading=true`.

## Bonnes pratiques

* Toujours fournir `filters.page` et `filters.pageSize` pour un comportement déterministe.
* Normaliser les tags affichés (majuscules/underscores) avant passage au composant pour éviter les écarts visuels.
* Ne pas dépasser ~5 000 lignes rendues à la fois (préférer la pagination côté données).

## Exemple

<pre class="overflow-visible!" data-start="1869" data-end="2085" data-is-last-node=""><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>ResultsPanel</span><span>
  rows={results}
  filters={{ </span><span>onlyErrors</span><span>: </span><span>true</span><span>, </span><span>page</span><span>: </span><span>1</span><span>, </span><span>pageSize</span><span>: </span><span>25</span><span> }}
  metrics={metrics.</span><span>global</span><span>}
  byTag={metrics.</span><span>byTag</span><span>}
  loading={loading}
  onRowClick={</span><span>(row</span><span>) => </span><span>openSupervision</span><span>(row)}
/></span></span></code></div></div></pre>
