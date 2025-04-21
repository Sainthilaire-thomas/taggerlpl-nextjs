"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Tabs, Tab, CircularProgress } from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

// Import des composants extraits du composant TaggerLPL
import TagTreeView from "@/components/TagTreeView";
import TagHistoryView from "@/components/TagHistoryView";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tags-tabpanel-${index}`}
      aria-labelledby={`tags-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TagsAdminPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tagsCount, setTagsCount] = useState(0);

  useEffect(() => {
    const fetchTagsCount = async () => {
      try {
        const { count, error } = await supabase
          .from("lpltag")
          .select("*", { count: "exact" });

        if (error) {
          console.error("Erreur lors de la récupération des tags:", error);
        } else {
          setTagsCount(count || 0);
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTagsCount();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administration des tags
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Typography variant="body2" gutterBottom>
          Référentiel actuel : {tagsCount} tags disponibles
        </Typography>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="tags administration tabs"
        >
          <Tab
            label="Référentiel de tags"
            id="tags-tab-0"
            aria-controls="tags-tabpanel-0"
          />
          <Tab
            label="Historique des modifications"
            id="tags-tab-1"
            aria-controls="tags-tabpanel-1"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TagTreeView />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TagHistoryView />
      </TabPanel>
    </Box>
  );
}
