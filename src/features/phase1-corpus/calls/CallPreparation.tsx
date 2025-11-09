"use client";

import { useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import CallListUnprepared from "../CallListUnprepared";
import { useCallPreparation } from "@/features/phase1-corpus/calls/ui/hooks/useCallPreparation";
import SnackbarManager from "../SnackBarManager";

// (optionnel) type minimal local si besoin
interface SnackbarMessage {
  message: string;
  key: number;
}

export default function CallPreparation() {
  const { prepareCall, isPreparing } = useCallPreparation();

  // Petit gestionnaire de messages pour satisfaire CallListUnpreparedProps
  const [snackPack, setSnackPack] = useState<SnackbarMessage[]>([]);
  const showMessage = (message: string) => {
    setSnackPack((prev) => [...prev, { message, key: Date.now() }]);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Préparation des appels pour le tagging
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Sélectionne un appel transcrit et lance la préparation.
        </Typography>
      </Box>

      <CallListUnprepared
        onPrepareCall={async (params: any) => {
          // 🔒 extraction robuste de l'ID
          const callId =
            params?.callid ?? params?.callId ?? params?.id ?? params;
          if (!callId) {
            showMessage("callId manquant");
            return;
          }
          try {
            await prepareCall(callId);
            showMessage("Appel préparé pour le tagging.");
          } catch (e) {
            console.error(e);
            showMessage("Erreur lors de la préparation de l'appel.");
          }
        }}
        showMessage={showMessage}
      />

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" disabled={isPreparing}>
          {isPreparing ? "Préparation..." : "Prêt"}
        </Button>
      </Box>

      <SnackbarManager snackPack={snackPack} setSnackPack={setSnackPack} />
    </Paper>
  );
}
