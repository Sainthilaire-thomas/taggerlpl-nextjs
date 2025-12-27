# Architecture Level 0 - Concepts et Workflow UX

**Date** : 2025-12-24  
**Auteurs** : Thomas + Claude  
**Objectif** : Document de référence pour comprendre Level 0 du point de vue utilisateur et guider les améliorations d'ergonomie

---

## 🎯 1. VUE D'ENSEMBLE

### 1.1 Objectif Scientifique du Level 0

**Level 0 = Validation Annotation Automatique par Modalité**

Le Level 0 permet de :
1. **Définir** un gold standard (annotations manuelles) pour chaque modalité d'annotation
   - Modalité Texte seul : Annotations basées uniquement sur le verbatim
   - Modalité Audio complète : Annotations basées sur texte + prosodie + ton + débit
   - Modalité Contexte : Annotations basées sur texte + tours de parole voisins (prev/next)
   
2. **Tester** pour chaque gold standard, différentes formulations de chartes automatiques (LLM)
   - Varier les définitions de catégories
   - Varier le paramétrage des prompts (exemples, contraintes, preprocessing)
   - Mesurer Kappa de chaque charte vs son gold standard

3. **Identifier** la meilleure charte automatique pour chaque modalité
   - Gold Text → CharteY_Text_Best (Kappa max)
   - Gold Audio → CharteY_Audio_Best (Kappa max)
   - Gold Context → CharteY_Context_Best (Kappa max)

4. **Améliorer** les chartes par itérations basées sur les désaccords (tuning)

**Problématique métier** :  
Les LLMs sont sensibles à la formulation des prompts ET à la richesse de l'input. Level 0 répond à : **"Quelle est la meilleure annotation automatique possible pour chaque niveau de richesse d'input ?"**

**Résultat Level 0** :  
Pour chaque modalité, la charte LLM qui reproduit le mieux le jugement humain expert (Thomas) basé sur cette modalité.

**Questions Centrales Level 0** :
1. **Quelle modalité permet la meilleure automatisation LLM ?**
   - Modalité Audio → Kappa 0.85 (meilleure performance)
   - Modalité Texte+Contexte → Kappa 0.78
   - Modalité Texte seul → Kappa 0.72
   
2. **Pour chaque modalité, quel niveau de performance automatique ?**
   - Tableau de synthèse : Modalité → Kappa max atteint → Charte gagnante

**Livrable Level 0** : Matrice Performance par Modalité
```
Modalité          | Gold Standard      | Meilleure Charte | Kappa | Coût
------------------|--------------------|------------------|-------|------
Audio Full        | gold_audio_full_y  | CharteY_Audio_B  | 0.85  | €€€€
Texte + Contexte  | gold_text_ctx_y    | CharteY_Ctx_A    | 0.78  | €€€
Texte seul        | gold_text_only_y   | CharteY_Text_C   | 0.72  | €
```

### 1.2 Les 3 Niveaux de l'Analyse

```
┌─────────────────────────────────────────────────────────┐
│ Level 0 : GOLD STANDARD                                 │
│ → Créer la vérité terrain                               │
│ → Valider la reproductibilité des chartes               │
│ → Output : 1 charte validée par variable (X et Y)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Level 1 : ALGORITHM LAB                                 │
│ → Tester algorithmes X/Y sur 901 paires                 │
│ → Comparer versions d'algorithmes                       │
│ → Output : Meilleur algorithme par variable             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Level 2 : HYPOTHESIS TESTING                            │
│ → Tester hypothèses H1 et H2 (médiation)                │
│ → Analyse statistique sur 901 paires                    │
│ → Output : Validation ou réfutation des hypothèses      │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Level 1 et Level 2 - Contexte

**Level 1 : AlgorithmLab - Test Robustesse H1 Multi-Modalités**

*État Actuel (Implémenté)* :
- Tester algorithmes X et Y vs un gold standard unique
- Comparer différentes versions d'algorithmes
- Objectif : Identifier le meilleur algorithme pour chaque variable

*Vision Future (Recherche)* :
- **Tester H1 (Stratégie X → Réaction Y) avec chaque modalité**
  - H1 avec gold_text_only : Validée ? (p-value ?)
  - H1 avec gold_audio_full : Validée ? (p-value ?)
  - H1 avec gold_context : Validée ? (p-value ?)
  - H1 avec annotations automatiques (chartes Level 0) : Validée ?

- **Question scientifique centrale** : "H1 se vérifie-t-elle quelle que soit la modalité d'annotation utilisée ?"

- **Enjeux industrialisation (Trade-off Coût/Performance)** :

```
MODALITÉ RICHE (Audio + Contexte large)
  → Performance maximale : Kappa 0.85, H1 validée p < 0.01
  → Coût : Transcription + Analyse prosodique + Tokens LLM élevés
  → Question : "Quel est le PLAFOND de performance ?"
  
            ↓ Simplification progressive
            
