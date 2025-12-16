// ============================================================================
// Level0Tabs - Interface à onglets pour Level 0
// ============================================================================

"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { InterAnnotatorAgreement } from "./InterAnnotatorAgreement";
import { Level0Interface } from "./Level0Interface";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`level0-tabpanel-${index}`}
      aria-labelledby={`level0-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const Level0Tabs: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Multi-Chartes LLM" id="level0-tab-0" />
          <Tab label="Accord Inter-Annotateur" id="level0-tab-1" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Level0Interface />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <InterAnnotatorAgreement />
      </TabPanel>
    </Box>
  );
};
