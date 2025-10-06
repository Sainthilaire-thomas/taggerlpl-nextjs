
# Document 1 : Préparation de la vue matérialisée H2

## Objectif

Créer une vue SQL optimisée qui pré-calcule les paires **Conseiller→Client** et leurs résultats M1/M2/M3, permettant un chargement instantané de l'analyse H2.

---

## Étape 1 : Création de la vue matérialisée

<pre class="overflow-visible!" data-start="418" data-end="3646"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>-- Vue matérialisée : paires + métadonnées + placeholders pour résultats</span><span>
</span><span>CREATE</span><span> MATERIALIZED </span><span>VIEW</span><span> h2_analysis_pairs </span><span>AS</span><span>
</span><span>SELECT</span><span> 
</span><span>-- Identifiants uniques</span><span>
  </span><span>ROW_NUMBER</span><span>() </span><span>OVER</span><span> (</span><span>ORDER</span><span></span><span>BY</span><span> t0.call_id, t0.start_time) </span><span>AS</span><span> pair_id,
  t0.id </span><span>AS</span><span> conseiller_turn_id,
  t1.id </span><span>AS</span><span> client_turn_id,
  t0.call_id,
  
</span><span>-- Métadonnées temporelles</span><span>
  t0.start_time </span><span>AS</span><span> conseiller_start_time,
  t0.end_time   </span><span>AS</span><span> conseiller_end_time,
  t1.start_time </span><span>AS</span><span> client_start_time,
  t1.end_time   </span><span>AS</span><span> client_end_time,
  (t1.start_time </span><span>-</span><span> t0.end_time) </span><span>AS</span><span> latency_ms,
  
</span><span>-- Tags et verbatims</span><span>
  lt0.family    </span><span>AS</span><span> strategy_family,   </span><span>-- famille du tag (conseiller)</span><span>
  lt0.label     </span><span>AS</span><span> strategy_tag,      </span><span>-- tag précis conseiller</span><span>
  t1.tag        </span><span>AS</span><span> reaction_tag,      </span><span>-- tag brut client</span><span>
  t0.verbatim   </span><span>AS</span><span> conseiller_verbatim,
  t1.verbatim   </span><span>AS</span><span> client_verbatim,
  
