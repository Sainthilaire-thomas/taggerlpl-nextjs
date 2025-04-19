import React from "react";
import { Button, Typography } from "@mui/material";

// Define props interface
interface AuthButtonProps {
  onSuccess?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onSuccess }) => {
  // Fonction pour gérer l'authentification avec Zoho
  const handleAuth = () => {
    // In Next.js, environment variables are accessed via process.env instead of import.meta.env
    // Public environment variables need to be prefixed with NEXT_PUBLIC_
    const clientId = process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI;

    // Define authentication scopes
    const scope =
      "WorkDrive.teamfolders.READ,WorkDrive.team.READ,WorkDrive.files.READ,ZohoFiles.files.READ,WorkDrive.files.CREATE,offline_access";
    const responseType = "code";
    const accessType = "offline";
    const prompt = "consent";

    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&scope=${scope}&access_type=${accessType}&prompt=${prompt}`;

    console.log("Redirecting to Zoho with the following URL:", authUrl);
    window.location.href = authUrl;

    if (onSuccess) onSuccess();
  };

  return (
    <Button variant="contained" color="secondary" onClick={handleAuth}>
      <Typography variant="caption" sx={{ fontSize: "10px" }}>
        Authenticate with Zoho WorkDrive
      </Typography>
    </Button>
  );
};

export default AuthButton;
