import { submissionDeadlineToCalendarDate } from '../../../CourseContent/Projects/projectEffectiveSubmissionDeadline';

/**
 * How the instructor wants to treat the submission deadline while sending a
 * project back for revision. `''` means "not decided yet".
 */
export type DeadlineExtensionChoice = '' | 'keep' | 'plus_1_week' | 'plus_2_weeks' | 'custom';

/** Relative options, in the order they are offered. */
export const RELATIVE_EXTENSION_DAYS: Record<'plus_1_week' | 'plus_2_weeks', number> = {
  plus_1_week: 7,
  plus_2_weeks: 14,
};

/** Local `yyyy-mm-dd` — submission deadlines are date-only (see DatePicker). */
export const toDateInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Base a relative extension counts from: the later of today and the current
 * deadline. Extending a deadline that has already passed by "one week" has to
 * mean a week from now, not a week from a date in the past.
 */
export const getExtensionBaseDate = (
  effectiveDeadlineIso: string | null | undefined,
  now: Date = new Date()
): Date => {
  const today = startOfDay(now);
  const current = submissionDeadlineToCalendarDate(effectiveDeadlineIso);
  return current && current > today ? current : today;
};

/** Resulting date of a relative choice, as a `yyyy-mm-dd` string. */
export const getRelativeDeadline = (
  choice: 'plus_1_week' | 'plus_2_weeks',
  effectiveDeadlineIso: string | null | undefined,
  now: Date = new Date()
): string => {
  const base = getExtensionBaseDate(effectiveDeadlineIso, now);
  base.setDate(base.getDate() + RELATIVE_EXTENSION_DAYS[choice]);
  return toDateInputValue(base);
};

interface DeadlineSelection {
  choice: DeadlineExtensionChoice;
  /** `yyyy-mm-dd` from the custom date input. */
  customDate: string;
  effectiveDeadlineIso: string | null | undefined;
  now?: Date;
}

/** True when the custom date is a real calendar date that is not in the past. */
export const isCustomDeadlineValid = (customDate: string, now: Date = new Date()): boolean => {
  const parsed = submissionDeadlineToCalendarDate(customDate);
  return Boolean(parsed && parsed >= startOfDay(now));
};

/**
 * The deadline to persist, or `null` when the deadline should stay as it is.
 * Never returns a date for an undecided or invalid selection.
 */
export const resolveExtendedDeadline = ({
  choice,
  customDate,
  effectiveDeadlineIso,
  now = new Date(),
}: DeadlineSelection): string | null => {
  if (choice === 'plus_1_week' || choice === 'plus_2_weeks') {
    return getRelativeDeadline(choice, effectiveDeadlineIso, now);
  }
  if (choice === 'custom') {
    return isCustomDeadlineValid(customDate, now) ? customDate : null;
  }
  return null;
};

/**
 * Whether the send-back may be confirmed.
 *
 * A deadline that has already passed forces an explicit decision: without a new
 * one the team cannot resubmit at all, so "I did not think about it" must not be
 * a possible outcome. Keeping the deadline stays allowed — but only as a
 * deliberate choice.
 */
export const isDeadlineSelectionConfirmable = ({
  choice,
  customDate,
  isDeadlinePassed,
  now = new Date(),
}: {
  choice: DeadlineExtensionChoice;
  customDate: string;
  isDeadlinePassed: boolean;
  now?: Date;
}): boolean => {
  if (choice === '') return !isDeadlinePassed;
  if (choice === 'custom') return isCustomDeadlineValid(customDate, now);
  return true;
};
