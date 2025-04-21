"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
} from "@mui/material";
import { useTaggingData } from "@/context/TaggingDataContext";
import TranscriptLPL from "@/components/TranscriptLPL";
import { useRouter } from "next/navigation";
import { generateSignedUrl } from "@/components/utils/signedUrls";

export default function NewTaggingPage() {
  const router = useRouter();
  const {
    taggingCalls,
    selectedTaggingCall,
    selectTaggingCall,
    fetchTaggingTranscription,
  } = useTaggingData();
  const [selectedCallId, setSelectedCallId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mettre à jour le selectedCallId lorsque selectedTaggingCall change
  useEffect(() => {
    if (selectedTaggingCall) {
      setSelectedCallId(selectedTaggingCall.callid);
    }
  }, [selectedTaggingCall]);

  const handleCallChange = async (event) => {
    const callId = event.target.value;
    setSelectedCallId(callId);
    setIsLoading(true);

    try {
      // Trouver l'appel correspondant
      const selectedCall = taggingCalls.find((call) => call.callid === callId);

      if (selectedCall) {
        // Vérifier si l'appel a un fichier audio téléchargé
        if (!selectedCall.upload) {
          // Si pas d'audio téléchargé, sélectionner l'appel sans URL audio
          selectTaggingCall({
            ...selectedCall,
            audiourl: "",
            is_tagging_call: true,
            preparedfortranscript: false,
          });
          console.log("Appel sans audio chargé.");
        } else if (selectedCall.filepath) {
          // Générer une URL signée pour l'audio
          console.log("Génération de l'URL signée pour", selectedCall.filepath);
          const audioUrl = await generateSignedUrl(selectedCall.filepath);

          // Sélectionner l'appel avec l'URL audio
          selectTaggingCall({
            ...selectedCall,
            audiourl: audioUrl,
            is_tagging_call: true,
            preparedfortranscript: false,
          });

          // Récupérer la transcription
          await fetchTaggingTranscription(selectedCall.callid);
          console.log("Audio et transcription chargés avec succès");
        } else {
          console.error("L'appel a upload=true mais pas de filepath");
          selectTaggingCall({
            ...selectedCall,
            audiourl: "",
            is_tagging_call: true,
            preparedfortranscript: false,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'appel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToOldVersion = () => {
    router.push("/tagging");
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tagging (Nouvelle Version)
      </Typography>

      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={switchToOldVersion}>
            Version classique
          </Button>
        }
      >
        Vous utilisez la nouvelle interface de tagging. Vous pouvez revenir à
        l'ancienne version à tout moment.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="call-select-label">
                  Sélectionner un appel
                </InputLabel>
                <Select
                  labelId="call-select-label"
                  id="call-select"
                  value={selectedCallId}
                  onChange={handleCallChange}
                  label="Sélectionner un appel"
                  disabled={isLoading}
                >
                  <MenuItem value="">
                    <em>Choisir un appel</em>
                  </MenuItem>
                  {taggingCalls.map((call) => (
                    <MenuItem key={call.callid} value={call.callid}>
                      {call.filename || call.description || call.callid}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!taggingCalls.length && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                    Aucun appel disponible pour le tagging.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1 }}
                    href="/calls"
                  >
                    Importer des appels
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          {selectedTaggingCall ? (
            <TranscriptLPL
              callId={selectedTaggingCall.callid}
              audioSrc={selectedTaggingCall.audiourl}
            />
          ) : (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  Sélectionnez un appel pour commencer le tagging
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
