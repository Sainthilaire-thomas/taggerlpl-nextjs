// types.ts
export interface ZohoFile {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  originalId?: string;
  [key: string]: any;
}

export interface ZohoAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
}

export interface SimpleWorkdriveExplorerProps {
  onFilesSelect: (audioFile: File | null, transcriptionText?: string) => void;
  rootFolderId?: string;
}
