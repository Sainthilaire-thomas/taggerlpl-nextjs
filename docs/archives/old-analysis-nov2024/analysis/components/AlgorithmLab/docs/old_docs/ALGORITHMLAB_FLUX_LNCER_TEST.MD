# 1) L’UI que tu vois (haut de page)

- Tu es dans **Level1Interface** .
- Tu choisis l’onglet **X / Y / M1 / M2 / M3** → ça monte le composant `*ValidationInterface` correspondant (ex. `XValidationInterface`, `M2ValidationInterface`, etc.).
- Dans ce composant, on rend le **RunPanel** (slider + bouton “Lancer test”) + un bloc résultats (`ResultsPanel`).

# 2) Tu cliques “Lancer test”

- Le bouton déclenche un handler `onRun` fourni par la **ValidationInterface** .
- Ce handler appelle le **hook** de la variable (ex. `useXAlgorithmTesting`, `useM2AlgorithmTesting`) avec la **taille d’échantillon** (du slider).

# 3) Le hook “runner” fabrique les entrées & exécute l’algo

Dans le hook (identique en logique pour X/Y/M1/M2/M3) :

1. **Récupération des données** (source unique)

   On lit la matière première via **TaggingDataContext** (tes tours taggés, ordonnés, avec `verbatim`, `tag`, `call_id`, `start_time`, `next_turn_verbatim`, etc.).

   Pour M2, on construit la fenêtre **−2 / −1 / 0 / +1** à partir de ces tours.

2. **Échantillonnage**

   On prend **N éléments** (la valeur du slider).

   👉 C’est ici qu’il faut s’assurer qu’on renvoie vraiment **N** lignes (pas 3 si tu demandes 50 😉).

3. **Préparation des inputs**

   - **X** : input = le **tour conseiller (T0)** (string)
   - **Y** : input = le **tour client (T+1)** (string)
   - **M1** : input = **T0** (string)
   - **M2** : input = un objet `{ t0, t1, ... }` (T0 = conseiller ; T1 = client +1), on peut aussi passer `prev1/prev2` en métadonnées d’aide
   - **M3** : selon ta définition, généralement numérique sur T0

4. **Récupération de l’algo**

   On récupère l’instance dans `algorithmRegistry` par son nom (sélectionné dans la ValidationInterface).

5. **Exécution**

   On appelle `algo.run(input)` (ou `algo.batchRun(inputs)` si dispo).

   Chaque sortie renvoie **au minimum** :

   - `prediction` (string)
   - `confidence` (0..1)
   - `processingTime` (ms)
   - `metadata` optionnel (où on aime bien passer le **contexte** )

6. **Mapping vers la table (format unique)**

   Pour chaque élément, on crée un **`TVValidationResult`** (c’est le contrat commun que la table attend) :

   - `verbatim` = **T0** (affiché en ligne “0” dans la colonne Contexte)
   - `predicted` = sortie brute de l’algo (string)
   - `goldStandard` = **tag annoté du tour conseiller (T0)**
     - Pour **X** : c’est vraiment le gold **X** → on peut calculer `correct = predicted === goldStandard`
     - Pour **M1/M2/M3** : on **affiche pour mémoire** ce tag, mais **on ne score pas** (mettre `correct` **undefined** )
   - `confidence`, `processingTime` = valeurs renvoyées par l’algo
   - `metadata` (clé indispensable pour le Contexte & Annot) :
     - `prev2_turn_verbatim`, `prev1_turn_verbatim`, `next_turn_verbatim`
     - (facultatif) `next_turn_tag`
     - `turnId` (ou `id`) pour que le bouton **Annot.** fonctionne
     - `callId`, `speaker`, `startTime`, `endTime`
     - (spécifiques) ex. `metadata.m2 = { value, scale }` pour M2

> ⚠️ Si **l’une** de ces clés manque (par ex. `metadata.next_turn_verbatim`), la table **n’affiche pas** la ligne correspondante du contexte.
>
> Idem si `goldStandard` est vide → la puce verte est vide.
>
> Idem si le hook ne renvoie que 3 lignes → tu verras 3/50.

# 4) Le rendu des résultats

- La **ValidationInterface** passe `results` à **ResultsPanel** avec `targetKind` (X/Y/M1/M2/M3).
- `ResultsPanel` :
  - calcule des métriques **classification** si `targetKind ∈ {X,Y,M2}` (sinon numériques pour M1/M3)
  - gère les **filtres** (dont “Désaccords uniquement” = lignes avec `correct === false`)
  - gère la **pagination** ou “afficher tout”
  - rend le **header** (stats, bouton fine-tuning, switch désaccords)
  - rend le **tableau** (`ResultsTableBody`)
- **ResultsTableBody** (commun) lit **exclusivement** ces champs :
  - `verbatim` (ligne 0)
  - `metadata.prev2_turn_verbatim`, `metadata.prev1_turn_verbatim`, `metadata.next_turn_verbatim` (lignes −2/−1/+1)
  - `predicted` (Sortie modèle)
  - `goldStandard` (Référence (gold))
  - `confidence`, `processingTime`
  - `AnnotationList` : a besoin d’un `turnId` + infos algorithme
  - puis **extraColumns** (dépendent de la variable ; ex. pour M2 on pioche dans `metadata.m2`)

# Flux Y (clic “LANCER TEST”)

1. **Level1Interface → YValidationInterface → BaseAlgorithmTesting**

   `BaseAlgorithmTesting` is the generic screen (algo picker, RunPanel, ResultsPanel).

2. **BaseAlgorithmTesting → useLevel1Testing(target="Y")**

   This hook is the “guichet unique” pour X & Y (& M1 via branche dédiée). It:

   - **Charge le dataset** via `TaggingDataContext` (`allTurnTagged`).
   - **Construit un gold standard unifié** avec `mapTurnsToGoldStandard(...)` :

     - **échantillon “conseiller”** (courant `t`): `expectedTag = normalizeLabel(t.tag)`, contexte prev2/prev1/next1.
     - **échantillon “client”** (tour suivant de `t`) si `next_turn_*` présents:

       `expectedTag = normalizeLabel(t.next_turn_tag)`, verbatim = `t.next_turn_verbatim`, contexte recalculé autour du tour client.

   - **Détermine la cible** à partir de `algorithm.describe().target`.

     Pour Y ⇒ `target = "client"`.

   - **Filtre la base** : `base = goldStandardData.filter(s => s.metadata.target === "client")`.
   - **Échantillonne** `sampleSize` éléments, **appelle l’algo** (`/api/algolab/classifiers` si LLM, sinon `algo.run(verbatim)`), et **normalise** en `TVValidationResult`.

3. **ResultsPanel → ResultsTableHeader/Body**

   Les **colonnes communes** (Contexte, Sortie modèle brut, Référence (gold), Confiance, Temps, Annot.) sont **toujours** les mêmes.

   Les colonnes spécifiques viennent de `buildExtraColumnsForTarget("Y")`.
