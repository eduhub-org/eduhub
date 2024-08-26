import { Dialog, DialogTitle } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useRef, useEffect } from 'react';
import { MdClose } from 'react-icons/md';

import { Button } from '../../common/Button';

interface QuestionProps {
  question: string;
  confirmationText: string;
  onClose: (confirmed: boolean) => void;
  open: boolean;
}

export const QuestionConfirmationDialog: FC<QuestionProps> = ({
  question,
  confirmationText,
  onClose,
  open,
}) => {
  const { t } = useTranslation();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleCancel = useCallback(() => onClose(false), [onClose]);
  const handleConfirm = useCallback(() => onClose(true), [onClose]);

  useEffect(() => {
    if (open) {
      confirmButtonRef.current?.focus();
    }
  }, [open]);

  const formattedQuestion = question.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      aria-labelledby="confirmation-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title">
        <div className="flex justify-between items-center">
          <span>{t('confirmation')}</span>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t('close')}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <div className="px-6 pb-6">
        <div className="mb-8 whitespace-pre-line">{formattedQuestion}</div>
        <div className="grid grid-cols-2">
          <div>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </div>
          <div className="flex justify-end">
            <Button filled onClick={handleConfirm}>
              {confirmationText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};