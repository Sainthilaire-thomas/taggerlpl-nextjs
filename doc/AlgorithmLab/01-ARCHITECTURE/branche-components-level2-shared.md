# 📄 `branche-components-level2-shared.md`

<pre class="overflow-visible!" data-start="3798" data-end="4078"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Branche Components Level 2 (Shared)</span><span>

</span><span>## 🎯 Rôle</span><span>
Le </span><span>**Level 2**</span><span> est centré sur la </span><span>**validation scientifique**</span><span>.  
Il permet de relier les performances algorithmiques aux </span><span>**hypothèses de recherche**</span><span> et d’analyser la validité du modèle global.

---

</span><span>## 📂 Structure</span><span>

</span></span></code></div></div></pre>

components/Level2/

├── Level2Interface.tsx

├── config/

│   └── hypotheses.ts

├── hooks/

│   └── useH1Analysis.ts

├── hypothesis/

│   ├── H2AlignmentValidation.tsx

│   └── H3ApplicationValidation.tsx

├── shared/

│   ├── DataProcessing.ts

│   ├── stats.ts

│   └── types.ts

└── validation/

├── StatisticalSummary.tsx

└── StatisticalTestsPanel.tsx

<pre class="overflow-visible!" data-start="4431" data-end="5500"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span>## 📊 Interfaces principales</span><span>

</span><span>### `Level2Interface.tsx`</span><span>
</span><span>-</span><span></span><span>Point</span><span></span><span>d’entrée</span><span></span><span>du</span><span></span><span>Level</span><span></span><span>2</span><span>.</span><span>  
</span><span>-</span><span></span><span>Organisation</span><span></span><span>par</span><span></span><span>hypothèses</span><span></span><span>scientifiques</span><span></span><span>(H1-H2-H3).</span><span>  

</span><span>### Hypothèses testées</span><span>
</span><span>-</span><span></span><span>**H1**</span><span></span><span>:</span><span></span><span>efficacité</span><span></span><span>communication.</span><span>  
</span><span>-</span><span></span><span>**H2**</span><span></span><span>:</span><span></span><span>charge</span><span></span><span>cognitive</span><span></span><span>↔</span><span></span><span>performance.</span><span>  
</span><span>-</span><span></span><span>**H3**</span><span></span><span>:</span><span></span><span>apprentissage</span><span></span><span>organisationnel.</span><span>  

---

</span><span>## 🧩 Modules de validation</span><span>

</span><span>-</span><span></span><span>**`StatisticalSummary.tsx`**</span><span></span><span>:</span><span></span><span>synthèse</span><span></span><span>descriptive.</span><span>  
</span><span>-</span><span></span><span>**`StatisticalTestsPanel.tsx`**</span><span></span><span>:</span><span></span><span>tests</span><span></span><span>statistiques</span><span></span><span>(ANOVA,</span><span></span><span>t-tests,</span><span></span><span>corrélations).</span><span>  
</span><span>-</span><span></span><span>**`DataProcessing.ts`**</span><span></span><span>:</span><span></span><span>pipeline</span><span></span><span>traitement</span><span></span><span>données.</span><span>  
</span><span>-</span><span></span><span>**`stats.ts`**</span><span></span><span>:</span><span></span><span>fonctions</span><span></span><span>statistiques</span><span></span><span>partagées.</span><span>  

---

</span><span>## 🔄 Workflow scientifique</span><span>

</span><span>1</span><span>.</span><span></span><span>Import</span><span></span><span>résultats</span><span></span><span>algorithmiques</span><span></span><span>(Level</span><span></span><span>1</span><span>).</span><span>  
</span><span>2</span><span>.</span><span></span><span>Transformation</span><span></span><span>et</span><span></span><span>agrégation</span><span></span><span>(`DataProcessing.ts`).</span><span>  
</span><span>3</span><span>.</span><span></span><span>Application</span><span></span><span>tests</span><span></span><span>statistiques</span><span></span><span>(`stats.ts`).</span><span>  
</span><span>4</span><span>.</span><span></span><span>Validation</span><span></span><span>ou</span><span></span><span>rejet</span><span></span><span>d’hypothèses</span><span></span><span>(H1-H3).</span><span>  
</span><span>5</span><span>.</span><span></span><span>Export</span><span></span><span>rapport</span><span></span><span>scientifique</span><span></span><span>(`ScientificReport`).</span><span>  

---

</span><span>## ✅ Points clés</span><span>
</span><span>-</span><span></span><span>**Level</span><span></span><span>2</span><span></span><span>=</span><span></span><span>validation</span><span></span><span>théorique**.</span><span>  
</span><span>-</span><span></span><span>**Lien</span><span></span><span>direct</span><span></span><span>avec</span><span></span><span>la</span><span></span><span>recherche</span><span></span><span>académique**.</span><span>  
</span><span>-</span><span></span><span>**Modules</span><span></span><span>stats</span><span></span><span>réutilisables**</span><span></span><span>pour</span><span></span><span>d’autres</span><span></span><span>projets.</span><span></span></span></code></div></div></pre>
