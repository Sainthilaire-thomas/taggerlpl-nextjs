import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import TagSelector from "@/features/phase2-annotation/tags/ui/components/TagSelector";
import { TagSidePanelProps, DRAWER_WIDTH } from "./types";

const TagSidePanel: React.FC<TagSidePanelProps> = ({
  drawerOpen,
  handleToggleDrawer,
  tagMode,
  selectedTaggedTurn,
  selectedText,
  onSelectTag,
  onRemoveTag,
  callId,
  taggedTurns,
  filename,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Adapter l'interface du TagSelector existant pour notre usage
  // Correction: utiliser x et y au lieu de top et left
  const adaptedTooltipState = {
    mode: tagMode,
    tag: selectedTaggedTurn,
    position: { x: 0, y: 0 }, // Correction: x et y au lieu de top et left
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: drawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
        width: `${DRAWER_WIDTH}px`,
        height: "100%",
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        transition: "right 0.3s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">
          {tagMode === "edit" ? "Modifier le Tag" : "Ajouter un Tag"}
        </Typography>
        <IconButton onClick={handleToggleDrawer}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Tags" />
        <Tab label="Info" />
      </Tabs>

      <Box sx={{ padding: 2, overflow: "auto" }}>
        {/* Contenu de l'onglet Tags */}
        {tabValue === 0 && (
          <>
            {/* Afficher le texte sélectionné en mode "create" */}
            {tagMode === "create" && selectedText && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Texte sélectionné:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    mt: 0.5,
                    backgroundColor: theme.palette.grey[800],
                  }}
                >
                  <Typography variant="body2">{selectedText}</Typography>
                </Paper>
              </Box>
            )}

            {/* Afficher le verbatim en mode "edit" */}
            {tagMode === "edit" && selectedTaggedTurn && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tag actuel: <strong>{selectedTaggedTurn.tag}</strong>
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Verbatim:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    mt: 0.5,
                    backgroundColor: theme.palette.grey[800],
                  }}
                >
                  <Typography variant="body2">
                    {selectedTaggedTurn.verbatim}
                  </Typography>
                </Paper>

                {/* Bouton de suppression en mode "edit" */}
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={onRemoveTag}
                >
                  Supprimer ce tag
                </Button>
              </Box>
            )}

            {/* TagSelector intégré dans le panneau */}
            <TagSelector
              tooltipState={adaptedTooltipState}
              onRemoveTag={onRemoveTag}
              onSelectTag={onSelectTag}
            />
          </>
        )}

        {/* Contenu de l'onglet Info */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Informations sur l'appel
            </Typography>
            <Typography variant="body2" paragraph>
              ID: {callId}
            </Typography>
            <Typography variant="body2" paragraph>
              Nom: {filename}
            </Typography>
            <Typography variant="body2" paragraph>
              Nombre de tags: {taggedTurns.length}
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Comment utiliser le tagging
            </Typography>
            <Typography variant="body2" paragraph>
              1. Sélectionnez du texte pour créer un nouveau tag
            </Typography>
            <Typography variant="body2" paragraph>
              2. Cliquez sur un tag existant pour le modifier
            </Typography>
            <Typography variant="body2">
              3. Utilisez les commandes audio pour naviguer dans
              l'enregistrement
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TagSidePanel;
