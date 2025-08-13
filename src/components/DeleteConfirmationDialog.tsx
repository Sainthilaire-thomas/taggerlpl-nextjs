// components/DeleteConfirmationDialog.tsx - NOUVELLE ERGONOMIE OPTIMISÉE
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  AudioFile as AudioIcon,
  Description as TranscriptionIcon,
  Delete as DeleteIcon,
  Tag as TagIcon,
  Info as InfoIcon,
  Transform as ConvertIcon,
  StickyNote2 as PostitIcon,
  Assignment as ActivityIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { getDeletePreview as getDeletePreviewFromUtils } from "./utils/deleteCallCompletely"; // ✅ IMPORT AVEC ALIAS

interface Call {
  callid: string;
  upload?: boolean;
  filepath?: string | null;
  preparedfortranscript?: boolean;
  filename?: string | null;
  transcription?: any;
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  call: Call | null;
  onClose: () => void;
  // ✅ COMPATIBLE avec votre signature existante
  onConfirm: (call: Call, options?: DeleteOptions) => Promise<void>;
  isDeleting?: boolean;
}

interface DeleteOptions {
  mode: "standard" | "complete" | "custom";
  confirmCompleteDelete?: boolean;
  customOptions?: {
    deleteAudio: boolean;
    deleteTranscription: boolean;
    deleteTagging: boolean;
  };
}

