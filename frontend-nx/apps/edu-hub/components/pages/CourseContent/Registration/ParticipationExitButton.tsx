import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CancelOwnEnrollment, CancelOwnEnrollmentVariables } from '../../../../queries/__generated__/CancelOwnEnrollment';
import { CANCEL_OWN_ENROLLMENT } from '../../../../queries/insertEnrollment';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { Course_Course_by_pk_Sessions } from '../../../../queries/__generated__/Course';
import { hasPaidInvoice } from '../../../../utils/invoicePaymentStatus';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';

import { PARTICIPATION_EXIT_STATUS, ParticipationExitOutcome, getParticipationExitKind } from './participationExit';

interface ParticipationExitButtonProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  courseTitle: string;
  sessions: readonly Course_Course_by_pk_Sessions[] | null;
  /**
   * Called once the mutation has come back, so the page can refetch. `changed`
   * is false when the guarded update matched no row - the enrollment moved on
   * behind this page, and the refetch is the point, not a success message.
   */
  onExit?: (outcome: ParticipationExitOutcome) => void;
}

/**
 * The way out of a course or event, for the person taking part in it.
 *
 * Sits under the enrollment status card as a quiet text action rather than a
 * second call to action: the rail's one filled button is the way *in*, and
 * leaving should be reachable without competing with it. The confirmation step
 * is what makes that safe - the same shape as declining an invitation in
 * `Onboarding.tsx`.
 *
 * Renders nothing at all when there is nothing to offer (see
 * `getParticipationExitKind`), so callers can drop it in unconditionally.
 */
export const ParticipationExitButton: FC<ParticipationExitButtonProps> = ({
  courseEnrollment,
  courseTitle,
  sessions,
  onExit,
}) => {
  const t = useTranslations('course');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const [cancelOwnEnrollment] = useRoleMutation<CancelOwnEnrollment, CancelOwnEnrollmentVariables>(
    CANCEL_OWN_ENROLLMENT
  );

  const exitKind = useMemo(
    () =>
      getParticipationExitKind({
        status: courseEnrollment.status,
        sessions,
        hasPaidInvoice: hasPaidInvoice(courseEnrollment.Invoices),
      }),
    [courseEnrollment.status, courseEnrollment.Invoices, sessions]
  );

  const handleConfirm = useCallback(async () => {
    if (!exitKind) return;
    try {
      setIsSubmitting(true);
      const result = await cancelOwnEnrollment({
        variables: {
          enrollmentId: courseEnrollment.id,
          status: PARTICIPATION_EXIT_STATUS[exitKind],
        },
      });
      setIsConfirming(false);
      // Refetching is the caller's job either way, but only a row that actually
      // changed may be reported as one: on an `affected_rows` of 0 the
      // enrollment moved on behind this page, and claiming a cancellation that
      // did not happen would be worse than saying nothing.
      onExit?.({
        kind: exitKind,
        changed: (result?.data?.update_CourseEnrollment?.affected_rows ?? 0) > 0,
      });
    } catch {
      setIsConfirming(false);
      setHasFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [cancelOwnEnrollment, courseEnrollment.id, exitKind, onExit]);

  if (!exitKind) return null;

  const isCancel = exitKind === 'CANCEL';

  return (
    <>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => setIsConfirming(true)}
        className="mt-3 w-full text-sm text-error hover:underline min-h-[44px] touch-manipulation disabled:text-label-disabled disabled:no-underline"
      >
        {isCancel
          ? t('ParticipationExitButton.cancel_participation')
          : t('ParticipationExitButton.abort_participation')}
      </button>
      <QuestionConfirmationDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirm}
        confirmDisabled={isSubmitting}
        question={
          isCancel
            ? t('ParticipationExitButton.cancel_participation_confirm', { title: courseTitle })
            : t('ParticipationExitButton.abort_participation_confirm', { title: courseTitle })
        }
      />
      <ErrorMessageDialog
        open={hasFailed}
        onClose={() => setHasFailed(false)}
        errorMessage={t('ParticipationExitButton.exit_failed')}
      />
    </>
  );
};

export default ParticipationExitButton;
