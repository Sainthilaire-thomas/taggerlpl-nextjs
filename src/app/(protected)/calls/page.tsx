"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import CallUploaderTaggerLPL from "@/components/CallUploaderTaggerLPL";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`calls-tabpanel-${index}`}
      aria-labelledby={`calls-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CallsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des appels
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="calls management tabs"
        >
          <Tab
            label="Import d'appels"
            id="calls-tab-0"
            aria-controls="calls-tabpanel-0"
          />
          <Tab
            label="Liste des appels"
            id="calls-tab-1"
            aria-controls="calls-tabpanel-1"
          />
          <Tab
            label="Préparation"
            id="calls-tab-2"
            aria-controls="calls-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Import de nouveaux appels
        </Typography>
        <CallUploaderTaggerLPL />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1">
          Cette section affichera la liste complète des appels disponibles dans
          le système.
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          Cette section permettra de préparer les appels pour le tagging
          (conversion, traitement, etc.).
        </Typography>
      </TabPanel>
    </Box>
  );
}
