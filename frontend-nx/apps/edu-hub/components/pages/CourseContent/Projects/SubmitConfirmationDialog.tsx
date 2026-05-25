import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';

interface SubmitConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const SubmitConfirmationDialog: FC<SubmitConfirmationDialogProps> = ({
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
      title={t('projects.submit_dialog.title')}
      ariaLabelledBy="submit-project-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={onConfirm} disabled={loading}>
            {t('projects.submit_dialog.confirm_button')}
          </Button>
        </div>
      }
    >
      <p className="mb-2">{t('projects.submit_dialog.body_main')}</p>
      <p className="mb-2 text-sm text-label-secondary">
        {t('projects.submit_dialog.body_co_authors')}
      </p>
      <p className="text-sm text-label-secondary">
        {t('projects.submit_dialog.body_irreversible')}
      </p>
    </DialogShell>
  );
};

export default SubmitConfirmationDialog;
