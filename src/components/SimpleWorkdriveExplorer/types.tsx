// types.ts

/**
 * Interface représentant un fichier Zoho Workdrive
 */
export interface ZohoFile {
  id: string;
  type?: string;
  name?: string; // Fallback quand le nom n'est pas dans les attributs
  originalId?: string; // Pour la compatibilité avec AudioList
  attributes?: {
    name?: string;
    display_attr_name?: string;
    display_html_name?: string;
    type?: string;
    is_folder?: boolean;
    extn?: string;
    mime_type?: string;
    download_url?: string;
    storage_info?: {
      size?: string;
      size_in_bytes?: number;
    };
    created_time?: string;
    modified_time?: string;
    [key: string]: any; // Pour les autres attributs
  };
  [key: string]: any; // Pour les autres propriétés
}

/**
 * Props pour le composant SimpleWorkdriveExplorer
 */
export interface SimpleWorkdriveExplorerProps {
  onFilesSelect: (audioFile: File, transcriptionText?: string) => void;
  rootFolderId?: string;
}

/**
 * Interface pour la structure des informations de dossier
 */
export interface FolderInfo {
  id: string;
  name: string;
}

/**
 * Interface pour le token Zoho après authentification
 */
export interface ZohoToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}