MODALITÉ INTERMÉDIAIRE (Texte + Contexte limité)
  → Performance : Kappa 0.78, H1 validée p < 0.03
  → Coût : Transcription + Tokens LLM moyens
  
            ↓ Simplification maximale
            
MODALITÉ MINIMALE (Texte seul, sans contexte)
  → Performance dégradée : Kappa 0.72, H1 validée p < 0.05
  → Coût : Transcription uniquement + Tokens LLM minimaux
  → Question : "Jusqu'où simplifier SANS invalider H1 ?"
```

**Questions Industrialisation** :
1. **Performance plafond** : Quelle est la meilleure annotation possible (modalité riche) ?
2. **Seuil minimal acceptable** : Quel niveau de simplification préserve encore H1 ?
3. **Décision économique** : Kappa 0.85→0.72 acceptable si coût divisé par 4 ?
4. **Généralisation** : Les algorithmes entraînés sur modalité riche fonctionnent-ils sur modalité simple ?

**Résultat attendu Level 1** :  
Tableau de décision modalité → (Performance, Coût, H1 valide?) pour guider l'industrialisation sur corpus complet.

**Questions Centrales Level 1** :
1. **H1 est-elle respectée quelle que soit la modalité ?**
   - H1 avec gold_audio_full : Validée (p < 0.01) ✅
   - H1 avec gold_text_context : Validée (p < 0.03) ✅
   - H1 avec gold_text_only : Validée (p < 0.05) ✅ ou Invalidée ❌ ?
   
2. **H1 est-elle respectée aussi bien par annotation manuelle qu'automatique ?**
   - H1 avec gold standards (manuel) : Validée
   - H1 avec chartes automatiques Level 0 : Validée aussi ?
   - Si OUI → Automatisation fiable pour industrialisation
   - Si NON → Annotation manuelle nécessaire

**Livrable Level 1** : Matrice Validation H1 Multi-Modalités
```
Modalité          | Annotation Type | H1 Validée ? | p-value | Conclusion
------------------|--------------------|-------------|---------|------------
Audio Full        | Manuelle (gold)    | ✅ OUI      | < 0.01  | Robuste
Audio Full        | Auto (charte)      | ✅ OUI      | < 0.02  | Auto OK
Texte + Contexte  | Manuelle (gold)    | ✅ OUI      | < 0.03  | Robuste
Texte + Contexte  | Auto (charte)      | ✅ OUI      | < 0.04  | Auto OK
Texte seul        | Manuelle (gold)    | ⚠️ LIMITE   | < 0.05  | Fragile
Texte seul        | Auto (charte)      | ❌ NON      | > 0.05  | Auto KO
```

**Décision Industrialisation** :
- Si H1 validée avec Texte+Contexte automatique → Industrialiser avec cette modalité
- Si H1 invalidée sauf avec Audio → Audio obligatoire (coût élevé)
- Trade-off : Robustesse H1 vs Coût de la modalité

**Level 2 : Hypothesis Testing**

- Tester statistiquement les hypothèses H1 (impact direct) et H2 (médiation)
- Analyse Baron-Kenny sur les 901 paires complètes
- Validation ou réfutation des hypothèses de la thèse

---

## 🧩 2. ENTITÉS PRINCIPALES

### 2.1 Charte d'Annotation

**Définition Utilisateur** :  
Une charte est une **spécification formelle** qui décrit comment classifier soit :
- **Variable X** : La stratégie du conseiller (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)
- **Variable Y** : La réaction du client (CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE)

**Composants d'une Charte** :
1. **Philosophie** : 
   - Minimaliste (définitions courtes, peu d'exemples)
   - Enrichie (définitions détaillées, plusieurs exemples par catégorie)
   - Binaire (seulement 2 catégories au lieu de 3+)

2. **Prompt Structure** (12 sections modulaires) :
   - Task Description : Objectif de la classification
   - Preprocessing Instructions : Comment traiter les artefacts [AP], [TC], etc.
   - Examples : Exemples positifs par catégorie
   - Context Template : Format de présentation des tours de parole
   - Constraints : Ce qu'il NE faut PAS faire
   - Output Format : Format de réponse attendu
   - ... 6 autres sections optionnelles

3. **Paramètres LLM** :
   - Modèle (ex: gpt-4o-mini)
   - Temperature (0.0 = déterministe)
   - Max tokens, etc.

4. **Version** : Sémantique (v1.0.0 → v1.1.0 → v2.0.0)

**Exemple Concret** :
```
CharteY_B_v1.0.0 "Enrichie - Audio Full"
- Variable Y (réactions client)
- Modalité : Texte + Audio (prosodie, ton, débit)
- 3 catégories : CLIENT_NEUTRE, CLIENT_NEGATIF, CLIENT_POSITIF
- 3 exemples par catégorie avec indications prosodiques
- Prompt détaillé (~ 500 tokens)
- Temperature 0.0
- Associée à : gold_audio_full_y
```

**Relations** :
- 1 Charte → 1 Gold Standard (association OBLIGATOIRE avant test)
- 1 Charte → N Tests (on peut tester plusieurs fois la même charte)
- 1 Charte → N Versions (évolution par tuning : v1.0.0 → v1.1.0)
- 1 Modalité → N Chartes (plusieurs formulations pour une même modalité)

### 2.2 Test de Charte

**Définition Utilisateur** :  
Un test exécute une charte sur un échantillon de N paires (ex: 50 paires) pour mesurer sa performance.

**Métriques Calculées** :
- **Kappa de Cohen** : Accord inter-annotateur (LLM vs Thomas)
  - < 0.4 = Inacceptable
  - 0.4-0.6 = Modéré
  - 0.6-0.8 = Substantiel
  - > 0.8 = Excellent
- **Accuracy** : % de classifications correctes
- **Désaccords** : Nombre de cas où LLM ≠ Annotation manuelle Thomas

**Cas d'Usage** :
```
Prérequis : CharteY_B associée à gold_audio_full_y

