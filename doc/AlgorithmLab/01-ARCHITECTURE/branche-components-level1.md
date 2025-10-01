# 📄 `branche-components-level1.md`

<pre class="overflow-visible!" data-start="1443" data-end="1707"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Branche Components Level 1</span><span>

</span><span>## 🎯 Rôle</span><span>
Le </span><span>**Level 1**</span><span> correspond à la </span><span>**validation technique des algorithmes**</span><span>.  
Il permet de tester, comparer et affiner les classificateurs et calculateurs pour les variables X/Y/M1/M2/M3.

---

</span><span>## 📂 Structure</span><span>

</span></span></code></div></div></pre>

components/Level1/

├── Level1Interface.tsx

├── TechnicalBenchmark.tsx

├── algorithms/

│   ├── BaseAlgorithmTesting.tsx

│   ├── XClassifiers/

│   ├── YClassifiers/

│   ├── M1Calculators/

│   ├── M2Calculators/

│   └── M3Calculators/

├── comparison/

│   ├── AlgorithmComparison.tsx

│   ├── ClassifierConfiguration.tsx

│   └── CrossValidation.tsx

├── individual/

│   ├── TechnicalValidation/

│   │   ├── TechnicalValidation.tsx

│   │   ├── RunPanel.tsx

│   │   ├── MetricsPanel.tsx

│   │   └── ResultsSample.tsx

│   ├── ConfusionMatrix.tsx

│   ├── EnhancedErrorAnalysis.tsx

│   └── ParameterOptimization.tsx

└── shared/results/

├── ResultsPanel.tsx

├── MetricsPanel.tsx

├── RunPanel.tsx

├── extraColumns.tsx

└── ResultsSample/

<pre class="overflow-visible!" data-start="2452" data-end="3747"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span>## 🖥️ Interfaces principales</span><span>

</span><span>### `Level1Interface.tsx`</span><span>
</span><span>-</span><span> Point d’entrée du Level 1.  
</span><span>-</span><span> Navigation par onglets (Individual / Comparison).  

</span><span>### `TechnicalBenchmark.tsx`</span><span>
</span><span>-</span><span> Comparaison rapide de plusieurs algorithmes.  
</span><span>-</span><span> Affiche classement par métriques.  

---

</span><span>## 🔬 Modes d’utilisation</span><span>

</span><span>### Mode Individual</span><span>
</span><span>-</span><span></span><span>`TechnicalValidation.tsx`</span><span> : orchestration principale.  
</span><span>-</span><span></span><span>`RunPanel`</span><span> : configuration test.  
</span><span>-</span><span></span><span>`MetricsPanel`</span><span> : affichage métriques.  
</span><span>-</span><span></span><span>`ResultsSample`</span><span> : échantillon annoté.  
</span><span>-</span><span> Outils avancés :
</span><span>  -</span><span></span><span>`ConfusionMatrix`</span><span> : heatmap interactive.  
</span><span>  -</span><span></span><span>`EnhancedErrorAnalysis`</span><span> : supervision erreurs.  
</span><span>  -</span><span></span><span>`ParameterOptimization`</span><span> : tuning fin.

</span><span>### Mode Comparison</span><span>
</span><span>-</span><span></span><span>`AlgorithmComparison.tsx`</span><span> : benchmark multi-algo.  
</span><span>-</span><span></span><span>`ClassifierConfiguration.tsx`</span><span> : configuration avancée.  
</span><span>-</span><span></span><span>`CrossValidation.tsx`</span><span> : robustesse via k-fold.  

---

</span><span>## 🧩 Composants partagés</span><span>
</span><span>-</span><span></span><span>`ResultsPanel`</span><span> : tableau de résultats unifié.  
</span><span>-</span><span></span><span>`MetricsPanel`</span><span> : dispatch classification vs numérique.  
</span><span>-</span><span></span><span>`extraColumns.tsx`</span><span> : colonnes dynamiques par variable.  
</span><span>-</span><span></span><span>`AnnotationList`</span><span> : gestion des annotations liées aux résultats.  

---

</span><span>## ✅ Points clés</span><span>
</span><span>-</span><span></span><span>**Level 1 = focus principal**</span><span> (tests algorithmiques).  
</span><span>-</span><span></span><span>**Deux workflows**</span><span> : individual vs comparison.  
</span><span>-</span><span></span><span>**UI modulaire**</span><span> : panels réutilisables.  </span></span></code></div></div></pre>
