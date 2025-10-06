# Document 2 : Stockage des essais Level 1 & Overlay H2

## Objectif

* Permettre de **stocker chaque essai** (run) lors du développement et de la mise au point des algorithmes Level 1 (X, Y, M1, M2, M3).
* Conserver les **prédictions détaillées** et les  **métriques agrégées** .
* Pouvoir **superposer un run choisi** (overlay) sur la vue `h2_analysis_pairs` pour alimenter la validation scientifique H2.

---

## Étape 1 : Schéma de persistance Level 1

### 1. Table des runs

<pre class="overflow-visible!" data-start="720" data-end="1477"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> level1_runs (
  id                bigserial </span><span>primary</span><span> key,
  created_at        </span><span>timestamp</span><span></span><span>not</span><span></span><span>null</span><span></span><span>default</span><span> now(),
  created_by        text,                     </span><span>-- utilisateur si dispo</span><span>
  target_kind       text </span><span>not</span><span></span><span>null</span><span>,            </span><span>-- 'X' | 'Y' | 'M1' | 'M2' | 'M3'</span><span>
  algorithm_key     text </span><span>not</span><span></span><span>null</span><span>,            </span><span>-- clé du registre (ex: 'M1ActionVerbCounter')</span><span>
  algorithm_version text,                     </span><span>-- version interne de l'algo</span><span>
  git_commit        text,                     </span><span>-- SHA pour traçabilité</span><span>
  dataset_id        text,                     </span><span>-- corpus/filtre utilisé</span><span>
  sample_size       </span><span>int</span><span>,
  seed              </span><span>int</span><span>,
  params            jsonb </span><span>default</span><span></span><span>'{}'</span><span>::jsonb,</span><span>-- hyperparams/regex/etc.</span><span>
  notes             text
);
</span></span></code></div></div></pre>

### 2. Table des prédictions

<pre class="overflow-visible!" data-start="1509" data-end="1957"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> level1_predictions (
  run_id            </span><span>bigint</span><span></span><span>not</span><span></span><span>null</span><span></span><span>references</span><span> level1_runs(id) </span><span>on</span><span></span><span>delete</span><span> cascade,
  item_id           </span><span>bigint</span><span></span><span>not</span><span></span><span>null</span><span>,          </span><span>-- ex: turn_id ou pair_id</span><span>
  item_scope        text </span><span>not</span><span></span><span>null</span><span>,            </span><span>-- 'turn' | 'pair'</span><span>
  universal_result  jsonb </span><span>not</span><span></span><span>null</span><span>,           </span><span>-- UniversalResult (prediction, confidence, details)</span><span>
  runtime_ms        </span><span>int</span><span>,
  </span><span>primary</span><span> key (run_id, item_id, item_scope)
);
</span></span></code></div></div></pre>

### 3. Table des métriques agrégées

<pre class="overflow-visible!" data-start="1996" data-end="2387"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> level1_metrics (
  run_id            </span><span>bigint</span><span></span><span>not</span><span></span><span>null</span><span></span><span>references</span><span> level1_runs(id) </span><span>on</span><span></span><span>delete</span><span> cascade,
  metric_name       text </span><span>not</span><span></span><span>null</span><span>,            </span><span>-- 'accuracy' | 'f1' | 'mae' | 'rmse'...</span><span>
  metric_value      </span><span>double precision</span><span></span><span>not</span><span></span><span>null</span><span>,
  details           jsonb,                    </span><span>-- confusion_matrix, PR-curve, etc.</span><span>
  </span><span>primary</span><span> key (run_id, metric_name)
);
</span></span></code></div></div></pre>

---

## Étape 2 : Stockage des résultats H2 associés à un run

Pour relier un run Level 1 aux paires `h2_analysis_pairs`, on crée une table de résultats :

