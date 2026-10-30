import { FC, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SiElement } from 'react-icons/si';
import { MdLock } from 'react-icons/md';

import UserCard from '../../../common/UserCard';
import { Button } from '../../../common/Button';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import InputField from '../../../inputs/InputField';
import { elementDirectMessageUrl } from '../../../../helpers/matrix';
import { getCertificateDownloadUrl } from '../../../../helpers/certificateDownload';
import { centsToEuroInput, formatEuro, summarizeSplit } from '../../../../helpers/instructorPayment';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { useCurrentRole } from '../../../../hooks/authentication';
import { useManagementRoleContext } from '../../../../hooks/managementRole';
import { useUserId } from '../../../../hooks/user';
import useErrorHandler from '../../../../hooks/useErrorHandler';
import { AuthRoles } from '../../../../types/enums';
import {
  COURSE_TEAM,
  COURSE_TEAM_WITHOUT_MATRIX,
  GENERATE_INSTRUCTOR_INVOICE,
  UPSERT_COURSE_INSTRUCTOR_PAYMENT_SHARE,
} from '../../../../queries/instructorPayment';
import {
  CourseTeam,
  CourseTeamVariables,
  CourseTeam_Course_by_pk_CourseInstructors,
} from '../../../../queries/__generated__/CourseTeam';
import {
  GenerateInstructorInvoice,
  GenerateInstructorInvoiceVariables,
} from '../../../../queries/__generated__/GenerateInstructorInvoice';

type TeamMember = CourseTeam_Course_by_pk_CourseInstructors;

const INVOICE_ERROR_KEYS = [
  'NOT_COURSE_INSTRUCTOR',
  'NO_INVOICE_TEMPLATE',
  'NO_PAYMENT_TOTAL',
  'PAYMENT_SPLIT_INCOMPLETE',
  'PDF_CREATION_FAILED',
];

interface ShareInputProps {
  member: TeamMember;
  total: number;
  otherSharesSum: number;
  disabled: boolean;
  onSaved: () => void;
}

const ShareInput: FC<ShareInputProps> = ({ member, total, otherSharesSum, disabled, onSaved }) => {
  const t = useTranslations('manageCourse.course_team');
  const locale = useLocale();

  return (
    <div className="w-48">
      {/* An empty field stays "not entered yet"; there is no default amount. */}
      <InputField
        variant="material"
        type="currency"
        label={t('share_label', { name: `${member.User.firstName} ${member.User.lastName}` })}
        itemId={member.id}
        value={centsToEuroInput(member.PaymentShare?.amount ?? null, locale)}
        updateValueMutation={UPSERT_COURSE_INSTRUCTOR_PAYMENT_SHARE}
        onValueUpdated={onSaved}
        min={0}
        max={Math.max(total - otherSharesSum, 0) / 100}
        disabled={disabled}
      />
    </div>
  );
};

interface IProps {
  courseId: number;
  isEventCourse: boolean;
}

/**
 * Who teaches the course with me, how to reach them, and how we split the course fee.
 * Payment data is only returned by Hasura to instructors of this course and (org) admins.
 */
