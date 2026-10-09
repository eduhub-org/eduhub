import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

import { EnrollmentHistoryFragment } from '../../queries/__generated__/EnrollmentHistoryFragment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';

/** Timeline dot colour per outcome: completed, participating, open, withdrawn/expired, failed. */
const OPEN = 'var(--eduhub-label-disabled)';
const STATUS_DOT_COLORS: Record<CourseEnrollmentStatus_enum, string> = {
  [CourseEnrollmentStatus_enum.COMPLETED]: 'var(--eduhub-success)',
  [CourseEnrollmentStatus_enum.CONFIRMED]: 'var(--eduhub-info)',
  [CourseEnrollmentStatus_enum.APPLIED]: OPEN,
  [CourseEnrollmentStatus_enum.INVITED]: OPEN,
  [CourseEnrollmentStatus_enum.WAITLIST]: OPEN,
  [CourseEnrollmentStatus_enum.REGISTERED]: OPEN,
  [CourseEnrollmentStatus_enum.CANCELLED]: 'var(--eduhub-warning)',
  [CourseEnrollmentStatus_enum.EXPIRED]: 'var(--eduhub-warning)',
  [CourseEnrollmentStatus_enum.REJECTED]: 'var(--eduhub-error)',
  [CourseEnrollmentStatus_enum.ABORTED]: 'var(--eduhub-error)',
};

/**
 * Statuses for which the person took part (or, for direct sign-ups such as events, was signed up),
 * so attendance means something.
 */
const PARTICIPATION_STATUSES = new Set<CourseEnrollmentStatus_enum>([
  CourseEnrollmentStatus_enum.REGISTERED,
  CourseEnrollmentStatus_enum.CONFIRMED,
  CourseEnrollmentStatus_enum.COMPLETED,
  CourseEnrollmentStatus_enum.ABORTED,
]);

export interface EnrollmentHistoryGroup {
  programId: number;
  shortTitle: string;
  title: string;
  enrollments: EnrollmentHistoryFragment[];
}

const time = (value: string | null | undefined) => (value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY);

/**
 * Groups enrollments by program, newest program first (by lecture start), and newest
 * enrollment first within a program.
 */
export const groupEnrollmentsByProgram = (
  enrollments: EnrollmentHistoryFragment[],
  excludeCourseId?: number
): EnrollmentHistoryGroup[] => {
  const groups = new Map<number, EnrollmentHistoryGroup>();
  const lectureStarts = new Map<number, string | null>();
  for (const enrollment of enrollments) {
    if (excludeCourseId != null && enrollment.courseId === excludeCourseId) continue;
    const program = enrollment.Course.Program;
    if (!groups.has(program.id)) {
      groups.set(program.id, {
        programId: program.id,
        shortTitle: program.shortTitle || program.title,
        title: program.title,
        enrollments: [],
      });
      lectureStarts.set(program.id, program.lectureStart);
    }
    groups.get(program.id)?.enrollments.push(enrollment);
  }
  return [...groups.values()]
    .sort((a, b) => time(lectureStarts.get(b.programId)) - time(lectureStarts.get(a.programId)))
    .map((group) => ({
      ...group,
      enrollments: [...group.enrollments].sort((a, b) => time(b.created_at) - time(a.created_at)),
    }));
};

/** Attendance of mandatory past sessions, only for statuses where the person took part. */
export const attendanceOf = (enrollment: EnrollmentHistoryFragment) => {
  const total = enrollment.AttendanceStats?.totalSessions ?? 0;
  if (!PARTICIPATION_STATUSES.has(enrollment.status) || total <= 0) return null;
  const attended = enrollment.AttendanceStats?.attendedSessions ?? 0;
  return { attended, total, percent: Math.round((attended / total) * 100) };
};

