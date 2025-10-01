
# AnnotationList

Composant affichant la liste d’annotations (gold standard, corrections, ou supervision).

## Props

<pre class="overflow-visible!" data-start="118" data-end="547"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>Annotation</span><span> {
  </span><span>id</span><span>: </span><span>string</span><span> | </span><span>number</span><span>
  </span><span>verbatim</span><span>: </span><span>string</span><span>
  </span><span>tag</span><span>: </span><span>string</span><span>
  annotator?: </span><span>string</span><span>
  timestamp?: </span><span>string</span><span>
  metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AnnotationListProps</span><span> {
  </span><span>annotations</span><span>: </span><span>Annotation</span><span>[]
  selectedId?: </span><span>string</span><span> | </span><span>number</span><span>
  onSelect?: </span><span>(annotation: Annotation</span><span>) => </span><span>void</span><span>
  onDelete?: </span><span>(id: string</span><span> | </span><span>number</span><span>) => </span><span>void</span><span>
  onEdit?: </span><span>(annotation: Annotation</span><span>) => </span><span>void</span><span>
  loading?: </span><span>boolean</span><span>
}
</span></span></code></div></div></pre>

## Fonctionnalités

* **Affichage en liste verticale** avec sélection possible.
* **Annotations enrichies** (tag colorisé, annotateur, horodatage).
* **Icônes actions** : supprimer, éditer (si callbacks fournis).
* **Gestion d’état** : surbrillance de l’annotation sélectionnée.
* **Loader** si `loading=true`.

## Exemple

<pre class="overflow-visible!" data-start="881" data-end="1098"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>AnnotationList</span><span>
  annotations={goldStandard}
  selectedId={current?.</span><span>id</span><span>}
  onSelect={</span><span>(a</span><span>) => </span><span>setCurrent</span><span>(a)}
  onDelete={</span><span>(id</span><span>) => </span><span>removeAnnotation</span><span>(id)}
  onEdit={</span><span>(a</span><span>) => </span><span>editAnnotation</span><span>(a)}
  loading={loading}
/>
</span></span></code></div></div></pre>
