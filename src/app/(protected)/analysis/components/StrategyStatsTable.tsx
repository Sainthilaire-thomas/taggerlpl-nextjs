// analysis/components/StrategyStatsTable.tsx
"use client";

import { FC } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { StrategyStats } from "../types";

interface StrategyStatsTableProps {
  data: StrategyStats[];
}

const StrategyStatsTable: FC<StrategyStatsTableProps> = ({ data }) => {
  const theme = useTheme(); // 🎨 Utilisation du thème

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)", // 🎨 Fond header adapté
            }}
          >
            <TableCell>
              <strong>Strategy</strong>
            </TableCell>
            <TableCell align="center" sx={{ color: theme.palette.error.main }}>
              <strong>Negative (%)</strong>
            </TableCell>
            <TableCell
              align="center"
              sx={{ color: theme.palette.warning.main }}
            >
              <strong>Neutral (%)</strong>
            </TableCell>
            <TableCell
              align="center"
              sx={{ color: theme.palette.success.main }}
            >
              <strong>Positive (%)</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Total</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Effectiveness</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.strategy}
              sx={{
                "&:hover": {
                  backgroundColor: theme.palette.action.hover, // 🎨 Hover adapté
                },
              }}
            >
              <TableCell>
                <Typography variant="body1" fontWeight="bold">
                  {row.strategy}
                </Typography>
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: theme.palette.error.main, fontSize: "1.1rem" }}
              >
                {row.negative}%
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: theme.palette.warning.main, fontSize: "1.1rem" }}
              >
                {row.neutral}%
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: theme.palette.success.main, fontSize: "1.1rem" }}
              >
                {row.positive}%
              </TableCell>
              <TableCell align="center">{row.total}</TableCell>
              <TableCell align="center">
                <Box
                  sx={{
                    color:
                      row.effectiveness > 0
                        ? theme.palette.success.main
                        : theme.palette.error.main, // 🎨 Couleurs adaptées
                    fontWeight: "bold",
                  }}
                >
                  {row.effectiveness > 0 ? "+" : ""}
                  {row.effectiveness}%
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StrategyStatsTable;
