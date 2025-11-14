// TabContainer.tsx - Orchestrateur principal des onglets FeedbackAlignment
import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, Alert } from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  Psychology as LicaIcon,
  Compare as CompareIcon,
} from "@mui/icons-material";

// Composants d'onglets spécialisés
import BasicAlgorithmTab from "./BasicAlgorithmTab";
import LICAAlgorithmTab from "./LICAAlgorithmTab";
import ComparisonTab from "./ComparisonTab";

// Types
interface TabContainerProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  index: string;
}

// Composant TabPanel réutilisable
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feedback-alignment-tabpanel-${index}`}
      aria-labelledby={`feedback-alignment-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

// Propriétés d'accessibilité pour les onglets
const a11yProps = (index: string) => {
  return {
    id: `feedback-alignment-tab-${index}`,
    "aria-controls": `feedback-alignment-tabpanel-${index}`,
  };
};

const TabContainer: React.FC<TabContainerProps> = ({
  selectedOrigin,
  showDetailedResults = false,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "lica" | "comparison">(
    "basic"
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue as "basic" | "lica" | "comparison");
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* En-tête avec information contextuelle */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🔬 Centre d'Analyse Multi-Algorithmes :</strong> Comparez
          différentes approches d'analyse conversationnelle pour mesurer
          l'efficacité des stratégies linguistiques.
          {selectedOrigin &&
            ` Analyse filtrée sur l'origine "${selectedOrigin}".`}
        </Typography>
      </Alert>

      {/* Onglets de navigation */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Algorithmes d'analyse feedback alignment"
          variant="fullWidth"
          indicatorColor="secondary"
          textColor="secondary"
        >
          <Tab
            icon={<AnalyticsIcon />}
            iconPosition="start"
            label="Sentiment Analysis"
            value="basic"
            {...a11yProps("basic")}
            sx={{
              fontSize: "0.9rem",
              fontWeight: activeTab === "basic" ? "bold" : "normal",
            }}
          />
          <Tab
            icon={<LicaIcon />}
            iconPosition="start"
            label="LI-CA Patterns"
            value="lica"
            {...a11yProps("lica")}
            sx={{
              fontSize: "0.9rem",
              fontWeight: activeTab === "lica" ? "bold" : "normal",
            }}
          />
          <Tab
            icon={<CompareIcon />}
            iconPosition="start"
            label="Comparaison"
            value="comparison"
            {...a11yProps("comparison")}
            sx={{
              fontSize: "0.9rem",
              fontWeight: activeTab === "comparison" ? "bold" : "normal",
            }}
          />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      <TabPanel value={activeTab} index="basic">
        <BasicAlgorithmTab
          selectedOrigin={selectedOrigin}
          showDetailedResults={showDetailedResults}
        />
      </TabPanel>

      <TabPanel value={activeTab} index="lica">
        <LICAAlgorithmTab
          selectedOrigin={selectedOrigin}
          showDetailedResults={showDetailedResults}
        />
      </TabPanel>

      <TabPanel value={activeTab} index="comparison">
        <ComparisonTab
          selectedOrigin={selectedOrigin}
          showDetailedResults={showDetailedResults}
        />
      </TabPanel>
    </Box>
  );
};

export default TabContainer;
