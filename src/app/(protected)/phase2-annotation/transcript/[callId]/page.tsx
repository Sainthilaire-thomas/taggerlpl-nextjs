"use client";

import TranscriptLPL from "@/features/phase2-annotation/transcript";
import { Box, Button, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTaggingData } from "@/features/shared/context";
import { useEffect, use, useState } from "react";
import { generateSignedUrl } from "@/features/phase2-annotation/shared/utils/signedUrls";

interface TaggerPageProps {
  params: Promise<{
    callId: string;
  }>;
}

export default function TaggerPage({ params }: TaggerPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { selectedTaggingCall, selectTaggingCall, taggingCalls, fetchTaggingTranscription } = useTaggingData();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Charger l'appel et son audio
  useEffect(() => {
    // Ne charger qu'une seule fois
    if (hasLoaded) {
      setIsLoading(false);
      return;
    }

    const loadCall = async () => {
      setIsLoading(true);
      try {
        const call = taggingCalls.find(c => String(c.callid) === String(resolvedParams.callId));
        
        if (call) {
          // Générer l'URL audio signée si nécessaire
          let audioUrl = "";
          if (call.upload && call.filepath) {
            audioUrl = await generateSignedUrl(call.filepath);
          }

          // Sélectionner l'appel avec son URL audio
          selectTaggingCall({
            ...call,
            audiourl: audioUrl,
            is_tagging_call: true,
            preparedfortranscript: !!call.preparedfortranscript,
          });

          // Charger la transcription
          await fetchTaggingTranscription(call.callid);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'appel:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Charger seulement si l'appel n'est pas déjà le bon
    if (!selectedTaggingCall || selectedTaggingCall.callid !== resolvedParams.callId) {
      loadCall();
    } else {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [resolvedParams.callId, selectedTaggingCall, taggingCalls, hasLoaded]); // ✅ Retiré selectTaggingCall et fetchTaggingTranscription

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/phase2-annotation/transcript")}
          variant="outlined"
        >
          Retour à la liste
        </Button>
      </Box>
      <TranscriptLPL 
        callId={resolvedParams.callId} 
        audioSrc={selectedTaggingCall?.audiourl || ""} 
      />
    </Box>
  );
}
