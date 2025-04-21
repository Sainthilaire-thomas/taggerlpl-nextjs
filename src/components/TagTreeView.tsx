"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Badge,
  IconButton,
  Button,
  Modal,
} from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@mui/material/styles";
import TagEditor from "@/components/TagEditor";
import TagStats from "@/components/TagStats";
import TurntaggedTable from "@/components/TurnTaggedTable";
import { getFamilyIcon } from "@/components/utils/iconUtils";

// Types (à extraire dans un fichier séparé)
interface Tag {
  id?: number;
  label: string;
  color?: string;
  description?: string;
  family?: string;
  callCount?: number;
  turnCount?: number;
}

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

const sortFamilies = (families: FamilyNode[]): FamilyNode[] => {
  const order: Record<string, number> = { agent: 1, client: 2, divers: 3 };
  return families.sort((a, b) => (order[a.icon] || 4) - (order[b.icon] || 4));
};

export default function TagTreeView() {
  const theme = useTheme();
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [showTagStats, setShowTagStats] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [turntaggedData, setTurntaggedData] = useState<TurntaggedData[]>([]);
  const [isModalTurntaggedTableOpen, setIsModalTurntaggedTableOpen] =
    useState<boolean>(false);
  const [tagTree, setTagTree] = useState<FamilyNode[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
    setIsModalOpen(false);
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
      // Logique de mise à jour du tag extraite de TaggerLPL
      // Pour la phase 1, nous simplifions cette fonction

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
        .eq("tag", tag);

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
    setSelectedTag(tag);
    const data = await fetchTurntaggedData(tag);
    setTurntaggedData(data);
    setIsModalTurntaggedTableOpen(true);
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
              label: tag.label,
              color: tag.color,
              callCount, // Nombre d'appels
              turnCount, // Nombre de tours taggés
              family: tag.family,
            });
          } else {
            acc.push({
              family: tag.family || "AUTRES",
              icon: tag.icon || "divers",
              children: [
                {
                  label: tag.label,
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
    <Box sx={{ width: "100%", padding: 2 }}>
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
                  !(e.target as HTMLElement).closest?.(".bar-chart-icon")
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
                      theme.palette.mode === "dark" ? "#424242" : "#e3f2fd",
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
                      <Typography>{child.label || "Tag sans nom"}</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          marginLeft: "auto",
                          marginRight: 2,
                          fontSize: 12,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {child.callCount} appels, {child.turnCount} tours
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
    </Box>
  );
}
