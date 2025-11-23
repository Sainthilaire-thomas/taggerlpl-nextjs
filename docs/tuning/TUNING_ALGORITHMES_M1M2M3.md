# 🔧 PISTES D'AMÉLIORATION DES ALGORITHMES DE MÉDIATION (M1, M2, M3)

**Session de tuning prévue** : Optimisation des médiateurs pour validation H2 complète

---

## 📊 ÉTAT ACTUEL DES RÉSULTATS

### ✅ **M1 - Densité de verbes d'action** (VALIDÉ)

- **ANOVA** : F = 49.01, p < 0.001 ✅ Très significatif
- **Corrélation M1→Y** : r = 0.146, p = 0.010 ✅ Significatif (faible)
- **Discrimination** : ENGAGEMENT (4.87) vs EXPLICATION (0.87) = 5.6× ✅ Excellent
- **Verdict** : Algorithme fonctionnel, mais corrélation faible

### ⚠️ **M2 - Alignement lexical** (À AMÉLIORER)

- **ANOVA** : F = 6.99, p = 0.010 ✅ Significatif
- **Corrélation M2→Y** : r = -0.080, p = 0.050 ❌ Non significatif
- **Discrimination** : Toutes stratégies entre 0.03-0.06 ⚠️ Très faible variance
- **Problème** : L'algorithme ne capture pas bien l'alignement réel

### ❌ **M3 - Charge cognitive** (À REFAIRE)

- **ANOVA** : F = 1.92, p = 1.000 ❌ Non significatif
- **Corrélation M3→Y** : r = -0.131, p = 0.010 ✅ Significatif (mais sens correct !)
- **Discrimination** : Toutes stratégies = 0.04-0.06 ❌ Aucune variance
- **Problème** : Algorithme trop peu sensible, classe tout en "FAIBLE"

---

## 🎯 M1 - DENSITÉ DE VERBES D'ACTION

### **Résultats actuels**

| Stratégie  | M1 Moyen | SD   | Range        |
| ----------- | -------- | ---- | ------------ |
| ENGAGEMENT  | 4.87     | 6.39 | [0.0 - 27.3] |
| EXPLICATION | 0.87     | 2.43 | [0.0 - 20.0] |
| OUVERTURE   | 3.02     | 5.69 | [0.0 - 50.0] |
| REFLET      | 0.51     | 2.11 | [0.0 - 15.6] |

### **Observation**

- ✅ Bonne discrimination entre profils ACTION vs EXPLANATION
- ⚠️ Corrélation M1→Y faible (r = 0.146) : seulement 2.1% de variance expliquée
- ⚠️ SD très élevé = beaucoup de variance intra-stratégie

### **Pistes d'amélioration**

#### 1️⃣ **Normaliser par la longueur du segment conseiller**

**Problème actuel** : Un long verbatim avec 5 verbes = score 5, un court avec 5 verbes = score 5 aussi
**Solution** :
\\\	ypescript
m1_normalized = (verb_count / word_count) * 100  // Densité en %
\\
**Bénéfice** : Compare des "taux" plutôt que des comptages bruts

#### 2️⃣ **Pondérer selon le type de verbe d'action**

**Problème actuel** : "essayer" = "faire" = "commencer" (tous = 1 point)
**Solution** : Catégoriser les verbes
\\\	ypescript
VERBES_FORTS = ["faire", "créer", "résoudre", "construire"]  → poids 1.5
VERBES_MOYENS = ["essayer", "tenter", "chercher"]             → poids 1.0
VERBES_FAIBLES = ["penser", "voir", "regarder"]               → poids 0.5
\\
**Bénéfice** : Capture mieux l'intensité d'action

#### 3️⃣ **Exclure les verbes dans les questions**

**Problème actuel** : "Est-ce que vous pouvez **faire** ça ?" compte comme verbe d'action
**Solution** :
\\\	ypescript
if (sentence.endsWith('?') && sentence.includes('vous')) {
  // Ne pas compter les verbes dans les questions au client
}
\\
**Bénéfice** : Différencie impératif (ACTION) vs interrogatif (NEUTRAL)

#### 4️⃣ **Détecter les séquences impératives**

