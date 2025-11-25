# 📘 GUIDE UTILISATEUR - Système de Versioning & Investigation
**Version** : 1.0  
**Public** : Chercheurs / Doctorants utilisant TaggerLPL pour validation algorithmique  
**Objectif** : Workflow scientifique rigoureux pour tester, investiguer et valider des algorithmes

---

## 🎯 VUE D'ENSEMBLE

Le système de versioning permet de :
1. **Tester** un algorithme sur le gold standard (901 paires)
2. **Décider** du sort du test (rejeter, investiguer, valider)
3. **Investiguer** les erreurs systématiquement avec annotations
4. **Valider** une version comme baseline de référence
5. **Tracer** l'évolution des performances dans le temps

### Bénéfices pour la recherche
- ✅ Traçabilité complète des expérimentations
- ✅ Historique des décisions scientifiques
- ✅ Cycle d'amélioration structuré (test → investigation → correction → retest)
- ✅ Comparaison automatique avec baseline
- ✅ Validation reproductible

---

## 📋 WORKFLOW COMPLET

### Étape 1️⃣ : Lancer un Test d'Algorithme

**Navigation** : Phase 3: Analyse → Level 1: AlgorithmLab → Variable X/Y/M

**Actions** :
1. Sélectionner l'algorithme à tester
2. Choisir la taille d'échantillon (recommandé: 1000 pour 901 paires)
3. Cliquer sur **"LANCER TEST"**

**Résultat attendu** :
- Accordéon "Métriques Globales" se remplit (Accuracy, Kappa, etc.)
- Accordéon "🎯 Décision post-test" apparaît en orange avec badge "Action requise"

**Métriques affichées** :
\\\
Accuracy: 75.3%
Kappa: 0.68 (Bon)
Temps moyen: 45ms
Confiance moyenne: 82%
\\\

---

### Étape 2️⃣ : Prendre une Décision Post-Test

**Localisation** : Accordéon "🎯 Décision post-test" (orange, en bas)

#### Option A : REJETER le test ❌

**Quand l'utiliser** :
- Test exploratoire non concluant
- Bug évident dans l'algorithme
- Performance insuffisante (< 60% accuracy)

**Action** :
1. Cliquer sur **"Rejeter"**
2. (Optionnel) Ajouter un commentaire : "Règles trop permissives, trop de faux positifs"
3. Confirmer

**Effet** :
- Test marqué \outcome='discarded'\ en base
- Accordéon "Décision" disparaît
- Le test reste visible dans l'historique mais n'est pas pris en compte

#### Option B : INVESTIGUER les erreurs 🔍

**Quand l'utiliser** :
- Performance intermédiaire (60-80%)
- Patterns d'erreurs à comprendre
- Hypothèse à vérifier sur les échecs

**Action** :
1. Cliquer sur **"Investiguer"**
2. Le système entre en "mode investigation"

**Effet** :
- Bannière orange apparaît en haut : "🔬 Investigation en cours"
- Accordéon "Échantillon de Résultats" se met en mode annotation
- Compteur d'annotations : 0/N

**Workflow d'investigation** :

1. **Parcourir les erreurs** dans l'accordéon "Échantillon de Résultats"
   - Filtrer : "Erreurs uniquement"
   - Observer les patterns (confusions fréquentes, types de verbatims)

2. **Annoter les observations** (via le bouton 💬 sur chaque paire)
   - Type d'erreur : \confusion_tag\, \low_confidence\, \edge_case\
   - Note : "Confusion REFLET_ACQ/ENGAGEMENT sur verbatims courts (<10 mots)"
   - Priorité : Haute/Moyenne/Basse

3. **Compléter l'investigation** (bouton dans la bannière)
   - Le système génère un résumé automatique :
     - Erreurs par catégorie
     - Patterns récurrents
     - Suggestions d'amélioration
   - Ajouter conclusions personnelles
   - Cliquer **"Finaliser investigation"**

**Effet** :
- Test marqué \outcome='investigated'\
- Résumé sauvegardé avec timestamp
- Vous pouvez maintenant corriger l'algorithme et relancer un test

#### Option C : VALIDER comme nouvelle baseline ✅

