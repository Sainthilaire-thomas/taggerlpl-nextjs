// app/(protected)/tags/page.tsx - Avec intégration TagExplorer
"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab, Paper } from "@mui/material";
import AppLayout from "../layout";

// Composants existants de la page tags
import TagManager from "./components/TagManager"; // Votre composant existant
import TagExplorer from "./components/TagExplorer"; // Nouveau composant

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tags-tabpanel-${index}`}
      aria-labelledby={`tags-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tags-tab-${index}`,
    "aria-controls": `tags-tabpanel-${index}`,
  };
}

export default function TagsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTagsClassified = () => {
    // Rafraîchir les composants quand des tags sont classifiés
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
            Administration des Tags
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Gestion, classification et analyse des tags conversationnels
          </Typography>
        </Box>

        {/* Onglets */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
              },
            }}
          >
            <Tab label="🔧 Gestion des Tags" {...a11yProps(0)} />
            <Tab label="🏷️ Classification Tags" {...a11yProps(1)} />
            <Tab label="📊 Statistiques" {...a11yProps(2)} />
          </Tabs>
        </Paper>

        {/* Contenu des onglets */}
        <TabPanel value={tabValue} index={0}>
          <TagManager key={`manager-${refreshTrigger}`} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TagExplorer onTagsClassified={handleTagsClassified} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Statistiques des Tags
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Statistiques et métriques sur l'usage des tags (à développer)
            </Typography>

            {/* Ici vous pouvez ajouter des composants de statistiques */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                💡 Cette section pourra inclure :
              </Typography>
              <ul>
                <li>Répartition conseiller vs client</li>
                <li>Tags les plus utilisés</li>
                <li>Évolution dans le temps</li>
                <li>Efficacité par famille</li>
              </ul>
            </Box>
          </Paper>
        </TabPanel>
      </Box>
    </AppLayout>
  );
}
