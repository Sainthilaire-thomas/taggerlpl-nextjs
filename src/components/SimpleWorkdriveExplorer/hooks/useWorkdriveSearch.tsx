// hooks/useWorkdriveSearch.ts
import { useState, useCallback, useRef } from "react";
import { ZohoFile } from "../types";

interface SearchResult {
  files: ZohoFile[];
  totalFound: number;
  searchedFolders: number;
  isSearching: boolean;
  searchQuery: string;
}

interface UseWorkdriveSearchProps {
  accessToken: string | null;
  currentFolderId: string;
}

export const useWorkdriveSearch = ({
  accessToken,
  currentFolderId,
}: UseWorkdriveSearchProps) => {
  const [searchResults, setSearchResults] = useState<SearchResult>({
    files: [],
    totalFound: 0,
    searchedFolders: 0,
    isSearching: false,
    searchQuery: "",
  });

  const searchAbortController = useRef<AbortController | null>(null);

  // Recherche récursive dans un dossier et ses sous-dossiers
  const searchInFolder = async (
    folderId: string,
    query: string,
    signal: AbortSignal,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<{ files: ZohoFile[]; searchedFolders: number }> => {
    if (currentDepth >= maxDepth || signal.aborted) {
      return { files: [], searchedFolders: 0 };
    }

    try {
      const response = await fetch(`/api/zoho/files?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const files = data.data || [];

      let searchedFolders = 1;
      let matchingFiles: ZohoFile[] = [];
      let subFolderFiles: ZohoFile[] = [];

      // Filtrer les fichiers qui correspondent à la recherche
      matchingFiles = files.filter((file: ZohoFile) => {
        const fileName = file.attributes?.name || file.name || "";
        const isFolder =
          file.attributes?.is_folder === true ||
          file.attributes?.type === "folder" ||
          file.type === "folder";

        console.log(
          `Fichier analysé: ${fileName}, isFolder: ${isFolder}, match: ${fileName
            .toLowerCase()
            .includes(query.toLowerCase())}`
        );

        return (
          !isFolder && fileName.toLowerCase().includes(query.toLowerCase())
        );
      });

      // Chercher récursivement dans les sous-dossiers
      const subFolders = files.filter((file: ZohoFile) => {
        const isFolder =
          file.attributes?.is_folder === true ||
          file.attributes?.type === "folder" ||
          file.type === "folder";
        console.log(
          `Sous-dossier détecté: ${
            file.attributes?.name || file.name
          }, isFolder: ${isFolder}`
        );
        return isFolder;
      });

      for (const folder of subFolders.slice(0, 10)) {
        // Limiter à 10 sous-dossiers par niveau
        if (signal.aborted) break;

        const subResult = await searchInFolder(
          folder.id,
          query,
          signal,
          maxDepth,
          currentDepth + 1
        );

        subFolderFiles = [...subFolderFiles, ...subResult.files];
        searchedFolders += subResult.searchedFolders;
      }

      return {
        files: [...matchingFiles, ...subFolderFiles],
        searchedFolders,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { files: [], searchedFolders: 0 };
      }
      console.error("Erreur lors de la recherche:", error);
      return { files: [], searchedFolders: 0 };
    }
  };

  // Fonction principale de recherche
  const searchFiles = useCallback(
    async (query: string) => {
      if (!accessToken || !query.trim() || query.length < 2) {
        setSearchResults({
          files: [],
          totalFound: 0,
          searchedFolders: 0,
          isSearching: false,
          searchQuery: "",
        });
        return;
      }

      // Annuler la recherche précédente
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      // Créer un nouveau controller pour cette recherche
      searchAbortController.current = new AbortController();
      const signal = searchAbortController.current.signal;

      setSearchResults((prev) => ({
        ...prev,
        isSearching: true,
        searchQuery: query,
        files: [],
        totalFound: 0,
        searchedFolders: 0,
      }));

      try {
        const result = await searchInFolder(currentFolderId, query, signal);

        if (!signal.aborted) {
          setSearchResults({
            files: result.files,
            totalFound: result.files.length,
            searchedFolders: result.searchedFolders,
            isSearching: false,
            searchQuery: query,
          });
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Erreur lors de la recherche:", error);
          setSearchResults((prev) => ({
            ...prev,
            isSearching: false,
          }));
        }
      }
    },
    [accessToken, currentFolderId]
  );

  // Effacer la recherche
  const clearSearch = useCallback(() => {
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    setSearchResults({
      files: [],
      totalFound: 0,
      searchedFolders: 0,
      isSearching: false,
      searchQuery: "",
    });
  }, []);

  return {
    searchResults,
    searchFiles,
    clearSearch,
  };
};
