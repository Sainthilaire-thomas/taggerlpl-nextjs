import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Turbopack
  experimental: {
    turbo: {
      // Règles personnalisées si nécessaire
      // loaders: { ... }
      // resolveAlias: { ... }
    },
  },

  // Autres configurations générales
  swcMinify: true,

  // Optimisations de compilation
  optimizePackageImports: [
    "@mui/material",
    "@mui/icons-material",
    "react-color",
  ],

  // Configuration des extensions de pages
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;
