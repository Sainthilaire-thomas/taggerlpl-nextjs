import React from "react";
import { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useTaggingData } from "@/features/shared/context";
import TagManager from "@/features/phase2-annotation/tags/ui/components/TagManager";

// Import dynamique pour why-did-you-render (uniquement en développement)
// Next.js utilise un système d'import différent de Vite
let wdyr: any;
if (process.env.NODE_ENV === "development") {
  // Import dynamique pour éviter d'affecter l'environnement de production
  import("@welldone-software/why-did-you-render").then((mod) => {
    wdyr = mod.default;
  });
}

// Import Tag type from context to avoid conflicts
// Remove local Tag interface definition since it should come from useTaggingData

interface TooltipState {
  tag?: any; // Use any for now to avoid type conflicts
  position?: { x: number; y: number };
  mode?: string;
}

interface TagSelectorProps {
  onSelectTag: (tag: any) => void; // Use any for now to avoid type conflicts
  tooltipState?: TooltipState;
  onRemoveTag: () => void;
}

interface GroupedTags {
  ENGAGEMENT: any[];
  REFLET: any[];
  EXPLICATION: any[];
  OUVERTURE: any[];
  CLIENT: any[];
  OTHERS: any[];
}

const TagSelector: React.FC<TagSelectorProps> = ({
  onSelectTag,
  tooltipState,
  onRemoveTag,
}) => {
  console.log("TagSelector rendu", {
    tooltipState,
    onSelectTag,
    onRemoveTag,
  });

  useEffect(() => {
    console.time("TagSelector Render Time");
    console.log("TagSelector rendu avec tooltipState :", tooltipState);
    console.timeEnd("TagSelector Render Time");
  }, [tooltipState]);

  console.log("Mode actuel :", process.env.NODE_ENV);
  const { tags } = useTaggingData();
  const [showTagManager, setShowTagManager] = useState<boolean>(false);

  // Get the Tag type from the first tag to infer the correct type
  type Tag = (typeof tags)[0];

  // Groupement des tags par famille - FIX: Explicitly type the reduce function
  const groupedTags = tags.reduce(
    (acc: any, tag: any) => {
      if (
        ["ENGAGEMENT", "REFLET", "EXPLICATION", "OUVERTURE", "CLIENT"].includes(
          tag.family
        )
      ) {
        acc[tag.family as keyof GroupedTags].push(tag);
      } else {
        acc.OTHERS.push(tag);
      }
      return acc;
    },
    {
      ENGAGEMENT: [],
      REFLET: [],
      EXPLICATION: [],
      OUVERTURE: [],
      CLIENT: [],
      OTHERS: [],
    }
  );

  // Rendre les tags par famille
  const renderTagGrid = (tags: any[], title: string) => (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            title === "CLIENT"
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "8px",
        }}
      >
        {tags.map((tag) => (
          <Box
            key={tag.id}
            sx={{
              backgroundColor: tag.color,
              borderRadius: 1,
              padding: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              textAlign: "center",
              height: "60px",
              color: "#fff",
              fontSize: "0.875rem",
            }}
            onClick={() => onSelectTag(tag)}
          >
            {tag.label}
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (showTagManager) {
    return <TagManager onClose={() => setShowTagManager(false)} />;
  }

  return (
    <Box sx={{ padding: 2, maxHeight: "80vh" }}>
      {/* Disposition des tags */}
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "repeat(5, auto)",
          gap: 2,
        }}
      >
        {/* Première ligne : ENGAGEMENT et REFLET */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {renderTagGrid(groupedTags.ENGAGEMENT, "ENGAGEMENT")}
          {renderTagGrid(groupedTags.REFLET, "REFLET")}
        </Box>

        {/* Deuxième ligne : EXPLICATION et OUVERTURE */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {renderTagGrid(groupedTags.EXPLICATION, "EXPLICATION")}
          {renderTagGrid(groupedTags.OUVERTURE, "OUVERTURE")}
        </Box>

        {/* Troisième ligne : CLIENT */}
        {renderTagGrid(groupedTags.CLIENT, "CLIENT")}

        {/* Dernière ligne : AUTRES */}
        {renderTagGrid(groupedTags.OTHERS, "AUTRES")}
      </Box>

      {/* Bouton pour ouvrir TagManager */}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setShowTagManager(true)}
        sx={{ marginTop: 4 }}
      >
        Gérer les Tags
      </Button>

      {/* Bouton pour supprimer le tag du tour sélectionné */}
      {tooltipState?.tag && (
        <Button
          variant="outlined"
          color="error"
          onClick={onRemoveTag}
          sx={{ marginTop: 2 }}
        >
          Supprimer le Tag associé
        </Button>
      )}
    </Box>
  );
};

// Configuration why-did-you-render
if (process.env.NODE_ENV === "development") {
  // Cette section sera exécutée uniquement côté client après le chargement de la page
  if (typeof window !== "undefined") {
    setTimeout(() => {
      if (wdyr) {
        console.log("why-did-you-render activé pour TagSelector");
        wdyr(React, {
          trackAllPureComponents: false,
        });
        // @ts-ignore
        TagSelector.whyDidYouRender = true;
      }
    }, 0);
  }
}

export default React.memo(TagSelector);

