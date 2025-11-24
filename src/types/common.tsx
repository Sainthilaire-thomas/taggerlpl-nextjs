// Placez cette interface dans un fichier commun, par exemple src/types/common.ts
// Mettre Ã  jour l'interface Call
interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl: string; // Changer string | null en string uniquement
  // Ajouter les propriÃ©tÃ©s manquantes
  is_tagging_call?: boolean;
  preparedfortranscript?: boolean;
  [key: string]: any;
}

// DÃ©finition de l'interface TaggingCall (Ã  placer dans le mÃªme fichier types.ts)
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
