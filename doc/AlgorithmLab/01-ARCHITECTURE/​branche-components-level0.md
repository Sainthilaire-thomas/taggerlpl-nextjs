# 📄 `branche-components-level0.md`

<pre class="overflow-visible!" data-start="305" data-end="567"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Branche Components Level 0</span><span>

</span><span>## 🎯 Rôle</span><span>
Le </span><span>**Level 0**</span><span> est le point de départ méthodologique : il permet de mesurer l’</span><span>**accord inter-annotateurs**</span><span> et de constituer un </span><span>**gold standard**</span><span> avant toute validation algorithmique.

---

</span><span>## 📂 Structure</span><span>

</span></span></code></div></div></pre>

components/Level0/

└── InterAnnotatorAgreement.tsx

<pre class="overflow-visible!" data-start="619" data-end="1399"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>
---

</span><span>## 🧪 Composant principal</span><span>

</span><span>### `InterAnnotatorAgreement.tsx`</span><span>
</span><span>-</span><span></span><span>Calcule</span><span></span><span>l’accord</span><span></span><span>entre</span><span></span><span>experts</span><span></span><span>humains</span><span></span><span>(ex</span><span></span><span>:</span><span></span><span>**Kappa</span><span></span><span>de</span><span></span><span>Cohen**).</span><span>  
</span><span>-</span><span></span><span>Affiche</span><span></span><span>les</span><span></span><span>désaccords</span><span></span><span>pour</span><span></span><span>permettre</span><span></span><span>une</span><span></span><span>résolution</span><span></span><span>collaborative.</span><span>  
</span><span>-</span><span></span><span>Génère</span><span></span><span>le</span><span></span><span>**corpus</span><span></span><span>certifié**</span><span></span><span>utilisé</span><span></span><span>comme</span><span></span><span>référence</span><span></span><span>pour</span><span></span><span>le</span><span></span><span>Level</span><span></span><span>1</span><span>.</span><span>

---

</span><span>## 🔄 Flux de validation</span><span>

</span><span>1</span><span>.</span><span></span><span>Import</span><span></span><span>d’annotations</span><span></span><span>humaines</span><span></span><span>(plusieurs</span><span></span><span>experts).</span><span>  
</span><span>2</span><span>.</span><span></span><span>Calcul</span><span></span><span>métriques</span><span></span><span>d’accord</span><span></span><span>(`kappa`,</span><span></span><span>`agreementRate`).</span><span>  
</span><span>3</span><span>.</span><span></span><span>Visualisation</span><span></span><span>des</span><span></span><span>zones</span><span></span><span>de</span><span></span><span>désaccord.</span><span>  
</span><span>4</span><span>.</span><span></span><span>Résolution</span><span></span><span>manuelle</span><span></span><span>(convergence</span><span></span><span>vers</span><span></span><span>une</span><span></span><span>vérité</span><span></span><span>de</span><span></span><span>référence).</span><span>  

---

</span><span>## ✅ Points clés</span><span>
</span><span>-</span><span></span><span>**Niveau</span><span></span><span>fondationnel**</span><span></span><span>:</span><span></span><span>indispensable</span><span></span><span>avant</span><span></span><span>toute</span><span></span><span>validation</span><span></span><span>technique.</span><span>  
</span><span>-</span><span></span><span>**Garantie</span><span></span><span>scientifique**</span><span></span><span>:</span><span></span><span>construit</span><span></span><span>le</span><span></span><span>gold</span><span></span><span>standard.</span><span>  
</span><span>-</span><span></span><span>**Intégration**</span><span></span><span>:</span><span></span><span>les</span><span></span><span>données</span><span></span><span>validées</span><span></span><span>passent</span><span></span><span>ensuite</span><span></span><span>en</span><span></span><span>Level</span><span></span><span>1</span><span>.</span><span></span></span></code></div></div></pre>
