import { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import supabase from "@/lib/supabaseClient";

// Définition des interfaces TypeScript
interface TurnTag {
  id: number;
  call_id: number;
  tag?: string;
  verbatim?: string;
  next_turn_tag?: string;
  next_turn_verbatim?: string;
}

interface TurnTagEditorProps {
  turnTag: TurnTag;
  onClose: () => void;
}

interface TagData {
  label: string;
}

const TurnTagEditor: React.FC<TurnTagEditorProps> = ({ turnTag, onClose }) => {
  const [editedTag, setEditedTag] = useState<string>("");
  const [editedVerbatim, setEditedVerbatim] = useState<string>("");
  const [editedNextTurnTag, setEditedNextTurnTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]); // Tags valides

  // Récupérer les tags valides de la table `lpltag`
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase.from("lpltag").select("label");
        if (error) {
          console.error("Erreur lors du fetch des tags :", error.message);
          return;
        }
        setAvailableTags(data?.map((tag: TagData) => tag.label) || []); // Stocker les labels
      } catch (err) {
        console.error(
          "Erreur inattendue lors du fetch des tags :",
          err instanceof Error ? err.message : String(err)
        );
      }
    };

    fetchTags();
  }, []);

  // Synchroniser les valeurs locales avec les données de turnTag
  useEffect(() => {
    if (turnTag) {
      setEditedTag(turnTag.tag || "");
      setEditedVerbatim(turnTag.verbatim || "");
      setEditedNextTurnTag(turnTag.next_turn_tag || "");
    }
  }, [turnTag]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("turntagged")
        .update({
          tag: editedTag,
          verbatim: editedVerbatim,
          next_turn_tag: editedNextTurnTag,
        })
        .eq("id", turnTag.id);

      if (error) {
        console.error("Erreur lors de la mise à jour :", error.message);
        return;
      }

      console.log("Mise à jour réussie :", {
        editedTag,
        editedVerbatim,
        editedNextTurnTag,
      });

      // Recharger les données si nécessaire
      setEditedTag("");
      setEditedVerbatim("");
      setEditedNextTurnTag("");

      // Fermer le dialogue après la sauvegarde réussie
      onClose();
    } catch (err) {
      console.error(
        "Erreur inattendue lors de la mise à jour :",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Éditer TurnTag</DialogTitle>
      <DialogContent>
        {/* Informations non éditables */}
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            ID : {turnTag.id}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Call ID : {turnTag.call_id}
          </Typography>
        </Box>

        {/* Sélecteur de tag */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Tag</InputLabel>
          <Select
            value={editedTag}
            onChange={(e) => setEditedTag(e.target.value as string)}
            label="Tag"
          >
            {availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Champ de texte éditable pour le verbatim */}
        <TextField
          label="Verbatim"
          value={editedVerbatim}
          onChange={(e) => setEditedVerbatim(e.target.value)}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />

        {/* Champ de texte éditable pour le prochain tag */}
        <TextField
          label="Next Turn Tag"
          value={editedNextTurnTag}
          onChange={(e) => setEditedNextTurnTag(e.target.value)}
          fullWidth
          margin="normal"
        />

        {/* Champ de texte en lecture seule pour le prochain verbatim */}
        <TextField
          label="Next Turn Verbatim"
          value={turnTag.next_turn_verbatim || "Aucun verbatim disponible"}
          fullWidth
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
        />
      </DialogContent>

      {/* Actions (boutons Annuler et Sauvegarder) */}
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TurnTagEditor;
