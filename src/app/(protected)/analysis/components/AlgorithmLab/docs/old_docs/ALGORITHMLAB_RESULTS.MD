# Ce que sont X, Y, M1, M2, M3 (résumé très court)

# Ce que signifient X, Y, M1, M2, M3

- **X (stratégie du tour conseiller)** : ENGAGEMENT / OUVERTURE / EXPLICATION / REFLET (catégorie discrète).
- **Y (réaction client au tour suivant)** : polarité Positive / Neutre / Négative (catégorie discrète).
- **M1 (médiateur cognitif)** : **densité de verbes d’action** dans le tour conseiller (indicateur numérique, ex. % ou nb/longueur).
- **M2 (médiateur interactionnel)** : **alignement** conseiller↔client (lexical, sémantique, pragmatique + prosodie/timing, p. ex. latence < 400 ms), agrégé en score.
- **M3 (médiateur paralinguistique)** : **charge cognitive observable** du client (pauses > 500 ms, hésitations, demandes de clarification, instabilité prosodique), agrégée en score.

# README – Plan d’évolution ResultsPanel & MetricsPanel

## Objectif général

1. **Un “contrat de données” unique** pour chaque ligne de résultat (`TVValidationResult`) :
   - `predicted`, `goldStandard`, `correct`, `confidence`, etc. restent inchangés.
   - **Ce qu’ils contiennent dépend de la target en cours** :
     - **XY, M2** (catégoriel) → `predicted/goldStandard` sont des **étiquettes** (p. ex. `"X"`, `"Y"`, `"aligné"`, `"non_aligné"`).
     - **M1, M3** (numérique) → `predicted/goldStandard` sont des **valeurs numériques** **encodées en string** (p. ex. `"4"`, `"2.7"`), et `correct` est déjà calculé côté pipeline selon une tolérance métier (si nécessaire).
2. **Colonnes dynamiques** dans le tableau : on injecte des colonnes supplémentaires pertinentes **selon la target** , sans toucher au socle (contexte, prédict/gold, confiance, temps, annot.).
3. **MetricsPanel scindé par type de target** :
   - **ClassificationMetricsPanel** pour XY, M2 (accuracy, F1, kappa, etc.).
   - **NumericMetricsPanel** pour M1, M3 (MAE, RMSE, R², corrélation, biais moyen, etc.).
   - Un **wrapper** `MetricsPanel` choisit le bon sous-panneau.

---

## Vocabulaire / cibles (proposé)

- **XY** : classification binaire (ex. X/Y).
- **M1** : métrique **numérique** (ex. _nombre d’actions_ ).
- **M2** : classification **catégorielle** (ex. _alignement_ ).
- **M3** : métrique **numérique** (ex. _charge cognitive_ ).

> Si la thèse impose d’autres noms/échelles, on adaptera facilement en modifiant la config ci-dessous (pas le code métier).

---

## Contrat de données (types)

### `TVValidationResult` (inchangé côté appelant)

<pre class="overflow-visible!" data-start="1986" data-end="2352"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>TVValidationResult</span><span> {
  </span><span>verbatim</span><span>: </span><span>string</span><span>;
  </span><span>goldStandard</span><span>: </span><span>string</span><span>;   </span><span>// pour M1/M3: stringifié</span><span>
  </span><span>predicted</span><span>: </span><span>string</span><span>;      </span><span>// pour M1/M3: stringifié</span><span>
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  </span><span>correct</span><span>: </span><span>boolean</span><span>;       </span><span>// calculé côté pipeline (tolérance si besoin)</span><span>
  processingTime?: </span><span>number</span><span>;
  metadata?: </span><span>TVMetadata</span><span>;  </span><span>// ← on typpe au lieu de Record<string, any></span><span>
}
</span></span></code></div></div></pre>

### `TVMetadata` (nouveau)

On normalise ce qu’on lit déjà dans le tableau + on prépare des emplacements pour XY/M1/M2/M3 :

