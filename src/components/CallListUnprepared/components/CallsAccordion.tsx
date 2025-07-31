// components/CallsAccordion.tsx - VERSION CORRIGÉE
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CallTableRow from "./CallTableRow";
import { Call, CallsByOrigin } from "../types";
import { countStatuses } from "../utils";
import { UseOriginEditReturn } from "../hooks/useOriginEdit";

interface CallsAccordionProps {
  callsByOrigin: CallsByOrigin;
  originEdit: UseOriginEditReturn;
  onPrepareCall: (call: Call) => Promise<void>;
  onDeleteCall: (call: Call) => void;
  onAddAudio: (call: Call) => void;
  onAddTranscription: (call: Call) => void;
  onViewContent: (call: Call) => void;
  isDeleting: boolean;
  callToDelete: Call | null;
}

const CallsAccordion: React.FC<CallsAccordionProps> = ({
  callsByOrigin,
  originEdit,
  onPrepareCall,
  onDeleteCall,
  onAddAudio,
  onAddTranscription,
  onViewContent,
  isDeleting,
  callToDelete,
}) => {
  return (
    <Box>
      {Object.entries(callsByOrigin).map(([origin, calls]) => {
        const { conflictuel, nonSupervisé, nonConflictuel } =
          countStatuses(calls);

        // Calculer les sélections pour cette origine
        const selectedInOrigin = calls.filter((call) =>
          originEdit.selectedCalls.has(call.callid)
        ).length;

        return (
          <Accordion key={origin}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                {/* ✅ SOLUTION: Box au lieu de Typography pour conteneur */}
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="body1">
                    {origin} ({calls.length} appels)
                  </Typography>
                  {selectedInOrigin > 0 && (
                    <Chip
                      size="small"
                      label={`${selectedInOrigin} sélectionné${
                        selectedInOrigin > 1 ? "s" : ""
                      }`}
                      color="primary"
                    />
                  )}
                </Box>

                {/* Chips de statut */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip size="small" label={`${nonSupervisé} non supervisés`} />
                  <Chip
                    size="small"
                    label={`${conflictuel} conflictuels`}
                    color="error"
                  />
                  <Chip
                    size="small"
                    label={`${nonConflictuel} non conflictuels`}
                    color="success"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <CallTableRow
                calls={calls}
                originEdit={originEdit}
                onPrepareCall={onPrepareCall}
                onDeleteCall={onDeleteCall}
                onAddAudio={onAddAudio}
                onAddTranscription={onAddTranscription}
                onViewContent={onViewContent}
                isDeleting={isDeleting}
                callToDelete={callToDelete}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default CallsAccordion;
