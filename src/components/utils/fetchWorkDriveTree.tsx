/**
 * Utility functions for fetching and transforming WorkDrive folder structure
 */

// Type definitions
interface FileAttributes {
  name?: string;
  is_folder?: boolean;
  type?: string;
  mime_type?: string;
  size?: number;
  modified_time?: string;
  download_url?: string;
  [key: string]: any;
}

interface WorkDriveItem {
  id: string;
  attributes?: FileAttributes;
  [key: string]: any;
}

interface ApiResponse {
  data?: WorkDriveItem[];
  [key: string]: any;
}

interface TreeNode {
  id: string;
  name: string;
  type: string;
  is_folder?: boolean;
  children?: TreeNode[];
  mime_type?: string;
  size?: number;
  modified_time?: string;
  download_link?: string;
  [key: string]: any;
}

/**
 * Pause execution for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches a single page of files from a folder
 * @param apiProxyUrl - The API proxy URL
 * @param folderId - The ID of the folder to fetch
 * @param accessToken - The access token for authorization
 * @param offset - Pagination offset (starting position)
 * @param limit - Number of items to fetch per page
 * @returns Array of WorkDrive items
 */
const fetchFolderPage = async (
  apiProxyUrl: string,
  folderId: string,
  accessToken: string,
  offset: number = 0,
  limit: number = 50
): Promise<WorkDriveItem[]> => {
  const path = encodeURIComponent(
    `/files/${folderId}/files?page[offset]=${offset}&page[limit]=${limit}`
  );

  const url = `${apiProxyUrl}?path=${path}`;

  console.log(`🔗 Récupération des fichiers pour dossier ${folderId} : ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const result: ApiResponse = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`❌ Erreur pour la récupération de ${folderId}:`, error);
    return [];
  }
};

/**
 * Transforms WorkDrive API data into a tree structure
 * @param items - Array of WorkDrive items from the API
 * @returns Transformed tree structure
 */
const transformWorkDriveData = (items: WorkDriveItem[]): TreeNode[] => {
  const tree: TreeNode[] = [];

  items.forEach((item) => {
    const isFolder =
      item.attributes?.is_folder || item.attributes?.type === "folder";

    if (isFolder) {
      // C'est un dossier
      tree.push({
        id: item.id,
        name: item.attributes?.name || "Dossier sans nom",
        type: "folders",
        is_folder: true, // Précision
        children: [], // À remplir récursivement
      });
    } else {
      // C'est un fichier
      tree.push({
        id: item.id,
        name: item.attributes?.name || "Fichier sans nom",
        type: "files",
        mime_type: item.attributes?.mime_type || "inconnu",
        size: item.attributes?.size || 0,
        modified_time: item.attributes?.modified_time || "non disponible",
        download_link: item.attributes?.download_url || "",
      });
    }
  });

  return tree;
};

/**
 * Recursively fetches the entire WorkDrive folder structure
 * @param folderId - Root folder ID to start from
 * @param accessToken - Access token for authorization
 * @param delay - Delay between API calls in milliseconds
 */
export const fetchWorkDriveTree = async (
  folderId: string,
  accessToken: string,
  delay: number = 1000
): Promise<void> => {
  const API_PROXY_URL = "http://localhost:8888/.netlify/functions/zohoProxy";

  /**
   * Recursively fetches folder contents and builds the tree
   * @param folderId - Folder ID to fetch
   * @param level - Current recursion level (for logging)
   * @returns Tree structure for the folder
   */
  const fetchFolderContents = async (
    folderId: string,
    level: number = 0
  ): Promise<TreeNode> => {
    let allItems: WorkDriveItem[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    console.log(`${" ".repeat(level * 2)}📂 Début exploration : ${folderId}`);

    while (hasMore) {
      const pageItems = await fetchFolderPage(
        API_PROXY_URL,
        folderId,
        accessToken,
        offset,
        limit
      );

      if (!Array.isArray(pageItems)) {
        console.warn(
          `⚠️ Les données retournées pour ${folderId} ne sont pas un tableau.`
        );
        break;
      }

      allItems = [...allItems, ...pageItems];
      console.log(
        `${" ".repeat(level * 2)}🔄 Page récupérée : ${offset} - ${
          offset + limit
        }, ${pageItems.length} éléments`
      );

      if (pageItems.length < limit) hasMore = false; // Stop si moins que la limite
      offset += limit;
      await sleep(delay);
    }

    const folderTree: TreeNode = {
      id: folderId,
      name: `Dossier ${folderId}`,
      type: "folders",
      children: transformWorkDriveData(allItems),
    };

    console.log(
      `${" ".repeat(level * 2)}✅ Contenu du dossier ${folderId} :`,
      folderTree
    );

    // Exploration récursive des sous-dossiers
    for (const child of folderTree.children || []) {
      const isFolder = child.is_folder || child.type === "folders";

      if (isFolder) {
        console.log(
          `${" ".repeat(level * 2)}🔍 Exploration récursive pour ${
            child.name
          } (${child.id})`
        );

        // Exploration récursive des sous-dossiers
        const childContents = await fetchFolderContents(child.id, level + 1);
        child.children = childContents.children;
      }
    }

    return folderTree; // Retourner l'arborescence complète pour ce dossier
  };

  console.log("🚀 Début de l'exploration de l'arborescence...");
  const tree = await fetchFolderContents(folderId);

  if (tree) {
    console.log("📦 Arborescence complète sauvegardée :", tree);
    localStorage.setItem("workdriveTree", JSON.stringify(tree));
    console.log("✅ Arborescence finale prête !");
  }
};
