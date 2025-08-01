// components/CallsAccordion.tsx - VERSION OPTIMISÉE
import React, { memo, useMemo } from "react";
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

// ✅ ADAPTATION: Interface compatible avec votre hook actuel
interface OriginEditHook {
  selectedCalls: Set<string>;
  hasSelection: boolean;
  selectedCount: number;
  isBulkEditing: boolean;
  isProcessing: boolean;
  pendingOrigin: string;
  availableOrigins: string[];
  isAllSelected: boolean;
  handleSelectCall: (callId: string, selected: boolean) => void;
  handleSelectAll: () => void;
  handleStartBulkEdit: () => void;
  handleSaveBulkEdit: () => Promise<void>;
  handleCancelBulkEdit: () => void;
  setPendingOrigin: (origin: string) => void;
  // Props additionnelles de l'ancien hook si nécessaires
  editingCallId?: string;
  handleStartEdit?: (callId: string) => void;
  handleSaveEdit?: (callId: string, origin: string) => Promise<void>;
  handleCancelEdit?: () => void;
}

interface CallsAccordionProps {
  callsByOrigin: CallsByOrigin;
  originEdit: OriginEditHook;
  onPrepareCall: (call: Call) => Promise<void>;
  onDeleteCall: (call: Call) => void;
  onAddAudio: (call: Call) => void;
  onAddTranscription: (call: Call) => void;
  onViewContent: (call: Call) => void;
  isDeleting: boolean;
  callToDelete: Call | null;
}

// ✅ OPTIMISATION 1: Composant AccordionItem mémoïsé séparément
const AccordionItem = memo(
  ({
    origin,
    calls,
    selectedInOrigin,
    statusCounts,
    originEdit,
    onPrepareCall,
    onDeleteCall,
    onAddAudio,
    onAddTranscription,
    onViewContent,
    isDeleting,
    callToDelete,
  }: {
    origin: string;
    calls: Call[];
    selectedInOrigin: number;
    statusCounts: {
      conflictuel: number;
      nonSupervisé: number;
      nonConflictuel: number;
    };
    originEdit: OriginEditHook;
    onPrepareCall: (call: Call) => Promise<void>;
    onDeleteCall: (call: Call) => void;
    onAddAudio: (call: Call) => void;
    onAddTranscription: (call: Call) => void;
    onViewContent: (call: Call) => void;
    isDeleting: boolean;
    callToDelete: Call | null;
  }) => {
    console.log(
      `🔄 Render AccordionItem: ${origin} (${calls.length} appels, ${selectedInOrigin} sélectionnés)`
    );

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
              <Chip
                size="small"
                label={`${statusCounts.nonSupervisé} non supervisés`}
              />
              <Chip
                size="small"
                label={`${statusCounts.conflictuel} conflictuels`}
                color="error"
              />
              <Chip
                size="small"
                label={`${statusCounts.nonConflictuel} non conflictuels`}
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
  },
  (prevProps, nextProps) => {
    // ✅ OPTIMISATION 2: Comparaison personnalisée fine pour éviter re-renders
    const prevSelected = prevProps.selectedInOrigin;
    const nextSelected = nextProps.selectedInOrigin;

    const isEqual =
      prevProps.origin === nextProps.origin &&
      prevProps.calls.length === nextProps.calls.length &&
      prevSelected === nextSelected &&
      prevProps.statusCounts.conflictuel ===
        nextProps.statusCounts.conflictuel &&
      prevProps.statusCounts.nonSupervisé ===
        nextProps.statusCounts.nonSupervisé &&
      prevProps.statusCounts.nonConflictuel ===
        nextProps.statusCounts.nonConflictuel &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.callToDelete?.callid === nextProps.callToDelete?.callid;

    if (!isEqual) {
      console.log(`🔄 AccordionItem ${prevProps.origin} needs re-render:`, {
        callsChanged: prevProps.calls.length !== nextProps.calls.length,
        selectionChanged: prevSelected !== nextSelected,
        deletingChanged: prevProps.isDeleting !== nextProps.isDeleting,
        callToDeleteChanged:
          prevProps.callToDelete?.callid !== nextProps.callToDelete?.callid,
      });
    }

    return isEqual;
  }
);

AccordionItem.displayName = "AccordionItem";

// ✅ OPTIMISATION 3: Composant principal avec pré-calcul des données
const CallsAccordion: React.FC<CallsAccordionProps> = memo(
  ({
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
    // ✅ OPTIMISATION 4: Pré-calcul de toutes les données dérivées
    const accordionData = useMemo(() => {
      console.time("accordion-data-computation");

      const data = Object.entries(callsByOrigin).map(([origin, calls]) => {
        // Calcul des statuts pour cette origine
        const statusCounts = countStatuses(calls);

        // Calcul des sélections pour cette origine
        const selectedInOrigin = calls.filter((call) =>
          originEdit.selectedCalls.has(call.callid)
        ).length;

        return {
          origin,
          calls,
          selectedInOrigin,
          statusCounts,
        };
      });

      console.timeEnd("accordion-data-computation");
      console.log(`📊 Accordion data computed for ${data.length} origins`);

      return data;
    }, [callsByOrigin, originEdit.selectedCalls]);

    // ✅ OPTIMISATION 5: Props stables pour chaque AccordionItem
    const stableProps = useMemo(
      () => ({
        onPrepareCall,
        onDeleteCall,
        onAddAudio,
        onAddTranscription,
        onViewContent,
        isDeleting,
        callToDelete,
      }),
      [
        onPrepareCall,
        onDeleteCall,
        onAddAudio,
        onAddTranscription,
        onViewContent,
        isDeleting,
        callToDelete,
      ]
    );

    console.log(`🔄 Render CallsAccordion - ${accordionData.length} origines`);

    return (
      <Box>
        {accordionData.map((itemData) => (
          <AccordionItem
            key={itemData.origin}
            origin={itemData.origin}
            calls={itemData.calls}
            selectedInOrigin={itemData.selectedInOrigin}
            statusCounts={itemData.statusCounts}
            originEdit={originEdit}
            {...stableProps}
          />
        ))}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // ✅ OPTIMISATION 6: Comparaison du composant principal
    const callsByOriginChanged =
      Object.keys(prevProps.callsByOrigin).length !==
        Object.keys(nextProps.callsByOrigin).length ||
      Object.keys(prevProps.callsByOrigin).some(
        (origin) =>
          prevProps.callsByOrigin[origin].length !==
          nextProps.callsByOrigin[origin]?.length
      );

    const selectionChanged =
      prevProps.originEdit.selectedCalls.size !==
      nextProps.originEdit.selectedCalls.size;

    const otherPropsChanged =
      prevProps.isDeleting !== nextProps.isDeleting ||
      prevProps.callToDelete?.callid !== nextProps.callToDelete?.callid;

    const shouldRerender =
      callsByOriginChanged || selectionChanged || otherPropsChanged;

    if (shouldRerender) {
      console.log(`🔄 CallsAccordion needs re-render:`, {
        callsByOriginChanged,
        selectionChanged,
        otherPropsChanged,
      });
    }

    return !shouldRerender;
  }
);

CallsAccordion.displayName = "CallsAccordion";

export default CallsAccordion;
