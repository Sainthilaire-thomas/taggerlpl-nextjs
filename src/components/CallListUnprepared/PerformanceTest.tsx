// =================================
// 1. COMPOSANT DE TEST ISOLÉ
// =================================

// Créez ce composant simple pour tester SI le problème vient de React ou d'ailleurs :

import React, { useState, useCallback } from "react";
import { Box, Checkbox, Typography, Paper } from "@mui/material";

const PerformanceTest: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleCheck = useCallback(
    (id: string, checked: boolean) => {
      console.time(`check-${id}`);

      setCheckedItems((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });

      // Mesurer le temps APRÈS le state update
      requestAnimationFrame(() => {
        console.timeEnd(`check-${id}`);
        console.log(
          `✅ Checkbox ${id} updated, total selected: ${checkedItems.size}`
        );
      });
    },
    [checkedItems.size]
  );

  return (
    <Paper sx={{ p: 2, m: 2, border: 2, borderColor: "primary.main" }}>
      <Typography variant="h6" color="primary">
        🧪 TEST DE PERFORMANCE ISOLÉ
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Si ces checkboxes sont lentes aussi, le problème n'est PAS dans votre
        code origine.
      </Typography>

      {Array.from({ length: 5 }, (_, i) => {
        const id = `test-${i}`;
        const isChecked = checkedItems.has(id);

        return (
          <Box
            key={id}
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
          >
            <Checkbox
              checked={isChecked}
              onChange={(e) => handleCheck(id, e.target.checked)}
            />
            <Typography>
              Test Item {i + 1} {isChecked ? "✅" : "⬜"}
            </Typography>
          </Box>
        );
      })}

      <Typography variant="body2" color="primary">
        Sélectionnés: {checkedItems.size}/5
      </Typography>
    </Paper>
  );
};

export default PerformanceTest;
