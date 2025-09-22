// src/components/calls/ui/sections/CMServiceTabs.tsx
import { Tabs, Tab } from "@mui/material";
import {
  Assessment,
  Description,
  AudioFile,
  Build,
  Flag,
  CleaningServices,
} from "@mui/icons-material";

export type ManagementTab =
  | "overview"
  | "transcription"
  | "audio"
  | "preparation"
  | "flags"
  | "cleanup";

export function CMServiceTabs({
  value,
  onChange,
}: {
  value: ManagementTab;
  onChange: (t: ManagementTab) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={(_, t) => onChange(t)}
      variant="scrollable"
      scrollButtons="auto"
    >
      <Tab
        value="overview"
        label="Vue d'ensemble"
        icon={<Assessment />}
        iconPosition="start"
      />
      <Tab
        value="transcription"
        label="Transcription"
        icon={<Description />}
        iconPosition="start"
      />
      <Tab
        value="audio"
        label="Audio"
        icon={<AudioFile />}
        iconPosition="start"
      />
      <Tab
        value="preparation"
        label="Préparation"
        icon={<Build />}
        iconPosition="start"
      />
      <Tab
        value="flags"
        label="Flags & Statuts"
        icon={<Flag />}
        iconPosition="start"
      />
      <Tab
        value="cleanup"
        label="Nettoyage"
        icon={<CleaningServices />}
        iconPosition="start"
      />
    </Tabs>
  );
}
