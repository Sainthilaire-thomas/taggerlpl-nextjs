"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { IconButton, CssBaseline } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

// Contexte de mode de couleur
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "dark" as "light" | "dark",
});

// Hook personnalisé pour gérer le thème
export function useCustomTheme() {
  // Commencer par défaut en mode sombre
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "dark" ? "light" : "dark";

      return newMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#1976d2" : "#90caf9",
          },
          background: {
            default: mode === "dark" ? "#121212" : "#ffffff",
            paper: mode === "dark" ? "#1e1e1e" : "#f5f5f5",
          },
          text: {
            primary: mode === "dark" ? "#ffffff" : "#000000",
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: mode === "dark" ? "#121212" : "#ffffff",
                color: mode === "dark" ? "#ffffff" : "#000000",
              },
            },
          },
        },
      }),
    [mode]
  );

  return { theme, mode, toggleColorMode };
}

// Provider de thème
export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const { theme, mode, toggleColorMode } = useCustomTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// Composant de toggle de thème
export function ThemeToggle() {
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <IconButton
      onClick={toggleColorMode}
      color="inherit"
      aria-label="toggle theme"
    >
      {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}
