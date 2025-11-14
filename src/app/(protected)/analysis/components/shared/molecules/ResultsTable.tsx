// 🧬 MOLECULE - ResultsTable
// shared/molecules/ResultsTable.tsx

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import { Info as InfoIcon } from "@mui/icons-material";
import { ScoreChip } from "../atoms/ScoreChip";

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  type?: "text" | "score";
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface ResultsTableProps {
  columns: TableColumn[];
  rows: TableRow[];
  onInfoClick?: (row: TableRow) => void;
  headerColor?: "primary" | "secondary";
  scoreThresholds?: {
    excellent: number;
    good: number;
  };
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  columns,
  rows,
  onInfoClick,
  headerColor = "primary",
  scoreThresholds,
}) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: alpha(theme.palette[headerColor].main, 0.1),
            }}
          >
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align || "left"}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {column.label}
                </Typography>
              </TableCell>
            ))}
            {onInfoClick && (
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Détails
                </Typography>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.id}
              sx={{
                backgroundColor:
                  index % 2 === 1
                    ? alpha(theme.palette.grey[100], 0.5)
                    : "transparent",
                "&:hover": {
                  backgroundColor: alpha(theme.palette[headerColor].main, 0.05),
                },
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || "left"}>
                  {column.type === "score" ? (
                    <ScoreChip
                      value={row[column.key]}
                      thresholds={scoreThresholds}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {row[column.key]}
                    </Typography>
                  )}
                </TableCell>
              ))}
              {onInfoClick && (
                <TableCell align="center">
                  <IconButton
                    color={headerColor}
                    onClick={() => onInfoClick(row)}
                    sx={{
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette[headerColor].main,
                          0.1
                        ),
                      },
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResultsTable;
