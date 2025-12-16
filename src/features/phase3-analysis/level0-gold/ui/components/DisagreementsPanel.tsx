// ============================================================================
// DisagreementsPanel - Affichage détaillé des désaccords
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Alert,
  useTheme
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { CharteTestResult } from "@/types/algorithm-lab/Level0Types";

interface DisagreementsPanelProps {
  result: CharteTestResult;
}

export const DisagreementsPanel: React.FC<DisagreementsPanelProps> = ({ result }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const theme = useTheme();

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  if (result.disagreements.length === 0) {
    return (
      <Alert severity="success">
        Aucun désaccord ! Accord parfait entre humain et LLM.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Désaccords détaillés - {result.charte_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {result.disagreements.length} désaccords sur {result.total_pairs} paires 
          ({((result.disagreements.length / result.total_pairs) * 100).toFixed(1)}%)
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell>Pair ID</TableCell>
              <TableCell>Tag Manuel</TableCell>
              <TableCell>Tag LLM</TableCell>
              <TableCell>Confiance LLM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.disagreements.map((disagreement, index) => {
              const isExpanded = expandedRows.has(index);
              
              return (
                <React.Fragment key={disagreement.pairId}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRow(index)}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{disagreement.pairId}</TableCell>
                    <TableCell>
                      <Chip 
                        label={disagreement.manualTag} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={disagreement.llmTag} 
                        color="error" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {(disagreement.llmConfidence * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: theme.palette.mode === "dark" 
                            ? "rgba(255, 255, 255, 0.05)" 
                            : "grey.50" 
                        }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Verbatim :
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              p: 1.5, 
                              backgroundColor: theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, 0.08)"
                                : "background.paper",
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              mb: 2 
                            }}
                          >
                            "{disagreement.verbatim}"
                          </Typography>

                          <Typography variant="subtitle2" gutterBottom>
                            Raisonnement LLM :
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              p: 1.5, 
                              backgroundColor: theme.palette.mode === "dark"
                                ? "rgba(66, 165, 245, 0.08)"
                                : "background.paper",
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            {disagreement.llmReasoning}
                          </Typography>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
