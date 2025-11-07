import React from 'react';
import { QuestionConfirmationDialog } from './QuestionConfirmationDialog';
import useTranslation from 'next-translate/useTranslation';

interface LinkedInSharingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const LinkedInSharingDialog: React.FC<LinkedInSharingDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const { t: tCertificates } = useTranslation('certificates');
  const { t: tCommon } = useTranslation('common');

  return (
    <QuestionConfirmationDialog
      open={open}
      question={tCertificates('linkedin_sharing_warning')}
      confirmationText={tCertificates('make_public_confirm')}
      cancelText={tCommon('cancel')}
      onClose={onClose}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

