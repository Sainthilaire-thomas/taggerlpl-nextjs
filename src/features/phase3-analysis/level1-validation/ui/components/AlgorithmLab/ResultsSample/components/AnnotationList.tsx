"use client";
import * as React from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import { useTaggingData } from "@/features/shared/context";

// si tu as exporté le type TurnAnnotation depuis le context, importe-le.
// sinon, garde cette interface locale (identique à celle proposée dans le contexte)
export type TurnAnnotation = {
  id: string;
  author: string;
  created_at: string;
  rationale: string;
  proposed_label?: string | null;
  gold_label?: string | null;
  verbatim?: string | null;
  context?: { prev2?: string; prev1?: string; next1?: string } | null;
  source?: string | null;
  _pending?: boolean;
  algo?: {
    classifier: string;
    type?: "rule-based" | "ml" | "llm";
    model?: string | null;
    provider?: string | null;
    temperature?: number | null;
    max_tokens?: number | null;
  } | null;
};

type Props = {
  turnId: number;
  verbatim: string;
  context?: { prev2?: string; prev1?: string; next1?: string };
  predicted?: string;
  gold?: string;
  author?: string; // nom affiché dans les nouvelles annotations (ex: currentUser)
  buttonSize?: "small" | "medium";
  algo?: {
    classifier: string;
    type?: "rule-based" | "ml" | "llm";
    model?: string | null;
    provider?: string | null;
    temperature?: number | null;
    max_tokens?: number | null;
  };
};

export default function AnnotationList({
  turnId,
  verbatim,
  context,
  predicted,
  gold,
  author = "analyst",
  buttonSize = "small",
  algo,
}: Props) {
  const {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    taggedTurns,
    allTurnTagged,
  } = useTaggingData() as any;

  // Sélectionne la source la plus à jour
  const annotations: TurnAnnotation[] = React.useMemo(() => {
    const t =
      taggedTurns.find((x: any) => x.id === turnId) ??
      allTurnTagged.find((x: any) => x.id === turnId);
    return Array.isArray(t?.annotations)
      ? (t.annotations as TurnAnnotation[])
      : [];
  }, [taggedTurns, allTurnTagged, turnId]);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");

  const toggle = () => setOpen((o) => !o);

  const handleCreate = async () => {
    const text = draft.trim();
    if (!text) return;
    await addAnnotation?.(turnId, {
      comment: text,
      author,
      proposedLabel: predicted ?? null,
      goldLabel: gold ?? null,
      verbatim,
      context: context ?? null,
      source: "ui/analysis",
      algo,
    });
    setDraft("");
  };

  const startEdit = (a: TurnAnnotation) => {
    setEditingId(a.id);
    setEditText(a.rationale);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const txt = editText.trim();
    await updateAnnotation?.(turnId, editingId, { rationale: txt });
    setEditingId(null);
    setEditText("");
  };

  const doDelete = async (id: string) => {
    await deleteAnnotation?.(turnId, id);
  };

  const count = annotations.length;

  // 2) Construit le contenu du tooltip (string si pas d'algo)
  const algoTip = React.useMemo(() => {
    if (!algo) return "Annoter / voir les commentaires";
    return (
      <Box sx={{ display: "grid", gap: 0.25 }}>
        <Typography variant="caption">
          <b>Annoter / voir les commentaires</b>
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        <Typography variant="caption">Algo: {algo.classifier}</Typography>
        {algo.type && (
          <Typography variant="caption">Type: {algo.type}</Typography>
        )}
        {algo.model && (
          <Typography variant="caption">Modèle: {algo.model}</Typography>
        )}
        {typeof algo.temperature === "number" && (
          <Typography variant="caption">T={algo.temperature}</Typography>
        )}
        {typeof algo.max_tokens === "number" && (
          <Typography variant="caption">
            max_tokens={algo.max_tokens}
          </Typography>
        )}
      </Box>
    );
  }, [algo]);

  return (
    <>
      <Tooltip title={algoTip} arrow enterDelay={400}>
        <span>
          <Badge
            color="secondary"
            badgeContent={count}
            invisible={count === 0}
            overlap="circular"
          >
            <IconButton size={buttonSize} onClick={toggle} disabled={!turnId}>
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Badge>
        </span>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={toggle}
        PaperProps={{ sx: { width: 520 } }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Annotations · tour #{turnId}
          </Typography>
          <IconButton onClick={toggle}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Contexte compact */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Contexte (−2 / −1 / 0 / +1)
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              p: 1.2,
              borderRadius: 1,
              bgcolor: "background.default",
              border: 1,
              borderColor: "divider",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {context?.prev2 && (
              <Box sx={{ opacity: 0.6, mb: 0.5 }}>
                <strong>−2</strong> {context.prev2}
              </Box>
            )}
            {context?.prev1 && (
              <Box sx={{ opacity: 0.8, mb: 0.5 }}>
                <strong>−1</strong> {context.prev1}
              </Box>
            )}
            <Box
              sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover", mb: 0.5 }}
            >
              <strong>0</strong> {verbatim}
            </Box>
            {context?.next1 && (
              <Box sx={{ opacity: 0.8 }}>
                <strong>+1</strong> {context.next1}
              </Box>
            )}
          </Box>

          {(predicted || gold) && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {predicted && (
                <Chip
                  label={`Prédit: ${predicted}`}
                  size="small"
                  color="error"
                />
              )}
              {gold && (
                <Chip label={`Réel: ${gold}`} size="small" color="success" />
              )}
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Liste des annotations */}
        <List dense sx={{ px: 1 }}>
          {annotations.map((a) => (
            <ListItem
              key={a.id}
              alignItems="flex-start"
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: a._pending ? "action.hover" : "background.paper",
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2">{a.author}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(a.created_at).toLocaleString()}
                    </Typography>
                    {a._pending && (
                      <Chip
                        size="small"
                        icon={<HourglassEmptyIcon fontSize="small" />}
                        label="Envoi…"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                }
                secondary={
                  editingId === a.id ? (
                    <TextField
                      fullWidth
                      size="small"
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      multiline
                      minRows={2}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {a.rationale}
                    </Typography>
                  )
                }
              />

              <ListItemSecondaryAction>
                {editingId === a.id ? (
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={saveEdit}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={cancelEdit}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => startEdit(a)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => doDelete(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}

          {annotations.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 3, py: 1 }}
            >
              Aucune annotation pour ce tour.
            </Typography>
          )}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Éditeur d’ajout */}
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            label="Ajouter un commentaire"
            placeholder="Ex. Ici le conseiller acquiesce puis oriente vers une action client…"
            fullWidth
            multiline
            minRows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreate}
                    disabled={!draft.trim()}
                    startIcon={<SaveIcon />}
                  >
                    Enregistrer
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}
