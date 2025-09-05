# AlgorithmLab — Table unifiée & colonnes dynamiques (X, Y vs M1/M2/M3)

## Objectif

Conserver l’UI avancée existante (`ResultsPanel`: contexte −2/−1/0/+1, filtres, FT, annotations, pagination) **sans la dupliquer** , et n’ouvrir que des **points d’extension** pour adapter les colonnes **par variable** :

- **X/Y** → classes : “Prédit”, “Réel”, confiance, etc. (+ colonnes d’évidence).
- **M1/M2/M3** → métriques : colonnes numériques spécifiques (ex. `M1 / 100 tk`, `# Verbes`, …).

---

## TL;DR (ce qu’on a fait / à faire)

1. On garde le pipeline `ResultsPanel` → `ResultsTableHeader/Body` **inchangé** pour tout le commun.
2. On ajoute une API **`extraColumns`** (colonnes plug-in) passée de `ResultsPanel` → `ResultsTableBody`.
3. Pour **X/Y** , on conserve **Prédit/Réel** (tags) et on ajoute des colonnes d’évidence / proba.
4. Pour **M1/M2/M3** , on laisse **Prédit/Réel** neutres (ou constants) et **on affiche la valeur** dans des colonnes _extra_ .
5. `MetricsPanel` sait fonctionner en mode **classification** (X/Y) ou **numérique** (M1/…).

---

## Contrat des colonnes dynamiques

<pre class="overflow-visible!" data-start="1530" data-end="1776"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>ExtraColumn</span><span> = {
  </span><span>id</span><span>: </span><span>string</span><span>;
  </span><span>header</span><span>: </span><span>React</span><span>.</span><span>ReactNode</span><span>;                     </span><span>// entête</span><span>
  width?: </span><span>number</span><span>;
  align?: </span><span>"left"</span><span> | </span><span>"center"</span><span> | </span><span>"right"</span><span>;
  </span><span>render</span><span>: </span><span>(row: TVValidationResult, i: number</span><span>) => </span><span>React</span><span>.</span><span>ReactNode</span><span>; </span><span>// cellule</span><span>
};
</span></span></code></div></div></pre>

### ResultsPanel (API)

<pre class="overflow-visible!" data-start="1801" data-end="1957"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>type</span><span></span><span>ResultsPanelProps</span><span> = {
  </span><span>results</span><span>: </span><span>TVValidationResult</span><span>[];
  initialPageSize?: </span><span>number</span><span>;
  extraColumns?: </span><span>ExtraColumn</span><span>[]; </span><span>// ← colonnes “métier”</span><span>
};
</span></span></code></div></div></pre>

> Tout le reste (filtres, fine-tuning, annotations, pagination, contexte) reste tel quel.

---

## Spécifique **X / Y** : la colonne “Prédit” reste un **tag**

- On **ne touche pas** aux colonnes _Prédit_ et _Réel_ (tags normalisés + couleurs).
- On **ajoute** des colonnes dynamiques pour :
  - **Famille** (X uniquement : REFLET / ENGAGEMENT / …)
  - **Évidences** (patterns/rationales)
  - **Top-probas** (si dispo)

**Builder X (exemple)**

<pre class="overflow-visible!" data-start="2409" data-end="3584"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>export</span><span></span><span>const</span><span> buildXColumns = (): </span><span>ExtraColumn</span><span>[] => [
  {
    </span><span>id</span><span>: </span><span>"x-family"</span><span>,
    </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>Famille X</span><span></strong</span><span>>,
    </span><span>width</span><span>: </span><span>130</span><span>,
    </span><span>align</span><span>: </span><span>"center"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => </span><span><span class="language-xml"><Chip</span></span><span></span><span>size</span><span>=</span><span>"small"</span><span></span><span>label</span><span>=</span><span>{r.metadata?.x_details?.family</span><span> ?? "—"} />,
  },
  {
    </span><span>id</span><span>: </span><span>"x-evidence"</span><span>,
    </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>Évidences</span><span></strong</span><span>>,
    </span><span>width</span><span>: </span><span>220</span><span>,
    </span><span>align</span><span>: </span><span>"left"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => {
      </span><span>const</span><span></span><span>ev</span><span>: </span><span>string</span><span>[] = r.</span><span>metadata</span><span>?.</span><span>x_details</span><span>?.</span><span>matchedPatterns</span><span> ?? [];
      </span><span>return</span><span> ev.</span><span>length</span><span> ? (
        </span><span><span class="language-xml"><Stack</span></span><span></span><span>direction</span><span>=</span><span>"row"</span><span></span><span>spacing</span><span>=</span><span>{0.5}</span><span></span><span>sx</span><span>=</span><span>{{</span><span></span><span>flexWrap:</span><span> "</span><span>wrap</span><span>" }}>
          {ev.slice(0, 5).map((e,i)=> </span><span><Chip</span><span></span><span>key</span><span>=</span><span>{i}</span><span></span><span>size</span><span>=</span><span>"small"</span><span></span><span>label</span><span>=</span><span>{e}</span><span></span><span>variant</span><span>=</span><span>"outlined"</span><span> />)}
        </span><span></Stack</span><span>>
      ) : </span><span><span class="language-xml"><></span></span><span>—</span><span></></span><span>;
    },
  },
  {
    </span><span>id</span><span>: </span><span>"x-probs"</span><span>,
    </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>Probas</span><span></strong</span><span>>,
    </span><span>width</span><span>: </span><span>160</span><span>,
    </span><span>align</span><span>: </span><span>"left"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => {
      </span><span>const</span><span></span><span>probs</span><span>: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>number</span><span>> = r.</span><span>metadata</span><span>?.</span><span>x_details</span><span>?.</span><span>probabilities</span><span> ?? {};
      </span><span>const</span><span> top = </span><span>Object</span><span>.</span><span>entries</span><span>(probs).</span><span>sort</span><span>(</span><span>(a,b</span><span>)=> (b[</span><span>1</span><span>]??</span><span>0</span><span>)-(a[</span><span>1</span><span>]??</span><span>0</span><span>)).</span><span>slice</span><span>(</span><span>0</span><span>,</span><span>3</span><span>);
      </span><span>return</span><span> top.</span><span>length</span><span> ? (
        </span><span><span class="language-xml"><Typography</span></span><span></span><span>variant</span><span>=</span><span>"caption"</span><span>>
          {top.map(([k,v]) => `${k}:${(v*100).toFixed(0)}%`).join(" • ")}
        </span><span></Typography</span><span>>
      ) : </span><span><span class="language-xml"><></span></span><span>—</span><span></></span><span>;
    },
  },
];
</span></span></code></div></div></pre>

