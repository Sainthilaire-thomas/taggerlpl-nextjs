# 📚 DOCUMENTATION COMPLÈTE DU FLUX D'ANALYSE CONVERSATIONNELLE

**Date** : 20 novembre 2025  
**Contexte** : Recherche doctorale - Analyse des stratégies conversationnelles conseiller-client  
**Objectif** : Comprendre comment les données passent de la transcription brute jusqu'aux analyses statistiques

---

## 🎯 VUE D'ENSEMBLE

Le système permet d'analyser des conversations téléphoniques entre conseillers et clients pour :
- Identifier les stratégies utilisées par les conseillers (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)
- Observer les réactions des clients (POSITIF, NEUTRE, NEGATIF)
- Tester des hypothèses sur l'efficacité de ces stratégies
- Analyser les mécanismes de médiation (verbes d'action, alignement linguistique, charge cognitive)

---

## 📋 LES 3 GRANDES PHASES

```
PHASE 1 : ANNOTATION MANUELLE (TranscriptLPL)
   ↓
PHASE 2 : CALCUL DES RELATIONS TEMPORELLES (TranscriptControls)
   ↓
PHASE 3 : CRÉATION DES PAIRES D'ANALYSE (Function SQL)
```

---

## 🔵 PHASE 1 : ANNOTATION MANUELLE (TranscriptLPL)

### Objectif
Permettre à l'utilisateur (chercheur) d'annoter les tours de parole avec des tags correspondant à la grille d'analyse conversationnelle.

### Processus

#### Étape 1.1 : Affichage de la transcription
- L'utilisateur ouvre un appel dans l'interface TranscriptLPL
- La transcription est affichée mot par mot avec timestamps
- Chaque mot a un speaker (conseiller ou client) issu de la transcription automatique

#### Étape 1.2 : Sélection et annotation
- L'utilisateur **sélectionne du texte** à la souris (un ou plusieurs mots)
- Il **choisit un tag** dans la palette (ex: "ENGAGEMENT", "CLIENT POSITIF")
- Le système **calcule automatiquement le verbatim** (texte sélectionné)

#### Étape 1.3 : Sauvegarde dans `turntagged`
Quand l'utilisateur sauvegarde un tag, le système enregistre dans la table `turntagged` :

**Ce qui est enregistré** :
- `id` : Identifiant unique du tour annoté
- `call_id` : L'appel concerné
- `tag` : Le tag choisi (ex: "ENGAGEMENT")
- `verbatim` : **Le texte exactement sélectionné** par l'utilisateur (peut être partiel - quelques mots seulement)
- `speaker` : Le locuteur du premier mot sélectionné (conseiller/client)
- `start_time` : Timestamp du **premier mot sélectionné** par l'utilisateur
- `end_time` : Timestamp du **dernier mot sélectionné** par l'utilisateur
- `next_turn_verbatim` : **Le tour de parole COMPLET qui suit** (tous les mots du prochain speaker, calculé automatiquement)

**⚠️ IMPORTANT** : Distinction entre tour ACTUEL et tour SUIVANT

**Pour le tour ACTUEL (celui que l'utilisateur annote)** :
- `verbatim` = Texte **sélectionné** (peut être partiel, ex: "je vous écoute" même si le tour complet est "Bonjour je vous écoute merci")
- `start_time` et `end_time` = Timestamps **des mots sélectionnés uniquement**

**Pour le tour SUIVANT (calculé automatiquement)** :
- `next_turn_verbatim` = **TOUT le tour de parole** du prochain speaker (pas seulement quelques mots)
- Calculé en cherchant tous les mots consécutifs du prochain speaker différent

**Exemple concret** :
```
Transcription complète :
[0.0s] Bonjour[conseiller] 
[0.5s] comment[conseiller] 
[1.0s] puis-je[conseiller] 
[1.5s] vous[conseiller] 
[2.0s] aider[conseiller] 
[2.5s] Oui[client] 
[3.0s] merci[client]

Utilisateur sélectionne : "comment puis-je vous"

Enregistré dans turntagged :
- verbatim = "comment puis-je vous" (sélection exacte)
- start_time = 0.5s (début de "comment")
- end_time = 1.5s (fin de "vous")
- speaker = "conseiller"
- next_turn_verbatim = "Oui merci" (TOUT le tour client suivant)
```

**Ce qui N'est PAS encore rempli** :
- `next_turn_tag` : NULL (sera calculé en Phase 2)
- `prev1_turn_id`, `prev2_turn_id`, etc. : NULL (seront calculés en Phase 2)
- `next1_turn_id`, `next2_turn_id`, etc. : NULL (seront calculés en Phase 2)

#### Étape 1.4 : Annotation de tout l'appel
- L'utilisateur continue d'annoter tour par tour
- Typiquement, 95-99% de l'appel est annoté
- Certains passages peuvent ne pas être annotés (hors contexte, silence, etc.)

### Résultat de la Phase 1
Une table `turntagged` contenant tous les tours annotés, mais **sans relations entre eux**.

---

## 🟢 PHASE 2 : CALCUL DES RELATIONS TEMPORELLES

### Objectif
Établir les relations temporelles entre tous les tours annotés pour permettre l'analyse des enchaînements conversationnels.

### Déclenchement
Quand l'annotation est terminée, l'utilisateur clique sur le bouton **"Calculer Relations Étendues"** dans TranscriptControls.

### Ce que fait la fonction `calculate_turn_relations`

#### Principe général
Pour **chaque tour annoté**, identifier les tours **précédents** et **suivants** dans l'ordre temporel (basé sur `start_time`).

#### Logique de calcul

**1. Tri temporel**
- Tous les tours de l'appel sont triés par `start_time` (puis `id` si égalité)
- Cela crée une séquence ordonnée : Tour1 → Tour2 → Tour3 → Tour4...

**2. Application de LAG/LEAD**
Pour chaque tour, le système utilise des fonctions de fenêtrage SQL pour identifier :

**Tours PRÉCÉDENTS** (LAG) :
- `prev1_turn_id` : Le tour juste avant (LAG 1)
- `prev2_turn_id` : 2 tours avant (LAG 2)
- `prev3_turn_id` : 3 tours avant (LAG 3)
- `prev4_turn_id` : 4 tours avant (LAG 4)

**Tours SUIVANTS** (LEAD) :
- `next1_turn_id` : Le tour juste après (LEAD 1)
- `next2_turn_id` : 2 tours après (LEAD 2)
- `next3_turn_id` : 3 tours après (LEAD 3)
- `next4_turn_id` : 4 tours après (LEAD 4)

**3. Important : Pas de distinction conseiller/client**
Le calcul est **purement temporel** :
- Si Tour1 est un conseiller et Tour2 est un conseiller → Tour1.next1_turn_id = Tour2.id
- Si Tour1 est un conseiller et Tour2 est un client → Tour1.next1_turn_id = Tour2.id
- Peu importe le speaker, on prend le tour suivant dans le temps

**4. Remplissage de `next_turn_tag`**
En même temps, le système remplit également :
- `next_turn_tag` : Le tag du tour `next1_turn_id`
- C'est une **copie pour faciliter les requêtes** ultérieures

#### Exemple concret

**Avant Phase 2** :
```
Tour 1 (10:00:00 - conseiller - ENGAGEMENT)     → next1_turn_id = NULL
Tour 2 (10:00:05 - client - CLIENT POSITIF)     → next1_turn_id = NULL  
Tour 3 (10:00:10 - conseiller - EXPLICATION)    → next1_turn_id = NULL
Tour 4 (10:00:15 - client - CLIENT NEUTRE)      → next1_turn_id = NULL
Tour 5 (10:00:20 - conseiller - REFLET_ACQ)     → next1_turn_id = NULL
```

**Après Phase 2** :
```
Tour 1 → next1_turn_id = 2, next_turn_tag = "CLIENT POSITIF", prev1_turn_id = NULL
Tour 2 → next1_turn_id = 3, next_turn_tag = "EXPLICATION", prev1_turn_id = 1
Tour 3 → next1_turn_id = 4, next_turn_tag = "CLIENT NEUTRE", prev1_turn_id = 2
Tour 4 → next1_turn_id = 5, next_turn_tag = "REFLET_ACQ", prev1_turn_id = 3
Tour 5 → next1_turn_id = NULL, next_turn_tag = NULL, prev1_turn_id = 4
```

### Résultat de la Phase 2
La table `turntagged` est **enrichie** avec toutes les relations temporelles, permettant de naviguer dans la conversation.

---

## 🟡 PHASE 3 : CRÉATION DES PAIRES D'ANALYSE

### Objectif
Sélectionner uniquement les **paires pertinentes** pour l'analyse scientifique : un tour conseiller stratégique suivi d'un tour client réactif.

### Déclenchement
La fonction SQL `refresh_analysis_pairs` est appelée (manuellement ou automatiquement) pour construire les paires.

### Logique de sélection des paires

#### Critères de pertinence

**Critère 1 : Tour conseiller stratégique**
Le tour doit avoir un tag de **famille conseiller** :
- ENGAGEMENT
- OUVERTURE  
- REFLET (REFLET_ACQ, REFLET_JE, REFLET_VOUS)
- EXPLICATION

**Critère 2 : Tour client suivant**
Le tour `next1_turn_id` doit avoir un **tag de réaction client** :
- CLIENT POSITIF
- CLIENT NEUTRE
- CLIENT NEGATIF

**Critère 3 : Relation établie**
Les deux critères ci-dessus sont vérifiés via la colonne `next_turn_tag` :
```
Si (tag conseiller = famille stratégique) 
ET (next_turn_tag IN ['CLIENT POSITIF', 'CLIENT NEUTRE', 'CLIENT NEGATIF'])
ALORS → Créer une paire
```

#### Pourquoi cette logique ?

**1. On utilise `next_turn_tag` et non une jointure directe**
- `next_turn_tag` a été calculé en Phase 2
- Il représente le tag **réel** du tour suivant dans le temps
- Cela garantit qu'on ne prend que les paires où le client réagit directement

**2. Tous les tours ne forment pas des paires**
Exemples de tours **NON retenus** :
- Conseiller → Conseiller (pas de réaction client)
- Conseiller → Client avec tag "B_QUESTION_NEUTRE" (pas un tag de réaction)
- Client → Conseiller (ce n'est pas une stratégie conseiller)
- Tags hors famille (ex: "SALUTATION", "OUTRO")

**3. Le contexte inclut TOUS les tours**
Même si une paire est sélectionnée pour l'analyse :
- `prev1`, `prev2`, `prev3`, `prev4` peuvent être des tours **non pertinents**
- `next1`, `next2`, `next3`, `next4` peuvent être des tours **non pertinents**
- Le contexte est **purement temporel**, pas filtré sur la pertinence

### Construction de la paire complète

#### Données de la paire
Pour chaque paire conseiller-client retenue :

**Tour conseiller** :
- `conseiller_turn_id`
- `strategy_tag` : Le tag exact (ex: "REFLET_ACQ")
- `strategy_family` : La famille (ex: "REFLET")
- `conseiller_verbatim` : Le texte du tour
- `conseiller_start_time`, `conseiller_end_time`
- `conseiller_speaker`

**Tour client** :
- `client_turn_id`
- `reaction_tag` : CLIENT_POSITIF / CLIENT_NEUTRE / CLIENT_NEGATIF
- `client_verbatim` : Le texte du tour
- `client_start_time`, `client_end_time`
- `client_speaker`

#### Contexte étendu (8 tours)

**Contexte PRÉCÉDENT** (par rapport au tour conseiller) :
- `prev1_verbatim`, `prev1_tag`, `prev1_speaker` : 1 tour avant
- `prev2_verbatim`, `prev2_tag`, `prev2_speaker` : 2 tours avant
- `prev3_verbatim`, `prev3_tag`, `prev3_speaker` : 3 tours avant

**Contexte SUIVANT** (par rapport au tour client) :
- `next1_verbatim`, `next1_tag`, `next1_speaker` : 1 tour après
- `next2_verbatim`, `next2_tag`, `next2_speaker` : 2 tours après
- `next3_verbatim`, `next3_tag`, `next3_speaker` : 3 tours après

**Contexte ÉTENDU** (optionnel, stocké en JSONB) :
- `prev4` : 4 tours avant (si présent)
- `next4` : 4 tours après (si présent)

#### Migration des résultats algorithmiques

Si des algorithmes ont déjà été exécutés sur l'ancienne table `h2_analysis_pairs`, leurs résultats sont migrés :

**Métriques M1** (Densité de verbes d'action) :
- `m1_verb_density`
- `m1_verb_count`
- `m1_action_verbs`

**Métriques M2** (Alignement linguistique) :
- `m2_lexical_alignment`
- `m2_semantic_alignment`
- `m2_shared_terms`

**Métriques M3** (Charge cognitive) :
- `m3_hesitation_count`
- `m3_cognitive_score`
- `m3_cognitive_load`

**Prédiction Y** (Classification client) :
- `y_predicted_tag`
- `y_confidence`

### Résultat de la Phase 3
Une table `analysis_pairs` contenant **uniquement les paires pertinentes** avec leur contexte complet, prêtes pour l'analyse statistique.

---

## 📊 RÉCAPITULATIF DES DIFFÉRENCES CLÉS

### 1. `turntagged` vs `analysis_pairs`

| Aspect | `turntagged` | `analysis_pairs` |
|--------|--------------|------------------|
| **Contenu** | TOUS les tours annotés | UNIQUEMENT paires conseiller→client pertinentes |
| **Granularité** | 1 ligne = 1 tour | 1 ligne = 1 paire (2 tours liés) |
| **Relations** | IDs des tours prev/next | Verbatim complet du contexte |
| **Filtrage** | Aucun | Filtré sur familles stratégiques + réactions |
| **Usage** | Annotation + Navigation | Analyse statistique |

### 2. Logique temporelle vs logique sémantique

| Aspect | Logique temporelle | Logique sémantique |
|--------|-------------------|-------------------|
| **Où ?** | Phase 2 (`calculate_turn_relations`) | Phase 3 (`refresh_analysis_pairs`) |
| **Critère** | Ordre chronologique (`start_time`) | Pertinence conversationnelle (tags) |
| **Résultat** | Relations prev/next TOUS tours | Paires conseiller→client PERTINENTES |
| **Objectif** | Navigation dans conversation | Analyse scientifique |

### 3. Speakers vs Familles de tags

| Donnée | Source | Fiabilité | Usage |
|--------|--------|-----------|-------|
| `speaker` | Transcription automatique | Variable | Affichage, pas de logique critique |
| `family` depuis `lpltag` | Grille scientifique | 100% | Sélection des paires d'analyse |
| `tag` | Annotation manuelle | 100% | Classification précise |

---

## 🎯 EXEMPLE COMPLET DE BOUT EN BOUT

### Situation initiale
Un appel de 5 minutes avec 8 tours de parole annotés.

### Phase 1 : Annotation

**Tours annotés** :
1. 00:10 - Conseiller - "Bonjour comment puis-je vous aider ?" → OUVERTURE
2. 00:15 - Client - "Je voudrais des informations" → B_QUESTION_NEUTRE  
3. 00:20 - Conseiller - "Bien sûr, je vous écoute" → ENGAGEMENT
4. 00:25 - Client - "Merci" → CLIENT POSITIF
5. 00:30 - Conseiller - "Donc si je comprends bien..." → REFLET_JE
6. 00:35 - Client - "Oui c'est ça" → CLIENT POSITIF
7. 00:40 - Conseiller - "Voilà pourquoi..." → EXPLICATION
8. 00:45 - Client - "D'accord" → CLIENT NEUTRE

**État de `turntagged` après Phase 1** :
- 8 lignes
- Tous les champs de base remplis
- `next_turn_tag` = NULL pour tous
- `prev1_turn_id`, `next1_turn_id` = NULL pour tous

### Phase 2 : Calcul des relations

**Application de LAG/LEAD** :
```
Tour 1 → next1_turn_id=2, next_turn_tag="B_QUESTION_NEUTRE"
Tour 2 → next1_turn_id=3, next_turn_tag="ENGAGEMENT", prev1_turn_id=1
Tour 3 → next1_turn_id=4, next_turn_tag="CLIENT POSITIF", prev1_turn_id=2
Tour 4 → next1_turn_id=5, next_turn_tag="REFLET_JE", prev1_turn_id=3
Tour 5 → next1_turn_id=6, next_turn_tag="CLIENT POSITIF", prev1_turn_id=4
Tour 6 → next1_turn_id=7, next_turn_tag="EXPLICATION", prev1_turn_id=5
Tour 7 → next1_turn_id=8, next_turn_tag="CLIENT NEUTRE", prev1_turn_id=6
Tour 8 → next1_turn_id=NULL, prev1_turn_id=7
```

**État de `turntagged` après Phase 2** :
- 8 lignes
- Toutes les relations remplies
- Navigation possible dans tout l'appel

### Phase 3 : Sélection des paires

**Analyse tour par tour** :

**Tour 1** (OUVERTURE) :
- ✅ Famille = OUVERTURE (conseiller stratégique)
- ❌ `next_turn_tag` = "B_QUESTION_NEUTRE" (pas une réaction client)
- → **Pas de paire créée**

**Tour 2** (B_QUESTION_NEUTRE) :
- ❌ Famille = AUTRES (pas conseiller stratégique)
- → **Pas de paire créée**

**Tour 3** (ENGAGEMENT) :
- ✅ Famille = ENGAGEMENT (conseiller stratégique)
- ✅ `next_turn_tag` = "CLIENT POSITIF" (réaction client)
- → **PAIRE 1 CRÉÉE** (Tour 3 → Tour 4)

**Tour 4** (CLIENT POSITIF) :
- ❌ Famille = CLIENT (pas conseiller stratégique)
- → **Pas de paire créée**

**Tour 5** (REFLET_JE) :
- ✅ Famille = REFLET (conseiller stratégique)
- ✅ `next_turn_tag` = "CLIENT POSITIF" (réaction client)
- → **PAIRE 2 CRÉÉE** (Tour 5 → Tour 6)

**Tour 6** (CLIENT POSITIF) :
- ❌ Famille = CLIENT (pas conseiller stratégique)
- → **Pas de paire créée**

**Tour 7** (EXPLICATION) :
- ✅ Famille = EXPLICATION (conseiller stratégique)
- ✅ `next_turn_tag` = "CLIENT NEUTRE" (réaction client)
- → **PAIRE 3 CRÉÉE** (Tour 7 → Tour 8)

**Tour 8** (CLIENT NEUTRE) :
- ❌ Famille = CLIENT (pas conseiller stratégique)
- → **Pas de paire créée**

**État de `analysis_pairs` après Phase 3** :
- **3 paires** sur 8 tours annotés
- Paire 1 : ENGAGEMENT → CLIENT POSITIF (avec contexte : prev1=Tour2, prev2=Tour1, next1=Tour5...)
- Paire 2 : REFLET_JE → CLIENT POSITIF (avec contexte : prev1=Tour4, prev2=Tour3, next1=Tour7...)
- Paire 3 : EXPLICATION → CLIENT NEUTRE (avec contexte : prev1=Tour6, prev2=Tour5, next1=NULL...)

---

## 🔑 POINTS CLÉS À RETENIR

### 1. Deux logiques complémentaires
- **Temporelle** (Phase 2) : Tout est basé sur le temps
- **Sémantique** (Phase 3) : Filtrage intelligent sur les tags

### 2. La colonne `next_turn_tag` est la clé
- Calculée en Phase 2 (temporel)
- Utilisée en Phase 3 (sémantique)
- Permet de vérifier qu'un tour conseiller a bien une réaction client

### 3. Tous les tours ne sont pas des paires
- 8 tours annotés ≠ 8 paires
- Seules les combinaisons "stratégie conseiller → réaction client" sont retenues
- Environ 30-40% des tours forment des paires pertinentes

### 4. Le contexte n'est pas filtré
- Les paires sont filtrées (pertinence scientifique)
- Le contexte ne l'est pas (ordre temporel)
- `prev1` peut être n'importe quel tour (conseiller, client, tag quelconque)

### 5. Pas de dépendance au `speaker`
- Le `speaker` (conseiller/client) vient de la transcription automatique
- La logique scientifique se base sur les **familles de tags** dans `lpltag`
- Plus fiable et contrôlable scientifiquement

---

## 📝 QUESTIONS FRÉQUENTES

### Q1 : Pourquoi calculer les relations en Phase 2 et pas directement en Phase 3 ?
**R** : Séparation des responsabilités :
- Phase 2 = enrichissement de `turntagged` (utilisable par d'autres outils)
- Phase 3 = création des paires (spécifique à l'analyse)

### Q2 : Pourquoi `next_turn_tag` si on a déjà `next1_turn_id` ?
**R** : Optimisation des requêtes. Sans cette colonne, il faudrait faire une jointure pour chaque requête. C'est une **copie dénormalisée** pour la performance.

### Q3 : Que se passe-t-il si je re-tagge un tour ?
**R** : 
- Phase 1 : Le tag est mis à jour dans `turntagged`
- Phase 2 : Il faut recalculer les relations (clic sur le bouton)
- Phase 3 : Il faut régénérer les paires

### Q4 : Pourquoi certains tours conseillers ne créent pas de paires ?
**R** : Plusieurs raisons possibles :
- Le tour suivant n'est pas un tour client (ex: conseiller → conseiller)
- Le tour suivant a un tag non-pertinent (ex: "B_QUESTION_NEUTRE")
- C'est le dernier tour de l'appel (`next1_turn_id` = NULL)

### Q5 : Le contexte peut-il contenir des "trous" (tours non annotés) ?
**R** : Non. Le contexte ne contient que des tours **annotés**. Les passages non annotés ne sont pas dans `turntagged`, donc ils ne peuvent pas être dans le contexte.

---

**Auteur** : Claude + Thomas  
**Version** : 1.0  
**Date** : 20 novembre 2025
