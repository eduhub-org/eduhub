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

/**
 * Calendar date (local midnight) for a submission deadline.
 * Uses the date portion only — same semantics as course applicationEnd (no time-of-day).
 */
export function submissionDeadlineToCalendarDate(
  v: string | Date | null | undefined
): Date | null {
  const iso = submissionDeadlineToIsoString(v);
  if (!iso) return null;

  const datePart = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const day = Number(match[3]);
    const candidate = new Date(y, m, day);
    // Reject impossible calendar dates like 2025-02-31 that JS would silently roll forward.
    if (
      candidate.getFullYear() !== y ||
      candidate.getMonth() !== m ||
      candidate.getDate() !== day
    ) {
      return null;
    }
    return candidate;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Localized date-only label for UI (no time). */
export function formatSubmissionDeadlineDate(
  v: string | Date | null | undefined,
  locale: string
): string | null {
  const calendarDate = submissionDeadlineToCalendarDate(v);
  if (!calendarDate) return null;
  return calendarDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
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

/**
 * True when the deadline calendar day is before today (local).
 * The deadline date itself remains open all day — like applicationEnd on courses.
 */
export function isProjectSubmissionDeadlinePassed(
  projectSubmissionDeadline: string | Date | null | undefined,
  courseDefaultDeadline: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  const effectiveIso = getEffectiveProjectSubmissionDeadlineIso(
    projectSubmissionDeadline,
    courseDefaultDeadline
  );
  if (!effectiveIso) return false;

  const deadline = submissionDeadlineToCalendarDate(effectiveIso);
  if (!deadline) return false;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}
