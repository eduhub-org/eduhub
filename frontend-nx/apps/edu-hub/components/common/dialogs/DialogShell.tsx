import React, { ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  ariaLabelledBy?: string;
}

export const DialogShell: React.FC<DialogShellProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  ariaLabelledBy,
}) => {
  const t = useTranslations('common');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledBy}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle id={ariaLabelledBy}>
        <div className="flex justify-between items-center">
          <span>{title}</span>
          <button
            onClick={onClose}
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
        {children}
      </DialogContent>

      {actions && (
        <div className="px-6 pb-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </Dialog>
  );
};
