import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  TablePagination,
  Autocomplete,
  TextField,
  Divider,
  Tooltip,
} from "@mui/material";

export interface TVValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

interface ResultsSampleProps {
  results: TVValidationResult[];
  /** compat rétro — sera utilisé comme taille de page initiale */
  limit?: number;
  /** nouvelle API (prioritaire si fournie) */
  initialPageSize?: number;
}

export const ResultsSample: React.FC<ResultsSampleProps> = ({
  results,
  limit,
  initialPageSize,
}) => {
  if (!results.length) return null;

  // --- options de filtres ---
  const allPredTags = React.useMemo(
    () => Array.from(new Set(results.map((r) => r.predicted))).sort(),
    [results]
  );
  const allRealTags = React.useMemo(
    () => Array.from(new Set(results.map((r) => r.goldStandard))).sort(),
    [results]
  );

  // --- états filtres & pagination ---
  const [predFilter, setPredFilter] = React.useState<string[]>([]);
  const [realFilter, setRealFilter] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(
    initialPageSize ?? limit ?? 10
  );

  // --- filtrage ---
  const filtered = React.useMemo(() => {
    return results.filter(
      (r) =>
        (predFilter.length === 0 || predFilter.includes(r.predicted)) &&
        (realFilter.length === 0 || realFilter.includes(r.goldStandard))
    );
  }, [results, predFilter, realFilter]);

  // reset page lorsqu’on change les filtres ou la taille de page
  React.useEffect(() => setPage(0), [predFilter, realFilter, rowsPerPage]);

  // --- pagination ---
  const pageItems = React.useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  const totalErrors = filtered.filter((r) => !r.correct).length;

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2, flexWrap: "wrap", rowGap: 2 }}
        >
          <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
            Échantillon de Résultats
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip label={`Total: ${filtered.length}`} size="small" />
            <Chip
              label={`Erreurs: ${totalErrors}`}
              size="small"
              color={totalErrors > 0 ? "warning" : "success"}
            />
          </Stack>
        </Stack>

        {/* Filtres */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Autocomplete
            multiple
            options={allPredTags}
            value={predFilter}
            onChange={(_, val) => setPredFilter(val)}
            renderInput={(params) => (
              <TextField {...params} label="Filtre Tag PRÉDIT" size="small" />
            )}
            sx={{ minWidth: 280, flex: 1 }}
          />

          <Autocomplete
            multiple
            options={allRealTags}
            value={realFilter}
            onChange={(_, val) => setRealFilter(val)}
            renderInput={(params) => (
              <TextField {...params} label="Filtre Tag RÉEL" size="small" />
            )}
            sx={{ minWidth: 280, flex: 1 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 320 }}>
                  Verbatim (tour courant)
                </TableCell>
                <TableCell sx={{ minWidth: 280 }}>
                  Tour suivant (next_turn_verbatim)
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>
                  Prédit
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>
                  Réel
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>
                  Confiance
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 90 }}>
                  Temps
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageItems.map((result, idx) => {
                const nextVerbatim =
                  result.metadata?.next_turn_verbatim ?? null;

                return (
                  <TableRow key={idx} hover>
                    {/* Verbatim courant */}
                    <TableCell sx={{ maxWidth: 520 }}>
                      <Tooltip title={result.verbatim} arrow placement="top">
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {result.verbatim}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Verbatim du tour suivant */}
                    <TableCell sx={{ maxWidth: 520 }}>
                      {nextVerbatim ? (
                        <Tooltip title={nextVerbatim} arrow placement="top">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontStyle: "italic",
                            }}
                          >
                            {nextVerbatim}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Prédit */}
                    <TableCell align="center">
                      <Chip
                        label={result.predicted}
                        size="small"
                        color="error"
                      />
                    </TableCell>

                    {/* Réel */}
                    <TableCell align="center">
                      <Chip
                        label={result.goldStandard}
                        size="small"
                        color="success"
                      />
                    </TableCell>

                    {/* Confiance */}
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: result.correct
                            ? "success.main"
                            : result.confidence > 0.7
                            ? "error.main"
                            : "warning.main",
                        }}
                      >
                        {(result.confidence * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>

                    {/* Temps */}
                    <TableCell align="center">
                      <Typography variant="caption">
                        {result.processingTime ?? 0} ms
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}

              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun résultat ne correspond aux filtres.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) =>
            setRowsPerPage(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Taille de page"
        />
      </CardContent>
    </Card>
  );
};