interface DeletePreview {
  callExists: boolean;
  hasAudio: boolean;
  hasTranscription: boolean;
  wordsCount?: number; // ✅ Rendu optionnel
  turntaggedCount?: number; // ✅ Rendu optionnel
  postitsCount?: number; // ✅ Rendu optionnel
  activitiesCount?: number; // ✅ Rendu optionnel
  callActivityRelationsCount?: number; // ✅ Rendu optionnel
  entrepriseCallCount?: number; // ✅ Rendu optionnel
  filename?: string;
  willBeConverted: boolean;
  constraints: string[];
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({ open, call, onClose, onConfirm, isDeleting = false }) => {
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Options personnalisées
  const [deleteAudio, setDeleteAudio] = useState(true);
  const [deleteTranscription, setDeleteTranscription] = useState(true);
  const [deleteTagging, setDeleteTagging] = useState(false); // ✅ Par défaut CONSERVER les tags

  // Charger l'aperçu des données
  useEffect(() => {
    if (open && call) {
      setLoadingPreview(true);
      console.log(`🔍 Analyse de l'appel ${call.callid} pour suppression...`);

      getDeletePreviewFromUtils(call.callid)
        .then((previewData) => {
          console.log(
            `📊 Aperçu reçu pour l'appel ${call.callid}:`,
            previewData
          );
          setPreview(previewData);
        })
        .catch((error) => {
          console.error(
            `❌ Erreur lors de l'analyse de l'appel ${call.callid}:`,
            error
          );
          // ✅ Pas de fallback - Laisse preview à null pour montrer l'erreur
          setPreview(null);
        })
        .finally(() => setLoadingPreview(false));
    }
  }, [open, call]);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setShowAdvanced(false);
      setDeleteAudio(true);
      setDeleteTranscription(true);
      setDeleteTagging(false); // ✅ Tags conservés par défaut
    }
  }, [open]);

  if (!call) return null;

  const willBeConverted = preview?.willBeConverted || false;
  const hasConstraints = preview?.constraints && preview.constraints.length > 0;

  // ✅ GESTION DES TROIS CAS PRINCIPAUX
  const handleStandardDelete = async () => {
    await onConfirm(call, { mode: "standard" });
  };

  const handleConvertCall = async () => {
    await onConfirm(call, {
      mode: "custom",
      customOptions: {
        deleteAudio: false,
        deleteTranscription: false,
        deleteTagging: true, // Supprimer uniquement les tags
      },
    });
  };

  const handleCustomDelete = async () => {
    await onConfirm(call, {
      mode: "custom",
      customOptions: {
        deleteAudio,
        deleteTranscription,
        deleteTagging,
      },
    });
  };

  // Calcul de l'impact pour le mode personnalisé
  const getCustomImpact = () => {
    if (!preview) return { deleted: [], kept: [] };

    const deleted = [];
    const kept = [];

    if (willBeConverted) {
      kept.push("Appel principal (converti)");
    } else {
      deleted.push("Appel principal");
    }

    if (deleteAudio && preview.hasAudio) {
      deleted.push("Fichier audio");
    } else if (preview.hasAudio) {
      kept.push("Fichier audio");
    }

    if (deleteTranscription && preview.hasTranscription) {
      deleted.push(`Transcription (${preview.wordsCount || 0} mots)`);
    } else if (preview.hasTranscription) {
      kept.push(`Transcription (${preview.wordsCount || 0} mots)`);
    }

    // ✅ Protection contre undefined avec || 0
    if (deleteTagging && (preview.turntaggedCount || 0) > 0) {
      deleted.push(
        `Données de tagging (${preview.turntaggedCount || 0} tours)`
      );
    } else if ((preview.turntaggedCount || 0) > 0) {
      kept.push(`Données de tagging (${preview.turntaggedCount || 0} tours)`);
    }

    if ((preview.postitsCount || 0) > 0) {
      kept.push(`Post-its (${preview.postitsCount})`);
    }

    if ((preview.activitiesCount || 0) > 0) {
      kept.push(`Activités (${preview.activitiesCount})`);
    }

    return { deleted, kept };
  };

  const customImpact = showAdvanced ? getCustomImpact() : null;

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}
      >
        {willBeConverted ? (
          <ConvertIcon color="warning" />
        ) : (
          <DeleteIcon color="error" />
        )}
        <Typography variant="h6" component="span">
          {willBeConverted ? "Conversion d'appel requise" : "Supprimer l'appel"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Chargement */}
        {loadingPreview && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Analyse des dépendances...</Typography>
          </Box>
        )}

        {/* ✅ Gestion d'erreur si preview est null */}
        {!loadingPreview && !preview && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Erreur lors de l'analyse</AlertTitle>
            <Typography variant="body2">
              Impossible d'analyser l'appel {call.callid}. Vérifiez la console
              pour plus de détails.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Actions possibles :</strong>
              <br />• Vérifiez que le fichier utils/deleteCallCompletely.ts
              existe
              <br />• Vérifiez la connexion à Supabase
              <br />• Consultez les logs de la console
            </Typography>
          </Alert>
        )}

        {/* Informations sur l'appel - seulement si preview existe */}
        {preview && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 Appel à traiter
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2">
                <strong>ID :</strong> {call.callid}
              </Typography>
              {preview.filename && (
                <Typography variant="body2">
                  <strong>Fichier :</strong> {preview.filename}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Actions disponibles seulement si preview existe */}
        {preview && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* ✅ CAS A : CONTRAINTES BLOQUANTES */}
            {willBeConverted && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>
                    <ConvertIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Contraintes détectées - Suppression impossible
                  </AlertTitle>
                  <Typography variant="body2">
                    Cet appel ne peut pas être supprimé car il contient :
                  </Typography>

                  <Box
                    sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
                  >
                    {(preview?.postitsCount || 0) > 0 && (
                      <Chip
                        icon={<PostitIcon />}
                        label={`${preview?.postitsCount} post-its`}
                        color="warning"
                        size="small"
                      />
                    )}
                    {(preview?.activitiesCount || 0) > 0 && (
                      <Chip
                        icon={<ActivityIcon />}
                        label={`${preview?.activitiesCount} activités`}
                        color="info"
                        size="small"
                      />
                    )}
                    {(preview?.entrepriseCallCount || 0) > 0 && (
                      <Chip
                        label={`${preview?.entrepriseCallCount} relations entreprise`}
                        color="secondary"
                        size="small"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Action recommandée :</strong> Convertir l'appel
                    (supprimer uniquement les données de tagging)
                  </Typography>
                </Alert>

                {/* Aperçu conversion */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🔄 Aperçu de la conversion
                  </Typography>
                  <Box
                    sx={{
                      ml: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DeleteIcon fontSize="small" color="error" />
                      <Typography variant="body2" color="error.main">
                        Données de tagging supprimées (
                        {preview?.turntaggedCount || 0} tours)
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="body2" color="success.main">
                        Appel conservé (is_tagging_call = false)
                      </Typography>
                    </Box>
                    {preview?.hasAudio && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AudioIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          Fichier audio conservé
                        </Typography>
                      </Box>
                    )}
                    {preview?.hasTranscription && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TranscriptionIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          Transcription conservée ({preview?.wordsCount || 0}{" "}
                          mots)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* ✅ CAS B : SUPPRESSION STANDARD POSSIBLE */}
            {!willBeConverted && preview && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>
                    <DeleteIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Suppression standard (recommandée)
                  </AlertTitle>
                  <Typography variant="body2">
                    <strong>Par défaut :</strong> Supprimer l'appel, l'audio et
                    la transcription
                    <br />
                    <strong>Conserver :</strong> Les données de tagging pour les
                    analyses statistiques
                  </Typography>
                </Alert>

                {/* Aperçu suppression standard */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🗑️ Aperçu de la suppression standard
                  </Typography>
                  <Box
                    sx={{
                      ml: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DeleteIcon fontSize="small" color="error" />
                      <Typography variant="body2" color="error.main">
                        Appel principal supprimé
                      </Typography>
                    </Box>
                    {preview.hasAudio && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.main">
                          Fichier audio supprimé
                        </Typography>
                      </Box>
                    )}
                    {preview.hasTranscription && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.main">
                          Transcription supprimée ({preview.wordsCount || 0}{" "}
                          mots)
                        </Typography>
                      </Box>
                    )}
                    {/* ✅ Affichage conditionnel selon la présence de tags */}
                    {(preview.turntaggedCount || 0) > 0 ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TagIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          <strong>Données de tagging conservées</strong> (
                          {preview.turntaggedCount || 0} tours)
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <InfoIcon fontSize="small" color="info" />
                        <Typography variant="body2" color="text.secondary">
                          Aucune donnée de tagging à traiter
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {(preview.turntaggedCount || 0) > 0 ? (
                      <>
                        💡 <strong>Pourquoi conserver les tags ?</strong>
                        <br />
                        Les données de tagging restent disponibles pour les
                        analyses de succession de tours de parole et les
                        statistiques globales.
                      </>
                    ) : (
                      <>
                        ℹ️ <strong>Appel sans données de tagging</strong>
                        <br />
                        Cet appel ne contient pas de données de tagging. La
                        suppression sera complète sans impact sur les analyses
                        statistiques.
                      </>
                    )}
                  </Typography>
                </Alert>
              </>
            )}

            {/* ✅ MODE AVANCÉ / PERSONNALISÉ - Uniquement si aucune contrainte */}
            {!willBeConverted && (
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={
                    showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  }
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  variant="outlined"
                  size="small"
                  disabled={isDeleting}
                >
                  <SettingsIcon sx={{ mr: 1 }} />
                  Options avancées
                </Button>

                <Collapse in={showAdvanced}>
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "grey.50",
                      borderRadius: 1,
                      border: (theme) =>
                        theme.palette.mode === "dark"
                          ? "1px solid rgba(255, 255, 255, 0.1)"
                          : "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      🎛️ Suppression personnalisée
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Choisissez précisément quelles données supprimer :
                    </Typography>

                    {/* Options personnalisées */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {preview?.hasAudio && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={deleteAudio}
                              onChange={(e) => setDeleteAudio(e.target.checked)}
                              disabled={isDeleting}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AudioIcon fontSize="small" />
                              <Typography variant="body2">
                                Supprimer le fichier audio
                              </Typography>
                            </Box>
                          }
                        />
                      )}

                      {preview?.hasTranscription && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={deleteTranscription}
                              onChange={(e) =>
                                setDeleteTranscription(e.target.checked)
                              }
                              disabled={isDeleting}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <TranscriptionIcon fontSize="small" />
                              <Typography variant="body2">
                                Supprimer la transcription (
                                {preview?.wordsCount || 0} mots)
                              </Typography>
                            </Box>
                          }
                        />
                      )}

                      {(preview?.turntaggedCount || 0) > 0 && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={deleteTagging}
                              onChange={(e) =>
                                setDeleteTagging(e.target.checked)
                              }
                              disabled={isDeleting}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <TagIcon fontSize="small" />
                              <Typography variant="body2">
                                Supprimer les données de tagging (
                                {preview?.turntaggedCount || 0} tours)
                              </Typography>
                              <Chip
                                label="⚠️ Impact stats"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      )}

                      {/* ✅ Message informatif quand il n'y a pas de tags */}
                      {(preview?.turntaggedCount || 0) === 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                          }}
                        >
                          <InfoIcon fontSize="small" color="info" />
                          <Typography variant="body2" color="text.secondary">
                            Aucune donnée de tagging dans cet appel
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Aperçu personnalisé */}
                    {customImpact && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1,
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.02)"
                              : "white",
                          borderRadius: 1,
                          border: (theme) =>
                            theme.palette.mode === "dark"
                              ? "1px solid rgba(255, 255, 255, 0.15)"
                              : "1px solid rgba(0, 0, 0, 0.23)",
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          📊 Aperçu de votre sélection
                        </Typography>

                        {customImpact.deleted.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="body2"
                              color="error.main"
                              sx={{ fontWeight: 600 }}
                            >
                              🗑️ Sera supprimé :
                            </Typography>
                            <ul
                              style={{ margin: "4px 0", paddingLeft: "20px" }}
                            >
                              {customImpact.deleted.map((item, index) => (
                                <li key={index}>
                                  <Typography
                                    variant="body2"
                                    color="error.main"
                                  >
                                    {item}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}

                        {customImpact.kept.length > 0 && (
                          <Box>
                            <Typography
                              variant="body2"
                              color="success.main"
                              sx={{ fontWeight: 600 }}
                            >
                              ✅ Sera conservé :
                            </Typography>
                            <ul
                              style={{ margin: "4px 0", paddingLeft: "20px" }}
                            >
                              {customImpact.kept.map((item, index) => (
                                <li key={index}>
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                  >
                                    {item}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Avertissement final - seulement si preview existe */}
            {preview && (
              <Alert severity={willBeConverted ? "info" : "warning"}>
                <Typography variant="body2">
                  <InfoIcon
                    fontSize="small"
                    sx={{ mr: 1, verticalAlign: "middle" }}
                  />
                  {willBeConverted
                    ? "L'appel sera converti pour préserver les fonctionnalités liées (post-its, activités)."
                    : showAdvanced && deleteTagging
                    ? "⚠️ Attention : supprimer les données de tagging impactera les analyses statistiques."
                    : "Cette action supprimera l'appel tout en préservant les données d'analyse."}
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={isDeleting}>
          Annuler
        </Button>

        {/* ✅ BOUTONS DISPONIBLES SEULEMENT SI PREVIEW EXISTE */}
        {preview && (
          <>
            {willBeConverted ? (
              // Cas contraintes : uniquement conversion
              <Button
                onClick={handleConvertCall}
                variant="contained"
                color="warning"
                startIcon={
                  isDeleting ? <CircularProgress size={16} /> : <ConvertIcon />
                }
                disabled={isDeleting}
                sx={{ minWidth: 180 }}
              >
                {isDeleting ? "Conversion..." : "Convertir l'appel"}
              </Button>
            ) : showAdvanced ? (
              // Mode avancé : suppression personnalisée
              <Button
                onClick={handleCustomDelete}
                variant="contained"
                color="error"
                startIcon={
                  isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />
                }
                disabled={isDeleting}
                sx={{ minWidth: 180 }}
              >
                {isDeleting ? "Suppression..." : "Supprimer (personnalisé)"}
              </Button>
            ) : (
              // Mode standard : suppression par défaut
              <Button
                onClick={handleStandardDelete}
                variant="contained"
                color="primary"
                startIcon={
                  isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />
                }
                disabled={isDeleting}
                sx={{ minWidth: 180 }}
              >
                {isDeleting ? "Suppression..." : "Supprimer (garder tags)"}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