Test de CharteY_B sur 50 paires :
1. Pour chaque paire, générer annotation LLM via CharteY_B
2. Comparer annotation LLM vs annotation dans gold_audio_full_y
3. Calculer Kappa, Accuracy, identifier désaccords
→ Résultat : Kappa 0.80, 8 désaccords
```

**Comparaison de chartes** :
```
CharteY_A (texte seul) vs gold_text_only_y → Kappa 0.65
CharteY_B (audio full) vs gold_audio_full_y → Kappa 0.80 ⭐ Meilleur
CharteY_C (texte+ctx)  vs gold_text_context_y → Kappa 0.70
```

**Relations** :
- 1 Test → 1 Charte (quelle formulation ?)
- 1 Test → 1 Gold Standard (via l'association de la charte)
- 1 Test → N Paires (quel échantillon ?)
- 1 Test → N Annotations LLM (résultats)
- 1 Test → N Désaccords (cas où LLM ≠ Gold)

### 2.3 Gold Standard

**Définition Utilisateur** :  
Un gold standard est un **ensemble d'annotations de référence** pour une variable (X ou Y) créé selon une **modalité d'annotation spécifique**. C'est la "vérité terrain" contre laquelle on compare les chartes automatiques.

**Concept clé : MODALITÉ D'ANNOTATION**

Une modalité définit **quel input est disponible à l'annotateur** pour faire son jugement :

| Modalité | Input Disponible | Exemple Annotation |
|----------|------------------|-------------------|
| **Texte seul** | Verbatim uniquement | "d'accord" → CLIENT_POSITIF (pas d'info sur le ton) |
| **Audio complet** | Verbatim + Prosodie + Ton + Débit | "d'accord" [ton plat] → CLIENT_NEUTRE |
| **Contexte large** | Verbatim + prev3/prev2/prev1 + next1/next2/next3 | "d'accord" [après interaction positive] → CLIENT_POSITIF |
| **Contexte limité** | Verbatim + prev1 + next1 uniquement | "d'accord" [contexte partiel] → CLIENT_NEUTRE |

**Pourquoi plusieurs gold standards ?**

Chaque modalité produit des annotations **légitimes mais différentes**. Un "d'accord" peut être :
- POSITIF si on lit juste le texte (connotation positive du mot)
- NEUTRE si on entend un ton monotone (audio)
- POSITIF si le contexte montre satisfaction antérieure

**Les deux sont "corrects" selon leur modalité !**

**Gold Standards par Modalité (Exemple Variable Y)** :

```
gold_text_only_y
  → 901 annotations basées sur texte seul
  → Annotateur : Thomas (lecture transcriptions)
  → Version : v1.0 (évolutif via CAS A)
  