<pre class="overflow-visible!" data-start="2478" data-end="3360"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>TVMetadata</span><span> {
  </span><span>// identifiants / contexte</span><span>
  turnId?: </span><span>number</span><span> | </span><span>string</span><span>;
  id?: </span><span>number</span><span> | </span><span>string</span><span>;

  prev2_turn_verbatim?: </span><span>string</span><span>;
  prev1_turn_verbatim?: </span><span>string</span><span>;
  next_turn_verbatim?: </span><span>string</span><span>;

  prev2_speaker?: </span><span>string</span><span>;
  prev1_speaker?: </span><span>string</span><span>;

  </span><span>// infos algorithme / LLM</span><span>
  classifier?: </span><span>string</span><span>;
  </span><span>type</span><span>?: </span><span>string</span><span>;
  model?: </span><span>string</span><span>;
  temperature?: </span><span>number</span><span>;
  maxTokens?: </span><span>number</span><span>;
  rawResponse?: </span><span>string</span><span>;   </span><span>// ← utilisé en tooltip</span><span>
  error?: </span><span>string</span><span>;         </span><span>// ← idem</span><span>

  </span><span>// valeurs de cibles (optionnelles, à titre d'extras pour colonnes dynamiques)</span><span>
  xy?: { value?: </span><span>"X"</span><span> | </span><span>"Y"</span><span>; details?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>> };
  m1?: { value?: </span><span>number</span><span>; unit?: </span><span>"actions"</span><span> | </span><span>string</span><span>; details?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>> };
  m2?: { value?: </span><span>string</span><span>; scale?: </span><span>string</span><span>; details?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>> };
  m3?: { value?: </span><span>number</span><span>; scale?: </span><span>string</span><span>; details?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>> };
}
</span></span></code></div></div></pre>

> **Important** : dans le tableau, la colonne **“Prédit”** affiche **toujours** `predicted` **dans son format canonique** , quelle que soit la target.
>
> - XY/M2 → affiche l’étiquette.
> - M1/M3 → affiche la valeur stringifiée (ex. `“4”`).
>
>   Les **colonnes dynamiques** affichent, elles, **les détails spécifiques** (unités, sous-composantes, explications, etc.).
>
>   Si tu préfères _remplacer_ totalement la colonne « Prédit » par une colonne dynamique dédiée, c’est aussi possible — mais garder « Prédit » nous évite d’avoir des heuristiques partout.

---

## Fichiers à créer / modifier

### 1) `src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsSample/extraColumns.ts` (NOUVEAU)

- Rôle : définir le **type `ExtraColumn`** et une fabrique `buildExtraColumnsForTarget(targetKind)` qui retourne la liste des colonnes additionnelles selon la target.

<pre class="overflow-visible!" data-start="4265" data-end="6118"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>// extraColumns.ts</span><span>
</span><span>import</span><span></span><span>type</span><span> { </span><span>TVValidationResult</span><span> } </span><span>from</span><span></span><span>"./components/types"</span><span>; </span><span>// ajuste le chemin si besoin</span><span>

</span><span>export</span><span></span><span>type</span><span></span><span>TargetKind</span><span> = </span><span>"XY"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>;

</span><span>export</span><span></span><span>type</span><span></span><span>ExtraColumn</span><span> = {
  </span><span>id</span><span>: </span><span>string</span><span>;
  </span><span>header</span><span>: </span><span>string</span><span>;
  width?: </span><span>number</span><span> | </span><span>string</span><span>;
  align?: </span><span>"left"</span><span> | </span><span>"center"</span><span> | </span><span>"right"</span><span>;
  </span><span>render</span><span>: </span><span>(row: TVValidationResult, rowIndex: number</span><span>) => </span><span>React</span><span>.</span><span>ReactNode</span><span>;
};