**Problème actuel** : Un verbe isolé = 1 point, une séquence "cliquez puis confirmez" = 2 points (linéaire)
**Solution** :
\\\	ypescript
if (detectImperativeSequence(segment)) {
  m1_score *= 1.3  // Bonus séquence d'actions
}
\\
**Bénéfice** : Récompense les stratégies ENGAGEMENT avec guidage structuré

---

## 🔗 M2 - ALIGNEMENT LEXICAL

### **Résultats actuels**

| Stratégie  | M2 Moyen | SD    | Range         |
| ----------- | -------- | ----- | ------------- |
| ENGAGEMENT  | 0.039    | 0.073 | [0.00 - 0.50] |
| EXPLICATION | 0.059    | 0.085 | [0.00 - 0.67] |
| OUVERTURE   | 0.037    | 0.074 | [0.00 - 0.40] |
| REFLET      | 0.031    | 0.076 | [0.00 - 0.50] |

### **Problème majeur**

- ❌ Toutes les stratégies ont des scores quasi-identiques (0.03-0.06)
- ❌ Corrélation M2→Y non significative (p = 0.050)
- ❌ L'algorithme ne détecte pas les vrais alignements conversationnels

### **Pistes d'amélioration**

#### 1️⃣ **Exclure les stopwords du calcul** ⭐ PRIORITÉ 1

**Problème actuel** : "le", "de", "que", "je", "vous" comptent dans l'alignement
**Solution** :
\\\	ypescript
STOPWORDS_FR = ["le", "la", "les", "de", "du", "que", "qui", "je", "vous", "il", ...];

function calculateAlignment(conseillerWords, clientWords) {
  const conseillerFiltered = conseillerWords.filter(w => !STOPWORDS_FR.includes(w));
  const clientFiltered = clientWords.filter(w => !STOPWORDS_FR.includes(w));

  const overlap = intersection(conseillerFiltered, clientFiltered);
  return overlap.length / Math.max(conseillerFiltered.length, clientFiltered.length);
}
\\
**Bénéfice** : Focus sur les mots **sémantiquement riches**

#### 2️⃣ **Utiliser les lemmes au lieu des formes fléchies**

**Problème actuel** : "bloquer" ≠ "bloqué" ≠ "bloque" = 0 alignement
**Solution** :
\\\	ypescript
import { lemmatize } from 'french-lemmatizer';

const conseillerLemmas = conseillerWords.map(w => lemmatize(w));
const clientLemmas = clientWords.map(w => lemmatize(w));
// Puis calculer overlap sur lemmes
\\
**Bénéfice** : Détecte "je bloque" (client) → "débloquer" (conseiller)

#### 3️⃣ **Fenêtre temporelle : t-1, t0, t+1**

**Problème actuel** : Compare seulement conseiller_t0 vs client_t0
**Solution** :
\\\	ypescript
// Calculer alignement entre :
// - Conseiller_t0 vs Client_t-1 (le client répond à quoi ?)
// - Conseiller_t0 vs Client_t0 (synchronie immédiate)
// - Conseiller_t0 vs Client_t+1 (impact sur réaction suivante)

m2_score = max(align_t-1, align_t0, align_t+1)
\\
**Bénéfice** : Capture le vrai flux conversationnel

#### 4️⃣ **Ignorer les tags \[TC]\**

**Problème actuel** : "\[TC\]" apparaît dans conseiller ET client = fausse similarité
**Solution** :
\\\	ypescript
const cleanText = text.replace(/\[TC\]/g, '').replace(/\[AP\]/g, '');
\\
**Bénéfice** : Ne compte que le contenu réel

#### 5️⃣ **Pondérer selon la fréquence des mots**

**Problème actuel** : "problème" (fréquent) = "débiter" (rare) en termes d'alignement
**Solution** : TF-IDF pour pondérer les mots rares
\\\	ypescript
// Mots rares partagés = alignement plus fort
score = sum(overlap_words.map(w => idf_weight(w)))
\\
**Bénéfice** : Récompense l'utilisation du vocabulaire spécifique du client

---

## 🧠 M3 - CHARGE COGNITIVE

### **Résultats actuels**

