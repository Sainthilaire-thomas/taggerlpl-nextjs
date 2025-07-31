// hooks/useCallActions.ts
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

interface UseCallActionsReturn {
  selectedCall: Call | null;
  deleteDialogOpen: boolean;
  callToDelete: Call | null;
  isDeleting: boolean;
  handlePrepareCall: (call: Call) => Promise<void>;
  handleDeleteClick: (call: Call) => void;
  handleDeleteConfirm: (call: Call) => Promise<void>; // ✅ Type unifié
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

  // ✅ CORRECTION: Type de paramètre unifié
  const handleDeleteConfirm = async (call: Call) => {
    if (!call) return;

    setIsDeleting(true);
    console.log("🗑️ Suppression confirmée pour appel:", call.callid);

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { deleteCallCompletely } = await import(
        "../../utils/deleteCallCompletely"
      );
      const result = await deleteCallCompletely(call.callid);

      if (result.success) {
        removeCall(call.callid);
        showMessage(result.message);
        setDeleteDialogOpen(false);
        setCallToDelete(null);
      } else {
        showMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showMessage(`❌ Erreur lors de la suppression: ${errorMessage}`);
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
    handleDeleteConfirm,
    handleDeleteDialogClose,
    handleViewContent,
    handleStatusChange,
    handleCloseDialog,
  };
};
