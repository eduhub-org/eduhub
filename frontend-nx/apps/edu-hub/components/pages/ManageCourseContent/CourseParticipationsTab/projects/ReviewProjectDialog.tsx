import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MdCheck,
  MdCheckCircle,
  MdClose,
  MdRadioButtonUnchecked,
  MdReplay,
} from 'react-icons/md';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import { UPDATE_PROJECT_REVIEW_VERDICT } from '../../../../../queries/projectInstructor';
import { ProjectRow } from '../../../CourseContent/Projects/types';
import { ProjectRating_enum, ProjectStatus_enum } from '../../../../../__generated__/globalTypes';
import {
  getEffectiveProjectSubmissionDeadlineIso,
  isProjectSubmissionDeadlinePassed,
} from '../../../CourseContent/Projects/projectEffectiveSubmissionDeadline';
import ReviewDeadlineExtensionField from './ReviewDeadlineExtensionField';
import {
  DeadlineExtensionChoice,
  isDeadlineSelectionConfirmable,
  resolveExtendedDeadline,
} from './reviewDeadlineExtension';

interface ReviewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  /** Course / program fallback when `Project.submissionDeadline` is null. */
  courseDefaultSubmissionDeadline: string | Date | null | undefined;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

type Verdict = 'approve' | 'revise' | 'reject';

// Each verdict bundles the rating that is persisted alongside the status change,
// removing the redundancy between the former rating radios and action buttons.
const VERDICT_RATING: Record<Verdict, ProjectRating_enum> = {
  approve: ProjectRating_enum.PASSED,
  revise: ProjectRating_enum.UNRATED,
  reject: ProjectRating_enum.FAILED,
};

const VERDICT_STATUS: Record<Verdict, ProjectStatus_enum> = {
  approve: ProjectStatus_enum.COMPLETED,
  revise: ProjectStatus_enum.ONGOING,
  reject: ProjectStatus_enum.INCOMPLETE,
};

interface DecisionAccent {
  chip: string;
  ring: string;
  tint: string;
  indicator: string;
}

const DECISIONS: { key: Verdict; icon: ReactNode; accent: DecisionAccent }[] = [
  {
    key: 'approve',
    icon: <MdCheck />,
    accent: {
      chip: 'bg-green-600',
      ring: 'border-green-600',
      tint: 'bg-green-50',
      indicator: 'text-green-600',
    },
  },
  {
    key: 'revise',
    icon: <MdReplay />,
    accent: {
      chip: 'bg-amber-500',
      ring: 'border-amber-500',
      tint: 'bg-amber-50',
      indicator: 'text-amber-500',
    },
  },
  {
    key: 'reject',
    icon: <MdClose />,
    accent: {
      chip: 'bg-red-600',
      ring: 'border-red-600',
      tint: 'bg-red-50',
      indicator: 'text-red-600',
    },
  },
];

interface DecisionCardProps {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  accent: DecisionAccent;
}

const DecisionCard: FC<DecisionCardProps> = ({
  selected,
  disabled,
  onSelect,
  icon,
  title,
  description,
  accent,
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    aria-pressed={selected}
    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors disabled:opacity-60 ${
      selected
        ? `${accent.ring} ${accent.tint}`
        : 'border-border-primary bg-fill-primary hover:border-border-secondary'
    }`}
  >
    <span
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg text-white ${accent.chip}`}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-label-primary">
        {title}
      </span>
      <span className="block text-xs text-label-secondary">{description}</span>
    </span>
    {selected ? (
      <MdCheckCircle className={`flex-shrink-0 text-xl ${accent.indicator}`} />
    ) : (
      <MdRadioButtonUnchecked className="flex-shrink-0 text-xl text-border-secondary" />
    )}
  </button>
);

