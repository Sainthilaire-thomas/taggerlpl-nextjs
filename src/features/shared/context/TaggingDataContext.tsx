"use client";

declare global {
  interface Window {
    allTurnTagged?: any;
  }
}

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from "react";

import { useSupabase } from "./SupabaseContext";

// Define types for your data models
export interface Tag {
  id?: number;
  label: string; // âœ… Correspond Ã  votre DB lpltag.label
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
  text: string; // âœ… Ajout de cette propriÃ©tÃ© (alias de word)
  startTime: number;
  endTime: number;
  speaker: string;
  turn: string; // âœ… Ajout de cette propriÃ©tÃ© manquante
  index?: number; // âœ… Ajout de cette propriÃ©tÃ© optionnelle
  [key: string]: any;
}

export interface Postit {
  id: number;
  callid: string;
  content: string;
  [key: string]: any;
}
export type TurnAnnotation = {
  id: string;
  author: string;
  created_at: string; // ISO
  rationale: string; // commentaire principal
  proposed_label?: string | null; // label proposÃ© (prÃ©dit)
  gold_label?: string | null; // label gold
  verbatim?: string | null; // snapshot du tour
  context?: { prev2?: string; prev1?: string; next1?: string } | null;
  source?: string | null; // "ui/analysis" etc.
  _pending?: boolean; // flag UI (optimistic)
  algo?: {
    classifier: string; // ex: "OpenAIConseillerClassifier"
    type?: "rule-based" | "ml" | "llm"; // si dispo
    model?: string | null; // ex: "gpt-4o-mini"
    provider?: string | null; // ex: "openai"
    temperature?: number | null;
    max_tokens?: number | null;
  } | null;
};
export type AddAnnotationPayload = {
  comment: string;
  author?: string;
  proposedLabel?: string | null;
  goldLabel?: string | null;
  verbatim?: string | null;
  context?: { prev2?: string; prev1?: string; next1?: string } | null;
  source?: string | null;
};

export type AnnotationCreateResult = {
  ok: boolean;
  error?: string;
  annotation?: TurnAnnotation;
};

export type AnnotationOpResult = {
  ok: boolean;
  error?: string;
};
export interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string; // âœ… Ajout du champ
  speaker: string; // âœ… Ajout du champ
  color: string;
  [key: string]: any;
  annotations?: TurnAnnotation[];
}

export interface NewTag {
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string; // âœ… Ajout obligatoire
  next_turn_verbatim?: string;
  speaker: string; // âœ… Ajout obligatoire
  next_turn_tag?: string; // âœ… Ajout optionnel
  [key: string]: any;
}

// ==========================================
// ðŸ“‹ NOUVEAUX TYPES (sans conflit)
// ==========================================

