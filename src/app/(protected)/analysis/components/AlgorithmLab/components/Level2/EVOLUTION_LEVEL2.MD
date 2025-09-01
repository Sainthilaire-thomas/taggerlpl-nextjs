# Roadmap d’évolutions – AlgorithmLab Level2 (Validation scientifique H1)

## Objectifs

- Aligner complètement la validation H1 avec la thèse (définitions, seuils, statistiques).
- Remplacer toute valeur “mockée” par des **calculs réels** et **traçables** .
- Améliorer la **reproductibilité** , la **sélection d’échantillons** , et la **comparabilité** des runs.
- Garder une **UX claire** (aperçu → détails → stats → rapport).

---

## Plan d’exécution (ordre recommandé)

### 1) Filtrage & normalisation des données (critique)

**But.** Garantir que l’échantillon H1 est strictement conforme (paires adjacentes complètes et tags normalisés).

**Actions.**

- Centraliser une fonction `normalizeTag()` et `normalizeClientReaction()` (majuscules, espaces/underscores) dans `algorithms/shared/tags.ts`.
- Appliquer la **même normalisation** lors du filtrage initial (pas seulement à l’analyse) : éviter l’`includes()` fragile sur `CLIENT POSITIF/NEGATIF/NEUTRE`.
- Vérifier **l’adjacence** (conseiller → client suivant) et ignorer les cas ambigus.
- (Option) Dédupliquer par `(callid, turnid)` si une même paire est chargée deux fois.

  **Acceptation.**

- Le panneau “Debug Filtrage” affiche le **même nombre** de paires valides entre l’étape filtrage et l’étape analyse.
- Les 5 échantillons affichés montrent des tags **normalisés** cohérents.

---

### 2) Critères H1 — ajouter le volet “négatif” (critique)

**But.** Intégrer les seuils négatifs d’H1 (Actions < 25% négatif ; Explications > 80% négatif).

**Actions.**

- Dans `Level2Interface.tsx`, compléter `criteriaMet` par :

  - `actionsNegativeBelow25` (moyenne ENGAGEMENT+OUVERTURE),
  - `explanationsNegativeAbove80` (EXPLICATION seul).

- Paramétrer les **seuils** via un objet `HYPOTHESIS_THRESHOLDS` (env ou constante exportée).

  **Acceptation.**

- Le verdict H1 tient compte de **≥ 2 critères** parmi positifs/écart et négatifs, avec badges dédiés.

---

### 3) Moteur stats fiable (remplacer valeurs “mockées”) (critique)

**But.** Calculer des p-values réelles et des tailles d’effet.

**Actions.**

- Créer `algorithms/shared/stats.ts` :

  - **Chi-deux d’indépendance** sur tableau `stratégies × {pos, neutre, neg}`
    - renvoyer `{chi2, ddl, pValue, cramersV}` (p via CDF χ²).
  - **Fisher exact 2×2** (pairwise entre stratégies) sur `{positif, négatif}`.
    - renvoyer `oddsRatio`, `pValue`.
  - **IC de proportion** (95%) par stratégie (Wilson recommandé).
  - (Option) **Test de proportions global** + **Marascuilo** en post-hoc au lieu d’ANOVA approximative.

- Ajouter **unit tests** simples (Jest) avec tableaux jouets pour vérifier les formules.

  **Acceptation.**

- `StatisticalTestsPanel` n’emploie plus de p-values “au doigt mouillé”.
- `StatisticalSummary` **consomme** les résultats du moteur (props `validationResults`) et n’affiche **aucune constante** codée en dur.

---

### 4) Câblage `StatisticalSummary` ← résultats réels

**But.** Supprimer les chiffres figés (χ², F, V, IC ±5) et afficher les vrais résultats.

**Actions.**

- Depuis `Level2Interface.tsx`, calculer et passer un objet `validationResults` à `StatisticalSummary` :

  - `chi2, ddl, p, V`,
  - liste des `pairwiseFisher` significatifs (libellés clairs),
  - IC par stratégie,
  - synthèse (écart empirique Actions vs Explication).

- Retirer les “127.43”, “p<.001” statiques, etc.

  **Acceptation.**

- Les valeurs changent quand l’échantillon change (preuve que c’est dynamique).
- La section “Données Standardisées pour Publication” reprend **les vraies valeurs** .

---

### 5) Gestion REFLET (granularité optionnelle)

**But.** Gérer REFLET comme **famille** (agrégée) ou par **sous-types** si disponibles.

**Actions.**

- Ajout d’un **toggle UI** (“Détailler REFLET”) qui :

  - ON : affiche REFLET_VOUS / REFLET_JE / REFLET_ACQ,
  - OFF : agrège en REFLET.

- (Option) Exclure REFLET des critères décisifs H1 (gardé en exploratoire).

  **Acceptation.**

