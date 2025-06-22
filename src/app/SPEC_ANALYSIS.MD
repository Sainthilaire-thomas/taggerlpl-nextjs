# Spécifications - Améliorations du système de tagging TaggerLPL

## 🎯 Objectif général

Améliorer la complétude et la cohérence des données d'analyse en automatisant le calcul du champ `next_turn_tag` lors du processus de tagging, permettant ainsi une analyse exhaustive des transitions conseiller-client dans les diagrammes de Sankey.

---

## 📋 Modification 1 : Calcul automatique de `next_turn_tag` lors du tagging

### **Problème identifié**

Actuellement, le champ `next_turn_tag` dans la table `turntagged` reste `NULL` lors de la création d'un nouveau tag via l'interface de tagging. Il n'est rempli que lors d'opérations de gestion des tags (renommage/fusion) dans l'interface "Rationaliser les Tags".

**Conséquence :** Les diagrammes de Sankey n'affichent que les données correspondant aux tags qui ont été modifiés via l'interface de gestion, créant une analyse incomplète.

### **Solution proposée**

Ajouter une logique de calcul automatique du `next_turn_tag` dans la fonction `addTag()` du `TaggingDataProvider` pour identifier et référencer le tag du tour de parole immédiatement suivant.

### **Spécifications techniques**

#### **1. Localisation du code**

- **Fichier :** `context/TaggingDataContext.tsx`
- **Fonction :** `addTag(newTag: NewTag)`
- **Ligne approximative :** ~380-420

#### **2. Logique à implémenter**

```typescript
// Après insertion du nouveau tag, calculer next_turn_tag
const calculateNextTurnTag = async (
  insertedTag: TaggedTurn
): Promise<string | null> => {
  try {
    // 1. Identifier le tour de parole suivant (différent speaker)
    const nextWord = taggingTranscription.find(
      (word) =>
        word.turn !== insertedTag.speaker &&
        word.startTime > insertedTag.end_time
    );

    if (!nextWord) return null;

    const nextTurn = nextWord.turn;
    const nextTurnStartTime = nextWord.startTime;

    // 2. Chercher un tag existant pour ce tour suivant
    const { data: existingNextTag, error } = await supabase
      .from("turntagged")
      .select("tag")
      .eq("call_id", insertedTag.call_id)
      .eq("speaker", nextTurn)
      .gte("start_time", nextTurnStartTime)
      .lte("start_time", nextTurnStartTime + TOLERANCE_WINDOW) // 2-3 secondes
      .order("start_time", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Erreur lors de la recherche du tag suivant:", error);
      return null;
    }

    return existingNextTag?.tag || null;
  } catch (err) {
    console.error("Erreur dans calculateNextTurnTag:", err);
    return null;
  }
};

// 3. Mettre à jour le tag inséré avec next_turn_tag
const nextTurnTag = await calculateNextTurnTag(enrichedTag);
if (nextTurnTag) {
  const { error: updateError } = await supabase
    .from("turntagged")
    .update({ next_turn_tag: nextTurnTag })
    .eq("id", enrichedTag.id);

  if (updateError) {
    console.error("Erreur mise à jour next_turn_tag:", updateError);
  } else {
    enrichedTag.next_turn_tag = nextTurnTag;
  }
}
```

#### **3. Constantes à définir**

```typescript
// À ajouter en haut du fichier
const TOLERANCE_WINDOW = 3.0; // Fenêtre de tolérance en secondes pour trouver le tag suivant
```

#### **4. Interface TypeScript à mettre à jour**

```typescript
// Dans TaggedTurn interface (si pas déjà présent)
export interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  next_turn_verbatim: string;
  next_turn_tag?: string; // ✅ Rendre ce champ optionnel mais géré
  color: string;
  speaker: string;
  [key: string]: any;
}
```

### **Tests de validation**

#### **Cas de test 1 : Tag suivant existant**

- **Données :** Tour conseiller (10s-15s) suivi d'un tour client taggé (16s-20s)
- **Attendu :** `next_turn_tag` du tour conseiller = tag du tour client
- **Test :** Créer tag conseiller → vérifier que `next_turn_tag` est rempli

#### **Cas de test 2 : Pas de tag suivant**

- **Données :** Tour conseiller (10s-15s) suivi d'un tour client non taggé
- **Attendu :** `next_turn_tag` reste `NULL`
- **Test :** Créer tag conseiller → vérifier que `next_turn_tag` est `NULL`

#### **Cas de test 3 : Ordre de tagging inversé**