**Quand l'utiliser** :
- Performance satisfaisante (> 80% accuracy)
- Amélioration par rapport à la baseline précédente
- Prêt pour analyse Level 2 (hypothèses)

**Action** :
1. Cliquer sur **"Valider"**
2. Dialog "📝 Validation de Version" s'ouvre

**Formulaire de validation** :
\\\
┌─────────────────────────────────────────────┐
│ 📝 Validation de Version                    │
├─────────────────────────────────────────────┤
│ Nom de version*: [Règles X v2.1 - REFLET]  │
│                                              │
│ Description*:                                │
│ [Amélioration détection REFLET via patterns │
│  linguistiques + seuil confiance 0.7]       │
│                                              │
│ Changelog*:                                  │
│ - Ajout pattern "je comprends que"          │
│ - Augmentation poids REFLET_VOUS            │
│ - Correction bug verbatims courts           │
│                                              │
│ Définir comme baseline: ☑                   │
│                                              │
│        [Annuler]    [Valider Version]       │
└─────────────────────────────────────────────┘
\\\

3. Remplir les champs (tous obligatoires)
4. Cocher "Définir comme baseline" si c'est la nouvelle référence
5. Cliquer **"Valider Version"**

**Effet** :
- Version enregistrée dans \lgorithm_version_registry\
- Test marqué \outcome='promoted'\
- Si baseline cochée : devient la référence pour comparaisons futures
- Commit Git actuel associé à la version (traçabilité code)

---

### Étape 3️⃣ : Comparer avec la Baseline

**Localisation** : En haut de page, bouton "COMPARER VERSIONS"

**Action** :
1. Cliquer sur **"Comparer Versions"**
2. Panneau comparateur s'ouvre

**Affichage** :
\\\
┌──────────────────────────────────────────────────────────────┐
│ 📊 Comparateur de Versions - Algorithme X                    │
├──────────────────────────────────────────────────────────────┤
│ Baseline actuelle: Règles X v2.0 (validée le 20/11/2025)    │
│   Accuracy: 72.5% | Kappa: 0.65 | F1 moyen: 0.71            │
│                                                               │
│ Dernière version: Règles X v2.1 (validée le 25/11/2025)     │
│   Accuracy: 75.3% (+2.8%) | Kappa: 0.68 (+0.03) ⬆️           │
│                                                               │
│ Différences par tag:                                          │
│   ENGAGEMENT:     F1 0.82 → 0.85 (+0.03) ⬆️                  │
│   REFLET_ACQ:     F1 0.68 → 0.72 (+0.04) ⬆️                  │
│   EXPLICATION:    F1 0.65 → 0.64 (-0.01) ⬇️                  │
│                                                               │
│ Erreurs: 248 → 223 (-25 corrections, +2 régressions)        │
└──────────────────────────────────────────────────────────────┘
\\\

**Interprétation** :
- ⬆️ vert : amélioration
- ⬇️ rouge : régression
- Corrections : erreurs résolues par rapport à baseline
- Régressions : nouvelles erreurs introduites

---

## 🔄 CAS D'USAGE PRATIQUES

### Cas 1 : Développement Itératif d'Algorithme

**Contexte** : Vous développez un algorithme de classification X (stratégies conseiller)

**Cycle** :
1. **Test initial** (v1.0) → Accuracy 68% → **INVESTIGUER**
   - Investigation révèle : confusion REFLET_ACQ/ENGAGEMENT
   - Note : "Besoin de patterns 'je comprends', 'je vois'"

2. **Correction code** → Ajout patterns
   
3. **Test v1.1** → Accuracy 72% → **INVESTIGUER**
   - Investigation révèle : amélioration REFLET mais régression EXPLICATION
   - Note : "Patterns trop larges, capturent EXPLICATION"

4. **Correction code** → Ajout conditions contextuelles

5. **Test v1.2** → Accuracy 75% → **VALIDER**
   - Définir comme baseline
   - Changelog complet de v1.0 → v1.2

### Cas 2 : Test de Variantes Exploratoires

**Contexte** : Vous testez 3 variantes d'un algorithme (seuils différents)

