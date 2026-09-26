import React from 'react';
import Snackbar from '@mui/material/Snackbar';

interface NotificationSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string; // Expected to be already translated
  duration?: number;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  open,
  onClose,
  message,
  duration = 4000,
}) => {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={open}
      autoHideDuration={duration}
      // Auto-saving fields keep the user clicking and typing; closing on every click-away made the
      // confirmation vanish before it could be read.
      onClose={(_event, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      message={message}
    />
  );
};

export default NotificationSnackbar;
