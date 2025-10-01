
## `04-API-REFERENCE/components/metrics-panel.md`

## MetricsPanel

Panneau synthétique et détaillé des métriques d’un algorithme.

## Props

```ts
interface MetricsPanelProps {
  global: SimpleMetrics
  byTag?: TagMetrics[]
  tiles?: MetricTile[]
}
```


## Fonctionnalités

* **Tuiles synthétiques** (accuracy, confiance, temps moyen).
* **Tableau par tag** (précision, rappel, F1, support).
* **Kappa** interprété automatiquement (accord faible/moyen/fort).
* **Codes couleur** selon performance.

## Exemple

<pre class="overflow-visible!" data-start="1548" data-end="1811"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>MetricsPanel</span><span>
  </span><span>global</span><span>={metrics.</span><span>global</span><span>}
  byTag={metrics.</span><span>byTag</span><span>}
  tiles={[
    { </span><span>label</span><span>: </span><span>"Accuracy"</span><span>, </span><span>value</span><span>: (metrics.</span><span>global</span><span>.</span><span>accuracy</span><span>*</span><span>100</span><span>).</span><span>toFixed</span><span>(</span><span>1</span><span>)+</span><span>"%"</span><span>, </span><span>emphasis</span><span>: </span><span>"good"</span><span> },
    { </span><span>label</span><span>: </span><span>"Avg Time (ms)"</span><span>, </span><span>value</span><span>: metrics.</span><span>global</span><span>.</span><span>avgProcessingTime</span><span> }
  ]}
/>
</span></span></code></div></div></pre>

<pre class="overflow-visible!" data-start="1812" data-end="2117"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---</span></span></code></div></div></pre>
