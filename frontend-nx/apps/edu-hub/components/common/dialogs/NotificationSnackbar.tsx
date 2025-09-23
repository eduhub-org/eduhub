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
  duration = 2000,
}) => {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      message={message}
    />
  );
};

export default NotificationSnackbar;