<pre class="overflow-visible!" data-start="2545" data-end="3351"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> h2_analysis_pairs_results (
  run_id                </span><span>bigint</span><span></span><span>not</span><span></span><span>null</span><span></span><span>references</span><span> level1_runs(id) </span><span>on</span><span></span><span>delete</span><span> cascade,
  pair_id               </span><span>bigint</span><span></span><span>not</span><span></span><span>null</span><span>,  </span><span>-- h2_analysis_pairs.pair_id</span><span>
  </span><span>-- Résultats M1</span><span>
  m1_verb_density       </span><span>numeric</span><span>,
  m1_verb_count         </span><span>int</span><span>,
  m1_total_words        </span><span>int</span><span>,
  m1_action_verbs       text[],
  </span><span>-- Résultats M2</span><span>
  m2_lexical_alignment  </span><span>numeric</span><span>,
  m2_semantic_alignment </span><span>numeric</span><span>,
  m2_global_alignment   </span><span>numeric</span><span>,
  m2_shared_terms       text[],
  </span><span>-- Résultats M3</span><span>
  m3_hesitation_count   </span><span>int</span><span>,
  m3_clarification_count </span><span>int</span><span>,
  m3_cognitive_score    </span><span>numeric</span><span>,
  m3_cognitive_load     text,
  m3_patterns           jsonb,
  computed_at           </span><span>timestamp</span><span></span><span>not</span><span></span><span>null</span><span></span><span>default</span><span> now(),
  computation_status    text,
  </span><span>primary</span><span> key (run_id, pair_id)
);
</span></span></code></div></div></pre>

---

## Étape 3 : Vue de consommation (Overlay)

On définit une vue qui combine la MV `h2_analysis_pairs` et les résultats d’un run Level 1 choisi :

<pre class="overflow-visible!" data-start="3503" data-end="4255"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>or</span><span> replace </span><span>view</span><span> h2_analysis_pairs_view </span><span>as</span><span>
</span><span>with</span><span> selected_run </span><span>as</span><span> (
  </span><span>select</span><span> r.id </span><span>as</span><span> run_id, r.target_kind
  </span><span>from</span><span> level1_runs r
  </span><span>where</span><span> r.target_kind </span><span>in</span><span> (</span><span>'M1'</span><span>,</span><span>'M2'</span><span>,</span><span>'M3'</span><span>)
  </span><span>order</span><span></span><span>by</span><span> r.created_at </span><span>desc</span><span>
  limit </span><span>1</span><span>
)
</span><span>select</span><span>
  p.</span><span>*</span><span>,
  pr.m1_verb_density, pr.m1_verb_count, pr.m1_total_words, pr.m1_action_verbs,
  pr.m2_lexical_alignment, pr.m2_semantic_alignment, pr.m2_global_alignment, pr.m2_shared_terms,
  pr.m3_hesitation_count, pr.m3_clarification_count, pr.m3_cognitive_score, pr.m3_cognitive_load, pr.m3_patterns,
  pr.computed_at, pr.computation_status,
  sr.run_id </span><span>as</span><span> active_run_id
</span><span>from</span><span> h2_analysis_pairs p
</span><span>left</span><span></span><span>join</span><span> selected_run sr </span><span>on</span><span></span><span>true</span><span>
</span><span>left</span><span></span><span>join</span><span> h2_analysis_pairs_results pr
  </span><span>on</span><span> pr.pair_id </span><span>=</span><span> p.pair_id </span><span>and</span><span> pr.run_id </span><span>=</span><span> sr.run_id;
</span></span></code></div></div></pre>

👉 Cette vue affiche automatiquement les résultats du  **dernier run M1/M2/M3** , mais on peut la paramétrer (via RPC ou API) pour cibler un run spécifique.

---

## Étape 4 : Intégration côté scripts / UI

### Script TypeScript (extrait)

<pre class="overflow-visible!" data-start="4495" data-end="6287"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span> { createClient } </span><span>from</span><span></span><span>'@supabase/supabase-js'</span><span>;
</span><span>import</span><span> { algorithmRegistry } </span><span>from</span><span></span><span>'@/algorithms/level1/shared/AlgorithmRegistry'</span><span>;

