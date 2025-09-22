import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Chip,
  Skeleton,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore, SelectAll } from "@mui/icons-material";
import { useMemo } from "react";

import { VirtualizedCallTable } from "../components/VirtualizedCallTable";
import type { CallExtended } from "../../domain";
type LazyBucket = { calls: CallExtended[]; loaded: boolean; loading: boolean };

export interface CMOriginAccordionsProps {
  callsByOrigin: Record<string, CallExtended[]>;
  isExpanded: (origin: string) => boolean;
  isLoading: (origin: string) => boolean;
  isLoaded: (origin: string) => boolean;
  dataFor: (origin: string) => LazyBucket | undefined;
  toggle: (origin: string) => void;

  selectedCalls: Set<string>;
  toggleSelection: (id: string) => void;
  selectByOrigin: (origin: string) => void;

  onLifecycleAction: (
    action: "prepare" | "select" | "unselect" | "tag",
    call: CallExtended
  ) => void | Promise<void>;
  renderRelationStatus: (callId: string) => React.ReactNode;
}

export function CMOriginAccordions({
  callsByOrigin,
  isExpanded,
  isLoading,
  isLoaded,
  dataFor,
  toggle,
  selectedCalls,
  toggleSelection,
  selectByOrigin,
  onLifecycleAction,
  renderRelationStatus,
}: CMOriginAccordionsProps) {
  const sections = useMemo(() => {
    const entries = Object.entries(callsByOrigin) as Array<
      [string, CallExtended[]]
    >;
    return entries.map(([origin, originCalls]) => {
      const expanded = isExpanded(origin);
      const data = dataFor(origin);
      const show = expanded && isLoaded(origin);

      return (
        <Accordion
          key={origin}
          expanded={expanded}
          onChange={() => toggle(origin)}
          TransitionProps={{ timeout: 300 }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderBottom: "1px solid rgba(0,0,0,0.12)",
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{origin}</Typography>
                <Chip
                  label={`${originCalls.length} appels`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${
                    originCalls.filter(
                      (c) => (c.status as string) === "conflictuel"
                    ).length
                  } conflictuels`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${
                    originCalls.filter((c) => c.hasValidAudio()).length
                  } avec audio`}
                  color="info"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${
                    originCalls.filter((c) => c.isReadyForTagging()).length
                  } prêts`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  selectByOrigin(origin);
                }}
                startIcon={<SelectAll />}
                variant="outlined"
              >
                Sélectionner tous
              </Button>
            </Box>

            <AccordionSummary
              expandIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              <Typography variant="body2" color="text.secondary">
                {expanded ? "Masquer" : "Afficher"} les détails des appels{" "}
                {isLoading(origin) && " (chargement...)"}
              </Typography>
            </AccordionSummary>
          </Box>

          <AccordionDetails>
            {isLoading(origin) ? (
              <Box>
                {[...Array(3)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={60}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            ) : show && data ? (
              <VirtualizedCallTable
                calls={data.calls}
                selectedCalls={selectedCalls}
                onToggleSelection={toggleSelection}
                onSelectAll={() => {
                  const all = data.calls.every((c) => selectedCalls.has(c.id));
                  data.calls.forEach((c) => {
                    if (all && selectedCalls.has(c.id)) toggleSelection(c.id);
                    else if (!all && !selectedCalls.has(c.id))
                      toggleSelection(c.id);
                  });
                }}
                onLifecycleAction={onLifecycleAction}
                renderRelationStatus={renderRelationStatus}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Cliquez pour charger les données...
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      );
    });
  }, [
    callsByOrigin,
    isExpanded,
    isLoaded,
    isLoading,
    dataFor,
    toggle,
    selectedCalls,
    toggleSelection,
    onLifecycleAction,
    renderRelationStatus,
  ]);

  return <>{sections}</>;
}
