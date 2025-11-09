import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Typography,
  Box,
  LinearProgress,
  Tooltip,
  IconButton,
  Chip,
} from "@mui/material";
import { Visibility, Edit } from "@mui/icons-material";
import { CallExtended } from "../../domain";
import { CallLifecycleColumn } from "./CallLifecycleColumn";
type LifecycleAction = "prepare" | "select" | "unselect" | "tag";
export interface VirtualizedCallTableProps {
  calls: CallExtended[];
  selectedCalls: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onLifecycleAction: (
    action: LifecycleAction,
    call: CallExtended
  ) => void | Promise<void>;
  renderRelationStatus: (callId: string) => React.ReactNode;
}

export const VirtualizedCallTable: React.FC<VirtualizedCallTableProps> = ({
  calls,
  selectedCalls,
  onToggleSelection,
  onSelectAll,
  onLifecycleAction,
  renderRelationStatus,
}) => {
  const [displayedCalls, setDisplayedCalls] = useState(calls.slice(0, 20));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const loadMoreCalls = useCallback(() => {
    if (isLoadingMore || displayedCalls.length >= calls.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCalls((prev) => [
        ...prev,
        ...calls.slice(prev.length, prev.length + 20),
      ]);
      setIsLoadingMore(false);
    }, 100);
  }, [calls, displayedCalls.length, isLoadingMore]);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) loadMoreCalls();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadMoreCalls]);

  useEffect(() => {
    setDisplayedCalls(calls.slice(0, 20));
  }, [calls]);

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      ref={tableContainerRef}
      sx={{ maxHeight: 400, overflow: "auto" }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  calls.some((c) => selectedCalls.has(c.id)) &&
                  !calls.every((c) => selectedCalls.has(c.id))
                }
                checked={
                  calls.length > 0 &&
                  calls.every((c) => selectedCalls.has(c.id))
                }
                onChange={onSelectAll}
              />
            </TableCell>
            <TableCell>Fichier</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Cycle de vie</TableCell>
            <TableCell>Relations</TableCell>
            <TableCell>Créé le</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedCalls.map((call) => (
            <TableRow key={call.id} selected={selectedCalls.has(call.id)} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCalls.has(call.id)}
                  onChange={() => onToggleSelection(call.id)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {call.filename || call.id}
                </Typography>
                {call.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {call.description.length > 50
                      ? `${call.description.substring(0, 50)}...`
                      : call.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={call.status || "draft"}
                  size="small"
                  color={
                    (call.status as string) === "conflictuel"
                      ? "error"
                      : (call.status as string) === "non_conflictuel"
                      ? "success"
                      : "default"
                  }
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <CallLifecycleColumn call={call} onAction={onLifecycleAction} />
              </TableCell>
              <TableCell>{renderRelationStatus(call.id)}</TableCell>
              <TableCell>
                <Typography variant="caption">
                  {call.createdAt instanceof Date
                    ? call.createdAt.toLocaleDateString()
                    : new Date(call.createdAt as any).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Voir détails">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Éditer">
                    <IconButton size="small" color="default">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {isLoadingMore && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box py={2}>
                  <LinearProgress />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Chargement de plus d'appels...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
          {displayedCalls.length >= calls.length && calls.length > 20 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ py: 1 }}
                >
                  Tous les appels sont affichés ({calls.length} total)
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