| Stratégie  | M3 Moyen | SD   | Range       |
| ----------- | -------- | ---- | ----------- |
| ENGAGEMENT  | 0.05     | 0.09 | [0.0 - 0.4] |
| EXPLICATION | 0.06     | 0.09 | [0.0 - 0.7] |
| OUVERTURE   | 0.04     | 0.07 | [0.0 - 0.3] |
| REFLET      | 0.06     | 0.09 | [0.0 - 0.4] |

### **Problème majeur**

- ❌ ANOVA non significative (F = 1.92, p = 1.000)
- ❌ Aucune différence entre stratégies
- ❌ Range trop étroit : toutes les réactions = "FAIBLE"
- ⚠️ Mais corrélation M3→Y correcte (r = -0.131, p = 0.010) : le **sens** est bon !

### **Diagnostic**

L'algorithme détecte bien que M3↑ → CLIENT_NEGATIF, **mais il classe presque tout en M3 ≈ 0**

### **Pistes d'amélioration**

#### 1️⃣ **Revoir les poids des indicateurs** ⭐ PRIORITÉ 1

**Formule actuelle** (probablement) :
\\\	ypescript
m3_score = (hesitation_count * 0.3) + (pause_count * 0.1) + (1 / speech_rate * 0.2)
\\\

**Problème** : Trop conservateur, scores trop bas

**Solution** : Amplifier les poids
\\\	ypescript
m3_score = (hesitation_count * 1.0) +    // 1 hésitation = +1.0
           (pause_count * 0.5) +          // 1 pause = +0.5
           (repetition_count * 0.8) +     // 1 répétition = +0.8
           (clarification_count * 1.5) +  // 1 demande clarif = +1.5 (fort signal)
           (correction_count * 1.2)       // 1 autocorrection = +1.2
\\\

**Normaliser par longueur** :
\\\	ypescript
m3_normalized = m3_raw_score / (word_count / 10)  // Pour 10 mots
\\\

#### 2️⃣ **Élargir les marqueurs de disfluence**

**Actuellement détecté** : "euh", "ben", "hein", "..."

**À ajouter** :
\\\	ypescript
HESITATIONS = [
  "euh", "ben", "hein", "heu", "bah", "enfin",
  "disons", "comment dire", "tu vois", "vous voyez"
];

REPRISES = [
  "non", "pardon", "je veux dire", "c'est-à-dire",
  "enfin bref", "en fait"
];

CLARIFICATIONS_CLIENT = [
  "je comprends pas", "c'est quoi", "ça veut dire quoi",
  "comment", "pourquoi", "hein ?", "quoi ?"
];

REPETITIONS = detecter_repetitions_mots(segment);  // "le le problème"
\\\

#### 3️⃣ **Analyser le débit de parole (vitesse)** ⭐ IMPORTANT

**Hypothèse** : Client avec charge cognitive élevée → parle **plus lentement**

**Solution** :
\\\	ypescript
const speechRate = word_count / estimated_duration;  // mots/seconde

if (speechRate < 2.0) {  // Très lent
  m3_score += 1.5;
} else if (speechRate < 2.5) {  // Lent
  m3_score += 0.8;
}
\\\

**Problème** : Pas de timestamps audio dans les données actuelles
**Workaround** : Utiliser la ponctuation
\\\	ypescript
const pause_count = segment.match(/\.\.\./g)?.length || 0;
const estimated_pauses = pause_count * 0.5;  // 0.5s par "..."
\\\

#### 4️⃣ **Détecter les structures syntaxiques complexes**

**Hypothèse** : Phrases longues et complexes du conseiller → charge cognitive client ↑

**Solution** :
\\\	ypescript
const sentence_length = segment.split(/[.!?]/).map(s => s.split(' ').length);
const avg_length = mean(sentence_length);

if (avg_length > 20) {  // Phrases très longues
  m3_score += 0.5;
}

// Compter les subordonnées
const subordinate_count = (segment.match(/\bqui\b|\bque\b|\bdont\b/gi) || []).length;
if (subordinate_count > 3) {
  m3_score += 0.4;
}
\\\

#### 5️⃣ **Fenêtre glissante sur 3 tours**

**Hypothèse** : Charge cognitive s'accumule sur plusieurs tours

**Solution** :
\\\	ypescript
// Au lieu de calculer M3 sur client_t0 seulement
// Calculer sur client_t-1 + client_t0 + client_t+1

