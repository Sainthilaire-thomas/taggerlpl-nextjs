"use client";

import React, { ReactNode, useState } from "react";
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
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// Phase 1 icons
import Inventory2Icon from "@mui/icons-material/Inventory2";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FolderIcon from "@mui/icons-material/Folder";
import PhoneIcon from "@mui/icons-material/Phone";
import DashboardIcon from "@mui/icons-material/Dashboard";

// Phase 2 icons
import EditNoteIcon from "@mui/icons-material/EditNote";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Phase 3 icons
import ScienceIcon from "@mui/icons-material/Science";
import BiotechIcon from "@mui/icons-material/Biotech";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useRouter, usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
  badge?: string;
}

const navigationStructure: MenuItem[] = [
  {
    name: "Phase 1: Corpus",
    icon: <Inventory2Icon />,
    children: [
      { name: "Import appels", icon: <UploadFileIcon />, path: "/phase1-corpus/import" },
      { name: "WorkDrive Explorer", icon: <FolderIcon />, path: "/phase1-corpus/workdrive" },
      { name: "Gestion corpus", icon: <DashboardIcon />, path: "/phase1-corpus/management" },
      { name: "Gestion appels (Legacy)", icon: <PhoneIcon />, path: "/calls" },
    ],
  },
  {
    name: "Phase 2: Annotation",
    icon: <EditNoteIcon />,
    children: [{ name: "Tags Management", icon: <SettingsIcon />, path: "/phase2-annotation/tags-management" },
      { name: "Supervision", icon: <VisibilityIcon />, path: "/phase2-annotation/supervision" },
      { name: "Liste des appels", icon: <LocalOfferIcon />, path: "/phase2-annotation/transcript" },
    ],
  },
  {
    name: "Phase 3: Analyse",
    icon: <ScienceIcon />,
    children: [
      { name: "Level 0: Gold Standard", icon: <CheckCircleIcon />, path: "/phase3-analysis/level0/inter-annotator" },
      { name: "Level 1: AlgorithmLab", icon: <BiotechIcon />, path: "/phase3-analysis/level1/algorithm-lab" },
      { name: "Level 2: Hypotheses", icon: <ScienceIcon />, path: "/phase3-analysis/level2" },
      { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    ],
  },
];

const expandedDrawerWidth = 280;
const collapsedDrawerWidth = 64;
const navbarHeight = 48;

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Phase 1: Corpus",
    "Phase 2: Annotation", 
    "Phase 3: Analyse"
  ]);
  
  const pathname = usePathname();
  const router = useRouter();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const toggleDrawerExpanded = () => {
    setDrawerExpanded(!drawerExpanded);
    setIsHovering(false);
  };

  const handleDrawerHover = (hovering: boolean) => {
    if (!isMobile) setIsHovering(hovering);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const navigateTo = (path: string) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  const currentDrawerWidth = isMobile
    ? 0
    : drawerExpanded || isHovering
    ? expandedDrawerWidth
    : collapsedDrawerWidth;

  const isExpanded = drawerExpanded || isHovering || isMobile;

  const drawer = (
    <div
      onMouseEnter={() => handleDrawerHover(true)}
      onMouseLeave={() => handleDrawerHover(false)}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: "64px" }}>
        <Typography variant="h6" noWrap sx={{ opacity: isExpanded ? 1 : 0, transition: "opacity 0.2s" }}>
          TaggerLPL
        </Typography>
        {!isMobile && (
          <IconButton onClick={toggleDrawerExpanded}>
            {drawerExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      <List>
        {navigationStructure.map((phase) => (
          <div key={phase.name}>
            <ListItemButton
              onClick={() => isExpanded && toggleSection(phase.name)}
              sx={{
                py: 1.5,
                backgroundColor: theme.palette.primary.dark,
                color: "white",
                "&:hover": { backgroundColor: theme.palette.primary.main },
                justifyContent: !isExpanded ? "center" : "flex-start",
              }}
            >
              <ListItemIcon sx={{ minWidth: !isExpanded ? 24 : 40, color: "white" }}>
                {phase.icon}
              </ListItemIcon>
              {isExpanded && (
                <>
                  <ListItemText primary={phase.name} primaryTypographyProps={{ fontWeight: "bold" }} />
                  {expandedSections.includes(phase.name) ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>

            <Collapse in={expandedSections.includes(phase.name) && isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {phase.children?.map((item) => (
                  <Tooltip
                    key={item.name}
                    title={!isExpanded ? item.name : ""}
                    placement="right"
                  >
                    <ListItemButton
                      onClick={() => item.path && navigateTo(item.path)}
                      selected={pathname === item.path}
                      sx={{
                        pl: isExpanded ? 4 : 2,
                        py: 1,
                        "&.Mui-selected": {
                          backgroundColor: theme.palette.primary.light,
                          "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
                            color: theme.palette.primary.contrastText,
                            fontWeight: "bold",
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: !isExpanded ? 24 : 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      {isExpanded && (
                        <ListItemText 
                          primary={item.name}
                          primaryTypographyProps={{ fontSize: "0.9rem" }}
                        />
                      )}
                      {item.badge && isExpanded && (
                        <Box
                          sx={{
                            backgroundColor: "success.main",
                            color: "success.contrastText",
                            fontSize: "0.65rem",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontWeight: "bold",
                          }}
                        >
                          {item.badge}
                        </Box>
                      )}
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: isMobile ? expandedDrawerWidth : currentDrawerWidth,
            marginTop: `${navbarHeight}px`,
            height: `calc(100% - ${navbarHeight}px)`,
            transition: theme.transitions.create("width"),
            overflowX: "hidden",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: { xs: 0, sm: `${currentDrawerWidth}px` },
          paddingTop: `${navbarHeight}px`,
          transition: theme.transitions.create("margin-left"),
        }}
      >
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ position: "fixed", top: navbarHeight + 8, left: 8, zIndex: 1100 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ p: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
}