</span><span>-- Résultats M1 (densité verbes d'action) - à calculer</span><span>
  </span><span>NULL</span><span>::</span><span>NUMERIC</span><span></span><span>AS</span><span> m1_verb_density,
  </span><span>NULL</span><span>::</span><span>INTEGER</span><span></span><span>AS</span><span> m1_verb_count,
  </span><span>NULL</span><span>::</span><span>INTEGER</span><span></span><span>AS</span><span> m1_total_words,
  </span><span>NULL</span><span>::TEXT[]  </span><span>AS</span><span> m1_action_verbs,
  
</span><span>-- Résultats M2 (alignement linguistique) - à calculer</span><span>
  </span><span>NULL</span><span>::</span><span>NUMERIC</span><span></span><span>AS</span><span> m2_lexical_alignment,
  </span><span>NULL</span><span>::</span><span>NUMERIC</span><span></span><span>AS</span><span> m2_semantic_alignment,
  </span><span>NULL</span><span>::</span><span>NUMERIC</span><span></span><span>AS</span><span> m2_global_alignment,
  </span><span>NULL</span><span>::TEXT[]  </span><span>AS</span><span> m2_shared_terms,
  
</span><span>-- Résultats M3 (charge cognitive) - à calculer</span><span>
  </span><span>NULL</span><span>::</span><span>INTEGER</span><span></span><span>AS</span><span> m3_hesitation_count,
  </span><span>NULL</span><span>::</span><span>INTEGER</span><span></span><span>AS</span><span> m3_clarification_count,
  </span><span>NULL</span><span>::</span><span>NUMERIC</span><span></span><span>AS</span><span> m3_cognitive_score,
  </span><span>NULL</span><span>::TEXT    </span><span>AS</span><span> m3_cognitive_load, </span><span>-- 'LOW' | 'MEDIUM' | 'HIGH'</span><span>
  </span><span>NULL</span><span>::JSONB   </span><span>AS</span><span> m3_patterns,       </span><span>-- {hesitations: [], pauses: [], explicitPauses: []}</span><span>
  
</span><span>-- Métadonnées de calcul</span><span>
  </span><span>NULL</span><span>::</span><span>TIMESTAMP</span><span></span><span>AS</span><span> computed_at,
  </span><span>NULL</span><span>::TEXT      </span><span>AS</span><span> computation_status </span><span>-- 'PENDING' | 'COMPUTED' | 'ERROR'</span><span>

</span><span>FROM</span><span> turntagged t0
</span><span>JOIN</span><span> lpltag lt0
  </span><span>ON</span><span> lt0.id </span><span>=</span><span> t0.tag_id </span><span>OR</span><span> lt0.label </span><span>=</span><span> t0.tag
</span><span>INNER</span><span></span><span>JOIN</span><span> turntagged t1 </span><span>ON</span><span> 
  t1.call_id </span><span>=</span><span> t0.call_id 
  </span><span>AND</span><span> t1.start_time </span><span>></span><span> t0.end_time
  </span><span>AND</span><span> t1.id </span><span>=</span><span> (
    </span><span>-- Sélectionner le tour CLIENT immédiatement suivant</span><span>
    </span><span>SELECT</span><span> id 
    </span><span>FROM</span><span> turntagged tt1
    </span><span>JOIN</span><span> lpltag lt1 </span><span>ON</span><span> lt1.id </span><span>=</span><span> tt1.tag_id </span><span>OR</span><span> lt1.label </span><span>=</span><span> tt1.tag
    </span><span>WHERE</span><span> tt1.call_id </span><span>=</span><span> t0.call_id 
      </span><span>AND</span><span> tt1.start_time </span><span>></span><span> t0.end_time
      </span><span>AND</span><span> tt1.tag ILIKE </span><span>'CLIENT_%'</span><span>
    </span><span>ORDER</span><span></span><span>BY</span><span> tt1.start_time </span><span>ASC</span><span> 
    LIMIT </span><span>1</span><span>
  )
</span><span>WHERE</span><span> 
</span><span>-- Filtrer seulement les tours CONSEILLER par FAMILLE (pas par préfixe de tag)</span><span>
  lt0.family </span><span>IN</span><span> (</span><span>'ENGAGEMENT'</span><span>,</span><span>'OUVERTURE'</span><span>,</span><span>'EXPLICATION'</span><span>,</span><span>'REFLET'</span><span>)
</span><span>-- Vérifier que t1 est bien un tour CLIENT</span><span>
  </span><span>AND</span><span> t1.tag ILIKE </span><span>'CLIENT_%'</span><span>;

</span><span>-- Index pour optimiser les requêtes</span><span>
</span><span>CREATE</span><span> INDEX idx_h2_pairs_strategy      </span><span>ON</span><span> h2_analysis_pairs(strategy_tag);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_strategyfam   </span><span>ON</span><span> h2_analysis_pairs(strategy_family);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_reaction      </span><span>ON</span><span> h2_analysis_pairs(reaction_tag);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_call          </span><span>ON</span><span> h2_analysis_pairs(call_id);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_status        </span><span>ON</span><span> h2_analysis_pairs(computation_status);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_conseiller_id </span><span>ON</span><span> h2_analysis_pairs(conseiller_turn_id);
</span><span>CREATE</span><span> INDEX idx_h2_pairs_client_id     </span><span>ON</span><span> h2_analysis_pairs(client_turn_id);

</span><span>-- Fonction pour rafraîchir la vue</span><span>
</span><span>CREATE</span><span></span><span>OR</span><span> REPLACE </span><span>FUNCTION</span><span> refresh_h2_analysis_pairs()
</span><span>RETURNS</span><span> void </span><span>AS</span><span> $$
</span><span>BEGIN</span><span>
  REFRESH MATERIALIZED </span><span>VIEW</span><span> CONCURRENTLY h2_analysis_pairs;
</span><span>END</span><span>;
$$ </span><span>LANGUAGE</span><span> plpgsql;
</span></span></code></div></div></pre>

---

## Étape 2 : Script de pré-calcul TypeScript

**Fichier** : `scripts/precompute-h2-results.ts`

<pre class="overflow-visible!" data-start="3749" data-end="9032"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-typescript"><span><span>import</span><span> { createClient } </span><span>from</span><span></span><span>'@supabase/supabase-js'</span><span>;
</span><span>import</span><span> { algorithmRegistry } </span><span>from</span><span></span><span>'@/algorithms/level1/shared/AlgorithmRegistry'</span><span>;

</span><span>const</span><span> supabase = </span><span>createClient</span><span>(
  process.</span><span>env</span><span>.</span><span>NEXT_PUBLIC_SUPABASE_URL</span><span>!,
  process.</span><span>env</span><span>.</span><span>SUPABASE_SERVICE_ROLE_KEY</span><span>! </span><span>// Clé service pour accès admin</span><span>
);

</span><span>interface</span><span> H2Pair {
  </span><span>pair_id</span><span>: </span><span>number</span><span>;
  </span><span>conseiller_turn_id</span><span>: </span><span>number</span><span>;
  </span><span>client_turn_id</span><span>: </span><span>number</span><span>;
  </span><span>conseiller_verbatim</span><span>: </span><span>string</span><span>;
  </span><span>client_verbatim</span><span>: </span><span>string</span><span>;
  </span><span>latency_ms</span><span>: </span><span>number</span><span>;
  </span><span>strategy_tag</span><span>: </span><span>string</span><span>;
  </span><span>computation_status</span><span>: </span><span>string</span><span> | </span><span>null</span><span>;
}

</span><span>async</span><span></span><span>function</span><span></span><span>precomputeH2Results</span><span>(</span><span></span><span>) {
  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>'🚀 Démarrage du pré-calcul H2...'</span><span>);

  </span><span>// 1. Charger les paires non calculées</span><span>
  </span><span>const</span><span> { </span><span>data</span><span>: pairs, error } = </span><span>await</span><span> supabase
    .</span><span>from</span><span>(</span><span>'h2_analysis_pairs'</span><span>)
    .</span><span>select</span><span>(</span><span>'pair_id, conseiller_turn_id, client_turn_id, conseiller_verbatim, client_verbatim, latency_ms, strategy_tag, computation_status'</span><span>)
    .</span><span>or</span><span>(</span><span>'computation_status.is.null,computation_status.eq.PENDING,computation_status.eq.ERROR'</span><span>)
    .</span><span>order</span><span>(</span><span>'pair_id'</span><span>);

  </span><span>if</span><span> (error) {
    </span><span>console</span><span>.</span><span>error</span><span>(</span><span>'❌ Erreur chargement paires:'</span><span>, error);
    </span><span>return</span><span>;
  }

  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`📊 ${pairs.length}</span><span> paires à calculer`);

  </span><span>// 2. Initialiser les algorithmes</span><span>
  </span><span>const</span><span> m1Algorithm = algorithmRegistry.</span><span>get</span><span>(</span><span>'M1ActionVerbCounter'</span><span>);
  </span><span>const</span><span> m2Algorithm = algorithmRegistry.</span><span>get</span><span>(</span><span>'M2CompositeAlignment'</span><span>);
  </span><span>const</span><span> m3Algorithm = algorithmRegistry.</span><span>get</span><span>(</span><span>'PausesM3Calculator'</span><span>);

  </span><span>if</span><span> (!m1Algorithm || !m2Algorithm || !m3Algorithm) {
    </span><span>console</span><span>.</span><span>error</span><span>(</span><span>'❌ Algorithmes manquants dans le registre'</span><span>);
    </span><span>return</span><span>;
  }

  </span><span>// 3. Traitement par batch de 50</span><span>
  </span><span>const</span><span></span><span>BATCH_SIZE</span><span> = </span><span>50</span><span>;
  </span><span>let</span><span> processed = </span><span>0</span><span>;
  </span><span>let</span><span> errors = </span><span>0</span><span>;

  </span><span>for</span><span> (</span><span>let</span><span> i = </span><span>0</span><span>; i < pairs.</span><span>length</span><span>; i += </span><span>BATCH_SIZE</span><span>) {
    </span><span>const</span><span> batch = pairs.</span><span>slice</span><span>(i, i + </span><span>BATCH_SIZE</span><span>);
    </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`\n🔄 Batch ${Math</span><span>.floor(i / BATCH_SIZE) + </span><span>1</span><span>}/</span><span>${Math</span><span>.ceil(pairs.length / BATCH_SIZE)}`);

    </span><span>const</span><span> updates = </span><span>await</span><span></span><span>Promise</span><span>.</span><span>all</span><span>(
      batch.</span><span>map</span><span>(</span><span>async</span><span> (pair) => {
        </span><span>try</span><span> {
          </span><span>// M1: Densité verbes d'action</span><span>
          </span><span>const</span><span> m1Result = </span><span>await</span><span> m1Algorithm.</span><span>run</span><span>(pair.</span><span>conseiller_verbatim</span><span>);
        
          </span><span>// M2: Alignement linguistique</span><span>
          </span><span>const</span><span> m2Result = </span><span>await</span><span> m2Algorithm.</span><span>run</span><span>({
            </span><span>t0</span><span>: pair.</span><span>conseiller_verbatim</span><span>,
            </span><span>t1</span><span>: pair.</span><span>client_verbatim</span><span>
          });
        
          </span><span>// M3: Charge cognitive</span><span>
          </span><span>const</span><span> m3Result = </span><span>await</span><span> m3Algorithm.</span><span>run</span><span>(pair.</span><span>client_verbatim</span><span>);
        
          </span><span>// Détection clarifications (hors M3)</span><span>
          </span><span>const</span><span> clarificationPattern = </span><span>/(comment|quoi|pardon|c'est-à-dire|je ne comprends)/gi</span><span>;
          </span><span>const</span><span> clarificationCount = (pair.</span><span>client_verbatim</span><span>.</span><span>match</span><span>(clarificationPattern) || []).</span><span>length</span><span>;
        
          </span><span>// Détermination charge cognitive</span><span>
          </span><span>const</span><span> hesitationCount = m3Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>hesitationCount</span><span> || </span><span>0</span><span>;
          </span><span>let</span><span></span><span>cognitiveLoad</span><span>: </span><span>'LOW'</span><span> | </span><span>'MEDIUM'</span><span> | </span><span>'HIGH'</span><span> = </span><span>'LOW'</span><span>;
        
          </span><span>if</span><span> (pair.</span><span>latency_ms</span><span> > </span><span>800</span><span> || hesitationCount > </span><span>2</span><span> || clarificationCount > </span><span>0</span><span>) {
            cognitiveLoad = </span><span>'HIGH'</span><span>;
          } </span><span>else</span><span></span><span>if</span><span> (pair.</span><span>latency_ms</span><span> > </span><span>400</span><span> || hesitationCount > </span><span>0</span><span>) {
            cognitiveLoad = </span><span>'MEDIUM'</span><span>;
          }

          processed++;
        
          </span><span>return</span><span> {
            </span><span>pair_id</span><span>: pair.</span><span>pair_id</span><span>,
            </span><span>// M1</span><span>
            </span><span>m1_verb_density</span><span>: m1Result.</span><span>metadata</span><span>?.</span><span>density</span><span> || </span><span>0</span><span>,
            </span><span>m1_verb_count</span><span>: m1Result.</span><span>metadata</span><span>?.</span><span>actionVerbCount</span><span> || </span><span>0</span><span>,
            </span><span>m1_total_words</span><span>: m1Result.</span><span>metadata</span><span>?.</span><span>totalTokens</span><span> || </span><span>0</span><span>,
            </span><span>m1_action_verbs</span><span>: m1Result.</span><span>metadata</span><span>?.</span><span>verbsFound</span><span> || [],
            </span><span>// M2</span><span>
            </span><span>m2_lexical_alignment</span><span>: m2Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>lexicalAlignment</span><span> || </span><span>0</span><span>,
            </span><span>m2_semantic_alignment</span><span>: m2Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>semanticAlignment</span><span> || </span><span>0</span><span>,
            </span><span>m2_global_alignment</span><span>: m2Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>overall</span><span> || </span><span>0</span><span>,
            </span><span>m2_shared_terms</span><span>: m2Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>sharedTerms</span><span> || [],
            </span><span>// M3</span><span>
            </span><span>m3_hesitation_count</span><span>: hesitationCount,
            </span><span>m3_clarification_count</span><span>: clarificationCount,
            </span><span>m3_cognitive_score</span><span>: m3Result.</span><span>metadata</span><span>?.</span><span>details</span><span>?.</span><span>value</span><span> || </span><span>0</span><span>,
            </span><span>m3_cognitive_load</span><span>: cognitiveLoad,
            </span><span>m3_patterns</span><span>: m3Result.</span><span>metadata</span><span>?.</span><span>extra</span><span>?.</span><span>patterns</span><span> || { </span><span>hesitations</span><span>: [], </span><span>pauses</span><span>: [], </span><span>explicitPauses</span><span>: [] },
            </span><span>// Métadonnées</span><span>
            </span><span>computed_at</span><span>: </span><span>new</span><span></span><span>Date</span><span>().</span><span>toISOString</span><span>(),
            </span><span>computation_status</span><span>: </span><span>'COMPUTED'</span><span>
          };

        } </span><span>catch</span><span> (error) {
          errors++;
          </span><span>console</span><span>.</span><span>error</span><span>(</span><span>`  ❌ Erreur pair_id ${pair.pair_id}</span><span>:`, error);
        
          </span><span>return</span><span> {
            </span><span>pair_id</span><span>: pair.</span><span>pair_id</span><span>,
            </span><span>computation_status</span><span>: </span><span>'ERROR'</span><span>,
            </span><span>computed_at</span><span>: </span><span>new</span><span></span><span>Date</span><span>().</span><span>toISOString</span><span>()
          };
        }
      })
    );

    </span><span>// 4. Mise à jour en base</span><span>
    </span><span>const</span><span> { </span><span>error</span><span>: updateError } = </span><span>await</span><span> supabase
      .</span><span>from</span><span>(</span><span>'h2_analysis_pairs'</span><span>)
      .</span><span>upsert</span><span>(updates, { </span><span>onConflict</span><span>: </span><span>'pair_id'</span><span> });

    </span><span>if</span><span> (updateError) {
      </span><span>console</span><span>.</span><span>error</span><span>(</span><span>'  ❌ Erreur mise à jour batch:'</span><span>, updateError);
    } </span><span>else</span><span> {
      </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`  ✅ ${updates.length}</span><span> paires mises à jour`);
    }
  }

  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>'\n📈 Résumé:'</span><span>);
  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`  ✅ Calculées: ${processed}</span><span>`);
  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`  ❌ Erreurs: ${errors}</span><span>`);
  </span><span>console</span><span>.</span><span>log</span><span>(</span><span>`  📊 Total: ${pairs.length}</span><span>`);
}

