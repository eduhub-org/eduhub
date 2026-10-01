import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  RequestEnrollmentCancellation,
  RequestEnrollmentCancellationVariables,
} from '../../../../queries/__generated__/RequestEnrollmentCancellation';
import { REQUEST_ENROLLMENT_CANCELLATION } from '../../../../queries/insertEnrollment';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { Course_Course_by_pk_Sessions } from '../../../../queries/__generated__/Course';
import { hasPaidInvoice } from '../../../../utils/invoicePaymentStatus';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { Button } from '../../../common/Button';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import InputField from '../../../inputs/InputField';

import { participationExitButtonClassName } from './ParticipationExitButton';
import { PARTICIPATION_EXIT_ELIGIBLE_STATUSES, canRequestCancellation } from './participationExit';

const REASON_MAX_LENGTH = 2000;

interface CancellationRequestButtonProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  sessions: readonly Course_Course_by_pk_Sessions[] | null;
  /**
   * Called once the mutation has come back, so the page can refetch. `changed`
   * is false when a request was already on record behind this page.
   */
  onRequested?: (changed: boolean) => void;
}

/**
 * The way out of a *paid* course or event: the participant cannot cancel it
 * themselves, because whether and how much is refunded is the organizer's
 * decision - so they ask. Sending the request mails the organizers and a
 * confirmation to the participant (sendCancellationRequestEmail); the
 * enrollment stays as it is until an organizer cancels it.
 *
 * Takes the place of `ParticipationExitButton`, which renders nothing for a
 * paid enrollment, and renders nothing itself when there is nothing to offer.
 */
export const CancellationRequestButton: FC<CancellationRequestButtonProps> = ({
  courseEnrollment,
  sessions,
  onRequested,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');
  const displayDate = useDisplayDate();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const [requestCancellation] = useRoleMutation<RequestEnrollmentCancellation, RequestEnrollmentCancellationVariables>(
    REQUEST_ENROLLMENT_CANCELLATION
  );

  const { cancellationRequestedAt, status } = courseEnrollment;
  const canRequest = useMemo(
    () =>
      canRequestCancellation({
        status,
        sessions,
        hasPaidInvoice: hasPaidInvoice(courseEnrollment.Invoices),
        cancellationRequestedAt,
      }),
    [status, sessions, courseEnrollment.Invoices, cancellationRequestedAt]
  );

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const result = await requestCancellation({
        variables: {
          enrollmentId: courseEnrollment.id,
          // Only a signal: the guard trigger stamps the server time.
          requestedAt: new Date().toISOString(),
          reason: reason.trim() || null,
        },
      });
      setIsOpen(false);
      onRequested?.((result?.data?.update_CourseEnrollment?.affected_rows ?? 0) > 0);
    } catch {
      setIsOpen(false);
      setHasFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [requestCancellation, courseEnrollment.id, reason, onRequested]);

  // An open request on an enrollment still held: say so instead of offering it
  // again. Once an organizer has cancelled, the status card says the rest.
  if (cancellationRequestedAt && status && PARTICIPATION_EXIT_ELIGIBLE_STATUSES.includes(status)) {
    return (
      <p className="mt-3 text-sm text-center text-label-secondary">
        {t('CancellationRequest.requested_notice', { date: displayDate(cancellationRequestedAt) })}
      </p>
    );
  }

  if (!canRequest) return null;

  return (
    <>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => setIsOpen(true)}
        className={participationExitButtonClassName}
      >
        {t('CancellationRequest.request_cancellation')}
      </button>
      <DialogShell
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('CancellationRequest.dialog_title')}
        ariaLabelledBy="cancellation-request-dialog"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={isSubmitting}>
              {t('CancellationRequest.send_request')}
            </Button>
          </div>
        }
      >
        <p className="mb-4">{t('CancellationRequest.dialog_body')}</p>
        <InputField
          variant="material"
          type="textarea"
          label={t('CancellationRequest.reason_label')}
          placeholder={t('CancellationRequest.reason_placeholder')}
          itemId={courseEnrollment.id}
          value={reason}
          onValueUpdated={(data) => setReason(data.text || '')}
          debounceTimeout={200}
          maxLength={REASON_MAX_LENGTH}
          className="w-full"
          multiline
          minRows={3}
        />
      </DialogShell>
      <ErrorMessageDialog
        open={hasFailed}
        onClose={() => setHasFailed(false)}
        errorMessage={t('CancellationRequest.request_failed')}
      />
    </>
  );
};

export default CancellationRequestButton;
