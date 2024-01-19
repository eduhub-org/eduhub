import { Dialog, DialogTitle, Slide } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, forwardRef, ReactElement } from 'react';
import { MdClose } from 'react-icons/md';

import { Button } from '../../common/Button';

// Transition for the dialog
const Transition = forwardRef<unknown, TransitionProps & { children?: ReactElement<any, any> }>((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

interface ErrorProps {
  errorMessage: string;
  open: boolean;
  onClose: () => void;
}

export const ErrorMessageDialogComponent: FC<ErrorProps> = ({ errorMessage, open, onClose }) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
      keepMounted
    >
      <DialogTitle id="error-dialog-title">
        <div className="grid grid-cols-2">
          <div>{t('error')}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose aria-label={t('close')} onClick={handleClose} />
          </div>
        </div>
      </DialogTitle>

      <div className="m-16" id="error-dialog-description">
        <div className="mb-8 text-red-600">{errorMessage}</div>
        <div className="grid grid-cols-2">
          <div />
          <div className="flex justify-end">
            <Button filled onClick={handleClose}>
              {t('ok')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
