// hooks/useWorkdriveFiles.ts
import { useState, useEffect } from "react";
import { ZohoFile } from "../types";
import { useZoho } from "@/context/ZohoContext";

export const useWorkdriveFiles = (initialFolderId: string) => {
  const { accessToken } = useZoho();
  const [files, setFiles] = useState<ZohoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string>(initialFolderId);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: initialFolderId, name: "Racine" },
  ]);

  // Charger les fichiers quand le token ou le dossier change
  useEffect(() => {
    const loadFiles = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Utiliser l'API client pour récupérer les fichiers
        const response = await fetchFiles(currentFolder, accessToken);
        if (response) {
          setFiles(response);
        } else {
          setError("Impossible de récupérer les fichiers");
        }
      } catch (error) {
        console.error("Error loading files:", error);
        setError(
          `Erreur lors du chargement des fichiers: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [accessToken, currentFolder]);

  // Fonction simplifiée pour récupérer les fichiers
  const fetchFiles = async (
    folderId: string,
    token: string
  ): Promise<ZohoFile[] | null> => {
    if (!token) return null;

    try {
      console.log(`Fetching files for folder: ${folderId}`); // Ajout de log de débogage
      console.log(`Access Token: ${token.substring(0, 10)}...`); // Montrer une partie du token

      const response = await fetch(`/api/zoho/files?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status); // Log du statut de la réponse

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);

        if (response.status === 401) {
          console.error("Unauthorized: Token may be invalid or expired");
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Fetched files:", data); // Log des fichiers récupérés

      return data.data || [];
    } catch (error) {
      console.error("Error fetching files:", error);
      return null;
    }
  };

  // Gestionnaire pour naviguer vers un dossier
  const handleFolderClick = async (folderId: string, folderName?: string) => {
    console.log("handleFolderClick appelé avec:", folderId, folderName);

    try {
      setLoading(true);

      // Sauvegarder le dossier actuel dans l'historique
      if (currentFolder) {
        setFolderHistory((prev) => [
          ...prev,
          {
            id:
              typeof currentFolder === "string"
                ? currentFolder
                : currentFolder.id,
            name:
              typeof currentFolder === "string"
                ? "Dossier précédent"
                : currentFolder.name || "Dossier précédent",
          },
        ]);
      }

      // Mettre à jour le dossier courant
      setCurrentFolder({
        id: folderId,
        name: folderName || "Dossier",
      });

      // Ajouter au chemin
      if (folderName) {
        setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
      }

      // Charger les fichiers du nouveau dossier
      const response = await fetch(`/api/zoho/files?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur API: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Données reçues pour le dossier:", data);

      // Adapter les données pour qu'elles soient utilisables par votre composant
      if (data && data.data) {
        // Transformez les données si nécessaire pour les adapter à votre structure attendue
        setFiles(data.data);
      } else {
        setFiles([]);
        console.warn("Format de réponse inattendu:", data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dossier:", error);
      setError(
        `Erreur lors du chargement du dossier: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire pour revenir au dossier précédent
  const handleBack = () => {
    if (folderHistory.length > 0) {
      const previousFolder = folderHistory[folderHistory.length - 1];
      setFolderHistory((prev) => prev.slice(0, -1));
      setCurrentFolder(previousFolder);

      // Mise à jour du chemin du dossier
      setFolderPath((prev) => prev.slice(0, -1));
    }
  };

  // Gestionnaire pour revenir au dossier racine
  const handleHome = (rootFolderId: string) => {
    setFolderHistory([]);
    setCurrentFolder(rootFolderId);
    setFolderPath([{ id: rootFolderId, name: "Racine" }]);
  };

  // Gestionnaire de navigation par breadcrumb
  const handleBreadcrumbNavigation = (folderId: string, index: number) => {
    setCurrentFolder(folderId);
    setFolderPath((prev) => prev.slice(0, index + 1));
    setFolderHistory((prev) => prev.slice(0, index));
  };

  return {
    files,
    loading,
    currentFolder,
    folderHistory,
    error,
    folderPath,
    handleFolderClick,
    handleBack,
    handleHome,
    handleBreadcrumbNavigation,
    setError,
  };
};
