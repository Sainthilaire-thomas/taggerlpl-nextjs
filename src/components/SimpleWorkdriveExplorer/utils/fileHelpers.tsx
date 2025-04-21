// utils/fileHelpers.ts
import { ZohoFile } from "../types";

export const isAudioFile = (file: ZohoFile): boolean => {
  // Vérifiez d'abord que file existe
  if (!file) return false;

  const mimeType = file.mimeType?.toLowerCase();
  const name = file.name?.toLowerCase(); // Ajout de l'opérateur optionnel

  return (
    mimeType?.includes("audio") ||
    (name &&
      (name.endsWith(".mp3") ||
        name.endsWith(".wav") ||
        name.endsWith(".m4a") ||
        name.endsWith(".ogg")))
  );
};

export const isTranscriptionFile = (file: ZohoFile): boolean => {
  // Vérifiez d'abord que file existe
  if (!file) return false;

  const mimeType = file.mimeType?.toLowerCase();
  const name = file.name?.toLowerCase(); // Ajout de l'opérateur optionnel

  return (
    mimeType?.includes("text") ||
    mimeType?.includes("json") ||
    (name &&
      (name.endsWith(".txt") ||
        name.endsWith(".json") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx")))
  );
};

// Télécharger un fichier audio de Zoho
export const downloadFile = async (
  file: ZohoFile,
  accessToken: string
): Promise<File> => {
  const fileId = file.originalId || file.id;

  // Utiliser l'endpoint Next.js pour télécharger les fichiers
  const response = await fetch(`/api/zoho/download?fileId=${fileId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const blob = await response.blob();
  const fileName = file.name || "downloaded_file";

  // Créer un objet File
  return new File([blob], fileName, { type: contentType });
};

// Télécharger et lire un fichier de transcription
export const downloadTranscription = async (
  file: ZohoFile,
  accessToken: string
): Promise<string> => {
  const fileId = file.originalId || file.id;

  // Utiliser l'endpoint Next.js
  const response = await fetch(`/api/zoho/download?fileId=${fileId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";

  // Selon le type de contenu, traiter différemment
  if (contentType.includes("application/json")) {
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } else {
    // Pour le texte ou autres formats
    return await response.text();
  }
};
