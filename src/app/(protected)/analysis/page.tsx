"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import TagStats from "@/components/TagStats";
import TagAnalysisReport from "@/components/TagAnalysisReport";
import TagAnalysisGraphs from "@/components/TagAnalysisGraph";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AnalysisPage() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Cette fonction serait normalement implémentée pour obtenir les familles depuis la base de données
  const families = ["ENGAGEMENT", "OUVERTURE", "REFLET", "EXPLICATION"];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analyse et rapports
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analysis tabs"
        >
          <Tab
            label="Statistiques des tags"
            id="analysis-tab-0"
            aria-controls="analysis-tabpanel-0"
          />
          <Tab
            label="Rapports d'analyse"
            id="analysis-tab-1"
            aria-controls="analysis-tabpanel-1"
          />
          <Tab
            label="Visualisations avancées"
            id="analysis-tab-2"
            aria-controls="analysis-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sélectionnez une famille de tags pour visualiser les statistiques
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {families.map((family) => (
              <Box
                key={family}
                onClick={() => setSelectedFamily(family)}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor:
                    selectedFamily === family ? "primary.main" : "divider",
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor:
                    selectedFamily === family
                      ? "primary.light"
                      : "background.paper",
                  color:
                    selectedFamily === family
                      ? "primary.contrastText"
                      : "text.primary",
                  fontWeight: selectedFamily === family ? "bold" : "normal",
                }}
              >
                {family}
              </Box>
            ))}
          </Box>
        </Box>

        <TagStats family={selectedFamily} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TagAnalysisReport family={selectedFamily} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TagAnalysisGraphs />
      </TabPanel>
    </Box>
  );
}
