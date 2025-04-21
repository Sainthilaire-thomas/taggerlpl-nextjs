import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Turbopack (maintenant stable)
  turbopack: {
    // Vous pouvez ajouter ici des règles personnalisées si nécessaire
    // Exemple :
    // rules: { ... }
  },

  // Configuration des extensions de pages
  pageExtensions: ["ts", "tsx", "js", "jsx"],

  // Pour les optimisations MUI, utilisez maintenant la propriété transpilePackages
  // si vous avez besoin d'optimiser ces bibliothèques
  transpilePackages: ["@mui/material", "@mui/icons-material", "react-color"],
};

export default nextConfig;
