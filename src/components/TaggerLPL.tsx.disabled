"use client"; // Important pour identifier ce composant comme Client Component

import { useState, useEffect } from "react";
import { FC } from "react";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Badge,
  Modal,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CallUploaderTaggerLPL from "./CallUploaderTaggerLPL";
import TranscriptLPL from "./TranscriptLPL";

import { supabase } from "@/lib/supabaseClient";
import { getFamilyIcon } from "./utils/iconUtils";
import { useTheme } from "@mui/material/styles";
import TagEditor from "./TagEditor";
import TagStats from "./TagStats";
import TagAnalysisReport from "./TagAnalysisReport";
import TagAnalysisGraphs from "./TagAnalysisGraph";
import TurntaggedTable from "./TurnTaggedTable";
import {
  useTaggingData,
  type Tag,
  type TaggingCall,
  type Word,
} from "@/context/TaggingDataContext";

// Définir les interfaces
// interface Tag {
//   id?: number;
//   label: string; // ✅ Obligatoire (supprimez le ?)
//   color?: string;
//   description?: string;
//   family?: string;
//   callCount?: number;
//   turnCount?: number;
// }

interface FamilyNode {
  family: string;
  icon: string;
  children: Tag[];
}

interface TurntaggedData {
  id: string;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  date: string;
  next_turn_tag?: string;
  next_turn_verbatim?: string;
  speaker: string;
}

interface TagModification {
  id: number;
  action: string;
  old_tag: string;
  new_tag: string | null;
  modified_at: string;
  modified_by: string;
  previous_data: {
    turntagged: TurntaggedData[];
    lpltag: Tag;
  };
}

interface HtmlEventTarget extends EventTarget {
  closest(selector: string): Element | null;
}

const sortFamilies = (families: FamilyNode[]): FamilyNode[] => {
  const order: Record<string, number> = { agent: 1, client: 2, divers: 3 }; // Priorité de tri
  return families.sort((a, b) => (order[a.icon] || 4) - (order[b.icon] || 4));
};

