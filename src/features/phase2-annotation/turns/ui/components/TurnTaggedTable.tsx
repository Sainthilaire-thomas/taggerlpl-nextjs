"use client";

import React, { FC } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  useTheme,
} from "@mui/material";

// Types
interface TurntaggedData {
  id: string;
  call_id: string;
  start_time: number;
  end_time: number;
  verbatim?: string;
  date?: string;
  next_turn_tag?: string;
  next_turn_verbatim?: string;
  speaker?: string;
}

interface TurntaggedTableProps {
  data: TurntaggedData[];
  tag: string;
  onClose: () => void;
}

const TurntaggedTable: FC<TurntaggedTableProps> = ({ data, tag, onClose }) => {
  const theme = useTheme(); // Accès au thème global

  // Styles dynamiques basés sur le mode du thème
  const backgroundColor =
    theme.palette.mode === "dark" ? theme.palette.background.default : "white";

  const textColor = theme.palette.text.primary;

  return (
    <Box
      sx={{
        backgroundColor,
        color: textColor,
        borderRadius: 2,
        padding: 3,
        maxWidth: "90%",
        maxHeight: "80%",
        overflow: "auto",
        boxShadow: theme.shadows[5],
      }}
    >
      <Typography variant="h6" gutterBottom>
        Détails pour le tag : {tag}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[900]
                  : theme.palette.grey[300],
            }}
          >
            <TableRow>
              <TableCell sx={{ color: textColor }}>ID</TableCell>
              <TableCell sx={{ color: textColor }}>Call ID</TableCell>
              <TableCell sx={{ color: textColor }}>Heure de début</TableCell>
              <TableCell sx={{ color: textColor }}>Heure de fin</TableCell>
              <TableCell sx={{ color: textColor }}>Verbatim</TableCell>
              <TableCell sx={{ color: textColor }}>Date</TableCell>
              <TableCell sx={{ color: textColor }}>Tag suivant</TableCell>
              <TableCell sx={{ color: textColor }}>Verbatim suivant</TableCell>
              <TableCell sx={{ color: textColor }}>Speaker</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  "&:nth-of-type(odd)": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[100],
                  },
                  "&:nth-of-type(even)": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : theme.palette.grey[50],
                  },
                }}
              >
                <TableCell sx={{ color: textColor }}>{row.id}</TableCell>
                <TableCell sx={{ color: textColor }}>{row.call_id}</TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.start_time.toFixed(3)} s
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.end_time.toFixed(3)} s
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.verbatim || "N/A"}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.date ? new Date(row.date).toLocaleString() : "N/A"}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.next_turn_tag || "N/A"}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.next_turn_verbatim || "N/A"}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {row.speaker || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2} textAlign="center">
        <Button variant="contained" onClick={onClose}>
          Fermer
        </Button>
      </Box>
    </Box>
  );
};

export default TurntaggedTable;
