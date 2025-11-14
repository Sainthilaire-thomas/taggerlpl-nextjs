## Hypothèse 1 (H1) : Effet direct des stratégies sur la réaction client

### 1. Formulation

**H1** :

Les stratégies linguistiques du conseiller influencent directement la polarité de la réaction client dans le tour adjacent.

- **ENGAGEMENT** et **OUVERTURE** → corrélées à des réactions plus positives.
- **EXPLICATION** → corrélée à des réactions plus négatives.
- **REFLET** → effets plus variables, souvent neutres ou mitigés.

### 2. Logique scientifique

- H1 établit l’ **effet total** , au niveau empirique.
- Il se fonde sur l’analyse des **paires adjacentes** conseiller–client : la stratégie employée dans le tour du conseiller impacte immédiatement la valence du tour suivant du client.

### 3. Variables

- **X** : stratégie du conseiller (ENGAGEMENT, OUVERTURE, EXPLICATION, REFLET).
- **Y** : réaction client (POSITIVE / NEUTRE / NÉGATIVE).

### 4. Méthodologie

- Analyses descriptives + χ² / V de Cramér pour la distribution des réactions par stratégie.
- GLMM logit/ordinal avec contrôles (ancienneté, type de demande, durée du tour, secteur).

### 5. Résultats attendus

- ENGAGEMENT/OUVERTURE → majoritairement positives.
- EXPLICATION → majoritairement négatives.
- REFLET → plutôt neutres, parfois négatives.

## Hypothèse 2 (H2) : Médiation interactionnelle (explication mécanistique)1. Formulation de l’hypothèse

**H2** :

La polarité de la réaction immédiate du client dans le tour adjacent est :

- positivement corrélée à l’alignement linguistique et prosodique entre le conseiller et le client,
- négativement corrélée à des marqueurs linguistiques et paralinguistiques de charge cognitive.

Autrement dit :

- Les stratégies **ENGAGEMENT** et **OUVERTURE** , riches en verbes d’action concrets, devraient générer un **alignement fort** et une **faible charge cognitive** , conduisant à des réactions **CLIENT_POSITIF** .
- La stratégie **EXPLICATION** , mobilisant un discours abstrait et métaphorique, devrait être associée à un **alignement faible** , une **charge cognitive élevée** , et des réactions **CLIENT_NEGATIF** .

## 2. Position dans la logique scientifique

- **H1** établit l’effet total (niveau empirique) :

  _ENGAGEMENT/OUVERTURE → réactions positives (vs. EXPLICATION → négatives)._

- **H2** propose l’explication mécanistique (niveau théorique) :

  _Les effets de H1 passent par trois médiateurs interactionnels et cognitifs (M1, M2, M3)._

- **H3** (niveau applicatif) explorera l’exploitation de ces mécanismes en formation professionnelle.

## 3. Variables et médiateurs

- **X (indépendante)** : stratégie du conseiller (ENGAGEMENT, OUVERTURE, EXPLICATION, REFLET).
- **M1 (médiateur cognitif)** : densité de verbes d’action (analyse morphosyntaxique).
- **M2 (médiateur interactionnel)** : alignement lexical, sémantique, pragmatique, prosodique, latence <400ms.
- **M3 (médiateur client)** : charge cognitive (hésitations, pauses, demandes de clarification, intonation instable).
- **Y (dépendante)** : polarité de la réaction client (POSITIVE / NEUTRE / NÉGATIVE).
- **Contrôles** : complexité de la demande, ancienneté conseiller, durée du tour, secteur.
- **Effets aléatoires** : intercepts pour Appel et Conseiller (GLMM).

## 4. Méthodologie d’analyse

**Étape A : Stratégie → Médiateurs**

- Régressions mixtes : effet des stratégies sur M1, M2, M3.
- Prédictions : ENGAGEMENT/OUVERTURE = M1↑, M2↑, M3↓ ; EXPLICATION = M1↓, M2↓, M3↑.

**Étape B : Médiateurs → Réaction client**

