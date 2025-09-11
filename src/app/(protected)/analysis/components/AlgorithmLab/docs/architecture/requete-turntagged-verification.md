# Requêtes SQL d'analyse de la table turntagged

Documentation des requêtes SQL pour analyser le corpus de données et comprendre la répartition des tours de parole.

## Contexte

La table `turntagged` contient les tours de parole taggés avec :

- Tags conseiller : ENGAGEMENT, OUVERTURE, REFLET_VOUS, REFLET_JE, REFLET_ACQ, EXPLICATION
- Tags client : CLIENT POSITIF, CLIENT NEGATIF, CLIENT NEUTRE
- Logique métier : Un tour conseiller n'est valide que s'il a un `next_turn_tag` client

## 1. Statistiques globales

```sql
-- Statistiques générales de la table
SELECT
  'Statistiques globales' as categorie,
  COUNT(*) as total_tours,
  COUNT(CASE WHEN verbatim IS NOT NULL AND verbatim != '' THEN 1 END) as avec_verbatim,
  COUNT(CASE WHEN tag IS NOT NULL AND tag != '' THEN 1 END) as avec_tag,
  COUNT(CASE WHEN next_turn_tag IS NOT NULL AND next_turn_tag != '' THEN 1 END) as avec_next_turn_tag,
  COUNT(CASE WHEN next_turn_verbatim IS NOT NULL AND next_turn_verbatim != '' THEN 1 END) as avec_next_turn_verbatim
FROM turntagged;
```

## 2. Liste complète des tags présents

```sql
-- Inventaire de tous les tags avec occurrences
SELECT
  'Tags présents' as categorie,
  tag,
  COUNT(*) as occurrences,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pourcentage
FROM turntagged
WHERE tag IS NOT NULL AND tag != ''
GROUP BY tag
ORDER BY occurrences DESC;
```

## 3. Classification conseiller vs client

```sql
-- Répartition par type de speaker via les familles lpltag
WITH tag_classification AS (
  SELECT
    t.tag,
    COUNT(*) as count,
    CASE
      WHEN lt.family IN ('REFLET', 'ENGAGEMENT', 'OUVERTURE', 'EXPLICATION') THEN 'CONSEILLER'
      WHEN t.tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE') THEN 'CLIENT'
      ELSE 'AUTRE'
    END as type_speaker
  FROM turntagged t
  LEFT JOIN lpltag lt ON t.tag = lt.label
  WHERE t.tag IS NOT NULL AND t.tag != ''
    AND t.verbatim IS NOT NULL AND t.verbatim != ''
  GROUP BY t.tag, lt.family
)
SELECT
  'Répartition par type' as categorie,
  type_speaker,
  COUNT(*) as nombre_tags_differents,
  SUM(count) as total_occurrences
FROM tag_classification
GROUP BY type_speaker
ORDER BY total_occurrences DESC;
```

## 4. Détail des tags conseiller

```sql
-- Analyse détaillée des tours conseiller
SELECT
  'Tags conseiller détail' as categorie,
  tag,
  COUNT(*) as occurrences,
  COUNT(CASE WHEN next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE') THEN 1 END) as avec_next_client,
  ROUND(
    COUNT(CASE WHEN next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE') THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as pourcentage_avec_next_client
FROM turntagged
WHERE tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
  AND verbatim IS NOT NULL AND verbatim != ''
GROUP BY tag
ORDER BY occurrences DESC;
```

## 5. Détail des tags client

```sql
-- Analyse des tours client directs
SELECT
  'Tags client détail' as categorie,
  tag,
  COUNT(*) as occurrences
FROM turntagged
WHERE tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
  AND verbatim IS NOT NULL AND verbatim != ''
GROUP BY tag
ORDER BY occurrences DESC;
```

6. Détail des tags "AUTRES"
   -- Analyse des tours avec tag hors conseiller et client
   SELECT
   'Tags AUTRES détail' as categorie,
   tag,
   COUNT(_) as occurrences,
   ROUND(COUNT(_) _ 100.0 / SUM(COUNT(_)) OVER(), 2) as pourcentage
   FROM turntagged
   WHERE tag NOT IN (
   'ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION',
   'CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE'
   )
   AND tag IS NOT NULL AND tag != ''
   AND verbatim IS NOT NULL AND verbatim != ''
   GROUP BY tag
   ORDER BY occurrences DESC;

## 7. Analyse des séquences conseiller → client

```sql
-- Patterns de transition conseiller vers client
SELECT
  'Séquences conseiller→client' as categorie,
  t1.tag as tag_conseiller,
  t1.next_turn_tag as tag_client_suivant,
  COUNT(*) as occurrences
FROM turntagged t1
WHERE t1.tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
  AND t1.verbatim IS NOT NULL AND t1.verbatim != ''
  AND t1.next_turn_tag IS NOT NULL AND t1.next_turn_tag != ''
GROUP BY t1.tag, t1.next_turn_tag
ORDER BY t1.tag, occurrences DESC;
```

## 8. Tours conseiller problématiques

```sql
-- Tours conseiller sans next_turn_tag client valide
SELECT
  'Tours conseiller problématiques' as categorie,
  tag,
  COALESCE(next_turn_tag, 'NULL') as next_turn_tag,
  COUNT(*) as occurrences
FROM turntagged
WHERE tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
  AND verbatim IS NOT NULL AND verbatim != ''
  AND (next_turn_tag IS NULL OR next_turn_tag NOT IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE'))
GROUP BY tag, next_turn_tag
ORDER BY tag, occurrences DESC;
```

