
# 📄 `README.md` (02-CORE-CONCEPTS)

<pre class="overflow-visible!" data-start="376" data-end="2022"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-markdown"><span><span># Core Concepts AlgorithmLab</span><span>

</span><span>## 🎯 Objectif</span><span>
Cette section définit les </span><span>**concepts scientifiques fondamentaux**</span><span> utilisés dans AlgorithmLab :  
</span><span>-</span><span> Variables de la thèse (X, Y, M1, M2, M3)  
</span><span>-</span><span> Typologie des algorithmes (classificateurs vs calculateurs)  
</span><span>-</span><span> Métriques de validation (Accuracy, MAE, Kappa, etc.)  
</span><span>-</span><span> Niveaux de validation scientifique (Level 0 → Level 2)  

---

</span><span>## 📚 Contenu</span><span>

</span><span>-</span><span></span><span>**[Variables</span><span>](</span><span>variables.md</span><span>)** – Définitions, hiérarchie et règles de priorité  
</span><span>-</span><span></span><span>**[Algorithmes</span><span>](</span><span>algorithms.md</span><span>)** – Classification vs Calcul, interfaces, implémentations  
</span><span>-</span><span></span><span>**[Métriques</span><span>](</span><span>metrics.md</span><span>)** – Accuracy, F1, MAE, RMSE, R², Kappa, etc.  
</span><span>-</span><span></span><span>**[Niveaux de validation</span><span>](</span><span>validation-levels.md</span><span>)** – Workflow scientifique (Level 0/1/2)  

---

</span><span>## 🏗️ Schéma conceptuel global</span><span>

```mermaid
graph TD
    subgraph VARIABLES
        X[Conseiller<br/>Stratégies]
        Y[Client<br/>Réactions]
        M1[Densité<br/>verbes action]
        M2[Alignement<br/>X→Y]
        M3[Charge<br/>cognitive]
    end

    subgraph ALGORITHMES
        CLS[Classificateurs<br/>(X,Y,M2)]
        CALC[Calculateurs<br/>(M1,M3)]
    end

    subgraph METRIQUES
        C_METRICS[Classification<br/>Accuracy, F1, Kappa]
        N_METRICS[Numérique<br/>MAE, RMSE, R²]
    end

    subgraph VALIDATION
        L0["Level 0<br/>Accord inter-annotateurs"]
        L1["Level 1<br/>Performance algorithmes"]
        L2["Level 2<br/>Tests hypothèses"]
    end

    %% Relations
    X --> CLS
    Y --> CLS
    M2 --> CLS
    M1 --> CALC
    M3 --> CALC

    CLS --> C_METRICS
    CALC --> N_METRICS

    C_METRICS --> L1
    N_METRICS --> L1

    L0 --> L1
    L1 --> L2
</span></span></code></div></div></pre>

---

## 📊 Résumé des concepts

### Variables

* **X** : Stratégies du conseiller (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION).
* **Y** : Réactions du client (POSITIF, NÉGATIF, NEUTRE, QUESTION, SILENCE).
* **M1** : Densité de verbes d’action (mesure numérique).
* **M2** : Alignement interactionnel (lexical, sémantique, composite).
* **M3** : Charge cognitive (pauses, hésitations, fluidité).

### Algorithmes

* **Classificateurs** : produisent un **label discret** (X, Y, M2).
* **Calculateurs** : produisent une **valeur numérique** (M1, M3).
* Implémentations : `rule-based`, `ml`, `llm`, `hybrid`.

### Métriques

* **Classification** : Accuracy, Precision, Recall, F1, Kappa, Matrice de confusion.
* **Numérique** : MAE, RMSE, R², Corrélation (Pearson/Spearman).
* Dispatch automatique selon `targetKind`.

### Niveaux de validation

* **Level 0** : Gold standard via accord inter-annotateurs (Kappa > 0.70).
* **Level 1** : Validation technique des algorithmes (Accuracy > 0.85).
* **Level 2** : Validation scientifique (tests d’hypothèses H1-H2-H3).

---

## ✅ Points clés

* **Séparation claire** entre variables (objet scientifique), algorithmes (implémentation technique) et métriques (évaluation).
* **Validation progressive** en 3 niveaux : de l’accord humain à la preuve scientifique.
* **Extensibilité** : ajouter une nouvelle variable ou métrique n’impacte pas la structure globale.

---

→ Prochaine étape : [03-Developer-Guides]()
