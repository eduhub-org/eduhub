import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import { INSTRUCTOR_INSERT_PROJECT } from '../../../../../queries/projectInstructor';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  instructorUserId: string;
  defaultProjectType: string | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const AddProjectDialog: FC<AddProjectDialogProps> = ({
  open,
  onClose,
  courseId,
  instructorUserId,
  defaultProjectType,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');

  const [title, setTitle] = useState('');
  const [insertProject, { loading }] = useRoleMutation(INSTRUCTOR_INSERT_PROJECT, {
    refetchQueries,
  });

  const reset = useCallback(() => {
    setTitle('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      onError(t('projects.add_dialog.error_title_required'));
      return;
    }
    try {
      await insertProject({
        variables: {
          title: trimmed,
          type: defaultProjectType,
          proposedByUserId: instructorUserId,
          courseId,
        },
      });
      reset();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [
    courseId,
    defaultProjectType,
    insertProject,
    instructorUserId,
    onClose,
    onError,
    reset,
    t,
    tCommon,
    title,
  ]);

  return (
    <DialogShell
      open={open}
      onClose={handleClose}
      title={t('projects.add_dialog.title')}
      ariaLabelledBy="add-project-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={handleSubmit} disabled={loading}>
            {t('projects.add_dialog.submit_button')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-label-secondary">{t('projects.add_dialog.helper')}</p>
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t('projects.add_dialog.title_label')}
          </span>
          <input
            type="text"
            className="w-full border border-border-primary rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('projects.add_dialog.title_placeholder')}
            maxLength={200}
            disabled={loading}
          />
        </label>
      </div>
    </DialogShell>
  );
};

export default AddProjectDialog;
