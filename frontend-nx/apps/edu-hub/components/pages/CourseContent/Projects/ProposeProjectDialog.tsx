import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';
import { INSERT_SELF_PROPOSED_PROJECT } from '../../../../queries/project';
import { PROJECT_TAGLINE_MAX_LENGTH } from './projectDefaults';

interface ProposeProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: number;
  userId: string;
  defaultProjectType: string | null;
  refetchQueries: string[];
}

const ProposeProjectDialog: FC<ProposeProjectDialogProps> = ({
  open,
  onClose,
  onSuccess,
  courseId,
  userId,
  defaultProjectType,
  refetchQueries,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [acceptingParticipants, setAcceptingParticipants] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [insertProject, { loading }] = useRoleMutation(INSERT_SELF_PROPOSED_PROJECT, {
    refetchQueries,
  });

  const reset = useCallback(() => {
    setTitle('');
    setTagline('');
    setDescription('');
    setAcceptingParticipants(true);
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(async () => {
    setErrorMessage('');
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage(t('projects.propose_dialog.error_title_required'));
      return;
    }
    try {
      await insertProject({
        variables: {
          title: trimmedTitle,
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          organizationId: null,
          type: defaultProjectType,
          acceptingParticipants,
          proposedByUserId: userId,
          courseId,
        },
      });
      reset();
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [
    acceptingParticipants,
    courseId,
    defaultProjectType,
    description,
    insertProject,
    onSuccess,
    reset,
    t,
    tCommon,
    tagline,
    title,
    userId,
  ]);

  return (
    <DialogShell
      open={open}
      onClose={handleClose}
      title={t('projects.propose_dialog.title')}
      ariaLabelledBy="propose-project-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={handleSubmit} disabled={loading}>
            {t('projects.propose_dialog.submit_button')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t('projects.propose_dialog.title_label')}
          </span>
          <input
            type="text"
            className="w-full border border-border-primary rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('projects.propose_dialog.title_placeholder')}
            maxLength={200}
            disabled={loading}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t('projects.propose_dialog.tagline_label')}
          </span>
          <input
            type="text"
            className="w-full border border-border-primary rounded px-3 py-2"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={t('projects.propose_dialog.tagline_placeholder')}
            maxLength={PROJECT_TAGLINE_MAX_LENGTH}
            disabled={loading}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t('projects.propose_dialog.description_label')}
          </span>
          <textarea
            className="w-full border border-border-primary rounded px-3 py-2 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('projects.propose_dialog.description_placeholder')}
            maxLength={1000}
            disabled={loading}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={acceptingParticipants}
            onChange={(e) => setAcceptingParticipants(e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm">{t('projects.propose_dialog.accepting_participants_label')}</span>
        </label>
        {errorMessage ? (
          <p className="text-sm text-status-error">{errorMessage}</p>
        ) : null}
      </div>
    </DialogShell>
  );
};

export default ProposeProjectDialog;
