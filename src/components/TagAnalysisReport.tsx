"use client";

import { useEffect, useState, FC } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabaseClient";

// Types
interface LPLTag {
  family: string;
  icon: string;
}

// Type correct pour les données retournées par Supabase avec join
interface TurnTaggedItem {
  tag: string;
  next_turn_tag: string | null;
  lpltag: LPLTag[]; // Supabase retourne un tableau avec les jointures !inner
}

interface TagCountData {
  family: string;
  icon: string;
  counts: {
    [key: string]: number;
  };
}

interface AggregatedData {
  [key: string]: TagCountData;
}

interface TagAnalysisReportProps {
  family?: string;
}

const TagAnalysisReport: FC<TagAnalysisReportProps> = ({ family }) => {
  const [data, setData] = useState<AggregatedData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Construction de la requête de base
        let query = supabase
          .from("turntagged")
          .select(
            `
            tag,
            next_turn_tag,
            lpltag!inner(
              family,
              icon
            )
          `
          )
          .eq("lpltag.icon", "agent") // Tags avec l'icône "agent"
          .order("tag", { ascending: true });

        // Ajout d'un filtre optionnel par famille
        if (family) {
          query = query.eq("lpltag.family", family);
        }

        // Exécution de la requête
        const { data: rawData, error } = await query;

        if (error) {
          throw new Error(`Erreur Supabase: ${error.message}`);
        }

        // Agréger les données pour chaque tag
        const aggregatedData = (rawData as TurnTaggedItem[]).reduce(
          (acc: AggregatedData, item) => {
            const tag = item.tag || "Non spécifié";
            const nextTurnTag = item.next_turn_tag || "Aucun";

            // Prendre le premier élément du tableau lpltag (avec !inner, il n'y en aura qu'un)
            const lpltagData = item.lpltag[0];

            if (!acc[tag]) {
              acc[tag] = {
                family: lpltagData.family,
                icon: lpltagData.icon,
                counts: {},
              };
            }

            if (!acc[tag].counts[nextTurnTag]) {
              acc[tag].counts[nextTurnTag] = 0;
            }

            acc[tag].counts[nextTurnTag] += 1;
            return acc;
          },
          {}
        );

        setData(aggregatedData);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Une erreur inconnue est survenue";
        console.error("Erreur :", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [family]);

  // Génération PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const title = family
      ? `Analyse des Pratiques de l'Agent - Famille: ${family}`
      : "Analyse des Pratiques de l'Agent";

    doc.text(title, 10, 10);

    let yPosition = 20;

    Object.entries(data).forEach(([tag, tagData]) => {
      const { family, counts } = tagData;

      // Ajouter le nom du tag
      doc.setFont("Helvetica", "bold");
      doc.text(`Tag : ${tag}`, 10, yPosition);
      yPosition += 10;

      // Ajouter la famille
      doc.setFont("Helvetica", "normal");
      doc.text(`Famille : ${family}`, 10, yPosition);
      yPosition += 10;

      // Ajouter les stats
      Object.entries(counts).forEach(([nextTurnTag, count]) => {
        doc.text(
          `- Réponse suivante (${nextTurnTag}) : ${count}`,
          20,
          yPosition
        );
        yPosition += 10;
      });

      yPosition += 10;

      // Nouvelle page si le contenu dépasse
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });

    const fileName = family
      ? `Analyse_Pratique_Agent_${family}.pdf`
      : "Analyse_Pratique_Agent.pdf";

    doc.save(fileName);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: "red", textAlign: "center", marginTop: 4 }}>
        <Typography variant="h6">Erreur : {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2, maxWidth: "80%", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        {family
          ? `Analyse des Pratiques de l'Agent - ${family}`
          : "Analyse des Pratiques de l'Agent"}
      </Typography>

      <Box sx={{ marginBottom: 2 }}>
        <Button variant="contained" color="primary" onClick={generatePDF}>
          Télécharger en PDF
        </Button>
      </Box>

      {Object.entries(data).length === 0 ? (
        <Typography variant="body1">
          Aucune donnée disponible pour cette analyse.
        </Typography>
      ) : (
        Object.entries(data).map(([tag, tagData]) => {
          const { family, counts } = tagData;

          return (
            <Box key={tag} sx={{ marginBottom: 4 }}>
              <Typography variant="h6">
                Tag : <strong>{tag}</strong>
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Famille : {family}
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: 1 }}>
                Statistiques des réponses suivantes :
              </Typography>
              <ul>
                {Object.entries(counts).map(([nextTurnTag, count]) => (
                  <li key={nextTurnTag}>
                    <Typography variant="body2">
                      {nextTurnTag} : {count} occurrences
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          );
        })
      )}
    </Box>
  );
};

export default TagAnalysisReport;
