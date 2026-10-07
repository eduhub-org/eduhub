import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

import { EnrollmentHistoryFragment } from '../../queries/__generated__/EnrollmentHistoryFragment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';

/**
 * Badge colour per outcome: completed, participating, open, withdrawn/expired, failed. Tints of
 * the theme tokens (the colour theme is CSS variables, so Tailwind opacity modifiers do not apply).
 */
const tint = (token: string, percent: number) => `color-mix(in srgb, var(${token}) ${percent}%, transparent)`;
const OPEN = 'var(--eduhub-bg-secondary)';
const STATUS_BADGE_COLORS: Record<CourseEnrollmentStatus_enum, string> = {
  [CourseEnrollmentStatus_enum.COMPLETED]: tint('--eduhub-success', 80),
  [CourseEnrollmentStatus_enum.CONFIRMED]: tint('--eduhub-info', 22),
  [CourseEnrollmentStatus_enum.APPLIED]: OPEN,
  [CourseEnrollmentStatus_enum.INVITED]: OPEN,
  [CourseEnrollmentStatus_enum.WAITLIST]: OPEN,
  [CourseEnrollmentStatus_enum.REGISTERED]: OPEN,
  [CourseEnrollmentStatus_enum.CANCELLED]: tint('--eduhub-warning', 45),
  [CourseEnrollmentStatus_enum.EXPIRED]: tint('--eduhub-warning', 45),
  [CourseEnrollmentStatus_enum.REJECTED]: tint('--eduhub-error', 30),
  [CourseEnrollmentStatus_enum.ABORTED]: tint('--eduhub-error', 30),
};

/** Statuses for which the participant actually took part, so attendance means something. */
const PARTICIPATION_STATUSES = new Set<CourseEnrollmentStatus_enum>([
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
 * A person's applications and participations, grouped by program, with a colour coded
 * outcome badge and the attendance of mandatory sessions.
 */
export const EnrollmentHistory: FC<Props> = ({ enrollments, excludeCourseId, showLabel = true }) => {
  const t = useTranslations('enrollmentHistory');
  const groups = useMemo(() => groupEnrollmentsByProgram(enrollments, excludeCourseId), [enrollments, excludeCourseId]);

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
      {groups.length === 0 ? (
        <div className="text-sm text-label-secondary italic">{t('empty')}</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <section key={group.programId} aria-label={group.title}>
              <Tooltip title={group.title} placement="top-start">
                <h4 className="inline-block text-xs font-semibold uppercase tracking-wide text-label-secondary mb-1">
                  {group.shortTitle}
                </h4>
              </Tooltip>
              <ul className="space-y-1">
                {group.enrollments.map((enrollment) => {
                  const attendance = attendanceOf(enrollment);
                  const ects = earnedEcts(enrollment);
                  return (
                    <li
                      key={enrollment.id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-label-primary"
                    >
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-label-primary"
                        style={{ backgroundColor: STATUS_BADGE_COLORS[enrollment.status] ?? OPEN }}
                      >
                        {t(`status.${enrollment.status}`)}
                      </span>
                      <span className="min-w-0 break-words">{enrollment.Course.title}</span>
                      {ects && <span className="text-xs text-label-secondary">{t('ects', { ects })}</span>}
                      {attendance && (
                        <Tooltip title={t('attendance_tooltip', { total: attendance.total })} placement="top">
                          <span className="text-xs text-label-secondary whitespace-nowrap">
                            {t('attendance', attendance)}
                          </span>
                        </Tooltip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrollmentHistory;
