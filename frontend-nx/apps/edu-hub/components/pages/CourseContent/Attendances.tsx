import { useTranslations, useLocale } from 'next-intl';
import { FC, useMemo } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../../queries/__generated__/CourseWithEnrollment';
import { SectionTitle } from '../../common/SectionTitle';
import Dot from '../../common/Dot';

import { AttendanceStatus_enum } from '../../../__generated__/globalTypes';
import { CourseWithEnrollment_Course_by_pk_Sessions } from '../../../queries/__generated__/CourseWithEnrollment';
import { pickEffectiveAttendance } from '../../../helpers/attendance';
import { isMandatorySession } from '../../../helpers/courseParticipationAttendance';
import { isProgramSession, mergeSessions } from '../../../helpers/programSessions';
import { AttendanceDay, getDayStatus, groupSessionsIntoAttendanceDays } from '../../../helpers/attendanceDays';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

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

const { NO_INFO, ATTENDED, MISSED } = AttendanceStatus_enum;

type SessionDay = AttendanceDay<CourseWithEnrollment_Course_by_pk_Sessions>;

const AttendanceEntry: FC<{ day: SessionDay }> = ({ day }) => {
  const t = useTranslations('course');
  const locale = useLocale();
  const { timeZone } = useAppSettings();

  // Prefer INSTRUCTOR-sourced rows over automated ones; within the pool, pick
  // the most recently updated row. `updated_at` can be null for freshly
  // inserted rows; treat null as epoch 0 so it never wins over a timestamp.
  const attendanceBySession = Object.fromEntries(
    day.sessions.map((session) => [
      session.id,
      pickEffectiveAttendance(session.Attendances, (a) => (a.updated_at ? new Date(a.updated_at).getTime() : 0)),
    ])
  );
  const status = getDayStatus(day, attendanceBySession);

  const bgColor = getBgColor(status);

  const fontWeight = status === ATTENDED ? 'font-semibold' : '';
  const isProgramDay = day.sessions.every(isProgramSession);

  return (
    <span
      title={day.sessions.map((session) => session.title).filter(Boolean).join(' · ') || undefined}
      className={`flex flex-col text-sm ${fontWeight} text-center px-4 py-3 ${bgColor} rounded overflow-hidden whitespace-nowrap text-ellipsis`}
    >
      {day.dayStart.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
      })}
      {isProgramDay && (
        <span className="text-[10px] font-normal uppercase tracking-wider">{t('sessions.program_session')}</span>
      )}
    </span>
  );
};

interface AttendancesProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Attendances: FC<AttendancesProps> = ({ course }) => {
  const t = useTranslations('course');
  // Participants only see the sessions that count toward passing: mandatory
  // course sessions and mandatory program-wide ones. Optional sessions are
  // still tracked, but only shown to instructors. Attendance counts per day.
  const allSessions = useMemo(
    () => mergeSessions<CourseWithEnrollment_Course_by_pk_Sessions>(course.Sessions, course.Program?.Sessions),
    [course.Sessions, course.Program?.Sessions]
  );
  const { timeZone } = useAppSettings();
  const days = useMemo(
    () => groupSessionsIntoAttendanceDays(allSessions.filter(isMandatorySession), timeZone),
    [allSessions, timeZone]
  );
  const allDayCount = useMemo(
    () => groupSessionsIntoAttendanceDays(allSessions, timeZone).length,
    [allSessions, timeZone]
  );
  const hasOptionalDays = days.length < allDayCount;

  return (
    <div className="flex flex-col w-full mb-4 md:mb-0">
      <SectionTitle>{t('attendances.attendances')}</SectionTitle>
      <div className="rounded-2xl overflow-hidden border border-border-primary bg-fill-primary light text-label-primary p-4 min-w-0">
        <span className="text-lg mb-4 block">
          {hasOptionalDays
            ? t('attendances.max_missed_mandatory_sessions', {
                count: course.maxMissedSessions,
                total: days.length,
              })
            : t('attendances.max_missed_sessions_plural', {
                count: course.maxMissedSessions,
              })}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {days.map((day) => (
            <AttendanceEntry key={day.dayKey} day={day} />
          ))}
        </div>
        <AttendanceStatusLegend />
      </div>
    </div>
  );
};