gold_audio_full_y
  → 901 annotations basées sur audio complet
  → Annotateur : Thomas (écoute appels réels)
  → Version : v1.0 (évolutif via CAS A)
  
gold_text_context_y
  → 901 annotations basées sur texte + contexte prev3→next3
  → Annotateur : Thomas (lecture avec contexte)
  → Version : v1.0 (évolutif via CAS A)
```

**Propriétés** :
- **Variable** : X ou Y
- **Modalité** : Définit le niveau de richesse de l'input
- **Annotateur** : Thomas (expert humain) ou consensus d'annotateurs
- **Version** : Les gold standards évoluent via les validations de désaccords (v1.0, v1.1...)

**Gold Standards Évolutifs** :  
Lors de l'examen des désaccords, si CAS A est identifié (LLM correct, gold incorrect), le gold standard lui-même est corrigé.

**Exemple d'évolution** :
```
Gold Standard "Audio Full Y" v1.0
  Paire 2905 : "d'accord" (ton ironique)
  → Annotation initiale : CLIENT_POSITIF (erreur)
  
Test CharteY_Audio vs gold_audio_full_y
  → CharteY_Audio : CLIENT_NEGATIF
  → Validation : CAS A → Le gold se trompe !
  
Gold Standard "Audio Full Y" v1.1
  → Annotation corrigée : CLIENT_NEGATIF
```

**Relations** :
- 1 Gold Standard ↔ 1 Variable (X ou Y)
- 1 Gold Standard ↔ 1 Modalité (définit l'input disponible)
- N Chartes → 1 Gold Standard (plusieurs chartes peuvent être testées contre le même gold)
- 1 Gold Standard → N Annotations Manuelles (dans analysis_pairs ou table dédiée)

### 2.4 Annotation

**Définition Utilisateur** :  
Une annotation est un **tag** (catégorie) attribué à une paire par un annotateur.

**Types d'Annotateurs** :
1. **human_manual** : Thomas (annotations manuelles, gold standard)
2. **llm_openai** : GPT-4 via une charte (annotations automatiques)
3. **gold_consensus** : Annotations validées consensus (future évolution)

**Exemple** :
```
Paire 2887 (client dit "OK d'accord")
  → Annotation Thomas : CLIENT_NEUTRE (gold)
  → Annotation CharteY_A : CLIENT_NEUTRE (LLM) ✅ Accord
  → Annotation CharteY_B : CLIENT_POSITIF (LLM) ❌ Désaccord
```

**Relations** :
- N Annotations → 1 Paire (plusieurs annotateurs peuvent classer la même paire)
- 1 Annotation → 1 Annotateur (qui a fait ce tag ?)
- 1 Annotation LLM → 1 Test → 1 Charte (quelle formulation a généré ce tag ?)

### 2.5 Désaccord (Disagreement)

**Définition Utilisateur** :  
Un désaccord survient quand **LLM ≠ Thomas** sur une paire donnée.

**Cas Possibles** :
- **CAS A** : LLM correct, Thomas s'est trompé → Corriger gold standard
- **CAS B** : LLM incorrect, charte ambiguë → Améliorer charte (tuning)
- **CAS C** : Cas ambigu, impossible à trancher → Exclure de l'analyse

**Exemple Concret** :
```
Paire 2905 : Client dit "euh... ouais d'accord je suppose"
  → Thomas : CLIENT_NEUTRE
  → CharteY_B : CLIENT_POSITIF

Validation → CAS B (LLM trop optimiste)
  → Suggestion Tuning : Ajouter exemple "accord hésitant = NEUTRE"
