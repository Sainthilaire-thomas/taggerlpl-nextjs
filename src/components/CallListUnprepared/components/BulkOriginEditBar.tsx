// components/BulkOriginEditBar.tsx - SUPPORT OPTION VIDE
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
  // ✅ NOUVEAU: Gestion de l'affichage de l'option vide
  const getOptionLabel = (option: string) => {
    if (option === "") {
      return "Aucune origine"; // ✅ Libellé pour l'option vide
    }
    return option;
  };

  // ✅ NOUVEAU: Rendu personnalisé des options
  const renderOption = (props: any, option: string) => (
    <li {...props} key={option || "empty"}>
      {option === "" ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: "text.secondary" }}
          >
            Aucune origine
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2">{option}</Typography>
      )}
    </li>
  );

  return (
    <Fade in={visible}>
      <Paper
        elevation={3}
        sx={{
          position: "sticky",
          top: 60,
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
              {/* ✅ NOUVEAU: Sélecteur d'origine avec support option vide */}
              <Autocomplete
                size="small"
                value={pendingOrigin}
                onChange={(_, value) => onOriginChange(value || "")}
                options={availableOrigins}
                getOptionLabel={getOptionLabel} // ✅ Libellé personnalisé
                renderOption={renderOption} // ✅ Rendu personnalisé
                freeSolo
                sx={{ minWidth: 250 }} // ✅ Plus large pour "Aucune origine"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choisir une origine..."
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: "background.paper",
                      borderRadius: 1,
                    }}
                    // ✅ NOUVEAU: Affichage personnalisé dans le champ
                    value={pendingOrigin === "" ? "" : pendingOrigin}
                  />
                )}
                // ✅ NOUVEAU: Placeholder personnalisé selon la valeur
                inputValue={pendingOrigin === "" ? "" : pendingOrigin}
                onInputChange={(_, newInputValue) => {
                  onOriginChange(newInputValue);
                }}
              />

              {/* ✅ NOUVEAU: Actions de sauvegarde - permettre sauvegarde même si vide */}
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                size="small"
                onClick={() => onSave(pendingOrigin)}
                disabled={isProcessing} // ✅ Plus de vérification !pendingOrigin.trim()
                color="success"
                title={
                  pendingOrigin === ""
                    ? "Supprimer l'origine des appels sélectionnés"
                    : `Appliquer l'origine "${pendingOrigin}" aux appels sélectionnés`
                }
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

          {/* ✅ NOUVEAU: Indication de l'action en cours */}
          {isEditing && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {pendingOrigin === ""
                ? "⚠️ Supprimera l'origine"
                : `Appliquera: "${pendingOrigin}"`}
            </Typography>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export default BulkOriginEditBar;
