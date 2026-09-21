import { CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
import { getParticipationExitKind } from '../participationExit';

/** A two-session course running 10-12 March, each session 10:00-12:00 UTC. */
const sessions = [
  { startDateTime: '2026-03-10T10:00:00+00:00', endDateTime: '2026-03-10T12:00:00+00:00' },
  { startDateTime: '2026-03-12T10:00:00+00:00', endDateTime: '2026-03-12T12:00:00+00:00' },
];

const at = (iso: string) => new Date(iso);

describe('getParticipationExitKind', () => {
  it('offers cancelling before the first session', () => {
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions,
        now: at('2026-03-09T23:00:00Z'),
      })
    ).toBe('CANCEL');
  });

  it('offers aborting once the first session has started', () => {
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions,
        now: at('2026-03-10T10:30:00Z'),
      })
    ).toBe('ABORT');
  });

  it('still offers aborting in the gap between two sessions', () => {
    // The whole point of taking the window from first start to last end: a
    // weekly course is under way on the days in between, which is exactly when
    // someone drops out of it.
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions,
        now: at('2026-03-11T08:00:00Z'),
      })
    ).toBe('ABORT');
  });

  it('offers nothing once the last session has ended', () => {
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions,
        now: at('2026-03-12T12:01:00Z'),
      })
    ).toBeNull();
  });

  it('treats a course without session dates as not yet started', () => {
    for (const empty of [[], null, [{ startDateTime: null, endDateTime: null }]]) {
      expect(
        getParticipationExitKind({
          status: CourseEnrollmentStatus_enum.CONFIRMED,
          sessions: empty,
          now: at('2026-03-11T08:00:00Z'),
        })
      ).toBe('CANCEL');
    }
  });

  it('keeps the window open when no session carries an end time', () => {
    // A half-planned agenda must not read as "already over" and strand a
    // participant with no way out. An unknown end is unknown, not immediate:
    // the session may well still be running a minute after it started.
    const halfPlanned = [
      { startDateTime: '2026-03-10T10:00:00+00:00', endDateTime: null },
      { startDateTime: '2026-03-12T10:00:00+00:00', endDateTime: null },
    ];
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: halfPlanned, now: at('2026-03-09T08:00:00Z') })
    ).toBe('CANCEL');
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: halfPlanned, now: at('2026-03-11T08:00:00Z') })
    ).toBe('ABORT');
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: halfPlanned, now: at('2026-03-12T10:01:00Z') })
    ).toBe('ABORT');
  });

  it('keeps the window open when only the last session lacks an end time', () => {
    const trailingOpen = [
      { startDateTime: '2026-03-10T10:00:00+00:00', endDateTime: '2026-03-10T12:00:00+00:00' },
      { startDateTime: '2026-03-12T10:00:00+00:00', endDateTime: null },
    ];
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: trailingOpen, now: at('2026-03-12T10:01:00Z') })
    ).toBe('ABORT');
  });

  it('closes on the last end time when only an earlier session lacks one', () => {
    const leadingOpen = [
      { startDateTime: '2026-03-10T10:00:00+00:00', endDateTime: null },
      { startDateTime: '2026-03-12T10:00:00+00:00', endDateTime: '2026-03-12T12:00:00+00:00' },
    ];
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: leadingOpen, now: at('2026-03-12T11:00:00Z') })
    ).toBe('ABORT');
    expect(
      getParticipationExitKind({ status: CourseEnrollmentStatus_enum.CONFIRMED, sessions: leadingOpen, now: at('2026-03-12T12:01:00Z') })
    ).toBeNull();
  });

  it('ignores unparsable timestamps rather than reading them as an instant', () => {
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions: [{ startDateTime: 'not a date', endDateTime: 'not a date' }],
        now: at('2026-03-11T08:00:00Z'),
      })
    ).toBe('CANCEL');
  });

  it.each([
    CourseEnrollmentStatus_enum.APPLIED,
    CourseEnrollmentStatus_enum.WAITLIST,
    CourseEnrollmentStatus_enum.INVITED,
    CourseEnrollmentStatus_enum.CONFIRMED,
    CourseEnrollmentStatus_enum.REGISTERED,
  ])('offers an exit while %s', (status) => {
    expect(getParticipationExitKind({ status, sessions, now: at('2026-03-09T23:00:00Z') })).toBe('CANCEL');
  });

  it.each([
    CourseEnrollmentStatus_enum.CANCELLED,
    CourseEnrollmentStatus_enum.ABORTED,
    CourseEnrollmentStatus_enum.REJECTED,
    CourseEnrollmentStatus_enum.COMPLETED,
  ])('offers nothing from the terminal status %s', (status) => {
    expect(getParticipationExitKind({ status, sessions, now: at('2026-03-09T23:00:00Z') })).toBeNull();
  });

  it('offers nothing without an enrollment status', () => {
    expect(getParticipationExitKind({ status: null, sessions, now: at('2026-03-09T23:00:00Z') })).toBeNull();
  });

  it('offers nothing once the course has been paid for', () => {
    // Refunds are out of scope, so a paid place is settled with the organizer.
    expect(
      getParticipationExitKind({
        status: CourseEnrollmentStatus_enum.CONFIRMED,
        sessions,
        hasPaidInvoice: true,
        now: at('2026-03-09T23:00:00Z'),
      })
    ).toBeNull();
  });
});
