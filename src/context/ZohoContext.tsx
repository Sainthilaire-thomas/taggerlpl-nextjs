"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react"; // Importer le hook d'Auth0
import { supabase } from "@/lib/supabaseClient";

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
  const { user, isAuthenticated } = useAuth0(); // Utilisation du hook Auth0 pour récupérer l'utilisateur

  // Fonction pour récupérer et mettre à jour le refreshToken
  const updateZohoRefreshToken = async (token: string) => {
    console.log("Updating Zoho refreshToken:", token);
    setZohoRefreshToken(token);

    // Vérifier si Supabase est prêt avant de faire la mise à jour
    if (!isAuthenticated || !user) {
      console.warn("User is not authenticated or user data is missing.");
      return;
    }

    const userEmail = user.email;
    const userId = user.sub; // Le user.sub est l'ID unique de l'utilisateur dans Auth0

    if (!userEmail || !userId) {
      console.warn("User email or ID is missing in Auth0.");
      return;
    }

    console.log("Updating refresh token for user:", { userEmail, userId });

    // Mise à jour du refresh token dans Supabase avec fetchData
    const { error } = await supabase
      .from("users")
      .update({ refresh_token: token })
      .eq("email", userEmail);

    if (error) {
      console.error("Failed to save refresh token in Supabase:", error.message);
    } else {
      console.log(
        "Refresh token successfully saved in Supabase.",
        token,
        userEmail
      );
    }
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
