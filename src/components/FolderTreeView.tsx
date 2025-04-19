import { useEffect, useState } from "react";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view";
import { Box, Typography } from "@mui/material";

// Define types for file nodes and tree structure
interface FileNode {
  id: string;
  originalId?: string;
  name: string;
  children?: FileNode[];
  [key: string]: any; // For any additional properties
}

// Define the file types
type FileType = "audio" | "transcription";

// Define selected files state type
interface SelectedFiles {
  audio: FileNode | null;
  transcription: FileNode | null;
}

// Define props interface
interface FolderTreeViewProps {
  onFileSelect: (file: FileNode, type: FileType) => void;
}

const FolderTreeView: React.FC<FolderTreeViewProps> = ({ onFileSelect }) => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    audio: null,
    transcription: null,
  });

  // Formats pris en charge
  const supportedAudioFormats: string[] = [".mp3", ".ogg", ".wav"];
  const transcriptionFormat: string = ".json";

  // Set to track existing IDs to avoid duplicates
  const existingIds = new Set<string>();

  // Étape 2 : Ajouter des ID uniques
  const addUniqueIds = (node: any, parentId: string = ""): FileNode => {
    if (!node || typeof node !== "object") return node;

    const originalId = node.id; // Conserver l'ID d'origine
    let uniqueId = originalId || `${parentId}-${node.name}`; // Générer un ID unique si nécessaire

    if (existingIds.has(uniqueId)) {
      uniqueId = `${uniqueId}-${Math.random().toString(36).substring(2, 8)}`;
      console.warn(`⚠️ Collision d'ID détectée, ID corrigé : ${uniqueId}`);
    }
    existingIds.add(uniqueId);

    let children = node.children;
    if (children && typeof children === "object" && !Array.isArray(children)) {
      children = [children];
    }

    return {
      ...node,
      id: uniqueId, // Utilisé pour MUI
      originalId, // Conserver l'ID d'origine
      children: Array.isArray(children)
        ? children.map((child) => addUniqueIds(child, uniqueId))
        : [],
    };
  };

  // Étape 1 : Charger les données depuis le localStorage
  useEffect(() => {
    console.log("💾 Chargement des données depuis localStorage...");
    const dataFromStorage = localStorage.getItem("workdriveTree");

    if (dataFromStorage) {
      console.log("📦 Données brutes récupérées :", dataFromStorage);
      try {
        const parsedData = JSON.parse(dataFromStorage);
        console.log("✅ Données JSON parsées :", parsedData);

        existingIds.clear(); // Reset existing IDs before adding
        const structuredData = [addUniqueIds(parsedData)];
        console.log("🧩 Données avec ID uniques :", structuredData);

        setTreeData(structuredData);
      } catch (error) {
        console.error("❌ Erreur de parsing JSON :", error);
      }
    } else {
      console.warn("⚠️ Aucune donnée trouvée dans localStorage");
    }
  }, []);

  // Étape 3 : Gérer la sélection des fichiers
  const handleFileClick = (file: FileNode): void => {
    console.log("➡️ Fichier cliqué :", file);

    const isAudio = supportedAudioFormats.some((format) =>
      file.name.endsWith(format)
    );
    const isTranscription = file.name.endsWith(transcriptionFormat);

    console.log("🔍 Analyse du fichier :");
    console.log("- Est un fichier audio :", isAudio);
    console.log("- Est une transcription :", isTranscription);

    if (isAudio) {
      console.log("✅ Fichier audio détecté :", file);
      setSelectedFiles((prev) => ({ ...prev, audio: file }));

      console.log("🔗 Envoi à onFileSelect (audio) :", file);
      onFileSelect(file, "audio");
    } else if (isTranscription) {
      console.log("✅ Fichier transcription détecté :", file);
      setSelectedFiles((prev) => ({ ...prev, transcription: file }));

      console.log("🔗 Envoi à onFileSelect (transcription) :", file);
      onFileSelect(file, "transcription");
    } else {
      console.warn("❌ Fichier non pris en charge :", file);
    }
  };

  // Étape 4 : Fonction récursive pour afficher les nœuds
  const renderTree = (nodes: FileNode[]): React.ReactNode => {
    if (!nodes || nodes.length === 0) {
      return null;
    }

    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <Typography
            sx={{
              fontWeight:
                selectedFiles.audio?.id === node.id ||
                selectedFiles.transcription?.id === node.id
                  ? "bold"
                  : "normal",
              color:
                selectedFiles.audio?.id === node.id
                  ? "primary.main"
                  : selectedFiles.transcription?.id === node.id
                  ? "secondary.main"
                  : "inherit",
            }}
          >
            {node.name}
          </Typography>
        }
        onClick={() => handleFileClick(node)}
      >
        {node.children && node.children.length > 0
          ? renderTree(node.children)
          : null}
      </TreeItem>
    ));
  };

  return (
    <div>
      <h3>📂 Arborescence des Dossiers</h3>
      <Box
        sx={{
          maxHeight: "500px", // Hauteur maximale pour le scroll
          overflowY: "auto", // Défilement vertical si nécessaire
          border: "1px solid #ddd",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        <SimpleTreeView aria-label="arborescence des dossiers">
          {treeData.length > 0 ? (
            renderTree(treeData)
          ) : (
            <div>📭 Aucune donnée disponible</div>
          )}
        </SimpleTreeView>
      </Box>

      {/* Affichage des fichiers sélectionnés */}
      <Box sx={{ marginTop: 2 }}>
        {selectedFiles.audio && (
          <Typography>
            <strong>Fichier audio sélectionné :</strong>{" "}
            {selectedFiles.audio.name}
          </Typography>
        )}
        {selectedFiles.transcription && (
          <Typography>
            <strong>Fichier transcription sélectionné :</strong>{" "}
            {selectedFiles.transcription.name}
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default FolderTreeView;