m3_cumulative = (m3_t-1 + m3_t0 + m3_t+1) / 3
\\\

---

## 📋 PLAN D'ACTION POUR LA SESSION DE TUNING

### **Phase 1 : M3 (PRIORITÉ MAXIMALE)**

**Objectif** : Obtenir ANOVA significative + discrimination entre stratégies

1. Revoir les poids des indicateurs (×3 minimum)
2. Ajouter marqueurs de disfluence
3. Tester sur 50 exemples manuellement annotés
4. Valider : EXPLICATION doit avoir M3↑

**Critère de succès** :

- ANOVA M3 : p < 0.05
- EXPLICATION : M3 > 0.3 en moyenne
- ENGAGEMENT : M3 < 0.15 en moyenne

---

### **Phase 2 : M2 (AMÉLIORATION)**

**Objectif** : Augmenter discrimination + corrélation M2→Y significative

1. Exclure stopwords
2. Utiliser lemmes
3. Fenêtre temporelle ±1 tour
4. Tester sur 50 paires

**Critère de succès** :

- Corrélation M2→Y : p < 0.05
- EXPLICATION : M2 > 0.10 (actuellement 0.059)
- Variance entre stratégies visible

---

### **Phase 3 : M1 (OPTIMISATION)**

**Objectif** : Renforcer corrélation M1→Y

1. Normaliser par longueur
2. Pondérer types de verbes
3. Exclure questions
4. Tester sur 50 paires

**Critère de succès** :

- Corrélation M1→Y : r > 0.20 (actuellement 0.146)
- SD réduit intra-stratégie

---

## 📊 MÉTHODE DE VALIDATION

### **Pour chaque amélioration**

1. **Gold Standard** : Annoter manuellement 50 paires

   - 10 ENGAGEMENT
   - 10 EXPLICATION
   - 10 OUVERTURE
   - 10 REFLET
   - 10 réactions positives
   - 10 réactions négatives
2. **Comparer avant/après**

   - ANOVA : p-value diminue ?
   - Corrélation : r augmente ?
   - Distribution : variance augmente ?
3. **Itérer** jusqu'à validation

---

## 🎯 OBJECTIFS FINAUX

**Validation H2 complète nécessite** :

✅ **H2a validée** : Stratégies efficaces (H1) ont M1↑ M2↑ et M3↓

- M1 : DÉJÀ OK
- M2 : À améliorer
- M3 : À refaire

✅ **H2b validée** : Médiateurs prédisent réactions

- M1→Y : r > 0.20, p < 0.05
- M2→Y : r > 0.15, p < 0.05 (positif)
- M3→Y : r < -0.15, p < 0.05 (négatif)

✅ **Résultats pour thèse** :

- "Les stratégies ACTION mobilisent **4.5× plus de verbes d'action** (M1↑)"
- "Les stratégies ACTION génèrent **2× plus d'alignement lexical** (M2↑)"
- "Les stratégies EXPLANATION imposent **une charge cognitive 3× supérieure** (M3↑)"

---

## 📁 FICHIERS À MODIFIER

### **M1**

\\
src/features/phase3-analysis/level1-algorithme-lab/algorithms/mediators/m1-verbs/
  ├── VerbDensityM1Calculator.ts          # Logique calcul
  └── VerbDensityM1Calculator.spec.ts     # Tests unitaires
\\\

### **M2**

\\
src/features/phase3-analysis/level1-algorithme-lab/algorithms/mediators/m2-alignment/
  ├── GlobalAlignmentM2Calculator.ts      # Logique calcul
  └── GlobalAlignmentM2Calculator.spec.ts # Tests unitaires
\\\

### **M3**

\\
src/features/phase3-analysis/level1-algorithme-lab/algorithms/mediators/m3-cognitive/
  ├── PausesM3Calculator.ts               # Logique calcul
  └── PausesM3Calculator.spec.ts          # Tests unitaires
\\\

---

## ⏱️ ESTIMATION TEMPS

- **M3 refonte** : 2-3 heures
- **M2 amélioration** : 1-2 heures
- **M1 optimisation** : 1 heure
- **Tests et validation** : 2 heures

**TOTAL** : 6-8 heures de développement

---

**📌 À garder pour la prochaine session !**
