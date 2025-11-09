// components/SearchDebug.tsx - Composant temporaire de débogage
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { ZohoFile } from "../types";

interface SearchDebugProps {
  searchResults: {
    files: ZohoFile[];
    totalFound: number;
    searchedFolders: number;
    isSearching: boolean;
    searchQuery: string;
  };
  allFiles?: ZohoFile[]; // Fichiers du dossier courant pour comparaison
}

export const SearchDebug: React.FC<SearchDebugProps> = ({
  searchResults,
  allFiles = [],
}) => {
  if (!searchResults.searchQuery) return null;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" color="text.secondary">
          🔍 Debug - Recherche "{searchResults.searchQuery}"
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle2">📊 Statistiques:</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`${searchResults.totalFound} trouvés`}
              color="primary"
              size="small"
            />
            <Chip
              label={`${searchResults.searchedFolders} dossiers explorés`}
              color="secondary"
              size="small"
            />
            <Chip
              label={`${allFiles.length} fichiers dans le dossier courant`}
              color="info"
              size="small"
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            📋 Fichiers trouvés:
          </Typography>
          {searchResults.files.length > 0 ? (
            <Box sx={{ maxHeight: 200, overflow: "auto" }}>
              {searchResults.files.map((file, index) => (
                <Typography
                  key={file.id}
                  variant="body2"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {index + 1}.{" "}
                  {file.attributes?.name || file.name || "Sans nom"}
                  <Chip
                    label={file.attributes?.type || file.type || "unknown"}
                    size="small"
                    sx={{ ml: 1, height: 16, fontSize: "0.7rem" }}
                  />
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucun fichier trouvé
            </Typography>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            📁 Fichiers du dossier courant (pour comparaison):
          </Typography>
          <Box sx={{ maxHeight: 150, overflow: "auto" }}>
            {allFiles.slice(0, 10).map((file, index) => {
              const fileName = file.attributes?.name || file.name || "Sans nom";
              const isMatch = fileName
                .toLowerCase()
                .includes(searchResults.searchQuery.toLowerCase());
              const isFolder =
                file.attributes?.is_folder === true ||
                file.attributes?.type === "folder" ||
                file.type === "folder";

              return (
                <Typography
                  key={file.id}
                  variant="body2"
                  sx={{
                    fontSize: "0.8rem",
                    color: isMatch ? "success.main" : "text.secondary",
                    fontWeight: isMatch ? "bold" : "normal",
                  }}
                >
                  {index + 1}. {fileName}
                  <Chip
                    label={
                      isFolder
                        ? "FOLDER"
                        : file.attributes?.type || file.type || "file"
                    }
                    size="small"
                    color={isFolder ? "warning" : "default"}
                    sx={{ ml: 1, height: 16, fontSize: "0.7rem" }}
                  />
                  {isMatch && (
                    <Chip
                      label="MATCH"
                      color="success"
                      size="small"
                      sx={{ ml: 1, height: 16, fontSize: "0.7rem" }}
                    />
                  )}
                </Typography>
              );
            })}
            {allFiles.length > 10 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                ... et {allFiles.length - 10} autres fichiers
              </Typography>
            )}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

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
}
