// types.ts - Version étendue avec nouveaux modes
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
 * ✅ NOUVEAU: Types de modes pour SimpleWorkdriveExplorer
 */
export type WorkdriveExplorerMode =
  | "full"
  | "audio_only"
  | "transcription_only";

/**
 * ✅ MISE À JOUR: Props étendues pour le composant SimpleWorkdriveExplorer
 */
export interface SimpleWorkdriveExplorerProps {
  onFilesSelect: (
    audioFile: File | null,
    transcriptionText?: string,
    workdriveFileName?: string
  ) => void;
  rootFolderId?: string;
  // ✅ NOUVELLES PROPS
  mode?: WorkdriveExplorerMode; // Mode d'utilisation
  audioOnly?: boolean; // Legacy support - sera mappé vers mode
  transcriptionOnly?: boolean; // Legacy support - sera mappé vers mode
  showSelectionSummary?: boolean; // Afficher/masquer le résumé de sélection
  maxSelections?: {
    audio: number;
    transcription: number;
  };
  // ✅ Props pour personnalisation de l'interface
  title?: string; // Titre personnalisé
  description?: string; // Description personnalisée
  showTabs?: boolean; // Afficher les onglets Navigation/Recherche
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

/**
 * ✅ NOUVEAU: Interface pour les résultats de recherche
 */
export interface SearchResult {
  files: ZohoFile[];
  totalFound: number;
  searchedFolders: number;
  isSearching: boolean;
  searchQuery: string;
}
