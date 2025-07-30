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
export interface Tag {
  id?: number;
  label: string; // ✅ Correspond à votre DB lpltag.label
  color?: string;
  description?: string;
  family?: string;
  callCount?: number;
  turnCount?: number;
  [key: string]: any;
}

export interface TaggingCall {
  callid: string;
  is_tagging_call: boolean;
  preparedfortranscript: boolean;
  audiourl: string;
  [key: string]: any;
}

export interface Word {
  id: number;
  transcriptid: string;
  word: string;
  text: string; // ✅ Ajout de cette propriété (alias de word)
  startTime: number;
  endTime: number;
  speaker: string;
  turn: string; // ✅ Ajout de cette propriété manquante
  index?: number; // ✅ Ajout de cette propriété optionnelle
  [key: string]: any;
}

export interface Postit {
  id: number;
  callid: string;
  content: string;
  [key: string]: any;
}

export interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string; // ✅ Ajout du champ
  speaker: string; // ✅ Ajout du champ
  color: string;
  [key: string]: any;
}

export interface NewTag {
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string; // ✅ Ajout obligatoire
  next_turn_verbatim?: string;
  speaker: string; // ✅ Ajout obligatoire
  next_turn_tag?: string; // ✅ Ajout optionnel
  [key: string]: any;
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
  playerRef: React.RefObject<HTMLAudioElement | null>;
  playAudioAtTimestamp: (timestamp: number) => void;
  updateCurrentWord: (word: Word | null) => void;
  currentWord: Word | null;
  taggedTurns: TaggedTurn[];
  fetchTaggedTurns: (callId: string) => Promise<void>;
  addTag: (newTag: NewTag) => Promise<TaggedTurn | null>;
  deleteTurnTag: (id: number) => Promise<void>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  calculateAllNextTurnTags: (callId: string) => Promise<number>;
  refreshTaggingCalls?: () => Promise<void>;
  fetchTaggingCalls: () => Promise<void>;
}