- Le tableau et les stats se re-computent correctement dans les deux modes.

---

### 6) Garde-fous sur la taille d’échantillon

**But.** Éviter des conclusions “VALIDÉE” sur petits N.

**Actions.**

- Introduire des **seuils N** :

  - `minNPerGroup` (ex. 30) et `minNTotal` (ex. 150) paramétrables.

- Si seuils non atteints :

  - afficher **Warning** ,
  - forcer le statut **PARTIALLY_VALIDATED** ou **NOT_VALIDATED** .

    **Acceptation.**

- Le bandeau de conclusion change selon N, avec message explicite.

---

### 7) Reproductibilité & “Run history” (intégration RunPanel)

**But.** Permettre de **sélectionner un échantillon** (filtres d’origine, dates, corpus) et de **rejouer/Comparer** des runs.

**Actions.**

- Créer `components/RunHistory/RunList.tsx` (carte simple) listant les derniers runs : algo, date/heure, échantillon, N, verdict H1, χ², V.
- Enregistrer chaque run dans Supabase (`algorithmlab_runs`) avec :

  - `params` (filtres, seuils, versions),
  - `stats` (résultats clé),
  - `dataset_signature` (hash ids paires),
  - `created_at`, `user`.

- Dans `RunPanel`, ajouter :

  - bouton **“Relancer avec mêmes paramètres”** ,
  - bouton **“Comparer à…”** (affiche diff des métriques).

    **Acceptation.**

- On peut **reprendre un run** depuis la liste et retrouver **exactement** les mêmes chiffres.
- Le composant affiche au moins **5 derniers runs** avec résumé.

---

### 8) Export & traçabilité

**But.** Faciliter les revues et annexes.

**Actions.**

- Ajouter `Export` (CSV/JSON) des :

  - paires filtrées,
  - tableaux agrégés,
  - résultats stats.

    **Acceptation.**

- Un clic “Exporter CSV/JSON” génère un fichier téléchargeable.

---

### 9) Performance & robustesse

**But.** Garder l’UI fluide sur gros volumes.

**Actions.**

- Extraire les calculs lourds dans un **Web Worker** (ex. `stats.worker.ts`) si `N` > seuil.
- Systématiser `useMemo` avec dépendances **minimales** .
- Ajouter des **guard clauses** (évite divisions par 0, NaN, etc.).

  **Acceptation.**

- Pas de freeze UI sur un corpus ×3 ; le spinner n’apparaît que brièvement.

---

### 10) Paramétrage & Typescript strict

**But.** Rendre tout **configurable** et **typé** .

**Actions.**

- Fichier `config/hypotheses.ts` :

  - seuils H1 (positif, négatif, différences, N mini),
  - options REFLET,
  - activer/désactiver certains tests.

- Types dédiés : `H1Criteria`, `H1Stats`, `ChiSquareResult`, `FisherResult`, `ConfidenceInterval`.

  **Acceptation.**

- Aucune “magic number” dans les composants UI ; tout vient de `config`.

---

### 11) Documentation développeur (ce README)

**But.** Rendre le module transmissible et auditable.

**Actions.**

- Décrire le **pipeline** (Filtrage → Agrégation → Stats → Synthèse).
- Ajouter une **Data Dictionary** minimale (champs utilisés : `tag`, `next_turn_tag`, etc.).
- Exemple d’**API Supabase** pour `algorithmlab_runs`.

  **Acceptation.**

- Un dev “neuf” peut rejouer un run en 15 min.

---

## Découpage en PRs (proposé)

1. **PR1 – Filtrage & normalisation**
2. **PR2 – Critères H1 (incl. négatifs) + config**
3. **PR3 – Moteur stats + tests unitaires**
4. **PR4 – Wiring StatisticalSummary → résultats réels**
5. **PR5 – REFLET (toggle & agrégation)**
6. **PR6 – Garde-fous N & messages UX**
7. **PR7 – Run history (modèle Supabase + UI basique)**
8. **PR8 – Export CSV/JSON**
9. **PR9 – Perf (worker) & polish UX**
10. **PR10 – Docs & nettoyage final**

---

## Checklist rapide

- [ ] Normalisation unique des tags conseiller & client.
- [ ] Filtrage strict des paires adjacentes + dédup.
- [ ] Seuils H1 paramétrés (positif, négatif, écart).
- [ ] Moteur **χ² + V** , **Fisher** (réel 2×2), **IC 95% (Wilson)** .
- [ ] `StatisticalSummary` branché sur résultats **dynamiques** .
- [ ] Toggle **REFLET détaillé/agrégé** .
- [ ] **Garde-fous N** et messages.
- [ ] **Run history** (création table, enregistrement, liste).
- [ ] **Export** des données & résultats.
- [ ] **Perf** (memo/worker) & **tests** .
- [ ] **Docs** (pipeline + data dictionary).

