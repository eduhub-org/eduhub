import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import useTranslation from 'next-translate/useTranslation';

interface NotificationSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  duration?: number;
  translationNamespace?: string;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  open,
  onClose,
  message,
  duration = 2000,
  translationNamespace,
}) => {
  const { t } = useTranslation(translationNamespace);

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      message={t(message)}
    />
  );
};

export default NotificationSnackbar;
