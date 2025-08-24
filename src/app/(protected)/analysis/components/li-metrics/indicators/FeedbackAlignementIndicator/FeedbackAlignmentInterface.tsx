// FeedbackAlignmentInterface.tsx - Version avec structure à onglets factorisée
import React from "react";
import { Box } from "@mui/material";

// Composant principal d'orchestration des onglets
import TabContainer from "./components/tabs/TabContainer";

// Types
interface FeedbackAlignmentInterfaceProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
  showComparison?: boolean; // Conservé pour compatibilité, mais non utilisé dans la version onglets
}

const FeedbackAlignmentInterface: React.FC<FeedbackAlignmentInterfaceProps> = ({
  selectedOrigin,
  showDetailedResults = false,
  showComparison = false, // Paramètre conservé mais non utilisé (mode comparaison accessible via onglet)
}) => {
  return (
    <Box sx={{ p: 3, maxWidth: "100%" }}>
      {/* Orchestrateur principal des onglets */}
      <TabContainer
        selectedOrigin={selectedOrigin}
        showDetailedResults={showDetailedResults}
      />
    </Box>
  );
};

export default FeedbackAlignmentInterface;