</span><span>// Exécution</span><span>
</span><span>precomputeH2Results</span><span>()
  .</span><span>then</span><span>(</span><span>() =></span><span></span><span>console</span><span>.</span><span>log</span><span>(</span><span>'\n✅ Pré-calcul terminé'</span><span>))
  .</span><span>catch</span><span>(</span><span>(err</span><span>) => </span><span>console</span><span>.</span><span>error</span><span>(</span><span>'\n❌ Erreur fatale:'</span><span>, err))
  .</span><span>finally</span><span>(</span><span>() =></span><span> process.</span><span>exit</span><span>());
</span></span></code></div></div></pre>

---

## Étape 3 : Configuration package.json

<pre class="overflow-visible!" data-start="9080" data-end="9174"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"scripts"</span><span>:</span><span></span><span>{</span><span>
    </span><span>"precompute:h2"</span><span>:</span><span></span><span>"tsx scripts/precompute-h2-results.ts"</span><span>
  </span><span>}</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

---

## Étape 4 : Validation de la vue

<pre class="overflow-visible!" data-start="9216" data-end="9921"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>-- Vérifier le nombre de paires créées</span><span>
</span><span>SELECT</span><span> 
  computation_status,
  </span><span>COUNT</span><span>(</span><span>*</span><span>) </span><span>as</span><span> count
