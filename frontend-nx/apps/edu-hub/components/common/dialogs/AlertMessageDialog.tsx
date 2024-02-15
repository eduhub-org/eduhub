import { Dialog, DialogTitle } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback } from 'react';
import { MdClose } from 'react-icons/md';

import { Button } from '../../common/Button';

interface AlertProps {
  alert: string;
  confirmationText?: string;
  open: boolean;
  onClose: () => void;
}

export const AlertMessageDialog: FC<AlertProps> = ({ alert, confirmationText = 'OK', open, onClose }) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{t('warning')}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleClose} />
          </div>
        </div>
      </DialogTitle>

      <div className="m-16">
        <div className="mb-8">{alert}</div>
        <div className="grid grid-cols-2">
          <div />
          <div className="flex justify-end">
            <Button filled onClick={handleClose}>
              {confirmationText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
