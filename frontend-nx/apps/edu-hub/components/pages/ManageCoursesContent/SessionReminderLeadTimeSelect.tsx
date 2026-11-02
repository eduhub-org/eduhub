import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import DropDownSelector from '../../inputs/DropDownSelector';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { useManageMutation } from '../../../hooks/authedMutation';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { UPDATE_COURSE_SESSION_REMINDER_LEAD_HOURS } from '../../../queries/course';
import {
  UpdateCourseSessionReminderLeadHours,
  UpdateCourseSessionReminderLeadHoursVariables,
} from '../../../queries/__generated__/UpdateCourseSessionReminderLeadHours';

/** The lead times a course can pick, in hours. Null in the database means "off". */
export const SESSION_REMINDER_LEAD_HOURS = [2, 24, 48, 72, 168] as const;
const OFF = 'OFF';

interface SessionReminderLeadTimeSelectProps {
  courseId: number;
  leadHours: number | null;
}

/** How long before the first session the course's one session reminder goes out, or off. */
const SessionReminderLeadTimeSelect: FC<SessionReminderLeadTimeSelectProps> = ({ courseId, leadHours }) => {
  const t = useTranslations('manageCourses.email_templates.session_reminder');
  const tCommon = useTranslations('common');
  const { error, handleError, resetError } = useErrorHandler();
  const [saved, setSaved] = useState(false);

  const [updateLeadHours] = useManageMutation<
    UpdateCourseSessionReminderLeadHours,
    UpdateCourseSessionReminderLeadHoursVariables
  >(UPDATE_COURSE_SESSION_REMINDER_LEAD_HOURS, { refetchQueries: ['AdminCourseList'] });

  const handleChange = useCallback(
    async (value: string) => {
      try {
        await updateLeadHours({
          variables: { courseId, leadHours: value === OFF ? null : Number(value) },
        });
        setSaved(true);
      } catch (err) {
        handleError(err instanceof Error ? err.message : String(err));
      }
    },
    [courseId, updateLeadHours, handleError]
  );

  const options = [
    { value: OFF, label: t('off') },
    ...SESSION_REMINDER_LEAD_HOURS.map((hours) => ({ value: String(hours), label: t(`lead_${hours}`) })),
  ];

  return (
    <>
      <DropDownSelector
        variant="material"
        label={t('label')}
        value={leadHours == null ? OFF : String(leadHours)}
        options={options}
        onValueUpdated={handleChange}
        helpText={t('help_text')}
      />
      <NotificationSnackbar open={saved} onClose={() => setSaved(false)} message={tCommon('notification_snackbar.saved')} />
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </>
  );
};

export default SessionReminderLeadTimeSelect;
