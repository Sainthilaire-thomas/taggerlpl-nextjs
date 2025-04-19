import React from "react";
import { Box, TextField } from "@mui/material";

// Define props interface
interface FilterInputProps {
  filterValue: string;
  setFilterValue: (value: string) => void;
}

const FilterInput: React.FC<FilterInputProps> = ({
  filterValue,
  setFilterValue,
}) => {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <TextField
        label="Mot-clé à rechercher"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        variant="outlined"
        size="small"
      />
    </Box>
  );
};

export default FilterInput;
