"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
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
import { useRouter, useSearchParams } from "next/navigation"; // ✅ ajoute useSearchParams
import { generateSignedUrl } from "@/components/utils/signedUrls";

export default function NewTaggingPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅
  const {
    taggingCalls,
    selectedTaggingCall,
    selectTaggingCall,
    fetchTaggingTranscription,
  } = useTaggingData();

  const [selectedCallId, setSelectedCallId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ DRY: logique de sélection factorisée (réutilisée par l’URL et le Select)
  const selectById = useCallback(
    async (callId: string) => {
      if (!callId) return;
      setSelectedCallId(callId);
      setIsLoading(true);
      try {
        const selectedCall = taggingCalls.find(
          (c) => String(c.callid) === String(callId)
        );
        if (!selectedCall) {
          console.warn(
            "[NewTagging] callId dans l’URL introuvable dans taggingCalls:",
            callId
          );
          return;
        }

        if (!selectedCall.upload) {
          // pas d'audio -> on sélectionne quand même
          selectTaggingCall({
            ...selectedCall,
            audiourl: "",
            is_tagging_call: true,
            preparedfortranscript: !!selectedCall.preparedfortranscript,
          });
        } else if (selectedCall.filepath) {
          const audioUrl = await generateSignedUrl(selectedCall.filepath);
          selectTaggingCall({
            ...selectedCall,
            audiourl: audioUrl,
            is_tagging_call: true,
            preparedfortranscript: !!selectedCall.preparedfortranscript,
          });
          await fetchTaggingTranscription(selectedCall.callid);
        } else {
          // upload=true mais pas de filepath
          selectTaggingCall({
            ...selectedCall,
            audiourl: "",
            is_tagging_call: true,
            preparedfortranscript: !!selectedCall.preparedfortranscript,
          });
        }
      } catch (e) {
        console.error("[NewTagging] Erreur selectById:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [taggingCalls, selectTaggingCall, fetchTaggingTranscription]
  );

  // ✅ si un call est déjà en contexte, on aligne l’UI locale
  useEffect(() => {
    if (selectedTaggingCall) {
      setSelectedCallId(selectedTaggingCall.callid);
    }
  }, [selectedTaggingCall]);

  // ✅ lecture du paramètre d’URL et sélection auto
  useEffect(() => {
    const qid = searchParams.get("callId") || searchParams.get("callid"); // tolère callid/callId
    if (!qid) return;

    // si la liste n’est pas encore chargée, on attend
    if (!taggingCalls.length) return;

    // si déjà le bon call sélectionné, on ne refait rien
    if (
      selectedTaggingCall?.callid &&
      String(selectedTaggingCall.callid) === String(qid)
    ) {
      return;
    }

    void selectById(qid);
  }, [searchParams, taggingCalls, selectedTaggingCall, selectById]);

  const handleCallChange = async (event: any) => {
    const callId = event.target.value as string;
    await selectById(callId);
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
        l&apos;ancienne version à tout moment.
      </Alert>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

        <Box>
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
        </Box>
      </Box>
    </Box>
  );
}