- **Données :** Tag client créé avant tag conseiller précédent
- **Attendu :** `next_turn_tag` du conseiller mis à jour automatiquement
- **Test :** Tag client → Tag conseiller → vérifier liaison

### **Impact sur l'existant**

#### **Données existantes**

- **Conservation :** Les tags existants avec `next_turn_tag = NULL` ne seront pas modifiés
- **Compatibilité :** Le code reste compatible avec les données actuelles
- **Migration optionnelle :** Possibilité d'ajouter une fonction de recalcul pour l'historique

#### **Performance**

- **Impact minimal :** Une requête supplémentaire par tag créé
- **Optimisation :** Utilisation d'index sur `(call_id, speaker, start_time)`
- **Timeout :** Gestion des erreurs avec fallback gracieux

### **Livrable**

#### **Code modifié**

- [ ] Fonction `addTag()` dans `TaggingDataContext.tsx`
- [ ] Fonction utilitaire `calculateNextTurnTag()`
- [ ] Gestion d'erreurs et logging approprié
- [ ] Tests unitaires pour les cas décrits

#### **Documentation**

- [ ] Mise à jour de la documentation technique
- [ ] Commentaires dans le code pour expliquer la logique
- [ ] Guide de test pour validation

#### **Validation**

- [ ] Tests en environnement de développement
- [ ] Vérification des diagrammes de Sankey avec nouvelles données
- [ ] Test de non-régression sur l'interface existante

---

## 📋 Modification 2 : Correction du filtre par origine dans les diagrammes de Sankey

### **Problème identifié**

Le filtre par origine dans `TagAnalysisGraphs` ne fonctionne pas correctement. Bien que l'interface affiche un dropdown avec les origines disponibles et que le state `selectedOrigin` soit mis à jour, le filtrage des données ne s'applique pas effectivement aux diagrammes de Sankey.

**Analyse du code actuel :**

- Le dropdown récupère bien les origines depuis `call.origine`
- Le `useEffect` se déclenche lors du changement de `selectedOrigin`
- Mais la logique de filtrage dans `fetchData()` présente des dysfonctionnements

### **Solution proposée**

Corriger la logique de filtrage dans la fonction `fetchData()` pour s'assurer que les données affichées correspondent bien à l'origine sélectionnée.

### **Spécifications techniques**

#### **1. Localisation du code**

- **Fichier :** `components/TagAnalysisGraphs.tsx`
- **Fonction :** `fetchData()`
- **Lignes approximatives :** ~80-150

#### **2. Problème dans le code actuel**

```typescript
// Code actuel problématique - lignes ~90-105
let callIds: string[] | null = null;
if (selectedOrigin) {
  const { data: callsData, error: callsError } = await supabase
    .from("call")
    .select("callid")
    .eq("origine", selectedOrigin);

  if (callsError) throw new Error(callsError.message);
  callIds = callsData.map((call) => call.callid);
}

// Plus loin - lignes ~110-115
const query = supabase.from("turntagged").select(`...`);
if (callIds) {
  query.in("call_id", callIds);
}
```

#### **3. Correction à apporter**

