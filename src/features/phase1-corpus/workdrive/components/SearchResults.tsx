// components/SearchResults.tsx - Version étendue avec mode
import React from "react";
import { Box, Typography, Alert, Divider } from "@mui/material";
import { ZohoFile, WorkdriveExplorerMode } from "../types";
import { FileList } from "./FileList";
import { SearchDebug } from "./SearchDebug";

// ✅ MISE À JOUR: Interface étendue avec prop mode optionnelle
interface SearchResultsProps {
  searchResults: {
    files: ZohoFile[];
    totalFound: number;
    searchedFolders: number;
    isSearching: boolean;
    searchQuery: string;
  };
  selectedAudioFile?: ZohoFile | null;
  selectedTranscriptionFile?: ZohoFile | null;
  onSelectAudioFile: (file: ZohoFile) => void;
  onSelectTranscriptionFile: (file: ZohoFile) => void;
  allFiles?: ZohoFile[]; // Pour le debug
  mode?: WorkdriveExplorerMode; // ✅ NOUVEAU - optionnel pour compatibilité
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  selectedAudioFile,
  selectedTranscriptionFile,
  onSelectAudioFile,
  onSelectTranscriptionFile,
  allFiles = [],
  mode = "full", // ✅ NOUVEAU: Valeur par défaut pour compatibilité
}) => {
  if (!searchResults.searchQuery) {
    return null;
  }

  if (searchResults.isSearching) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Recherche en cours...
        </Typography>
      </Box>
    );
  }

  // ✅ NOUVEAU: Message adapté selon le mode et le type de résultats
  const getResultsMessage = () => {
    const count = searchResults.totalFound;
    let type = "fichier(s)";

    switch (mode) {
      case "audio_only":
        type = count > 1 ? "fichiers audio" : "fichier audio";
        break;
      case "transcription_only":
        type = count > 1 ? "transcriptions" : "transcription";
        break;
    }

    return `${count} ${type} trouvé(s)`;
  };

  // ✅ NOUVEAU: Message d'alerte adapté selon le mode
  const getEmptyMessage = () => {
    switch (mode) {
      case "audio_only":
        return `Aucun fichier audio trouvé pour "${searchResults.searchQuery}" dans ${searchResults.searchedFolders} dossier(s) explorés.`;
      case "transcription_only":
        return `Aucune transcription trouvée pour "${searchResults.searchQuery}" dans ${searchResults.searchedFolders} dossier(s) explorés.`;
      default:
        return `Aucun fichier trouvé pour "${searchResults.searchQuery}" dans ${searchResults.searchedFolders} dossier(s) explorés.`;
    }
  };

  return (
    <Box>
      {/* Composant de débogage - À supprimer une fois le problème résolu */}
      <SearchDebug searchResults={searchResults} allFiles={allFiles} />

      <Box sx={{ mb: 2, mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" color="primary">
          🔍 Résultats de recherche
          {/* ✅ NOUVEAU: Indicateur de mode si différent de 'full' */}
          {mode !== "full" && (
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 1,
                px: 1,
                py: 0.5,
                bgcolor: "primary.100",
                borderRadius: 1,
                fontSize: "0.7rem",
              }}
            >
              {mode === "audio_only" ? "Audio" : "Transcription"}
            </Typography>
          )}
        </Typography>
        <Divider orientation="vertical" flexItem />
        <Typography variant="body2" color="text.secondary">
          {getResultsMessage()}
        </Typography>
      </Box>

      {searchResults.totalFound === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {getEmptyMessage()}
          {/* ✅ NOUVEAU: Conseil selon le mode */}
          {mode !== "full" && (
            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
              💡 Conseil : Vérifiez que les fichiers ont la bonne extension (
              {mode === "audio_only"
                ? ".mp3, .wav, .m4a, etc."
                : ".json, .txt, etc."}
              )
            </Typography>
          )}
        </Alert>
      ) : (
        <FileList
          files={searchResults.files}
          loading={false}
          selectedAudioFile={selectedAudioFile}
          selectedTranscriptionFile={selectedTranscriptionFile}
          onFolderClick={() => {}} // Pas de navigation dans les résultats de recherche
          onSelectAudioFile={onSelectAudioFile}
          onSelectTranscriptionFile={onSelectTranscriptionFile}
          mode={mode} // ✅ NOUVEAU: Transmission du mode pour filtrage
        />
      )}
    </Box>
  );
};
