// utils/authHelpers.ts
import { ZohoToken } from "../types"; // Correction: ZohoToken au lieu de ZohoAuthToken

export const handleZohoAuth = () => {
  // Rediriger vers l'endpoint d'authentification Zoho avec l'URL actuelle comme redirection
  const currentUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/api/zoho/auth?redirect=${currentUrl}`;
};

export const parseZohoToken = (tokenParam: string): ZohoToken | null => {
  // Correction: ZohoToken
  try {
    return JSON.parse(decodeURIComponent(tokenParam)) as ZohoToken; // Correction: ZohoToken
  } catch (error) {
    console.error("Erreur lors du traitement du token:", error);
    return null; // Correction: suppression de l'espace dans "retur n"
  }
};

export const cleanAuthTokenFromUrl = () => {
  const newUrl = window.location.pathname;
  window.history.replaceState({}, document.title, newUrl);
};