---

## Notes d’implémentation (pistes rapides)

- **Wilson CI** (proportion) :

  `p̂ = x/n ; z = 1.96 ; denom = 1 + z²/n ; center = (p̂ + z²/(2n))/denom ; half = z*sqrt((p̂(1-p̂)/n) + z²/(4n²))/denom ; IC = [center - half, center + half]`.

- **Cramér’s V** : `sqrt(χ² / (N * (min(r-1, c-1))))` avec `r = nb stratégies`, `c = 3`.
- **Fisher 2×2** : si besoin d’un exact, soit petite implémentation combinatoire (hypergéométrique), soit bascule sur un mini util interne.

# Addendum — Stratégie = Famille & gestion de REFLET

## Décision de conception (actuelle)

- **Stratégie (H1) = Famille** issue du référentiel `tags.family` pour les tours **conseiller** :

  **ENGAGEMENT** , **OUVERTURE** , **EXPLICATION** , **REFLET** .

- **Aucune normalisation “libellé → stratégie”** nécessaire côté conseiller si `family` est disponible.

  (On évite les heuristiques du style `startsWith("REFLET")`.)

- Côté **client** , on continue à **normaliser** les réactions vers

  **CLIENT_POSITIF / CLIENT_NEGATIF / CLIENT_NEUTRE** (tolérance espaces/underscores/casse).

## Impact sur le pipeline H1

1. **Filtrage/Normalisation (PR1)**
   - Conseiller : filtrer sur `tags.family ∈ {ENGAGEMENT, OUVERTURE, EXPLICATION, REFLET}` → **la famille _est_ la stratégie** .
   - Client : normaliser la réaction (espaces/underscores, casse) avant validation.
   - Supprimer tout fallback “à plat” (ex. `startsWith("REFLET")`) **si** `family` est présent.
2. **Agrégation (H1Analysis)**
   - Grouper par **famille** (les 4 stratégies ci-dessus).
   - Calculer `positive% / negative% / neutral% / effectiveness` par **famille** (stratégie).
3. **Validation H1 (PR2)**
   - Comparer **Actions = moyenne(ENGAGEMENT, OUVERTURE)** vs **EXPLICATION** .
   - Critères actuels conservés (Actions > 50%, Explications < 5%, Écart > 30 pts).
   - (Ajout futur recommandé : critères “négatifs” Actions < 25%, Explication > 80%.)

## Gestion de REFLET (présent vs. futur)

- **Présent (H1)** : REFLET reste **une seule stratégie** (famille “REFLET”).

  → On **n’éclate pas** REFLET_VOUS / REFLET_JE / REFLET_ACQ.

- **Futur (PR5)** : ajouter **un toggle “Détailler REFLET”** pour exploration :

  - OFF (défaut) : REFLET agrégé (pour H1).
  - ON : ventilation en sous-formes pour analyses fines (hors critères H1).

## Acceptation (mise à jour)

- Le **panneau Debug** doit afficher le même **N** après filtrage et à l’analyse **par familles** .
- Les **tableaux** et **résumés** mentionnent **ENGAGEMENT / OUVERTURE / EXPLICATION / REFLET** (pas de sous-libellés).
- Aucun fallback heuristique **libellé → REFLET** n’est utilisé quand `family` est disponible.
- Les **critères H1** sont calculés sur ces **4 stratégies** uniquement.

## Non-objectifs (pour H1)

- Pas d’analyse séparée des formes de REFLET à ce stade.
- Pas d’agrégation “libellé → stratégie” basée sur des préfixes si `family` est présent.
- “libellé → stratégie” basée sur des préfixes si `family` est présent.

## Rôle des composants de validation (Level 2)

### `StatisticalSummary` — **Synthèse académique**

- **But** : raconter les résultats pour la thèse/rapport.
- **Produit** : statut global (VALIDATED / PARTIALLY / NOT), écart empirique Actions vs Explication, χ², V de Cramér, IC 95%, conclusions textuelles, implications pratiques, limites, bloc “données standardisées” (copiable en LaTeX/Word).
- **Public** : lecteur scientifique / encadrants.

### `StatisticalTestPanel` — **Détails techniques**

- **But** : exposer chiffres et tableaux pour audit/revue.
- **Produit** : χ² (valeur, ddl, p, V), Fisher exact pairwise (OR, p), ANOVA proportions / tests de proportions, tableau de contingence observé, accordéons/onglets d’inspection.
- **Public** : analyste/développeur qui vérifie la significativité.

> Les deux composants consomment les **mêmes agrégats** (“h1Analysis” / “StrategyStats”) mais servent **deux usages complémentaires** :
>
> **interprétation & communication** (Summary) vs **vérification & transparence** (TestPanel).