**Workflow** :
1. Test variante A (seuil 0.5) → Accuracy 70% → **REJETER** (trop permissif)
2. Test variante B (seuil 0.7) → Accuracy 75% → **VALIDER** (optimal)
3. Test variante C (seuil 0.9) → Accuracy 68% → **REJETER** (trop strict)

**Résultat** : Seulement variante B est sauvegardée, les autres sont écartées proprement.

### Cas 3 : Validation Scientifique pour Publication

**Contexte** : Vous préparez un article scientifique, besoin de traçabilité

**Actions** :
1. Version finale algorithme → **VALIDER** avec changelog exhaustif
2. Utiliser le comparateur pour documenter l'évolution :
   - v1.0 baseline (état de l'art) : 65%
   - v2.0 finale (votre approche) : 78%
   - Gain : +13 points
3. Exporter historique des investigations (preuves du processus)
4. Git commit hash associé → code source exact traçable

---

## 📊 INTERPRÉTATION DES MÉTRIQUES

### Accuracy (Exactitude globale)
- **Seuils indicatifs** :
  - < 60% : Algorithme non utilisable
  - 60-70% : Début de piste, nécessite investigation
  - 70-80% : Performance acceptable, peut être baseline
  - > 80% : Excellente performance

### Kappa de Cohen (Accord au-delà du hasard)
- **Interprétation** :
  - < 0.2 : Très faible (à peine mieux que hasard)
  - 0.2-0.4 : Faible
  - 0.4-0.6 : Modéré
  - 0.6-0.8 : Bon ⭐
  - > 0.8 : Excellent ⭐⭐

### F1-Score par tag (Équilibre précision/rappel)
- **Lecture** :
  - F1 > 0.8 : Tag bien détecté
  - F1 0.6-0.8 : Détection acceptable
  - F1 < 0.6 : Problème sur ce tag spécifique → investiguer

### Baseline Diff (Comparaison)
- **Focus sur** :
  - Corrections (erreurs résolues) : Objectif positif
  - Régressions (nouvelles erreurs) : À minimiser (max 5% corrections)
  - Delta F1 par tag : Identifier quels tags s'améliorent/régressent

---

## 🔍 FONCTIONNALITÉS AVANCÉES

### Historique des Tests
**Accès** : Base de données \	est_runs\
**Requête SQL** :
\\\sql
SELECT 
  algorithm_key,
  algorithm_version,
  outcome,
  metrics->>'accuracy' as accuracy,
  created_at
FROM test_runs
WHERE algorithm_key = 'RegexXClassifier'
ORDER BY created_at DESC
LIMIT 10;
\\\

### Annotations d'Investigation
**Accès** : Base de données \investigation_annotations\
**Requête SQL** :
\\\sql
SELECT 
  run_id,
  pair_id,
  annotation_type,
  observation,
  priority,
  created_at
FROM investigation_annotations
WHERE run_id = '<run_uuid>'
ORDER BY priority DESC, created_at;
\\\

### Versions Validées
**Accès** : Base de données \lgorithm_version_registry\
**Requête SQL** :
\\\sql
SELECT 
  version_name,
  is_baseline,
  level1_metrics->>'accuracy' as accuracy,
  changelog,
  validation_date
FROM algorithm_version_registry
WHERE x_key = 'RegexXClassifier'
  AND is_baseline = true
ORDER BY validation_date DESC;
\\\

---

## ❓ FAQ

### Q1 : Puis-je supprimer un test rejeté ?
**R** : Non, les tests restent en base pour traçabilité. Utilisez le statut \discarded\ qui les exclut des analyses.

### Q2 : Que devient la baseline précédente quand je valide une nouvelle ?
**R** : L'ancienne baseline reste en base avec \is_baseline=false\. L'historique est préservé.

### Q3 : Combien de temps dure une investigation ?
**R** : Pas de limite. Vous pouvez revenir à une investigation en cours via la bannière orange.

### Q4 : Les annotations sont-elles publiques ?
**R** : Elles sont associées à votre compte utilisateur. Configuration RLS à ajuster selon besoins de partage.

### Q5 : Puis-je valider sans définir comme baseline ?
**R** : Oui, décochez "Définir comme baseline". Utile pour garder une trace sans changer la référence.

### Q6 : Comment revenir sur une décision ?
**R** : Actuellement non supporté. Relancez un nouveau test si nécessaire.

---

## 🐛 TROUBLESHOOTING

### Problème : Accordéon "Décision" ne s'affiche pas
**Causes possibles** :
- Test pas encore terminé (attendre fin de traitement)
- Erreur création test_run (vérifier console F12)

**Solution** :
1. Ouvrir console navigateur (F12)
2. Chercher "Error creating test run"
3. Vérifier authentification Supabase (901 paires visibles = OK)

### Problème : Erreur 400 lors validation
**Causes possibles** :
- Champ obligatoire vide (nom, description, changelog)
- Payload invalide

**Solution** :
1. Remplir TOUS les champs du formulaire
2. Vérifier console pour détails erreur

### Problème : Comparateur vide
**Causes possibles** :
- Aucune baseline définie
- Aucune version validée

**Solution** :
1. Valider au moins un test avec "Définir comme baseline"
2. Rafraîchir la page

### Problème : Investigation ne se complète pas
**Causes possibles** :
- Erreur génération résumé
- Permissions base de données

**Solution** :
1. Vérifier console (F12)
2. Ajouter au moins une annotation avant de compléter
3. Contacter admin si persistant

---

## 📈 BONNES PRATIQUES

### 1. Nommage des versions
**Recommandé** :
- Format : \[Algo] [Variable] v[X.Y] - [Feature]\
- Exemple : \Règles X v2.1 - Amélioration REFLET\

**À éviter** :
- Noms génériques : "Test 1", "Version finale"
- Numéros seuls : "v3"

### 2. Changelog structuré
**Recommandé** :
\\\
- Ajout pattern "je comprends que" pour REFLET_ACQ
- Augmentation seuil confiance ENGAGEMENT 0.6 → 0.7
- Correction bug: verbatims <5 mots classés AUTRE
\\\

**À éviter** :
- "Plein de changements"
- Changelog vide

### 3. Quand investiguer vs rejeter
**INVESTIGUER si** :
- Vous voulez comprendre les erreurs
- Performance > 60% (piste intéressante)
- Vous prévoyez des corrections

**REJETER si** :
- Test exploratoire rapide
- Performance < 50% (algorithme cassé)
- Vous savez déjà qu'il faut tout refaire

### 4. Définir baseline
**OUI** si :
- Meilleure performance actuelle
- Prêt pour analyse Level 2
- Version "officielle" du moment

**NON** si :
- Test expérimental même avec bonne perf
- Vous voulez garder baseline stable pendant itérations
- Version intermédiaire d'un développement en cours

---

## 🎓 EXEMPLE COMPLET : Session de Recherche

**Objectif** : Améliorer détection stratégie REFLET

### Session 1 : État des lieux (30 min)
1. Test baseline actuelle → 72% accuracy
2. Investiguer → Identifier 35 erreurs REFLET
3. Annotations : "Confusion avec ENGAGEMENT sur verbatims empathiques"
4. Compléter investigation avec conclusions

### Session 2 : Première amélioration (1h)
1. Coder nouveaux patterns REFLET dans l'algorithme
2. Test v2.1 → 74% accuracy (+2%)
3. Investiguer → 28 erreurs REFLET (-7 corrections)
4. Annotations : "Amélioration mais régression EXPLICATION"
5. Compléter investigation

### Session 3 : Ajustement (45 min)
1. Affiner patterns pour éviter capture EXPLICATION
2. Test v2.2 → 76% accuracy (+4% vs baseline)
3. Vérifier métriques : Kappa 0.71, F1 REFLET 0.78
4. Valider comme nouvelle baseline
5. Changelog détaillé pour publication

**Résultat** : Version traçable, documentée, prête pour analyses statistiques Level 2

---

## 📞 SUPPORT

**Questions** : thomas.renaudin@sonear.com  
**Documentation technique** : \docs/ai_context/\  
**Base de connaissances** : Project Knowledge dans Claude

---

**Version du guide** : 1.0 (25 novembre 2025)  
**Dernière mise à jour** : Avant finalisation Phase 4

---

FIN DU GUIDE UTILISATEUR
