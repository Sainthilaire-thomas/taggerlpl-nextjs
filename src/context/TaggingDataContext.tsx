"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";

import { useSupabase } from "./SupabaseContext";

// Define types for your data models
interface Tag {
  id: number;
  tag: string;
  color: string;
  [key: string]: any; // For any additional properties
}

interface TaggingCall {
  callid: string;
  is_tagging_call: boolean;
  preparedfortranscript: boolean;
  audiourl: string;
  [key: string]: any; // For any additional properties
}

interface Word {
  id: number;
  transcriptid: string;
  word: string;
  startTime: number;
  endTime: number;
  speaker: string;
  [key: string]: any; // For any additional properties
}

interface Postit {
  id: number;
  callid: string;
  content: string;
  [key: string]: any; // For any additional properties
}

interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  next_turn_verbatim: string;
  color: string;
  lpltag?: {
    color: string;
  };
  [key: string]: any; // For any additional properties
}

interface NewTag {
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  next_turn_verbatim?: string;
  [key: string]: any; // For any additional properties
}

// Define the shape of your context
interface TaggingDataContextType {
  taggingCalls: TaggingCall[];
  setTaggingCalls: React.Dispatch<React.SetStateAction<TaggingCall[]>>;
  selectedTaggingCall: TaggingCall | null;
  selectTaggingCall: (call: TaggingCall) => void;
  callId: string | undefined;
  taggingTranscription: Word[];
  fetchTaggingTranscription: (callId: string) => Promise<void>;
  taggingPostits: Postit[];
  audioSrc: string | null;
  setAudioSrc: React.Dispatch<React.SetStateAction<string | null>>;
  playerRef: React.RefObject<HTMLAudioElement>;
  playAudioAtTimestamp: (timestamp: number) => void;
  updateCurrentWord: (word: Word | null) => void;
  currentWord: Word | null;
  taggedTurns: TaggedTurn[];
  fetchTaggedTurns: (callId: string) => Promise<void>;
  addTag: (newTag: NewTag) => Promise<TaggedTurn | null>;
  deleteTurnTag: (id: number) => Promise<void>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

// Create the context with a default undefined value, but cast as our type
const TaggingDataContext = createContext<TaggingDataContextType | undefined>(
  undefined
);

// Custom hook to use the tagging data context
export const useTaggingData = (): TaggingDataContextType => {
  const context = useContext(TaggingDataContext);
  if (context === undefined) {
    throw new Error("useTaggingData must be used within a TaggingDataProvider");
  }
  return context;
};

interface TaggingDataProviderProps {
  children: ReactNode;
}

export const TaggingDataProvider: React.FC<TaggingDataProviderProps> = ({
  children,
}) => {
  const { supabase } = useSupabase();
  const [taggingCalls, setTaggingCalls] = useState<TaggingCall[]>([]);
  const [selectedTaggingCall, setSelectedTaggingCall] =
    useState<TaggingCall | null>(null);
  const [taggingTranscription, setTaggingTranscription] = useState<Word[]>([]);
  const [taggingPostits, setTaggingPostits] = useState<Postit[]>([]);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const playerRef = useRef<HTMLAudioElement>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [taggedTurns, setTaggedTurns] = useState<TaggedTurn[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const updateCurrentWord = (word: Word | null): void => {
    setCurrentWord(word);
    console.log("Current word updated:", word);
  };

  useEffect(() => {
    // Fetch les tags une seule fois au chargement
    const fetchTags = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from("lpltag").select("*");
        if (error) {
          console.error("Erreur de récupération des tags :", error.message);
        } else {
          setTags(data || []);
        }
      } catch (err) {
        console.error("Erreur inattendue :", (err as Error).message);
      }
    };

    fetchTags();
  }, [supabase]); // Exécuté une seule fois au montage

  // Fetch des appels de tagging depuis Supabase
  const fetchTaggingCalls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("call")
        .select("*")
        .eq("is_tagging_call", true)
        .eq("preparedfortranscript", true);