```

**Relations** :
- 1 Désaccord → 1 Test (quel test a produit ce désaccord ?)
- 1 Désaccord → 1 Paire (quelle paire pose problème ?)
- 1 Désaccord → 0..1 Validation (Thomas a-t-il analysé ?)

### 2.6 Tuning (Amélioration de Charte)

**Définition Utilisateur** :  
Le tuning est le processus d'**amélioration itérative** d'une charte basé sur l'analyse des désaccords CAS B.

**Types de Suggestions** :
1. **Add Example** : Ajouter un exemple à une catégorie
   - "Ajouter 'OK d'accord' comme exemple CLIENT_NEUTRE"
2. **Modify Description** : Clarifier une définition
   - "Préciser que les confirmations neutres = NEUTRE, pas POSITIF"
3. **Add Rule** : Ajouter une règle de distinction
   - "Si hésitation (euh, je suppose) → toujours NEUTRE"
4. **Modify Prompt Section** : Changer une section du prompt
   - "Activer la section 'Reasoning Instructions'"

**Workflow Tuning** :
```
1. Tester CharteY_B v1.0.0 → 12 désaccords
2. Valider les 12 → 5 CAS B identifiés
3. Générer suggestions depuis CAS B
4. Appliquer 3 suggestions → CharteY_B v1.1.0
5. Re-tester v1.1.0 → 8 désaccords (amélioration !)
6. Itérer jusqu'à Kappa > 0.80
```

**Relations** :
- N Suggestions → 1 Charte (version source)
- 1 Suggestion Appliquée → 1 Charte (nouvelle version)
- N Suggestions ← N Validations CAS B

---

## 🔄 3. WORKFLOW UTILISATEUR COMPLET

### 3.1 Parcours Principal (Happy Path)

```
┌─────────────────────────────────────────────────────────┐
│ 1. GESTION CHARTES                                      │
│    → Créer/dupliquer chartes X et Y                     │
│    → Configurer philosophie et prompt                   │
│    → Sauvegarder CharteY_A, CharteY_B, CharteY_C        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. ASSOCIATION CHARTE ↔ GOLD STANDARD                   │
│    → CharteY_A (texte seul) → gold_text_only_y          │
│    → CharteY_B (audio full) → gold_audio_full_y         │
│    → CharteY_C (texte+ctx)  → gold_text_context_y       │
│    ⚠️  PRÉREQUIS OBLIGATOIRE pour tester !               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. TESTS DE CHARTES                                     │
│    → Sélectionner variable Y                            │
│    → Tester CharteY_A vs gold_text_only_y               │
│    → Tester CharteY_B vs gold_audio_full_y              │
│    → Tester CharteY_C vs gold_text_context_y            │
│    → Résultats : Kappa A=0.65, B=0.80, C=0.70           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. VALIDATION DÉSACCORDS                                │
│    → CharteY_B a 8 désaccords sur 50 paires             │
│    → Analyser chaque cas : CAS A, B ou C ?              │
│    → 2 CAS A → Corriger gold_audio_full_y v1.1          │
│    → 5 CAS B → Améliorer CharteY_B                      │
│    → 1 CAS C → Exclure paire                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. TUNING                                               │
│    → Voir les 5 CAS B validés                           │
│    → Générer suggestions d'amélioration                 │
│    → Appliquer 3 suggestions → CharteY_B v1.1.0         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. COMPARATEUR KAPPA                                    │
│    → Comparer CharteY_B v1.0.0 vs v1.1.0                │
│    → (contre le même gold_audio_full_y v1.1)            │
│    → Kappa v1.0.0 = 0.80, v1.1.0 = 0.85 → Progrès !     │
└─────────────────────────────────────────────────────────┘
                          ↓
                    (Retour à étape 3 si besoin)
```

**Note importante** : Le gold standard et la charte évoluent indépendamment :
- Gold standard corrigé → Version du gold incrémentée (CAS A)
- Charte améliorée → Version de la charte incrémentée (CAS B)

### 3.2 Fil d'Ariane Conceptuel

**Exemple concret d'une session** :

```
Session Level 0 - Variable Y
  ├─ Gold Standards disponibles :
  │   ├─ gold_text_only_y (texte seul)
  │   └─ gold_audio_full_y (texte + audio)
  │
  ├─ Chartes créées : 
  │   ├─ Y_A (Minimaliste, texte seul)
  │   ├─ Y_B (Enrichie, audio)
  │   └─ Y_C (Binaire, texte seul)
  │
  ├─ Associations charte↔gold :
  │   ├─ Y_A → gold_text_only_y
  │   ├─ Y_B → gold_audio_full_y ⭐
  │   └─ Y_C → gold_text_only_y
  │
  ├─ Tests exécutés :
  │   ├─ Test#147 : Y_A vs gold_text_only_y → Kappa 0.65
  │   ├─ Test#148 : Y_B vs gold_audio_full_y → Kappa 0.80 ⭐ Meilleur
  │   └─ Test#149 : Y_C vs gold_text_only_y → Kappa 0.70
  │
  ├─ Désaccords CharteY_B vs gold_audio_full_y : 8 cas
  │   └─ Validations effectuées : 8/8
  │       ├─ CAS A : 2 → gold_audio_full_y v1.0 → v1.1
  │       ├─ CAS B : 5 → Améliorer CharteY_B
  │       └─ CAS C : 1 (exclure)
  │
  ├─ Tuning CharteY_B :
  │   └─ 3 suggestions appliquées → CharteY_B v1.1.0
  │
  └─ Re-test CharteY_B v1.1.0 vs gold_audio_full_y v1.1 : 
      → Kappa 0.85 → Succès !
