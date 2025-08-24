// components/shared/NavigationTabs.tsx
import React from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CheckCircle,
  Warning as AlertTriangle,
  Error as XCircle,
  Info,
  Lock,
} from "@mui/icons-material";

import { ValidationLevel } from "../../types/SharedTypes";

interface NavigationTabsProps {
  levels: ValidationLevel[];
  currentLevel: number;
  onLevelChange: (level: number) => void;
  canAccessLevel: (level: number) => boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  levels,
  currentLevel,
  onLevelChange,
  canAccessLevel,
}) => {
  const theme = useTheme();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated":
        return <CheckCircle sx={{ fontSize: 20, color: "success.main" }} />;
      case "in-progress":
        return <AlertTriangle sx={{ fontSize: 20, color: "warning.main" }} />;
      case "failed":
        return <XCircle sx={{ fontSize: 20, color: "error.main" }} />;
      default:
        return <Info sx={{ fontSize: 20, color: "grey.400" }} />;
    }
  };

  return (
    <Box
      sx={{
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
        borderRadius: 2,
        border: 1,
        borderColor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.divider, 0.5)
            : theme.palette.grey[300],
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex" }}>
        {levels.map((level) => {
          const isAccessible = canAccessLevel(level.id);
          const isActive = currentLevel === level.id;

          return (
            <Button
              key={level.id}
              onClick={() => isAccessible && onLevelChange(level.id)}
              disabled={!isAccessible}
              sx={{
                flex: 1,
                p: 2,
                textAlign: "left",
                textTransform: "none",
                flexDirection: "column",
                alignItems: "flex-start",
                position: "relative",
                minHeight: 100,
                borderRadius: 0,
                borderBottom: isActive ? 2 : 0,
                borderBottomColor: isActive ? "primary.main" : "transparent",
                bgcolor: isActive
                  ? theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.2)
                    : theme.palette.primary.light
                  : isAccessible
                  ? "transparent"
                  : theme.palette.mode === "dark"
                  ? alpha(theme.palette.action.disabled, 0.1)
                  : theme.palette.grey[100],
                opacity: isAccessible ? 1 : 0.6,
                cursor: isAccessible ? "pointer" : "not-allowed",
                "&:hover": {
                  bgcolor: isActive
                    ? "primary.light"
                    : isAccessible
                    ? "grey.50"
                    : "grey.100",
                },
              }}
            >
              {!isAccessible && (
                <Lock
                  sx={{
                    fontSize: 16,
                    color: "grey.400",
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                />
              )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                {getStatusIcon(level.status)}
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color={isAccessible ? "text.primary" : "text.secondary"}
                >
                  {level.name}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color={isAccessible ? "text.secondary" : "text.disabled"}
                sx={{ textAlign: "left" }}
              >
                {level.description}
              </Typography>

              {level.progress > 0 && (
                <Box sx={{ width: "100%", mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={level.progress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "primary.main",
                      },
                    }}
                  />
                </Box>
              )}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