</span><span>export</span><span></span><span>function</span><span></span><span>buildExtraColumnsForTarget</span><span>(</span><span>kind: TargetKind</span><span>): </span><span>ExtraColumn</span><span>[] {
  </span><span>switch</span><span> (kind) {
    </span><span>case</span><span></span><span>"XY"</span><span>:
      </span><span>return</span><span> [
        {
          </span><span>id</span><span>: </span><span>"xy-detail"</span><span>,
          </span><span>header</span><span>: </span><span>"Détail XY"</span><span>,
          </span><span>width</span><span>: </span><span>160</span><span>,
          </span><span>render</span><span>: </span><span>(r</span><span>) => r.</span><span>metadata</span><span>?.</span><span>xy</span><span>?.</span><span>details</span><span>
            ? </span><span>JSON</span><span>.</span><span>stringify</span><span>(r.</span><span>metadata</span><span>.</span><span>xy</span><span>.</span><span>details</span><span>)
            : </span><span>"—"</span><span>,
        },
      ];

    </span><span>case</span><span></span><span>"M1"</span><span>:
      </span><span>return</span><span> [
        {
          </span><span>id</span><span>: </span><span>"m1-value"</span><span>,
          </span><span>header</span><span>: </span><span>"Nb d’actions (M1)"</span><span>,
          </span><span>width</span><span>: </span><span>140</span><span>,
          </span><span>align</span><span>: </span><span>"center"</span><span>,
          </span><span>render</span><span>: </span><span>(r</span><span>) => {
            </span><span>const</span><span> v = r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>value</span><span> ?? </span><span>Number</span><span>(r.</span><span>predicted</span><span>);
            </span><span>const</span><span> unit = r.</span><span>metadata</span><span>?.</span><span>m1</span><span>?.</span><span>unit</span><span> ?? </span><span>"actions"</span><span>;
            </span><span>return</span><span></span><span>isFinite</span><span>(</span><span>Number</span><span>(v)) ? </span><span>`${v}</span><span></span><span>${unit}</span><span>` : </span><span>"—"</span><span>;
          },
        },
      ];

    </span><span>case</span><span></span><span>"M2"</span><span>:
      </span><span>return</span><span> [
        {
          </span><span>id</span><span>: </span><span>"m2-align"</span><span>,
          </span><span>header</span><span>: </span><span>"Alignement (M2)"</span><span>,
          </span><span>width</span><span>: </span><span>160</span><span>,
          </span><span>render</span><span>: </span><span>(r</span><span>) => r.</span><span>metadata</span><span>?.</span><span>m2</span><span>?.</span><span>value</span><span> ?? r.</span><span>predicted</span><span> ?? </span><span>"—"</span><span>,
        },
      ];

    </span><span>case</span><span></span><span>"M3"</span><span>:
      </span><span>return</span><span> [
        {
          </span><span>id</span><span>: </span><span>"m3-cog"</span><span>,
          </span><span>header</span><span>: </span><span>"Charge cognitive (M3)"</span><span>,
          </span><span>width</span><span>: </span><span>180</span><span>,
          </span><span>align</span><span>: </span><span>"center"</span><span>,
          </span><span>render</span><span>: </span><span>(r</span><span>) => {
            </span><span>const</span><span> v = r.</span><span>metadata</span><span>?.</span><span>m3</span><span>?.</span><span>value</span><span> ?? </span><span>Number</span><span>(r.</span><span>predicted</span><span>);
            </span><span>const</span><span> scale = r.</span><span>metadata</span><span>?.</span><span>m3</span><span>?.</span><span>scale</span><span>
              ? </span><span>` (${r.metadata.m3.scale}</span><span>)`
              : </span><span>""</span><span>;
            </span><span>return</span><span></span><span>isFinite</span><span>(</span><span>Number</span><span>(v)) ? </span><span>`${v}</span><span>${scale}</span><span>` : </span><span>"—"</span><span>;
          },
        },
      ];

    </span><span>default</span><span>:
      </span><span>return</span><span> [];
  }
}
</span></span></code></div></div></pre>

> **On part de 0** : libre à toi d’enrichir chaque `render` avec les champs de la thèse (ex. familles, dimensions…).

---

### 2) `types.ts` (À compléter)

- Rôle : **remplacer** `metadata?: Record<string, any>` par `metadata?: TVMetadata`, et **ajouter** l’interface `TVMetadata` ci-dessus.
- Effet secondaire : corrige **tous les errors TS** du style _“Property 'prev1_turn_verbatim' does not exist on type '{}'”_ en donnant un type à `metadata`.

