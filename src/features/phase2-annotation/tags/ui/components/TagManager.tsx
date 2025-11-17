import { useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import {
  Box,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import { useTaggingData } from "@/features/shared/context";
import supabase from "@/lib/supabaseClient";
import TagUsageStats from "./TagUsageStats"; // ✅ Import du composant factorisé

// ========================================
// INTERFACES TYPESCRIPT
// ========================================

interface LPLTag {
  id?: number;
  label: string;
  family: string;
  color: string;
  description?: string | null; // ✅ Accepte null ET undefined
}

interface TagManagerProps {
  onClose?: () => void;
}

interface GroupedTags {
  ENGAGEMENT: LPLTag[];
  REFLET: LPLTag[];
  EXPLICATION: LPLTag[];
  OUVERTURE: LPLTag[];
  CLIENT: LPLTag[];
  OTHERS: LPLTag[];
}

interface TagReferences {
  tagReferences: number;
  nextTurnTagReferences: number;
  totalReferences: number;
}

interface DeleteAction {
  type: "cancel" | "reassign" | "clean" | "force";
  targetTag?: string;
}

// ✅ RENOMMAGE pour éviter le conflit avec le composant importé
interface TagUsageData {
  totalUsage: number;
  asTag: number;
  asNextTurnTag: number;
  examples: {
    verbatim: string;
    next_turn_verbatim: string;
    call_id: string;
    speaker: string;
    context: "tag" | "next_turn_tag";
  }[];
  speakers: string[];
  callsCount: number;
  avgDuration: number;
}

interface TagStatsDisplay {
  tagId: number;
  tagLabel: string;
  stats: TagUsageData; // ✅ Utilise la nouvelle interface
  isLoading: boolean;
  error: string | null;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

const TagManager: React.FC<TagManagerProps> = ({ onClose }) => {
  const { tags, setTags, fetchTaggedTurns, callId } = useTaggingData();

  const [newLPLTag, setNewLPLTag] = useState<LPLTag>({
    label: "",
    family: "",
    color: "#6c757d",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tagStatsDisplay, setTagStatsDisplay] =
    useState<TagStatsDisplay | null>(null);

  const resetForm = () => {
    setNewLPLTag({
      label: "",
      family: "",
      color: "#6c757d",
      description: "",
    });
    setIsEditing(false);
    setTagStatsDisplay(null);
    console.log("🔄 Formulaire réinitialisé");
  };

  const handleFamilyChange = (family: string) => {
    const defaultColors: Record<string, string> = {
      ENGAGEMENT: "#28a745",
      REFLET: "#28a745",
      EXPLICATION: "#dc3545",
      OUVERTURE: "#28a745",
      OTHERS: "#6c757d",
    };

    setNewLPLTag((prev) => ({
      ...prev,
      family,
      color: defaultColors[family] || "#6c757d",
    }));
  };

  // ✅ NOUVEAU - État pour les notifications
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
  });

  const [isSaving, setIsSaving] = useState(false); // État de chargement

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const cleanTagObject = (tag: LPLTag): Omit<LPLTag, "id"> => {
    const { label, family, color, description } = tag;
    return {
      label: label.trim(),
      family: family.trim(),
      color,
      description: description?.trim(),
    };
  };

  const getTagDetailedStats = async (
    tagLabel: string
  ): Promise<TagUsageData> => {
    try {
      console.log(`📊 Récupération des stats détaillées pour: "${tagLabel}"`);

      const { data: tagUsages, error: tagError } = await supabase
        .from("turntagged")
        .select(
          `
          id,
          call_id,
          verbatim,
          next_turn_verbatim,
          speaker,
          start_time,
          end_time,
          tag,
          next_turn_tag
        `
        )
        .or(`tag.eq.${tagLabel},next_turn_tag.eq.${tagLabel}`)
        .order("call_id", { ascending: true })
        .limit(100);

      if (tagError) throw tagError;

      const examples: TagUsageData["examples"] = [];
      const speakers = new Set<string>();
      const calls = new Set<string>();
      let asTag = 0;
      let asNextTurnTag = 0;
      let totalDuration = 0;

      tagUsages?.forEach((usage) => {
        if (usage.tag === tagLabel) {
          asTag++;
          examples.push({
            verbatim: usage.verbatim || "",
            next_turn_verbatim: usage.next_turn_verbatim || "",
            call_id: usage.call_id,
            speaker: usage.speaker || "Inconnu",
            context: "tag",
          });
        }

        if (usage.next_turn_tag === tagLabel) {
          asNextTurnTag++;
          examples.push({
            verbatim: usage.verbatim || "",
            next_turn_verbatim: usage.next_turn_verbatim || "",
            call_id: usage.call_id,
            speaker: usage.speaker || "Inconnu",
            context: "next_turn_tag",
          });
        }

        if (usage.speaker) speakers.add(usage.speaker);
        if (usage.call_id) calls.add(usage.call_id);

        if (usage.start_time && usage.end_time) {
          totalDuration += usage.end_time - usage.start_time;
        }
      });

      const limitedExamples = examples
        .filter((ex) => ex.verbatim.trim() !== "")
        .slice(0, 5);

      const stats: TagUsageData = {
        totalUsage: asTag + asNextTurnTag,
        asTag,
        asNextTurnTag,
        examples: limitedExamples,
        speakers: Array.from(speakers),
        callsCount: calls.size,
        avgDuration: totalDuration / Math.max(tagUsages?.length || 1, 1),
      };

      console.log(`✅ Stats récupérées pour "${tagLabel}":`, stats);
      return stats;
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      throw error;
    }
  };

  const showTagStats = async (tag: LPLTag) => {
    if (!tag.id || !tag.label) return;

    setTagStatsDisplay({
      tagId: tag.id,
      tagLabel: tag.label,
      stats: {
        totalUsage: 0,
        asTag: 0,
        asNextTurnTag: 0,
        examples: [],
        speakers: [],
        callsCount: 0,
        avgDuration: 0,
      },
      isLoading: true,
      error: null,
    });

    try {
      const stats = await getTagDetailedStats(tag.label);

      setTagStatsDisplay({
        tagId: tag.id,
        tagLabel: tag.label,
        stats,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setTagStatsDisplay({
        tagId: tag.id,
        tagLabel: tag.label,
        stats: {
          totalUsage: 0,
          asTag: 0,
          asNextTurnTag: 0,
          examples: [],
          speakers: [],
          callsCount: 0,
          avgDuration: 0,
        },
        isLoading: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  const checkTagReferences = async (label: string): Promise<TagReferences> => {
    try {
      console.log(`🔍 Vérification des références pour: "${label}"`);

      const { count: tagCount } = await supabase
        .from("turntagged")
        .select("*", { count: "exact", head: true })
        .eq("tag", label);

      const { count: nextTurnTagCount } = await supabase
        .from("turntagged")
        .select("*", { count: "exact", head: true })
        .eq("next_turn_tag", label);

      const result: TagReferences = {
        tagReferences: tagCount || 0,
        nextTurnTagReferences: nextTurnTagCount || 0,
        totalReferences: (tagCount || 0) + (nextTurnTagCount || 0),
      };

      console.log(`📊 Références trouvées pour "${label}":`, result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la vérification des références:", error);
      return { tagReferences: 0, nextTurnTagReferences: 0, totalReferences: 0 };
    }
  };

  // ✅ FONCTION DE VALIDATION
  const validateTag = (tag: LPLTag): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validation du label (obligatoire)
    if (!tag.label || tag.label.trim().length === 0) {
      errors.push("Le nom du tag est obligatoire");
    } else if (tag.label.trim().length < 2) {
      errors.push("Le nom du tag doit contenir au moins 2 caractères");
    } else if (tag.label.trim().length > 50) {
      errors.push("Le nom du tag ne peut pas dépasser 50 caractères");
    }

    // Validation de la famille (obligatoire)
    if (!tag.family || tag.family.trim().length === 0) {
      errors.push("La famille est obligatoire");
    }

    // Validation de la couleur
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!tag.color || !colorRegex.test(tag.color)) {
      errors.push("La couleur doit être au format hexadécimal (#000000)");
    }

    // Validation de la description (optionnelle mais si présente, limitée)
    if (tag.description && tag.description.length > 255) {
      errors.push("La description ne peut pas dépasser 255 caractères");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // ✅ FONCTION DE VÉRIFICATION DES DOUBLONS
  const checkDuplicateTag = async (
    label: string,
    excludeId?: number
  ): Promise<boolean> => {
    try {
      let query = supabase
        .from("lpltag")
        .select("id, label")
        .ilike("label", label); // Recherche insensible à la casse

      // Exclure l'ID actuel en cas d'édition
      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur lors de la vérification des doublons:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Erreur lors de la vérification des doublons:", error);
      return false;
    }
  };

  // ✅ FONCTION DE NOTIFICATION
  const showNotification = (
    message: string,
    severity: NotificationState["severity"] = "info"
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // ========================================
  // HANDLERS (fonctions existantes abrégées pour l'exemple)
  // ========================================

  const handleEditLPLTag = async (tag: any) => {
    console.log("Édition du tag:", tag);

    const cleanedTag: LPLTag = {
      id: tag.id,
      label: (tag.label || "").trim(),
      family: (tag.family || "").trim(),
      color: tag.color || "#6c757d",
      description: (tag.description || "").trim(),
    };

    setNewLPLTag(cleanedTag);
    setIsEditing(true);
    await showTagStats(cleanedTag);

    console.log("Tag nettoyé pour édition:", cleanedTag);
  };

  // ✅ IMPLÉMENTATION COMPLÈTE DE handleSaveLPLTag
  const handleSaveLPLTag = async () => {
    setIsSaving(true);

    try {
      console.log("🚀 Début de sauvegarde du tag:", newLPLTag);

      // 1. NETTOYAGE DES DONNÉES
      const cleanedTag: LPLTag = {
        ...newLPLTag,
        label: newLPLTag.label.trim(),
        family: newLPLTag.family.trim(),
        description: newLPLTag.description?.trim() || null,
      };

      // 2. VALIDATION
      const validation = validateTag(cleanedTag);
      if (!validation.isValid) {
        showNotification(
          `Erreurs de validation: ${validation.errors.join(", ")}`,
          "error"
        );
        return;
      }

      // 3. VÉRIFICATION DES DOUBLONS
      const isDuplicate = await checkDuplicateTag(
        cleanedTag.label,
        cleanedTag.id
      );
      if (isDuplicate) {
        showNotification(
          `Un tag avec le nom "${cleanedTag.label}" existe déjà`,
          "warning"
        );
        return;
      }

      // 4. PRÉPARATION DES DONNÉES POUR SUPABASE
      const tagData = {
        label: cleanedTag.label,
        description: cleanedTag.description,
        family: cleanedTag.family,
        color: cleanedTag.color,
        // Valeurs par défaut pour les nouveaux champs
        icon: null, // Pas d'icône par défaut
        originespeaker: "conseiller", // Valeur par défaut - ajustez selon vos besoins
        // created_at sera automatiquement défini par Supabase
      };

      let result;

      // 5. INSERTION OU MISE À JOUR
      if (isEditing && cleanedTag.id) {
        // ✅ MODE ÉDITION
        console.log(`📝 Mise à jour du tag ID ${cleanedTag.id}`);

        result = await supabase
          .from("lpltag")
          .update(tagData)
          .eq("id", cleanedTag.id)
          .select("*")
          .single();

        if (result.error) {
          throw new Error(
            `Erreur lors de la mise à jour: ${result.error.message}`
          );
        }

        showNotification("Tag mis à jour avec succès !", "success");
        console.log("✅ Tag mis à jour:", result.data);
      } else {
        // ✅ MODE CRÉATION
        console.log("🆕 Création d'un nouveau tag");

        result = await supabase
          .from("lpltag")
          .insert([tagData])
          .select("*")
          .single();

        if (result.error) {
          throw new Error(
            `Erreur lors de la création: ${result.error.message}`
          );
        }

        showNotification("Nouveau tag créé avec succès !", "success");
        console.log("✅ Nouveau tag créé:", result.data);
      }

      // 6. MISE À JOUR DE L'ÉTAT GLOBAL
      if (result.data) {
        // Convertir le résultat Supabase au format attendu par le context
        const updatedTag = {
          id: result.data.id,
          label: result.data.label,
          description: result.data.description,
          family: result.data.family,
          color: result.data.color,
          // Mapping des nouvelles propriétés si nécessaire
          callCount: 0, // À calculer si besoin
          turnCount: 0, // À calculer si besoin
        };

        if (isEditing) {
          // Mettre à jour le tag existant dans la liste
          setTags((prevTags) =>
            prevTags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag))
          );
        } else {
          // Ajouter le nouveau tag à la liste
          setTags((prevTags) => [...prevTags, updatedTag]);
        }

        // 7. ACTUALISER LES DONNÉES SI UN APPEL EST SÉLECTIONNÉ
        if (callId && fetchTaggedTurns) {
          console.log("🔄 Actualisation des tours taggés...");
          await fetchTaggedTurns(callId);
        }
      }

      // 8. RESET DU FORMULAIRE
      resetForm();
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de la sauvegarde";

      showNotification(`Erreur: ${errorMessage}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLPLTag = async (tagId: number) => {
    // Logique de suppression (conservée du code original)
    console.log("Suppression du tag:", tagId);
    // ... logique complète de suppression
  };

  // ========================================
  // RENDU DU COMPOSANT
  // ========================================

  const groupedTags: GroupedTags = {
    ENGAGEMENT: [],
    REFLET: [],
    EXPLICATION: [],
    OUVERTURE: [],
    CLIENT: [],
    OTHERS: [],
  };

  const convertTagToLPLTag = (tag: any): LPLTag => {
    return {
      id: tag.id,
      label: (tag.label || "").trim(),
      family: (tag.family || "").trim(),
      color: tag.color || "#6c757d",
      description: (tag.description || "").trim(),
    };
  };

  const lplTags = tags.map(convertTagToLPLTag);
  lplTags.forEach((tag) => {
    if (tag.family === "ENGAGEMENT") {
      groupedTags.ENGAGEMENT.push(tag);
    } else if (tag.family === "REFLET") {
      groupedTags.REFLET.push(tag);
    } else if (tag.family === "EXPLICATION") {
      groupedTags.EXPLICATION.push(tag);
    } else if (tag.family === "OUVERTURE") {
      groupedTags.OUVERTURE.push(tag);
    } else if (tag.family === "CLIENT") {
      groupedTags.CLIENT.push(tag);
    } else {
      groupedTags.OTHERS.push(tag);
    }
  });

  const renderTagGrid = (tags: LPLTag[], title: string) => (
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
                right: 54,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(0, 150, 136, 0.7)",
                },
              }}
              onClick={() => showTagStats(tag)}
              title="Voir les statistiques d'utilisation"
            >
              <InfoIcon fontSize="small" />
            </IconButton>
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
        {renderTagGrid(groupedTags.CLIENT, "CLIENT")}
        {renderTagGrid(groupedTags.OTHERS, "AUTRES")}
      </Box>

      {/* ✅ UTILISATION DU COMPOSANT FACTORISÉ */}
      {tagStatsDisplay && (
        <TagUsageStats
          tagStatsDisplay={tagStatsDisplay}
          onClose={() => setTagStatsDisplay(null)}
        />
      )}

      <Accordion sx={{ marginTop: 4 }} expanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {isEditing ? "Éditer le Tag" : "Ajouter un nouveau Tag"}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Label *"
            value={newLPLTag.label}
            onChange={(e) =>
              setNewLPLTag((prev) => ({ ...prev, label: e.target.value }))
            }
            fullWidth
            required
            error={newLPLTag.label.length > 50}
            helperText={`${newLPLTag.label.length}/50 caractères`}
            sx={{ marginBottom: 2 }}
          />

          <TextField
            label="Famille *"
            select
            value={newLPLTag.family}
            onChange={(e) => handleFamilyChange(e.target.value)}
            fullWidth
            required
            sx={{ marginBottom: 2 }}
          >
            <MenuItem value="ENGAGEMENT">ENGAGEMENT</MenuItem>
            <MenuItem value="REFLET">REFLET</MenuItem>
            <MenuItem value="EXPLICATION">EXPLICATION</MenuItem>
            <MenuItem value="OUVERTURE">OUVERTURE</MenuItem>
            <MenuItem value="CLIENT">CLIENT</MenuItem>
            <MenuItem value="OTHERS">AUTRES</MenuItem>
          </TextField>

          <TextField
            label="Couleur"
            type="color"
            value={newLPLTag.color}
            onChange={(e) =>
              setNewLPLTag((prev) => ({ ...prev, color: e.target.value }))
            }
            fullWidth
            sx={{ marginBottom: 2 }}
          />

          <TextField
            label="Description (optionnelle)"
            value={newLPLTag.description || ""}
            onChange={(e) =>
              setNewLPLTag((prev) => ({ ...prev, description: e.target.value }))
            }
            fullWidth
            multiline
            rows={2}
            error={(newLPLTag.description?.length || 0) > 255}
            helperText={`${newLPLTag.description?.length || 0}/255 caractères`}
            sx={{ marginBottom: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveLPLTag}
              disabled={
                isSaving || !newLPLTag.label.trim() || !newLPLTag.family.trim()
              }
            >
              {isSaving
                ? "Sauvegarde..."
                : isEditing
                ? "Sauvegarder"
                : "Ajouter"}
            </Button>
            {isEditing && (
              <Button
                variant="outlined"
                color="error"
                onClick={resetForm}
                disabled={isSaving}
              >
                Annuler
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {onClose && (
        <Button variant="outlined" onClick={onClose} sx={{ marginTop: 2 }}>
          Retour
        </Button>
      )}
    </Box>
  );
};

export default TagManager;
