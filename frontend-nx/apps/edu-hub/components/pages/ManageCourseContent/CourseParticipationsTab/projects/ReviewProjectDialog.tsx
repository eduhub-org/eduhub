import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import {
  UPDATE_PROJECT_APPROVE,
  UPDATE_PROJECT_SEND_BACK,
  UPDATE_PROJECT_REJECT,
  UPDATE_PROJECT_RATING_AND_COMMENT,
} from '../../../../../queries/projectInstructor';
import { ProjectRow } from '../../../CourseContent/Projects/types';
import { ProjectRating_enum } from '../../../../../__generated__/globalTypes';

interface ReviewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const RATING_OPTIONS: ProjectRating_enum[] = [
  ProjectRating_enum.UNRATED,
  ProjectRating_enum.PASSED,
  ProjectRating_enum.FAILED,
];

const ReviewProjectDialog: FC<ReviewProjectDialogProps> = ({
  open,
  onClose,
  project,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');

  const [rating, setRating] = useState<ProjectRating_enum>(ProjectRating_enum.UNRATED);
  const [ratingComment, setRatingComment] = useState<string>('');

  const [approveProject, approveState] = useRoleMutation(UPDATE_PROJECT_APPROVE, {
    refetchQueries,
  });
  const [sendBackProject, sendBackState] = useRoleMutation(UPDATE_PROJECT_SEND_BACK, {
    refetchQueries,
  });
  const [rejectProject, rejectState] = useRoleMutation(UPDATE_PROJECT_REJECT, {
    refetchQueries,
  });
  const [saveRating, saveRatingState] = useRoleMutation(UPDATE_PROJECT_RATING_AND_COMMENT, {
    refetchQueries,
  });

  useEffect(() => {
    if (!project) return;
    setRating(project.rating ?? ProjectRating_enum.UNRATED);
    setRatingComment(project.ratingComment?.trim() ? project.ratingComment : '');
  }, [open, project]);

  const busy =
    approveState.loading ||
    sendBackState.loading ||
    rejectState.loading ||
    saveRatingState.loading;

  const handleSaveRating = async () => {
    if (!project) return;
    const trimmed = ratingComment.trim();
    try {
      await saveRating({
        variables: {
          itemId: project.id,
          rating,
          ratingComment: trimmed === '' ? null : trimmed,
        },
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  const handleApprove = async () => {
    if (!project) return;
    try {
      await approveProject({ variables: { itemId: project.id } });
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
      title={t('projects.evaluate_dialog.title')}
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
        <div className="space-y-6">
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

          <div className="rounded-lg border border-border-primary p-4 space-y-4 bg-bg-secondary/30">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-label-primary mb-2">
                {t('projects.evaluate_dialog.rating_section_label')}
              </legend>
              <div className="flex flex-col gap-2">
                {RATING_OPTIONS.map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="project-rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      disabled={busy}
                    />
                    <span>
                      {value === ProjectRating_enum.UNRATED
                        ? t('projects.evaluate_dialog.rating_UNRATED')
                        : value === ProjectRating_enum.PASSED
                          ? t('projects.evaluate_dialog.rating_PASSED')
                          : t('projects.evaluate_dialog.rating_FAILED')}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="block text-sm font-medium mb-1">
                {t('projects.evaluate_dialog.comment_label')}
              </span>
              <textarea
                className="w-full border border-border-primary rounded px-3 py-2 text-sm min-h-[5rem]"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                disabled={busy}
                placeholder={t('projects.evaluate_dialog.comment_placeholder')}
                maxLength={4000}
              />
            </label>
            <div className="flex justify-end">
              <Button filled onClick={handleSaveRating} disabled={busy}>
                {t('projects.evaluate_dialog.save_rating_button')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DialogShell>
  );
};

export default ReviewProjectDialog;
