/** Normalize Hasura timestamptz / client values to a trimmed ISO-like string or null. */
export function submissionDeadlineToIsoString(
  v: string | Date | null | undefined
): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t || null;
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  }
  const t = String(v).trim();
  return t || null;
}

/** Minimal course shape needed to resolve the effective project submission deadline. */
export type CourseProjectSubmissionDeadlineSource = {
  projectSubmissionDeadline?: string | Date | null;
  Program?: {
    defaultProjectSubmissionDeadline?: string | Date | null;
    achievementRecordUploadDeadline?: string | Date | null;
  } | null;
};

/**
 * Single source of truth: per-course `projectSubmissionDeadline`, else program
 * `defaultProjectSubmissionDeadline`, else legacy `achievementRecordUploadDeadline`.
 * Use this anywhere the course page (or manage-course) needs “the” deadline before a per-project override.
 */
export function resolveEffectiveCourseProjectSubmissionDeadline(
  course: CourseProjectSubmissionDeadlineSource | null | undefined
): string | Date | null | undefined {
  if (!course) return null;
  return (
    course.projectSubmissionDeadline ??
    course.Program?.defaultProjectSubmissionDeadline ??
    course.Program?.achievementRecordUploadDeadline ??
    null
  );
}

/** Which setting supplies the deadline when the project has no override (course → program → legacy). */
export type CourseProjectSubmissionDefaultSource =
  | 'course'
  | 'program_default'
  | 'program_legacy'
  | null;

export function getCourseProjectSubmissionDefaultSource(
  course: CourseProjectSubmissionDeadlineSource | null | undefined
): CourseProjectSubmissionDefaultSource {
  if (!course) return null;
  if (submissionDeadlineToIsoString(course.projectSubmissionDeadline)) return 'course';
  if (submissionDeadlineToIsoString(course.Program?.defaultProjectSubmissionDeadline)) {
    return 'program_default';
  }
  if (submissionDeadlineToIsoString(course.Program?.achievementRecordUploadDeadline)) {
    return 'program_legacy';
  }
  return null;
}

/**
 * Effective deadline for a project row: per-project `submissionDeadline`, else the value from
 * {@link resolveEffectiveCourseProjectSubmissionDeadline} (pass as `courseDefaultDeadline`).
 */
export function getEffectiveProjectSubmissionDeadlineIso(
  projectSubmissionDeadline: string | Date | null | undefined,
  courseDefaultDeadline: string | Date | null | undefined
): string | null {
  const own = submissionDeadlineToIsoString(projectSubmissionDeadline);
  if (own) return own;
  return submissionDeadlineToIsoString(courseDefaultDeadline);
}
