import { FC, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SiElement } from 'react-icons/si';
import { MdLock } from 'react-icons/md';

import UserCard from '../../../common/UserCard';
import { Button } from '../../../common/Button';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { elementDirectMessageUrl } from '../../../../helpers/matrix';
import { getCertificateDownloadUrl } from '../../../../helpers/certificateDownload';
import {
  centsToEuroInput,
  formatEuro,
  parseEuroToCents,
  isEuroInputAllowed,
  summarizeSplit,
} from '../../../../helpers/instructorPayment';
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
import {
  UpsertCourseInstructorPaymentShare,
  UpsertCourseInstructorPaymentShareVariables,
} from '../../../../queries/__generated__/UpsertCourseInstructorPaymentShare';

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
  const savedAmount = member.PaymentShare?.amount ?? null;
  const [value, setValue] = useState(centsToEuroInput(savedAmount, locale));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(centsToEuroInput(savedAmount, locale));
  }, [savedAmount, locale]);

  const [upsertShare] = useRoleMutation<UpsertCourseInstructorPaymentShare, UpsertCourseInstructorPaymentShareVariables>(
    UPSERT_COURSE_INSTRUCTOR_PAYMENT_SHARE
  );

  const save = async () => {
    // An empty field stays "not entered yet"; there is no default amount.
    if (value.trim() === '') {
      setValue(centsToEuroInput(savedAmount, locale));
      setError(null);
      return;
    }
    const cents = parseEuroToCents(value);
    if (cents === null) {
      setError(t('invalid_amount'));
      return;
    }
    if (cents === savedAmount) {
      setError(null);
      return;
    }
    if (otherSharesSum + cents > total) {
      setError(t('exceeds_total', { max: formatEuro(Math.max(total - otherSharesSum, 0), locale) }));
      return;
    }
    try {
      await upsertShare({ variables: { courseInstructorId: member.id, amount: cents } });
      setError(null);
      onSaved();
    } catch {
      setError(t('save_failed'));
    }
  };

  return (
    <div className="flex flex-col items-end">
      <label className="flex items-center gap-2 text-sm text-label-primary">
        <input
          type="text"
          inputMode="decimal"
          aria-label={t('share_label', { name: `${member.User.firstName} ${member.User.lastName}` })}
          className="w-28 rounded border border-border-primary bg-transparent px-2 py-1 text-right disabled:opacity-60"
          placeholder="–"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            if (isEuroInputAllowed(e.target.value)) setValue(e.target.value);
          }}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        <span>€</span>
      </label>
      {error ? <span className="mt-1 text-xs text-error">{error}</span> : null}
    </div>
  );
};

interface IProps {
  courseId: number;
}

/**
 * Who teaches the course with me, how to reach them, and how we split the course fee.
 * Payment data is only returned by Hasura to instructors of this course and (org) admins.
 */
export const CourseTeamCard: FC<IProps> = ({ courseId }) => {
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
      ? t('hint_missing_amounts')
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
        <p className="mb-4 text-sm text-label-secondary">{t('split_explanation', { total: formatEuro(total, locale) })}</p>
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

      <QuestionConfirmationDialog
        open={confirmLockOpen}
        title={t('confirm_lock_title')}
        question={t('confirm_lock_question')}
        confirmationText={t('confirm_lock_confirm')}
        onClose={() => setConfirmLockOpen(false)}
        onConfirm={runGenerateInvoice}
      />
      {error ? <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} /> : null}
    </div>
  );
};
