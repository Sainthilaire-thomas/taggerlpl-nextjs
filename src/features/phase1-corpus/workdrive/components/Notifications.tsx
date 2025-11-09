// components/Notifications.tsx
import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface NotificationsProps {
  error: string | null;
  successMessage: string | null;
  onCloseError: () => void;
  onCloseSuccess: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({
  error,
  successMessage,
  onCloseError,
  onCloseSuccess,
}) => {
  return (
    <>
      {/* Snackbar pour les erreurs */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={onCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={onCloseError} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar pour les succès */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={onCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