</span><span>FROM</span><span> h2_analysis_pairs
</span><span>GROUP</span><span></span><span>BY</span><span> computation_status;

</span><span>-- Distribution par stratégie</span><span>
</span><span>SELECT</span><span> 
  strategy_tag,
  </span><span>COUNT</span><span>(</span><span>*</span><span>) </span><span>as</span><span> count,
  </span><span>AVG</span><span>(m1_verb_density) </span><span>as</span><span> avg_verb_density,
  </span><span>AVG</span><span>(m2_global_alignment) </span><span>as</span><span> avg_alignment,
  </span><span>AVG</span><span>(m3_cognitive_score) </span><span>as</span><span> avg_cognitive_load
</span><span>FROM</span><span> h2_analysis_pairs
</span><span>WHERE</span><span> computation_status </span><span>=</span><span></span><span>'COMPUTED'</span><span>
</span><span>GROUP</span><span></span><span>BY</span><span> strategy_tag
</span><span>ORDER</span><span></span><span>BY</span><span> strategy_tag;

</span><span>-- Vérifier les latences</span><span>
</span><span>SELECT</span><span> 
  strategy_tag,
  </span><span>AVG</span><span>(latency_ms) </span><span>as</span><span> avg_latency,
  </span><span>MIN</span><span>(latency_ms) </span><span>as</span><span> min_latency,
  </span><span>MAX</span><span>(latency_ms) </span><span>as</span><span> max_latency