> Si tu préfères ne pas toucher `types.ts` global, crée un `local-types.ts` au même niveau que `extraColumns.ts` et `import type { TVMetadata }` là où on en a besoin, puis caste `const m = (row.metadata || {}) as TVMetadata;`. Mais le plus propre est d’ **updater `types.ts`** .

---

### 3) `ResultsPanel.tsx` (MODIFIER)

- Rôle : **déterminer la target active** et **construire les colonnes dynamiques** , puis les passer au **Header** et au **Body** .

Patch minimal (extrait) :

<pre class="overflow-visible!" data-start="7049" data-end="7931"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>// imports à ajouter</span><span>
</span><span>import</span><span> { buildExtraColumnsForTarget, </span><span>type</span><span></span><span>TargetKind</span><span> } </span><span>from</span><span></span><span>"../extraColumns"</span><span>;

</span><span>// …dans tes props ou ton state global :</span><span>
</span><span>const</span><span></span><span>targetKind</span><span>: </span><span>TargetKind</span><span> = </span><span>/* "XY" | "M1" | "M2" | "M3" */</span><span>;

</span><span>// fabrique des colonnes dynamiques</span><span>
</span><span>const</span><span> extraColumns = </span><span>useMemo</span><span>(
  </span><span>() =></span><span></span><span>buildExtraColumnsForTarget</span><span>(targetKind),
  [targetKind]
);

</span><span>// puis passer à Header & Body :</span><span>
</span><span><span class="language-xml"><ResultsTableHeader</span></span><span>
  // …</span><span>tes</span><span></span><span>props</span><span></span><span>existantes</span><span>
  // (</span><span>pas</span><span></span><span>besoin</span><span></span><span>d</span><span>’</span><span>y</span><span></span><span>passer</span><span></span><span>extraColumns</span><span></span><span>si</span><span></span><span>le</span><span></span><span>header</span><span></span><span>n</span><span>’</span><span>affiche</span><span></span><span>pas</span><span></span><span>de</span><span></span><span>colonnes</span><span></span><span>dynamiques</span><span>)
  </span><span>totalResults</span><span>=</span><span>{/*</span><span> … */}
  </span><span>totalErrors</span><span>=</span><span>{/*</span><span> … */}
  </span><span>filteredResults</span><span>=</span><span>{/*</span><span> … */}
  </span><span>onlyDisagreements</span><span>=</span><span>{/*</span><span> … */}
  </span><span>onOnlyDisagreementsChange</span><span>=</span><span>{/*</span><span> … */}
/>

</span><span><span class="language-xml"><ResultsTableBody</span></span><span>
  </span><span>pageItems</span><span>=</span><span>{/*</span><span> … */}
  </span><span>page</span><span>=</span><span>{/*</span><span> … */}
  </span><span>rowsPerPage</span><span>=</span><span>{/*</span><span> … */}
  </span><span>totalCount</span><span>=</span><span>{/*</span><span> … */}
  </span><span>onPageChange</span><span>=</span><span>{/*</span><span> … */}
  </span><span>onRowsPerPageChange</span><span>=</span><span>{/*</span><span> … */}
  </span><span>showPagination</span><span>
  </span><span>extraColumns</span><span>=</span><span>{extraColumns}</span><span>
/>
</span></span></code></div></div></pre>

> **Colonne “Prédit”** : on la garde **simple** (valeur canonique de la target). Les **détails** vont dans `extraColumns`. Si tu veux _remplacer_ « Prédit », on peut ajouter une option `hidePredictedColumn` et injecter une colonne dynamique **à la place** .

---

### 4) `ResultsTableBody.tsx` (DÉJÀ fait / À sécuriser)

- Tu as déjà introduit `extraColumns`.
- **Important pour TS** : tape `metadata` avec `TVMetadata` pour supprimer toutes les erreurs du style _Property 'xxx' does not exist on type '{}'_ . Exemple :

<pre class="overflow-visible!" data-start="8453" data-end="8722"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>// en haut du fichier</span><span>
</span><span>import</span><span></span><span>type</span><span> { </span><span>TVMetadata</span><span> } </span><span>from</span><span></span><span>"../types"</span><span>; </span><span>// ajuste le chemin</span><span>

