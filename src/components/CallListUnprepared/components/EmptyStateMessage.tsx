// components/EmptyStateMessage.tsx
import React from "react";
import { Paper, Typography } from "@mui/material";

interface EmptyStateMessageProps {
  hasAnyCalls: boolean;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({
  hasAnyCalls,
}) => {
  return (
    <Paper sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="body1" color="textSecondary">
        Aucun appel ne correspond aux filtres sélectionnés.
      </Typography>
      {!hasAnyCalls && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Aucun appel de tagging trouvé. Importez d'abord des appels depuis
          l'onglet "Import d'appels".
        </Typography>
      )}
    </Paper>
  );
};

export default EmptyStateMessage;
