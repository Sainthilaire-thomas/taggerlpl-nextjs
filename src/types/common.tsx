// Placez cette interface dans un fichier commun, par exemple src/types/common.ts
export interface ZohoFile {
  originalId: string | undefined;
  name: string;
  [key: string]: any;
}

// Mettre à jour l'interface Call
interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl: string; // Changer string | null en string uniquement
  // Ajouter les propriétés manquantes
  is_tagging_call?: boolean;
  preparedfortranscript?: boolean;
  [key: string]: any;
}

// Définition de l'interface TaggingCall (à placer dans le même fichier types.ts)
export interface TaggingCall {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl: string;
  is_tagging_call: boolean;
  preparedfortranscript: boolean;
  [key: string]: any;
}