```

### 3.3 Dépendances Entre Onglets

| Onglet | Prérequis | État Bloquant | Données Utilisées |
|--------|-----------|---------------|-------------------|
| **GESTION CHARTES** | Aucun | - | Chartes en BDD |
| **GOLD STANDARDS** | ≥1 charte créée | "Aucune charte à associer" | Chartes + Gold Standards disponibles |
| **TESTS DE CHARTES** | ≥1 association charte↔gold | "Associez d'abord charte à un gold" | Chartes + Gold Standards + analysis_pairs |
| **VALIDATION DÉSACCORDS** | ≥1 test avec désaccords | "Aucun désaccord à valider" | Tests + Annotations LLM vs Gold |
| **TUNING** | ≥1 validation CAS B | "Aucun CAS B validé" | Validations + Chartes |
| **COMPARATEUR KAPPA** | ≥2 annotateurs (ou tests) | "Besoin de ≥2 sources" | Annotations multiples |
| **AUDIT & DEBUG** | Aucun | - | Logs système |

---

## 🎯 4. NAVIGATION ET CONTEXTE

### 4.1 La Variable (X ou Y) comme Contexte Global

**Problème Actuel** :  
La variable X/Y est sélectionnée dans l'onglet "TESTS DE CHARTES" mais cette sélection :
- ✅ Filtre les chartes dans tous les onglets
- ❌ N'est visible que dans l'onglet "TESTS"
- ❌ Pas de moyen de changer de variable depuis les autres onglets
- ❌ Utilisateur confus : "Où sont les chartes X ?" → Il est en mode Y !

**Pourquoi la Variable est Globale ?**

La variable X et Y sont **indépendantes** :
- X = Stratégies conseiller (4 catégories : ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)
- Y = Réactions client (3 catégories : CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE)

Chaque variable a :
- Ses propres chartes
- Ses propres tests
- Son propre gold standard
- Son propre workflow de tuning

**Mixer X et Y n'aurait aucun sens** → D'où le contexte global.

### 4.2 Principes de Navigation Proposés

#### Principe 1 : Contexte Visible en Permanence

**Solution** : Header global affichant :
```
┌─────────────────────────────────────────────────────┐
│  Level 0 - Gold Standard Creation                  │
│  Variable actuelle : [X - Stratégies ▼]            │
│  Gold Standard : CharteX_A v1.0.0                   │
└─────────────────────────────────────────────────────┘
```

**Avantages** :
- Utilisateur sait toujours dans quel contexte il se trouve
- Peut changer de variable sans retourner à "TESTS"
- Voit immédiatement quelle charte est baseline

#### Principe 2 : État des Prérequis Visible

Chaque onglet devrait indiquer si utilisable :

```
┌─────────────────────────────────────────────────────┐
│  TABS:                                              │
│  [Tests] [Gold ✅ 2 tests] [Validation ⚠️ 0 désacc] │
└─────────────────────────────────────────────────────┘
```

**Signification** :
- ✅ Utilisable (données disponibles)
- ⚠️ Vide mais utilisable (pas de données encore)
- 🚫 Bloqué (prérequis non rempli)

#### Principe 3 : Workflow Guidé

**Pour les nouveaux utilisateurs**, afficher un stepper :

```
1. Créer chartes → 2. Tester → 3. Associer Gold → 4. Valider → 5. Tuner
   [FAIT]            [EN COURS]    [À FAIRE]         [À FAIRE]   [À FAIRE]
