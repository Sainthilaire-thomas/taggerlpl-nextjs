// hooks/useCallsData.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Call, CallsByOrigin } from "../types";
import { groupCallsByOrigin } from "../utils";

interface UseCallsDataReturn {
  callsByOrigin: CallsByOrigin;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCall: (callId: string, updates: Partial<Call>) => void;
  removeCall: (callId: string) => void;
}

export const useCallsData = (
  showMessage: (message: string) => void
): UseCallsDataReturn => {
  const [callsByOrigin, setCallsByOrigin] = useState<CallsByOrigin>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("call")
        .select("*")
        .eq("is_tagging_call", true)
        .order("callid", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      console.log(`📊 ${data?.length || 0} appels de tagging chargés`);

      // ✅ CORRECTION: Conversion robuste des données Supabase vers notre type
      const normalizedCalls: Call[] = (data || []).map(
        (dbCall: any): Call => ({
          callid: dbCall.callid || "",
          origine: dbCall.origine,
          filename: dbCall.filename,
          description: dbCall.description,
          status: dbCall.status,
          duree: dbCall.duree,
          transcription: dbCall.transcription,
          audiourl: dbCall.audiourl,
          filepath: dbCall.filepath,
          upload: dbCall.upload,
          preparedfortranscript: dbCall.preparedfortranscript,
          is_tagging_call: dbCall.is_tagging_call,
        })
      );

      const groupedByOrigin = groupCallsByOrigin(normalizedCalls);
      setCallsByOrigin(groupedByOrigin);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Erreur lors du chargement des appels :", errorMessage);
      setError(errorMessage);
      showMessage("Erreur lors du chargement des appels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  //   const updateCall = (callId: string, updates: Partial<Call>) => {
  //     setCallsByOrigin((prev) => {
  //       const updated: CallsByOrigin = { ...prev };

  //       for (const origin in updated) {
  //         const callIndex = updated[origin].findIndex(
  //           (call) => call.callid === callId
  //         );
  //         if (callIndex !== -1) {
  //           updated[origin][callIndex] = {
  //             ...updated[origin][callIndex],
  //             ...updates,
  //           };
  //           break;
  //         }
  //       }

  //       return updated;
  //     });
  //   };

  const updateCallData = useCallback(
    async (callId: string, updates: Partial<Call>) => {
      try {
        // Validation des types pour Supabase
        const supabaseUpdates: any = {};

        // Convertir undefined en null pour Supabase
        Object.keys(updates).forEach((key) => {
          const value = updates[key as keyof Call];
          supabaseUpdates[key] = value === undefined ? null : value;
        });

        console.log("🔄 Mise à jour appel:", callId, supabaseUpdates);

        // Import dynamique de Supabase
        const { supabase } = await import("@/lib/supabaseClient");

        const { error } = await supabase
          .from("call")
          .update(supabaseUpdates)
          .eq("callid", callId);

        if (error) {
          console.error("❌ Erreur Supabase:", error);
          throw new Error(`Erreur de mise à jour: ${error.message}`);
        }

        // Mise à jour de l'état local
        setCallsByOrigin((prev) => {
          const newState = { ...prev };
          let callFound = false;
          let oldOrigin: string | undefined;

          // Trouver et mettre à jour l'appel
          Object.keys(newState).forEach((origin) => {
            const callIndex = newState[origin].findIndex(
              (call) => call.callid === callId
            );
            if (callIndex !== -1) {
              callFound = true;
              oldOrigin = origin;
              const updatedCall = {
                ...newState[origin][callIndex],
                ...updates,
              };

              // Si l'origine change, déplacer l'appel
              if (updates.origine && updates.origine !== origin) {
                // Retirer de l'ancienne origine
                newState[origin].splice(callIndex, 1);

                // Ajouter à la nouvelle origine
                const newOrigin = updates.origine;
                if (!newState[newOrigin]) {
                  newState[newOrigin] = [];
                }
                newState[newOrigin].push(updatedCall);

                // Nettoyer l'ancienne origine si vide
                if (newState[origin].length === 0) {
                  delete newState[origin];
                }
              } else {
                // Mise à jour sur place
                newState[origin][callIndex] = updatedCall;
              }
            }
          });

          if (!callFound) {
            console.warn("⚠️ Appel non trouvé dans l'état local:", callId);
          }

          return newState;
        });

        console.log("✅ Appel mis à jour avec succès:", callId);
        return { success: true };
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de l'appel:", error);
        throw error;
      }
    },
    []
  );

  const removeCall = (callId: string) => {
    setCallsByOrigin((prev) => {
      const updated: CallsByOrigin = { ...prev };

      for (const origin in updated) {
        updated[origin] = updated[origin].filter(
          (call) => call.callid !== callId
        );

        // Supprimer l'origine si elle devient vide
        if (updated[origin].length === 0) {
          delete updated[origin];
        }
      }

      return updated;
    });
  };

  return {
    callsByOrigin,
    isLoading,
    error,
    refetch: fetchCalls,
    updateCall: updateCallData,
    removeCall,
  };
};
