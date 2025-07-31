// =================================
// 3. COMPOSANT BARRE ÉDITION EN LOT - components/BulkOriginEditBar.tsx
// =================================

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Fade,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

interface BulkOriginEditBarProps {
  visible: boolean;
  selectedCount: number;
  isEditing: boolean;
  isProcessing: boolean;
  availableOrigins: string[];
  pendingOrigin: string;
  onStartEdit: () => void;
  onSave: (origin: string) => Promise<void>;
  onCancel: () => void;
  onOriginChange: (origin: string) => void;
  onSelectAll: (selected: boolean) => void;
  isAllSelected: boolean;
}

const BulkOriginEditBar: React.FC<BulkOriginEditBarProps> = ({
  visible,
  selectedCount,
  isEditing,
  isProcessing,
  availableOrigins,
  pendingOrigin,
  onStartEdit,
  onSave,
  onCancel,
  onOriginChange,
  onSelectAll,
  isAllSelected,
}) => {
  return (
    <Fade in={visible}>
      <Paper
        elevation={3}
        sx={{
          position: "sticky",
          top: 60, // Sous la navbar
          zIndex: 1000,
          p: 2,
          mb: 2,
          backgroundColor: "primary.light",
          color: "primary.contrastText",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {/* Sélection globale */}
          <IconButton
            size="small"
            onClick={() => onSelectAll(!isAllSelected)}
            sx={{ color: "inherit" }}
            title={isAllSelected ? "Désélectionner tout" : "Sélectionner tout"}
          >
            <SelectAllIcon />
          </IconButton>

          {/* Compteur */}
          <Chip
            label={`${selectedCount} sélectionné${
              selectedCount > 1 ? "s" : ""
            }`}
            size="small"
            sx={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          />

          {/* Mode édition */}
          {!isEditing ? (
            <Button
              startIcon={<EditIcon />}
              variant="contained"
              size="small"
              onClick={onStartEdit}
              disabled={selectedCount === 0}
              sx={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              Modifier l'origine
            </Button>
          ) : (
            <>
              {/* Sélecteur d'origine */}
              <Autocomplete
                size="small"
                value={pendingOrigin}
                onChange={(_, value) => onOriginChange(value || "")}
                options={availableOrigins}
                freeSolo
                sx={{ minWidth: 200 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Nouvelle origine..."
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: "background.paper",
                      borderRadius: 1,
                    }}
                  />
                )}
              />

              {/* Actions de sauvegarde */}
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                size="small"
                onClick={() => onSave(pendingOrigin)}
                disabled={isProcessing || !pendingOrigin.trim()}
                color="success"
              >
                {isProcessing ? "Sauvegarde..." : "Sauvegarder"}
              </Button>

              <IconButton
                size="small"
                onClick={onCancel}
                sx={{ color: "inherit" }}
                title="Annuler"
              >
                <CloseIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export default BulkOriginEditBar;
