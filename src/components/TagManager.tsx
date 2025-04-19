import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SketchPicker } from "react-color";
import { useTaggingData } from "../context/TaggingDataContext";
import { supabase } from "../supabaseClient";

// Interfaces TypeScript
interface Tag {
  id?: number;
  label: string;
  family: string;
  color: string;
  description?: string;
}

interface TagManagerProps {
  onClose?: () => void;
}

interface GroupedTags {
  ENGAGEMENT: Tag[];
  REFLET: Tag[];
  EXPLICATION: Tag[];
  OUVERTURE: Tag[];
  CLIENT: Tag[];
  OTHERS: Tag[];
}

const TagManager: React.FC<TagManagerProps> = ({ onClose }) => {
  const { tags, setTags, fetchTaggedTurns, callId } = useTaggingData();

  const [newLPLTag, setNewLPLTag] = useState<Tag>({
    label: "",
    family: "",
    color: "#6c757d", // Couleur par défaut : gris
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const resetForm = () => {
    setNewLPLTag({ label: "", family: "", color: "#6c757d" });
    setIsEditing(false);
  };

  const handleFamilyChange = (family: string) => {
    const defaultColors: Record<string, string> = {
      ENGAGEMENT: "#28a745", // Vert
      REFLET: "#28a745", // Vert
      EXPLICATION: "#dc3545", // Rouge
      OUVERTURE: "#28a745", // Vert
      OTHERS: "#6c757d", // Gris
    };

    setNewLPLTag((prev) => ({
      ...prev,
      family,
      color: defaultColors[family] || "#6c757d", // Définit la couleur par défaut
    }));
  };

  const handleSaveLPLTag = async () => {
    console.log("Objet envoyé pour sauvegarde :", newLPLTag);

    if (!newLPLTag.label || !newLPLTag.color) {
      alert("Le label et la couleur sont requis !");
      return;
    }

    try {
      if (isEditing && newLPLTag.id) {
        // Mise à jour d'un tag existant
        console.log("Mise à jour d'un tag existant :", newLPLTag);

        const { data, error } = await supabase
          .from("lpltag")
          .update(cleanTagObject(newLPLTag))
          .eq("id", newLPLTag.id)
          .select();

        if (error) throw error;

        // Mettre à jour les tags locaux
        setTags((prevTags) =>
          prevTags.map((tag) => (tag.id === newLPLTag.id ? data[0] : tag))
        );

        // **Rafraîchir les tours après mise à jour**
        if (callId) {
          await fetchTaggedTurns(callId);
        }
      } else {
        // Création d'un nouveau tag
        console.log("Création d'un nouveau tag :", newLPLTag);
        console.log("Objet envoyé à Supabase :", cleanTagObject(newLPLTag));

        const { data, error } = await supabase
          .from("lpltag")
          .insert([cleanTagObject(newLPLTag)])
          .select();

        if (error) throw error;

        setTags((prevTags) => [...prevTags, data[0]]);
      }

      resetForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du tag :", error);
    }
  };

  const handleEditLPLTag = (tag: Tag) => {
    setNewLPLTag(tag);
    setIsEditing(true);
  };

  const handleDeleteLPLTag = async (tagId: number) => {
    try {
      const { error } = await supabase.from("lpltag").delete().eq("id", tagId);

      if (error) throw error;

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId));

      // **Rafraîchir les tours après suppression**
      if (callId) {
        await fetchTaggedTurns(callId);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du tag :", error);
    }
  };

  const cleanTagObject = (tag: Tag): Omit<Tag, "id"> => {
    const { label, family, color, description } = tag; // Liste des colonnes valides
    return { label, family, color, description }; // Ne garde que les colonnes nécessaires
  };

  const groupedTags: GroupedTags = tags.reduce(
    (acc: GroupedTags, tag) => {
      if (
        ["ENGAGEMENT", "REFLET", "EXPLICATION", "OUVERTURE", "CLIENT"].includes(
          tag.family
        )
      ) {
        acc[tag.family as keyof GroupedTags].push(tag);
      } else {
        acc.OTHERS.push(tag);
      }
      return acc;
    },
    {
      ENGAGEMENT: [],
      REFLET: [],
      EXPLICATION: [],
      OUVERTURE: [],
      CLIENT: [],
      OTHERS: [],
    }
  );

  const renderTagGrid = (tags: Tag[], title: string) => (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            title === "CLIENT"
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "8px",
        }}
      >
        {tags.map((tag) => (
          <Box
            key={tag.id}
            sx={{
              position: "relative",
              backgroundColor: tag.color,
              borderRadius: 1,
              padding: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              textAlign: "center",
              height: "60px",
              color: "#fff",
              fontSize: "0.875rem",
              overflow: "hidden",
            }}
          >
            {tag.label}
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 2,
                right: 28,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 255, 0.7)",
                },
              }}
              onClick={() => handleEditLPLTag(tag)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(255, 0, 0, 0.7)",
                },
              }}
              onClick={() => tag.id && handleDeleteLPLTag(tag.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "repeat(5, auto)",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {renderTagGrid(groupedTags.ENGAGEMENT, "ENGAGEMENT")}
          {renderTagGrid(groupedTags.REFLET, "REFLET")}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {renderTagGrid(groupedTags.EXPLICATION, "EXPLICATION")}
          {renderTagGrid(groupedTags.OUVERTURE, "OUVERTURE")}
        </Box>
        {/* Troisième ligne : CLIENT */}

        {renderTagGrid(groupedTags.CLIENT, "CLIENT")}
        {/* Quatrième ligne : AUTRES */}
        {renderTagGrid(groupedTags.OTHERS, "AUTRES")}
      </Box>

      <Accordion sx={{ marginTop: 4 }} expanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {isEditing ? "Éditer le Tag" : "Ajouter un nouveau Tag"}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Label"
            value={newLPLTag.label}
            onChange={(e) =>
              setNewLPLTag((prev) => ({ ...prev, label: e.target.value }))
            }
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Famille"
            value={newLPLTag.family}
            onChange={(e) => handleFamilyChange(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
            Couleur
          </Typography>
          <SketchPicker
            color={newLPLTag.color}
            onChangeComplete={(color) =>
              setNewLPLTag((prev) => ({ ...prev, color: color.hex }))
            }
          />
          <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
            <Button variant="contained" onClick={handleSaveLPLTag}>
              {isEditing ? "Sauvegarder" : "Ajouter"}
            </Button>
            {isEditing && (
              <Button variant="outlined" color="error" onClick={resetForm}>
                Annuler
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {onClose && (
        <Button variant="outlined" onClick={onClose} sx={{ marginTop: 2 }}>
          Retour
        </Button>
      )}
    </Box>
  );
};

export default TagManager;
