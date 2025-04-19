// components/common/AuthStatus.tsx
"use client";

import React from "react";
import {
  Button,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import { AccountCircle, Login } from "@mui/icons-material";
import Link from "next/link";
import { useSupabase } from "@/context/SupabaseContext";

export default function AuthStatus() {
  const { supabase } = useSupabase();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Charger les données utilisateur au montage du composant
  React.useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoading(true);

        // Vérifier d'abord si une session existe pour éviter l'erreur
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData && sessionData.session) {
          // Une session existe, on peut récupérer l'utilisateur
          const { data } = await supabase.auth.getUser();
          setUser(data.user);
        } else {
          // Pas de session, donc pas d'utilisateur connecté
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();

    // Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    // Nettoyage à la destruction du composant
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    // Rediriger vers la page de connexion
    window.location.href = "/login";
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Rafraîchir la page après déconnexion
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
    handleClose();
  };

  if (isLoading) {
    return <CircularProgress size={24} color="inherit" />;
  }

  if (!user) {
    return (
      <Button color="inherit" onClick={handleLogin} startIcon={<Login />}>
        Se connecter
      </Button>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Button
        color="inherit"
        onClick={handleMenu}
        startIcon={
          user.user_metadata?.avatar_url ? (
            <Avatar
              src={user.user_metadata.avatar_url}
              sx={{ width: 24, height: 24 }}
            />
          ) : (
            <AccountCircle />
          )
        }
      >
        {user.email?.split("@")[0] || "Utilisateur"}
      </Button>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disabled>
          <Typography variant="body2" color="textSecondary">
            {user.email}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>Déconnexion</MenuItem>
      </Menu>
    </Box>
  );
}