> Idem pour **Y** (ex. `cues`, `sentimentProxy` via `metadata.y_details`).

---

## Spécifique **M1/M2/M3** : afficher des **métriques**

- Pour **M1** (densité de verbes d’action), on affiche des colonnes numériques :

  `M1 / 100 tk`, `# Verbes`, `Tokens`, `Verbes trouvés`.

- **Option 1 (simple & safe)** : laisser _Prédit/Réel_ neutres (`"M1"`/`"—"`) et **ne pas alimenter** la matrice de conf.
- **Option 2 (avancée)** : un flag `columnLayout` pour masquer/renommer _Prédit/Réel_ (facultatif, plus tard).

**Builder M1 (exemple)**

<pre class="overflow-visible!" data-start="4127" data-end="5173"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>export</span><span></span><span>const</span><span> buildM1Columns = (): </span><span>ExtraColumn</span><span>[] => [
  {
    </span><span>id</span><span>: </span><span>"m1-density"</span><span>,
    </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>M1 / 100 tk</span><span></strong</span><span>>,
    </span><span>width</span><span>: </span><span>120</span><span>,
    </span><span>align</span><span>: </span><span>"center"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => {
      </span><span>const</span><span> v = r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>value</span><span>;
      </span><span>return</span><span></span><span><span class="language-xml"><Chip</span></span><span></span><span>size</span><span>=</span><span>"small"</span><span></span><span>color</span><span>=</span><span>"primary"</span><span></span><span>label</span><span>=</span><span>{Number.isFinite(v)</span><span> ? </span><span>v.toFixed</span><span>(</span><span>2</span><span>) </span><span>:</span><span> "—"} />;
    },
  },
  { </span><span>id</span><span>: </span><span>"m1-count"</span><span>,  </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>># Verbes</span><span></strong</span><span>>, </span><span>width</span><span>: </span><span>110</span><span>, </span><span>align</span><span>: </span><span>"center"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>actionVerbCount</span><span> ?? </span><span>"—"</span><span> },
  { </span><span>id</span><span>: </span><span>"m1-tokens"</span><span>, </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>Tokens</span><span></strong</span><span>>, </span><span>width</span><span>: </span><span>100</span><span>, </span><span>align</span><span>: </span><span>"center"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>totalTokens</span><span> ?? </span><span>"—"</span><span> },
  { </span><span>id</span><span>: </span><span>"m1-verbs"</span><span>,  </span><span>header</span><span>: </span><span><span class="language-xml"><strong</span></span><span>>Verbes trouvés</span><span></strong</span><span>>, </span><span>width</span><span>: </span><span>280</span><span>, </span><span>align</span><span>: </span><span>"left"</span><span>,
    </span><span>render</span><span>: </span><span>r</span><span> => {
      </span><span>const</span><span></span><span>verbs</span><span>: </span><span>string</span><span>[] = r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>verbsFound</span><span> ?? [];
      </span><span>return</span><span> verbs.</span><span>length</span><span> ? (
        </span><span><span class="language-xml"><Stack</span></span><span></span><span>direction</span><span>=</span><span>"row"</span><span></span><span>spacing</span><span>=</span><span>{0.5}</span><span></span><span>sx</span><span>=</span><span>{{</span><span></span><span>flexWrap:</span><span> "</span><span>wrap</span><span>" }}>
          {verbs.slice(0, 8).map((v,i)=> </span><span><Chip</span><span></span><span>key</span><span>=</span><span>{i}</span><span></span><span>size</span><span>=</span><span>"small"</span><span></span><span>label</span><span>=</span><span>{v}</span><span></span><span>variant</span><span>=</span><span>"outlined"</span><span> />)}
        </span><span></Stack</span><span>>
      ) : </span><span><span class="language-xml"><></span></span><span>—</span><span></></span><span>;
    },
  },
];
</span></span></code></div></div></pre>

> **M2/M3** répéteront le même schéma : crée leur algorithme serveur, place la valeur dans `metadata.m2`/`m3`, et fournis un `buildM2Columns()/buildM3Columns()`.

---

## Brancher les colonnes depuis l’écran générique

Dans `BaseAlgorithmTesting.tsx`, on choisit les colonnes selon la variable et on les passe à `ResultsPanel` :

<pre class="overflow-visible!" data-start="5505" data-end="5923"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>import</span><span> { </span><span>ResultsPanel</span><span> } </span><span>from</span><span></span><span>"../shared/results/base/ResultsSample/ResultsPanel"</span><span>;
</span><span>import</span><span> { buildXColumns, buildM1Columns } </span><span>from</span><span></span><span>"../shared/results/base/extraColumns"</span><span>;

</span><span>const</span><span> extraColumns =
  target === </span><span>"X"</span><span> ? </span><span>buildXColumns</span><span>()
: target === </span><span>"Y"</span><span> ? </span><span>buildYColumns</span><span>()
: target === </span><span>"M1"</span><span> ? </span><span>buildM1Columns</span><span>()
: </span><span>/* M2/M3 */</span><span>      [];

</span><span><span class="language-xml"><ResultsPanel</span></span><span></span><span>results</span><span>=</span><span>{testResults}</span><span></span><span>initialPageSize</span><span>=</span><span>{10}</span><span></span><span>extraColumns</span><span>=</span><span>{extraColumns}</span><span> />
</span></span></code></div></div></pre>

---

## MetricsPanel : classification vs numérique

- **X/Y** → `kind="classification"` (par défaut) : accuracy, kappa, F1…
- **M1/M2/M3** → `kind="numeric"` + `accessor` pour lire la valeur :

<pre class="overflow-visible!" data-start="6121" data-end="6373"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>MetricsPanel</span><span>
  classifierLabel={selectedInfo?.</span><span>displayName</span><span> || selectedClassifier}
  results={testResults}
  kind={target === </span><span>"M1"</span><span> ? </span><span>"numeric"</span><span> : </span><span>"classification"</span><span>}
  accessor={target === </span><span>"M1"</span><span> ? </span><span>(r</span><span>) => r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>value</span><span> ?? </span><span>0</span><span> : </span><span>undefined</span><span>}
/>
</span></span></code></div></div></pre>

> KPI numériques proposés : moyenne, médiane, p90, n. (Extensible selon besoins.)

---

## RunPanel : options spécifiques (facultatif)

Expose un `extrasSlot` pour piloter la config serveur (via `PUT /api/algolab/classifiers/[name]`) :

- **M1** : normalisation (tokens), futur proche, périphrases, verbes métier, etc.
- **M2/M3** : seuils, fenêtres, etc.

<pre class="overflow-visible!" data-start="6731" data-end="6829"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span><</span><span>RunPanel</span><span>
  ...
  extrasSlot={target === </span><span>"M1"</span><span> && </span><span><span class="language-xml"><M1Controls</span></span><span></span><span>onApply</span><span>=</span><span>{putConfig}</span><span> />}
/>
</span></span></code></div></div></pre>

---

## `useLevel1Testing` — points clefs

- Étendre `getClassificationTarget` → `"conseiller" | "client" | "M1" | "M2" | "M3"`.
- **Branche M1** :
  - inputs = **T0** (tour conseiller),
  - appel serveur (même si pas LLM),
  - mapping sortie → `metadata.m1 = { value, actionVerbCount, totalTokens, verbsFound }`,
  - **ne pas** alimenter la matrice de conf (mettre `gold/predicted` à `"M1"` ou `"—"`).
- **Y** : garder la logique X mais tagset client.
- **M2/M3** : copier la structure M1 (valeurs dans `metadata.m2/m3`), + leurs colonnes.

---

## Roadmap rapide

- [ ] Finaliser `extraColumns` (déjà patché : body + header + panel).
- [ ] Builders : `buildXColumns`, `buildYColumns`, `buildM1Columns` (puis M2/M3).
- [ ] `MetricsPanel` : mode numeric (OK) + p95/p99 si utile.
- [ ] `RunPanel.extrasSlot` : contrôles M1 (PUT config).
- [ ] (Optionnel) `columnLayout` pour masquer/renommer _Prédit/Réel_ en mode métrique.

---

## Pièges à éviter

- Ne **pas** exécuter d’algos LLM **côté client** (toujours passer par `/api/algolab/classifiers`).
- Toujours stocker les valeurs M1/M2/M3 dans `metadata` pour que la table reste générique.
- Garder les **filtres de tags** visibles seulement pour X/Y (prévoir un flag si besoin).