</span><span>// …dans le map :</span><span>
</span><span>const</span><span> m = (r.</span><span>metadata</span><span> || {}) </span><span>as</span><span></span><span>TVMetadata</span><span>;
</span><span>const</span><span> prev2 = m.</span><span>prev2_turn_verbatim</span><span>;
</span><span>const</span><span> prev1 = m.</span><span>prev1_turn_verbatim</span><span>;
</span><span>const</span><span> next1 = m.</span><span>next_turn_verbatim</span><span>;
</span></span></code></div></div></pre>

- Idem pour `rawResponse`, `error`, `turnId`, `id`, etc. (tous définis dans `TVMetadata`).

---

### 5) `MetricsPanel` (SCISSION)

- **Renomme l’actuel** en `MetricsPanel.classification.tsx` (il calcule précision/rappel/F1/Kappa → parfait pour XY, M2).
- **Crée** `MetricsPanel.numeric.tsx` qui calcule :
  - **MAE** (mean absolute error)
  - **RMSE** (root mean squared error)
  - **R²** (coefficient de détermination)
  - **Corrélation de Pearson r**
  - **Biais moyen** (mean error)
- **Crée** un `MetricsPanel.tsx` _wrapper_ :

<pre class="overflow-visible!" data-start="9266" data-end="9958"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-tsx"><span><span>// MetricsPanel.tsx (wrapper)</span><span>
</span><span>import</span><span></span><span>React</span><span></span><span>from</span><span></span><span>"react"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>TVValidationResult</span><span> } </span><span>from</span><span></span><span>"../types"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>TargetKind</span><span> } </span><span>from</span><span></span><span>"../extraColumns"</span><span>;
</span><span>import</span><span></span><span>ClassificationPanel</span><span></span><span>from</span><span></span><span>"./MetricsPanel.classification"</span><span>;
</span><span>import</span><span></span><span>NumericPanel</span><span></span><span>from</span><span></span><span>"./MetricsPanel.numeric"</span><span>;

</span><span>export</span><span></span><span>default</span><span></span><span>function</span><span></span><span>MetricsPanel</span><span>({
  results,
  targetKind,
  classifierLabel,
}: {
  results: TVValidationResult[];
  targetKind: TargetKind;
  classifierLabel?: </span><span>string</span><span>;
}) {
  </span><span>if</span><span> (targetKind === </span><span>"M1"</span><span> || targetKind === </span><span>"M3"</span><span>) {
    </span><span>return</span><span></span><span><span class="language-xml"><NumericPanel</span></span><span></span><span>results</span><span>=</span><span>{results}</span><span></span><span>classifierLabel</span><span>=</span><span>{classifierLabel}</span><span> />;
  }
  </span><span>return</span><span></span><span><span class="language-xml"><ClassificationPanel</span></span><span></span><span>results</span><span>=</span><span>{results}</span><span></span><span>classifierLabel</span><span>=</span><span>{classifierLabel}</span><span> />;
}
</span></span></code></div></div></pre>

> **Conséquence** : le **ResultsPanel** doit passer `targetKind` au `MetricsPanel`.

---

## Checklist de mise en place

1. **Types** : ajouter `TVMetadata` et référencer `metadata?: TVMetadata` dans `TVValidationResult`.
2. **Colonnes dynamiques** : créer `extraColumns.ts` + `buildExtraColumnsForTarget`.
3. **ResultsPanel** : déterminer `targetKind` (en fonction de l’UI/filtre utilisateur), construire `extraColumns`, les passer au `ResultsTableBody`.
4. **ResultsTableBody** : caster `metadata` en `TVMetadata` (supprime les erreurs TS), laisser “Prédit” afficher la valeur canonique, et laisser `extraColumns` rendre le spécifique.
5. **Metrics** : scinder en panneaux classification / numérique + wrapper `MetricsPanel`.
6. **Optionnel** : si tu veux **supprimer** la colonne “Prédit” pour M1/M3, on ajoute un flag `hidePredictedColumn` et on injecte une colonne dynamique “Valeur” à la place (c’est 5 lignes de plus).
