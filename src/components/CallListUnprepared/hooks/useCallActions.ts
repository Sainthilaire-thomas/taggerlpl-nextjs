// hooks/useCallActions.ts - MIS À JOUR pour la nouvelle ergonomie
import { useState } from "react";
import { Call } from "../types";

interface UseCallActionsProps {
  onPrepareCall: (params: {
    call: Call;
    showMessage: (message: string) => void;
  }) => Promise<void>;
  showMessage: (message: string) => void;
  updateCall: (callId: string, updates: Partial<Call>) => void;
  removeCall: (callId: string) => void;
}

// ✅ NOUVEAUX TYPES pour la nouvelle ergonomie
interface DeleteOptions {
  mode: "standard" | "complete" | "custom";
  confirmCompleteDelete?: boolean;
  customOptions?: {
    deleteAudio: boolean;
    deleteTranscription: boolean;
    deleteTagging: boolean;
  };
}

interface UseCallActionsReturn {
  selectedCall: Call | null;
  deleteDialogOpen: boolean;
  callToDelete: Call | null;
  isDeleting: boolean;
  handlePrepareCall: (call: Call) => Promise<void>;
  handleDeleteClick: (call: Call) => void;
  // ✅ NOUVEAU: Support des options de suppression avancées
  handleDeleteConfirm: (call: Call, options?: DeleteOptions) => Promise<void>;
  handleDeleteDialogClose: () => void;
  handleViewContent: (call: Call) => void;
  handleStatusChange: (
    call: Call,
    newStatus: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ) => Promise<void>;
  handleCloseDialog: () => void;
}

export const useCallActions = ({
  onPrepareCall,
  showMessage,
  updateCall,
  removeCall,
}: UseCallActionsProps): UseCallActionsReturn => {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handlePrepareCall = async (call: Call) => {
    console.log("🔧 Préparation technique pour appel:", call.callid);

    const hasTranscription = Boolean(
      call.transcription?.words && call.transcription.words.length > 0
    );

    if (!hasTranscription) {
      showMessage("❌ Impossible de préparer: aucune transcription trouvée");
      return;
    }

    try {
      await onPrepareCall({ call, showMessage });
      showMessage(
        `✅ Appel ${call.callid} préparé avec succès pour le tagging !`
      );
      updateCall(call.callid, { preparedfortranscript: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Erreur préparation:", errorMessage);
      showMessage(`❌ Erreur lors de la préparation: ${errorMessage}`);
    }
  };

  const handleDeleteClick = (call: Call) => {
    console.log("🗑️ Demande de suppression pour appel:", call.callid);
    setCallToDelete(call);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setCallToDelete(null);
  };

  // ✅ NOUVELLE VERSION: Support des options avancées
  const handleDeleteConfirm = async (call: Call, options?: DeleteOptions) => {
    if (!call) return;

    setIsDeleting(true);

    // ✅ Options par défaut si non spécifiées (mode standard)
    const deleteOptions: DeleteOptions = options || { mode: "standard" };

    console.log(
      `🗑️ Suppression confirmée pour appel: ${call.callid}`,
      deleteOptions
    );

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { deleteCallCompletely } = await import(
        "../../utils/deleteCallCompletely"
      );

      const result = await deleteCallCompletely(call.callid, deleteOptions);

      if (result.success) {
        // ✅ Messages de succès améliorés
        let successMessage = result.message;

        if (result.details?.convertedCall) {
          // Cas de conversion
          successMessage = `🔄 Appel ${call.callid} converti avec succès`;

          if (result.details.deletedResources?.length > 0) {
            successMessage += `\n🗑️ Supprimé: ${result.details.deletedResources.join(
              ", "
            )}`;
          }

          if (result.details.keptResources?.length > 0) {
            successMessage += `\n💾 Conservé: ${result.details.keptResources.join(
              ", "
            )}`;
          }

          // ✅ Pour une conversion, on peut choisir de garder l'appel dans la liste
          // ou de le retirer selon votre logique métier
          // Ici on le retire de la liste même s'il est converti
          removeCall(call.callid);
        } else {
          // Cas de suppression normale
          if (deleteOptions.mode === "standard") {
            successMessage += `\n📊 Données de tagging conservées pour les statistiques`;
          }

          removeCall(call.callid);
        }

        showMessage(successMessage);
        setDeleteDialogOpen(false);
        setCallToDelete(null);
      } else {
        // ✅ Gestion d'erreur améliorée
        let errorMessage = `❌ ${result.message}`;

        if (result.debugInfo?.suggestion) {
          errorMessage += `\n💡 ${result.debugInfo.suggestion}`;
        }

        if (result.debugInfo?.allDetectedConstraints?.length > 0) {
          errorMessage += `\n🔍 Contraintes: ${result.debugInfo.allDetectedConstraints.join(
            ", "
          )}`;
        }

        showMessage(errorMessage);
        console.error("❌ Erreur détaillée:", result);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showMessage(`❌ Erreur lors de la suppression: ${errorMessage}`);
      console.error("❌ Exception:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewContent = (call: Call) => {
    console.log("👁️ Voir contenu de l'appel:", call.callid);
    setSelectedCall(call);
  };

  const handleStatusChange = async (
    call: Call,
    newStatus: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ) => {
    try {
      const { supabase } = await import("@/lib/supabaseClient");

      const { error } = await supabase
        .from("call")
        .update({ status: newStatus })
        .eq("callid", call.callid);

      if (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
        return;
      }

      updateCall(call.callid, { status: newStatus });

      if (selectedCall?.callid === call.callid) {
        setSelectedCall((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Erreur inattendue lors de la mise à jour :", errorMessage);
    }
  };

  const handleCloseDialog = () => {
    setSelectedCall(null);
  };

  return {
    selectedCall,
    deleteDialogOpen,
    callToDelete,
    isDeleting,
    handlePrepareCall,
    handleDeleteClick,
    handleDeleteConfirm, // ✅ Maintenant compatible avec les nouvelles options
    handleDeleteDialogClose,
    handleViewContent,
    handleStatusChange,
    handleCloseDialog,
  };
};

// ✅ HELPERS pour créer les options rapidement (compatibles avec votre structure)
export const createDeleteOptions = {
  standard: (): DeleteOptions => ({ mode: "standard" }),

  complete: (): DeleteOptions => ({
    mode: "complete",
    confirmCompleteDelete: true,
  }),

  custom: (options: {
    deleteAudio?: boolean;
    deleteTranscription?: boolean;
    deleteTagging?: boolean;
  }): DeleteOptions => ({
    mode: "custom",
    customOptions: {
      deleteAudio: options.deleteAudio ?? true,
      deleteTranscription: options.deleteTranscription ?? true,
      deleteTagging: options.deleteTagging ?? false, // ✅ Par défaut, conserver les tags
    },
  }),

  // ✅ Presets utiles
  onlyTagging: (): DeleteOptions => ({
    mode: "custom",
    customOptions: {
      deleteAudio: false,
      deleteTranscription: false,
      deleteTagging: true,
    },
  }),

  keepTagsOnly: (): DeleteOptions => ({
    mode: "custom",
    customOptions: {
      deleteAudio: true,
      deleteTranscription: true,
      deleteTagging: false,
    },
  }),
};

// ✅ TYPES EXPORTÉS
export type { DeleteOptions };
