"use client";

import { ReactNode, useState, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Tooltip,
  ListItemButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PhoneIcon from "@mui/icons-material/Phone";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useRouter, usePathname } from "next/navigation";

const modules = [
  { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { name: "Gestion des appels", icon: <PhoneIcon />, path: "/calls" },
  { name: "Tagging (Nouveau)", icon: <LocalOfferIcon />, path: "/new-tagging" },
  { name: "Supervision", icon: <VisibilityIcon />, path: "/supervision" },
  { name: "Tagging (Classique)", icon: <LocalOfferIcon />, path: "/tagging" },
  { name: "Administration des tags", icon: <SettingsIcon />, path: "/tags" },
  { name: "Analyse et rapports", icon: <BarChartIcon />, path: "/analysis" },
];

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 64;
const navbarHeight = 48;

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ RESET: Commencer avec sidebar rétractée
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // ✅ RESET: Vider le localStorage au premier chargement
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Reset forcé
      localStorage.removeItem("drawerExpanded");
      localStorage.setItem("drawerExpanded", "false");

      console.log("🔄 RESET: localStorage vidé, sidebar forcée à rétractée");
    }
  }, []);

  // Sauvegarder l'état du drawer dans localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("drawerExpanded", String(drawerExpanded));
      console.log("💾 localStorage mis à jour:", drawerExpanded);
    }
  }, [drawerExpanded]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawerExpanded = () => {
    setDrawerExpanded((prevState) => {
      const newState = !prevState;
      console.log(
        "🔄 Toggle drawer - Ancien état:",
        prevState,
        "→ Nouveau état:",
        newState
      );
      return newState;
    });
    setIsHovering(false);
  };

  const handleDrawerHover = (hovering: boolean) => {
    if (!isMobile) {
      console.log("🖱️ Hover:", hovering);
      setIsHovering(hovering);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // ✅ Largeur effective du drawer
  const currentDrawerWidth = isMobile
    ? 0
    : drawerExpanded || isHovering
    ? expandedDrawerWidth
    : collapsedDrawerWidth;

  // ✅ Debug détaillé
  console.log("📐 AppLayout State:", {
    drawerExpanded,
    isHovering,
    currentDrawerWidth,
    isMobile,
    "Sidebar devrait être":
      drawerExpanded || isHovering ? "ÉTENDUE (240px)" : "RÉTRACTÉE (64px)",
  });

  const drawer = (
    <div
      onMouseEnter={() => handleDrawerHover(true)}
      onMouseLeave={() => handleDrawerHover(false)}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: "64px",
        }}
      >
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            opacity: drawerExpanded || isHovering || isMobile ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          Tagging App
        </Typography>
        {!isMobile && (
          <IconButton onClick={toggleDrawerExpanded}>
            {drawerExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {modules.map((module) => (
          <Tooltip
            title={!drawerExpanded && !isHovering ? module.name : ""}
            placement="right"
            key={`tooltip-${module.name}`}
          >
            <ListItemButton
              key={module.name}
              onClick={() => navigateTo(module.path)}
              selected={pathname === module.path}
              sx={{
                py: 1.5,
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.light,
                  "& .MuiListItemIcon-root": {
                    color: theme.palette.primary.contrastText,
                  },
                  "& .MuiListItemText-primary": {
                    color: theme.palette.primary.contrastText,
                    fontWeight: "bold",
                  },
                },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                position: "relative",
                justifyContent:
                  !drawerExpanded && !isHovering && !isMobile
                    ? "center"
                    : "flex-start",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth:
                    !drawerExpanded && !isHovering && !isMobile ? 24 : 40,
                  color:
                    pathname === module.path
                      ? theme.palette.primary.contrastText
                      : "",
                }}
              >
                {module.icon}
              </ListItemIcon>

              <ListItemText
                primary={module.name}
                sx={{
                  opacity: drawerExpanded || isHovering || isMobile ? 1 : 0,
                  display:
                    drawerExpanded || isHovering || isMobile ? "block" : "none",
                  transition: "opacity 0.3s",
                }}
              />

              {/* Badges */}
              {module.path === "/new-tagging" &&
                (drawerExpanded || isHovering || isMobile) && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      backgroundColor: "success.main",
                      color: "success.contrastText",
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: 8,
                      fontWeight: "bold",
                    }}
                  >
                    NEW
                  </Box>
                )}

              {module.path === "/tagging" &&
                (drawerExpanded || isHovering || isMobile) && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      backgroundColor: "text.disabled",
                      color: "background.paper",
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: 8,
                    }}
                  >
                    CLASSIC
                  </Box>
                )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* ✅ SIDEBAR - Simplifiée */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: isMobile
              ? expandedDrawerWidth
              : drawerExpanded || isHovering
              ? expandedDrawerWidth
              : collapsedDrawerWidth,
            marginTop: `${navbarHeight}px`,
            height: `calc(100% - ${navbarHeight}px)`,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
            position: "fixed",
            zIndex: 1200,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* ✅ CONTENU PRINCIPAL - Simplifié */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: {
            xs: 0,
            sm: `${currentDrawerWidth}px`,
          },
          paddingTop: `${navbarHeight}px`,
          minHeight: "100vh",
          transition: theme.transitions.create("margin-left", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          // ✅ Debug visuel
          backgroundColor: "background.default",
        }}
      >
        {/* Debug info visuel */}
        <Box
          sx={{
            position: "fixed",
            top: 60,
            right: 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            p: 1,
            borderRadius: 1,
            fontSize: "0.8rem",
            zIndex: 9999,
          }}
        >
          Width: {currentDrawerWidth}px
          <br />
          Expanded: {drawerExpanded ? "OUI" : "NON"}
          <br />
          Hover: {isHovering ? "OUI" : "NON"}
        </Box>

        {/* Bouton mobile */}
        {isMobile && (
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              position: "fixed",
              top: navbarHeight + 8,
              left: 8,
              zIndex: 1100,
              backgroundColor: "background.paper",
              boxShadow: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Contenu avec padding réduit */}
        <Box
          sx={{
            px: 2, // Padding horizontal réduit (16px au lieu de 24px)
            py: 2, // Padding vertical réduit
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
