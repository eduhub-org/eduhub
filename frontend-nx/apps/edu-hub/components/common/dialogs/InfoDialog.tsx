import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { FC, ReactNode, useCallback } from 'react';
import { MdClose } from 'react-icons/md';

import { Button } from '../Button';

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
  const handleClose = useCallback(() => onClose(), [onClose]);
  const t = useTranslations('common');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        <div className="flex justify-between items-center">
          <span>{title}</span>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t('close')}
            type="button"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent
        sx={{
          overflowY: 'auto',
          flex: '1 1 auto',
          px: 3,
          py: 2,
        }}
      >
        <div className="whitespace-pre-line text-sm text-gray-700">{content}</div>
      </DialogContent>

      <div className="px-6 pb-4 flex justify-end">
        <Button filled onClick={handleClose}>
          {closeText || t('close')}
        </Button>
      </div>
    </Dialog>
  );
};
