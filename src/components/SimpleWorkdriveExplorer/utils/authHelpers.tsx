// utils/authHelpers.ts
import { ZohoAuthToken } from "../types";

export const handleZohoAuth = () => {
  // Rediriger vers l'endpoint d'authentification Zoho avec l'URL actuelle comme redirection
  const currentUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/api/zoho/auth?redirect=${currentUrl}`;
};

export const parseZohoToken = (tokenParam: string): ZohoAuthToken | null => {
  try {
    return JSON.parse(decodeURIComponent(tokenParam)) as ZohoAuthToken;
  } catch (error) {
    console.error("Erreur lors du traitement du token:", error);
    return null;
  }
};

export const cleanAuthTokenFromUrl = () => {
  const newUrl = window.location.pathname;
  window.history.replaceState({}, document.title, newUrl);
};
