import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';

interface RequestProjectReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/** Confirmation before authors notify course staff that the proposed project is ready for review (PROPOSED). */
const RequestProjectReviewDialog: FC<RequestProjectReviewDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.project_review_dialog.title')}
      ariaLabelledBy="request-project-review-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={onConfirm} disabled={loading}>
            {t('projects.project_review_dialog.confirm_button')}
          </Button>
        </div>
      }
    >
      <p className="mb-2">{t('projects.project_review_dialog.body_main')}</p>
      <p className="text-sm text-label-secondary">{t('projects.project_review_dialog.body_next')}</p>
    </DialogShell>
  );
};

export default RequestProjectReviewDialog;
