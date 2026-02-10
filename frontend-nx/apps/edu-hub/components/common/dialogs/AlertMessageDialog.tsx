import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { Button } from '../../common/Button';
import { DialogShell } from './DialogShell';

interface AlertProps {
  alert: string;
  confirmationText?: string;
  open: boolean;
  onClose: () => void;
}

export const AlertMessageDialog: FC<AlertProps> = ({ alert, confirmationText = 'OK', open, onClose }) => {
  const t = useTranslations('common');

  const actions = (
    <div className="flex justify-end">
      <Button filled onClick={onClose}>
        {confirmationText}
      </Button>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('warning')}
      actions={actions}
    >
      <div className="whitespace-pre-line">{alert}</div>
    </DialogShell>
  );
};
