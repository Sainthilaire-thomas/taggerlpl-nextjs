// components/NavigationControls.tsx
import React from "react";
import { Box, IconButton, Breadcrumbs, Link, Button } from "@mui/material";
import {
  ArrowBack as BackIcon,
  Home as HomeIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { ZohoFile } from "../types";

interface NavigationControlsProps {
  folderHistory: string[];
  currentFolder: string;
  rootFolderId: string;
  folderPath: { id: string; name: string }[];
  onBack: () => void;
  onHome: () => void;
  onBreadcrumbClick: (folderId: string, index: number) => void;
  selectedAudioFile?: ZohoFile | null;
  selectedTranscriptionFile?: ZohoFile | null;
  onImportFiles: () => void;
  processingImport: boolean;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  folderHistory,
  currentFolder,
  rootFolderId,
  folderPath,
  onBack,
  onHome,
  onBreadcrumbClick,
  selectedAudioFile,
  selectedTranscriptionFile,
  onImportFiles,
  processingImport,
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <IconButton
        color="primary"
        onClick={onBack}
        disabled={folderHistory.length === 0}
        sx={{ mr: 1 }}
      >
        <BackIcon />
      </IconButton>
      <IconButton
        color="primary"
        onClick={onHome}
        disabled={currentFolder === rootFolderId}
      >
        <HomeIcon />
      </IconButton>

      <Breadcrumbs sx={{ ml: 2, flexGrow: 1 }}>
        {folderPath.map((folder, index) => (
          <Link
            key={folder.id}
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (index !== folderPath.length - 1) {
                onBreadcrumbClick(folder.id, index);
              }
            }}
            underline={index !== folderPath.length - 1 ? "hover" : "none"}
            sx={{ cursor: "pointer" }}
          >
            {folder.name}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Bouton pour importer les fichiers sélectionnés */}
      {(selectedAudioFile || selectedTranscriptionFile) && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={onImportFiles}
          disabled={processingImport || !selectedAudioFile}
        >
          {processingImport ? <CircularProgress size={24} /> : "Importer"}
        </Button>
      )}
    </Box>
  );
};
