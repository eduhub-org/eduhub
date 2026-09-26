import { useTranslations, useLocale } from 'next-intl';
import { FC, useMemo } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../../queries/__generated__/CourseWithEnrollment';
import { SectionTitle } from '../../common/SectionTitle';
import Dot from '../../common/Dot';

import { AttendanceStatus_enum } from '../../../__generated__/globalTypes';
import { CourseWithEnrollment_Course_by_pk_Sessions } from '../../../queries/__generated__/CourseWithEnrollment';
import { pickEffectiveAttendance } from '../../../helpers/attendance';
import { countMandatorySessions, isMandatorySession } from '../../../helpers/courseParticipationAttendance';
import { isProgramSession, mergeSessions } from '../../../helpers/programSessions';

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
  const t = useTranslations('course');
  const locale = useLocale();
  const isOptional = !isMandatorySession(session);

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

  // Optional sessions keep their status colour but get a dashed outline and a
  // label, since they do not count toward the allowed absences.
  const optionalClasses = isOptional ? 'border-2 border-dashed border-label-secondary' : '';

  return (
    <span
      title={isProgramSession(session) ? t('sessions.program_session') : undefined}
      className={`flex flex-col text-sm ${fontWeight} text-center px-4 py-3 ${bgColor} ${optionalClasses} rounded overflow-hidden whitespace-nowrap text-ellipsis`}
    >
      {new Date(session.startDateTime).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}
      {isProgramSession(session) && (
        <span className="text-[10px] font-normal uppercase tracking-wider">{t('sessions.program_session')}</span>
      )}
      {isOptional && <span className="text-[10px] font-normal uppercase tracking-wider">{t('attendances.optional')}</span>}
    </span>
  );
};

interface AttendancesProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Attendances: FC<AttendancesProps> = ({ course }) => {
  const t = useTranslations('course');
  // Program-wide sessions count like course sessions when they are mandatory.
  const sessions = useMemo(
    () => mergeSessions<CourseWithEnrollment_Course_by_pk_Sessions>(course.Sessions, course.Program?.Sessions),
    [course.Sessions, course.Program?.Sessions]
  );
  const hasOptionalSessions = sessions.some((session) => !isMandatorySession(session));

  return (
    <div className="flex flex-col w-full mb-4 md:mb-0">
      <SectionTitle>{t('attendances.attendances')}</SectionTitle>
      <div className="rounded-2xl overflow-hidden border border-border-primary bg-fill-primary light text-label-primary p-4 min-w-0">
        <span className="text-lg mb-4 block">
          {hasOptionalSessions
            ? t('attendances.max_missed_mandatory_sessions', {
                count: course.maxMissedSessions,
                total: countMandatorySessions(sessions),
              })
            : t('attendances.max_missed_sessions_plural', {
                count: course.maxMissedSessions,
              })}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {sessions.map((session) => (
            <AttendanceEntry key={session.id} session={session} />
          ))}
        </div>
        <AttendanceStatusLegend />
      </div>
    </div>
  );
};
