"use client";

import { ReactNode, useState, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Button,
  Tooltip,
  ListItemButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PhoneIcon from "@mui/icons-material/Phone";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useRouter, usePathname } from "next/navigation";

// Définition des modules de l'application
const modules = [
  { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { name: "Gestion des appels", icon: <PhoneIcon />, path: "/calls" },
  { name: "Tagging (Nouveau)", icon: <LocalOfferIcon />, path: "/new-tagging" },
  { name: "Tagging (Classique)", icon: <LocalOfferIcon />, path: "/tagging" },
  {
    name: "Administration des tags",
    icon: <SettingsIcon />,
    path: "/tags",
  },
  { name: "Analyse et rapports", icon: <BarChartIcon />, path: "/analysis" },
];

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 64; // Largeur réduite pour afficher uniquement les icônes
const navbarHeight = 48; // Hauteur de la GlobalNavbar en mode minimal

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Récupérer la préférence utilisateur du localStorage (seulement côté client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("drawerExpanded");
      if (savedState !== null) {
        setDrawerExpanded(savedState === "true");
      }
    }
  }, []);

  // Sauvegarder l'état du drawer dans localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("drawerExpanded", String(drawerExpanded));
    }
  }, [drawerExpanded]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawerExpanded = () => {
    // Assurez-vous que l'état est bien mis à jour
    setDrawerExpanded((prevState) => !prevState);
    // Réinitialisez l'état de survol pour éviter les conflits
    setIsHovering(false);

    // Log pour le débogage
    console.log("Toggle drawer clicked, new state will be:", !drawerExpanded);
  };

  const handleDrawerHover = (hovering: boolean) => {
    if (!isMobile) {
      setIsHovering(hovering);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Déterminer la largeur actuelle du drawer
  const currentDrawerWidth = isMobile
    ? expandedDrawerWidth
    : drawerExpanded || isHovering
    ? expandedDrawerWidth
    : collapsedDrawerWidth;

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
            {/* Utilisation de ListItemButton au lieu de ListItem avec button=true */}
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

              {/* Badge pour indiquer la nouvelle version */}
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

              {/* Badge pour indiquer la version classique */}
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* La AppBar est enlevée, GlobalNavbar prend sa place */}
      <Box
        component="nav"
        sx={{
          width: { sm: currentDrawerWidth },
          flexShrink: { sm: 0 },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          // Augmenter le z-index pour qu'il soit au-dessus du contenu mais sous la GlobalNavbar
          zIndex: 1200,
        }}
        aria-label="modules"
      >
        {/* Drawer mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Meilleure performance sur mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: expandedDrawerWidth,
              // Décaler le drawer sous la GlobalNavbar
              marginTop: `${navbarHeight}px`,
              height: `calc(100% - ${navbarHeight}px)`,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Drawer permanent (desktop) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: currentDrawerWidth,
              overflowX: "hidden",
              // Décaler le drawer sous la GlobalNavbar
              marginTop: `${navbarHeight}px`,
              height: `calc(100% - ${navbarHeight}px)`,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenu principal - CORRIGÉ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Supprimer le padding général
          padding: 0,
          // N'ajouter du padding que pour la navbar
          pt: `${navbarHeight}px`,
          //   width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          //   ml: { xs: 0, sm: `${currentDrawerWidth}px` },
          width: "100%",
          ml: 0,
          // Utiliser display flex pour un meilleur positionnement
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "auto",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Bouton de toggle pour mobile */}
        <IconButton
          color="primary"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            top: navbarHeight + 8,
            left: 8,
            display: { sm: "none" },
            zIndex: 1100,
            backgroundColor: "background.paper",
            boxShadow: 1,
            "&:hover": {
              backgroundColor: "background.default",
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Contenu de la page avec padding approprié mais sans décalage vertical excessif */}
        <Box sx={{ p: 3, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
