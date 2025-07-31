import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Typography,
  Checkbox,
  Popper,
  Paper,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Call } from "../types";

interface OriginEditableCellProps {
  call: Call;
  isSelected: boolean;
  isEditing: boolean;
  isProcessing: boolean;
  availableOrigins: string[];
  pendingOrigin: string;
  onSelect: (callId: string, selected: boolean) => void;
  onStartEdit: (callId: string) => void;
  onSave: (callId: string, origin: string) => Promise<void>;
  onCancel: () => void;
  onOriginChange: (origin: string) => void;
}

// 🚀 OPTIMISATION 1: Composant Popper custom léger
const CustomPopper = React.memo(({ children, ...props }: any) => (
  <Popper {...props} style={{ zIndex: 1300 }}>
    <Paper
      elevation={3}
      sx={{
        maxHeight: 200,
        overflow: "auto",
        "& .MuiAutocomplete-listbox": {
          padding: 0,
        },
      }}
    >
      {children}
    </Paper>
  </Popper>
));

CustomPopper.displayName = "CustomPopper";

// 🚀 OPTIMISATION 2: Sélecteur simple sans Autocomplete pour édition rapide
const SimpleOriginSelector: React.FC<{
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}> = React.memo(({ value, options, onChange, onSave, onCancel }) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 🚀 Filtrage optimisé
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options.slice(0, 5); // Limite à 5 pour performance

    const filtered = options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );

    return filtered.slice(0, 8); // Limite à 8 résultats max
  }, [inputValue, options]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setShowSuggestions(newValue.length > 0);
    },
    [onChange]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      onChange(suggestion);
      setShowSuggestions(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onSave();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel]
  );

  return (
    <Box sx={{ position: "relative", flexGrow: 1 }}>
      <TextField
        size="small"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Origine..."
        variant="outlined"
        autoFocus
        sx={{ width: "100%" }}
      />

      {/* 🚀 Suggestions custom légères */}
      {showSuggestions && filteredOptions.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 200,
            overflow: "auto",
            mt: 0.5,
          }}
        >
          {filteredOptions.map((option, index) => (
            <Box
              key={option}
              onMouseDown={() => handleSuggestionClick(option)}
              sx={{
                px: 2,
                py: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                fontSize: "0.875rem",
              }}
            >
              {option}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
});

SimpleOriginSelector.displayName = "SimpleOriginSelector";

// 🚀 OPTIMISATION 3: Composant principal optimisé
const OriginEditableCell: React.FC<OriginEditableCellProps> = React.memo(
  ({
    call,
    isSelected,
    isEditing,
    isProcessing,
    availableOrigins,
    pendingOrigin,
    onSelect,
    onStartEdit,
    onSave,
    onCancel,
    onOriginChange,
  }) => {
    // 🚀 OPTIMISATION 4: Callbacks mémoïsés
    const handleSelectChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelect(call.callid, event.target.checked);
      },
      [call.callid, onSelect]
    );

    const handleStartEditClick = useCallback(() => {
      onStartEdit(call.callid);
    }, [call.callid, onStartEdit]);

    const handleSaveClick = useCallback(() => {
      onSave(call.callid, pendingOrigin);
    }, [call.callid, pendingOrigin, onSave]);

    // 🚀 OPTIMISATION 5: Options limitées et mémoïsées
    const limitedOrigins = useMemo(() => {
      // Prioriser les origines fréquentes + celle actuelle
      const priorities = [
        "Personnel",
        "Professionnel",
        "Commercial",
        "Support",
      ];
      const currentOrigin = call.origine;

      const priorityOptions = priorities.filter((p) =>
        availableOrigins.includes(p)
      );
      const otherOptions = availableOrigins.filter(
        (o) => !priorities.includes(o)
      );

      const result = [
        ...(currentOrigin && !priorityOptions.includes(currentOrigin)
          ? [currentOrigin]
          : []),
        ...priorityOptions,
        ...otherOptions.slice(0, 10), // Limite autres options
      ];

      return Array.from(new Set(result)); // Dédoublonner
    }, [availableOrigins, call.origine]);

    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 250 }}
      >
        {/* 🚀 Checkbox optimisée */}
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={handleSelectChange}
          sx={{ p: 0.5 }}
        />

        {/* Affichage/Édition de l'origine */}
        {!isEditing ? (
          <>
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                fontWeight: call.origine ? "normal" : "italic",
                color: call.origine ? "text.primary" : "text.secondary",
                minWidth: 120,
              }}
            >
              {call.origine || "Non définie"}
            </Typography>
            <IconButton
              size="small"
              onClick={handleStartEditClick}
              sx={{
                opacity: 0.7,
                "&:hover": { opacity: 1 },
                visibility: "hidden",
                ".MuiTableRow-root:hover &": { visibility: "visible" },
              }}
              title="Modifier l'origine"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            {/* 🚀 SÉLECTEUR OPTIMISÉ: Simple au lieu d'Autocomplete */}
            <SimpleOriginSelector
              value={pendingOrigin}
              options={limitedOrigins}
              onChange={onOriginChange}
              onSave={handleSaveClick}
              onCancel={onCancel}
            />

            <IconButton
              size="small"
              onClick={handleSaveClick}
              disabled={isProcessing || !pendingOrigin.trim()}
              color="primary"
              title="Sauvegarder"
              sx={{ p: 0.5 }}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onCancel}
              color="inherit"
              title="Annuler"
              sx={{ p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    );
  }
);

OriginEditableCell.displayName = "OriginEditableCell";

export default OriginEditableCell;
