// BulkActionsToolbar.tsx
import { memo, FC } from "react";
import {
  Box,
  Button,
  Typography,
  Toolbar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkOrigineChange: (origine: string) => void;
  bulkOrigineValue: string;
  uniqueOrigines: string[];
  isBulkProcessing: boolean;
}

const BulkActionsToolbar: FC<BulkActionsToolbarProps> = memo(
  ({
    selectedCount,
    onSelectAll,
    onClearSelection,
    onBulkDelete,
    onBulkOrigineChange,
    bulkOrigineValue,
    uniqueOrigines,
    isBulkProcessing,
  }) => {
    if (selectedCount === 0) return null;

    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: "primary.light",
          color: "primary.contrastText",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {selectedCount} appel{selectedCount > 1 ? "s" : ""} sélectionné
          {selectedCount > 1 ? "s" : ""}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Sélection d'origine en lot */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "inherit" }}>Nouvelle origine</InputLabel>
            <Select
              value={bulkOrigineValue}
              onChange={(e) => onBulkOrigineChange(e.target.value)}
              disabled={isBulkProcessing}
              sx={{ color: "inherit" }}
            >
              <MenuItem value="">
                <em>Choisir une origine</em>
              </MenuItem>
              {uniqueOrigines.map((origine) => (
                <MenuItem key={origine} value={origine}>
                  {origine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Sélectionner tout">
            <IconButton
              color="inherit"
              onClick={onSelectAll}
              disabled={isBulkProcessing}
            >
              <SelectAllIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Tout désélectionner">
            <IconButton
              color="inherit"
              onClick={onClearSelection}
              disabled={isBulkProcessing}
            >
              <ClearAllIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Supprimer la sélection">
            <IconButton
              color="inherit"
              onClick={onBulkDelete}
              disabled={isBulkProcessing}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    );
  }
);

BulkActionsToolbar.displayName = "BulkActionsToolbar";

export default BulkActionsToolbar;