</span><span>const</span><span> sb = </span><span>createClient</span><span>(process.</span><span>env</span><span>.</span><span>NEXT_PUBLIC_SUPABASE_URL</span><span>!, process.</span><span>env</span><span>.</span><span>SUPABASE_SERVICE_ROLE_KEY</span><span>!);

</span><span>export</span><span></span><span>async</span><span></span><span>function</span><span></span><span>runAndPersistLevel1</span><span>({
  targetKind, algorithmKey, params, dataset, seed, sampleSize
}) {
  </span><span>// 1) Créer le run</span><span>
  </span><span>const</span><span> { </span><span>data</span><span>: runRow } = </span><span>await</span><span> sb.</span><span>from</span><span>(</span><span>'level1_runs'</span><span>)
    .</span><span>insert</span><span>({
      </span><span>target_kind</span><span>: targetKind,
      </span><span>algorithm_key</span><span>: algorithmKey,
      params, </span><span>dataset_id</span><span>: dataset, seed, </span><span>sample_size</span><span>: sampleSize,
      </span><span>algorithm_version</span><span>: </span><span>'v1'</span><span>, </span><span>git_commit</span><span>: process.</span><span>env</span><span>.</span><span>GIT_COMMIT</span><span>
    })
    .</span><span>select</span><span>()
    .</span><span>single</span><span>();

  </span><span>const</span><span> runId = runRow.</span><span>id</span><span>;

  </span><span>// 2) Charger les items (turns ou paires)</span><span>
  </span><span>const</span><span> items = </span><span>await</span><span></span><span>loadItemsForTarget</span><span>(targetKind, sampleSize);

  </span><span>// 3) Exécuter l’algo</span><span>
  </span><span>const</span><span> algo = algorithmRegistry.</span><span>get</span><span>(algorithmKey);
  </span><span>const</span><span> preds = [];
  </span><span>for</span><span> (</span><span>const</span><span> it </span><span>of</span><span> items) {
    </span><span>const</span><span> t0 = </span><span>Date</span><span>.</span><span>now</span><span>();
    </span><span>const</span><span> res = </span><span>await</span><span> algo.</span><span>run</span><span>(it.</span><span>input</span><span>);
    preds.</span><span>push</span><span>({
      </span><span>run_id</span><span>: runId,
      </span><span>item_id</span><span>: it.</span><span>id</span><span>,
      </span><span>item_scope</span><span>: it.</span><span>scope</span><span>,
      </span><span>universal_result</span><span>: res,
      </span><span>runtime_ms</span><span>: </span><span>Date</span><span>.</span><span>now</span><span>() - t0
    });
  }

  </span><span>await</span><span> sb.</span><span>from</span><span>(</span><span>'level1_predictions'</span><span>).</span><span>insert</span><span>(preds);

  </span><span>// 4) Calculer métriques</span><span>
  </span><span>const</span><span> metrics = </span><span>computeMetricsForTarget</span><span>(targetKind, preds);
  </span><span>await</span><span> sb.</span><span>from</span><span>(</span><span>'level1_metrics'</span><span>).</span><span>upsert</span><span>(metrics.</span><span>map</span><span>(</span><span>m</span><span> => ({
    </span><span>run_id</span><span>: runId, </span><span>metric_name</span><span>: m.</span><span>name</span><span>, </span><span>metric_value</span><span>: m.</span><span>value</span><span>, </span><span>details</span><span>: m.</span><span>details</span><span> ?? </span><span>null</span><span>
  })));

  </span><span>// 5) Projeter vers H2 si M1/M2/M3</span><span>
  </span><span>if</span><span> ([</span><span>'M1'</span><span>,</span><span>'M2'</span><span>,</span><span>'M3'</span><span>].</span><span>includes</span><span>(targetKind)) {
    </span><span>const</span><span> h2Rows = </span><span>projectUniversalToH2Pairs</span><span>(preds);
    </span><span>await</span><span> sb.</span><span>from</span><span>(</span><span>'h2_analysis_pairs_results'</span><span>).</span><span>upsert</span><span>(
      h2Rows.</span><span>map</span><span>(</span><span>r</span><span> => ({ </span><span>run_id</span><span>: runId, ...r })), { </span><span>onConflict</span><span>: </span><span>'run_id,pair_id'</span><span> }
    );
  }

  </span><span>return</span><span> runId;
}
</span></span></code></div></div></pre>

