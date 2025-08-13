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

export interface RelationsStatus {
  totalTags: number;
  tagsWithNextTurn: number;
  completenessPercent: number;
  isCalculated: boolean;
  missingRelations: number;
  lastChecked: Date;
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
  checkRelationsCompleteness: (
    callId: string
  ) => Promise<RelationsStatus | null>;
  getRelationsStatus: (callId: string) => Promise<RelationsStatus | null>;
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

  const checkRelationsCompleteness = useCallback(
    async (callId: string): Promise<RelationsStatus | null> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return null;
      }

      try {
        console.log("🔍 Vérification complétude relations pour:", callId);

        // Récupérer tous les tags de l'appel
        const { data: tags, error } = await supabase
          .from("turntagged")
          .select("id, next_turn_tag, speaker, start_time, end_time, tag")
          .eq("call_id", callId)
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Erreur lors de la vérification:", error);
          return null;
        }

        if (!tags || tags.length === 0) {
          console.log("Aucun tag trouvé pour cet appel");
          return {
            totalTags: 0,
            tagsWithNextTurn: 0,
            completenessPercent: 100, // 100% si pas de tags
            isCalculated: true,
            missingRelations: 0,
            lastChecked: new Date(),
          };
        }

        // Analyser les relations
        const totalTags = tags.length;
        const tagsWithNextTurn = tags.filter(
          (tag) => tag.next_turn_tag && tag.next_turn_tag.trim() !== ""
        ).length;

        // Calculer le pourcentage de complétude
        const completenessPercent =
          totalTags > 0 ? (tagsWithNextTurn / totalTags) * 100 : 100;

        // Seuil pour considérer comme "calculé" : 85%
        // (car certains tags en fin de conversation n'auront jamais de next_turn)
        const isCalculated = completenessPercent >= 85;
        const missingRelations = totalTags - tagsWithNextTurn;

        const status: RelationsStatus = {
          totalTags,
          tagsWithNextTurn,
          completenessPercent: Math.round(completenessPercent * 100) / 100, // Arrondir à 2 décimales
          isCalculated,
          missingRelations,
          lastChecked: new Date(),
        };