/** Mandatory sessions are over, but no attendance was recorded for them (common for events). */
export const isAttendanceUnrecorded = (enrollment: EnrollmentHistoryFragment) =>
  PARTICIPATION_STATUSES.has(enrollment.status) &&
  (enrollment.AttendanceStats?.pastSessions ?? 0) > 0 &&
  (enrollment.AttendanceStats?.totalSessions ?? 0) === 0;

/** ECTS are only shown once the achievement certificate exists, i.e. when they were earned. */
const earnedEcts = (enrollment: EnrollmentHistoryFragment) => {
  if (!enrollment.achievementCertificateURL || !enrollment.Course.ects) return null;
  const ects = parseFloat(enrollment.Course.ects.replace(',', '.'));
  return Number.isNaN(ects) || ects <= 0 ? null : ects.toString();
};

interface Props {
  enrollments: EnrollmentHistoryFragment[];
  /** Leave out this course, e.g. the one the application is for. */
  excludeCourseId?: number;
  /**
   * Show the section heading with the legend tooltip. Turn it off inside a card that has its
   * own title, and pass the `enrollmentHistory.legend` text as the card's help text instead.
   */
  showLabel?: boolean;
}

/**
 * A person's applications and participations as a timeline, newest program first. The dot shows
 * the outcome; a hollow dot means the sessions are over but no attendance was recorded.
 */
export const EnrollmentHistory: FC<Props> = ({ enrollments, excludeCourseId, showLabel = true }) => {
  const t = useTranslations('enrollmentHistory');
  const entries = useMemo(
    () =>
      groupEnrollmentsByProgram(enrollments, excludeCourseId).flatMap((group) =>
        group.enrollments.map((enrollment) => ({ group, enrollment }))
      ),
    [enrollments, excludeCourseId]
  );

  return (
    <div className="min-w-0">
      {showLabel && (
        <div className="text-sm font-medium text-label-primary mb-2 flex items-center gap-1">
          {t('label')}
          <Tooltip title={t('legend')} placement="top">
            <HelpOutline className="cursor-pointer text-label-disabled" fontSize="small" aria-label={t('legend')} />
          </Tooltip>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="text-sm text-label-secondary italic">{t('empty')}</div>
      ) : (
        <ol className="min-w-0">
          {entries.map(({ group, enrollment }, index) => {
            const isLast = index === entries.length - 1;
            const attendance = attendanceOf(enrollment);
            const unrecorded = isAttendanceUnrecorded(enrollment);
            const ects = earnedEcts(enrollment);
            const dotColor = STATUS_DOT_COLORS[enrollment.status] ?? OPEN;
            return (
              <li key={enrollment.id} className="flex gap-3">
                <div className="flex w-3 flex-shrink-0 flex-col items-center" aria-hidden="true">
                  <span
                    data-testid="history-dot"
                    className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                    style={unrecorded ? { border: `2px solid ${dotColor}` } : { backgroundColor: dotColor }}
                  />
                  {!isLast && <span className="mt-1 w-0.5 flex-1 bg-table-divider" />}
                </div>
                <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-4'}`}>
                  <Tooltip title={group.title} placement="top-start">
                    <div className="inline-block text-[11px] font-semibold text-label-secondary">{group.shortTitle}</div>
                  </Tooltip>
                  <div className="text-sm font-semibold text-label-primary break-words">{enrollment.Course.title}</div>
                  <div className="text-xs text-label-secondary">
                    {t(`status.${enrollment.status}`)}
                    {attendance && (
                      <Tooltip title={t('attendance_tooltip', { total: attendance.total })} placement="top">
                        <span className="whitespace-nowrap"> · {t('attendance', attendance)}</span>
                      </Tooltip>
                    )}
                    {unrecorded && (
                      <Tooltip title={t('attendance_not_recorded_tooltip')} placement="top">
                        <span className="whitespace-nowrap"> · {t('attendance_not_recorded')}</span>
                      </Tooltip>
                    )}
                    {ects && <span className="whitespace-nowrap"> · {t('ects', { ects })}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default EnrollmentHistory;
