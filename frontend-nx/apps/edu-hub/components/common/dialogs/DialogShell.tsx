import React, { ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { BREAKPOINTS } from '../../../config/breakpoints';

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  ariaLabelledBy?: string;
  /** Covers the whole screen on phones, e.g. for dialogs holding an editor. */
  fullScreenOnMobile?: boolean;
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
  fullScreenOnMobile = false,
}) => {
  const t = useTranslations('common');
  const isPhone = useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledBy}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreenOnMobile && isPhone}
      PaperProps={{
        sx: {
          maxHeight: fullScreenOnMobile && isPhone ? '100%' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle id={ariaLabelledBy} className="light">
        <div className="flex justify-between items-center">
          <span className="text-label-primary">{title}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-label-primary"
            aria-label={t('close')}
            type="button"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent
        className="light"
        sx={{
          overflowY: 'auto',
          flex: '1 1 auto',
          px: { xs: 2, sm: 3 },
          py: 2,
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <div className="px-4 sm:px-6 pb-4 flex-shrink-0 light">
          {actions}
        </div>
      )}
    </Dialog>
  );
};
