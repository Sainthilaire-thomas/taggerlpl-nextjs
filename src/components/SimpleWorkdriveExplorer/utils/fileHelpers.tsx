// utils/fileHelpers.ts

import { ZohoFile } from "../types";

/**
 * Vérifie si le fichier est un fichier audio basé sur son extension ou son type MIME
 */
export const isAudioFile = (file: ZohoFile): boolean => {
  if (!file) return false;

  // Récupérer l'extension du fichier de différentes façons possibles
  const extension =
    file.attributes?.extn ||
    getFileExtension(file.attributes?.name || file.name || "");

  // Liste des extensions audio courantes
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"];

  // Vérifier par extension
  if (extension && audioExtensions.includes(extension.toLowerCase())) {
    return true;
  }

  // Vérifier par type MIME si disponible
  const mimeType = file.attributes?.mime_type || "";
  return mimeType.startsWith("audio/");
};

/**
 * Vérifie si le fichier est une transcription (JSON, TXT, DOCX, etc.)
 */
export const isTranscriptionFile = (file: ZohoFile): boolean => {
  if (!file) return false;

  // Récupérer l'extension du fichier
  const extension =
    file.attributes?.extn ||
    getFileExtension(file.attributes?.name || file.name || "");

  // Liste des extensions de fichiers de transcription possibles
  const transcriptionExtensions = ["json", "txt", "docx", "doc", "pdf", "csv"];

  return extension && transcriptionExtensions.includes(extension.toLowerCase());
};

/**
 * Extrait l'extension d'un nom de fichier
 */
const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Télécharge un fichier audio depuis Zoho WorkDrive
 */
export const downloadFile = async (
  file: ZohoFile,
  token: string
): Promise<File> => {
  try {
    console.log("Téléchargement du fichier audio:", file.id);

    // Construire l'URL de téléchargement
    const downloadUrl =
      file.attributes?.download_url ||
      `https://workdrive.zoho.com/api/v1/download/${file.id}`;

    // Faire la requête à travers votre API proxy
    const proxyUrl = `/api/zoho/download?fileId=${file.id}`;

    const response = await fetch(proxyUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors du téléchargement: ${response.status} ${response.statusText}`
      );
    }

    // Obtenir le blob du fichier audio
    const blob = await response.blob();

    // Déterminer le type MIME en fonction de l'extension
    const extension =
      file.attributes?.extn ||
      getFileExtension(file.attributes?.name || file.name || "");
    const mimeType =
      getMimeTypeFromExtension(extension) || blob.type || "audio/mpeg";

    // Créer un objet File à partir du blob
    const fileName =
      file.attributes?.name || file.name || `audio_file.${extension || "mp3"}`;
    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    throw error;
  }
};

/**
 * Télécharge et traite un fichier de transcription depuis Zoho WorkDrive
 */
export const downloadTranscription = async (
  file: ZohoFile,
  token: string
): Promise<string> => {
  try {
    console.log("Téléchargement de la transcription:", file.id);

    // Construire l'URL de téléchargement
    const proxyUrl = `/api/zoho/download?fileId=${file.id}`;

    const response = await fetch(proxyUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors du téléchargement: ${response.status} ${response.statusText}`
      );
    }

    // Obtenir l'extension du fichier
    const extension =
      file.attributes?.extn ||
      getFileExtension(file.attributes?.name || file.name || "");

    // Traiter différemment selon le type de fichier
    if (extension === "json") {
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } else if (extension === "txt") {
      return await response.text();
    } else if (["docx", "doc"].includes(extension)) {
      // Pour les fichiers Word, nous pourrions avoir besoin d'un traitement spécial
      // Pour l'instant, on récupère simplement le texte brut
      const blob = await response.blob();
      // Idéalement, utilisez une bibliothèque comme mammoth.js pour convertir DOCX en texte
      return `[Contenu du fichier ${extension.toUpperCase()}] - Veuillez convertir ce fichier manuellement.`;
    } else {
      // Fallback pour les autres types de fichiers
      return await response.text();
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement de la transcription:", error);
    throw error;
  }
};

/**
 * Détermine le type MIME à partir de l'extension du fichier
 */
const getMimeTypeFromExtension = (extension: string): string | null => {
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    wma: "audio/x-ms-wma",
    json: "application/json",
    txt: "text/plain",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pdf: "application/pdf",
    csv: "text/csv",
  };

  return extension && mimeTypes[extension.toLowerCase()]
    ? mimeTypes[extension.toLowerCase()]
    : null;
};
