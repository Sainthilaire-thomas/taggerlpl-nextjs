// components/OriginEditableCell.tsx - VERSION SANS CRAYON (GAIN DE PLACE)
import React, { useCallback, memo } from "react";
import { Box, Typography, Checkbox } from "@mui/material";
import { Call } from "../types";

interface OriginEditableCellProps {
  call: Call;
  isSelected: boolean;
  availableOrigins: string[];
  onSelect: (callId: string, selected: boolean) => void;
  // ✅ SUPPRESSION: Plus besoin des props d'édition individuelle
  // isEditing: boolean;
  // isProcessing: boolean;
  // pendingOrigin: string;
  // onStartEdit: (callId: string) => void;
  // onSave: (callId: string, origin: string) => Promise<void>;
  // onCancel: () => void;
  // onOriginChange: (origin: string) => void;
}

// 🚀 OPTIMISATION: Composant ultra-simplifié pour gagner de la place
const OriginEditableCell = memo(
  ({ call, isSelected, onSelect }: OriginEditableCellProps) => {
    // ✅ Handler ultra-stable pour la checkbox
    const handleSelectChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        console.time(`checkbox-${call.callid}`);
        onSelect(call.callid, event.target.checked);
        requestAnimationFrame(() => {
          console.timeEnd(`checkbox-${call.callid}`);
        });
      },
      [call.callid, onSelect]
    );

    console.log(
      `🔄 Render OriginEditableCell: ${call.callid} (selected: ${isSelected})`
    );

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 180, // ✅ RÉDUCTION: Moins large sans le crayon
          maxWidth: 200, // ✅ LIMITE: Pour ne pas déborder
        }}
      >
        {/* ✅ Checkbox optimisée */}
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={handleSelectChange}
          sx={{ p: 0.5 }}
        />

        {/* ✅ SIMPLIFICATION: Affichage uniquement (plus d'édition individuelle) */}
        <Typography
          variant="body2"
          sx={{
            flexGrow: 1,
            fontWeight: call.origine ? "normal" : "italic",
            color: call.origine ? "text.primary" : "text.secondary",
            fontSize: "0.875rem", // ✅ RÉDUCTION: Police plus petite
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap", // ✅ GAIN DE PLACE: Pas de retour à la ligne
          }}
          title={call.origine || "Non définie"} // ✅ Tooltip pour le texte coupé
        >
          {call.origine || "Non définie"}
        </Typography>

        {/* ✅ SUPPRESSION COMPLÈTE: Plus de crayon d'édition */}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // ✅ OPTIMISATION: Comparaison ultra-précise (3 critères seulement)
    const isEqual =
      prevProps.call.callid === nextProps.call.callid &&
      prevProps.call.origine === nextProps.call.origine &&
      prevProps.isSelected === nextProps.isSelected;

    if (!isEqual) {
      console.log(
        `🔄 OriginEditableCell ${prevProps.call.callid} needs re-render:`,
        {
          origineChanged: prevProps.call.origine !== nextProps.call.origine,
          selectionChanged: prevProps.isSelected !== nextProps.isSelected,
        }
      );
    }

    return isEqual;
  }
);

OriginEditableCell.displayName = "OriginEditableCell";

export default OriginEditableCell;
