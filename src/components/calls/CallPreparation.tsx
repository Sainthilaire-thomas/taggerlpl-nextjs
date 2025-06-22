"use client";

import { FC, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import CallListUnprepared from "../CallListUnprepared";
import { prepareCallForTagging } from "../utils/callApiUtils";

// ✅ Types importés des vrais fichiers
interface Call {
  callid: string;
  audiourl?: string | null;
  transcription?: any | null;
  [key: string]: any;
}

interface CallPreparationProps {
  showMessage: (message: string) => void;
}

const CallPreparation: FC<CallPreparationProps> = ({ showMessage }) => {
  // État pour suivre si des appels ont été préparés
  const [callsBeingPrepared, setCallsBeingPrepared] = useState<boolean>(false);

  // ✅ Le gestionnaire correspond exactement au type attendu par CallListUnprepared
  const handlePrepareCall = async (params: {
    call: Call;
    showMessage: (message: string) => void;
  }) => {
    console.log("CallPreparation - handlePrepareCall appelé avec:", params);
    setCallsBeingPrepared(true);

    try {
      // ✅ Passer directement les paramètres à prepareCallForTagging
      await prepareCallForTagging(params);

      // Marquer l'opération comme terminée
      setCallsBeingPrepared(false);
    } catch (error) {
      // ✅ Gestion correcte du type unknown dans catch
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de la préparation";
      console.error("Erreur lors de la préparation de l'appel:", error);
      params.showMessage(`Erreur: ${errorMessage}`);
      setCallsBeingPrepared(false);
    }
  };

  return (
    <Box>
      <Typography variant="body1" paragraph>
        Cette section vous permet de préparer des appels transcrits pour le
        tagging manuel. Les appels non préparés sont ceux qui ont été transcrits
        mais pas encore mis à disposition pour le tagging.
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Instructions
        </Typography>
        <Typography variant="body2" paragraph>
          1. Parcourez la liste des appels transcrits ci-dessous
        </Typography>
        <Typography variant="body2" paragraph>
          2. Cliquez sur "Voir JSONB" pour examiner la transcription de l'appel
        </Typography>
        <Typography variant="body2" paragraph>
          3. Pour préparer un appel au tagging, cliquez sur "Préparer pour le
          tagging" puis associez un fichier audio à l'appel lorsque vous y êtes
          invité
        </Typography>
        <Typography variant="body2">
          4. Une fois préparé, l'appel sera disponible dans l'onglet "Liste des
          appels"
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Liste des appels transcrits disponibles
      </Typography>

      {/* On utilise le composant CallListUnprepared existant */}
      <CallListUnprepared
        onPrepareCall={handlePrepareCall}
        showMessage={showMessage}
      />
    </Box>
  );
};

export default CallPreparation;
