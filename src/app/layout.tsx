"use client";
import { ReactNode } from "react";
import { TaggingDataProvider } from "@/features/shared/context";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ZohoProvider } from "@/context/ZohoContext";
import { ThemeModeProvider } from "@/context/ThemeContext";
import GlobalNavbar from "@/components/layout/GlobalNavbar";
import { SupabaseProvider } from "@/features/shared/context";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider>
          <SupabaseProvider>
            <GlobalNavbar />
            <ThemeModeProvider>
              <ZohoProvider>
                <TaggingDataProvider>
                  <CssBaseline />
                  {children}
                </TaggingDataProvider>
              </ZohoProvider>
            </ThemeModeProvider>
          </SupabaseProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