      if (error) {
        console.error("Erreur lors du fetch des appels de tagging :", error);
      } else {
        console.log("Appels récupérés :", data);
        setTaggingCalls(data || []);
      }
    } catch (err) {
      console.error(
        "Erreur inattendue lors du fetch des appels de tagging :",
        err.message
      );
    }
  }, [supabase]);

  // Fetch des transcriptions pour un appel spécifique
  const fetchTaggingTranscription = useCallback(
    async (callId: string): Promise<void> => {
      try {
        // Étape 1 : Obtenir le transcriptid à partir du callid
        const { data: transcriptData, error: transcriptError } = await supabase
          .from("transcript")
          .select("transcriptid")
          .eq("callid", callId)
          .single();

        if (transcriptError) {
          console.error(
            "Erreur lors du fetch du transcriptid :",
            transcriptError
          );
          setTaggingTranscription([]);
          return;
        }

        const transcriptId = transcriptData?.transcriptid;

        if (!transcriptId) {
          console.warn("Aucun transcriptid trouvé pour callid :", callId);
          setTaggingTranscription([]);
          return;
        }

        // Étape 2 : Obtenir les mots associés au transcriptid
        const { data: wordsData, error: wordsError } = await supabase
          .from("word")
          .select("*")
          .eq("transcriptid", transcriptId)
          .order("startTime", { ascending: true });

        if (wordsError) {
          console.error("Erreur lors du fetch des words :", wordsError);
          setTaggingTranscription([]);
          return;
        }

        // Met à jour le contexte avec les mots récupérés
        setTaggingTranscription(wordsData || []);
        console.log("Words récupérés :", wordsData);
      } catch (err) {
        console.error(
          "Erreur inattendue lors du fetchTaggingTranscription :",
          err
        );
        setTaggingTranscription([]);
      }
    },
    [supabase]
  );

  // Fetch des post-its liés à un appel
  const fetchTaggingPostits = useCallback(
    async (callId: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from("postit")
          .select("*")
          .eq("callid", callId);
        if (error) {
          console.error("Erreur lors du fetch des post-its :", error);
        } else {
          setTaggingPostits(data || []);
        }
      } catch (err) {
        console.error(
          "Erreur inattendue lors du fetch des post-its :",
          (err as Error).message
        );
      }
    },
    [supabase]
  );

  // Sélectionner un appel pour le tagging
  // Accès direct au callId
  const callId = selectedTaggingCall?.callid;

  const selectTaggingCall = useCallback(
    (call: TaggingCall): void => {
      setSelectedTaggingCall(call);
      if (call?.callid) {
        fetchTaggingTranscription(call.callid);
        fetchTaggingPostits(call.callid);
        setAudioSrc(call.audiourl);
      }
    },
    [fetchTaggingTranscription, fetchTaggingPostits]
  );

  // Fonction pour jouer l'audio à un timestamp donné
  const playAudioAtTimestamp = (timestamp: number): void => {
    if (audioSrc && playerRef.current) {
      playerRef.current.currentTime = timestamp;
      playerRef.current.play();
    }
  };

  // Hook pour charger automatiquement les appels au montage
  useEffect(() => {
    fetchTaggingCalls();
  }, [fetchTaggingCalls]);

  // Fonction pour récupérer les tags
  const fetchTaggedTurns = useCallback(
    async (callId: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from("turntagged")
          .select(
            `
              id,
              call_id,
              start_time,
              end_time,
              tag,
              next_turn_verbatim, 
              lpltag(color)
            `
          )
          .eq("call_id", callId);

        if (error) {
          console.error("Erreur lors du fetch des tags :", error);
        } else {
          const enrichedTags = data.map((tag) => ({
            ...tag,
            color: tag.lpltag?.color || "transparent",
          }));

          setTaggedTurns(enrichedTags);
          console.log("Tags enrichis :", enrichedTags);
        }
      } catch (err) {
        console.error(
          "Erreur inattendue lors du fetch des tags :",
          (err as Error).message
        );
      }
    },
    [supabase]
  );

  // Fonction pour ajouter un tag
  const addTag = useCallback(
    async (newTag: NewTag): Promise<TaggedTurn | null> => {
      try {
        // Insérer directement le tag dans Supabase
        const { data: insertedData, error: insertError } = await supabase
          .from("turntagged")
          .insert([newTag]).select(`
              id,
              call_id,
              start_time,
              end_time,
              tag,
              next_turn_verbatim,
              lpltag(color)
            `);

        if (insertError) {
          console.error("Erreur lors de l'ajout du tag :", insertError);
          return null;
        }

        if (insertedData && insertedData.length > 0) {
          const enrichedTag = {
            ...insertedData[0],
            color: insertedData[0].lpltag?.color || "transparent",
          };

          setTaggedTurns((prev) => [...prev, enrichedTag]);
          return enrichedTag;
        }
      } catch (err) {
        console.error(
          "Erreur inattendue lors de l'ajout du tag :",
          (err as Error).message
        );
      }
      return null;
    },
    [supabase]
  );

  const deleteTurnTag = useCallback(
    async (id: number): Promise<void> => {
      try {
        const { error } = await supabase
          .from("turntagged")
          .delete()
          .eq("id", id);
        if (error) {
          console.error(
            "Erreur lors de la suppression du tag :",
            error.message
          );
        } else {
          setTaggedTurns((prevTags) => prevTags.filter((tag) => tag.id !== id));
          console.log("Tag supprimé avec succès :", id);
        }
      } catch (err) {
        console.error(
          "Erreur inattendue lors de la suppression du tag :",
          (err as Error).message
        );
      }
    },
    [supabase]
  );

  return (
    <TaggingDataContext.Provider
      value={{
        taggingCalls,
        setTaggingCalls,
        selectedTaggingCall,
        selectTaggingCall,
        callId,
        taggingTranscription,
        fetchTaggingTranscription,
        taggingPostits,
        audioSrc,
        setAudioSrc,
        playerRef,
        playAudioAtTimestamp,
        updateCurrentWord,
        currentWord,
        taggedTurns,
        fetchTaggedTurns,
        addTag,
        deleteTurnTag,
        tags,
        setTags,
      }}
    >
      {children}
    </TaggingDataContext.Provider>
  );
};
