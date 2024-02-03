import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../../queries/__generated__/CourseWithEnrollment';
import { BlockTitle } from '@opencampus/shared-components';

import { AttendanceStatus_enum } from '../../../__generated__/globalTypes';
import { CourseWithEnrollment_Course_by_pk_Sessions } from '../../../queries/__generated__/CourseWithEnrollment';

interface AttendanceEntryProps {
  session: CourseWithEnrollment_Course_by_pk_Sessions;
}

const { NO_INFO, ATTENDED, MISSED } = AttendanceStatus_enum;

const AttendanceEntry: FC<AttendanceEntryProps> = ({ session }) => {
  const { lang } = useTranslation();

  const lastAttendanceRecord =
    session.Attendances.length > 0
      ? session.Attendances.reduce(
          (prev, current) => {
            return prev.updated_at > current.updated_at ? prev : current;
          },
          { updated_at: 0, status: NO_INFO }
        )
      : { updated_at: 0, status: NO_INFO };

  const status = lastAttendanceRecord.status;

  const bgColor = status === NO_INFO ? 'bg-gray-200' : status === ATTENDED ? 'bg-edu-green' : 'bg-edu-missed-yellow';

  const fontWeight = status === ATTENDED ? 'font-semibold' : '';

  const textColor = status === MISSED ? 'text-gray-500' : '';

  return (
    <span
      // className={`text-sm bg-gray-200 text-center px-4 py-3 rounded`}
      className={`text-sm ${fontWeight} ${textColor} text-center px-4 py-3 ${bgColor} rounded`}
    >
      {session.startDateTime.toLocaleDateString(lang, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}
    </span>
  );
};

interface AttendancesProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Attendances: FC<AttendancesProps> = ({ course }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <BlockTitle>{t('course-page:attendances')}</BlockTitle>
      <span className="text-lg mb-4">
        {t('course-page:maxMissedSessions_plural', {
          count: course.maxMissedSessions,
        })}
      </span>
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {course.Sessions.map((session) => (
            <AttendanceEntry key={session.id} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
};
