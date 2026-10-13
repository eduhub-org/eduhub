import { FC, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MdLock, MdLockOpen } from 'react-icons/md';

import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import InputField from '../../inputs/InputField';
import { useManageMutation } from '../../../hooks/authedMutation';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { centsToEuroInput, formatEuro, summarizeSplit } from '../../../helpers/instructorPayment';
import {
  UNLOCK_COURSE_INSTRUCTOR_PAYMENT,
  UPSERT_COURSE_INSTRUCTOR_PAYMENT_TOTAL,
} from '../../../queries/instructorPayment';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import {
  UnlockCourseInstructorPayment,
  UnlockCourseInstructorPaymentVariables,
} from '../../../queries/__generated__/UnlockCourseInstructorPayment';

interface IProps {
  course: AdminCourseList_Course;
  isEventCourse: boolean;
  onError: (message: string) => void;
}

/** Program admins set the flat instructor fee of a course and can unlock a fixed split. */
const InstructorPaymentSection: FC<IProps> = ({ course, isEventCourse, onError }) => {
  const t = useTranslations('manageCourses.instructor_payment');
  const locale = useLocale();
  const payment = course.InstructorPayment;
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);

  const [unlock] = useManageMutation<UnlockCourseInstructorPayment, UnlockCourseInstructorPaymentVariables>(
    UNLOCK_COURSE_INSTRUCTOR_PAYMENT,
    { refetchQueries: ['AdminCourseList'] }
  );

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
      <div className="text-sm text-label-primary">
        {/* Saves with the admin / org admin role, like the unlock mutation below. */}
        <ManagementRoleProvider>
          <InputField
            variant="material"
            type="currency"
            label={t(isEventCourse ? 'total_label_event' : 'total_label')}
            itemId={course.id}
            value={centsToEuroInput(payment?.totalAmount, locale)}
            updateValueMutation={UPSERT_COURSE_INSTRUCTOR_PAYMENT_TOTAL}
            refetchQueries={['AdminCourseList']}
            min={0}
          />
        </ManagementRoleProvider>
        <span className="text-xs text-label-secondary">{t(isEventCourse ? 'total_help_event' : 'total_help')}</span>
      </div>

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
        question={t(isEventCourse ? 'unlock_question_event' : 'unlock_question')}
        onClose={() => setConfirmUnlockOpen(false)}
        onConfirm={handleUnlock}
      />
    </div>
  );
};

export default InstructorPaymentSection;