```typescript
// Code corrigé
const fetchData = async () => {
  setLoading(true);
  try {
    // 1. Récupérer les tags et familles (inchangé)
    const { data: tagsData, error: tagsError } = await supabase
      .from("lpltag")
      .select("label, family")
      .in("family", allowedFamilies);

    if (tagsError) throw new Error(tagsError.message);

    const tagToFamily = Object.fromEntries(
      tagsData.map(({ label, family }) => [label, family])
    );

    // 2. Construire la requête avec filtrage par origine
    let query = supabase.from("turntagged").select(`
      id,
      call_id,
      tag,
      next_turn_tag,
      verbatim,
      next_turn_verbatim, 
      next_turn_tag_auto, 
      score_auto
    `);

    // 3. Filtrage par origine si sélectionnée
    if (selectedOrigin) {
      // Sous-requête pour obtenir les call_ids de l'origine sélectionnée
      const { data: filteredCalls, error: callsError } = await supabase
        .from("call")
        .select("callid")
        .eq("origine", selectedOrigin);

      if (callsError) {
        console.error("Erreur lors du filtrage par origine:", callsError);
        throw new Error(callsError.message);
      }

      if (!filteredCalls || filteredCalls.length === 0) {
        console.warn(`Aucun appel trouvé pour l'origine: ${selectedOrigin}`);
        setData({ nodes: [], links: [] });
        setRefletData({ nodes: [], links: [] });
        setLoading(false);
        return;
      }

      const callIds = filteredCalls.map((call) => call.callid);
      console.log(
        `Filtrage par origine "${selectedOrigin}": ${callIds.length} appels trouvés`
      );

      query = query.in("call_id", callIds);
    }

    // 4. Exécuter la requête
    const { data: turnTaggedData, error: turnTaggedError } = await query;

    if (turnTaggedError) throw new Error(turnTaggedError.message);

    console.log(
      `Données récupérées: ${turnTaggedData?.length || 0} enregistrements`
    );

    // 5. Traitement des données (reste inchangé)
    // ... reste du code existant pour aggregatedData, sankeyNodes, etc.
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    setError(errorMessage);
    console.error("Erreur lors du fetch :", errorMessage);
  } finally {
    setLoading(false);
  }
};
```

#### **4. Améliorations supplémentaires**

**A. Indicateur visuel du filtrage actif**

```typescript
// À ajouter dans le composant
{
  selectedOrigin && (
    <Typography
      variant="body2"
      sx={{
        mb: 2,
        padding: 1,
        backgroundColor: theme.palette.info.light,
        borderRadius: 1,
      }}
    >
      📊 Données filtrées par origine: <strong>{selectedOrigin}</strong>
      {/* Optionnel: afficher le nombre d'appels */}
    </Typography>
  );
}
```

**B. Gestion du cas "aucune donnée"**

```typescript
// Après le traitement des données
if (sankeyLinks.length === 0) {
  console.warn(
    `Aucune transition trouvée${
      selectedOrigin ? ` pour l'origine "${selectedOrigin}"` : ""
    }`
  );
}
```

#### **5. Logging et debugging**

```typescript
// Ajouter des logs pour faciliter le debugging
console.log("=== FILTRAGE SANKEY ===");
console.log("Origine sélectionnée:", selectedOrigin);
console.log("Nombre d'appels filtrés:", callIds?.length || "tous");
console.log("Enregistrements turntagged récupérés:", turnTaggedData?.length);
console.log("Transitions générées:", sankeyLinks.length);
```

### **Tests de validation**

#### **Cas de test 1 : Filtrage par origine spécifique**

- **Action :** Sélectionner une origine dans le dropdown
- **Attendu :** Diagramme mis à jour avec uniquement les données de cette origine
- **Vérification :** Comparer les données avant/après filtrage

#### **Cas de test 2 : Retour à "Tout afficher"**

- **Action :** Sélectionner "Tout afficher" après un filtrage
- **Attendu :** Diagramme montre toutes les données
- **Vérification :** Nombre total de transitions restauré

#### **Cas de test 3 : Origine sans données**

- **Action :** Sélectionner une origine sans appels taggés
- **Attendu :** Diagramme vide avec message approprié
- **Vérification :** Pas d'erreur, interface gracieuse

#### **Cas de test 4 : Performance**

- **Action :** Changer rapidement d'origine plusieurs fois
- **Attendu :** Pas de doublon de requêtes, loading states corrects
- **Vérification :** Network tab + logs console

### **Impact sur l'existant**

#### **Compatibilité**

- **Fonctionnalité existante :** Le comportement "Tout afficher" reste identique
- **Interface :** Aucun changement visuel requis
- **Performance :** Amélioration possible grâce au filtrage en amont

#### **Base de données**

- **Index recommandé :** `CREATE INDEX IF NOT EXISTS idx_call_origine ON call(origine);`
- **Index existant :** Vérifier `turntagged(call_id)` pour les jointures

### **Livrable**

#### **Code modifié**

- [ ] Fonction `fetchData()` dans `TagAnalysisGraphs.tsx`
- [ ] Amélioration du logging et gestion d'erreurs
- [ ] Indicateurs visuels du filtrage actif

#### **Tests**

- [ ] Tests unitaires pour chaque cas de filtrage
- [ ] Tests d'intégration avec données réelles
- [ ] Validation des performances

#### **Documentation**

- [ ] Commentaires dans le code expliquant la logique de filtrage
- [ ] Mise à jour de la documentation utilisateur

---

## 🔄 Modifications connexes à prévoir

### **Modification 1.1 : Mise à jour rétroactive (optionnelle)**

**Objectif :** Recalculer les `next_turn_tag` pour les données existantes

**Approche :** Fonction utilitaire exécutable à la demande

```typescript
const backfillNextTurnTags = async (callId?: string) => {
  // Logique de recalcul pour l'historique
};
```

### **Modification 1.2 : Interface d'administration**

**Objectif :** Ajouter un bouton dans l'interface pour déclencher le recalcul

**Localisation :** Page d'analyse ou interface "Rationaliser les Tags"

### **Modification 2.1 : Optimisation des filtres multiples**

**Objectif :** Permettre le filtrage simultané par origine ET par période/date

**Approche :** Extension du système de filtrage actuel

### **Modification 3 : Refonte de l'onglet "Statistiques des tags" avec nouveaux graphiques**

**Objectif :** Remplacer le graphique en barres actuel par des visualisations plus pertinentes pour l'analyse des stratégies

**Inspirations :** Graphiques basés sur la recherche IEEE ProComm25 sur les descriptions d'actions dans les conversations conflictuelles

#### **3.1 Graphique principal : Tableau de répartition par stratégie et sentiment**

**Description :** Tableau montrant la répartition des réactions (Negative/Neutral/Positive) pour chaque stratégie

**Spécifications visuelles :**

- **Format :** Tableau avec colonnes colorées par sentiment
- **Colonnes :** Strategy | Negative (%) | Neutral (%) | Positive (%)
- **Lignes :** Une ligne par famille de tags (Explanation, Engagement, Opening, Reflection)
- **Couleurs :**
  - Negative : Rouge (#FF4444)
  - Neutral : Orange/Jaune (#FFA500)
  - Positive : Vert (#4CAF50)

**Structure des données :**

```typescript
interface StrategyStats {
  strategy: string; // "Explanation", "Engagement", "Opening", "Reflection"
  negative: number; // Pourcentage
  neutral: number; // Pourcentage
  positive: number; // Pourcentage
  total: number; // Nombre total d'occurrences
}
```

**Calcul des données :**

```sql
-- Requête pour générer les statistiques
SELECT
  lpltag.family as strategy,
  COUNT(*) as total,
  COUNT(CASE WHEN turntagged.next_turn_tag = 'CLIENT NEGATIF' THEN 1 END) * 100.0 / COUNT(*) as negative,
  COUNT(CASE WHEN turntagged.next_turn_tag = 'CLIENT NEUTRE' THEN 1 END) * 100.0 / COUNT(*) as neutral,
  COUNT(CASE WHEN turntagged.next_turn_tag = 'CLIENT POSITIF' THEN 1 END) * 100.0 / COUNT(*) as positive
FROM turntagged
JOIN lpltag ON turntagged.tag = lpltag.label
WHERE turntagged.next_turn_tag IS NOT NULL
  AND lpltag.family IN ('EXPLANATION', 'ENGAGEMENT', 'OUVERTURE', 'REFLET')
GROUP BY lpltag.family;
```

#### **3.2 Graphique secondaire : Barres horizontales des réactions positives**

**Description :** Graphique en barres horizontales montrant uniquement les pourcentages de réactions positives par stratégie

**Spécifications visuelles :**

- **Format :** Barres horizontales ordonnées par pourcentage décroissant
- **Axe Y :** Noms des stratégies (Opening, Engagement, Reflection, Explanation)
- **Axe X :** Pourcentage de réactions positives (0-100%)
- **Couleurs :** Dégradé de vert selon l'efficacité
- **Annotations :** Pourcentage affiché sur chaque barre

**Key Finding automatique :**

```typescript
// Calcul automatique du insight principal
const generateKeyFinding = (stats: StrategyStats[]) => {
  const sortedByPositive = stats.sort((a, b) => b.positive - a.positive);
  const best = sortedByPositive[0];
  const worst = sortedByPositive[sortedByPositive.length - 1];
  const difference = Math.round(best.positive - worst.positive);

  return `Action-centered strategies (${
    best.strategy
  } + Opening) generate ${difference}% more positive reactions than ${worst.strategy.toLowerCase()}`;
};
```

### **Spécifications techniques**

#### **1. Localisation du code**

- **Fichier principal :** `components/TagStats.tsx`
- **Remplacement complet :** Remplacer le graphique ECharts actuel
- **Nouveaux composants :**
  - `StrategyStatsTable.tsx`
  - `PositiveReactionsChart.tsx`

#### **2. Nouvelles interfaces TypeScript**

```typescript
interface StrategyStats {
  strategy: string;
  negative: number;
  neutral: number;
  positive: number;
  total: number;
}

interface StrategyStatsProps {
  family?: string | null; // Maintenir la compatibilité avec le filtre existant
}

interface TableCellProps {
  value: number;
  type: "negative" | "neutral" | "positive";
  total?: number;
}
```

#### **3. Structure du nouveau composant TagStats**

```typescript
const TagStats: FC<StrategyStatsProps> = ({ family }) => {
  const [strategyStats, setStrategyStats] = useState<StrategyStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyFinding, setKeyFinding] = useState<string>("");

  // Fonction de fetch des données
  const fetchStrategyStats = async () => {
    // Logique de récupération et calcul des pourcentages
  };

  // Calcul automatique du key finding
  const generateInsight = (stats: StrategyStats[]) => {
    // Logique de génération d'insights
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        {family
          ? `Statistiques pour ${family}`
          : "Impact des Stratégies sur les Réactions Client"}
      </Typography>

      {/* Tableau principal */}
      <StrategyStatsTable data={strategyStats} />

      {/* Graphique des réactions positives */}
      <PositiveReactionsChart data={strategyStats} />

      {/* Key Finding automatique */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: "info.light", borderRadius: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          Key Finding: {keyFinding}
        </Typography>
      </Box>
    </Box>
  );
};
```

#### **4. Composant StrategyStatsTable**

```typescript
const StrategyStatsTable: FC<{ data: StrategyStats[] }> = ({ data }) => {
  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell>
              <strong>Strategy</strong>
            </TableCell>
            <TableCell align="center" sx={{ color: "#FF4444" }}>
              <strong>Negative (%)</strong>
            </TableCell>
            <TableCell align="center" sx={{ color: "#FFA500" }}>
              <strong>Neutral (%)</strong>
            </TableCell>
            <TableCell align="center" sx={{ color: "#4CAF50" }}>
              <strong>Positive (%)</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.strategy}>
              <TableCell>
                <strong>{row.strategy}</strong>
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#FF4444", fontSize: "1.1rem" }}
              >
                {row.negative.toFixed(1)}
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#FFA500", fontSize: "1.1rem" }}
              >
                {row.neutral.toFixed(1)}
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#4CAF50", fontSize: "1.1rem" }}
              >
                {row.positive.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

#### **5. Composant PositiveReactionsChart**

```typescript
const PositiveReactionsChart: FC<{ data: StrategyStats[] }> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.positive - a.positive);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Positive Reactions by Strategy
      </Typography>
      {sortedData.map((item, index) => (
        <Box key={item.strategy} sx={{ mb: 1 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="body2">{item.strategy}</Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {item.positive.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={item.positive}
            sx={{
              height: 24,
              borderRadius: 1,
              backgroundColor: "#f0f0f0",
              "& .MuiLinearProgress-bar": {
                backgroundColor: index === 0 ? "#4CAF50" : "#81C784",
                borderRadius: 1,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};
```

### **Tests de validation**

#### **Cas de test 1 : Données complètes**

- **Données :** Appels avec next_turn_tag rempli pour toutes les familles
- **Attendu :** Tableau et graphique avec pourcentages corrects
- **Vérification :** Somme des pourcentages = 100% par ligne

#### **Cas de test 2 : Filtrage par famille**

- **Action :** Sélectionner une famille spécifique
- **Attendu :** Affichage des statistiques pour cette famille uniquement
- **Vérification :** Cohérence avec les données filtrées

#### **Cas de test 3 : Données manquantes**

- **Données :** Certaines familles sans next_turn_tag
- **Attendu :** Gestion gracieuse, affichage partiel
- **Vérification :** Messages appropriés pour données insuffisantes

### **Migration et compatibilité**

#### **Remplacement progressif**

1. **Phase 1 :** Créer les nouveaux composants en parallèle
2. **Phase 2 :** Ajouter un toggle pour basculer entre ancien/nouveau
3. **Phase 3 :** Remplacer définitivement et supprimer l'ancien code

#### **Dépendances**

- **Nouvelles :** `@mui/material/Table`, `@mui/material/LinearProgress`
- **Supprimées :** `echarts` (si utilisé uniquement pour TagStats)
- **Conservation :** Interface et props compatibles avec l'usage actuel

### **Livrable**

#### **Code nouveau**

- [ ] `StrategyStatsTable.tsx` - Tableau de répartition
- [ ] `PositiveReactionsChart.tsx` - Graphique barres horizontales
- [ ] `TagStats.tsx` refactorisé - Orchestration des composants
- [ ] Fonctions de calcul des statistiques et insights

#### **Tests et validation**

- [ ] Tests unitaires pour calculs de pourcentages
- [ ] Tests d'intégration avec données réelles
- [ ] Validation visuelle des graphiques

#### **Documentation**

- [ ] Documentation des nouveaux composants
- [ ] Guide de migration pour les utilisateurs
- [ ] Explication des métriques et calculs

---

_Cette spécification sera complétée avec d'autres améliorations du système dans les prochaines versions._
