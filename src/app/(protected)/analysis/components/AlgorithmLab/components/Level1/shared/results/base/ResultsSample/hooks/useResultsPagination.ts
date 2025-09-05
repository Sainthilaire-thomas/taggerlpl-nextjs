import { useState, useMemo, useEffect } from "react";
import { TVValidationResult } from "../types";

export const useResultsPagination = (
  filteredResults: TVValidationResult[],
  initialPageSize: number = 10
) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filteredResults.length]);

  const pageItems = useMemo(() => {
    if (!filteredResults.length) return [];
    return filteredResults.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredResults, page, rowsPerPage]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  return {
    page,
    rowsPerPage,
    pageItems,
    handlePageChange,
    handleRowsPerPageChange,
    totalPages: Math.ceil(filteredResults.length / rowsPerPage),
  };
};
