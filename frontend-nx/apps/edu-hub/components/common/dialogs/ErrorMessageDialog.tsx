import { Dialog, DialogTitle, DialogContent, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useTranslations } from 'next-intl';
import { FC, useCallback, forwardRef, ReactElement } from 'react';
import { MdClose } from 'react-icons/md';

import { Button } from '../../common/Button';

// Transition for the dialog
const Transition = forwardRef<unknown, TransitionProps & { children: ReactElement<any, any> }>((props, ref) => (
  <Slide direction="up" ref={ref} {...props}>
    {props.children}
  </Slide>
));
Transition.displayName = 'Transition';


interface ErrorProps {
  errorMessage: string;
  open: boolean;
  onClose: () => void;
}

export const ErrorMessageDialog: FC<ErrorProps> = ({ errorMessage, open, onClose }) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const t = useTranslations('common');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
      keepMounted
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#ffffff',
          color: '#222222',
          maxHeight: '90vh',
        },
      }}
      sx={{
        zIndex: 1400, // Higher than default Dialog z-index (1300) to appear above other dialogs
      }}
    >
      <DialogTitle 
        id="error-dialog-title"
        className="light"
        sx={{
          color: '#222222',
          borderBottom: '1px solid var(--eduhub-border-primary)',
        }}
      >
        <div className="grid grid-cols-2">
          <div className="text-label-primary">{t('error')}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose 
              aria-label={t('close')} 
              onClick={handleClose}
              className="text-label-primary hover:text-label-secondary transition-colors"
            />
          </div>
        </div>
      </DialogTitle>

      <DialogContent 
        className="light"
        id="error-dialog-description"
        sx={{
          px: 4,
          py: 3,
        }}
      >
        <div className="mb-8 text-error">{errorMessage}</div>
        <div className="grid grid-cols-2">
          <div />
          <div className="flex justify-end">
            <Button filled onClick={handleClose}>
              {t('ok')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
