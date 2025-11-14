// src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsTableBase.tsx
"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TablePagination,
} from "@mui/material";

export interface ResultsTableBaseProps<T> {
  /** Lignes à afficher (déjà filtrées/triées par le parent si besoin) */
  items: T[];

  /** Rendu de chaque ligne — injecté par X/Y/M1/M2/M3 */
  renderRow: (item: T, idx: number) => React.ReactNode;

  /** Slot optionnel au-dessus de la table (filtres, métriques, etc.) */
  headerSlot?: React.ReactNode;

  /** Slot optionnel sous la table (légende, actions, etc.) */
  footerSlot?: React.ReactNode;

  /** Activer la pagination interne (sinon toute la liste est rendue) */
  showPagination?: boolean;

  /** Tailles possibles de page si pagination = true */
  rowsPerPageOptions?: number[];

  /** Largeur/hauteur personnalisables via sx */
  sx?: any;
}

/**
 * Squelette commun :
 * - Encapsule Paper + Table + Pagination
 * - Ne définit PAS les colonnes métier (délégué via renderRow)
 * - Permet d'injecter des filtres/metrics via headerSlot, footerSlot
 */
export default function ResultsTableBase<T>({
  items,
  renderRow,
  headerSlot,
  footerSlot,
  showPagination = true,
  rowsPerPageOptions = [10, 25, 50],
  sx,
}: ResultsTableBaseProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const start = showPagination ? page * rowsPerPage : 0;
  const end = showPagination ? start + rowsPerPage : items.length;
  const pageItems = items.slice(start, end);

  return (
    <Paper variant="outlined" sx={{ p: 2, ...sx }}>
      {headerSlot ? <Box sx={{ mb: 2 }}>{headerSlot}</Box> : null}

      <TableContainer>
        {/* Le THEAD est géré par les adaptateurs (X/Y/M1/M2/M3) si nécessaire.
           Ici, on ne rend que le TBody via renderRow pour rester 100% générique. */}
        <Table size="small">
          <TableBody>
            {pageItems.map((item, idx) => renderRow(item, start + idx))}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}

      {footerSlot ? <Box sx={{ mt: 2 }}>{footerSlot}</Box> : null}
    </Paper>
  );
}