        console.log("📊 Analyse complétude:", status);
        return status;
      } catch (err) {
        console.error("Erreur lors de l'analyse de complétude:", err);
        return null;
      }
    },
    [supabase]
  );

  const getRelationsStatus = checkRelationsCompleteness;

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

  // ✅ FONCTION pour valider si un tag peut être un "next turn"
  function isValidNextTurnCandidate(
    currentTag: any,
    candidateTag: any,
    tolerance: number
  ): boolean {
    // Cas 1: Tag candidat commence après la fin du tag actuel (cas classique)
    if (candidateTag.start_time >= currentTag.end_time - tolerance) {
      return true;
    }

    // Cas 2: Chevauchement partiel acceptable (le candidat commence pendant le tag actuel mais continue après)
    if (
      candidateTag.start_time < currentTag.end_time &&
      candidateTag.end_time > currentTag.end_time
    ) {
      console.log(
        `⚠️ Chevauchement détecté entre ${currentTag.id} et ${candidateTag.id}`
      );
      return true;
    }

    // Cas 3: Tags très proches dans le temps (conversation rapide)
    const timeGap = candidateTag.start_time - currentTag.end_time;
    if (timeGap >= -tolerance && timeGap <= 0.5) {
      // Tolérance de 500ms
      return true;
    }

    return false;
  }
  // Fonction calculateAllNextTurnTags corrigée (lignes ~520)
  // ✅ VERSION SIMPLIFIÉE ET CORRECTE du calcul next_turn_tag
  const calculateAllNextTurnTags = useCallback(
    async (callId: string): Promise<number> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return 0;
      }

      try {
        console.log("=== CALCUL NEXT_TURN_TAG SIMPLIFIÉ ===");
        console.log("Call ID:", callId);

        // 1. Récupérer les tags valides de lpltag
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

        // 2. Récupérer TOUS les tags triés par temps (ordre chronologique strict)
        const { data: allTags, error: tagsError } = await supabase
          .from("turntagged")
          .select("id, start_time, end_time, tag, speaker, next_turn_tag")
          .eq("call_id", callId)
          .order("start_time", { ascending: true })
          .order("id", { ascending: true }); // Tri secondaire pour stabilité

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

        // 3. ✅ LOGIQUE SIMPLE : pour chaque tag, trouver le prochain tag d'un speaker différent
        for (let i = 0; i < allTags.length; i++) {
          const currentTag = allTags[i];

          console.log(
            `\n🔍 Tag ${i + 1}/${allTags.length}: ${currentTag.id} (${
              currentTag.start_time
            }s) - ${currentTag.tag} [${currentTag.speaker}]`
          );

          // Chercher le PROCHAIN tag d'un speaker différent
          let nextTurnTag = null;
          let nextTagFound = null;

          for (let j = i + 1; j < allTags.length; j++) {
            const candidateTag = allTags[j];

            // ✅ CONDITION SIMPLE : speaker différent
            if (candidateTag.speaker !== currentTag.speaker) {
              console.log(
                `   → Candidat trouvé: ${candidateTag.id} (${candidateTag.start_time}s) - ${candidateTag.tag} [${candidateTag.speaker}]`
              );

              // Valider que le tag existe dans lpltag
              if (validTagLabels.has(candidateTag.tag)) {
                nextTurnTag = candidateTag.tag;
                nextTagFound = candidateTag;
                console.log(`   ✅ Next turn validé: "${nextTurnTag}"`);
                break; // Prendre le PREMIER trouvé (le plus proche chronologiquement)
              } else {
                console.log(
                  `   🚫 Tag "${candidateTag.tag}" rejeté (pas dans lpltag)`
                );
                rejectedCount++;
              }
            }
          }

          if (!nextTagFound) {
            console.log(
              `   ❌ Aucun next turn trouvé (fin de conversation ou même speaker)`
            );
          }

          // 4. Mettre à jour SEULEMENT si différent de l'existant
          if (currentTag.next_turn_tag !== nextTurnTag) {
            console.log(
              `   🔄 Mise à jour: "${currentTag.next_turn_tag}" → "${nextTurnTag}"`
            );

            const { error: updateError } = await supabase
              .from("turntagged")
              .update({ next_turn_tag: nextTurnTag })
              .eq("id", currentTag.id);

            if (updateError) {
              console.error(
                `   ❌ Erreur mise à jour tag ${currentTag.id}:`,
                updateError
              );
            } else {
              console.log(`   ✅ Tag ${currentTag.id} mis à jour avec succès`);
              updatedCount++;
            }
          } else {
            console.log(`   ⏸️ Pas de changement nécessaire`);
          }
        }

        console.log(`\n=== RÉSULTATS FINAUX ===`);
        console.log(`✅ ${updatedCount} tags mis à jour`);
        console.log(`🚫 ${rejectedCount} tags rejetés (invalides)`);
        console.log(`⏸️ ${allTags.length - updatedCount} tags inchangés`);

        // 5. Rafraîchir l'état local si des changements
        if (updatedCount > 0) {
          console.log("🔄 Rafraîchissement de l'état local...");
          await fetchTaggedTurns(callId);
        }

        return updatedCount;
      } catch (err) {
        console.error("❌ Erreur dans calculateAllNextTurnTags:", err);
        return 0;
      }
    },
    [supabase, fetchTaggedTurns]
  );

  // ✅ FONCTION HELPER pour trouver le next_turn_tag
  function findNextTurnTag(
    currentTag: any,
    allTags: any[],
    currentIndex: number
  ) {
    console.log(
      `🔍 Recherche next_turn pour tag ${currentTag.id} (${currentTag.speaker}, ${currentTag.start_time}-${currentTag.end_time})`
    );

    const OVERLAP_TOLERANCE = 0.1; // Tolérance de 100ms pour les chevauchements

    // ✅ STRATÉGIE 1: Chercher le tag le plus proche chronologiquement d'un autre speaker
    let bestCandidate = null;
    let minTimeGap = Infinity;

    for (let j = currentIndex + 1; j < allTags.length; j++) {
      const candidateTag = allTags[j];

      // Ignorer les tags du même speaker
      if (candidateTag.speaker === currentTag.speaker) {
        continue;
      }

      // ✅ LOGIQUE AMÉLIORÉE pour déterminer si c'est un "tour suivant"
      const isValidNextTurn = isValidNextTurnCandidate(
        currentTag,
        candidateTag,
        OVERLAP_TOLERANCE
      );

      if (isValidNextTurn) {
        // Calculer la proximité temporelle
        const timeGap = candidateTag.start_time - currentTag.end_time;

        if (timeGap < minTimeGap) {
          minTimeGap = timeGap;
          bestCandidate = candidateTag;
        }

        // ✅ Si on trouve un tag très proche (< 2 secondes), on l'utilise
        if (timeGap >= -OVERLAP_TOLERANCE && timeGap <= 2.0) {
          console.log(
            `✅ Next turn trouvé: ${candidateTag.id} (gap: ${timeGap.toFixed(
              2
            )}s)`
          );
          return candidateTag;
        }
      }
    }

    if (bestCandidate) {
      console.log(
        `✅ Meilleur candidat: ${bestCandidate.id} (gap: ${minTimeGap.toFixed(
          2
        )}s)`
      );
      return bestCandidate;
    }

    console.log(`❌ Aucun next turn trouvé pour tag ${currentTag.id}`);
    return null;
  }

  // ✅ FONCTION DE DIAGNOSTIC (optionnelle)
  async function diagnoseNextTurnCalculation(callId: string) {
    console.log("=== DIAGNOSTIC NEXT_TURN_TAG ===");

    const { data: tags } = await supabase
      .from("turntagged")
      .select("*")
      .eq("call_id", callId)
      .order("start_time", { ascending: true });

    if (!tags) return;

    console.log("📊 Analyse des patterns:");

    // Analyser les gaps temporels
    const gaps = [];
    for (let i = 0; i < tags.length - 1; i++) {
      const gap = tags[i + 1].start_time - tags[i].end_time;
      gaps.push(gap);
    }

    console.log(
      `⏱️ Gaps temporels: min=${Math.min(...gaps).toFixed(2)}s, max=${Math.max(
        ...gaps
      ).toFixed(2)}s, moyenne=${(
        gaps.reduce((a, b) => a + b, 0) / gaps.length
      ).toFixed(2)}s`
    );

    // Analyser les speakers
    const speakers = [...new Set(tags.map((t) => t.speaker))];
    console.log(`👥 Speakers détectés: ${speakers.join(", ")}`);

    // Analyser les chevauchements
    let overlaps = 0;
    for (let i = 0; i < tags.length - 1; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        if (
          tags[i].end_time > tags[j].start_time &&
          tags[i].start_time < tags[j].end_time
        ) {
          overlaps++;
        }
      }
    }
    console.log(`🔄 Chevauchements détectés: ${overlaps}`);
  }
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
        checkRelationsCompleteness,
        getRelationsStatus,
      }}
    >
      {children}
    </TaggingDataContext.Provider>
  );
};
