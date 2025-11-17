"use client";
import { useState } from "react";
import { Box, Typography, Tabs, Tab, Paper } from "@mui/material";

// Composants depuis features
import TagManager from "@/features/phase2-annotation/tags/ui/components/TagManager";
import TagExplorer from "@/features/phase2-annotation/tags/ui/components/TagExplorer";

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion du Référentiel de Tags
      </Typography>

      <Paper sx={{ width: "100%", mt: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="tags management tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Gestionnaire de Tags" {...a11yProps(0)} />
          <Tab label="Explorateur de Tags" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TagManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TagExplorer />
        </TabPanel>
      </Paper>
    </Box>
  );
}