// Create the context with a default undefined value
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
  // Destructurer directement le hook useSupabase
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

  const mapWordToTranscriptWord = (word: any): Word => {
    console.log("Mappage du mot:", word); // Debug log

    return {
      ...word, // Garder toutes les propriétés originales
      text: word.text || word.word || "", // Utiliser text si disponible, sinon word
      turn: word.turn || word.speaker || "Inconnu", // Utiliser turn si disponible, sinon speaker
      word: word.word || word.text || "", // Assurer que word existe
      speaker: word.speaker || word.turn || "Inconnu", // Assurer que speaker existe
      startTime: word.startTime || 0,
      endTime: word.endTime || 0,
      // Conserver l'index s'il existe
      index: word.index,
    };
  };

  useEffect(() => {
    // Vérifier que supabase est disponible
    if (!supabase) {
      console.warn("Supabase client not available yet");
      return;
    }

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
        console.error(
          "Erreur inattendue :",
          err instanceof Error ? err.message : String(err)
        );
      }
    };

    fetchTags();
  }, [supabase]);

  // Fetch des appels de tagging depuis Supabase
  const fetchTaggingCalls = useCallback(async () => {
    if (!supabase) {
      console.warn("Supabase not available");
      return;
    }

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
        err instanceof Error ? err.message : String(err)
      );
    }
  }, [supabase]);

  // Dans TaggingDataContext.tsx, ajoutez cette fonction
  const refreshTaggingCalls = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("call")
        .select("*")
        .eq("is_tagging_call", true)
        .eq("preparedfortranscript", true);

      if (error) {
        console.error("Erreur lors du refresh des appels:", error);
      } else {
        setTaggingCalls(data || []);
      }
    } catch (err) {
      console.error("Erreur inattendue lors du refresh:", err);
    }
  }, [supabase]);

  // Fetch des transcriptions pour un appel spécifique
  const fetchTaggingTranscription = useCallback(
    async (callId: string): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

      try {
        console.log("🔍 Début fetchTaggingTranscription pour callId:", callId);

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
        console.log("📄 TranscriptId trouvé:", transcriptId);

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

        console.log("📝 Données words brutes récupérées:", wordsData);
        console.log("📊 Nombre de mots récupérés:", wordsData?.length || 0);

        if (!wordsData || wordsData.length === 0) {
          console.warn("Aucun mot trouvé pour transcriptId:", transcriptId);
          setTaggingTranscription([]);
          return;
        }

        // ✅ Mappez les données pour inclure les propriétés manquantes
        const mappedWords = wordsData.map(mapWordToTranscriptWord);
        console.log("🔄 Mots après mappage:", mappedWords.slice(0, 3)); // Log des 3 premiers pour debug

        setTaggingTranscription(mappedWords);
        console.log(
          "✅ TaggingTranscription mis à jour avec",
          mappedWords.length,
          "mots"
        );
      } catch (err) {
        console.error(
          "Erreur inattendue lors du fetchTaggingTranscription :",
          err instanceof Error ? err.message : String(err)
        );
        setTaggingTranscription([]);
      }
    },
    [supabase]
  );

  // Fetch des post-its liés à un appel
  const fetchTaggingPostits = useCallback(
    async (callId: string): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

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
          err instanceof Error ? err.message : String(err)
        );
      }
    },
    [supabase]
  );

  // Sélectionner un appel pour le tagging
  const callId = selectedTaggingCall?.callid;

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
  // Fonction fetchTaggedTurns simplifiée dans TaggingDataContext.tsx

  const fetchTaggedTurns = useCallback(
    async (callId: string): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

      try {
        console.log("=== FETCH TAGGED TURNS ===");
        console.log("Call ID:", callId);

        // Récupérer tous les tags avec leurs couleurs en une seule requête
        const { data: enrichedTags, error } = await supabase
          .from("turntagged")
          .select(
            `
          *,
          lpltag:tag (color)
        `
          )
          .eq("call_id", callId)
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Erreur fetch tags:", error);
          throw error;
        }

        // Traiter les données pour avoir la structure attendue
        const processedTags: TaggedTurn[] = (enrichedTags || []).map(
          (tag: any) => ({
            ...tag,
            color: tag.lpltag?.color || "#gray",
            verbatim: tag.verbatim || "",
          })
        );

        console.log(`✅ ${processedTags.length} tags récupérés`);

        // Mise à jour de l'état en une seule fois
        setTaggedTurns(processedTags);
      } catch (err) {
        console.error("Erreur dans fetchTaggedTurns:", err);
        setTaggedTurns([]); // État par défaut en cas d'erreur
      }
    },
    [supabase]
  );

  // Dans TaggingDataContext.tsx - Remplacer la fonction selectTaggingCall

  const selectTaggingCall = useCallback(
    (call: TaggingCall): void => {
      console.log("=== SELECT TAGGING CALL ===");
      console.log("Call selected:", call.callid);

      setSelectedTaggingCall(call);

      if (call?.callid) {
        // ✅ Charger TOUTES les données nécessaires en parallèle
        Promise.all([
          fetchTaggingTranscription(call.callid),
          fetchTaggedTurns(call.callid), // ✅ AJOUT CRUCIAL
          fetchTaggingPostits(call.callid),
        ])
          .then(() => {
            console.log(
              "✅ Toutes les données chargées pour l'appel",
              call.callid
            );
          })
          .catch((error) => {
            console.error("❌ Erreur lors du chargement des données:", error);
          });

        setAudioSrc(call.audiourl);
      }
    },
    [fetchTaggingTranscription, fetchTaggedTurns, fetchTaggingPostits] // ✅ Ajouter fetchTaggedTurns aux dépendances
  );
  // Fonction pour ajouter un tag
  // Fonction addTag robuste dans TaggingDataContext.tsx

  const addTag = useCallback(
    async (newTag: NewTag): Promise<TaggedTurn | null> => {
      if (!supabase) return null;

      try {
        console.log("=== ADD TAG OPTIMISÉ ===");

        // Vérifier doublons
        const { data: existingTags, error: checkError } = await supabase
          .from("turntagged")
          .select("*")
          .eq("call_id", newTag.call_id)
          .eq("speaker", newTag.speaker)
          .gte("start_time", newTag.start_time - 0.1)
          .lte("end_time", newTag.end_time + 0.1);

        if (checkError) throw checkError;

        let result: TaggedTurn;

        if (existingTags && existingTags.length > 0) {
          // Mise à jour
          const existingTag = existingTags[0];
          const { data: updatedData, error: updateError } = await supabase
            .from("turntagged")
            .update({
              tag: newTag.tag,
              verbatim: newTag.verbatim,
              next_turn_verbatim: newTag.next_turn_verbatim,
            })
            .eq("id", existingTag.id)
            .select("*")
            .single();

          if (updateError) throw updateError;
          result = updatedData;
          console.log("✅ Tag mis à jour:", result.id);
        } else {
          // Création
          const { data: insertedData, error: insertError } = await supabase
            .from("turntagged")
            .insert([newTag])
            .select("*")
            .single();

          if (insertError) throw insertError;
          result = insertedData;
          console.log("✅ Nouveau tag créé:", result.id);
        }

        // Récupérer couleur
        const { data: tagData } = await supabase
          .from("lpltag")
          .select("color")
          .eq("label", newTag.tag)
          .single();

        const enrichedTag: TaggedTurn = {
          ...result,
          color: tagData?.color || "#gray",
          verbatim: result.verbatim || "",
        };

        // ✅ Mise à jour intelligente de l'état local SANS fetchTaggedTurns
        setTaggedTurns((prevTags) => {
          // Supprimer l'ancien tag s'il existe
          const filteredTags = prevTags.filter(
            (tag) => tag.id !== enrichedTag.id
          );
          // Ajouter le nouveau/mis à jour
          const newState = [...filteredTags, enrichedTag];
          console.log(
            `État local mis à jour: ${prevTags.length} → ${newState.length} tags`
          );
          return newState;
        });

        return enrichedTag;
      } catch (err) {
        console.error("Erreur dans addTag:", err);
        return null;
      }
    },
    [supabase]
  );

  // Fonction calculateAllNextTurnTags corrigée (lignes ~520)
  const calculateAllNextTurnTags = useCallback(
    async (callId: string): Promise<number> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return 0;
      }

      try {
        console.log("=== CALCUL BATCH NEXT_TURN_TAG AVEC VALIDATION ===");
        console.log("Call ID:", callId);

        // 1. Récupérer tous les tags valides de lpltag d'abord
        const { data: validTags, error: validTagsError } = await supabase
          .from("lpltag")
          .select("label")
          .not("label", "is", null);

        if (validTagsError) {
          console.error("Erreur récupération tags valides:", validTagsError);
          return 0;
        }

        const validTagLabels = new Set(
          validTags?.map((tag) => tag.label) || []
        );
        console.log(`📋 ${validTagLabels.size} tags valides dans lpltag`);

        // 2. Récupérer tous les tags de cet appel, triés par temps
        const { data: allTags, error: tagsError } = await supabase
          .from("turntagged")
          .select("id, start_time, end_time, tag, speaker, next_turn_tag")
          .eq("call_id", callId)
          .order("start_time", { ascending: true });

        if (tagsError) {
          console.error("Erreur récupération tags:", tagsError);
          return 0;
        }

        if (!allTags || allTags.length === 0) {
          console.log("Aucun tag trouvé pour cet appel");
          return 0;
        }

        console.log(`Traitement de ${allTags.length} tags`);

        let updatedCount = 0;
        let rejectedCount = 0;

        // 3. Pour chaque tag, trouver le tag suivant du speaker différent
        for (let i = 0; i < allTags.length; i++) {
          const currentTag = allTags[i];

          // Trouver le prochain tag d'un speaker différent après ce tag
          const nextTag = allTags
            .slice(i + 1) // Tags suivants seulement
            .find(
              (tag) =>
                tag.speaker !== currentTag.speaker &&
                tag.start_time > currentTag.end_time
            );

          let nextTurnTag = null;

          if (nextTag) {
            // ✅ VALIDATION : Vérifier que le tag existe dans lpltag
            if (validTagLabels.has(nextTag.tag)) {
              nextTurnTag = nextTag.tag;
            } else {
              console.warn(`🚫 Tag rejeté (non dans lpltag): "${nextTag.tag}"`);
              rejectedCount++;
              // nextTurnTag reste null
            }
          }

          // 4. Mettre à jour seulement si différent de l'existant
          if (currentTag.next_turn_tag !== nextTurnTag) {
            const { error: updateError } = await supabase
              .from("turntagged")
              .update({ next_turn_tag: nextTurnTag })
              .eq("id", currentTag.id);

            if (updateError) {
              console.error(
                `Erreur mise à jour tag ${currentTag.id}:`,
                updateError
              );
            } else {
              console.log(
                `✅ Tag ${currentTag.id} (${currentTag.tag}): next_turn_tag = ${
                  nextTurnTag || "NULL"
                }`
              );
              updatedCount++;
            }
          }
        }

        console.log(`=== CALCUL TERMINÉ ===`);
        console.log(`✅ ${updatedCount} tags mis à jour`);
        console.log(`🚫 ${rejectedCount} tags rejetés (non valides)`);

        // 5. Rafraîchir l'état local si des tags ont été mis à jour
        if (updatedCount > 0) {
          await fetchTaggedTurns(callId);
        }

        return updatedCount;
      } catch (err) {
        console.error("Erreur dans calculateAllNextTurnTags:", err);
        return 0;
      }
    },
    [supabase, fetchTaggedTurns]
  );

  const deleteTurnTag = useCallback(
    async (id: number): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

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
          err instanceof Error ? err.message : String(err)
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
        calculateAllNextTurnTags,
        refreshTaggingCalls,
        fetchTaggingCalls,
      }}
    >
      {children}
    </TaggingDataContext.Provider>
  );
};
