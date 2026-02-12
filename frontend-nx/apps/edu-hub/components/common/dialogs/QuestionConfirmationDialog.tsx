import React from 'react';
import { DialogShell } from './DialogShell';
import { Button } from '../Button';
import { useTranslations } from 'next-intl';

interface QuestionConfirmationDialogProps {
  open: boolean;
  question: string;
  confirmationText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const QuestionConfirmationDialog: React.FC<QuestionConfirmationDialogProps> = ({
  open,
  question,
  confirmationText,
  cancelText,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const t = useTranslations('common');

  const actions = (
    <div className="grid grid-cols-2 w-full gap-2">
      <div>
        <Button onClick={onCancel || onClose}>{cancelText || t('cancel')}</Button>
      </div>
      <div className="flex justify-end">
        <Button filled onClick={onConfirm}>
          {confirmationText || t('confirm')}
        </Button>
      </div>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('confirmation')}
      ariaLabelledBy="confirmation-dialog-title"
      actions={actions}
    >
      <div className="whitespace-pre-line">{question}</div>
    </DialogShell>
  );
};