interface GlobalTurnTaggedFilters {
  strategies?: string[];
  speakers?: string[];
  callIds?: string[];
  limit?: number;
  origine?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface GlobalTurnTaggedStats {
  totalTurns: number;
  totalCalls: number;
  strategiesCount: Record<string, number>;
  speakersCount: Record<string, number>;
  originesCount: Record<string, number>;
  lastUpdated: Date;
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
  // Annotations
  addAnnotation: (
    turnId: number,
    payload: AddAnnotationPayload
  ) => Promise<AnnotationCreateResult>;

  updateAnnotation: (
    turnId: number,
    annotationId: string,
    patch: Partial<
      Pick<
        TurnAnnotation,
        "rationale" | "proposed_label" | "gold_label" | "context"
      >
    >
  ) => Promise<AnnotationOpResult>;

  deleteAnnotation: (
    turnId: number,
    annotationId: string
  ) => Promise<AnnotationOpResult>;

  // ðŸ†• NOUVELLES PROPRIÃ‰TÃ‰S (ajoutÃ©es sans conflit)
  allTurnTagged: TaggedTurn[]; // â† Pour analyse globale
  setAllTurnTagged: React.Dispatch<React.SetStateAction<TaggedTurn[]>>;
  fetchAllTurnTagged: (filters?: GlobalTurnTaggedFilters) => Promise<void>;
  globalTurnTaggedStats: GlobalTurnTaggedStats;
  loadingGlobalData: boolean;
  errorGlobalData: string | null;

  // ðŸ†• Fonctions utilitaires pour compatibilitÃ©
  getFilteredTurnsForAnalysis: (
    filters?: GlobalTurnTaggedFilters
  ) => TaggedTurn[];
  refreshGlobalDataIfNeeded: () => Promise<void>;
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

  // âœ… Ã‰TATS EXISTANTS (inchangÃ©s)
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

  // ðŸ†• NOUVEAUX Ã‰TATS (corrigÃ©s - au bon endroit)
  const [allTurnTagged, setAllTurnTagged] = useState<TaggedTurn[]>([]);
  const [loadingGlobalData, setLoadingGlobalData] = useState(false);
  const [errorGlobalData, setErrorGlobalData] = useState<string | null>(null);
  const [lastGlobalFetch, setLastGlobalFetch] = useState<Date | null>(null);

  // Dans votre contexte, ajoutez cette fonction utilitaire
  const checkTotalTurnTagged = async () => {
    const { count } = await supabase
      .from("turntagged")
      .select("*", { count: "exact", head: true });
    console.log(`ðŸ“Š Total rÃ©el en DB: ${count} turns`);
    return count;
  };

  const updateCurrentWord = (word: Word | null): void => {
    setCurrentWord(word);
    console.log("Current word updated:", word);
  };

  const mapWordToTranscriptWord = (word: any): Word => {
    console.log("Mappage du mot:", word); // Debug log

    return {
      ...word, // Garder toutes les propriÃ©tÃ©s originales
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
    // VÃ©rifier que supabase est disponible
    if (!supabase) {
      console.warn("Supabase client not available yet");
      return;
    }

    // Fetch les tags une seule fois au chargement
    const fetchTags = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from("lpltag").select("*");
        if (error) {
          console.error("Erreur de rÃ©cupÃ©ration des tags :", error.message);
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
        console.log("Appels rÃ©cupÃ©rÃ©s :", data);
        setTaggingCalls(data || []);
      }
    } catch (err) {
      console.error(
        "Erreur inattendue lors du fetch des appels de tagging :",
        err instanceof Error ? err.message : String(err)
      );
    }
  }, [supabase]);

  // ðŸ†• NOUVELLE FONCTION pour fetch global (sans conflit)
  // 1. âœ… Correction dans fetchAllTurnTagged
  const fetchAllTurnTagged = useCallback(
    async (filters?: GlobalTurnTaggedFilters) => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

      try {
        setLoadingGlobalData(true);
        setErrorGlobalData(null);

        console.log("=== FETCH ALL TURNTAGGED COMPLET (SANS LIMITE) ===");
        console.log("Filtres:", filters);

        // ðŸš€ PREMIÃˆRE Ã‰TAPE: Compter le total exact
        const { count: totalCount, error: countError } = await supabase
          .from("turntagged")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.error("Erreur lors du count:", countError);
          throw countError;
        }

        console.log(`ðŸ“Š Total rÃ©el en base: ${totalCount} turntagged`);

        // ðŸš€ DEUXIÃˆME Ã‰TAPE: RÃ©cupÃ©ration par pages
        const pageSize = 1000; // Taille de page Supabase
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        console.log(`ðŸ”„ RÃ©cupÃ©ration par pages (${pageSize} par page)...`);

        while (hasMore && allData.length < (totalCount || 10000)) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          console.log(`ðŸ“¥ Page ${page + 1}: rÃ©cupÃ©ration ${from}-${to}`);

          // Construction de la requÃªte avec jointures
          let query = supabase
            .from("turntagged")
            .select(
              `
            *,
            lpltag:tag (color, family, originespeaker),
            call:call_id (origine, duree)
          `
            )
            .range(from, to)
            .order("call_id", { ascending: true })
            .order("start_time", { ascending: true });

          // Application des filtres si spÃ©cifiÃ©s
          if (filters?.strategies?.length) {
            query = query.in("tag", filters.strategies);
          }

          if (filters?.speakers?.length) {
            query = query.in("speaker", filters.speakers);
          }

          if (filters?.callIds?.length) {
            query = query.in("call_id", filters.callIds);
          }

          if (filters?.origine) {
            query = query.eq("call.origine", filters.origine);
          }

          const { data: pageData, error: pageError } = await query;

          if (pageError) {
            console.error(`Erreur page ${page}:`, pageError);
            throw pageError;
          }

          if (!pageData || pageData.length === 0) {
            console.log(
              `ðŸ“„ Page ${page + 1}: aucune donnÃ©e, fin de pagination`
            );
            hasMore = false;
            break;
          }

          allData = [...allData, ...pageData];
          console.log(
            `âœ… Page ${page + 1}: +${pageData.length} turns (total: ${
              allData.length
            })`
          );

          // Si moins que pageSize, on a atteint la fin
          if (pageData.length < pageSize) {
            hasMore = false;
            console.log(`ðŸ Fin naturelle de pagination (page incomplÃ¨te)`);
          }

          page++;

          // SÃ©curitÃ©: Ã©viter les boucles infinies
          if (page > 10) {
            console.warn("âš ï¸ ArrÃªt sÃ©curitÃ©: plus de 10 pages rÃ©cupÃ©rÃ©es");
            break;
          }
        }

