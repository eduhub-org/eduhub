import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CancelOwnEnrollment, CancelOwnEnrollmentVariables } from '../../../../queries/__generated__/CancelOwnEnrollment';
import { CANCEL_OWN_ENROLLMENT } from '../../../../queries/insertEnrollment';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { Course_Course_by_pk_Sessions } from '../../../../queries/__generated__/Course';
import { getPaymentStatusFromInvoices } from '../../../../utils/invoicePaymentStatus';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';

import { PARTICIPATION_EXIT_STATUS, ParticipationExitKind, getParticipationExitKind } from './participationExit';

interface ParticipationExitButtonProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  courseTitle: string;
  sessions: readonly Course_Course_by_pk_Sessions[] | null;
  /** Called once the status change has gone through, so the page can refetch. */
  onExit?: (kind: ParticipationExitKind) => void;
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
        hasPaidInvoice: getPaymentStatusFromInvoices(courseEnrollment.Invoices) === 'COMPLETED',
      }),
    [courseEnrollment.status, courseEnrollment.Invoices, sessions]
  );

  const handleConfirm = useCallback(async () => {
    if (!exitKind) return;
    try {
      setIsSubmitting(true);
      await cancelOwnEnrollment({
        variables: {
          enrollmentId: courseEnrollment.id,
          status: PARTICIPATION_EXIT_STATUS[exitKind],
        },
      });
      setIsConfirming(false);
      // Refetching is the caller's job either way: on an `affected_rows` of 0
      // the enrollment moved on behind this page, and the refetch is what shows
      // the participant where it actually stands.
      onExit?.(exitKind);
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
        className="mt-3 w-full text-sm text-error hover:underline min-h-[44px] disabled:text-label-disabled disabled:no-underline"
      >
        {isCancel ? t('registration.cancel_participation') : t('registration.abort_participation')}
      </button>
      <QuestionConfirmationDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirm}
        confirmDisabled={isSubmitting}
        question={
          isCancel
            ? t('registration.cancel_participation_confirm', { title: courseTitle })
            : t('registration.abort_participation_confirm', { title: courseTitle })
        }
      />
      <ErrorMessageDialog
        open={hasFailed}
        onClose={() => setHasFailed(false)}
        errorMessage={t('errors.participation_exit_failed')}
      />
    </>
  );
};

export default ParticipationExitButton;