```

**Actions Contextuelles** :
- Si aucune charte : Bouton "Créer votre première charte"
- Si chartes créées mais pas testées : Bouton "Lancer votre premier test"
- Si tests faits mais gold non associé : Bouton "Associer au gold standard"

#### Principe 4 : Fil d'Ariane dans Sidebar

```
📊 Phase 3 - Analyse
  └─ Level 0 - Gold Standard
      ├─ Variable Y (actuelle)
      │   ├─ 3 chartes
      │   ├─ 5 tests effectués
      │   ├─ Gold : CharteY_B v1.0.0
      │   └─ 2 validations en attente
      └─ Variable X
          ├─ 2 chartes
          ├─ 2 tests effectués
          └─ Gold : Non associé
```

---

## 🚧 5. PROBLÈMES D'ERGONOMIE ACTUELS

### 5.1 Confusion Variable X/Y

**Symptôme** :  
"Je ne vois pas mes chartes X alors que je les ai créées !"

**Cause** :  
Variable Y sélectionnée dans "TESTS" mais utilisateur ne le voit pas ailleurs.

**Solution** : Header global avec sélecteur variable

### 5.2 Dépendances Implicites

**Symptôme** :  
"L'onglet GOLD STANDARDS est vide, bug ?"

**Cause** :  
Aucun test n'a été exécuté → Rien à associer au gold.

**Solution** : Message explicite + lien vers "TESTS"

### 5.3 Pas de Création/Duplication de Charte

**Symptôme** :  
"Comment créer une nouvelle charte pour tester une autre approche ?"

**Cause** :  
Interface de gestion permet seulement édition, pas création.

**Solution** : Boutons "Créer" et "Dupliquer" avec wizard

### 5.4 Changement de Variable Caché

**Symptôme** :  
"Je dois retourner à l'onglet TESTS pour changer de X à Y ?"

**Cause** :  
Sélecteur variable uniquement dans un onglet.

**Solution** : Sélecteur dans header global

### 5.5 Pas de Vue Synthétique

**Symptôme** :  
"Où en suis-je dans mon workflow Level 0 ?"

**Cause** :  
Pas de dashboard récapitulatif de l'avancement.

**Solution** : Onglet "DASHBOARD" avec :
- Nombre de chartes créées (X et Y)
- Tests effectués et résultats Kappa
- Gold standards associés ou non
- Désaccords en attente de validation
- Suggestions de tuning disponibles

---

## 🎨 6. AMÉLIORATIONS PRIORITAIRES

### 6.1 Court Terme (Sprint 6)

1. **Header Contexte Global** :
   - Afficher variable actuelle
   - Sélecteur rapide X ↔ Y
   - Afficher charte gold associée

2. **Messages d'État Explicites** :
   - "Aucun test disponible → [Lancer un test]"
   - "Aucune charte créée → [Créer votre première charte]"

3. **Création/Duplication Chartes** :
   - Bouton "Créer nouvelle charte"
   - Bouton "Dupliquer" sur chaque ligne
   - Wizard simple : Nom, Variable, Philosophie, Copier depuis...

### 6.2 Moyen Terme (Sprint 7-8)

1. **Dashboard Synthétique** :
   - Vue d'ensemble avancement par variable
   - Graphique évolution Kappa au fil des versions
   - Recommandations automatiques ("Vous avez 5 CAS B non traités")

2. **Workflow Guidé** :
   - Stepper visuel de progression
   - Onboarding interactif pour nouveaux utilisateurs

3. **Comparaison Visuelle** :
   - Côte-à-côte de 2 chartes (diff prompt)
   - Graphique Kappa de toutes les chartes testées

### 6.3 Long Terme (Sprint 9+)

1. **Versioning Visuel** :
   - Timeline des versions d'une charte
   - Diff automatique entre v1.0.0 et v1.1.0
   - Rollback possible

2. **Tuning Intelligent** :
   - Suggestions automatiques basées sur patterns
   - Prédiction impact Kappa avant application

3. **Export/Import** :
   - Exporter charte en JSON
   - Partager entre projets
   - Templates communautaires

---

## 📊 7. DIAGRAMMES

### 7.1 Schéma Relationnel Simplifié

```
┌──────────────┐
│   CHARTE     │
│ (definition) │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────▼───────┐        ┌──────────────┐
│     TEST     │───────>│ ANNOTATIONS  │
│  (metrics)   │   N    │   (LLM)      │
└──────┬───────┘        └──────────────┘
       │                        │
       │ N                      │ N
       │                        │
