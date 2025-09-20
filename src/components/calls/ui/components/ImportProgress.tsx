// src/components/calls/ui/components/ImportProgress.tsx

import React from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  useTheme,
  alpha,
} from "@mui/material";
import { CloudUpload, CheckCircle, Error } from "@mui/icons-material";

interface ImportProgressProps {
  progress: number; // 0-100
  isActive: boolean;
  message?: string;
  error?: string;
}

/**
 * Composant de progression d'import avec feedback visuel
 */
export const ImportProgress: React.FC<ImportProgressProps> = ({
  progress,
  isActive,
  message,
  error,
}) => {
  const theme = useTheme();

  const getStatusIcon = () => {
    if (error) {
      return <Error color="error" />;
    }
    if (progress >= 100) {
      return <CheckCircle color="success" />;
    }
    return <CloudUpload color="primary" />;
  };

  const getStatusColor = () => {
    if (error) return "error";
    if (progress >= 100) return "success";
    return "primary";
  };

  const getStatusMessage = () => {
    if (error) return `Erreur: ${error}`;
    if (progress >= 100) return "Import terminé avec succès !";
    if (message) return message;
    if (isActive) {
      if (progress < 25) return "Validation des données...";
      if (progress < 50) return "Vérification des doublons...";
      if (progress < 75) return "Upload du fichier audio...";
      if (progress < 100) return "Finalisation de l'import...";
    }
    return "En attente...";
  };

  if (!isActive && progress === 0 && !error) {
    return null; // Ne rien afficher si pas actif
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: theme.palette[getStatusColor()].main,
        backgroundColor: alpha(theme.palette[getStatusColor()].main, 0.05),
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStatusIcon()}
          <Box flex={1}>
            <Typography variant="h6" color={getStatusColor()}>
              Import en cours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getStatusMessage()}
            </Typography>
          </Box>
          <Typography variant="h6" color={getStatusColor()}>
            {Math.round(progress)}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          color={getStatusColor()}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(theme.palette[getStatusColor()].main, 0.2),
          }}
        />

        {/* Étapes détaillées */}
        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography
              variant="caption"
              color={progress > 0 ? "success.main" : "text.secondary"}
            >
              Validation
            </Typography>
            <Typography
              variant="caption"
              color={progress > 25 ? "success.main" : "text.secondary"}
            >
              Doublons
            </Typography>
            <Typography
              variant="caption"
              color={progress > 50 ? "success.main" : "text.secondary"}
            >
              Upload
            </Typography>
            <Typography
              variant="caption"
              color={progress >= 100 ? "success.main" : "text.secondary"}
            >
              Terminé
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
