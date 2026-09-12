/**
 * Start and end time for a newly inserted session.
 *
 * Extracted from `SessionsTab` so the event fallbacks are testable: an event
 * hides the weekly weekday/time controls without clearing their stored values,
 * so those values cannot be trusted to be present or consistent.
 */

type CourseTimes = {
  startTime?: string | null;
  endTime?: string | null;
};

type PreviousSession = {
  startDateTime: Date | string;
  endDateTime: Date | string;
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const applyTimeOfDay = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
};

export const nextSessionTimes = (
  course: CourseTimes,
  previousSession: PreviousSession | undefined,
  isEventCourse: boolean,
  now: Date = new Date()
): { startTime: Date; endTime: Date } => {
  // A course repeats weekly, so the obvious next slot is a week after the last.
  if (previousSession) {
    const startTime = new Date(previousSession.startDateTime);
    const endTime = new Date(previousSession.endDateTime);
    startTime.setDate(startTime.getDate() + 7);
    endTime.setDate(endTime.getDate() + 7);
    return { startTime, endTime };
  }

  const startTime = new Date(now);
  const endTime = new Date(now);

  if (!isEventCourse && course.startTime) {
    applyTimeOfDay(startTime, course.startTime);
  } else if (isEventCourse) {
    // An event has no weekly start time to inherit and 00:00-00:00 is a useless
    // default, so start at the next full hour instead.
    startTime.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    startTime.setHours(0, 0, 0, 0);
  }

  if (!isEventCourse && course.endTime) {
    applyTimeOfDay(endTime, course.endTime);
  } else {
    endTime.setHours(0, 0, 0, 0);
  }

  // A stored endTime can predate the generated start, which would send an
  // end-before-start pair to the mutation.
  if (isEventCourse && endTime <= startTime) {
    endTime.setTime(startTime.getTime() + TWO_HOURS_MS);
  }

  return { startTime, endTime };
};