---

## Étape 5 : Utilisation dans l’UI

* **Level 1 (Individual/Comparison)**
  * Bouton “💾 Sauver ce run” → crée un `level1_run` + `predictions` + `metrics`.
  * Permet ensuite de naviguer entre runs, comparer leurs métriques, et décider lequel projeter sur H2.
* **H2 (Validation scientifique)**
  * Sélecteur de run (dropdown) pour choisir le `run_id` actif.
  * Vue `h2_analysis_pairs_view` affiche automatiquement les résultats associés.
  * Possibilité de comparer plusieurs runs H2 en parallèle (via jointures multiples).

---

## Notes importantes

1. **Traçabilité** : chaque run est historisé avec `git_commit`, `dataset_id`, `params`.
2. **Flexibilité** : les `universal_result` restent en JSON pour s’adapter à tous les algos.
3. **Overlay H2** : pas besoin de recalculer la MV, on projette les résultats Level 1 sur `pair_id`.
4. **Comparaison** : la table `level1_metrics` permet de trier/sélectionner les runs selon la qualité.
5. **UI** : simple — un dropdown `run_id` dans H2 permet de basculer entre essais.



```mermaid
erDiagram
  level1_runs ||--o{ level1_predictions : has
  level1_runs ||--o{ level1_metrics : has
  level1_runs ||--o{ h2_analysis_pairs_results : overlays

  h2_analysis_pairs ||--o{ h2_analysis_pairs_results : by_pair_id
  h2_analysis_pairs ||--|| h2_analysis_pairs_view : feeds
  h2_analysis_pairs_results ||--|| h2_analysis_pairs_view : joins
  level1_runs ||--|| h2_analysis_pairs_view : selects_run

  level1_runs {
    bigserial id PK
    timestamp created_at
    text created_by
    text target_kind
    text algorithm_key
    text algorithm_version
    text git_commit
    text dataset_id
    int  sample_size
    int  seed
    jsonb params
    text notes
  }

  level1_predictions {
    bigint run_id FK
    bigint item_id
    text   item_scope
    jsonb  universal_result
    int    runtime_ms
    PK (run_id, item_id, item_scope)
  }

  level1_metrics {
    bigint run_id FK
    text   metric_name
    float  metric_value
    jsonb  details
    PK (run_id, metric_name)
  }

  h2_analysis_pairs {
    bigint pair_id PK
    bigint conseiller_turn_id
    bigint client_turn_id
    text   strategy_family
    text   strategy_tag
    text   reaction_tag
    numeric latency_ms
    -- autres colonnes / placeholders
  }

  h2_analysis_pairs_results {
    bigint run_id FK
    bigint pair_id FK
    numeric m1_verb_density
    int     m1_verb_count
    int     m1_total_words
    text[]  m1_action_verbs
    numeric m2_lexical_alignment
    numeric m2_semantic_alignment
    numeric m2_global_alignment
    text[]  m2_shared_terms
    int     m3_hesitation_count
    int     m3_clarification_count
    numeric m3_cognitive_score
    text    m3_cognitive_load
    jsonb   m3_patterns
    timestamp computed_at
    text    computation_status
    PK (run_id, pair_id)
  }

  h2_analysis_pairs_view {
    -- = h2_analysis_pairs + h2_analysis_pairs_results (pour run actif)
  }

```

---

*Document 2/2 - Stockage des essais Level 1 & Overlay H2*

*Version 1.0 - 2025-10-01*