┌──────▼───────┐        ┌──────▼───────┐
│ DÉSACCORDS   │───────>│  VALIDATION  │
│ (LLM≠Thomas) │   1    │  (CAS A/B/C) │
└──────────────┘        └──────┬───────┘
                               │
                               │ N (si CAS B)
                               │
                        ┌──────▼───────┐
                        │   TUNING     │
                        │ (suggestions)│
                        └──────────────┘
```

### 7.2 Workflow Utilisateur (Vue Macro)

```
CRÉER → ASSOCIER GOLD → TESTER → VALIDER → TUNER → COMPARER
  ↑                                                      │
  └──────────────────── ITÉRER ←────────────────────────┘
```

**Détails** :
1. **CRÉER** : Chartes avec modalité définie
2. **ASSOCIER GOLD** : Lier charte à gold standard correspondant (PRÉREQUIS)
3. **TESTER** : Exécuter charte vs gold, calculer Kappa
4. **VALIDER** : Analyser désaccords (CAS A/B/C)
5. **TUNER** : Améliorer charte (CAS B) ou gold (CAS A)
6. **COMPARER** : Comparer versions ou chartes entre elles
7. **ITÉRER** : Re-tester version améliorée

### 7.3 Contexte Variable X/Y

```
Application TaggerLPL
│
├─ Phase 1 : Corpus
├─ Phase 2 : Annotation
└─ Phase 3 : Analyse
    ├─ Level 0 : Gold Standard
    │   ├─ [CONTEXTE : Variable X] ← Sélection globale
    │   │   ├─ Chartes X : CharteX_A, CharteX_B
    │   │   ├─ Tests X : ...
    │   │   └─ Gold X : CharteX_A
    │   │
    │   └─ [CONTEXTE : Variable Y] ← Sélection globale
    │       ├─ Chartes Y : CharteY_A, CharteY_B, CharteY_C
    │       ├─ Tests Y : ...
    │       └─ Gold Y : CharteY_B
    │
    ├─ Level 1 : AlgorithmLab
    └─ Level 2 : Hypotheses
```

---

## ✅ 8. VALIDATION & PROCHAINES ÉTAPES

### 8.1 Questions à Valider

1. ❓ Le header global avec sélecteur variable résout-il la confusion X/Y ?
2. ❓ Les messages d'état explicites aident-ils à comprendre les prérequis ?
3. ❓ La création/duplication de chartes est-elle prioritaire ?
4. ❓ Faut-il un dashboard synthétique ou les onglets suffisent ?
5. ❓ Le workflow guidé (stepper) est-il utile ou infantilisant ?

### 8.2 Actions Immédiates

**Sprint 6 - Session 6** :
- [ ] Implémenter header contexte global
- [ ] Ajouter sélecteur variable dans header
- [ ] Afficher gold standard actuel dans header
- [ ] Messages d'état explicites par onglet
- [ ] Boutons "Créer" et "Dupliquer" chartes

**Sprint 6 - Session 7** :
- [ ] Wizard création charte
- [ ] Dashboard synthétique (MVP)
- [ ] Comparateur visuel de 2 chartes

---

## 📚 9. DOCUMENTS CONNEXES

**Documents Techniques** :
- `docs/ai_context/specs/ARCHITECTURE_TABLES_FLUX_LEVEL0.md` : Tables SQL et colonnes
- `docs/ai_context/specs/FLUX_DONNEES_LEVEL0.md` : Flux technique d'un test
- `docs/decisions/ADR-005_charte_tuning_system.md` : Décisions système tuning

**Documents Fonctionnels** :
- `docs/ai_context/specs/SPEC_CHARTE_MANAGEMENT_UI_v2.md` : Spécifications interface
- `docs/ai_context/specs/SPECS_CHARTE_TUNING_SYSTEM.md` : Spécifications tuning
- `docs/ai_context/specs/SPECS_KAPPA_COMPARATOR.md` : Spécifications comparateur

**Architecture Globale** :
- `docs/architecture/ARCHITECTURE_CIBLE_WORKFLOW.md` : Vision 3 phases

---

**FIN DU DOCUMENT**

**Date de dernière mise à jour** : 2025-12-24  
**Statut** : ✅ Draft v1.0 - En révision avec Thomas