- GLMM logit/ordinal : Y ~ M1 + M2 + M3 + contrôles + (1|Conseiller) + (1|Appel).
- Hypothèse : M1, M2 → positifs ; M3 → négatif.

**Étape C : Effet total vs effet direct**

- Effet total (H1) : Y ~ Stratégie + contrôles.
- Effet direct (H2) : Y ~ Stratégie + M1 + M2 + M3 + contrôles.

**Étape D : Médiation**

- Effets indirects (a×b) via bootstrap (5000 réplications).
- Validation si IC95% exclut 0.

## 5. Résultats attendus

- ENGAGEMENT/OUVERTURE → M1↑, M2↑, M3↓ → réactions positives.
- EXPLICATION → M1↓, M2↓, M3↑ → réactions négatives.
- Validation : effets de X sur Y passent significativement par M1, M2, M3.

## 6. Présentation des résultats

- **Tableaux** : corrélations descriptives, régressions Stratégie→Médiateurs, Médiateurs→Y, effets total/direct, effets indirects bootstrapés.
- **Figures** : diagramme SEM avec coefficients, effets marginaux (proba Y_POSITIF selon M1, M2, M3), forest plot OR, barres d’effets indirects.

## 7. Interprétation scientifique

- H2 fournit l’explication mécanistique de H1.
- Les corrélations ne « prouvent » pas la causalité stricte, mais :
  - Elles s’appuient sur des modèles cognitifs établis (neurones miroirs, cognition incarnée, coût métaphorique).
  - Elles sont triangulées par plusieurs niveaux (quantitatif, interactionnel, cognitif).
  - Elles autorisent une inférence causale prudente : _les stratégies influencent les réactions client via les médiateurs interactionnels et cognitifs_ .

## Hypothèse 3 (H3) : Implications pratiques et applications

### 1. Formulation

**H3** :

Les mécanismes identifiés (H1 + H2) peuvent être exploités pour améliorer les pratiques professionnelles, en particulier :

- la formation des conseillers,
- la conception de scripts et d’outils conversationnels,
- l’intégration dans les systèmes d’assistance (chatbots, outils de feedback).

### 2. Logique scientifique

- H3 se situe au niveau **applicatif** : il vise à traduire les résultats empiriques (H1) et explicatifs (H2) en **outils opérationnels** pour la formation et l’ingénierie conversationnelle.
- Il s’appuie sur les résultats de la recherche ProComm (action descriptions vs explications) et sur la littérature en ergonomie et communication professionnelle.

### 3. Variables et domaines d’application

- **Variables exploitées** :
  - Stratégies (X),
  - Médiateurs (M1–M3),
  - Réactions (Y).
- **Domaines d’application** :
  - **Formation** : sensibiliser les conseillers aux effets des différentes stratégies.
  - **Scripts & outils** : privilégier ENGAGEMENT/OUVERTURE, limiter EXPLICATION excessive.
  - **Chatbots / IA conversationnelle** : intégrer les médiateurs (ex. détecter désalignement ou surcharge cognitive pour adapter la réponse).

### 4. Méthodologie

- Analyse des retombées pratiques dans le corpus (cas où les stratégies réussissent ou échouent).
- Étude comparative avec recommandations existantes en centre de contact.
- Proposition d’un **modèle intégré de formation et d’outillage** .

### 5. Résultats attendus

- Confirmation que la mise en avant d’ENGAGEMENT/OUVERTURE améliore la satisfaction client et réduit la durée des appels.
- Proposition d’une grille de bonnes pratiques issue de la recherche (H1 + H2).
- Démonstration de la transférabilité vers d’autres domaines (santé, services publics, etc.).

---

# Synthèse générale H1–H2–H3

- **H1 (empirique)** : il existe un effet direct entre stratégie et réaction client.
- **H2 (explicatif)** : cet effet passe par des médiateurs interactionnels et cognitifs (verbes d’action, alignement, charge).
- **H3 (applicatif)** : la compréhension de ces mécanismes permet de concevoir des formations, scripts et outils conversationnels plus efficaces.
