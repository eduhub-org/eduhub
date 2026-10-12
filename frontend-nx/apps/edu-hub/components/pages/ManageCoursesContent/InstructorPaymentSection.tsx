import { FC, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MdLock, MdLockOpen } from 'react-icons/md';

import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { useManageMutation } from '../../../hooks/authedMutation';
import {
  centsToEuroInput,
  formatEuro,
  parseEuroToCents,
  isEuroInputAllowed,
  summarizeSplit,
} from '../../../helpers/instructorPayment';
import {
  UNLOCK_COURSE_INSTRUCTOR_PAYMENT,
  UPSERT_COURSE_INSTRUCTOR_PAYMENT_TOTAL,
} from '../../../queries/instructorPayment';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import {
  UpsertCourseInstructorPaymentTotal,
  UpsertCourseInstructorPaymentTotalVariables,
} from '../../../queries/__generated__/UpsertCourseInstructorPaymentTotal';
import {
  UnlockCourseInstructorPayment,
  UnlockCourseInstructorPaymentVariables,
} from '../../../queries/__generated__/UnlockCourseInstructorPayment';

interface IProps {
  course: AdminCourseList_Course;
  onError: (message: string) => void;
}

/** Program admins set the flat instructor fee of a course and can unlock a fixed split. */
const InstructorPaymentSection: FC<IProps> = ({ course, onError }) => {
  const t = useTranslations('manageCourses.instructor_payment');
  const locale = useLocale();
  const payment = course.InstructorPayment;
  const [value, setValue] = useState(centsToEuroInput(payment?.totalAmount, locale));
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);

  useEffect(() => {
    setValue(centsToEuroInput(payment?.totalAmount, locale));
  }, [payment?.totalAmount, locale]);

  const [upsertTotal] = useManageMutation<UpsertCourseInstructorPaymentTotal, UpsertCourseInstructorPaymentTotalVariables>(
    UPSERT_COURSE_INSTRUCTOR_PAYMENT_TOTAL,
    { refetchQueries: ['AdminCourseList'] }
  );
  const [unlock] = useManageMutation<UnlockCourseInstructorPayment, UnlockCourseInstructorPaymentVariables>(
    UNLOCK_COURSE_INSTRUCTOR_PAYMENT,
    { refetchQueries: ['AdminCourseList'] }
  );

  const saveTotal = async () => {
    if (value.trim() === '') {
      setValue(centsToEuroInput(payment?.totalAmount, locale));
      return;
    }
    const cents = parseEuroToCents(value);
    if (cents === null) {
      onError(t('invalid_amount'));
      return;
    }
    if (cents === payment?.totalAmount) return;
    try {
      await upsertTotal({ variables: { courseId: course.id, totalAmount: cents } });
    } catch {
      onError(t('save_failed'));
    }
  };

  const handleUnlock = async () => {
    setConfirmUnlockOpen(false);
    try {
      await unlock({ variables: { courseId: course.id } });
    } catch {
      onError(t('save_failed'));
    }
  };

  const shareByInstructorId = new Map(
    (course.InstructorPaymentShares ?? []).map((row) => [row.id, row.PaymentShare?.amount ?? null])
  );
  const split = summarizeSplit(
    payment?.totalAmount ?? 0,
    course.CourseInstructors.map((instructor) => shareByInstructorId.get(instructor.id) ?? null)
  );

  return (
    <div className="mt-4 border-t border-border-primary pt-4 space-y-3">
      <label className="flex flex-col gap-1 text-sm text-label-primary">
        <span className="font-medium">{t('total_label')}</span>
        <span className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            className="w-32 rounded border border-border-primary bg-transparent px-2 py-1 text-right"
            placeholder="–"
            value={value}
            onChange={(e) => {
            if (isEuroInputAllowed(e.target.value)) setValue(e.target.value);
          }}
            onBlur={saveTotal}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
          <span>€</span>
        </span>
        <span className="text-xs text-label-secondary">{t('total_help')}</span>
      </label>

      {payment && course.CourseInstructors.length > 1 ? (
        <ul className="text-sm text-label-primary space-y-1">
          {course.CourseInstructors.map((instructor) => {
            const share = shareByInstructorId.get(instructor.id);
            return (
              <li key={instructor.id} className="flex justify-between gap-2">
                <span>
                  {instructor.User.firstName} {instructor.User.lastName}
                </span>
                <span>{share === null || share === undefined ? '–' : formatEuro(share, locale)}</span>
              </li>
            );
          })}
          <li className="flex justify-between gap-2 text-xs text-label-secondary">
            <span>{t('remaining')}</span>
            <span>{formatEuro(split.remaining, locale)}</span>
          </li>
        </ul>
      ) : null}

      {payment?.lockedAt ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-label-secondary">
            <MdLock aria-hidden="true" />
            {t('locked')}
          </span>
          <button
            type="button"
            onClick={() => setConfirmUnlockOpen(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
          >
            <MdLockOpen aria-hidden="true" />
            {t('unlock')}
          </button>
        </div>
      ) : null}

      <QuestionConfirmationDialog
        open={confirmUnlockOpen}
        title={t('unlock')}
        question={t('unlock_question')}
        onClose={() => setConfirmUnlockOpen(false)}
        onConfirm={handleUnlock}
      />
    </div>
  );
};

export default InstructorPaymentSection;