export const CourseTeamCard: FC<IProps> = ({ courseId, isEventCourse }) => {
  const t = useTranslations('manageCourse.course_team');
  const locale = useLocale();
  const userId = useUserId();
  const contextRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const role = contextRole ?? currentRole;
  const { error, handleError, resetError } = useErrorHandler();
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data, refetch } = useRoleQuery<CourseTeam, CourseTeamVariables>(
    role === AuthRoles.org_admin ? COURSE_TEAM_WITHOUT_MATRIX : COURSE_TEAM,
    { variables: { courseId }, fetchPolicy: 'cache-and-network' }
  );

  const [generateInvoice] = useRoleMutation<GenerateInstructorInvoice, GenerateInstructorInvoiceVariables>(
    GENERATE_INSTRUCTOR_INVOICE
  );

  const course = data?.Course_by_pk;
  const members = useMemo(() => course?.CourseInstructors ?? [], [course]);
  const me = members.find((member) => member.User.id === userId);
  const payment = course?.InstructorPayment ?? null;
  const total = payment?.totalAmount ?? 0;
  const locked = Boolean(payment?.lockedAt);
  const isSoleInstructor = members.length === 1;
  const hasTemplate = Boolean(course?.Program?.InstructorInvoiceTemplate);

  const split = useMemo(
    () =>
      summarizeSplit(
        total,
        // A sole instructor gets the whole fee without entering anything.
        isSoleInstructor ? [total] : members.map((member) => member.PaymentShare?.amount ?? null)
      ),
    [members, total, isSoleInstructor]
  );

  if (!course || members.length === 0) return null;

  const otherSharesSum = (member: TeamMember) =>
    members
      .filter((other) => other.id !== member.id)
      .reduce((sum, other) => sum + (other.PaymentShare?.amount ?? 0), 0);

  const downloadHint = !hasTemplate
    ? t('hint_no_template')
    : !split.complete
    ? members.some((member) => !member.PaymentShare)
      ? t(isEventCourse ? 'hint_missing_amounts_event' : 'hint_missing_amounts')
      : t('hint_sum_mismatch', { remaining: formatEuro(split.remaining, locale) })
    : null;

  const runGenerateInvoice = async () => {
    setConfirmLockOpen(false);
    setGenerating(true);
    // Open the tab while still inside the click handler; popups opened after an await get blocked.
    const invoiceWindow = window.open('', '_blank');
    try {
      const result = await generateInvoice({ variables: { courseId } });
      const response = result.data?.generateInstructorInvoice;
      if (!response?.success || !response.path) {
        invoiceWindow?.close();
        const key = response?.messageKey;
        handleError(key && INVOICE_ERROR_KEYS.includes(key) ? t(`errors.${key}`) : t('errors.UNEXPECTED_ERROR'));
        return;
      }
      const url = getCertificateDownloadUrl(response.path);
      if (invoiceWindow) invoiceWindow.location.href = url;
      else window.location.assign(url);
    } catch {
      invoiceWindow?.close();
      handleError(t('errors.UNEXPECTED_ERROR'));
    } finally {
      setGenerating(false);
      refetch();
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-border-primary bg-bg-secondary p-4 text-label-primary">
      <h3 className="mb-3 text-lg font-semibold">{t('title')}</h3>

      {payment && !isSoleInstructor ? (
        <p className="mb-4 text-sm text-label-secondary">{t(isEventCourse ? 'split_explanation_event' : 'split_explanation', { total: formatEuro(total, locale) })}</p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const isMe = member.User.id === userId;
          // Undefined for org admins, whose query leaves the handle out.
          const elementUrl = isMe ? null : elementDirectMessageUrl(member.User.matrixUserHandle);
          return (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserCard user={member.User} size="compact" />
                {elementUrl ? (
                  <a
                    href={elementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-label-secondary transition-colors hover:text-brand min-h-[24px]"
                  >
                    <SiElement aria-hidden="true" />
                    {t('message_on_element')}
                  </a>
                ) : null}
              </div>
              {payment && !isSoleInstructor ? (
                <ShareInput
                  member={member}
                  total={total}
                  otherSharesSum={otherSharesSum(member)}
                  disabled={locked || !me}
                  onSaved={() => refetch()}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {payment ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-border-primary pt-4 text-sm">
          {isSoleInstructor ? (
            <p>{t('sole_fee', { total: formatEuro(total, locale) })}</p>
          ) : (
            <p>
              {t('total', { total: formatEuro(total, locale) })}
              {' · '}
              {t('remaining', { remaining: formatEuro(split.remaining, locale) })}
            </p>
          )}
          {locked ? (
            <p className="flex items-center gap-1 text-label-secondary">
              <MdLock aria-hidden="true" />
              {t('locked')}
            </p>
          ) : null}
          {me ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                filled
                onClick={() => (locked ? runGenerateInvoice() : setConfirmLockOpen(true))}
                disabled={Boolean(downloadHint) || generating}
              >
                {generating ? t('generating') : t('download_invoice')}
              </Button>
              {downloadHint ? <span className="text-xs text-label-secondary">{downloadHint}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {me?.certificateURL ? (
        <div className="mt-4 border-t border-border-primary pt-4">
          <Button as="a" href={getCertificateDownloadUrl(me.certificateURL)} filled>
            {t('download_certificate')}
          </Button>
        </div>
      ) : null}

      <QuestionConfirmationDialog
        open={confirmLockOpen}
        title={t('confirm_lock_title')}
        question={t(isEventCourse ? 'confirm_lock_question_event' : 'confirm_lock_question')}
        confirmationText={t('confirm_lock_confirm')}
        onClose={() => setConfirmLockOpen(false)}
        onConfirm={runGenerateInvoice}
      />
      {error ? <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} /> : null}
    </div>
  );
};