        console.log(
          `ðŸŽ‰ RÃ©cupÃ©ration terminÃ©e: ${allData.length}/${totalCount} turns`
        );

        // ðŸš€ TROISIÃˆME Ã‰TAPE: Traitement des donnÃ©es
        const processedData: TaggedTurn[] = allData.map((turn: any) => ({
          id: turn.id,
          call_id: turn.call_id,
          start_time: turn.start_time,
          end_time: turn.end_time,
          tag: turn.tag,
          verbatim: turn.verbatim || "",
          next_turn_verbatim: turn.next_turn_verbatim || "",
          next_turn_tag: turn.next_turn_tag,
          speaker: turn.speaker,
          color: turn.lpltag?.color || "#gray",
          annotations: Array.isArray(turn.annotations) ? turn.annotations : [],

          // DonnÃ©es enrichies
          family: turn.lpltag?.family || "UNKNOWN",
          originespeaker: turn.lpltag?.originespeaker || "unknown",
          call_origine: turn.call?.origine || "unknown",
          call_duree: turn.call?.duree || 0,
        }));

        setAllTurnTagged(processedData);
        console.log("âœ… CONTEXTE MIS Ã€ JOUR:", processedData.length, "turns");
        (window as any).allTurnTagged = processedData;
        setLastGlobalFetch(new Date());

        console.log(`ðŸ“ˆ Ã‰tat mis Ã  jour avec ${processedData.length} turns`);

