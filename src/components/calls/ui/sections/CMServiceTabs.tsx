// src/components/calls/ui/sections/CMServiceTabs.tsx - AVEC ONGLET TRANSCRIPTION

import React from "react";
import { Tabs, Tab, Box } from "@mui/material";

// ✅ TYPES ÉTENDUS AVEC TRANSCRIPTION
export type ManagementTab =
  | "overview"
  | "transcription" // ✅ NOUVEAU ONGLET
  | "audio"
  | "preparation"
  | "flags"
  | "cleanup";

interface CMServiceTabsProps {
  value: ManagementTab;
  onChange: (tab: ManagementTab) => void;
  loading?: boolean;
}

export function CMServiceTabs({
  value,
  onChange,
  loading = false,
}: CMServiceTabsProps) {
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: ManagementTab
  ) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          "& .MuiTab-root": {
            minWidth: 120,
            fontSize: "0.875rem",
            fontWeight: 500,
          },
          "& .MuiTab-root.Mui-selected": {
            fontWeight: 700,
          },
        }}
      >
        {/* Onglet Vue d'ensemble */}
        <Tab label="📊 Vue d'ensemble" value="overview" disabled={loading} />

        {/* ✅ NOUVEAU : Onglet Transcription */}
        <Tab
          label="🎙️ Transcription"
          value="transcription"
          disabled={loading}
        />

        {/* Onglet Audio */}
        <Tab label="🔊 Audio" value="audio" disabled={loading} />

        {/* Onglet Préparation */}
        <Tab label="📋 Préparation" value="preparation" disabled={loading} />

        {/* Onglet Flags */}
        <Tab label="🏷️ Flags" value="flags" disabled={loading} />

        {/* Onglet Nettoyage */}
        <Tab label="🧹 Nettoyage" value="cleanup" disabled={loading} />
      </Tabs>
    </Box>
  );
}
