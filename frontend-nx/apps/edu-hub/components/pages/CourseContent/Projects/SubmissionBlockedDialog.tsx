import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdErrorOutline, MdArrowForward } from 'react-icons/md';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';
import {
  PROJECT_SUBMISSION_FIELD_ANCHOR_ID,
  ProjectSubmissionBlocker,
} from './SubmissionChecklist';

interface SubmissionBlockedDialogProps {
  open: boolean;
  onClose: () => void;
  /** Non-empty list of reasons submission is currently impossible. */
  blockers: ProjectSubmissionBlocker[];
  /**
   * Jump to the field a blocker belongs to. Only offered for blockers with a
   * field anchor (the deliverables) — the dialog closes itself first.
   */
  onGoToField: (blocker: ProjectSubmissionBlocker) => void;
  /** Formatted effective submission deadline, shown when the deadline has passed. */
  submissionDeadlineDisplay?: string | null;
}

/**
 * Explains why "Projekt einreichen" cannot go through yet. The submit button
 * stays clickable on purpose: a disabled button leaves participants guessing,
 * so the click always answers the question instead.
 */
const SubmissionBlockedDialog: FC<SubmissionBlockedDialogProps> = ({
  open,
  onClose,
  blockers,
  onGoToField,
  submissionDeadlineDisplay,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  const isDeadlinePassed = blockers.includes('deadline');

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.submission_blocked.title')}
      ariaLabelledBy="submission-blocked-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end">
          <Button filled onClick={onClose}>
            {tCommon('close')}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-label-primary">
        {isDeadlinePassed
          ? t('projects.submission_blocked.body_deadline')
          : t('projects.submission_blocked.body_main')}
      </p>

      <ul className="space-y-2">
        {blockers.map((blocker) => {
          const anchorId = PROJECT_SUBMISSION_FIELD_ANCHOR_ID[blocker];
          return (
            <li
              key={blocker}
              className="flex items-start justify-between gap-3 rounded border border-error/40 bg-error/5 p-2"
            >
              <span className="flex items-start gap-2 text-sm text-label-primary">
                <MdErrorOutline className="mt-0.5 shrink-0 text-error" aria-hidden />
                <span>
                  {blocker === 'deadline' && submissionDeadlineDisplay
                    ? t('projects.submission_blocked.reason.deadline_with_date', {
                        date: submissionDeadlineDisplay,
                      })
                    : t(`projects.submission_blocked.reason.${blocker}` as never)}
                </span>
              </span>
              {anchorId && !isDeadlinePassed ? (
                <button
                  type="button"
                  onClick={() => onGoToField(blocker)}
                  className="shrink-0 inline-flex items-center gap-1 text-sm text-brand underline underline-offset-2 hover:opacity-90"
                >
                  {t('projects.submission_blocked.go_to_field')}
                  <MdArrowForward aria-hidden />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {!isDeadlinePassed ? (
        <p className="mt-3 text-xs text-label-secondary">
          {t('projects.submission_blocked.footer_hint')}
        </p>
      ) : null}
    </DialogShell>
  );
};

export default SubmissionBlockedDialog;