        // VÃ©rification finale
        if (processedData.length < (totalCount || 0) * 0.9) {
          console.warn(
            `âš ï¸ Attention: seulement ${processedData.length}/${totalCount} rÃ©cupÃ©rÃ©s`
          );
        }
      } catch (err) {
        console.error("âŒ Erreur lors du fetch global:", err);
        setErrorGlobalData(
          err instanceof Error ? err.message : "Erreur inconnue"
        );
      } finally {
        setLoadingGlobalData(false);
      }
    },
    [supabase]
  );

  // 3. âœ… Fonction utilitaire pour diagnostiquer
  const diagnosticSupabaseLimit = useCallback(async () => {
    if (!supabase) return;

    console.log("ðŸ” DIAGNOSTIC LIMITATION SUPABASE");
    console.log("================================");

    // Test 1: Count exact
    const { count } = await supabase
      .from("turntagged")
      .select("*", { count: "exact", head: true });
    console.log("Total en base:", count);

    // Test 2: Fetch avec limite par dÃ©faut
    const { data: defaultData } = await supabase
      .from("turntagged")
      .select("id");
    console.log("Fetch par dÃ©faut:", defaultData?.length);

    // Test 3: Fetch avec limite explicite
    const { data: limitedData } = await supabase
      .from("turntagged")
      .select("id")
      .limit(5000);
    console.log("Fetch avec limite 5000:", limitedData?.length);

    // Test 4: Fetch avec range
    const { data: rangeData } = await supabase
      .from("turntagged")
      .select("id")
      .range(0, 2999);
    console.log("Fetch avec range 0-2999:", rangeData?.length);
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

  // Fetch des transcriptions pour un appel spÃ©cifique
  const fetchTaggingTranscription = useCallback(
    async (callId: string): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

      try {
        console.log("ðŸ” DÃ©but fetchTaggingTranscription pour callId:", callId);

        // Ã‰tape 1 : Obtenir le transcriptid Ã  partir du callid
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
        console.log("ðŸ“„ TranscriptId trouvÃ©:", transcriptId);

        if (!transcriptId) {
          console.warn("Aucun transcriptid trouvÃ© pour callid :", callId);
          setTaggingTranscription([]);
          return;
        }

        // Ã‰tape 2 : Obtenir les mots associÃ©s au transcriptid
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

        console.log("ðŸ“ DonnÃ©es words brutes rÃ©cupÃ©rÃ©es:", wordsData);
        console.log("ðŸ“Š Nombre de mots rÃ©cupÃ©rÃ©s:", wordsData?.length || 0);

        if (!wordsData || wordsData.length === 0) {
          console.warn("Aucun mot trouvÃ© pour transcriptId:", transcriptId);
          setTaggingTranscription([]);
          return;
        }

        // âœ… Mappez les donnÃ©es pour inclure les propriÃ©tÃ©s manquantes
        const mappedWords = wordsData.map(mapWordToTranscriptWord);
        console.log("ðŸ”„ Mots aprÃ¨s mappage:", mappedWords.slice(0, 3)); // Log des 3 premiers pour debug

        setTaggingTranscription(mappedWords);
        console.log(
          "âœ… TaggingTranscription mis Ã  jour avec",
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

  // ðŸ†• FONCTION pour donnÃ©es filtrÃ©es (utilitaire)
  const getFilteredTurnsForAnalysis = useCallback(
    (filters?: GlobalTurnTaggedFilters): TaggedTurn[] => {
      let filtered = allTurnTagged;

      if (filters?.strategies?.length) {
        filtered = filtered.filter((turn: TaggedTurn) =>
          filters.strategies!.includes(turn.tag)
        );
      }

      if (filters?.speakers?.length) {
        filtered = filtered.filter((turn: TaggedTurn) =>
          filters.speakers!.includes(turn.speaker)
        );
      }

      if (filters?.callIds?.length) {
        filtered = filtered.filter((turn: TaggedTurn) =>
          filters.callIds!.includes(turn.call_id)
        );
      }

      return filtered;
    },
    [allTurnTagged]
  );

  // ðŸ†• FONCTION pour refresh intelligent
  const refreshGlobalDataIfNeeded = useCallback(async () => {
    const now = new Date();
    const shouldRefresh =
      !lastGlobalFetch ||
      now.getTime() - lastGlobalFetch.getTime() > 5 * 60 * 1000; // 5 minutes

    if (shouldRefresh) {
      console.log("ðŸ”„ Refresh automatique des donnÃ©es globales");
      await fetchAllTurnTagged({ limit: 5000 });
    }
  }, [lastGlobalFetch, fetchAllTurnTagged]);

  // ðŸ†• CALCUL des statistiques globales
  const globalTurnTaggedStats = useMemo((): GlobalTurnTaggedStats => {
    const uniqueCallIds = new Set(
      allTurnTagged.map((turn: TaggedTurn) => turn.call_id)
    );

    return {
      totalTurns: allTurnTagged.length,
      totalCalls: uniqueCallIds.size,
      strategiesCount: allTurnTagged.reduce(
        (acc: Record<string, number>, turn: TaggedTurn) => {
          acc[turn.tag] = (acc[turn.tag] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      speakersCount: allTurnTagged.reduce(
        (acc: Record<string, number>, turn: TaggedTurn) => {
          acc[turn.speaker] = (acc[turn.speaker] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      originesCount: allTurnTagged.reduce(
        (acc: Record<string, number>, turn: TaggedTurn) => {
          const origine = (turn as any).call_origine || "unknown";
          acc[origine] = (acc[origine] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      lastUpdated: lastGlobalFetch || new Date(),
    };
  }, [allTurnTagged, lastGlobalFetch]);

  // Fetch des post-its liÃ©s Ã  un appel
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
        console.log("ðŸ” VÃ©rification complÃ©tude relations pour:", callId);

        // RÃ©cupÃ©rer tous les tags de l'appel
        const { data: tags, error } = await supabase
          .from("turntagged")
          .select("id, next_turn_tag, speaker, start_time, end_time, tag")
          .eq("call_id", callId)
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Erreur lors de la vÃ©rification:", error);
          return null;
        }

        if (!tags || tags.length === 0) {
          console.log("Aucun tag trouvÃ© pour cet appel");
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

        // Calculer le pourcentage de complÃ©tude
        const completenessPercent =
          totalTags > 0 ? (tagsWithNextTurn / totalTags) * 100 : 100;

        // Seuil pour considÃ©rer comme "calculÃ©" : 85%
        // (car certains tags en fin de conversation n'auront jamais de next_turn)
        const isCalculated = completenessPercent >= 85;
        const missingRelations = totalTags - tagsWithNextTurn;

        const status: RelationsStatus = {
          totalTags,
          tagsWithNextTurn,
          completenessPercent: Math.round(completenessPercent * 100) / 100, // Arrondir Ã  2 dÃ©cimales
          isCalculated,
          missingRelations,
          lastChecked: new Date(),
        };

        console.log("ðŸ“Š Analyse complÃ©tude:", status);
        return status;
      } catch (err) {
        console.error("Erreur lors de l'analyse de complÃ©tude:", err);
        return null;
      }
    },
    [supabase]
  );

  const getRelationsStatus = checkRelationsCompleteness;

  // SÃ©lectionner un appel pour le tagging
  const callId = selectedTaggingCall?.callid;

  // Fonction pour jouer l'audio Ã  un timestamp donnÃ©
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

  // 2. âœ… Correction dans l'initialisation
  useEffect(() => {
    console.log("ðŸš€ Initialisation avec fetch complet des donnÃ©es");
    fetchAllTurnTagged({ limit: undefined }); // Pas de limite pour l'initial
  }, [fetchAllTurnTagged]);

  // Fonction pour rÃ©cupÃ©rer les tags
  // Fonction fetchTaggedTurns simplifiÃ©e dans TaggingDataContext.tsx

  const fetchTaggedTurns = useCallback(
    async (callId: string): Promise<void> => {
      if (!supabase) {
        console.warn("Supabase not available");
        return;
      }

      try {
        console.log("=== FETCH TAGGED TURNS ===");
        console.log("Call ID:", callId);

        const { data: enrichedTags, error } = await supabase
          .from("turntagged")
          .select(
            `
            *,
            lpltag:tag (color)
          `
          )
          .eq("call_id", callId)
          .order("start_time", { ascending: true })
          .order("id", { ascending: true }); // stabilitÃ© si mÃªmes timestamps

        if (error) {
          console.error("Erreur fetch tags:", error);
          throw error;
        }

        const processedTags: TaggedTurn[] = (enrichedTags || []).map(
          (tag: any) => ({
            ...tag,
            color: tag.lpltag?.color || "#gray",
            verbatim: tag.verbatim || "",
            // âœ… les annotations JSONB sont normalisÃ©es en tableau
            annotations: Array.isArray(tag.annotations) ? tag.annotations : [],
          })
        );

        console.log(`âœ… ${processedTags.length} tags rÃ©cupÃ©rÃ©s`);
        setTaggedTurns(processedTags);
      } catch (err) {
        console.error("Erreur dans fetchTaggedTurns:", err);
        setTaggedTurns([]);
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
        // âœ… Charger TOUTES les donnÃ©es nÃ©cessaires en parallÃ¨le
        Promise.all([
          fetchTaggingTranscription(call.callid),
          fetchTaggedTurns(call.callid), // âœ… AJOUT CRUCIAL
          fetchTaggingPostits(call.callid),
        ])
          .then(() => {
            console.log(
              "âœ… Toutes les donnÃ©es chargÃ©es pour l'appel",
              call.callid
            );
          })
          .catch((error) => {
            console.error("âŒ Erreur lors du chargement des donnÃ©es:", error);
          });

        setAudioSrc(call.audiourl);
      }
    },
    [fetchTaggingTranscription, fetchTaggedTurns, fetchTaggingPostits] // âœ… Ajouter fetchTaggedTurns aux dÃ©pendances
  );
  // Fonction pour ajouter un tag
  // Fonction addTag robuste dans TaggingDataContext.tsx

  const addTag = useCallback(
    async (newTag: NewTag): Promise<TaggedTurn | null> => {
      if (!supabase) return null;

      try {
        console.log("=== ADD TAG OPTIMISÃ‰ ===");

        // VÃ©rifier doublons
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
          // Mise Ã  jour
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
          console.log("âœ… Tag mis Ã  jour:", result.id);
        } else {
          // CrÃ©ation
          const { data: insertedData, error: insertError } = await supabase
            .from("turntagged")
            .insert([newTag])
            .select("*")
            .single();

          if (insertError) throw insertError;
          result = insertedData;
          console.log("âœ… Nouveau tag crÃ©Ã©:", result.id);
        }

        // RÃ©cupÃ©rer couleur
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

        // âœ… Mise Ã  jour intelligente de l'Ã©tat local SANS fetchTaggedTurns
        setTaggedTurns((prevTags) => {
          // Supprimer l'ancien tag s'il existe
          const filteredTags = prevTags.filter(
            (tag) => tag.id !== enrichedTag.id
          );
          // Ajouter le nouveau/mis Ã  jour
          const newState = [...filteredTags, enrichedTag];
          console.log(
            `Ã‰tat local mis Ã  jour: ${prevTags.length} â†’ ${newState.length} tags`
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

  // âœ… FONCTION pour valider si un tag peut Ãªtre un "next turn"
  function isValidNextTurnCandidate(
    currentTag: any,
    candidateTag: any,
    tolerance: number
  ): boolean {
    // Cas 1: Tag candidat commence aprÃ¨s la fin du tag actuel (cas classique)
    if (candidateTag.start_time >= currentTag.end_time - tolerance) {
      return true;
    }

    // Cas 2: Chevauchement partiel acceptable (le candidat commence pendant le tag actuel mais continue aprÃ¨s)
    if (
      candidateTag.start_time < currentTag.end_time &&
      candidateTag.end_time > currentTag.end_time
    ) {
      console.log(
        `âš ï¸ Chevauchement dÃ©tectÃ© entre ${currentTag.id} et ${candidateTag.id}`
      );
      return true;
    }

    // Cas 3: Tags trÃ¨s proches dans le temps (conversation rapide)
    const timeGap = candidateTag.start_time - currentTag.end_time;
    if (timeGap >= -tolerance && timeGap <= 0.5) {
      // TolÃ©rance de 500ms
      return true;
    }

    return false;
  }

  // Fonction calculateAllNextTurnTags corrigÃ©e (lignes ~520)
  // âœ… NOUVELLE VERSION : Appel de la fonction RPC calculate_turn_relations
const calculateAllNextTurnTags = useCallback(
  async (callId: string): Promise<number> => {
    if (!supabase) {
      console.warn("Supabase not available");
      return 0;
    }

    try {
      console.log("=== CALCUL RELATIONS ÉTENDUES + REFRESH PAIRES ===");
      console.log("Call ID:", callId);

      // ✅ ÉTAPE 1 : Calculer les relations dans turntagged
      const { data: relationsData, error: relationsError } = await supabase.rpc(
        'calculate_turn_relations',
        { p_call_id: parseInt(callId, 10) }
      );

      if (relationsError) {
        console.error("❌ Erreur calcul relations:", relationsError);
        throw relationsError;
      }

      const relationsResult = relationsData?.[0];

      if (!relationsResult) {
        console.warn("⚠️ Aucun résultat retourné par calculate_turn_relations");
        return 0;
      }

      console.log(`✅ ${relationsResult.updated_count} tours mis à jour dans turntagged`);
      console.log(`📊 ${relationsResult.total_turns} tours traités`);
      console.log(`⏱️ ${relationsResult.execution_time_ms}ms`);

      // ✅ ÉTAPE 2 : Régénérer les paires pour ce call
      if (relationsResult.updated_count > 0) {
        console.log("🔄 Régénération des paires analysis_pairs...");
        
        const { data: pairsData, error: pairsError } = await supabase.rpc(
          'refresh_analysis_pairs',
          {
            p_incremental: true,
            p_call_ids: [callId]
          }
        );

        if (pairsError) {
          console.warn("⚠️ Erreur refresh paires (non bloquant):", pairsError);
        } else {
          const pairsResult = pairsData?.[0];
          console.log(`✅ ${pairsResult?.inserted || 0} paires créées`);
          console.log(`♻️ ${pairsResult?.deleted || 0} anciennes paires supprimées`);
        }
      }

      // ✅ ÉTAPE 3 : Rafraîchir l'état local
      if (relationsResult.updated_count > 0) {
        console.log("🔄 Rafraîchissement de l'état local...");
        await fetchTaggedTurns(callId);
      }

      return relationsResult.updated_count;
    } catch (err) {
      console.error("❌ Erreur dans calculateAllNextTurnTags:", err);
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
          console.log("Tag supprimÃ© avec succÃ¨s :", id);
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

  //MÃ©thodes d'annotation
  // met Ã  jour le mÃªme tour dans les 2 Ã©tats (liste globale + liste par appel)
  const replaceTurnInStates = useCallback(
    (turnId: number, updater: (t: TaggedTurn) => TaggedTurn) => {
      setAllTurnTagged((prev) =>
        prev.map((t) => (t.id === turnId ? updater(t) : t))
      );
      setTaggedTurns((prev) =>
        prev.map((t) => (t.id === turnId ? updater(t) : t))
      );
    },
    []
  );

  const getLocalAnnotations = (
    turnId: number
  ): TurnAnnotation[] | undefined => {
    const inTagged = taggedTurns.find((t) => t.id === turnId)?.annotations;
    if (inTagged) return inTagged;
    return allTurnTagged.find((t) => t.id === turnId)?.annotations;
  };

  const fetchDbAnnotations = async (
    turnId: number
  ): Promise<TurnAnnotation[]> => {
    const { data, error } = await supabase
      .from("turntagged")
      .select("annotations")
      .eq("id", turnId)
      .single();
    if (error) throw error;
    return Array.isArray(data?.annotations)
      ? (data!.annotations as TurnAnnotation[])
      : [];
  };

  // CREATE
  const addAnnotation = useCallback(
    async (
      turnId: number,
      payload: {
        comment: string;
        author?: string;
        proposedLabel?: string | null;
        goldLabel?: string | null;
        verbatim?: string | null;
        context?: { prev2?: string; prev1?: string; next1?: string } | null;
        source?: string | null;
        algo?: {
          classifier: string;
          type?: "rule-based" | "ml" | "llm";
          model?: string | null;
          provider?: string | null;
          temperature?: number | null;
          max_tokens?: number | null;
        } | null;
      }
    ) => {
      if (!supabase) return { ok: false, error: "Supabase indisponible" };

      const temp: TurnAnnotation = {
        id:
          (globalThis.crypto?.randomUUID?.() ??
            Math.random().toString(36).slice(2)) + Date.now().toString(36),
        author: payload.author || "analyst",
        created_at: new Date().toISOString(),
        rationale: payload.comment.trim(),
        proposed_label: payload.proposedLabel ?? null,
        gold_label: payload.goldLabel ?? null,
        verbatim: payload.verbatim ?? null,
        context: payload.context ?? null,
        source: payload.source ?? "ui/analysis",
        algo: payload.algo ?? null,
        _pending: true,
      };

      // 1) Optimistic
      replaceTurnInStates(turnId, (t) => ({
        ...t,
        annotations: [...(t.annotations ?? []), temp],
      }));

      try {
        // 2) DB merge (on relit pour Ã©viter les Ã©crasements)
        const current = await fetchDbAnnotations(turnId);
        const merged = [...current, { ...temp, _pending: undefined }];

        const { data, error } = await supabase
          .from("turntagged")
          .update({ annotations: merged })
          .eq("id", turnId)
          .select("id, annotations")
          .single();

        if (error) throw error;

        // 3) Remise au propre (supprimer _pending)
        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: Array.isArray(data?.annotations)
            ? (data!.annotations as TurnAnnotation[])
            : [],
        }));

        return { ok: true, annotation: merged[merged.length - 1] };
      } catch (e: any) {
        // rollback
        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: (t.annotations ?? []).filter((a) => a.id !== temp.id),
        }));
        return { ok: false, error: e?.message || "Ã‰chec de l'enregistrement" };
      }
    },
    [supabase, replaceTurnInStates]
  );

  // UPDATE (patch partiel)
  const updateAnnotation = useCallback(
    async (
      turnId: number,
      annotationId: string,
      patch: Partial<
        Pick<
          TurnAnnotation,
          "rationale" | "proposed_label" | "gold_label" | "context" | "algo"
        >
      >
    ) => {
      if (!supabase) return { ok: false, error: "Supabase indisponible" };

      const prev = getLocalAnnotations(turnId) ?? [];
      const before = prev.find((a) => a.id === annotationId);
      if (!before)
        return { ok: false, error: "Annotation introuvable en mÃ©moire" };

      // 1) Optimistic
      replaceTurnInStates(turnId, (t) => ({
        ...t,
        annotations: (t.annotations ?? []).map((a) =>
          a.id === annotationId ? { ...a, ...patch, _pending: true } : a
        ),
      }));

      try {
        // 2) DB: on repart de lâ€™Ã©tat DB
        const current = await fetchDbAnnotations(turnId);
        const updated = current.map((a) =>
          a.id === annotationId ? { ...a, ...patch } : a
        );

        const { data, error } = await supabase
          .from("turntagged")
          .update({ annotations: updated })
          .eq("id", turnId)
          .select("id, annotations")
          .single();

        if (error) throw error;

        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: Array.isArray(data?.annotations)
            ? (data!.annotations as TurnAnnotation[])
            : [],
        }));

        return { ok: true };
      } catch (e: any) {
        // rollback
        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: prev, // on remet les annotations avant patch
        }));
        return { ok: false, error: e?.message || "Ã‰chec de la mise Ã  jour" };
      }
    },
    [supabase, replaceTurnInStates, getLocalAnnotations]
  );

  // DELETE
  const deleteAnnotation = useCallback(
    async (turnId: number, annotationId: string) => {
      if (!supabase) return { ok: false, error: "Supabase indisponible" };

      const prev = getLocalAnnotations(turnId) ?? [];
      const removed = prev.find((a) => a.id === annotationId);
      if (!removed) return { ok: false, error: "Annotation introuvable" };

      // 1) Optimistic
      replaceTurnInStates(turnId, (t) => ({
        ...t,
        annotations: (t.annotations ?? []).filter((a) => a.id !== annotationId),
      }));

      try {
        // 2) DB
        const current = await fetchDbAnnotations(turnId);
        const updated = current.filter((a) => a.id !== annotationId);

        const { data, error } = await supabase
          .from("turntagged")
          .update({ annotations: updated })
          .eq("id", turnId)
          .select("id, annotations")
          .single();

        if (error) throw error;

        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: Array.isArray(data?.annotations)
            ? (data!.annotations as TurnAnnotation[])
            : [],
        }));

        return { ok: true };
      } catch (e: any) {
        // rollback
        replaceTurnInStates(turnId, (t) => ({
          ...t,
          annotations: prev,
        }));
        return { ok: false, error: e?.message || "Ã‰chec de la suppression" };
      }
    },
    [supabase, replaceTurnInStates, getLocalAnnotations]
  );

  return (
    <TaggingDataContext.Provider
      value={{
        // âœ… PROPRIÃ‰TÃ‰S EXISTANTES (inchangÃ©es)
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

        // ðŸ†• NOUVELLES PROPRIÃ‰TÃ‰S (ajoutÃ©es)
        allTurnTagged,
        setAllTurnTagged,
        fetchAllTurnTagged,
        globalTurnTaggedStats,
        loadingGlobalData,
        errorGlobalData,
        getFilteredTurnsForAnalysis,
        refreshGlobalDataIfNeeded,
        // MÃ©thodes d'annotation
        addAnnotation, // â¬…ï¸ nouveau
        updateAnnotation, // â¬…ï¸ nouveau
        deleteAnnotation, // â¬…ï¸ nouveau
      }}
    >
      {children}
    </TaggingDataContext.Provider>
  );
};