const TaggerLPL: FC = () => {
  const theme = useTheme();
  const { selectedTaggingCall } = useTaggingData();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showTagUsage, setShowTagUsage] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [showTagStats, setShowTagStats] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [turntaggedData, setTurntaggedData] = useState<TurntaggedData[]>([]); // Données filtrées
  const [isModalTurntaggedTableOpen, setIsModalTurntaggedTableOpen] =
    useState<boolean>(false); // Contrôle du modal
  const [tagTree, setTagTree] = useState<FamilyNode[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null); // Tag en cours d'édition
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // État pour ouvrir/fermer la modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showGraphs, setShowGraphs] = useState<boolean>(false);
  const [modifications, setModifications] = useState<TagModification[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Exemple de données pour les graphiques
  const mockData = [
    { zone: "Reflet", response: "Positif", count: 45 },
    { zone: "Reflet", response: "Neutre", count: 30 },
    { zone: "Reflet", response: "Négatif", count: 25 },
    { zone: "Ouverture", response: "Positif", count: 50 },
    { zone: "Ouverture", response: "Neutre", count: 20 },
    { zone: "Ouverture", response: "Négatif", count: 30 },
    { zone: "Engagement", response: "Positif", count: 60 },
    { zone: "Engagement", response: "Neutre", count: 20 },
    { zone: "Engagement", response: "Négatif", count: 20 },
    { zone: "Explication", response: "Positif", count: 30 },
    { zone: "Explication", response: "Neutre", count: 40 },
    { zone: "Explication", response: "Négatif", count: 30 },
  ];

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const handleEditTag = (tag: Tag): void => {
    console.log("Tag sélectionné pour édition :", tag);
    if (!tag) {
      console.error("Tentative d'éditer un tag null ou indéfini !");
      return;
    }

    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleCancelEdit = (): void => {
    setEditingTag(null);
    setIsModalOpen(false); // Fermer la modal
  };

  const unifyTag = async (oldTag: Tag, newTag: Tag): Promise<void> => {
    try {
      // Récupérer les enregistrements affectés dans turntagged
      const { data: affectedTurns, error: fetchError } = await supabase
        .from("turntagged")
        .select("*")
        .or(`tag.eq.${oldTag.label},next_turn_tag.eq.${oldTag.label}`);

      if (fetchError) {
        console.error(
          "Erreur lors de la récupération des données pour sauvegarde :",
          fetchError.message
        );
        return;
      }

      // Sauvegarder les modifications
      await saveTagModification("merge", oldTag, newTag, affectedTurns || []);

      // Mettre à jour le champ `tag` dans turntagged
      const { error: updateTagError } = await supabase
        .from("turntagged")
        .update({ tag: newTag.label })
        .eq("tag", oldTag.label);

      if (updateTagError) {
        console.error(
          "Erreur lors de la mise à jour du champ `tag` dans turntagged :",
          updateTagError.message
        );
        return;
      }

      console.log(
        `Les entrées turntagged liées à "${oldTag.label}" ont été remplacées par "${newTag.label}".`
      );

      // Mettre à jour le champ `next_turn_tag` dans turntagged
      const { error: updateNextTagError } = await supabase
        .from("turntagged")
        .update({ next_turn_tag: newTag.label })
        .eq("next_turn_tag", oldTag.label);

      if (updateNextTagError) {
        console.error(
          "Erreur lors de la mise à jour du champ `next_turn_tag` dans turntagged :",
          updateNextTagError.message
        );
        return;
      }

      console.log(
        `Les entrées turntagged liées à "next_turn_tag=${oldTag.label}" ont été remplacées par "${newTag.label}".`
      );

      // Supprimer l'ancien tag de lpltag
      const { error: deleteOldTagError } = await supabase
        .from("lpltag")
        .delete()
        .eq("label", oldTag.label);

      if (deleteOldTagError) {
        console.error(
          "Erreur lors de la suppression du tag dans lpltag :",
          deleteOldTagError.message
        );
        return;
      }

      console.log(`Le tag "${oldTag.label}" a été supprimé de lpltag.`);
    } catch (err) {
      console.error(
        "Erreur inattendue lors de la fusion des tags :",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const restoreTagChanges = async (modificationId: number): Promise<void> => {
    try {
      // Récupérer la modification
      const { data: modification, error } = await supabase
        .from("tag_modifications")
        .select("*")
        .eq("id", modificationId)
        .single();

      if (error) {
        console.error(
          "Erreur lors de la récupération de la modification :",
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
        console.log(`Tag restauré dans lpltag : ${lpltag.label}`);
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
            "Erreur lors de la restauration des données dans turntagged :",
            turntaggedRestoreError.message
          );
          return;
        }
        console.log(
          `Données restaurées dans turntagged pour le tag ${lpltag?.label}`
        );
      }

      console.log(
        `Restauration effectuée avec succès pour la modification ID ${modificationId}.`
      );
    } catch (err) {
      console.error(
        "Erreur inattendue lors de la restauration :",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const fetchModifications = async (): Promise<TagModification[]> => {
    try {
      const { data, error } = await supabase
        .from("tag_modifications")
        .select("*")
        .order("modified_at", { ascending: false }); // Trier par date décroissante

      if (error) {
        console.error(
          "Erreur lors de la récupération des modifications :",
          error.message
        );
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(
        "Erreur inattendue :",
        err instanceof Error ? err.message : String(err)
      );
      return [];
    }
  };

  const loadModifications = async (): Promise<void> => {
    const history = await fetchModifications();
    setModifications(history);
  };

  // Ouvrir la modal et charger les modifications
  const handleShowHistory = async (): Promise<void> => {
    await loadModifications();
    setShowHistoryModal(true);
  };

  const saveTagModification = async (
    action: string,
    oldTag: Tag,
    newTag: Tag | null,
    affectedTurns: TurntaggedData[]
  ): Promise<void> => {
    try {
      // Récupérer les métadonnées associées à l'ancien tag dans lpltag
      const { data: oldTagData, error: oldTagError } = await supabase
        .from("lpltag")
        .select("*")
        .eq("label", oldTag.label)
        .single();

      if (oldTagError) {
        console.error(
          "Erreur lors de la récupération des métadonnées du tag :",
          oldTagError.message
        );
        return;
      }

      // Sauvegarder dans tag_modifications
      const { error: logError } = await supabase
        .from("tag_modifications")
        .insert({
          action,
          old_tag: oldTag.label,
          new_tag: newTag?.label || null,
          modified_by: "current_user", // À remplacer par l'utilisateur actuel si disponible
          previous_data: {
            turntagged: affectedTurns, // Enregistrements de turntagged affectés
            lpltag: oldTagData, // Métadonnées associées à l'ancien tag
          },
        });

      if (logError) {
        console.error(
          "Erreur lors de l'enregistrement dans tag_modifications :",
          logError.message
        );
      } else {
        console.log("Modification enregistrée dans tag_modifications.");
      }
    } catch (err) {
      console.error(
        "Erreur inattendue lors de la sauvegarde de la modification :",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const handleUpdateTag = async (updatedTag: Tag): Promise<void> => {
    if (!editingTag) {
      console.error("editingTag est null");
      return;
    }

    console.log("Mise à jour du tag :", updatedTag);

    const oldLabel = editingTag.label;
    const newLabel = updatedTag.label;

    try {
      // Vérifiez si le label a changé
      if (oldLabel !== newLabel) {
        // Récupérer les enregistrements affectés dans turntagged
        const { data: affectedTurns, error: fetchError } = await supabase
          .from("turntagged")
          .select("*")
          .or(`tag.eq.${oldLabel},next_turn_tag.eq.${oldLabel}`);

        if (fetchError) {
          console.error(
            "Erreur lors de la récupération des enregistrements affectés :",
            fetchError.message
          );
          return;
        }

        // Sauvegarder les modifications
        await saveTagModification(
          "rename",
          { id: editingTag.id, label: oldLabel }, // ✅ Structure complète
          { id: 0, label: newLabel }, // ✅ Structure complète
          affectedTurns || []
        );

        // Vérifiez si le nouveau label existe déjà
        const { data: existingTag, error: fetchExistingError } = await supabase
          .from("lpltag")
          .select("*")
          .eq("label", newLabel)
          .single();

        if (fetchExistingError && fetchExistingError.code !== "PGRST116") {
          console.error(
            "Erreur lors de la vérification du tag existant :",
            fetchExistingError.message
          );
          return;
        }

        if (existingTag) {
          console.log(
            `Un tag avec le label "${newLabel}" existe déjà. Lancement de unifyTag.`
          );
          await unifyTag(editingTag, existingTag);
          setEditingTag(null);
          setIsModalOpen(false);
          return;
        }

        // Mettre à jour le tag dans lpltag
        const { error: lpltagUpdateError } = await supabase
          .from("lpltag")
          .upsert({
            label: newLabel,
            description: updatedTag.description,
            family: updatedTag.family,
            color: updatedTag.color,
          });

        if (lpltagUpdateError) {
          console.error(
            "Erreur lors de la mise à jour ou de l'insertion dans lpltag :",
            lpltagUpdateError.message
          );
          return;
        }

        console.log(`Tag mis à jour ou inséré dans lpltag : ${newLabel}`);

        // Mettre à jour les champs dans turntagged
        const { error: turntaggedUpdateError } = await supabase
          .from("turntagged")
          .update({ tag: newLabel })
          .eq("tag", oldLabel);

        if (turntaggedUpdateError) {
          console.error(
            "Erreur lors de la mise à jour des tags dans turntagged :",
            turntaggedUpdateError.message
          );
          return;
        }

        const { error: nextTurnTagUpdateError } = await supabase
          .from("turntagged")
          .update({ next_turn_tag: newLabel })
          .eq("next_turn_tag", oldLabel);

        if (nextTurnTagUpdateError) {
          console.error(
            "Erreur lors de la mise à jour de `next_turn_tag` dans turntagged :",
            nextTurnTagUpdateError.message
          );
          return;
        }

        console.log(
          `Tags mis à jour dans turntagged : ${oldLabel} -> ${newLabel}`
        );
      }

      // Mettre à jour l'état local
      setTagTree((prevTree) =>
        prevTree.map((family) => ({
          ...family,
          children: family.children.map((child) =>
            child.label === oldLabel ? updatedTag : child
          ),
        }))
      );

      setEditingTag(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(
        "Erreur inattendue lors de la mise à jour :",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  // Fonction pour charger les données filtrées
  const fetchTurntaggedData = async (
    tag: string
  ): Promise<TurntaggedData[]> => {
    try {
      const { data, error } = await supabase
        .from("turntagged")
        .select("*")
        .eq("tag", tag); // Filtre basé sur le tag sélectionné

      if (error) {
        console.error(
          "Erreur lors de la récupération des données :",
          error.message
        );
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(
        "Erreur inattendue :",
        err instanceof Error ? err.message : String(err)
      );
      return [];
    }
  };

  const handleTagClick = async (tag: string): Promise<void> => {
    setSelectedTag(tag); // Met à jour le tag sélectionné
    const data = await fetchTurntaggedData(tag); // Charge les données filtrées
    setTurntaggedData(data); // Met à jour l'état avec les données récupérées
    setIsModalTurntaggedTableOpen(true); // Affiche le modal
  };

  useEffect(() => {
    const fetchTagsWithUsage = async () => {
      setLoadingTags(true);
      try {
        const { data, error } = await supabase.from("lpltag").select(`
            label,
            family,
            icon,
            color,
            turntagged (
              call_id
            )
          `);

        if (error) throw error;

        if (!data) {
          setTagTree([]);
          return;
        }

        let tree: FamilyNode[] = data.reduce((acc: FamilyNode[], tag: any) => {
          // Regrouper les appels et compter les occurrences
          const callCount = new Set(tag.turntagged.map((t: any) => t.call_id))
            .size;
          const turnCount = tag.turntagged.length;

          const family = acc.find((item) => item.family === tag.family);
          if (family) {
            family.children.push({
              id: tag.id || 0, // ✅ Ajout id
              label: tag.label, // ✅ Conserve label
              color: tag.color,
              callCount,
              turnCount,
              family: tag.family,
            });
          } else {
            acc.push({
              family: tag.family || "AUTRES",
              icon: tag.icon || "divers",
              children: [
                {
                  id: tag.id || 0, // ✅ Ajout id
                  label: tag.label, // ✅ Conserve label
                  color: tag.color,
                  callCount,
                  turnCount,
                  family: tag.family || "AUTRES",
                },
              ],
            });
          }
          return acc;
        }, []);

        // Trier les familles par priorité d'icône
        tree = sortFamilies(tree);

        setTagTree(tree);
      } catch (err) {
        console.error(
          "Erreur lors du chargement des tags :",
          err instanceof Error ? err.message : String(err)
        );
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTagsWithUsage();
  }, []);

  return (
    <>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: "absolute",
            left: 20,
            top: 20,
            zIndex: 1300,
          }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="left"
          open={isDrawerOpen}
          onClose={toggleDrawer}
          PaperProps={{ sx: { width: "35%", paddingTop: "96px" } }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chargement d'un appel
            </Typography>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Nouvel Appel à analyser</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CallUploaderTaggerLPL />
              </AccordionDetails>
            </Accordion>
          </Box>
        </Drawer>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            overflow: "auto",
            height: "100%",
          }}
        >
          {!showTagUsage ? (
            selectedTaggingCall ? (
              <TranscriptLPL
                callId={selectedTaggingCall.callid}
                audioSrc={selectedTaggingCall.audiourl}
              />
            ) : (
              <Typography variant="h6" color="textSecondary">
                Veuillez charger un appel pour commencer le tagging.
              </Typography>
            )
          ) : (
            <Box sx={{ width: "80%" }}>
              <Typography variant="h5" gutterBottom>
                Gestion des Tags
              </Typography>
              {loadingTags ? (
                <Typography variant="body1">Chargement des tags...</Typography>
              ) : (
                <SimpleTreeView>
                  {tagTree.map((family, familyIndex) => (
                    <TreeItem
                      key={`family-${familyIndex}`}
                      itemId={`family-${familyIndex}`}
                      onClick={(e) => {
                        if (
                          e.target &&
                          !(e.target as HTMLElement).closest?.(
                            ".bar-chart-icon"
                          )
                        ) {
                          setSelectedFamily(family.family);
                        }
                      }}
                      label={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? "#424242"
                                : "#e3f2fd",
                            color: theme.palette.text.primary,
                            padding: 1,
                            borderRadius: 1,
                            border: "1px solid #d2e3fc",
                            marginBottom: 1,
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          {getFamilyIcon(family.icon)}
                          <Typography>{family.family}</Typography>
                          <Badge
                            sx={{
                              marginLeft: "auto",
                              backgroundColor: theme.palette.primary.light,
                            }}
                            badgeContent={family.children.length}
                            color="primary"
                          />
                          <IconButton
                            size="small"
                            className="bar-chart-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFamily(family.family);
                              setShowTagStats(true);
                            }}
                            sx={{
                              marginLeft: 1,
                              color: "primary.main",
                            }}
                          >
                            <BarChartIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      {family.children.map((child, childIndex) => (
                        <TreeItem
                          key={`tag-${familyIndex}-${childIndex}`}
                          itemId={`tag-${familyIndex}-${childIndex}`}
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor:
                                  child.color ||
                                  (theme.palette.mode === "dark"
                                    ? "#616161"
                                    : "#ffffff"),
                                color: theme.palette.text.primary,
                                padding: 1,
                                borderRadius: 1,
                                border: "1px solid #f9e0d9",
                                marginBottom: 0.5,
                                "&:hover": {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <ChevronRight sx={{ marginRight: 1 }} />
                              <Typography>
                                {child.label || "Tag sans nom"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  marginLeft: "auto",
                                  marginRight: 2,
                                  fontSize: 12,
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                {child.callCount} appels, {child.turnCount}{" "}
                                tours
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(child.label);
                                }}
                              >
                                Voir détails
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTag(child);
                                }}
                              >
                                Editer
                              </Button>
                            </Box>
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(child.label);
                          }}
                        />
                      ))}
                    </TreeItem>
                  ))}
                </SimpleTreeView>
              )}
            </Box>
          )}

          <Box sx={{ marginTop: 4, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setShowTagUsage(!showTagUsage);
                setSelectedFamily(null);
                setSelectedTag(null);
              }}
            >
              {showTagUsage ? "Revenir aux Appels" : "Rationaliser les Tags"}
            </Button>

            {showTagUsage && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleShowHistory}
              >
                Historique des Modifications de tag
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <Modal
        open={isModalOpen && !!editingTag}
        onClose={handleCancelEdit}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            padding: 3,
            width: "400px",
          }}
        >
          {editingTag && (
            <TagEditor
              tag={editingTag}
              onUpdate={handleUpdateTag}
              onCancel={handleCancelEdit}
            />
          )}
        </Box>
      </Modal>

      <Modal
        open={showTagStats}
        onClose={() => {
          setShowTagStats(false);
          setSelectedFamily(null);
        }}
      >
        <Box
          sx={{
            padding: 4,
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.grey[800]
                : theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            maxWidth: "800px",
            margin: "auto",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 4px 20px rgba(0,0,0,0.8)"
                : "0px 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <TagStats family={selectedFamily} />
        </Box>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box sx={{ padding: 2, backgroundColor: "white" }}>
          <TagAnalysisReport family={selectedFamily || ""} />
        </Box>
      </Modal>

      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        <Box
          sx={{
            padding: 4,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            maxWidth: "600px",
            margin: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Historique des Modifications
          </Typography>
          {modifications.length > 0 ? (
            <ul>
              {modifications.map((modification) => (
                <li key={modification.id}>
                  <Typography variant="body2">
                    <strong>Action :</strong> {modification.action} |{" "}
                    <strong>Ancien Tag :</strong> {modification.old_tag} |{" "}
                    <strong>Nouveau Tag :</strong> {modification.new_tag} |{" "}
                    <strong>Date :</strong>{" "}
                    {new Date(modification.modified_at).toLocaleString()}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => restoreTagChanges(modification.id)}
                    sx={{ marginTop: 1 }}
                  >
                    Restaurer cette version
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">
              Aucun historique de modifications trouvé.
            </Typography>
          )}
        </Box>
      </Modal>

      <Modal
        open={isModalTurntaggedTableOpen}
        onClose={() => setIsModalTurntaggedTableOpen(false)}
        closeAfterTransition
        keepMounted
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.default
                : "white",
            color: theme.palette.text.primary,
            borderRadius: 2,
            padding: 3,
            maxWidth: "90%",
            maxHeight: "80%",
            overflow: "auto",
            boxShadow: 24,
          }}
        >
          <TurntaggedTable
            data={turntaggedData}
            tag={selectedTag || ""}
            onClose={() => setIsModalTurntaggedTableOpen(false)}
          />
        </Box>
      </Modal>

      {showGraphs && <TagAnalysisGraphs />}
    </>
  );
};

export default TaggerLPL;
