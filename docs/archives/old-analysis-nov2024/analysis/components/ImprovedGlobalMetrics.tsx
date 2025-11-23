// ImprovedGlobalMetrics.tsx - Connecté aux vraies données
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

// Types basés sur votre structure existante
interface TurnTaggedData {
  id: string;
  call_id: string;
  tag: string;
  next_turn_tag: string;
  verbatim: string;
  next_turn_verbatim: string;
}

interface TagData {
  label: string;
  family: string;
}

interface ConversationalMetrics {
  totalInteractions: number;
  positiveImpactRate: number;
  neutralImpactRate: number;
  negativeImpactRate: number;
  bestStrategy: {
    name: string;
    rate: number;
    total: number;
  };
  worstStrategy: {
    name: string;
    rate: number;
    total: number;
  };
  averageEffectiveness: number;
  improvementPotential: number;
}

interface ImprovedGlobalMetricsProps {
  selectedOrigin?: string | null;
}

export default function ImprovedGlobalMetrics({
  selectedOrigin,
}: ImprovedGlobalMetricsProps) {
  const theme = useTheme();
  const [turnTaggedData, setTurnTaggedData] = useState<TurnTaggedData[]>([]);
  const [tagsData, setTagsData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Constantes basées sur votre code existant
  const allowedFamilies = ["EXPLICATION", "ENGAGEMENT", "OUVERTURE", "REFLET"];
  const allowedDestinations = [
    "CLIENT POSITIF",
    "CLIENT NEUTRE",
    "CLIENT NEGATIF",
  ];

  // Fetch des données depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les tags et leurs familles
        const { data: tagsResult, error: tagsError } = await supabase
          .from("lpltag")
          .select("label, family")
          .in("family", allowedFamilies);

        if (tagsError) throw tagsError;

        // 2. Récupérer les call_ids filtrés par origine si nécessaire
        let callIds: string[] | null = null;
        if (selectedOrigin) {
          const { data: callsData, error: callsError } = await supabase
            .from("call")
            .select("callid")
            .eq("origine", selectedOrigin);

          if (callsError) throw callsError;
          callIds = callsData.map((call) => call.callid);
        }

        // 3. Récupérer les données turntagged
        const query = supabase
          .from("turntagged")
          .select(
            "id, call_id, tag, next_turn_tag, verbatim, next_turn_verbatim"
          )
          .in("next_turn_tag", allowedDestinations);

        if (callIds) {
          query.in("call_id", callIds);
        }

        const { data: turnTaggedResult, error: turnTaggedError } = await query;

        if (turnTaggedError) throw turnTaggedError;

        // Filtrer seulement les tags des familles autorisées
        const tagToFamily = Object.fromEntries(
          tagsResult.map(({ label, family }) => [label, family])
        );

        const filteredData = turnTaggedResult.filter(
          (item) =>
            tagToFamily[item.tag] &&
            allowedDestinations.includes(item.next_turn_tag)
        );

        setTagsData(tagsResult);
        setTurnTaggedData(filteredData);
      } catch (err) {
        console.error("Erreur lors du fetch des données:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedOrigin]);

  // Calcul des métriques basé sur vos vraies données
  const metrics = useMemo((): ConversationalMetrics => {
    if (!turnTaggedData.length || !tagsData.length) {
      return {
        totalInteractions: 0,
        positiveImpactRate: 0,
        neutralImpactRate: 0,
        negativeImpactRate: 0,
        bestStrategy: { name: "N/A", rate: 0, total: 0 },
        worstStrategy: { name: "N/A", rate: 0, total: 0 },
        averageEffectiveness: 0,
        improvementPotential: 0,
      };
    }

    const tagToFamily = Object.fromEntries(
      tagsData.map(({ label, family }) => [label, family])
    );

    const totalInteractions = turnTaggedData.length;

    // Calcul des taux par type de réaction
    const positiveCount = turnTaggedData.filter(
      (item) => item.next_turn_tag === "CLIENT POSITIF"
    ).length;
    const neutralCount = turnTaggedData.filter(
      (item) => item.next_turn_tag === "CLIENT NEUTRE"
    ).length;
    const negativeCount = turnTaggedData.filter(
      (item) => item.next_turn_tag === "CLIENT NEGATIF"
    ).length;

    const positiveImpactRate = Math.round(
      (positiveCount / totalInteractions) * 100
    );
    const neutralImpactRate = Math.round(
      (neutralCount / totalInteractions) * 100
    );
    const negativeImpactRate = Math.round(
      (negativeCount / totalInteractions) * 100
    );

    // Calcul par famille de stratégies
    const familyStats = turnTaggedData.reduce((acc, item) => {
      const family = tagToFamily[item.tag];
      if (!family) return acc;

      if (!acc[family]) {
        acc[family] = { total: 0, positive: 0 };
      }
      acc[family].total++;
      if (item.next_turn_tag === "CLIENT POSITIF") {
        acc[family].positive++;
      }
      return acc;
    }, {} as Record<string, { total: number; positive: number }>);

    // Conversion en array avec taux
    const familyRates = Object.entries(familyStats)
      .map(([family, stats]) => ({
        name: family,
        rate: Math.round((stats.positive / stats.total) * 100),
        total: stats.total,
      }))
      .filter((item) => item.total >= 5); // Filtrer les familles avec peu de données

    if (familyRates.length === 0) {
      return {
        totalInteractions,
        positiveImpactRate,
        neutralImpactRate,
        negativeImpactRate,
        bestStrategy: { name: "N/A", rate: 0, total: 0 },
        worstStrategy: { name: "N/A", rate: 0, total: 0 },
        averageEffectiveness: positiveImpactRate,
        improvementPotential: 0,
      };
    }

    // Trouver les meilleures et pires stratégies
    const bestStrategy = familyRates.reduce((best, current) =>
      current.rate > best.rate ? current : best
    );

    const worstStrategy = familyRates.reduce((worst, current) =>
      current.rate < worst.rate ? current : worst
    );

    const averageEffectiveness = Math.round(
      familyRates.reduce((sum, family) => sum + family.rate, 0) /
        familyRates.length
    );

    const improvementPotential = bestStrategy.rate - averageEffectiveness;

    return {
      totalInteractions,
      positiveImpactRate,
      neutralImpactRate,
      negativeImpactRate,
      bestStrategy,
      worstStrategy,
      averageEffectiveness,
      improvementPotential,
    };
  }, [turnTaggedData, tagsData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les tags et leurs familles
        const { data: tagsResult, error: tagsError } = await supabase
          .from("lpltag")
          .select("label, family")
          .in("family", allowedFamilies); // ⚠️ Filtre 1 : seulement certaines familles

        console.log("🏷️ Tags récupérés:", tagsResult?.length);
        console.log("🏷️ Tags par famille:", tagsResult);

        if (tagsError) throw tagsError;

        // 2. Récupérer les call_ids filtrés par origine si nécessaire
        let callIds: string[] | null = null;
        if (selectedOrigin) {
          const { data: callsData, error: callsError } = await supabase
            .from("call")
            .select("callid")
            .eq("origine", selectedOrigin);

          console.log("📞 Calls filtrés par origine:", callsData?.length);
          console.log("📞 Origine sélectionnée:", selectedOrigin);

          if (callsError) throw callsError;
          callIds = callsData.map((call) => call.callid);
        }

        // 3. Récupérer les données turntagged avec filtres
        const query = supabase
          .from("turntagged")
          .select(
            "id, call_id, tag, next_turn_tag, verbatim, next_turn_verbatim"
          )
          .in("next_turn_tag", allowedDestinations); // ⚠️ Filtre 2 : seulement certaines destinations

        if (callIds) {
          query.in("call_id", callIds); // ⚠️ Filtre 3 : par origine si sélectionnée
        }

        const { data: turnTaggedResult, error: turnTaggedError } = await query;

        console.log(
          "🔄 Données turntagged AVANT filtrage tag:",
          turnTaggedResult?.length
        );
        console.log("🔄 Destinations autorisées:", allowedDestinations);

        if (turnTaggedError) throw turnTaggedError;

        // Filtrer seulement les tags des familles autorisées
        const tagToFamily = Object.fromEntries(
          tagsResult.map(({ label, family }) => [label, family])
        );

        console.log("🗂️ Mapping tag → famille:", tagToFamily);

        const filteredData = turnTaggedResult.filter(
          (item) =>
            tagToFamily[item.tag] &&
            allowedDestinations.includes(item.next_turn_tag)
        ); // ⚠️ Filtre 4 : seulement les tags des familles autorisées

        console.log(
          "🔄 Données turntagged APRÈS filtrage tag:",
          filteredData.length
        );
        console.log(
          "🔄 Exemple de données filtrées:",
          filteredData.slice(0, 3)
        );

        // Pour debug : compter par famille
        const countByFamily = filteredData.reduce((acc, item) => {
          const family = tagToFamily[item.tag];
          acc[family] = (acc[family] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("📊 Répartition par famille:", countByFamily);

        // Pour debug : compter par destination
        const countByDestination = filteredData.reduce((acc, item) => {
          acc[item.next_turn_tag] = (acc[item.next_turn_tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("📊 Répartition par destination:", countByDestination);

        setTagsData(tagsResult);
        setTurnTaggedData(filteredData);
      } catch (err) {
        console.error("Erreur lors du fetch des données:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedOrigin]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Calcul des métriques conversationnelles...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Erreur lors du chargement des métriques
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        mt: 4,
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h6" gutterBottom>
        📊 Impact Conversationnel - Vue d'Ensemble
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyse de l'influence des stratégies conseiller sur les réactions
        clients
        {selectedOrigin && (
          <span style={{ fontWeight: "bold" }}>
            {" "}
            - Filtrée sur "{selectedOrigin}"
          </span>
        )}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 3,
          mt: 2,
        }}
      >
        {/* Métrique 1 : Volume d'analyse */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
            {metrics.totalInteractions.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Séquences analysées</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Tours conseiller → réaction client
          </Typography>
        </Box>

        {/* Métrique 2 : Impact positif */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            color="success.main"
            sx={{ fontWeight: "bold" }}
          >
            {metrics.positiveImpactRate}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Impact positif</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Stratégies générant une réaction positive
          </Typography>
        </Box>

        {/* Métrique 3 : Efficacité moyenne */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            color="info.main"
            sx={{ fontWeight: "bold" }}
          >
            {metrics.averageEffectiveness}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Efficacité moyenne</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Performance moyenne par famille
          </Typography>
        </Box>

        {/* Métrique 4 : Potentiel d'amélioration */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            color={
              metrics.improvementPotential > 0 ? "warning.main" : "success.main"
            }
            sx={{ fontWeight: "bold" }}
          >
            {metrics.improvementPotential > 0
              ? `+${metrics.improvementPotential}`
              : metrics.improvementPotential}
            %
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Marge de progression</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Gain possible vs meilleure pratique
          </Typography>
        </Box>
      </Box>

      {/* Répartition des réactions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Répartition des Réactions Clients
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Box sx={{ textAlign: "center", minWidth: "120px" }}>
            <Typography
              variant="h5"
              color="success.main"
              sx={{ fontWeight: "bold" }}
            >
              {metrics.positiveImpactRate}%
            </Typography>
            <Typography variant="caption">Positives</Typography>
          </Box>
          <Box sx={{ textAlign: "center", minWidth: "120px" }}>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ fontWeight: "bold" }}
            >
              {metrics.neutralImpactRate}%
            </Typography>
            <Typography variant="caption">Neutres</Typography>
          </Box>
          <Box sx={{ textAlign: "center", minWidth: "120px" }}>
            <Typography
              variant="h5"
              color="error.main"
              sx={{ fontWeight: "bold" }}
            >
              {metrics.negativeImpactRate}%
            </Typography>
            <Typography variant="caption">Négatives</Typography>
          </Box>
        </Box>
      </Box>

      {/* Insights détaillés */}
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom>
          💡 Insights Stratégiques
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              ✅ Stratégie la plus efficace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{metrics.bestStrategy.name}</strong> génère{" "}
              {metrics.bestStrategy.rate}% de réactions positives (
              {metrics.bestStrategy.total} occurrences)
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              ⚠️ Stratégie à optimiser
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{metrics.worstStrategy.name}</strong> ne génère que{" "}
              {metrics.worstStrategy.rate}% de réactions positives (
              {metrics.worstStrategy.total} occurrences)
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              🎯 Recommandation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.improvementPotential > 0 ? (
                <>
                  Privilégier <strong>{metrics.bestStrategy.name}</strong> (+
                  {metrics.improvementPotential}% possible)
                </>
              ) : (
                <>Performance optimale atteinte !</>
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Lien vers administration */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          💡 Besoin d'optimiser vos stratégies ? Rendez-vous sur la{" "}
          <strong style={{ color: theme.palette.primary.main }}>
            page Administration des tags
          </strong>
        </Typography>
      </Box>
    </Paper>
  );
}
