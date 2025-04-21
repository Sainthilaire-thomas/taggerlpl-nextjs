"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import supabase from "@/lib/supabaseClient";

// Définition des types
interface ZohoContextType {
  zohoRefreshToken: string | null;
  updateZohoRefreshToken: (token: string) => Promise<void>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

interface ZohoProviderProps {
  children: ReactNode;
}

// Création du contexte avec une valeur par défaut typée
const ZohoContext = createContext<ZohoContextType | undefined>(undefined);

export const ZohoProvider = ({ children }: ZohoProviderProps) => {
  const [zohoRefreshToken, setZohoRefreshToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Fonction pour mettre à jour le refreshToken
  const updateZohoRefreshToken = async (token: string) => {
    console.log("Updating Zoho refreshToken:", token);
    setZohoRefreshToken(token);

    // Si vous souhaitez stocker dans Supabase sans Auth0, vous pouvez
    // utiliser un autre moyen d'identifier l'utilisateur ou stocker
    // simplement le token dans localStorage
    // Exemple avec localStorage:
    localStorage.setItem("zoho_refresh_token", token);
  };

  return (
    <ZohoContext.Provider
      value={{
        zohoRefreshToken,
        updateZohoRefreshToken,
        accessToken,
        setAccessToken,
      }}
    >
      {children}
    </ZohoContext.Provider>
  );
};

export const useZoho = (): ZohoContextType => {
  const context = useContext(ZohoContext);

  if (context === undefined) {
    throw new Error("useZoho must be used within a ZohoProvider");
  }

  return context;
};
