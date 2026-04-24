/**
 * Shared helpers for collapsing multiple Attendance rows per (user, session)
 * into a single effective row.
 *
 * An instructor manual override (source === ATTENDANCE_SOURCE_INSTRUCTOR)
 * must always win over automated rows inserted by the attendance-check cron
 * (ZOOM / LIMESURVEY) or legacy rows with a NULL source. If multiple
 * INSTRUCTOR rows exist for the same (user, session) — e.g. the dot was
 * toggled several times — the caller supplies a tie-break function (usually
 * `a => a.id` or `a => Date.parse(a.updated_at)`) and the row with the
 * largest value wins.
 */

export const ATTENDANCE_SOURCE_INSTRUCTOR = 'INSTRUCTOR';

type AttendanceLike = { source?: string | null };

/**
 * Returns the effective Attendance row from a pool of rows for the same
 * (user, session), or `undefined` if the pool is empty.
 *
 * Precedence:
 * 1. If any row has `source === 'INSTRUCTOR'`, restrict the pool to those
 *    rows.
 * 2. Within the (possibly restricted) pool, return the row whose
 *    `getTieBreak(row)` is the largest.
 */
export function pickEffectiveAttendance<T extends AttendanceLike>(
  attendances: readonly T[],
  getTieBreak: (attendance: T) => number
): T | undefined {
  if (attendances.length === 0) return undefined;

  const instructorRows = attendances.filter(
    (attendance) => attendance.source === ATTENDANCE_SOURCE_INSTRUCTOR
  );
  const pool = instructorRows.length > 0 ? instructorRows : attendances;

  return pool.reduce<T | undefined>((best, current) => {
    if (best === undefined) return current;
    return getTieBreak(best) < getTieBreak(current) ? current : best;
  }, undefined);
}
