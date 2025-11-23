// 🧩 ATOM - AlgorithmDetailDialog
// shared/atoms/AlgorithmDetailDialog.tsx

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { AlgorithmDetail } from "../hooks/useAlgorithmDialog";

export interface AlgorithmDetailDialogProps {
  algorithm: AlgorithmDetail | null;
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ElementType;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

export const AlgorithmDetailDialog: React.FC<AlgorithmDetailDialogProps> = ({
  algorithm,
  isOpen,
  onClose,
  icon: Icon,
  color = "primary",
}) => {
  const theme = useTheme();

  if (!algorithm) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {Icon && <Icon color={color} />}
          <Typography variant="h6" fontWeight="bold">
            {algorithm.name} - Détails de l'Algorithme
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            📋 Description
          </Typography>
          <Typography variant="body2" paragraph>
            {algorithm.description}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            🔬 Principe Théorique
          </Typography>
          <Typography variant="body2" paragraph>
            {algorithm.principle}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            📚 Référence Scientifique
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <Typography variant="body2" fontStyle="italic">
              {algorithm.source}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color={color}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlgorithmDetailDialog;
