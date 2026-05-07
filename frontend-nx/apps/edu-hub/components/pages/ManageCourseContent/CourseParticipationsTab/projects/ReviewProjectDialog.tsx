import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import {
  UPDATE_PROJECT_APPROVE,
  UPDATE_PROJECT_SEND_BACK,
  UPDATE_PROJECT_REJECT,
} from '../../../../../queries/projectInstructor';
import { ProjectRow } from '../../../CourseContent/Projects/types';

interface ReviewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const ReviewProjectDialog: FC<ReviewProjectDialogProps> = ({
  open,
  onClose,
  project,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');

  const [scoreInput, setScoreInput] = useState<string>('');
  const [approveProject, approveState] = useRoleMutation(UPDATE_PROJECT_APPROVE, {
    refetchQueries,
  });
  const [sendBackProject, sendBackState] = useRoleMutation(UPDATE_PROJECT_SEND_BACK, {
    refetchQueries,
  });
  const [rejectProject, rejectState] = useRoleMutation(UPDATE_PROJECT_REJECT, {
    refetchQueries,
  });

  useEffect(() => {
    if (project) {
      setScoreInput(project.score != null ? String(project.score) : '');
    }
  }, [open, project]);

  const busy = approveState.loading || sendBackState.loading || rejectState.loading;

  const handleApprove = async () => {
    if (!project) return;
    const trimmed = scoreInput.trim();
    const score = trimmed === '' ? null : Number(trimmed);
    if (score != null && Number.isNaN(score)) {
      onError(t('projects.review_dialog.invalid_score'));
      return;
    }
    try {
      await approveProject({ variables: { itemId: project.id, score } });
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  const handleSendBack = async () => {
    if (!project) return;
    try {
      await sendBackProject({ variables: { itemId: project.id } });
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  const handleReject = async () => {
    if (!project) return;
    try {
      await rejectProject({ variables: { itemId: project.id } });
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.review_dialog.title')}
      ariaLabelledBy="review-project-dialog"
      maxWidth="md"
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={handleReject} disabled={busy}>
            {t('projects.review_dialog.reject_button')}
          </Button>
          <Button onClick={handleSendBack} disabled={busy}>
            {t('projects.review_dialog.send_back_button')}
          </Button>
          <Button filled onClick={handleApprove} disabled={busy}>
            {t('projects.review_dialog.approve_button')}
          </Button>
        </div>
      }
    >
      {project ? (
        <div className="space-y-4">
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">{t('projects.review_dialog.title_label')}: </span>
              {project.title}
            </p>
            {project.tagline ? (
              <p>
                <span className="font-medium">{t('projects.review_dialog.tagline_label')}: </span>
                {project.tagline}
              </p>
            ) : null}
            {project.description ? (
              <p className="whitespace-pre-line">{project.description}</p>
            ) : null}
          </div>
          <div className="space-y-1 text-sm">
            {project.documentationUrl ? (
              <a
                href={project.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-status-confirmed underline"
              >
                {t('projects.review_dialog.documentation_link')}
              </a>
            ) : null}
            {project.presentationUrl ? (
              <a
                href={project.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-status-confirmed underline"
              >
                {t('projects.review_dialog.presentation_link')}
              </a>
            ) : null}
            {project.externalUrl ? (
              <a
                href={project.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-status-confirmed underline"
              >
                {t('projects.review_dialog.external_link')}
              </a>
            ) : null}
          </div>
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t('projects.review_dialog.score_label')}
            </span>
            <input
              type="number"
              step="0.1"
              className="w-full border border-border-primary rounded px-3 py-2"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>
      ) : null}
    </DialogShell>
  );
};

export default ReviewProjectDialog;
