// components/AuthPrompt.tsx
import React from "react";
import { Box, Alert, Button } from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";
import { handleZohoAuth } from "../utils/authHelpers";

export const AuthPrompt: React.FC = () => {
  return (
    <Box sx={{ textAlign: "center", p: 4 }}>
      <Alert severity="warning" sx={{ mb: 3 }}>
        Vous n'êtes pas connecté à Zoho WorkDrive. Veuillez vous connecter pour
        accéder à vos fichiers.
      </Alert>

      <Button
        variant="contained"
        color="primary"
        startIcon={<LoginIcon />}
        onClick={handleZohoAuth}
        size="large"
      >
        Se connecter à Zoho WorkDrive
      </Button>
    </Box>
  );
};