## 9. Résumé pour validation

```sql
-- Chiffres clés pour validation du corpus
SELECT
  'RÉSUMÉ FINAL' as categorie,
  'Tours conseiller total' as description,
  COUNT(*) as valeur
FROM turntagged
WHERE tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
  AND verbatim IS NOT NULL AND verbatim != ''

UNION ALL

SELECT
  'RÉSUMÉ FINAL' as categorie,
  'Tours conseiller avec next_turn client (VALIDES)' as description,
  COUNT(*) as valeur
FROM turntagged
WHERE tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
  AND verbatim IS NOT NULL AND verbatim != ''
  AND next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
  AND next_turn_verbatim IS NOT NULL AND next_turn_verbatim != ''

UNION ALL

SELECT
  'RÉSUMÉ FINAL' as categorie,
  'Tours client directs' as description,
  COUNT(*) as valeur
FROM turntagged
WHERE tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
  AND verbatim IS NOT NULL AND verbatim != ''

UNION ALL

SELECT
  'RÉSUMÉ FINAL' as categorie,
  'TOTAL corpus gold standard attendu' as description,
  (
    SELECT COUNT(*) FROM turntagged
    WHERE tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
      AND verbatim IS NOT NULL AND verbatim != ''
      AND next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
      AND next_turn_verbatim IS NOT NULL AND next_turn_verbatim != ''
  ) + (
    SELECT COUNT(*) FROM turntagged
    WHERE tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
      AND verbatim IS NOT NULL AND verbatim != ''
  ) as valeur;
```

## 10. Analyse par origine des appels

```sql
-- Appels présents dans turntagged par origine
SELECT
  'Appels présents dans turntagged' as categorie,
  c.origine,
  COUNT(DISTINCT c.callid) as nombre_appels_avec_tours,
  COUNT(t.id) as nombre_tours_total,
  COUNT(CASE WHEN t.tag IS NOT NULL AND t.tag != '' THEN 1 END) as tours_avec_tag,
  COUNT(CASE WHEN t.verbatim IS NOT NULL AND t.verbatim != '' THEN 1 END) as tours_avec_verbatim,
  ROUND(AVG(c.duree), 2) as duree_moyenne_minutes,
  COUNT(CASE WHEN t.tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION') THEN 1 END) as tours_conseiller,
  COUNT(CASE WHEN t.tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE') THEN 1 END) as tours_client,
  COUNT(CASE WHEN t.tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_VOUS', 'REFLET_JE', 'REFLET_ACQ', 'EXPLICATION')
             AND t.next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
             AND t.verbatim IS NOT NULL AND t.verbatim != ''
             AND t.next_turn_verbatim IS NOT NULL AND t.next_turn_verbatim != ''
        THEN 1 END) as tours_conseiller_valides
FROM call c
INNER JOIN turntagged t ON c.callid = t.call_id
WHERE c.origine IS NOT NULL
GROUP BY c.origine
ORDER BY nombre_appels_avec_tours DESC;
```

## 11. Couverture par origine

```sql
-- Comparaison avec tous les appels pour voir la couverture
SELECT
  'Couverture turntagged par origine' as categorie,
  c.origine,
  COUNT(DISTINCT c.callid) as total_appels,
  COUNT(DISTINCT CASE WHEN t.call_id IS NOT NULL THEN c.callid END) as appels_avec_tours,
  ROUND(
    COUNT(DISTINCT CASE WHEN t.call_id IS NOT NULL THEN c.callid END) * 100.0 /
    COUNT(DISTINCT c.callid),
    2
  ) as pourcentage_couverture
FROM call c
LEFT JOIN turntagged t ON c.callid = t.call_id
WHERE c.origine IS NOT NULL
GROUP BY c.origine
ORDER BY total_appels DESC;
```

## 12. Requêtes de validation rapide

```sql
-- Validation de la logique métier : tours conseiller avec next_turn client
SELECT
  COUNT(*) as avec_next_client
FROM turntagged t
JOIN lpltag lt ON t.tag = lt.label
WHERE lt.family IN ('REFLET', 'ENGAGEMENT', 'OUVERTURE', 'EXPLICATION')
  AND t.verbatim IS NOT NULL
  AND t.next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
  AND t.next_turn_verbatim IS NOT NULL;

-- VS tous les tours conseiller
SELECT
  COUNT(*) as tous_conseiller
FROM turntagged t
JOIN lpltag lt ON t.tag = lt.label
WHERE lt.family IN ('REFLET', 'ENGAGEMENT', 'OUVERTURE', 'EXPLICATION')
  AND t.verbatim IS NOT NULL;
```

## Usage

Ces requêtes permettent de :

1. Valider la qualité des données
2. Comprendre la répartition des échantillons pour chaque algorithme
3. Identifier les problèmes de données manquantes
4. Analyser la couverture par origine d'appel
5. Expliquer les différences entre le total affiché (2461) et les échantillons filtrés (893 pour conseiller)

La différence principale provient de la règle métier : seuls les tours conseiller ayant un `next_turn_tag` client valide sont utilisables pour l'entraînement et les tests.
