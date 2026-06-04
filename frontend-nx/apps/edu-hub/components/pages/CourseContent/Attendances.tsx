import { useTranslations, useLocale } from 'next-intl';
import { FC } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../../queries/__generated__/CourseWithEnrollment';
import { SectionTitle } from '../../common/SectionTitle';
import Dot from '../../common/Dot';

import { AttendanceStatus_enum } from '../../../__generated__/globalTypes';
import { CourseWithEnrollment_Course_by_pk_Sessions } from '../../../queries/__generated__/CourseWithEnrollment';
import { pickEffectiveAttendance } from '../../../helpers/attendance';

const getBgColor = (status: AttendanceStatus_enum | string) => {
  if (status === NO_INFO) {
    return 'bg-gray-200';
  } else if (status === ATTENDED) {
    return 'bg-green-500';
  } else if (status === MISSED) {
    return 'bg-red-500';
  } else {
    return 'bg-gray-200';
  }
};

const AttendanceStatusLegend: FC = () => {
  const t = useTranslations('course');
  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <div className="flex items-center">
        <Dot className="text-red fill-green-500" /> {t('attendances.attendance_status.ATTENDED')}
      </div>
      <div className="flex items-center">
        <Dot className="text-red fill-red-500" /> {t('attendances.attendance_status.MISSED')}
      </div>
      <div className="flex items-center">
        <Dot className="text-red fill-gray-200" /> {t('attendances.attendance_status.PENDING')}
      </div>
    </div>
  );
};

interface AttendanceEntryProps {
  session: CourseWithEnrollment_Course_by_pk_Sessions;
}

const { NO_INFO, ATTENDED, MISSED } = AttendanceStatus_enum;

const AttendanceEntry: FC<AttendanceEntryProps> = ({ session }) => {
  const locale = useLocale();

  // Prefer INSTRUCTOR-sourced rows over automated ones; within the pool, pick
  // the most recently updated row. `updated_at` can be null for freshly
  // inserted rows; treat null as epoch 0 so it never wins over a timestamp.
  const effective = pickEffectiveAttendance(session.Attendances, (a) =>
    a.updated_at ? new Date(a.updated_at).getTime() : 0
  );
  const status = effective?.status ?? NO_INFO;

  const bgColor = getBgColor(status);

  const fontWeight = status === ATTENDED ? 'font-semibold' : '';

  // const textColor = status === MISSED ? 'text-gray-500' : '';

  return (
    <span
      // className={`text-sm bg-gray-200 text-center px-4 py-3 rounded`}
      className={`text-sm ${fontWeight} text-center px-4 py-3 ${bgColor} rounded overflow-hidden whitespace-nowrap text-ellipsis`}
    >
      {session.startDateTime.toLocaleDateString(locale, {
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
  const t = useTranslations('course');

  return (
    <div className="flex flex-col w-full mb-4 md:mb-0">
      <SectionTitle>{t('attendances.attendances')}</SectionTitle>
      <div className="rounded-2xl overflow-hidden border border-border-primary bg-fill-primary light text-label-primary p-4 min-w-0">
        <span className="text-lg mb-4 block">
          {t('attendances.max_missed_sessions_plural', {
            count: course.maxMissedSessions,
          })}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {course.Sessions.map((session) => (
            <AttendanceEntry key={session.id} session={session} />
          ))}
        </div>
        <AttendanceStatusLegend />
      </div>
    </div>
  );
};
