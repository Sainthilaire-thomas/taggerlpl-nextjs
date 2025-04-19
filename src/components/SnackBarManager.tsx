import React, { useState, useEffect } from "react";
import { Snackbar } from "@mui/material";

// Define interfaces for the component
interface SnackbarMessage {
  message: string;
  key: number;
  [key: string]: any; // For any additional properties
}

interface SnackbarManagerProps {
  snackPack: SnackbarMessage[];
  setSnackPack: React.Dispatch<React.SetStateAction<SnackbarMessage[]>>;
}

const SnackbarManager: React.FC<SnackbarManagerProps> = ({
  snackPack,
  setSnackPack,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [messageInfo, setMessageInfo] = useState<SnackbarMessage | undefined>(
    undefined
  );

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Afficher la prochaine notification
      setMessageInfo({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && messageInfo && open) {
      // Fermer la notification en cours avant d'en afficher une nouvelle
      setOpen(false);
    }
  }, [snackPack, messageInfo, open, setSnackPack]);

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    setMessageInfo(undefined);
  };

  return (
    <Snackbar
      key={messageInfo ? messageInfo.key : undefined}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      onExited={handleExited}
      message={messageInfo?.message}
    />
  );
};

export default SnackbarManager;