const ReviewProjectDialog: FC<ReviewProjectDialogProps> = ({
  open,
  onClose,
  project,
  courseDefaultSubmissionDeadline,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [deadlineChoice, setDeadlineChoice] = useState<DeadlineExtensionChoice>('');
  const [customDeadline, setCustomDeadline] = useState<string>('');

  const [submitVerdict, verdictState] = useRoleMutation(UPDATE_PROJECT_REVIEW_VERDICT, {
    refetchQueries,
  });

  const effectiveDeadlineIso = project
    ? getEffectiveProjectSubmissionDeadlineIso(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      )
    : null;
  const isDeadlinePassed = project
    ? isProjectSubmissionDeadlinePassed(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      )
    : false;

  useEffect(() => {
    if (!project) return;
    const rating = project.rating ?? ProjectRating_enum.UNRATED;
    setVerdict(
      rating === ProjectRating_enum.PASSED
        ? 'approve'
        : rating === ProjectRating_enum.FAILED
          ? 'reject'
          : null
    );
    setRatingComment(project.ratingComment?.trim() ? project.ratingComment : '');
    // A deadline still running may simply stay as it is; one that has passed
    // needs a deliberate decision, so it starts out unselected.
    setDeadlineChoice(
      isProjectSubmissionDeadlinePassed(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      )
        ? ''
        : 'keep'
    );
    setCustomDeadline('');
  }, [open, project, courseDefaultSubmissionDeadline]);

  const busy = verdictState.loading;

  const deadlineConfirmable =
    verdict !== 'revise' ||
    isDeadlineSelectionConfirmable({
      choice: deadlineChoice,
      customDate: customDeadline,
      isDeadlinePassed,
    });

  const handleSave = async () => {
    if (!project || !verdict) return;
    const trimmed = ratingComment.trim();
    // Only a send-back offers a deadline choice. Every other verdict — and
    // "keep the deadline" — writes the project's own current value straight
    // back, so the single statement below never changes a deadline by accident.
    const extendedDeadline =
      verdict === 'revise'
        ? resolveExtendedDeadline({
            choice: deadlineChoice,
            customDate: customDeadline,
            effectiveDeadlineIso,
          })
        : null;
    try {
      // One statement for status, rating, comment and deadline: a partial
      // failure here used to be able to leave the project sent back with a
      // deadline it could no longer be resubmitted against.
      await submitVerdict({
        variables: {
          itemId: project.id,
          status: VERDICT_STATUS[verdict],
          rating: VERDICT_RATING[verdict],
          ratingComment: trimmed === '' ? null : trimmed,
          submissionDeadline: extendedDeadline ?? project.submissionDeadline ?? null,
        },
      });
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
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={busy}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={handleSave} disabled={busy || !verdict || !deadlineConfirmable}>
            {t('projects.evaluate_dialog.confirm_button')}
          </Button>
        </div>
      }
    >
      {project ? (
        <div className="space-y-6">
          <p className="text-sm">
            <span className="font-medium">{t('projects.review_dialog.title_label')}: </span>
            {project.title}
          </p>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-label-primary">
              {t('projects.evaluate_dialog.decision_label')}
            </span>
            <div className="space-y-2">
              {DECISIONS.map(({ key, icon, accent }) => (
                <DecisionCard
                  key={key}
                  selected={verdict === key}
                  disabled={busy}
                  onSelect={() => setVerdict(key)}
                  icon={icon}
                  title={t(`projects.evaluate_dialog.${key}_title`)}
                  description={t(`projects.evaluate_dialog.${key}_description`)}
                  accent={accent}
                />
              ))}
            </div>
          </div>

          {verdict === 'revise' ? (
            <ReviewDeadlineExtensionField
              choice={deadlineChoice}
              onChoiceChange={setDeadlineChoice}
              customDate={customDeadline}
              onCustomDateChange={setCustomDeadline}
              effectiveDeadlineIso={effectiveDeadlineIso}
              isDeadlinePassed={isDeadlinePassed}
              disabled={busy}
            />
          ) : null}

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
        </div>
      ) : null}
    </DialogShell>
  );
};

export default ReviewProjectDialog;
