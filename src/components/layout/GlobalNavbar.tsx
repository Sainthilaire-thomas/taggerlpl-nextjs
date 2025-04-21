"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Slide,
  useScrollTrigger,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import AuthStatus from "../AuthStatus";
import { ThemeToggle } from "@/context/ThemeContext";

/**
 * GlobalNavbar améliorée qui:
 * 1. Se masque automatiquement lors du défilement
 * 2. Réapparaît au survol de la zone supérieure
 * 3. Est toujours visible sur les pages publiques
 * 4. Utilise une hauteur fixe et constante
 */
export default function GlobalNavbar() {
  const pathname = usePathname();
  const [navVisible, setNavVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Liste des chemins protégés qui utilisent AppLayout
  const protectedPaths = [
    "/dashboard",
    "/calls",
    "/tagging",
    "/new-tagging",
    "/tags/admin",
    "/analysis",
  ];

  // Vérifier si le chemin actuel est un chemin protégé
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Gestion du défilement pour masquer/afficher la barre
  useEffect(() => {
    if (typeof window === "undefined" || !isProtectedPath) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Défilement vers le bas et non tout en haut
        if (!isHovering) setNavVisible(false);
      } else {
        // Défilement vers le haut ou tout en haut
        setNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isHovering, isProtectedPath]);

  // Zone invisible de détection de survol en haut de l'écran
  const hoverDetectionZone = (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "20px",
        zIndex: 1400,
      }}
      onMouseEnter={() => {
        setIsHovering(true);
        setNavVisible(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
    />
  );

  // Sur les pages protégées, afficher une barre minimaliste qui peut se masquer
  if (isProtectedPath) {
    return (
      <>
        {hoverDetectionZone}
        <Slide appear={false} direction="down" in={navVisible || isHovering}>
          <AppBar
            position="fixed"
            color="primary"
            sx={{
              zIndex: 1300,
              height: "48px", // Hauteur fixe
              boxShadow: 2,
              opacity: isHovering ? 1 : 0.95,
              transition: "opacity 0.3s",
              "&:hover": {
                opacity: 1,
              },
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Toolbar
              variant="dense"
              sx={{
                minHeight: "48px !important", // Force la hauteur minimale
                padding: "0 16px", // Réduit le padding horizontal
              }}
            >
              <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                <Link
                  href="/"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  Tagging App
                </Link>
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AuthStatus />
                <Box sx={{ ml: 1 }}>
                  <ThemeToggle />
                </Box>
              </Box>
            </Toolbar>
          </AppBar>
        </Slide>
      </>
    );
  }

  // Sur les pages publiques, afficher la barre complète sans masquage automatique
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ minHeight: "48px !important" }}>
        {" "}
        {/* Hauteur cohérente */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            Tagging App
          </Link>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Link
            href="/tagging"
            style={{ color: "white", textDecoration: "none" }}
          >
            Tagging
          </Link>
          <AuthStatus />
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
