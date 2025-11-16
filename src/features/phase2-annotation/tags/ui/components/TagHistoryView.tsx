"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

// Types
interface TagModification {
  id: number;
  action: string;
  old_tag: string;
  new_tag: string | null;
  modified_at: string;
  modified_by: string;
  previous_data: {
    turntagged: any[];
    lpltag: any;
  };
}

export default function TagHistoryView() {
  const [modifications, setModifications] = useState<TagModification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    loadModifications();
  }, []);

  const loadModifications = async (): Promise<void> => {
    setLoading(true);
    try {
      const history = await fetchModifications();
      setModifications(history);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchModifications = async (): Promise<TagModification[]> => {
    try {
      const { data, error } = await supabase
        .from("tag_modifications")
        .select("*")
        .order("modified_at", { ascending: false }); // Trier par date dÃ©croissante

      if (error) {
        console.error(
          "Erreur lors de la rÃ©cupÃ©ration des modifications :",
          error.message
        );
        return [];
      }

      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur inattendue :", errorMessage);
      return [];
    }
  };

  const restoreTagChanges = async (modificationId: number): Promise<void> => {
    setRestoringId(modificationId);
    setRestoring(true);

    try {
      // RÃ©cupÃ©rer la modification
      const { data: modification, error } = await supabase
        .from("tag_modifications")
        .select("*")
        .eq("id", modificationId)
        .single();

      if (error) {
        console.error(
          "Erreur lors de la rÃ©cupÃ©ration de la modification :",
          error.message
        );
        return;
      }

      const { lpltag, turntagged } = modification.previous_data;

      // Restaurer lpltag
      if (lpltag) {
        const { error: lpltagRestoreError } = await supabase
          .from("lpltag")
          .upsert(lpltag);

        if (lpltagRestoreError) {
          console.error(
            "Erreur lors de la restauration de lpltag :",
            lpltagRestoreError.message
          );
          return;
        }
        console.log(`Tag restaurÃ© dans lpltag : ${lpltag.label}`);
      }

      // Filtrer les champs valides de turntagged
      if (turntagged && turntagged.length > 0) {
        const validTurntaggedFields = [
          "id",
          "call_id",
          "start_time",
          "end_time",
          "tag",
          "verbatim",
          "date",
          "next_turn_tag",
          "next_turn_verbatim",
          "speaker",
        ];

        const filteredTurntagged = turntagged.map(
          (entry: Record<string, any>) =>
            Object.keys(entry)
              .filter((key) => validTurntaggedFields.includes(key))
              .reduce((obj: Record<string, any>, key) => {
                obj[key] = entry[key];
                return obj;
              }, {})
        );

        // Restaurer turntagged
        const { error: turntaggedRestoreError } = await supabase
          .from("turntagged")
          .upsert(filteredTurntagged);

        if (turntaggedRestoreError) {
          console.error(
            "Erreur lors de la restauration des donnÃ©es dans turntagged :",
            turntaggedRestoreError.message
          );
          return;
        }
        console.log(
          `DonnÃ©es restaurÃ©es dans turntagged pour le tag ${lpltag?.label}`
        );
      }

      console.log(
        `Restauration effectuÃ©e avec succÃ¨s pour la modification ID ${modificationId}.`
      );

      // Recharger les modifications aprÃ¨s restauration
      loadModifications();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error(
        "Erreur inattendue lors de la restauration :",
        errorMessage
      );
      setError("Erreur lors de la restauration: " + errorMessage);
    } finally {
      setRestoring(false);
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Historique des Modifications
      </Typography>

      <Button
        variant="outlined"
        color="primary"
        onClick={loadModifications}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        RafraÃ®chir l'historique
      </Button>

      {modifications.length > 0 ? (
        <Paper elevation={2} sx={{ p: 2 }}>
          <List>
            {modifications.map((modification) => (
              <ListItem
                key={modification.id}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  mb: 2,
                  borderLeft: "4px solid",
                  borderColor:
                    modification.action === "rename"
                      ? "info.main"
                      : modification.action === "merge"
                      ? "warning.main"
                      : "error.main",
                  pl: 2,
                }}
              >
                <Typography variant="h6">
                  Action : {modification.action}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    my: 1,
                    width: "100%",
                  }}
                >
                  <Typography variant="body1">
                    <strong>Ancien Tag :</strong> {modification.old_tag}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Nouveau Tag :</strong>{" "}
                    {modification.new_tag || "SupprimÃ©"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Date :</strong>{" "}
                    {new Date(modification.modified_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Par :</strong> {modification.modified_by}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Nb d'Ã©lÃ©ments affectÃ©s :</strong>{" "}
                    {modification.previous_data.turntagged?.length || 0}
                  </Typography>
                </Box>

                <Box sx={{ alignSelf: "flex-end", mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => restoreTagChanges(modification.id)}
                    disabled={restoring}
                    sx={{ ml: 1 }}
                  >
                    {restoring && restoringId === modification.id ? (
                      <>
                        <CircularProgress size={14} sx={{ mr: 1 }} />
                        Restauration...
                      </>
                    ) : (
                      "Restaurer"
                    )}
                  </Button>
                </Box>

                <Divider sx={{ width: "100%", mt: 2 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Alert severity="info">Aucun historique de modifications trouvÃ©.</Alert>
      )}
    </Box>
  );
}

