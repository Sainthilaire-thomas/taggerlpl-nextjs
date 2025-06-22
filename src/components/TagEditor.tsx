"use client"; // Nécessaire pour les composants interactifs dans Next.js

import { useState, useEffect, FC } from "react";
import { Box, TextField, Button, MenuItem } from "@mui/material";
import { supabase } from "@/lib/supabaseClient"; // Adapté pour Next.js avec chemins d'alias

// Définition de l'interface pour Tag
interface Tag {
  id?: number;
  label: string; // ✅ Obligatoire, pas optionnel
  description?: string;
  family?: string;
  color?: string;
  callCount?: number;
  turnCount?: number;
}

// Définition des props pour le composant
interface TagEditorProps {
  tag?: Tag;
  onUpdate: (updatedTag: Tag) => Promise<void>; // ✅ Ajout Promise<void>
  onCancel: () => void;
}

const TagEditor: FC<TagEditorProps> = ({ tag, onUpdate, onCancel }) => {
  // ✅ Supprimez = {}
  console.log("tag dans TagEditor", tag);

  const [name, setName] = useState<string>(tag?.label || "");
  const [description, setDescription] = useState<string>(
    tag?.description || ""
  );
  const [family, setFamily] = useState<string>(tag?.family || "");
  const [color, setColor] = useState<string>(tag?.color || "#000000");
  const [families, setFamilies] = useState<string[]>([]); // État pour stocker les familles

  useEffect(() => {
    console.log("Tag chargé dans TagEditor :", tag);
    setName(tag?.label || "");
    setColor(tag?.color || "#000000");
    setDescription(tag?.description || "");
    setFamily(tag?.family || ""); // Charger la famille existante
  }, [tag]);

  // Charger les familles disponibles
  useEffect(() => {
    const fetchFamilies = async () => {
      const { data, error } = await supabase
        .from("lpltag")
        .select("family")
        .neq("family", null) // Ignorer les valeurs null
        .order("family", { ascending: true }); // Trier les familles

      if (error) {
        console.error("Erreur lors de la récupération des familles :", error);
        return;
      }

      // Extraire les familles uniques
      const uniqueFamilies = [...new Set(data.map((item) => item.family))];
      setFamilies(uniqueFamilies);
    };

    fetchFamilies();
  }, []);

  const handleSave = () => {
    if (!family) {
      alert("La famille est obligatoire pour le tag !");
      return;
    }

    onUpdate({
      ...tag, // ✅ Spread de tag (peut être undefined)
      label: name,
      color,
      description,
      family, // Inclure la famille lors de la sauvegarde
    } as Tag); // ✅ Cast explicite en Tag
  };

  const availableFamilies =
    family && !families.includes(family) ? [family, ...families] : families;

  return (
    <Box
      sx={{
        maxWidth: "600px",
        margin: "auto",
        padding: 2,
        backgroundColor: "#1e1e1e",
        borderRadius: "8px",
      }}
    >
      <TextField
        label="Nom du Tag"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        label="Description"
        fullWidth
        margin="normal"
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <TextField
        label="Famille"
        select
        fullWidth
        margin="normal"
        value={family}
        onChange={(e) => setFamily(e.target.value)}
      >
        {availableFamilies.map((fam, index) => (
          <MenuItem key={index} value={fam}>
            {fam}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Couleur"
        fullWidth
        margin="normal"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />

      <Box
        sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}
      >
        <Button variant="contained" color="primary" onClick={handleSave}>
          Sauvegarder
        </Button>
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </Box>
    </Box>
  );
};

export default TagEditor;
