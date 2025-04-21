"use client";

import { ReactNode } from "react";
import { TaggingDataProvider } from "@/context/TaggingDataContext";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ZohoProvider } from "@/context/ZohoContext";
import { ThemeModeProvider, ThemeToggle } from "@/context/ThemeContext";
import GlobalNavbar from "@/components/layout/GlobalNavbar";
import { SupabaseProvider } from "@/context/SupabaseContext";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider>
          <SupabaseProvider>
            <ThemeModeProvider>
              {/* Le GlobalNavbar peut être conditionnel ou être utilisé 
                  uniquement pour les pages publiques si nécessaire */}
              <GlobalNavbar />

              {/* Positionnez le toggle au bon endroit dans votre UI */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  zIndex: 1300,
                }}
              >
                <ThemeToggle />
              </div>

              <CssBaseline />
              <ZohoProvider>
                <TaggingDataProvider>{children}</TaggingDataProvider>
              </ZohoProvider>
            </ThemeModeProvider>
          </SupabaseProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
