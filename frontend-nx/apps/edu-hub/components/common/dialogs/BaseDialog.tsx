import React, { ReactNode } from 'react';
import { Dialog, DialogTitle } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { Button } from '../Button';
import { useTranslations, useLocale } from 'next-intl';

interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  children,
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  const t = useTranslations();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirmation-dialog-title" maxWidth="sm" fullWidth>
      <DialogTitle id="confirmation-dialog-title">
        <div className="flex justify-between items-center">
          <span>{t('confirmation')}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t('close')}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <div className="px-6 pb-6">
        <div className="mb-8 whitespace-pre-line">{children}</div>
        <div className="grid grid-cols-2">
          {showCancel && (
            <div>
              <Button onClick={onCancel || onClose}>{cancelText || t('cancel')}</Button>
            </div>
          )}
          <div className={`flex ${showCancel ? 'justify-end' : 'justify-start'}`}>
            <Button filled onClick={onConfirm} disabled={confirmDisabled}>
              {confirmText || t('confirm')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
