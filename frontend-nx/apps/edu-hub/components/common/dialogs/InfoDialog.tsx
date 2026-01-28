import { useTranslations } from 'next-intl';
import { FC, ReactNode } from 'react';

import { Button } from '../Button';
import { DialogShell } from './DialogShell';

interface InfoDialogProps {
  title: string;
  content: string | ReactNode;
  open: boolean;
  onClose: () => void;
  closeText?: string;
}

export const InfoDialog: FC<InfoDialogProps> = ({
  title,
  content,
  open,
  onClose,
  closeText,
}) => {
  const t = useTranslations('common');

  const actions = (
    <div className="flex justify-end">
      <Button filled onClick={onClose}>
        {closeText || t('close')}
      </Button>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      actions={actions}
    >
      <div className="whitespace-pre-line text-sm text-gray-700">{content}</div>
    </DialogShell>
  );
};