</span><span>FROM</span><span> h2_analysis_pairs
</span><span>WHERE</span><span> computation_status </span><span>=</span><span></span><span>'COMPUTED'</span><span>
</span><span>GROUP</span><span></span><span>BY</span><span> strategy_tag;
</span></span></code></div></div></pre>

---

## Étape 5 : Maintenance

<pre class="overflow-visible!" data-start="9954" data-end="10229"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>-- Rafraîchir la vue après ajout de nouveaux turntagged</span><span>
</span><span>SELECT</span><span> refresh_h2_analysis_pairs();

</span><span>-- Recalculer les paires en erreur</span><span>
</span><span>UPDATE</span><span> h2_analysis_pairs
</span><span>SET</span><span> computation_status </span><span>=</span><span></span><span>'PENDING'</span><span>
</span><span>WHERE</span><span> computation_status </span><span>=</span><span></span><span>'ERROR'</span><span>;

</span><span>-- Puis relancer: npm run precompute:h2</span><span>
</span></span></code></div></div></pre>

---

## Notes importantes

1. **Clé service Supabase** : Le script nécessite `SUPABASE_SERVICE_ROLE_KEY` pour contourner les RLS.
2. **Durée d'exécution** : ~5-10 minutes pour 1000 paires (selon puissance machine).
3. **Idempotence** : Le script peut être relancé sans risque (via `upsert`).
4. **Incrémentalité** : Seules les paires `PENDING` ou `ERROR` sont recalculées.
5. **Différence clé** :
   * Côté  **CONSEILLER** , on utilise la **famille du tag** (`lpltag.family`).
   * Côté  **CLIENT** , on utilise le **tag brut** enregistré dans `turntagged`.

---

*Document 1/2 - Préparation vue H2*

*Version 1.1 - 2025-10-01 (correction famille de tag)*
