// components/auth/ProtectedRoute.jsx
"use client";

import { useSupabase } from "@/context/SupabaseContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function ProtectedRoute({ children }) {
  const { supabase } = useSupabase();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, [supabase, router]);

  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Vérification de l'authentification...
        </Typography>
      </Box>
    );
  }

  return isAuthenticated ? children : null;
}
