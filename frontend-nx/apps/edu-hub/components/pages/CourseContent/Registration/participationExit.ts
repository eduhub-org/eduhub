import { CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';

/**
 * The two ways a participant can end their own participation.
 *
 * Which one applies is a question of timing, not of wording: before the course
 * runs there is a registration to take back, once it runs there is a
 * participation to break off. The admin side already draws the line in the same
 * place - see `dropoutStatus` in
 * `ManageCourseContent/ApplicationsTab/AddParticipantsForm.tsx`.
 */
export type ParticipationExitKind = 'CANCEL' | 'ABORT';

/**
 * What came back from an exit attempt. `changed` is false when the guarded
 * update matched no row, i.e. the enrollment moved on behind the page.
 */
export interface ParticipationExitOutcome {
  kind: ParticipationExitKind;
  changed: boolean;
}

export const PARTICIPATION_EXIT_STATUS: Record<ParticipationExitKind, CourseEnrollmentStatus_enum> = {
  CANCEL: CourseEnrollmentStatus_enum.CANCELLED,
  ABORT: CourseEnrollmentStatus_enum.ABORTED,
};

/**
 * Statuses a participant still holds a place from, and can therefore give up.
 *
 * Everything else is terminal: CANCELLED and ABORTED are the outcomes of this
 * very action, REJECTED and COMPLETED are somebody else's verdict on the
 * participation and are not the participant's to overwrite. Keep in step with
 * the `status: { _in: [...] }` guard on CANCEL_OWN_ENROLLMENT.
 */
export const PARTICIPATION_EXIT_ELIGIBLE_STATUSES: readonly CourseEnrollmentStatus_enum[] = [
  CourseEnrollmentStatus_enum.APPLIED,
  CourseEnrollmentStatus_enum.WAITLIST,
  CourseEnrollmentStatus_enum.INVITED,
  CourseEnrollmentStatus_enum.CONFIRMED,
  CourseEnrollmentStatus_enum.REGISTERED,
];

/** Only the two timestamps matter here; callers pass whole Session rows. */
export interface ParticipationExitSession {
  startDateTime?: string | Date | null;
  endDateTime?: string | Date | null;
}

export interface ParticipationExitArgs {
  status?: CourseEnrollmentStatus_enum | null;
  sessions?: readonly ParticipationExitSession[] | null;
  /**
   * Whether money has actually changed hands. Refunds are out of scope, so a
   * paid enrollment is settled with the organizer rather than self-service; a
   * pending or failed payment has taken nothing and stays cancellable.
   */
  hasPaidInvoice?: boolean;
  now?: Date;
}

const toTime = (value: string | Date | null | undefined): number | null => {
  if (value == null) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

/**
 * The course's real window, as milliseconds since the epoch.
 *
 * `Course.startTime` / `endTime` are times of day (`18:00`), not dates - the day
 * a course or event actually runs on lives on its Session rows, so the window is
 * the first session's start to the last session's end. The same reasoning is
 * spelled out server-side in
 * `functions/callNodeFunction/manageGuestRegistration/index.js`.
 *
 * Sessions may be only half planned. A `null` end means the end is unknown, not
 * that the session is over the instant it begins, so a course whose last session
 * has no `endDateTime` gets an open-ended window (`end: null`) rather than one
 * that closes at that session's start and locks the participant out mid-session.
 */
const getCourseWindow = (
  sessions: readonly ParticipationExitSession[]
): { start: number; end: number | null } | null => {
  let start: number | null = null;
  let latestStart: number | null = null;
  let end: number | null = null;

  for (const session of sessions) {
    const sessionStart = toTime(session.startDateTime);
    const sessionEnd = toTime(session.endDateTime);

    if (sessionStart != null) {
      if (start == null || sessionStart < start) start = sessionStart;
      if (latestStart == null || sessionStart > latestStart) latestStart = sessionStart;
    }
    if (sessionEnd != null && (end == null || sessionEnd > end)) end = sessionEnd;
  }

  if (start == null) return null;
  // A session starting after every end we know of carries the course past that
  // last end, and we cannot say how far - so the window stays open.
  if (end == null || (latestStart != null && latestStart > end)) return { start, end: null };
  return { start, end };
};

/**
 * Which exit, if any, to offer a participant for this enrollment right now.
 *
 * Returns `null` when nothing should be offered - the participation is already
 * over, already ended, or was paid for.
 *
 * Timezones do not enter into it: `startDateTime` and `endDateTime` are
 * `timestamptz` and arrive with their offset, so these comparisons are between
 * absolute instants. The `Europe/Berlin` timezone on NextIntlClientProvider
 * governs how those instants are *displayed*, nothing more. (Contrast
 * `isRegistrationClosed`, which compares calendar days and therefore does need a
 * timezone.)
 */
export const getParticipationExitKind = ({
  status,
  sessions,
  hasPaidInvoice = false,
  now = new Date(),
}: ParticipationExitArgs): ParticipationExitKind | null => {
  if (hasPaidInvoice) return null;
  if (!status || !PARTICIPATION_EXIT_ELIGIBLE_STATUSES.includes(status)) return null;

  const window = getCourseWindow(sessions ?? []);
  // A course whose dates we cannot read has not been shown to have started, so
  // the registration is still a registration.
  if (!window) return 'CANCEL';

  const nowTime = now.getTime();
  if (nowTime < window.start) return 'CANCEL';
  // Between two sessions still counts as running: a weekly course is under way
  // on the days in between, and that is exactly when someone drops out. An
  // open-ended window (no known end) keeps the exit available rather than
  // withdrawing it at a moment we cannot actually place.
  if (window.end == null || nowTime <= window.end) return 'ABORT';
  return null;
};
